import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  evaluateAccessContext,
  normalizeCourseSlug,
  RawUserProfile,
  RawEnrollment,
} from '@/lib/auth/accessControl';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { courseSlug: rawCourseSlug, batchId } = body;

    const courseSlug = normalizeCourseSlug(rawCourseSlug);
    if (!courseSlug || !batchId) {
      return NextResponse.json({ error: 'Missing courseSlug or batchId' }, { status: 400 });
    }

    const admin = createAdminClient() || supabase;

    // Check batch validity
    const { data: batch, error: batchErr } = await admin
      .from('batches')
      .select('id, title, slug, is_active')
      .eq('id', batchId)
      .eq('is_active', true)
      .maybeSingle();

    if (batchErr || !batch) {
      return NextResponse.json({ error: 'Selected batch is not active or not found' }, { status: 404 });
    }

    // Check user enrollment/access for this course
    const [profileRes, enrollmentsRes] = await Promise.all([
      admin.from('profiles').select('*').eq('id', user.id).maybeSingle(),
      admin.from('enrollments').select('*').eq('student_id', user.id),
    ]);

    const profile: RawUserProfile = profileRes.data || { id: user.id };
    const rawEnrollments: RawEnrollment[] = (enrollmentsRes.data || []).map((e: any) => ({
      id: e.id,
      course_id: e.course_id,
      batch_id: e.batch_id,
      enrollment_status: e.enrollment_status,
      status: e.status || e.enrollment_status,
      created_at: e.created_at,
    }));

    const accessContext = evaluateAccessContext(user, profile, rawEnrollments);
    const courseAccess = accessContext.courses[courseSlug];

    if (!courseAccess || (!courseAccess.canAccessFullCourse && !courseAccess.canAccessFreePreview)) {
      return NextResponse.json({ error: 'Not authorized for this course' }, { status: 403 });
    }

    // Find enrollment record to update
    const existingEnrollment = (enrollmentsRes.data || []).find((e: any) => {
      const c = normalizeCourseSlug(e.course_id);
      return c === courseSlug;
    });

    if (existingEnrollment) {
      // Update batch_id
      await admin
        .from('enrollments')
        .update({ batch_id: batch.id, updated_at: new Date().toISOString() })
        .eq('id', existingEnrollment.id);
    } else {
      // Insert enrollment row with new batch_id
      await admin.from('enrollments').insert({
        student_id: user.id,
        course_id: courseSlug,
        batch_id: batch.id,
        enrollment_status: 'FREE_PREVIEW',
        total_price: 0,
        amount_paid: 0,
        remaining_amount: 0,
      });
    }

    // Send in-app notification confirming batch switch
    await admin.from('notifications').insert({
      user_id: user.id,
      title: `Batch Switched: ${batch.title}`,
      message: `You have successfully switched your active batch cohort to "${batch.title}". Live class schedules and reminders have updated.`,
      type: 'batch_switched',
      action_url: '/live-classes',
      is_read: false,
    });

    return NextResponse.json({
      success: true,
      message: `Batch successfully switched to ${batch.title}`,
      batch: {
        id: batch.id,
        title: batch.title,
        slug: batch.slug,
      },
    });
  } catch (err: any) {
    console.error('Batch switch error:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
