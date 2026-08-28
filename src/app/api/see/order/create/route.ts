export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import QRCode from 'qrcode';
import { createAdminClient } from '@/lib/supabase/admin';
import { getSessionUser } from '@/lib/supabase/route-auth';
import { generateFonepayQr } from '@/lib/payments/gateways';

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Please sign in to enroll' }, { status: 401 });
    }

    const { courseId = 'see_class_10', couponCode } = await request.json();
    const admin = createAdminClient();

    // 1. Fetch admin-configured pricing for the course
    const { data: pricingRow } = await admin
      .from('course_pricing')
      .select('*')
      .eq('course_id', courseId)
      .maybeSingle();

    const originalPrice = pricingRow?.original_price_npr || 4990;
    let finalAmount = pricingRow?.discount_price_npr || 2990;
    let discount = originalPrice - finalAmount;

    // Apply coupon if matches
    if (
      couponCode &&
      pricingRow?.coupon_code &&
      couponCode.trim().toUpperCase() === pricingRow.coupon_code.toUpperCase()
    ) {
      const couponDisc = pricingRow.coupon_discount_npr || 500;
      finalAmount = Math.max(99, finalAmount - couponDisc);
      discount += couponDisc;
    }

    // 2. Generate unique order ID
    const orderNumber = `SEE-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

    // 3. Create course_orders record (initiated)
    const { error: orderError } = await admin.from('course_orders').insert({
      order_number: orderNumber,
      user_id: user.id,
      course_id: courseId,
      amount_npr: originalPrice,
      discount_npr: discount,
      final_amount_npr: finalAmount,
      currency: 'NPR',
      gateway: 'fonepay',
      status: 'initiated',
    });

    if (orderError) {
      console.error('Course order insert failed:', orderError.message);
      return NextResponse.json({ error: 'Failed to create order. Please try again.' }, { status: 500 });
    }

    // 4. Generate dynamic Fonepay QR using existing payment architecture
    const fonepayConfig = {
      merchantCode: process.env.FONEPAY_MERCHANT_CODE || '2222040020144055',
      username: process.env.FONEPAY_USERNAME || '00501017502791',
      password: process.env.FONEPAY_PASSWORD || 'APPLE12345.6ss$',
      secretKey: process.env.FONEPAY_SECRET_KEY || '51626c3021a54430817ca95d24c2ac01',
      env: process.env.FONEPAY_ENV || 'production',
    };

    const qrResult = await generateFonepayQr({
      amountNpr: finalAmount,
      prn: orderNumber,
      remarks1: 'SamyakGuru',
      remarks2: 'SEEClass10',
      config: fonepayConfig,
    });

    let qrDataUrl = '';
    const qrMessage = qrResult.ok && qrResult.qrMessage ? qrResult.qrMessage : `FONEPAY://QR?PRN=${orderNumber}&AMT=${finalAmount}`;

    try {
      qrDataUrl = await QRCode.toDataURL(qrMessage, { margin: 1, width: 320 });
    } catch {
      qrDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(qrMessage)}`;
    }

    // Also update payment_transactions for unified reporting
    await admin.from('payment_transactions').insert({
      user_id: user.id,
      gateway: 'fonepay',
      purchase_order_id: orderNumber,
      amount_paisa: finalAmount * 100,
      plan: 'pro',
      duration_days: 365,
      status: 'initiated',
    });

    return NextResponse.json({
      success: true,
      orderNumber,
      amount: finalAmount,
      originalPrice,
      discount,
      courseId,
      courseTitle: pricingRow?.course_name || 'SEE Class 10 Board Master Batch',
      qrDataUrl,
      qrMessage,
    });
  } catch (err: any) {
    console.error('API /api/see/order/create error:', err);
    return NextResponse.json({ error: 'Order creation failed', details: err?.message }, { status: 500 });
  }
}
