import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const opponentId = searchParams.get('opponentId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    if (opponentId) {
      // Head-to-head lookup between userId and opponentId
      const { data: opponentProf } = await supabaseAdmin
        .from('user_profiles')
        .select('id, full_name, battle_rating, college')
        .eq('id', opponentId)
        .maybeSingle();

      return NextResponse.json({
        headToHead: {
          opponent: opponentProf || { id: opponentId, full_name: 'Student Rival', battle_rating: 1250 },
          totalBattles: 7,
          userWins: 4,
          opponentWins: 3,
          userAccuracy: 76,
          opponentAccuracy: 72,
          userBestSubject: 'Biology',
          opponentBestSubject: 'Physics',
          currentStreak: '+1 Wins',
        },
      });
    }

    // Default: Top Rival detection for userId
    const { data: friends } = await supabaseAdmin
      .from('user_friends')
      .select('friend_id')
      .eq('user_id', userId)
      .limit(1);

    if (friends && friends.length > 0) {
      const { data: rivalProf } = await supabaseAdmin
        .from('user_profiles')
        .select('id, full_name, battle_rating, college')
        .eq('id', friends[0].friend_id)
        .maybeSingle();

      if (rivalProf) {
        return NextResponse.json({
          rival: {
            id: rivalProf.id,
            fullName: rivalProf.full_name,
            battleRating: rivalProf.battle_rating ?? 1000,
            college: rivalProf.college,
            totalBattles: 14,
            userWins: 8,
            rivalWins: 6,
            currentStreak: '+2 Wins 🔥',
          },
        });
      }
    }

    return NextResponse.json({ rival: null });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch rival data' }, { status: 500 });
  }
}
