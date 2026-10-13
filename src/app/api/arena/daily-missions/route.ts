import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

const DEFAULT_MISSIONS = [
  { missionCode: 'WIN_BIO_2', missionTitle: 'Win 2 Biology Battles', subjectFilter: 'biology', targetCount: 2, xpReward: 50 },
  { missionCode: 'PHY_ACC_80', missionTitle: 'Achieve ≥80% Accuracy in Physics', subjectFilter: 'physics', targetCount: 1, xpReward: 75 },
  { missionCode: 'COMPLETE_ARENA_3', missionTitle: 'Complete 3 Arena Matches', subjectFilter: 'mixed', targetCount: 3, xpReward: 60 },
];

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const today = new Date().toISOString().split('T')[0];

    let missions: any[] = [];
    try {
      const { data } = await supabaseAdmin
        .from('user_daily_missions')
        .select('*')
        .eq('user_id', userId)
        .eq('mission_date', today);
      missions = data || [];
    } catch {}

    // If none exist, seed default daily missions
    if (!missions || missions.length === 0) {
      missions = DEFAULT_MISSIONS.map((m, idx) => ({
        id: `mis_${idx}_${today}`,
        user_id: userId,
        mission_code: m.missionCode,
        mission_title: m.missionTitle,
        subject_filter: m.subjectFilter,
        target_count: m.targetCount,
        current_count: 0,
        xp_reward: m.xpReward,
        completed: false,
        claimed: false,
        mission_date: today,
      }));
    }

    return NextResponse.json({ missions });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch daily missions' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, missionId, action } = body;

    if (!userId || !missionId) {
      return NextResponse.json({ error: 'User ID and missionId required' }, { status: 400 });
    }

    if (action === 'claim') {
      let mission: any = null;
      try {
        const { data } = await supabaseAdmin
          .from('user_daily_missions')
          .select('*')
          .eq('id', missionId)
          .maybeSingle();
        mission = data;
      } catch {}

      // Award Points
      const reward = mission?.xp_reward || 50;
      const { data: prof } = await supabaseAdmin.from('user_profiles').select('total_points').eq('id', userId).maybeSingle();
      const currentPoints = prof?.total_points ?? 0;
      await supabaseAdmin.from('user_profiles').update({ total_points: currentPoints + reward }).eq('id', userId);

      return NextResponse.json({ success: true, xpEarned: reward });
    }

    return NextResponse.json({ error: 'Invalid operation' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update mission' }, { status: 500 });
  }
}
