import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      lessonId,
      courseSlug = 'cee_medical',
      chapterId,
      subjectId,
      watchedSeconds = 0,
      lastPlaybackPosition = 0,
      totalDurationSec = 0,
      isCompleted = false,
    } = body;

    if (!lessonId) {
      return NextResponse.json({ error: 'Missing lessonId' }, { status: 400 });
    }

    const watched = Math.max(0, Math.floor(Number(watchedSeconds) || Number(lastPlaybackPosition) || 0));
    const total = Math.max(0, Math.floor(Number(totalDurationSec) || 0));
    const percentage = total > 0 ? Math.min(100, Math.round((watched / total) * 100)) : 0;
    const completed = isCompleted === true || percentage >= 90;

    const admin = createAdminClient() || supabase;
    const nowIso = new Date().toISOString();

    // 1. Sync with topic_mastery if chapterId is present
    if (chapterId) {
      const { data: existingMastery } = await admin
        .from('topic_mastery')
        .select('id, mastery_score')
        .eq('student_id', user.id)
        .eq('chapter_id', chapterId)
        .maybeSingle();

      if (existingMastery) {
        const newScore = completed ? Math.max(existingMastery.mastery_score, 90) : existingMastery.mastery_score;
        await admin
          .from('topic_mastery')
          .update({
            last_practiced_at: nowIso,
            mastery_score: newScore,
            updated_at: nowIso,
          })
          .eq('id', existingMastery.id);
      } else {
        await admin.from('topic_mastery').insert({
          student_id: user.id,
          chapter_id: chapterId,
          subject_id: subjectId || null,
          mastery_score: completed ? 90 : percentage,
          accuracy: 100,
          mastery_level: completed ? 'strong' : 'developing',
          last_practiced_at: nowIso,
        });
      }
    }

    // 2. Sync with user_video_progress
    try {
      await admin
        .from('user_video_progress')
        .upsert(
          {
            user_id: user.id,
            course_id: courseSlug,
            lesson_id: lessonId,
            watched_seconds: watched,
            total_duration_sec: total,
            percentage,
            is_completed: completed,
            last_watched_at: nowIso,
          },
          { onConflict: 'user_id,lesson_id' }
        );
    } catch {
      // Graceful fallback if user_video_progress table has schema cache variance
    }

    return NextResponse.json({
      success: true,
      lessonId,
      watchedSeconds: watched,
      lastPlaybackPosition: watched,
      percentage,
      isCompleted: completed,
      lastWatchedAt: nowIso,
    });
  } catch (err: any) {
    console.error('learn/progress POST error:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const lessonId = searchParams.get('lessonId');
    const admin = createAdminClient() || supabase;

    // A. Specific Lesson Request
    if (lessonId) {
      try {
        const { data: progress } = await admin
          .from('user_video_progress')
          .select('*')
          .eq('user_id', user.id)
          .eq('lesson_id', lessonId)
          .maybeSingle();

        if (progress) {
          return NextResponse.json({
            lessonId,
            watchedSeconds: progress.watched_seconds,
            lastPlaybackPosition: progress.watched_seconds,
            totalDurationSec: progress.total_duration_sec,
            percentage: progress.percentage,
            isCompleted: progress.is_completed,
            lastWatchedAt: progress.last_watched_at,
          });
        }
      } catch {
        // Fallback
      }

      return NextResponse.json({
        lessonId,
        watchedSeconds: 0,
        lastPlaybackPosition: 0,
        totalDurationSec: 0,
        percentage: 0,
        isCompleted: false,
      });
    }

    // B. Course / User-Wide Progress Summary Request
    const courseSlug = searchParams.get('courseSlug') || 'cee_medical';

    let uvpList: any[] = [];
    try {
      const { data } = await admin
        .from('user_video_progress')
        .select('*')
        .eq('user_id', user.id)
        .order('last_watched_at', { ascending: false });
      uvpList = data || [];
    } catch {}

    const [masteryRes, subjectsRes, chaptersRes] = await Promise.all([
      admin.from('topic_mastery').select('*').eq('student_id', user.id),
      admin.from('subjects').select('id, name, display_name, slug').eq('is_active', true),
      admin.from('chapters').select('id, subject_id, title, sort_order').eq('is_active', true),
    ]);

    const masteryList = masteryRes.data || [];
    const allSubjects = subjectsRes.data || [];
    const allChapters = chaptersRes.data || [];

    // Filter by program
    const isSee = courseSlug.includes('see');
    let targetSubjects = allSubjects;
    if (isSee) {
      const seeOnly = allSubjects.filter((s: any) => (s.slug || '').toLowerCase().includes('see') || (s.name || '').toLowerCase().includes('see'));
      if (seeOnly.length > 0) targetSubjects = seeOnly;
    }
    const targetSubjectIds = new Set(targetSubjects.map((s: any) => s.id));
    const targetChapters = allChapters.filter((c: any) => targetSubjectIds.has(c.subject_id));

    // Chapter Progress
    const chapterProgress: Record<string, { masteryScore: number; isCompleted: boolean; lastPracticedAt: string | null }> = {};
    masteryList.forEach((m: any) => {
      chapterProgress[m.chapter_id] = {
        masteryScore: m.mastery_score || 0,
        isCompleted: (m.mastery_score || 0) >= 80,
        lastPracticedAt: m.last_practiced_at,
      };
    });

    // Subject Progress
    const subjectProgress: Record<string, { totalChapters: number; completedChapters: number; percentage: number }> = {};
    targetSubjects.forEach((sub: any) => {
      const subChapters = targetChapters.filter((c: any) => c.subject_id === sub.id);
      const completed = subChapters.filter((c: any) => (chapterProgress[c.id]?.masteryScore || 0) >= 80).length;
      const pct = subChapters.length > 0 ? Math.round((completed / subChapters.length) * 100) : 0;

      subjectProgress[sub.id] = {
        totalChapters: subChapters.length,
        completedChapters: completed,
        percentage: pct,
      };
    });

    // Completed Lessons List
    const completedLessons: string[] = uvpList.filter((p: any) => p.is_completed).map((p: any) => p.lesson_id);
    const totalWatchedDuration = uvpList.reduce((acc: number, p: any) => acc + (p.watched_seconds || 0), 0);

    // Last Accessed Lesson
    const latestUvp = uvpList[0];
    let lastAccessedLesson = null;
    if (latestUvp) {
      lastAccessedLesson = {
        lessonId: latestUvp.lesson_id,
        courseId: latestUvp.course_id,
        lastPlaybackPosition: latestUvp.watched_seconds,
        lastWatchedAt: latestUvp.last_watched_at,
        isCompleted: latestUvp.is_completed,
      };
    }

    return NextResponse.json({
      success: true,
      userId: user.id,
      courseSlug,
      totalWatchedDuration,
      completedLessonsCount: completedLessons.length,
      completedLessons,
      lastAccessedLesson,
      subjectProgress,
      chapterProgress,
    });
  } catch (err: any) {
    console.error('learn/progress GET error:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
