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
      .select('battle_rating, total_points')
      .eq('id', userId)
      .maybeSingle();

    const baseRating = prof?.battle_rating ?? 1000;
    const points = prof?.total_points ?? 0;
    const level = Math.max(1, Math.floor(points / 200) + 1);

    return NextResponse.json({
      ratings: {
        overall: baseRating,
        biology: baseRating,
        chemistry: baseRating,
        physics: baseRating,
        mentalAgility: baseRating,
      },
      streakDays: 1,
      xpPoints: points,
      level,
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

    const delta = Number(ratingDelta) || 15;
    const { data: current } = await supabaseAdmin
      .from('user_profiles')
      .select('battle_rating, total_points')
      .eq('id', userId)
      .maybeSingle();

    const newRating = Math.max(800, (current?.battle_rating ?? 1000) + delta);
    const newPoints = Math.max(0, (current?.total_points ?? 0) + Math.max(10, delta));

    await supabaseAdmin
      .from('user_profiles')
      .update({ battle_rating: newRating, total_points: newPoints })
      .eq('id', userId);

    return NextResponse.json({ success: true, newRating, newPoints });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update subject rating' }, { status: 500 });
  }
}
