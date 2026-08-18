import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkFonepayStatus } from '@/lib/payments/gateways';

/**
 * POST /api/payments/fonepay/status   { prn }
 *
 * The client polls this while the QR is displayed. We NEVER trust the client —
 * we ask Fonepay (thirdPartyDynamicQrGetStatus) whether the payment landed,
 * then mark the transaction completed and activate the plan, all with the
 * service-role client. Idempotent: polling after completion is a no-op.
 *
 * Response: { status: 'pending' | 'completed' | 'failed' }
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
    // Fonepay has no "pending" state: an unpaid QR reports 'failed' until it's
    // actually paid, so checkFonepayStatus only ever returns 'pending' (still
    // waiting) or 'success'. We never mark the tx failed from a poll — the
    // client's poll timeout handles an expired/abandoned QR.
    const result = await checkFonepayStatus(prn, config);

    if (result.status === 'pending') {
      return NextResponse.json({ status: 'pending' });
    }

    // ── success → mark paid + activate the plan ───────────────────────────
    await admin.from('payment_transactions')
      .update({ status: 'completed', gateway_ref: result.traceId, gateway_response: result.raw })
      .eq('id', tx.id);

    await admin.from('user_profiles')
      .update({
        subscription_plan: tx.plan,
        subscription_expires_at: new Date(Date.now() + tx.duration_days * 86400000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', tx.user_id);

    return NextResponse.json({ status: 'completed' });
  } catch (err) {
    console.error('payments/fonepay/status error:', err);
    return NextResponse.json({ error: 'Status check failed' }, { status: 500 });
  }
}
