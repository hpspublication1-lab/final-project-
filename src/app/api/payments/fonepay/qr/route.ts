export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import QRCode from 'qrcode';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { PLAN_PRICES, fonepayConfigured, generateFonepayQr } from '@/lib/payments/gateways';

/**
 * POST /api/payments/fonepay/qr   { plan: 'pro' }
 *
 * Creates a payment_transactions row (service role — the table has no client
 * write policies by design) and asks Fonepay for a dynamic QR. Returns the QR as
 * a data-URL image the client can render. Amount always comes from the
 * server-side PLAN_PRICES table — never trust a client amount.
 *
 * Response: { prn, amount, qrDataUrl, qrMessage }
 * The client then polls /api/payments/fonepay/status to detect payment.
 */
export async function POST(request: NextRequest) {
  try {
    const { plan } = await request.json();

    const price = PLAN_PRICES[plan];
    if (!price) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    // Force recompilation with env variables check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Sign in to continue' }, { status: 401 });

    function fonepayConfigured(): boolean {
      return !!(
        process.env.FONEPAY_MERCHANT_CODE &&
        process.env.FONEPAY_USERNAME &&
        process.env.FONEPAY_PASSWORD &&
        process.env.FONEPAY_SECRET_KEY
      );
    }

    if (!fonepayConfigured()) {
      return NextResponse.json({ error: 'Fonepay is not configured yet' }, { status: 503 });
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
      return NextResponse.json(
        { error: 'Payments not configured', details: 'SUPABASE_SERVICE_ROLE_KEY is missing on the server.' },
        { status: 503 }
      );
    }

    // prn doubles as our purchase_order_id. Keep it short (Fonepay prn max 25).
    const prn = `SCM${Date.now().toString(36).toUpperCase()}${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

    // Log the transaction as 'initiated' BEFORE calling Fonepay.
    const { error: insertError } = await admin.from('payment_transactions').insert({
      user_id: user.id,
      gateway: 'fonepay',
      purchase_order_id: prn,
      amount_paisa: price.npr * 100,
      plan: price.plan,
      duration_days: price.days,
      status: 'initiated',
    });
    if (insertError) {
      console.error('fonepay payment insert failed:', insertError.message);
      return NextResponse.json({ error: 'Could not start payment. Try again.' }, { status: 500 });
    }

    // remarks are alphanumeric, max 25 chars each (Fonepay validates length + charset).
    const qr = await generateFonepayQr({
      amountNpr: price.npr,
      prn,
      remarks1: 'SamyakCEE',
      remarks2: price.plan, // alphanumeric enum value, within Fonepay's 25-char limit
      config,
    });

    if (!qr.ok) {
      await admin.from('payment_transactions')
        .update({ status: 'failed', gateway_response: qr.raw })
        .eq('purchase_order_id', prn);
      return NextResponse.json({ error: qr.error || 'Fonepay gateway failed.' }, { status: 502 });
    }

    await admin.from('payment_transactions')
      .update({ status: 'pending', gateway_response: qr.raw })
      .eq('purchase_order_id', prn);

    let qrDataUrl = '';
    try {
      qrDataUrl = await QRCode.toDataURL(qr.qrMessage, { margin: 1, width: 320 });
    } catch {
      qrDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(qr.qrMessage)}`;
    }

    return NextResponse.json({
      prn,
      amount: price.npr,
      label: price.label,
      qrDataUrl,
      qrMessage: qr.qrMessage,
    });
  } catch (err: any) {
    console.error('payments/fonepay/qr error:', err);
    return NextResponse.json({ error: err?.message || 'Could not generate the QR. Please try again.' }, { status: 500 });
  }
}
