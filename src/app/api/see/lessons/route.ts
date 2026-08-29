import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getSessionUser } from '@/lib/supabase/route-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    const admin = createAdminClient();
    if (!admin) {
      return NextResponse.json({ lessons: [], subjects: [] });
    }
    const { searchParams } = new URL(request.url);
    const subjectSlug = searchParams.get('subject');
    const chapterName = searchParams.get('chapter');

    // Fetch lessons from see_lessons or fallback to video_lectures
    let lessons: any[] = [];
    const { data: seeData, error: seeErr } = await admin
      .from('see_lessons')
      .select('*')
      .eq('is_published', true)
      .order('lesson_order', { ascending: true });

    if (!seeErr && seeData && seeData.length > 0) {
      lessons = seeData;
    } else {
      // Fallback: Query all Bunny.net synced video_lectures
      const { data: vids, error: vidErr } = await admin
        .from('video_lectures')
        .select('*')
        .eq('is_active', true);

      if (vids && vids.length > 0) {
        lessons = vids.map((v: any, idx: number) => {
          const t = (v.title || '').toLowerCase();
          let slug = 'physics';
          let chapter = 'General Science';

          if (t.includes('see-om') || t.includes('continuity') || t.includes('vector') || t.includes('calculus') || t.includes('matrix') || t.includes('trigonometry') || t.includes('opt math')) {
            slug = 'opt_math';
            chapter = t.includes('continuity') ? 'Continuity & Limits' : t.includes('vector') ? 'Vector Geometry' : 'Optional Mathematics Core';
          } else if (t.includes('compound interest') || t.includes('probability') || t.includes('arithmetic') || t.includes('geometry') || t.includes('math')) {
            slug = 'math';
            chapter = t.includes('compound interest') ? 'Compound Interest & Depreciation' : t.includes('probability') ? 'Probability & Statistics' : 'Compulsory Mathematics Core';
          } else if (t.includes('periodic table') || t.includes('block') || t.includes('chemistry')) {
            slug = 'chemistry';
            chapter = 'Modern Periodic Table & Chemical Reactions';
          } else if (t.includes('transformer') || t.includes('force') || t.includes('gravity') || t.includes('physics') || t.includes('kinematics')) {
            slug = 'physics';
            chapter = t.includes('transformer') ? 'Electricity & Magnetism' : 'Force & Gravitation';
          } else if (t.includes('genetics') || t.includes('biology')) {
            slug = 'biology';
            chapter = 'Heredity & Genetics';
          } else if (t.includes('q.no') || t.includes('q1') || t.includes('writing') || t.includes('unseen') || t.includes('adjective') || t.includes('drama') || t.includes('story') || t.includes('english')) {
            slug = 'english';
            chapter = t.includes('writing') ? 'Free Writing & Essays' : t.includes('unseen') ? 'Reading Comprehension' : 'Grammar & Vocabulary';
          } else if (t.includes('so u') || t.includes('so l') || t.includes('social')) {
            slug = 'social';
            chapter = 'Social Studies & Contemporary Society';
          } else if (t.includes('nepali')) {
            slug = 'nepali';
            chapter = 'Nepali Language & Literature';
          }

          return {
            id: v.id,
            course_id: 'see_class_10',
            subject_slug: slug,
            chapter_name: chapter,
            title: v.title.replace(/\.mp4$/i, '').trim(),
            description: v.description || `HD Video Lecture (${Math.round((v.duration_sec || 0)/60)} mins)`,
            video_url: v.video_url,
            thumbnail_url: v.thumbnail_url,
            duration_sec: v.duration_sec || 900,
            lesson_order: idx + 1,
            is_free: idx < 3,
            is_published: true,
          };
        });
      }
    }

    if (subjectSlug && subjectSlug !== 'all') {
      lessons = lessons.filter((l: any) => l.subject_slug === subjectSlug);
    }
    if (chapterName) {
      lessons = lessons.filter((l: any) => l.chapter_name === chapterName);
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
