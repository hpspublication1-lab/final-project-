import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkFonepayStatus } from '@/lib/payments/gateways';

// Prebookers get full Pro access while they wait for the crash course to begin.
const PREBOOK_PRO_DAYS = 90;

/**
 * POST /api/payments/fonepay/prebook-status   { reference, phone }
 *
 * The prebook page polls this while the QR is shown. We look up the booking by
 * reference + phone, read the prn we stored when the QR was issued, and ask
 * Fonepay (source of truth) whether it was paid. On success we mark the booking
 * 'confirmed'. Idempotent. Fonepay reports 'pending' as 'failed' until paid, so
 * checkFonepayStatus only ever returns 'pending' or 'success' (see gateways.ts).
 *
 * Response: { status: 'pending' | 'completed' }
 */
export async function POST(request: NextRequest) {
  try {
    const { reference, phone } = await request.json();
    if (!reference || !phone) {
      return NextResponse.json({ error: 'Missing booking reference or phone.' }, { status: 400 });
    }
    const config = {
      merchantCode: process.env.FONEPAY_MERCHANT_CODE!,
      username: process.env.FONEPAY_USERNAME!,
      password: process.env.FONEPAY_PASSWORD!,
      secretKey: process.env.FONEPAY_SECRET_KEY!,
      env: process.env.FONEPAY_ENV || 'development',
    };

    const admin = createAdminClient();
    if (!admin) {
      return NextResponse.json({ error: 'Payments not configured.' }, { status: 503 });
    }

    const ref = String(reference).trim().toUpperCase();
    const normPhone = String(phone).replace(/\D/g, '');

    const { data: booking } = await admin
      .from('prebookings')
      .select('id, status, payment_ref')
      .eq('reference', ref)
      .eq('phone', normPhone)
      .maybeSingle();

    if (!booking) {
      return NextResponse.json({ error: 'Unknown booking.' }, { status: 404 });
    }
    if (booking.status === 'confirmed') {
      return NextResponse.json({ status: 'completed' });
    }
    if (!booking.payment_ref) {
      // No QR issued yet.
      return NextResponse.json({ status: 'pending' });
    }

    const result = await checkFonepayStatus(booking.payment_ref, config);
    if (result.status !== 'success') {
      return NextResponse.json({ status: 'pending' });
    }

    // Amount & Currency Validation (Prebooking fee is strictly 300 NPR)
    if (result.raw?.amount || result.raw?.totalAmount) {
      const reportedAmt = result.raw?.amount ?? result.raw?.totalAmount;
      const { validateTransactionAmount } = await import('@/lib/payments/fonepaySecurity');
      const amtCheck = validateTransactionAmount(
        30000, // 300 NPR in paisa
        reportedAmt,
        'NPR',
        result.raw?.currency || 'NPR'
      );
      if (!amtCheck.valid) {
        console.error(`[Fonepay Security] Prebook amount mismatch for ${booking.payment_ref}:`, amtCheck.error);
        return NextResponse.json({ error: amtCheck.error }, { status: 400 });
      }
    }

    // Replay Protection: ensure traceId has not been used by any other transaction
    if (result.traceId) {
      const { count } = await admin
        .from('payment_transactions')
        .select('id', { count: 'exact', head: true })
        .eq('gateway_ref', result.traceId);

      if (count && count > 0) {
        console.error(`[Fonepay Security] Prebook replay attack: traceId ${result.traceId} already used.`);
        return NextResponse.json(
          { error: 'Replay attack detected: Fonepay traceId already settled.' },
          { status: 409 }
        );
      }
    }

    const { data: updatedBooking } = await admin
      .from('prebookings')
      .update({
        status: 'confirmed',
        payment_method: 'fonepay',
        updated_at: new Date().toISOString(),
      })
      .eq('id', booking.id)
      .eq('status', 'pending')
      .select('id')
      .maybeSingle();

    if (!updatedBooking) {
      return NextResponse.json({ status: 'completed' });
    }

    // Grant the signed-in prebooker full Pro access while they wait for classes.
    const server = await createClient();
    const { data: { user } } = await server.auth.getUser();
    if (user) {
      const { data: userProfile } = await admin
        .from('user_profiles')
        .select('subscription_expires_at')
        .eq('id', user.id)
        .maybeSingle();

      const currentExpiresAtMs = userProfile?.subscription_expires_at
        ? new Date(userProfile.subscription_expires_at).getTime()
        : 0;

      const baseTime = Math.max(Date.now(), currentExpiresAtMs);
      const newExpiresAt = new Date(baseTime + PREBOOK_PRO_DAYS * 86400000).toISOString();

      await admin
        .from('user_profiles')
        .update({
          subscription_plan: 'pro',
          plan_tier: 'cee_ai_pro',
          subscription_expires_at: newExpiresAt,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
    }

    return NextResponse.json({ status: 'completed' });
  } catch (err) {
    console.error('payments/fonepay/prebook-status error:', err);
    return NextResponse.json({ error: 'Status check failed.' }, { status: 500 });
  }
}
