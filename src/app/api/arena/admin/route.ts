import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

export async function GET() {
  try {
    // 1. Fetch pending reward payout transactions
    const { data: pendingPayouts } = await supabaseAdmin
      .from('reward_transactions')
      .select('*')
      .eq('status', 'pending_review')
      .order('created_at', { ascending: false });

    // 2. Fetch anti-cheat flagged users
    const { data: flaggedUsers } = await supabaseAdmin
      .from('user_profiles')
      .select('id, full_name, username, battle_rating, anti_cheat_status')
      .neq('anti_cheat_status', 'normal');

    // 3. Fetch Active Season info
    const { data: seasons } = await supabaseAdmin
      .from('arena_seasons')
      .select('*')
      .order('starts_at', { ascending: false });

    return NextResponse.json({
      pendingPayouts: pendingPayouts || [],
      flaggedUsers: flaggedUsers || [],
      seasons: seasons || [],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch admin arena data' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, transactionId, targetUserId, newStatus } = body;

    if (action === 'approve_payout') {
      const { data: tx } = await supabaseAdmin
        .from('reward_transactions')
        .select('*')
        .eq('id', transactionId)
        .single();

      if (tx) {
        await supabaseAdmin
          .from('reward_transactions')
          .update({ status: 'approved', updated_at: new Date().toISOString() })
          .eq('id', transactionId);

        // Deduct pending and update available in wallet
        const { data: w } = await supabaseAdmin.from('user_reward_wallet').select('*').eq('user_id', tx.user_id).single();
        if (w) {
          await supabaseAdmin
            .from('user_reward_wallet')
            .update({
              pending_npr: Math.max(0, Number(w.pending_npr) - Number(tx.amount_npr)),
              available_npr: Number(w.available_npr) + Number(tx.amount_npr),
              total_earned_npr: Number(w.total_earned_npr) + Number(tx.amount_npr),
            })
            .eq('user_id', tx.user_id);
        }
      }

      return NextResponse.json({ success: true, message: 'Reward payout approved' });
    }

    if (action === 'set_anti_cheat_status') {
      await supabaseAdmin
        .from('user_profiles')
        .update({ anti_cheat_status: newStatus })
        .eq('id', targetUserId);

      return NextResponse.json({ success: true, message: `User status set to ${newStatus}` });
    }

    return NextResponse.json({ error: 'Invalid admin action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Admin action failed' }, { status: 500 });
  }
}
