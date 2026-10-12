import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/supabase/route-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { evaluateAccessContext, RawUserProfile, RawEnrollment } from '@/lib/auth/accessControl';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const admin = createAdminClient();
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Database unavailable' }, { status: 500 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const subjectId = searchParams.get('subject_id');
    const limit = Math.min(parseInt(searchParams.get('limit') || '30', 10), 100);

    // Check optional user authentication and course access
    const user = await getSessionUser(req);
    let hasFullPaidAccess = false;

    if (user) {
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
      hasFullPaidAccess =
        accessContext.role === 'super_administrator' ||
        accessContext.role === 'administrator' ||
        accessContext.role === 'teacher' ||
        Object.values(accessContext.courses).some((c) => c.canAccessFullCourse);
    }

    let query = admin
      .from('live_classes')
      .select('id, title, description, scheduled_at, duration_min, meeting_url, recording_url, status, subject_id, is_premium, created_at, subjects(display_name)')
      .order('scheduled_at', { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }
    if (subjectId) {
      query = query.eq('subject_id', subjectId);
    }

    const { data: classes, error } = await query;
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Mask stream URLs for non-enrolled users on premium sessions
    const sanitizedClasses = (classes || []).map((c: any) => {
      const canAccessStream = !c.is_premium || hasFullPaidAccess;

      return {
        id: c.id,
        title: c.title,
        description: c.description,
        scheduledAt: c.scheduled_at,
        durationMin: c.duration_min,
        status: c.status,
        subjectId: c.subject_id,
        subjectName: c.subjects?.display_name || null,
        isPremium: !!c.is_premium,
        isLocked: !canAccessStream,
        // Only disclose meeting/stream URL if authorized
        streamUrl: canAccessStream ? c.meeting_url : null,
        recordingUrl: canAccessStream ? c.recording_url : null,
      };
    });

    return NextResponse.json({
      success: true,
      classes: sanitizedClasses,
      userHasPaidAccess: hasFullPaidAccess,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal error' }, { status: 500 });
  }
}
