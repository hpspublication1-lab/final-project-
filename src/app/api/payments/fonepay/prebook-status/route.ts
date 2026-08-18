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

    await admin
      .from('prebookings')
      .update({ status: 'confirmed', payment_method: 'fonepay', updated_at: new Date().toISOString() })
      .eq('id', booking.id);

    // Grant the signed-in prebooker full Pro access while they wait for classes.
    const server = await createClient();
    const { data: { user } } = await server.auth.getUser();
    if (user) {
      await admin
        .from('user_profiles')
        .update({
          subscription_plan: 'pro',
          subscription_expires_at: new Date(Date.now() + PREBOOK_PRO_DAYS * 86400000).toISOString(),
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
