import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/supabase/route-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSuperAdmin } from '@/lib/config/superAdmin';
import { enforceRateLimit } from '@/lib/security/rateLimiter';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const admin = createAdminClient();
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Database unavailable' }, { status: 500 });
    }

    const [profileRes, enrollmentsRes] = await Promise.all([
      admin
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle(),
      admin
        .from('enrollments')
        .select('id, course_id, batch_id, status, created_at')
        .eq('student_id', user.id),
    ]);

    const profile = profileRes.data;
    const enrollments = enrollmentsRes.data || [];

    return NextResponse.json({
      success: true,
      profile: {
        id: user.id,
        email: user.email ?? '',
        fullName: profile?.full_name ?? '',
        phone: profile?.phone ?? '',
        college: profile?.college ?? '',
        targetExamYear: profile?.cee_year ?? null,
        role: profile?.role ?? (profile?.is_admin ? 'admin' : 'student_free'),
        isAdmin: !!profile?.is_admin,
        isSuperAdmin: isSuperAdmin(user.email),
        subscriptionPlan: profile?.subscription_plan ?? 'free',
        subscriptionExpiresAt: profile?.subscription_expires_at ?? null,
        battleRating: profile?.battle_rating ?? 1000,
        totalPoints: profile?.total_points ?? 0,
        avatarUrl: profile?.avatar_url ?? null,
        registeredOfflineDevices: user.user_metadata?.offline_devices || [],
      },
      enrollments,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const rateLimit = enforceRateLimit(req, 'general', 'profile-update');
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: `Too many updates. Please wait ${rateLimit.resetSeconds}s.` },
        { status: 429 }
      );
    }

    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const allowedFields = ['full_name', 'phone', 'college', 'cee_year', 'avatar_url'];
    const updateData: Record<string, any> = {};

    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        if (key === 'full_name' || key === 'phone' || key === 'college') {
          updateData[key] = typeof body[key] === 'string' ? body[key].trim() : body[key];
        } else if (key === 'cee_year') {
          updateData[key] = body[key] ? Number(body[key]) : null;
        } else {
          updateData[key] = body[key];
        }
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ success: false, error: 'No valid fields to update.' }, { status: 400 });
    }

    const admin = createAdminClient();
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Database unavailable' }, { status: 500 });
    }

    const { data: updated, error } = await admin
      .from('user_profiles')
      .update(updateData)
      .eq('id', user.id)
      .select('id, full_name, phone, college, cee_year, avatar_url')
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, profile: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal error' }, { status: 500 });
  }
}

export const PUT = PATCH;
