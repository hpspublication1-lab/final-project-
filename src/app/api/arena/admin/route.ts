import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

export async function GET() {
  try {
    let pendingPayouts: any[] = [];
    try {
      const { data } = await supabaseAdmin.from('reward_transactions').select('*').limit(50);
      pendingPayouts = data || [];
    } catch {}

    let flaggedUsers: any[] = [];
    try {
      const { data } = await supabaseAdmin.from('user_profiles').select('id, full_name, battle_rating, total_points').limit(50);
      flaggedUsers = (data || []).map((u: any) => ({
        ...u,
        username: u.full_name?.toLowerCase().replace(/\s+/g, '_') || 'player',
        anti_cheat_status: 'normal',
      }));
    } catch {}

    let seasons: any[] = [];
    try {
      const { data } = await supabaseAdmin.from('arena_seasons').select('*').limit(10);
      seasons = data || [];
    } catch {}

    return NextResponse.json({
      pendingPayouts,
      flaggedUsers,
      seasons,
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

    if (action === 'record_championship_payout') {
      const { winnerUserId, amountNpr, esewaId, transactionRef, notes } = body;
      if (!winnerUserId) {
        return NextResponse.json({ error: 'winnerUserId is required' }, { status: 400 });
      }

      // Check if there is an existing pending payout for this user
      const { data: existingPayout } = await supabaseAdmin
        .from('championship_payouts')
        .select('*')
        .eq('winner_user_id', winnerUserId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      let payoutRecord;
      if (existingPayout) {
        const { data: updated } = await supabaseAdmin
          .from('championship_payouts')
          .update({
            esewa_id: esewaId,
            transaction_ref: transactionRef,
            amount_npr: amountNpr || 1000,
            payout_status: 'completed',
            admin_notes: notes,
            completed_at: new Date().toISOString(),
          })
          .eq('id', existingPayout.id)
          .select('*')
          .single();
        payoutRecord = updated;
      } else {
        const { data: inserted } = await supabaseAdmin
          .from('championship_payouts')
          .insert({
            winner_user_id: winnerUserId,
            esewa_id: esewaId,
            transaction_ref: transactionRef,
            amount_npr: amountNpr || 1000,
            payout_method: 'esewa',
            payout_status: 'completed',
            admin_notes: notes,
            completed_at: new Date().toISOString(),
          })
          .select('*')
          .single();
        payoutRecord = inserted;
      }

      return NextResponse.json({
        success: true,
        message: 'Championship payout recorded and completed',
        payout: payoutRecord,
      });
    }

    return NextResponse.json({ error: 'Invalid admin action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Admin action failed' }, { status: 500 });
  }
}
