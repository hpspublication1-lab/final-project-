import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkFonepayStatus } from '@/lib/payments/gateways';
import { BillingService } from '@/lib/billing/invoiceEngine';

/**
 * POST /api/payments/fonepay/status   { prn }
 *
 * The client polls this while the QR is displayed. We NEVER trust the client —
 * we ask Fonepay (thirdPartyDynamicQrGetStatus) whether the payment landed,
 * then mark the transaction completed and activate the plan, all with the
 * service-role client. Idempotent: polling after completion is a no-op.
 *
 * Response: { status: 'pending' | 'completed' | 'failed', invoiceNumber?: string, receiptNumber?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { prn } = await request.json();
    if (!prn || typeof prn !== 'string') {
      return NextResponse.json({ error: 'Missing prn' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Sign in to continue' }, { status: 401 });

    const config = {
      merchantCode: process.env.FONEPAY_MERCHANT_CODE!,
      username: process.env.FONEPAY_USERNAME!,
      password: process.env.FONEPAY_PASSWORD!,
      secretKey: process.env.FONEPAY_SECRET_KEY!,
      env: process.env.FONEPAY_ENV || 'development',
    };

    const admin = createAdminClient();
    if (!admin) return NextResponse.json({ error: 'Payments not configured' }, { status: 503 });

    const { data: tx } = await admin
      .from('payment_transactions')
      .select('*')
      .eq('purchase_order_id', prn)
      .eq('gateway', 'fonepay')
      .single();

    // Only the owner may poll their own transaction.
    if (!tx || tx.user_id !== user.id) {
      return NextResponse.json({ error: 'Unknown order' }, { status: 404 });
    }

    // Idempotency: already settled → report the stored state, skip Fonepay.
    if (tx.status === 'completed') return NextResponse.json({ status: 'completed' });
    if (tx.status === 'failed') return NextResponse.json({ status: 'failed' });

    // ── Ask Fonepay (source of truth) ─────────────────────────────────────
    const result = await checkFonepayStatus(prn, config);

    if (result.status === 'pending') {
      return NextResponse.json({ status: 'pending' });
    }

    // ── Security Validations on Fonepay Response ──────────────────────────
    // 1. Amount & Currency Validation (prevent underpayment fraud)
    if (result.raw?.amount || result.raw?.totalAmount) {
      const reportedAmt = result.raw?.amount ?? result.raw?.totalAmount;
      const { validateTransactionAmount } = await import('@/lib/payments/fonepaySecurity');
      const amtCheck = validateTransactionAmount(
        tx.amount_paisa,
        reportedAmt,
        tx.currency || 'NPR',
        result.raw?.currency || 'NPR'
      );
      if (!amtCheck.valid) {
        console.error(`[Fonepay Security] Amount mismatch on status check for PRN ${prn}:`, amtCheck.error);
        return NextResponse.json({ error: amtCheck.error }, { status: 400 });
      }
    }

    // 2. Merchant Identity Check
    if (result.raw?.merchantCode && result.raw.merchantCode !== config.merchantCode) {
      console.error(`[Fonepay Security] Merchant code mismatch: received ${result.raw.merchantCode}, expected ${config.merchantCode}`);
      return NextResponse.json({ error: 'Merchant identity mismatch in provider status response' }, { status: 403 });
    }

    // 3. Replay Protection: ensure traceId has not been used by any other transaction
    if (result.traceId) {
      const { count } = await admin
        .from('payment_transactions')
        .select('id', { count: 'exact', head: true })
        .eq('gateway_ref', result.traceId)
        .neq('id', tx.id);

      if (count && count > 0) {
        console.error(`[Fonepay Security] Replay attack: traceId ${result.traceId} already bound to another transaction.`);
        return NextResponse.json(
          { error: 'Replay attack detected: Fonepay traceId already settled for another transaction.' },
          { status: 409 }
        );
      }
    }

    // ── success → mark paid + activate the plan ───────────────────────────
    const paidAtIso = new Date().toISOString();
    const { data: updatedTx } = await admin.from('payment_transactions')
      .update({ status: 'completed', gateway_ref: result.traceId, gateway_response: result.raw })
      .eq('id', tx.id)
      .eq('status', 'pending')
      .select('id')
      .maybeSingle();

    if (!updatedTx) {
      return NextResponse.json({ status: 'completed' });
    }

    const resolvedTier = tx.plan === 'pro' ? 'cee_ai_pro' : 'cee_premium';

    // Extend from existing expiration if student still has active subscription days remaining
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

    await admin.from('user_profiles')
      .update({
        subscription_plan: tx.plan,
        plan_tier: resolvedTier,
        subscription_expires_at: newExpiresAt,
        updated_at: paidAtIso,
      })
      .eq('id', tx.user_id);

    // Issue cryptographically signed invoice & receipt
    const invoice = await BillingService.issueOrUpdateInvoice(admin, {
      userId: tx.user_id,
      sourceType: 'payment_transaction',
      sourceId: String(tx.id),
      purchaseOrderId: tx.purchase_order_id || prn,
      customerName: userProfile?.full_name,
      customerEmail: userProfile?.email || user.email,
      customerPhone: userProfile?.phone,
      planOrSku: tx.plan || 'pro',
      durationDays: Number(tx.duration_days || 30),
      grossAmountPaisa: Number(tx.amount_paisa || 0),
      netAmountPaisa: Number(tx.amount_paisa || 0),
      currency: tx.currency || 'NPR',
      gateway: 'fonepay',
      gatewayRef: result.traceId || null,
      status: 'paid',
      issuedAt: tx.created_at || paidAtIso,
      paidAt: paidAtIso,
    });

    return NextResponse.json({
      status: 'completed',
      invoiceNumber: invoice.invoiceNumber,
      receiptNumber: invoice.receiptNumber,
      verificationCode: invoice.verificationCode,
    });
  } catch (err) {
    console.error('payments/fonepay/status error:', err);
    return NextResponse.json({ error: 'Status check failed' }, { status: 500 });
  }
}
