import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getSessionUser } from '@/lib/supabase/route-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    const admin = createAdminClient();
    const { searchParams } = new URL(request.url);
    const subjectSlug = searchParams.get('subject');
    const chapterName = searchParams.get('chapter');

    // Fetch lessons from see_lessons or fallback to video_lectures
    let query = admin
      .from('see_lessons')
      .select('*')
      .eq('is_published', true)
      .order('lesson_order', { ascending: true });

    if (subjectSlug && subjectSlug !== 'all') {
      query = query.eq('subject_slug', subjectSlug);
    }

    if (chapterName) {
      query = query.eq('chapter_name', chapterName);
    }

    const { data: lessons, error } = await query;

    if (error || !lessons) {
      console.warn('see_lessons query error or empty, using fallback:', error?.message);
      return NextResponse.json({ lessons: [], subjects: [] });
    }

    // If user is authenticated, fetch their watch progress for all lessons
    let userProgressMap: Record<string, { watchedSeconds: number; percentage: number; isCompleted: boolean }> = {};
    if (user?.id) {
      const { data: progressRows } = await admin
        .from('user_video_progress')
        .select('lesson_id, watched_seconds, percentage, is_completed')
        .eq('user_id', user.id);

      (progressRows || []).forEach((row) => {
        userProgressMap[row.lesson_id] = {
          watchedSeconds: row.watched_seconds || 0,
          percentage: row.percentage || 0,
          isCompleted: row.is_completed || false,
        };
      });
    }

    // Group into subjects and chapters
    const subjectsMap: Record<string, any> = {
      physics: { slug: 'physics', name: 'Physics (Science)', icon: '⚡', chapters: {} },
      chemistry: { slug: 'chemistry', name: 'Chemistry (Science)', icon: '🧪', chapters: {} },
      biology: { slug: 'biology', name: 'Biology & Astronomy', icon: '🔬', chapters: {} },
      math: { slug: 'math', name: 'Compulsory Mathematics', icon: '📐', chapters: {} },
      opt_math: { slug: 'opt_math', name: 'Optional Mathematics', icon: '📊', chapters: {} },
      english: { slug: 'english', name: 'English (Reading & Writing)', icon: '📚', chapters: {} },
      nepali: { slug: 'nepali', name: 'Compulsory Nepali', icon: '🇳🇵', chapters: {} },
      social: { slug: 'social', name: 'Social Studies & Life Skills', icon: '🌍', chapters: {} },
    };

    const enrichedLessons = lessons.map((lesson) => {
      const prog = userProgressMap[lesson.id] || { watchedSeconds: 0, percentage: 0, isCompleted: false };
      const subSlug = lesson.subject_slug || 'physics';

      if (!subjectsMap[subSlug]) {
        subjectsMap[subSlug] = {
          slug: subSlug,
          name: subSlug.toUpperCase(),
          icon: '📖',
          chapters: {},
        };
      }

      const chName = lesson.chapter_name || 'General';
      if (!subjectsMap[subSlug].chapters[chName]) {
        subjectsMap[subSlug].chapters[chName] = {
          name: chName,
          lessons: [],
        };
      }

      const lessonData = {
        ...lesson,
        watchedSeconds: prog.watchedSeconds,
        percentage: prog.percentage,
        isCompleted: prog.isCompleted,
      };

      subjectsMap[subSlug].chapters[chName].lessons.push(lessonData);

      return lessonData;
    });

    const structuredSubjects = Object.values(subjectsMap).map((sub: any) => ({
      slug: sub.slug,
      name: sub.name,
      icon: sub.icon,
      chapters: Object.values(sub.chapters),
    }));

    return NextResponse.json({
      lessons: enrichedLessons,
      subjects: structuredSubjects,
    });
  } catch (err: any) {
    console.error('API /api/see/lessons error:', err);
    return NextResponse.json({ error: 'Failed to fetch SEE lessons', details: err?.message }, { status: 500 });
  }
}
