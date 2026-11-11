import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  verifyFonepayNotification,
  type FonepayNotificationPayload,
} from '@/lib/payments/fonepaySecurity';
import { BillingService } from '@/lib/billing/invoiceEngine';
import { enforceRateLimit } from '@/lib/security/rateLimiter';

export const dynamic = 'force-dynamic';

/**
 * POST /api/payments/fonepay/notification
 * Fonepay Server-to-Server Inbound Payment Notification (IPN Webhook)
 * 
 * Verifies:
 * 1. HMAC-SHA512 signature using Fonepay's exact 9-tuple prescribed procedure.
 * 2. Merchant Code (PID) against configured environment.
 * 3. Product Reference Number (PRN) against active order.
 * 4. Exact transaction amount and currency (NPR) to prevent underpayment fraud.
 * 5. Replay and duplicate attack defense (traceId uniqueness check).
 * 6. Authoritative provider status (PS = success, RC = successful/00).
 */
export async function POST(request: NextRequest) {
  try {
    const rl = await enforceRateLimit(request, 'payment', 'notification');
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many notification requests. Please wait a moment.' },
        { status: 429, headers: { 'Retry-After': String(rl.resetSeconds) } }
      );
    }

    const admin = createAdminClient();
    if (!admin) {
      return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
    }

    const merchantCode = process.env.FONEPAY_MERCHANT_CODE;
    const secretKey = process.env.FONEPAY_SECRET_KEY;

    if (!merchantCode || !secretKey) {
      return NextResponse.json({ error: 'Fonepay credentials not configured' }, { status: 503 });
    }

    // 1. Extract payload from JSON or x-www-form-urlencoded
    let rawPayload: Record<string, any> = {};
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      rawPayload = await request.json().catch(() => ({}));
    } else if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      const formData = await request.formData().catch(() => null);
      if (formData) {
        formData.forEach((value, key) => {
          rawPayload[key] = value.toString();
        });
      }
    } else {
      const text = await request.text().catch(() => '');
      try {
        rawPayload = JSON.parse(text);
      } catch {
        const params = new URLSearchParams(text);
        params.forEach((value, key) => {
          rawPayload[key] = value;
        });
      }
    }

    // Normalize keys (Fonepay specification uses uppercase, some gateways use camelCase)
    const payload: FonepayNotificationPayload = {
      PRN: String(rawPayload.PRN || rawPayload.prn || rawPayload.purchase_order_id || '').trim(),
      PID: String(rawPayload.PID || rawPayload.pid || rawPayload.merchantCode || '').trim(),
      PS: String(rawPayload.PS || rawPayload.ps || rawPayload.paymentStatus || rawPayload.status || '').trim(),
      RC: String(rawPayload.RC || rawPayload.rc || rawPayload.responseCode || '').trim(),
      UID: String(rawPayload.UID || rawPayload.uid || rawPayload.fonepayTraceId || rawPayload.traceId || '').trim(),
      BC: String(rawPayload.BC || rawPayload.bc || rawPayload.bankCode || '').trim(),
      INI: String(rawPayload.INI || rawPayload.ini || rawPayload.initiatedDate || rawPayload.timestamp || '').trim(),
      P_AMT: rawPayload.P_AMT ?? rawPayload.p_amt ?? rawPayload.amount ?? rawPayload.totalAmount ?? '',
      R_AMT: rawPayload.R_AMT ?? rawPayload.r_amt ?? rawPayload.requestedAmount ?? rawPayload.amount ?? '',
      CRN: String(rawPayload.CRN || rawPayload.crn || rawPayload.currency || 'NPR').trim(),
      DV: String(rawPayload.DV || rawPayload.dv || rawPayload.dataValidation || rawPayload.signature || '').trim(),
    };

    if (!payload.PRN || !payload.PID || !payload.UID || !payload.DV) {
      return NextResponse.json(
        { error: 'Bad Request: Missing mandatory notification fields (PRN, PID, UID, DV)' },
        { status: 400 }
      );
    }

    // 2. Lookup Transaction in Database
    const { data: tx } = await admin
      .from('payment_transactions')
      .select('*')
      .eq('purchase_order_id', payload.PRN)
      .eq('gateway', 'fonepay')
      .maybeSingle();

    if (!tx) {
      // Check prebookings table as secondary lookup
      const { data: booking } = await admin
        .from('prebookings')
        .select('*')
        .eq('payment_ref', payload.PRN)
        .maybeSingle();

      if (!booking) {
        return NextResponse.json(
          { error: `Unknown transaction reference PRN: ${payload.PRN}` },
          { status: 404 }
        );
      }

      // Check for replay attacks against prebookings
      const { count: dupTraceCount } = await admin
        .from('payment_transactions')
        .select('id', { count: 'exact', head: true })
        .eq('gateway_ref', payload.UID);

      const verification = verifyFonepayNotification(payload, {
        expectedPrn: booking.payment_ref,
        expectedAmountPaisa: 30000, // Prebooking fee is fixed at NPR 300 (30,000 paisa)
        expectedCurrency: 'NPR',
        merchantCode,
        secretKey,
        currentTransactionStatus: booking.status === 'confirmed' ? 'completed' : 'pending',
        existingTransactionsWithSameTraceId: dupTraceCount || 0,
      });

      if (!verification.valid) {
        return NextResponse.json(
          { error: verification.error, reason: verification.reason },
          { status: verification.statusCode }
        );
      }

      if (verification.reason === 'duplicate_notification') {
        return NextResponse.json({
          status: 'success',
          idempotent: true,
          message: 'Prebooking payment was already finalized.',
        });
      }

      // Settle prebooking
      await admin
        .from('prebookings')
        .update({
          status: 'confirmed',
          payment_method: 'fonepay',
          updated_at: new Date().toISOString(),
        })
        .eq('id', booking.id);

      return NextResponse.json({
        success: true,
        status: 'completed',
        prn: payload.PRN,
        traceId: payload.UID,
        message: 'Prebooking payment notification verified and confirmed.',
      });
    }

    // 3. Check for Cross-Transaction Replay Attacks
    const { count: existingTraceCount } = await admin
      .from('payment_transactions')
      .select('id', { count: 'exact', head: true })
      .eq('gateway_ref', payload.UID)
      .neq('id', tx.id);

    // 4. Verify Notification Authenticity
    const verification = verifyFonepayNotification(payload, {
      expectedPrn: tx.purchase_order_id,
      expectedAmountPaisa: tx.amount_paisa,
      expectedCurrency: tx.currency || 'NPR',
      merchantCode,
      secretKey,
      currentTransactionStatus: tx.status,
      existingTransactionsWithSameTraceId: existingTraceCount || 0,
    });

    if (!verification.valid) {
      return NextResponse.json(
        { error: verification.error, reason: verification.reason, details: verification.details },
        { status: verification.statusCode }
      );
    }

    // Handle Idempotent Duplicate Notification
    if (verification.reason === 'duplicate_notification') {
      return NextResponse.json({
        status: 'success',
        idempotent: true,
        prn: payload.PRN,
        traceId: payload.UID,
        message: 'Transaction already settled.',
      });
    }

    // 5. Atomic State Transition to Completed
    const paidAtIso = new Date().toISOString();
    const { data: updatedTx } = await admin
      .from('payment_transactions')
      .update({
        status: 'completed',
        gateway_ref: payload.UID,
        gateway_response: payload,
        updated_at: paidAtIso,
      })
      .eq('id', tx.id)
      .eq('status', 'pending')
      .select('id')
      .maybeSingle();

    if (!updatedTx) {
      return NextResponse.json({
        status: 'success',
        idempotent: true,
        message: 'Concurrent notification handled idempotently.',
      });
    }

    // 6. Activate Subscription & Entitlements
    const resolvedTier = tx.plan === 'pro' ? 'cee_ai_pro' : 'cee_premium';

    const { data: userProfile } = await admin
      .from('user_profiles')
      .select('subscription_expires_at, full_name, email, phone')
      .eq('id', tx.user_id)
      .maybeSingle();

    const currentExpiresAtMs = userProfile?.subscription_expires_at
      ? new Date(userProfile.subscription_expires_at).getTime()
      : 0;

    const baseTime = Math.max(Date.now(), currentExpiresAtMs);
    const newExpiresAt = new Date(baseTime + tx.duration_days * 86400000).toISOString();

    await admin
      .from('user_profiles')
      .update({
        subscription_plan: tx.plan,
        plan_tier: resolvedTier,
        subscription_expires_at: newExpiresAt,
        updated_at: paidAtIso,
      })
      .eq('id', tx.user_id);

    // 7. Issue Cryptographically Signed Tax Invoice & Receipt
    const invoice = await BillingService.issueOrUpdateInvoice(admin, {
      userId: tx.user_id,
      sourceType: 'payment_transaction',
      sourceId: String(tx.id),
      purchaseOrderId: tx.purchase_order_id,
      customerName: userProfile?.full_name,
      customerEmail: userProfile?.email,
      customerPhone: userProfile?.phone,
      planOrSku: tx.plan || 'pro',
      durationDays: Number(tx.duration_days || 30),
      grossAmountPaisa: Number(tx.amount_paisa || 0),
      netAmountPaisa: Number(tx.amount_paisa || 0),
      currency: tx.currency || 'NPR',
      gateway: 'fonepay',
      gatewayRef: payload.UID,
      status: 'paid',
      issuedAt: tx.created_at || paidAtIso,
      paidAt: paidAtIso,
    });

    return NextResponse.json({
      success: true,
      status: 'completed',
      prn: payload.PRN,
      traceId: payload.UID,
      invoiceNumber: invoice.invoiceNumber,
      receiptNumber: invoice.receiptNumber,
      verificationCode: invoice.verificationCode,
      message: 'Payment notification verified, order settled, and entitlement activated.',
    });
  } catch (err: any) {
    console.error('payments/fonepay/notification error:', err);
    return NextResponse.json({ error: err.message || 'Notification processing failed' }, { status: 500 });
  }
}
