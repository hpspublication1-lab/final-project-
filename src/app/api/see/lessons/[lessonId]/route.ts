import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { getSessionUser } from '@/lib/supabase/route-auth';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ lessonId: string }> }
) {
  try {
    const { lessonId } = await context.params;
    if (!lessonId) {
      return NextResponse.json({ error: 'Missing lesson ID' }, { status: 400 });
    }

    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in to view this lesson.' },
        { status: 401 }
      );
    }

    const admin = createAdminClient();

    // 1. Fetch lesson details
    const { data: lesson, error: lessonError } = await admin
      .from('see_lessons')
      .select('*')
      .eq('id', lessonId)
      .eq('is_published', true)
      .maybeSingle();

    if (lessonError || !lesson) {
      return NextResponse.json({ error: 'Lesson not found or unavailable' }, { status: 404 });
    }

    // 2. Server-side anti-bypass check for paid content
    let hasAccess = lesson.is_free === true;

    if (!hasAccess) {
      // Check if user is admin
      const { data: profile } = await admin
        .from('user_profiles')
        .select('is_admin, subscription_plan, subscription_expires_at')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.is_admin === true) {
        hasAccess = true;
      } else if (
        profile?.subscription_plan &&
        profile.subscription_plan !== 'free' &&
        (!profile.subscription_expires_at || new Date(profile.subscription_expires_at) > new Date())
      ) {
        hasAccess = true;
      } else {
        // Check enrollments table for see_class_10
        const { data: enrollment } = await admin
          .from('enrollments')
          .select('id, status, plan_tier')
          .eq('user_id', user.id)
          .eq('program_id', 'see_class_10')
          .eq('status', 'active')
          .maybeSingle();

        if (enrollment) {
          hasAccess = true;
        } else {
          // Check course_orders table for paid status
          const { data: paidOrder } = await admin
            .from('course_orders')
            .select('id')
            .eq('user_id', user.id)
            .eq('course_id', 'see_class_10')
            .eq('status', 'paid')
            .maybeSingle();

          if (paidOrder) {
            hasAccess = true;
          }
        }
      }
    }

    if (!hasAccess) {
      return NextResponse.json(
        {
          error: 'This is a premium SEE Class 10 lesson. Please enroll to unlock the full course.',
          isLocked: true,
          lesson: {
            id: lesson.id,
            title: lesson.title,
            description: lesson.description,
            thumbnail_url: lesson.thumbnail_url,
            duration_sec: lesson.duration_sec,
            is_free: false,
          },
        },
        { status: 403 }
      );
    }

    // 3. Retrieve user watch progress / last position
    const { data: progress } = await admin
      .from('user_video_progress')
      .select('watched_seconds, total_duration_sec, percentage, is_completed')
      .eq('user_id', user.id)
      .eq('lesson_id', lesson.id)
      .maybeSingle();

    // 4. Sign video URL if token configured
    let signedVideoUrl = lesson.video_url || '';
    const tokenKey = process.env.BUNNY_TOKEN_KEY;

    if (signedVideoUrl && tokenKey && signedVideoUrl.includes('.b-cdn.net')) {
      try {
        const url = new URL(signedVideoUrl);
        const dirPath = url.pathname.substring(0, url.pathname.lastIndexOf('/') + 1);
        const expires = Math.floor(Date.now() / 1000) + 60 * 60 * 4; // 4 hour expiry

        const hashBase = tokenKey + dirPath + expires;
        const token = crypto
          .createHash('sha256')
          .update(hashBase)
          .digest('base64')
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');

        signedVideoUrl = `${url.origin}${url.pathname}?token=${token}&expires=${expires}&token_path=${encodeURIComponent(dirPath)}`;
      } catch (err) {
        console.warn('Bunny token signing fallback:', err);
      }
    }

    // 5. Fetch previous and next lesson in same chapter or subject
    const { data: adjacentLessons } = await admin
      .from('see_lessons')
      .select('id, title, lesson_order')
      .eq('subject_slug', lesson.subject_slug)
      .eq('is_published', true)
      .order('lesson_order', { ascending: true });

    const allInSub = adjacentLessons || [];
    const currentIndex = allInSub.findIndex((l) => l.id === lesson.id);
    const prevLesson = currentIndex > 0 ? allInSub[currentIndex - 1] : null;
    const nextLesson = currentIndex >= 0 && currentIndex < allInSub.length - 1 ? allInSub[currentIndex + 1] : null;

    return NextResponse.json({
      lesson: {
        ...lesson,
        video_url: signedVideoUrl,
      },
      progress: progress || {
        watched_seconds: 0,
        percentage: 0,
        is_completed: false,
      },
      navigation: {
        prevLesson,
        nextLesson,
      },
    });
  } catch (err: any) {
    console.error('API /api/see/lessons/[id] error:', err);
    return NextResponse.json({ error: 'Failed to load lesson', details: err?.message }, { status: 500 });
  }
}
