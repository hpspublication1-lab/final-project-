export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getSessionUser } from '@/lib/supabase/route-auth';
import { checkFonepayStatus } from '@/lib/payments/gateways';

export async function POST(request: NextRequest) {
  try {
    const { orderNumber } = await request.json();
    if (!orderNumber) {
      return NextResponse.json({ error: 'Missing order number' }, { status: 400 });
    }

    const admin = createAdminClient();

    // 1. Fetch order record
    const { data: order, error: fetchError } = await admin
      .from('course_orders')
      .select('*')
      .eq('order_number', orderNumber)
      .maybeSingle();

    if (fetchError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // 2. Idempotency check: If already marked as paid, return success immediately
    if (order.status === 'paid') {
      return NextResponse.json({
        success: true,
        paid: true,
        alreadyProcessed: true,
        orderNumber: order.order_number,
        courseId: order.course_id,
        redirectUrl: '/student-dashboard',
      });
    }

    // 3. Query Fonepay Verification API
    const fonepayConfig = {
      merchantCode: process.env.FONEPAY_MERCHANT_CODE || '2222040020144055',
      username: process.env.FONEPAY_USERNAME || '00501017502791',
      password: process.env.FONEPAY_PASSWORD || 'APPLE12345.6ss$',
      secretKey: process.env.FONEPAY_SECRET_KEY || '51626c3021a54430817ca95d24c2ac01',
      env: process.env.FONEPAY_ENV || 'production',
    };

    const verifyResult = await checkFonepayStatus({
      prn: order.order_number,
      config: fonepayConfig,
    });

    const isPaid = verifyResult.paid === true;

    if (!isPaid) {
      return NextResponse.json({
        success: false,
        paid: false,
        status: verifyResult.status || order.status,
        message: 'Payment verification pending. Please complete transaction on your mobile banking app.',
      });
    }

    // 4. Mark order as paid
    const now = new Date().toISOString();
    await admin
      .from('course_orders')
      .update({
        status: 'paid',
        paid_at: now,
        gateway_response: verifyResult.raw,
        updated_at: now,
      })
      .eq('order_number', orderNumber);

    // 5. Update payment_transactions
    await admin
      .from('payment_transactions')
      .update({
        status: 'completed',
        gateway_response: verifyResult.raw,
      })
      .eq('purchase_order_id', orderNumber);

    // 6. Idempotently grant course enrollment in enrollments table
    const { data: existingEnrollment } = await admin
      .from('enrollments')
      .select('id')
      .eq('user_id', order.user_id)
      .eq('program_id', order.course_id)
      .maybeSingle();

    if (existingEnrollment) {
      await admin
        .from('enrollments')
        .update({
          status: 'active',
          plan_tier: 'pro',
          updated_at: now,
        })
        .eq('id', existingEnrollment.id);
    } else {
      await admin.from('enrollments').insert({
        user_id: order.user_id,
        program_id: order.course_id,
        status: 'active',
        plan_tier: 'pro',
      });
    }

    // 7. Update user profile target program and plan
    await admin
      .from('user_profiles')
      .update({
        subscription_plan: 'pro',
        target_program: 'see_class_10',
      })
      .eq('id', order.user_id);

    return NextResponse.json({
      success: true,
      paid: true,
      orderNumber: order.order_number,
      courseId: order.course_id,
      amount: order.final_amount_npr,
      redirectUrl: '/student-dashboard',
    });
  } catch (err: any) {
    console.error('API /api/see/order/verify error:', err);
    return NextResponse.json({ error: 'Verification failed', details: err?.message }, { status: 500 });
  }
}
