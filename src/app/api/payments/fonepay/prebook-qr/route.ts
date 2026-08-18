export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import QRCode from 'qrcode';
import { createAdminClient } from '@/lib/supabase/admin';
import { fonepayConfigured, generateFonepayQr } from '@/lib/payments/gateways';

/**
 * POST /api/payments/fonepay/prebook-qr   { reference, phone }
 *
 * Generates a Fonepay dynamic QR for the Rs 300 crash-course prebooking deposit.
 * Prebook visitors are anonymous, so instead of an auth check the caller must
 * present the booking `reference` + `phone` that create_prebooking issued.
 * The generated `prn` is stored on the booking so the status poll can verify it.
 * Writes go through the service-role client (prebookings has no public policies).
 */
const PREBOOK_AMOUNT_NPR = 300;

export async function POST(request: NextRequest) {
  try {
    const { reference, phone } = await request.json();
    if (!reference || !phone) {
      return NextResponse.json({ error: 'Missing booking reference or phone.' }, { status: 400 });
    }

    console.log("Runtime Env Check:", {
      VERCEL_ENV: process.env.VERCEL_ENV,
      NODE_ENV: process.env.NODE_ENV,
      FONEPAY_ENV: process.env.FONEPAY_ENV,
      FONEPAY_MERCHANT_CODE: process.env.FONEPAY_MERCHANT_CODE ? "EXISTS" : "MISSING",
      FONEPAY_USERNAME: process.env.FONEPAY_USERNAME ? "EXISTS" : "MISSING",
      FONEPAY_PASSWORD: process.env.FONEPAY_PASSWORD ? "EXISTS" : "MISSING",
      FONEPAY_SECRET_KEY: process.env.FONEPAY_SECRET_KEY ? "EXISTS" : "MISSING",
    });

    function fonepayConfigured(): boolean {
      return !!(
        process.env.FONEPAY_MERCHANT_CODE &&
        process.env.FONEPAY_USERNAME &&
        process.env.FONEPAY_PASSWORD &&
        process.env.FONEPAY_SECRET_KEY
      );
    }

    if (!fonepayConfigured()) {
      return NextResponse.json({ error: 'Fonepay is not configured yet.' }, { status: 503 });
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
      .select('id, status')
      .eq('reference', ref)
      .eq('phone', normPhone)
      .maybeSingle();

    if (!booking) {
      return NextResponse.json({ error: 'We could not match that booking. Please restart.' }, { status: 404 });
    }
    if (booking.status === 'confirmed') {
      return NextResponse.json({ error: 'This booking is already paid.', alreadyPaid: true }, { status: 409 });
    }

    // prn doubles as the purchase order id. Keep it short (Fonepay max 25).
    const prn = `PRE${Date.now().toString(36).toUpperCase()}${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

    let qr: any;
    try {
      console.log('Calling generateFonepayQr with prn:', prn);
      qr = await generateFonepayQr({
        amountNpr: PREBOOK_AMOUNT_NPR,
        prn,
        remarks1: 'SamyakCEE',
        remarks2: 'Prebook',
        config,
      });
      console.log('generateFonepayQr returned:', JSON.stringify(qr));
    } catch (err: any) {
      console.error('generateFonepayQr Exception:', err);
      return NextResponse.json({ error: 'Gateway exception: ' + (err?.message || 'unknown') }, { status: 502 });
    }

    if (!qr || !qr.ok) {
      return NextResponse.json({ error: qr?.error || 'Fonepay gateway did not return QR.' }, { status: 502 });
    }

    // Remember the prn so /prebook-status can verify this exact QR.
    await admin
      .from('prebookings')
      .update({ payment_ref: prn, payment_method: 'fonepay', updated_at: new Date().toISOString() })
      .eq('id', booking.id);

    let qrDataUrl = '';
    try {
      qrDataUrl = await QRCode.toDataURL(qr.qrMessage, { margin: 1, width: 320 });
    } catch {
      qrDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(qr.qrMessage)}`;
    }

    return NextResponse.json({
      prn,
      amount: PREBOOK_AMOUNT_NPR,
      label: '45-Day CEE Crash Course · Seat Prebooking',
      qrDataUrl,
      qrMessage: qr.qrMessage,
    });
  } catch (err: any) {
    console.error('payments/fonepay/prebook-qr error:', err);
    return NextResponse.json({ error: err?.message || 'Could not generate the QR. Please try again.' }, { status: 500 });
  }
}
