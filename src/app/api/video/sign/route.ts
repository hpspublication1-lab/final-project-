import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  evaluateAccessContext,
  RawUserProfile,
  RawEnrollment,
} from '@/lib/auth/accessControl';
import { enforceRateLimit } from '@/lib/security/rateLimiter';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const rl = enforceRateLimit(request, 'general', 'video-sign');
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too many video stream requests. Please wait.' }, { status: 429 });
    }

    const videoId = request.nextUrl.searchParams.get('video');
    if (!videoId) return NextResponse.json({ error: 'Missing video id' }, { status: 400 });

    const admin = createAdminClient();
    if (!admin) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
    }

    // 1. Fetch video record from video_lectures
    const { data: video } = await admin
      .from('video_lectures')
      .select('id, title, video_url, is_premium, is_active, batch_id, subject_id')
      .eq('id', videoId)
      .maybeSingle();

    if (!video || !video.is_active || !video.video_url) {
      return NextResponse.json({ error: 'Video not found or inactive' }, { status: 404 });
    }

    // 2. Entitlement verification for premium videos
    if (video.is_premium) {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json(
          { error: 'Authentication required for premium video', requiresAuth: true },
          { status: 401 }
        );
      }

      // Fetch user profile and enrollments
      const [profileRes, enrollmentsRes] = await Promise.all([
        admin.from('user_profiles').select('*').eq('id', user.id).maybeSingle(),
        admin.from('enrollments').select('*').eq('student_id', user.id),
      ]);

      const profile: RawUserProfile = profileRes.data || { id: user.id };
      const rawEnrollments: RawEnrollment[] = (enrollmentsRes.data || []).map((e: any) => ({
        id: e.id,
        course_id: e.course_id,
        batch_id: e.batch_id,
        status: e.status || e.enrollment_status,
        created_at: e.created_at,
      }));

      const accessContext = evaluateAccessContext(user, profile, rawEnrollments);

      // Check if user is super_admin, admin, teacher, or has active course/batch access
      const isPrivileged =
        accessContext.role === 'super_administrator' ||
        accessContext.role === 'administrator' ||
        accessContext.role === 'teacher' ||
        accessContext.role === 'student_all_access';

      const hasBatchOrCourseAccess = video.batch_id
        ? accessContext.enrolledBatchIds.includes(video.batch_id) ||
          Object.values(accessContext.courses).some((c) => c.canAccessFullCourse && (!c.batchId || c.batchId === video.batch_id))
        : Object.values(accessContext.courses).some((c) => c.canAccessFullCourse);

      const hasPaidAccess = isPrivileged || hasBatchOrCourseAccess;

      if (!hasPaidAccess) {
        return NextResponse.json(
          {
            error: 'Active course enrollment required to watch this premium video',
            requiresEnrollment: true,
          },
          { status: 403 }
        );
      }
    }

    // 3. Generate signed Bunny CDN stream token
    const tokenKey = process.env.BUNNY_TOKEN_KEY;
    const url = new URL(video.video_url);

    // Not a Bunny URL, or signing not configured → return raw URL
    if (!tokenKey || !url.hostname.endsWith('.b-cdn.net')) {
      return NextResponse.json({ url: video.video_url, signed: false, isPremium: video.is_premium });
    }

    const dirPath = url.pathname.substring(0, url.pathname.lastIndexOf('/') + 1);
    const expires = Math.floor(Date.now() / 1000) + 60 * 60 * 4; // 4 hours

    const hashBase = tokenKey + dirPath + expires;
    const token = crypto
      .createHash('sha256')
      .update(hashBase)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const signedUrl = `${url.origin}${url.pathname}?token=${token}&expires=${expires}&token_path=${encodeURIComponent(dirPath)}`;
    return NextResponse.json({
      url: signedUrl,
      signed: true,
      expires,
      isPremium: video.is_premium,
      title: video.title,
    });
  } catch (err) {
    console.error('video/sign error:', err);
    return NextResponse.json({ error: 'Could not sign video URL' }, { status: 500 });
  }
}
