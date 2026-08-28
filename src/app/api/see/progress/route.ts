import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getSessionUser } from '@/lib/supabase/route-auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      lessonId,
      courseId = 'see_class_10',
      watchedSeconds,
      totalDurationSec,
      isCompleted,
    } = await request.json();

    if (!lessonId) {
      return NextResponse.json({ error: 'Missing lessonId' }, { status: 400 });
    }

    const watched = Math.max(0, Math.floor(Number(watchedSeconds) || 0));
    const total = Math.max(0, Math.floor(Number(totalDurationSec) || 0));
    const percentage = total > 0 ? Math.min(100, Math.round((watched / total) * 100)) : 0;
    const completed = isCompleted === true || percentage >= 90;

    const admin = createAdminClient();

    const { data, error } = await admin
      .from('user_video_progress')
      .upsert(
        {
          user_id: user.id,
          course_id: courseId,
          lesson_id: lessonId,
          watched_seconds: watched,
          total_duration_sec: total,
          percentage,
          is_completed: completed,
          last_watched_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,lesson_id' }
      )
      .select()
      .single();

    if (error) {
      console.error('user_video_progress upsert error:', error.message);
      return NextResponse.json({ error: 'Could not save progress', details: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      progress: {
        lessonId,
        watchedSeconds: watched,
        totalDurationSec: total,
        percentage,
        isCompleted: completed,
        lastWatchedAt: data?.last_watched_at,
      },
    });
  } catch (err: any) {
    console.error('API /api/see/progress error:', err);
    return NextResponse.json({ error: 'Failed to record watch progress', details: err?.message }, { status: 500 });
  }
}
