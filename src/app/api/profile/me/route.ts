import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSuperAdmin } from '@/lib/config/superAdmin';

/**
 * GET /api/profile/me
 *
 * Returns the signed-in user's own profile fields. Reads with the service-role
 * client so it works even while the user_profiles RLS policy is recursive
 * (FIX-AUTH-RLS.sql pending). Only ever returns the caller's OWN row.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
    }

    const admin = createAdminClient();
    if (!admin) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 503 });
    }

    const { data: profile } = await admin
      .from('user_profiles')
      .select('full_name, phone, college, cee_year, is_admin, subscription_plan, subscription_expires_at, battle_rating, total_points, avatar_url')
      .eq('id', user.id)
      .single();

    return NextResponse.json({
      id: user.id,
      email: user.email ?? '',
      full_name: profile?.full_name ?? '',
      phone: profile?.phone ?? '',
      college: profile?.college ?? '',
      cee_year: profile?.cee_year ?? null,
      is_admin: !!profile?.is_admin,
      is_super_admin: isSuperAdmin(user.email),
      subscription_plan: profile?.subscription_plan ?? 'free',
      subscription_expires_at: profile?.subscription_expires_at ?? null,
      battle_rating: profile?.battle_rating ?? 1000,
      total_points: profile?.total_points ?? 0,
      avatar_url: profile?.avatar_url ?? null,
    });
  } catch (err) {
    console.error('profile/me error:', err);
    return NextResponse.json({ error: 'Could not load profile' }, { status: 500 });
  }
}
