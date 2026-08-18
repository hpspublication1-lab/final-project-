import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  PLAN_PRICES,
  esewaConfigured, buildEsewaForm,
  khaltiConfigured, initiateKhaltiPayment,
} from '@/lib/payments/gateways';

/**
 * POST /api/payments/initiate  { gateway: 'esewa'|'khalti', plan: 'pro' }
 *
 * Creates a payment_transactions row (service role — the table has no client
 * write policies by design) and returns what the client needs to redirect:
 *  - esewa:  { gateway, actionUrl, fields }  → client auto-submits a form POST
 *  - khalti: { gateway, paymentUrl }         → client redirects
 * Amounts always come from the server-side PLAN_PRICES table.
 */
export async function POST(request: NextRequest) {
  try {
    const { gateway, plan } = await request.json();

    const price = PLAN_PRICES[plan];
    if (!price || !['esewa', 'khalti'].includes(gateway)) {
      return NextResponse.json({ error: 'Invalid gateway or plan' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Sign in to continue' }, { status: 401 });

    const admin = createAdminClient();
    if (!admin) {
      return NextResponse.json(
        { error: 'Payments not configured', details: 'SUPABASE_SERVICE_ROLE_KEY is missing on the server.' },
        { status: 503 }
      );
    }

    if (gateway === 'esewa' && !esewaConfigured()) {
      return NextResponse.json({ error: 'eSewa is not configured yet' }, { status: 503 });
    }
    if (gateway === 'khalti' && !khaltiConfigured()) {
      return NextResponse.json({ error: 'Khalti is not configured yet' }, { status: 503 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:4028';
    const orderId = `SCM-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    // Log the transaction as 'initiated' BEFORE redirecting to the gateway.
    const { error: insertError } = await admin.from('payment_transactions').insert({
      user_id: user.id,
      gateway,
      purchase_order_id: orderId,
      amount_paisa: price.npr * 100,
      plan: price.plan,
      duration_days: price.days,
      status: 'initiated',
    });
    if (insertError) {
      console.error('payment insert failed:', insertError.message);
      return NextResponse.json({ error: 'Could not start payment. Try again.' }, { status: 500 });
    }

    if (gateway === 'esewa') {
      const successUrl = `${siteUrl}/api/payments/verify?gateway=esewa&order=${orderId}`;
      const failureUrl = `${siteUrl}/activate-plan?payment=failed`;
      const form = buildEsewaForm(price.npr, orderId, successUrl, failureUrl);
      return NextResponse.json({ gateway, orderId, ...form });
    }

    // Khalti
    const result = await initiateKhaltiPayment({
      amountNpr: price.npr,
      purchaseOrderId: orderId,
      purchaseOrderName: price.label,
      returnUrl: `${siteUrl}/api/payments/verify?gateway=khalti&order=${orderId}`,
      websiteUrl: siteUrl,
      customer: { name: user.user_metadata?.full_name, email: user.email ?? '' },
    });
    if ('error' in result) {
      await admin.from('payment_transactions').update({ status: 'failed', gateway_response: { error: result.error } }).eq('purchase_order_id', orderId);
      return NextResponse.json({ error: result.error }, { status: 502 });
    }

    await admin.from('payment_transactions').update({ gateway_ref: result.pidx, status: 'pending' }).eq('purchase_order_id', orderId);
    return NextResponse.json({ gateway, orderId, paymentUrl: result.paymentUrl });
  } catch (err) {
    console.error('payments/initiate error:', err);
    return NextResponse.json({ error: 'Payment initiation failed' }, { status: 500 });
  }
}
