import { NextRequest, NextResponse } from 'next/server';
import { verifyServerPermission, checkDuplicateSubmission } from '@/lib/auth/serverGuard';
import { createAdminClient } from '@/lib/supabase/admin';
import { EnrollmentService } from '@/lib/services/enrollmentService';
import { CanonicalCourseSlug } from '@/types/lms';

export async function GET(req: NextRequest) {
  const guard = await verifyServerPermission(req, 'enrollments:manage');
  if (!guard.authorized) return guard.response;

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });

  try {
    const [{ data: enrollments }, { data: batchEnrs }, { data: batches }] = await Promise.all([
      admin.from('enrollments').select('*').order('created_at', { ascending: false }).limit(100),
      admin.from('batch_enrollments').select('*').order('enrolled_at', { ascending: false }).limit(100),
      admin.from('batches').select('id, title, slug'),
    ]);

    const batchMap = new Map((batches || []).map((b: any) => [b.id, b]));

    // Normalize batch enrollments to Enrollment shape
    const normalizedBatchEnrs = (batchEnrs || []).map((be: any) => {
      const b = batchMap.get(be.batch_id);
      return {
        id: be.id,
        student_id: be.student_id,
        course_id: b?.title || 'cee_medical',
        batch_id: be.batch_id,
        enrollment_status: 'PAID',
        created_at: be.enrolled_at || new Date().toISOString(),
      };
    });

    const allList = [...(enrollments || []), ...normalizedBatchEnrs];

    // Fetch user details for these enrollments
    const studentIds = Array.from(new Set(allList.map((e: any) => e.student_id).filter(Boolean)));
    const { data: profiles } = studentIds.length > 0
      ? await admin.from('user_profiles').select('id, full_name, phone').in('id', studentIds)
      : { data: [] };
    const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

    const enriched = allList.map((e: any) => ({
      ...e,
      student_name: profileMap.get(e.student_id)?.full_name || 'Student',
      student_phone: profileMap.get(e.student_id)?.phone || '',
    }));

    return NextResponse.json({ success: true, enrollments: enriched });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const guard = await verifyServerPermission(req, 'enrollments:manage');
  if (!guard.authorized) return guard.response;

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });

  try {
    const body = await req.json();
    const { studentEmail, studentId, courseSlug, batchId, durationDays = 365, notes } = body;

    let targetUserId = studentId;
    if (!targetUserId && studentEmail) {
      const { data: targetUser } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const found = (targetUser?.users || []).find((u) => u.email?.toLowerCase() === studentEmail.toLowerCase().trim());
      if (found) targetUserId = found.id;
    }

    if (!targetUserId) {
      return NextResponse.json({ error: 'Target student not found' }, { status: 404 });
    }

    const duplicateKey = `enrollment_grant_${targetUserId}_${courseSlug}_${batchId || 'all'}`;
    if (checkDuplicateSubmission(duplicateKey)) {
      return NextResponse.json({ success: true, message: 'Enrollment grant already in progress.' });
    }

    const result = await EnrollmentService.grantEnrollment({
      userId: targetUserId,
      courseSlug: courseSlug as CanonicalCourseSlug,
      batchId,
      accessPeriodDays: durationDays,
      grantType: 'manual_admin',
      adminUserId: guard.user.id,
      notes,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, enrollmentId: result.enrollmentId });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const guard = await verifyServerPermission(req, 'enrollments:manage');
  if (!guard.authorized) return guard.response;

  try {
    const { searchParams } = new URL(req.url);
    const enrollmentId = searchParams.get('id');
    const reason = searchParams.get('reason') || 'Administrative revocation';

    if (!enrollmentId) {
      return NextResponse.json({ error: 'enrollmentId is required' }, { status: 400 });
    }

    const result = await EnrollmentService.revokeEnrollment({
      enrollmentId,
      adminUserId: guard.user.id,
      reason,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Enrollment revoked successfully.' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
