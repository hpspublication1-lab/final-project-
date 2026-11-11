import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { enforceRateLimit } from '@/lib/security/rateLimiter';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // 0. Rate limiting
    const rl = await enforceRateLimit(req, 'api');
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429, headers: { 'Retry-After': String(rl.resetSeconds) } }
      );
    }

    // 1. Authenticate student session
    const supabase = await createServerClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
    }

    const userId = user.id; // Strictly authoritative
    const admin = createAdminClient();
    if (!admin) {
      return NextResponse.json({ error: 'Database service unavailable' }, { status: 500 });
    }

    // 2. Fetch Wallet Balance
    let { data: wallet } = await admin
      .from('user_reward_wallet')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!wallet) {
      const { data: newW } = await admin
        .from('user_reward_wallet')
        .insert({ user_id: userId, available_npr: 0, pending_npr: 0, total_earned_npr: 0 })
        .select()
        .single();
      wallet = newW || { available_npr: 0, pending_npr: 0, total_earned_npr: 0 };
    }

    // 3. Fetch Transactions
    const { data: transactions } = await admin
      .from('reward_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    return NextResponse.json({
      wallet: {
        availableNpr: Number(wallet.available_npr ?? 0),
        pendingNpr: Number(wallet.pending_npr ?? 0),
        totalEarnedNpr: Number(wallet.total_earned_npr ?? 0),
      },
      transactions: transactions || [],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch reward wallet' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const rl = await enforceRateLimit(req, 'api');
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429, headers: { 'Retry-After': String(rl.resetSeconds) } }
      );
    }

    const supabase = await createServerClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
    }

    const userId = user.id;
    const admin = createAdminClient();
    if (!admin) {
      return NextResponse.json({ error: 'Database service unavailable' }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const { amountNpr, paymentDetails } = body;

    const parsedAmount = Number(amountNpr);
    if (!parsedAmount || parsedAmount <= 0) {
      return NextResponse.json({ error: 'Valid withdrawal amount required' }, { status: 400 });
    }

    // Verify wallet has sufficient available balance
    const { data: wallet } = await admin
      .from('user_reward_wallet')
      .select('available_npr')
      .eq('user_id', userId)
      .maybeSingle();

    if (!wallet || (wallet.available_npr ?? 0) < parsedAmount) {
      return NextResponse.json({ error: 'Insufficient available reward balance' }, { status: 400 });
    }

    const { data: tx, error } = await admin
      .from('reward_transactions')
      .insert({
        user_id: userId,
        amount_npr: parsedAmount,
        reason: `Withdrawal Request to ${paymentDetails || 'Fonepay / eSewa'}`,
        status: 'pending_review',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Payout request submitted! Pending admin anti-cheat verification.',
      transactionId: tx.id,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to submit payout request' }, { status: 500 });
  }
}
