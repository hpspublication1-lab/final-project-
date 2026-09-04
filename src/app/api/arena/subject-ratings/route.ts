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

    const { data: prof } = await supabaseAdmin
      .from('user_profiles')
      .select('battle_rating, bio_rating, chem_rating, phy_rating, ma_rating, streak_days, xp_points, level')
      .eq('id', userId)
      .maybeSingle();

    return NextResponse.json({
      ratings: {
        overall: prof?.battle_rating ?? 1000,
        biology: prof?.bio_rating ?? 1000,
        chemistry: prof?.chem_rating ?? 1000,
        physics: prof?.phy_rating ?? 1000,
        mentalAgility: prof?.ma_rating ?? 1000,
      },
      streakDays: prof?.streak_days ?? 1,
      xpPoints: prof?.xp_points ?? 0,
      level: prof?.level ?? 1,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch ratings' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, subject, ratingDelta } = body;

    if (!userId || !subject) {
      return NextResponse.json({ error: 'User ID and subject required' }, { status: 400 });
    }

    // Call database function or manual column update
    const { error } = await supabaseAdmin.rpc('update_battle_subject_rating', {
      p_user_id: userId,
      p_subject: subject.toLowerCase(),
      p_rating_delta: ratingDelta ?? 15,
    });

    if (error) {
      // Fallback manual update
      const col = subject === 'biology' ? 'bio_rating' : subject === 'chemistry' ? 'chem_rating' : subject === 'physics' ? 'phy_rating' : 'ma_rating';
      const { data: current } = await supabaseAdmin.from('user_profiles').select(col).eq('id', userId).maybeSingle();
      const currVal = (current as any)?.[col] ?? 1000;
      await supabaseAdmin.from('user_profiles').update({ [col]: Math.max(100, currVal + ratingDelta) }).eq('id', userId);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update subject rating' }, { status: 500 });
  }
}
