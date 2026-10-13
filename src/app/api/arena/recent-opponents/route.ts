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

    let recentRows: any[] = [];
    try {
      const { data } = await supabaseAdmin
        .from('arena_recent_opponents')
        .select('*')
        .eq('user_id', userId)
        .order('last_battled_at', { ascending: false })
        .limit(10);
      recentRows = data || [];
    } catch {}

    if (!recentRows || recentRows.length === 0) {
      return NextResponse.json({ opponents: [] });
    }

    const oppIds = recentRows.map((r) => r.opponent_id);
    let oppProfiles: any[] = [];
    try {
      const { data } = await supabaseAdmin
        .from('user_profiles')
        .select('id, full_name, battle_rating, avatar_url, college')
        .in('id', oppIds);
      oppProfiles = data || [];
    } catch {}

    const friendSet = new Set<string>();
    const profileMap = new Map((oppProfiles || []).map((p) => [p.id, p]));

    const opponents = recentRows.map((r) => {
      const p = profileMap.get(r.opponent_id);
      return {
        id: r.opponent_id,
        full_name: p?.full_name || 'Student Rival',
        username: p?.username || `user_${r.opponent_id.slice(0, 6)}`,
        battle_rating: p?.battle_rating ?? 1200,
        avatar_url: p?.avatar_url || null,
        lastBattledAt: r.last_battled_at,
        outcome: r.outcome,
        ratingDelta: r.rating_delta,
        isFriend: friendSet.has(r.opponent_id),
      };
    });

    return NextResponse.json({ opponents });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch recent opponents' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, opponentId, outcome, ratingDelta } = body;

    if (!userId || !opponentId) {
      return NextResponse.json({ error: 'User ID and opponent ID required' }, { status: 400 });
    }

    await supabaseAdmin
      .from('arena_recent_opponents')
      .upsert({
        user_id: userId,
        opponent_id: opponentId,
        outcome: outcome || 'win',
        rating_delta: ratingDelta || 0,
        last_battled_at: new Date().toISOString(),
      });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to record recent opponent' }, { status: 500 });
  }
}
