import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const username = searchParams.get('username');

    let query = supabaseAdmin.from('user_profiles').select('*');

    if (username) {
      query = query.ilike('username', username);
    } else if (userId) {
      query = query.eq('id', userId);
    } else {
      return NextResponse.json({ error: 'userId or username required' }, { status: 400 });
    }

    const { data: prof, error } = await query.maybeSingle();

    if (error || !prof) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Fetch user achievements
    const { data: achievements } = await supabaseAdmin
      .from('user_achievements')
      .select('*')
      .eq('user_id', prof.id);

    return NextResponse.json({
      profile: {
        id: prof.id,
        full_name: prof.full_name,
        username: prof.username || `user_${prof.id.slice(0, 6)}`,
        avatar_url: prof.avatar_url,
        bio: prof.bio || 'CEE Entrance Aspirant 🎓',
        selected_title: prof.selected_title || 'CEE Challenger',
        featured_achievements: prof.featured_achievements || [],
        battle_rating: prof.battle_rating ?? 1284,
        bio_rating: prof.bio_rating ?? 1421,
        chem_rating: prof.chem_rating ?? 1280,
        phy_rating: prof.phy_rating ?? 1151,
        ma_rating: prof.ma_rating ?? 1300,
        country_rank: prof.country_rank ?? 127,
        wins_count: prof.wins_count ?? 86,
        losses_count: prof.losses_count ?? 41,
        total_matches: prof.total_matches ?? 127,
        win_streak: prof.win_streak ?? 8,
        streak_days: prof.streak_days ?? 7,
        xp_points: prof.xp_points ?? 340,
        level: prof.level ?? 4,
      },
      achievements: achievements || [],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, username, displayName, bio, avatarUrl, selectedTitle, featuredAchievements } = body;

    if (!userId) {
      return NextResponse.json({ error: 'Authoritative User ID required' }, { status: 400 });
    }

    const updates: any = {};
    if (displayName) updates.full_name = displayName.trim();
    if (bio !== undefined) updates.bio = bio.trim();
    if (avatarUrl !== undefined) updates.avatar_url = avatarUrl;
    if (selectedTitle !== undefined) updates.selected_title = selectedTitle;
    if (featuredAchievements !== undefined) updates.featured_achievements = featuredAchievements;

    if (username) {
      const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
      if (cleanUsername.length < 3 || cleanUsername.length > 20) {
        return NextResponse.json({ error: 'Username must be between 3 and 20 characters' }, { status: 400 });
      }

      // Check uniqueness
      const { data: existing } = await supabaseAdmin
        .from('user_profiles')
        .select('id')
        .eq('username', cleanUsername)
        .neq('id', userId)
        .maybeSingle();

      if (existing) {
        return NextResponse.json({ error: 'Username is already taken by another student' }, { status: 400 });
      }

      updates.username = cleanUsername;
    }

    const { error: updateErr } = await supabaseAdmin
      .from('user_profiles')
      .update(updates)
      .eq('id', userId);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Profile updated successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update profile' }, { status: 500 });
  }
}
