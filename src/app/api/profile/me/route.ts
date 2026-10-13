import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSuperAdmin } from '@/lib/config/superAdmin';

// 15-second server memory cache per user ID to prevent duplicate DB hits across components
const profileCache = new Map<string, { payload: Record<string, unknown>; ts: number }>();
const PROFILE_CACHE_TTL_MS = 15_000;

/**
 * GET /api/profile/me
 *
 * Returns the signed-in user's own profile fields. Reads with the service-role
 * client so it works even while the user_profiles RLS policy is recursive.
 */
export async function GET() {
  try {
    // FAST PATH: If no Supabase auth cookie exists, return unauthenticated in 0ms without network I/O
    const cookieStore = await cookies();
    const hasAuthCookie = cookieStore.getAll().some((c) => c.name.startsWith('sb-') || c.name.includes('auth-token'));
    if (!hasAuthCookie) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 200 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 200 });
    }

    const cached = profileCache.get(user.id);
    if (cached && Date.now() - cached.ts < PROFILE_CACHE_TTL_MS) {
      return NextResponse.json(cached.payload);
    }

    const admin = createAdminClient();
    if (!admin) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 503 });
    }

    const { data: profile } = await admin
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    const plan = profile?.subscription_plan ?? 'free';
    const rawTier = (profile as any)?.plan_tier;
    const resolvedTier = rawTier || (plan === 'pro' || plan === 'institution' ? 'cee_ai_pro' : plan === 'student' ? 'cee_premium' : 'free');

    const meta = user.user_metadata || {};
    const emailPrefix = (user.email ?? '').split('@')[0];
    const fullName = profile?.full_name || meta.full_name || '';
    const rawRole = (profile as any)?.role || (profile as any)?.role_name || meta.role || 'student_free';
    const isStaffOrAdmin =
      !!profile?.is_admin ||
      isSuperAdmin(user.email) ||
      ['admin', 'super_admin', 'teacher', 'support_staff', 'support_agent', 'payment_staff', 'content_manager'].includes(
        String(rawRole).toLowerCase()
      );

    const onboardingCompleted = Boolean(
      meta.onboarding_completed === true ||
      isStaffOrAdmin ||
      (fullName && fullName !== emailPrefix && (profile?.phone || meta.prep_stage || meta.target_exam))
    );

    const payload = {
      id: user.id,
      email: user.email ?? '',
      full_name: fullName,
      phone: profile?.phone ?? meta.phone ?? '',
      college: profile?.college ?? meta.college ?? '',
      cee_year: profile?.cee_year ?? meta.cee_year ?? null,
      role: rawRole,
      role_name: (profile as any)?.role_name ?? rawRole,
      is_admin: !!profile?.is_admin,
      is_banned: !!(profile as any)?.is_banned,
      is_super_admin: isSuperAdmin(user.email),
      subscription_plan: plan,
      plan_tier: resolvedTier,
      subscription_expires_at: profile?.subscription_expires_at ?? null,
      battle_rating: profile?.battle_rating ?? 1000,
      total_points: profile?.total_points ?? 0,
      avatar_url: profile?.avatar_url ?? null,
      onboarding_completed: onboardingCompleted,
      target_exam: meta.target_exam ?? (profile as any)?.primary_program ?? 'cee_medical',
      prep_stage: meta.prep_stage ?? null,
      daily_study_hours: meta.daily_study_hours ?? 3,
      language_preference: meta.language_preference ?? 'english',
      consent_accepted_at: meta.consent_accepted_at ?? null,
    };

    profileCache.set(user.id, { payload, ts: Date.now() });
    return NextResponse.json(payload);
  } catch (err) {
    console.error('profile/me error:', err);
    return NextResponse.json({ error: 'Could not load profile' }, { status: 500 });
  }
}
