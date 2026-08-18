import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyEsewaPayment, verifyKhaltiPayment } from '@/lib/payments/gateways';

/**
 * GET /api/payments/verify?gateway=esewa|khalti&order=<purchase_order_id>
 *
 * The gateway redirects the student here after payment. We NEVER trust the
 * redirect itself — we verify server-to-server with the gateway (status check /
 * lookup), then mark the transaction completed and activate the plan, all with
 * the service-role client. Idempotent: re-visiting after completion is a no-op.
 */
export async function GET(request: NextRequest) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:4028';
  const fail = (reason: string) =>
    NextResponse.redirect(`${siteUrl}/activate-plan?payment=failed&reason=${encodeURIComponent(reason)}`);

  try {
    const gateway = request.nextUrl.searchParams.get('gateway');
    const orderId = request.nextUrl.searchParams.get('order');
    if (!gateway || !orderId) return fail('missing-params');

    const admin = createAdminClient();
    if (!admin) return fail('server-not-configured');

    const { data: tx } = await admin
      .from('payment_transactions')
      .select('*')
      .eq('purchase_order_id', orderId)
      .single();
    if (!tx) return fail('unknown-order');

    // Idempotency: already completed → just send them to success.
    if (tx.status === 'completed') {
      return NextResponse.redirect(`${siteUrl}/activate-plan?payment=success`);
    }

    // ── Verify with the gateway (source of truth) ─────────────────────────
    let complete = false;
    let gatewayRef: string | null = tx.gateway_ref;
    let raw: any = null;

    if (gateway === 'esewa') {
      const v = await verifyEsewaPayment(orderId, Math.round(tx.amount_paisa / 100));
      complete = v.complete;
      gatewayRef = v.refId ?? gatewayRef;
      raw = v.raw;
    } else if (gateway === 'khalti') {
      const pidx = request.nextUrl.searchParams.get('pidx') ?? tx.gateway_ref;
      if (!pidx) return fail('missing-pidx');
      const v = await verifyKhaltiPayment(pidx);
      complete = v.complete;
      gatewayRef = pidx;
      raw = v.raw;
    } else {
      return fail('bad-gateway');
    }

    if (!complete) {
      await admin.from('payment_transactions')
        .update({ status: 'failed', gateway_response: raw })
        .eq('id', tx.id);
      return fail('not-completed');
    }

    // ── Mark paid + activate the plan ─────────────────────────────────────
    await admin.from('payment_transactions')
      .update({ status: 'completed', gateway_ref: gatewayRef, gateway_response: raw })
      .eq('id', tx.id);

    await admin.from('user_profiles')
      .update({
        subscription_plan: tx.plan,
        subscription_expires_at: new Date(Date.now() + tx.duration_days * 86400000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', tx.user_id);

    return NextResponse.redirect(`${siteUrl}/activate-plan?payment=success`);
  } catch (err) {
    console.error('payments/verify error:', err);
    return fail('server-error');
  }
}
