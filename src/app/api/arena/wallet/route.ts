import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Fetch Wallet Balance
    let { data: wallet } = await supabaseAdmin
      .from('user_reward_wallet')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!wallet) {
      const { data: newW } = await supabaseAdmin
        .from('user_reward_wallet')
        .insert({ user_id: userId, available_npr: 1250, pending_npr: 500, total_earned_npr: 5750 })
        .select()
        .single();
      wallet = newW || { available_npr: 1250, pending_npr: 500, total_earned_npr: 5750 };
    }

    // Fetch Transactions
    const { data: transactions } = await supabaseAdmin
      .from('reward_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    return NextResponse.json({
      wallet: {
        availableNpr: Number(wallet.available_npr ?? 1250),
        pendingNpr: Number(wallet.pending_npr ?? 500),
        totalEarnedNpr: Number(wallet.total_earned_npr ?? 5750),
      },
      transactions: transactions || [
        { id: 'tx-1', amount_npr: 1000, reason: 'January Champion Prize 👑', status: 'approved', created_at: new Date().toISOString() },
        { id: 'tx-2', amount_npr: 250, reason: 'Weekly CEE Tournament Top 3 🏆', status: 'approved', created_at: new Date().toISOString() },
      ],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch reward wallet' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, amountNpr, paymentDetails } = body;

    if (!userId || !amountNpr) {
      return NextResponse.json({ error: 'User ID and withdrawal amount required' }, { status: 400 });
    }

    const { data: tx, error } = await supabaseAdmin
      .from('reward_transactions')
      .insert({
        user_id: userId,
        amount_npr: amountNpr,
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
