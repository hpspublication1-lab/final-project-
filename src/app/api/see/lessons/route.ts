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
          const raw = (v.title || '').replace(/\.mp4$/i, '').trim();
          const t = raw.toLowerCase();

          let slug = 'physics';
          let chapter = 'Unit 1: Force & Gravitation';

          // 1. Optional Math
          if (/^see-om/i.test(t) || /om-em/i.test(t) || t.includes('opt math') || t.includes('continuity') || t.includes('polynomial') || t.includes('vector geometry') || t.includes('determinant') || t.includes('linear programming') || t.includes('sequences and series')) {
            slug = 'opt_math';
            if (t.includes('continuity')) chapter = 'Unit 2: Limits & Continuity';
            else if (t.includes('matrix') || t.includes('determinant')) chapter = 'Unit 3: Matrices & Determinants';
            else if (t.includes('trigonometry') || t.includes('height and distance') || t.includes('trig')) chapter = 'Unit 5: Trigonometry';
            else if (t.includes('vector')) chapter = 'Unit 6: Vector Geometry';
            else if (t.includes('transformation') || t.includes('inversion')) chapter = 'Unit 7: Transformation';
            else if (t.includes('statistics') || t.includes('deviation') || t.includes('dispersion')) chapter = 'Unit 8: Statistics';
            else chapter = 'Unit 1: Functions, Polynomials & Sequences';
          }
          // 2. Compulsory Math
          else if (/^see-cm/i.test(t) || t.includes('compound interest') || t.includes('money exchange') || t.includes('pyramid') || t.includes('cone') || t.includes('solid') || t.includes('cost estimation') || t.includes('quadratic equation') || t.includes('probability') || (t.startsWith('u1 set') || t.startsWith('u1 p') || t.startsWith('u2 arithmetic'))) {
            slug = 'math';
            if (t.includes('set')) chapter = 'Unit 1: Sets (समूह)';
            else if (t.includes('pyramid') || t.includes('cone') || t.includes('solid') || t.includes('cost estimation') || t.includes('mensuration')) chapter = 'Unit 3: Mensuration & Solids (क्षेत्रमिति)';
            else if (t.includes('quadratic') || t.includes('algebra')) chapter = 'Unit 4: Algebra & Quadratic Equations (बीजगणित)';
            else if (t.includes('probability')) chapter = 'Unit 6: Probability & Statistics (सम्भाव्यता)';
            else chapter = 'Unit 2: Arithmetic & Money Exchange (अङ्कगणित)';
          }
          // 3. Science & Technology
          else if (/^see-s&t/i.test(t) || /^hrt\s*u/i.test(t) || t.includes('science') || t.includes('transformer') || t.includes('periodic table') || t.includes('metals') || t.includes('some gases') || t.includes('chemical') || t.includes('radical') || t.includes('gravit') || t.includes('blood') || t.includes('mitosis') || t.includes('dna') || t.includes('physiological') || t.includes('kinematics') || t.includes('organic reaction') || t.includes('genetics')) {
            slug = 'physics';
            if (t.includes('mitosis') || t.includes('cell division') || t.includes('dna') || t.includes('genetics')) chapter = 'Unit 4: Heredity & Cell Biology';
            else if (t.includes('blood') || t.includes('physiological') || t.includes('life process')) chapter = 'Unit 5: Physiological Structure & Life Processes';
            else if (t.includes('transformer') || t.includes('electricity') || t.includes('magnetism') || t.includes('hrt u4')) chapter = 'Unit 7: Current Electricity & Magnetism';
            else if (t.includes('periodic table') || t.includes('block') || t.includes('hrt u5')) chapter = 'Unit 14: Modern Periodic Table & Classification';
            else if (t.includes('radical') || t.includes('reaction') || t.includes('displacenent') || t.includes('displacement')) chapter = 'Unit 15: Chemical Reactions & Radicals';
            else if (t.includes('gases') || t.includes('gas')) chapter = 'Unit 16: Atmospheric Gases (CO₂, NH₃)';
            else if (t.includes('metals') || t.includes('metal')) chapter = 'Unit 17: Metals & Metallurgy';
            else if (t.includes('chemical used in daily') || t.includes('daily life')) chapter = 'Unit 19: Applied Chemicals in Daily Life';
            else chapter = 'Unit 1: Force & Gravitation';
          }
          // 4. English
          else if (/^q[\.\s\d]/i.test(t) || t.includes('writing') || t.includes('unseen') || t.includes('adjective') || t.includes('grammar') || t.includes('modals') || t.includes('pronoun') || t.includes('story') || t.includes('drama') || t.includes('poem') || t.includes('olympic') || t.includes('driverless') || t.includes('cabbage') || t.includes('wisdom')) {
            slug = 'english';
            if (t.includes('writing') || t.includes('essay') || t.includes('diary')) chapter = 'Free Writing & Composition';
            else if (t.includes('unseen') || t.includes('passage') || t.includes('editorial') || t.includes('report') || t.includes('driverless') || t.includes('olympic')) chapter = 'Reading Comprehension & Passages';
            else if (t.includes('story') || t.includes('drama') || t.includes('poem') || t.includes('wisdom') || t.includes('cabbage') || t.includes('farmer')) chapter = 'Literature, Stories & Poems';
            else chapter = 'Grammar & Language Structures';
          }
          // 5. Social Studies
          else if (/^so\s/i.test(t) || t.includes('social') || t.includes('samajik')) {
            slug = 'social';
            if (t.includes('u5')) chapter = 'Unit 5: Civic Awareness & Governance';
            else if (t.includes('u6')) chapter = 'Unit 6: Economic Development';
            else if (t.includes('l3')) chapter = 'Unit 8: Geography & Climate';
            else chapter = 'Unit 7: International Affairs & Contemporary World';
          }

          // Clean title
          let cleanTitle = raw;
          cleanTitle = cleanTitle.replace(/^SEE-S&T-[A-Z]+-U(\d+)-P(\d+)-?/i, 'Unit $1 Part $2: ');
          cleanTitle = cleanTitle.replace(/^SEE-S&T-EM-[A-Z]+-U(\d+)-P(\d+)\(?/i, 'Unit $1 Part $2: ');
          cleanTitle = cleanTitle.replace(/^SEE-OM-EM-[A-Z]+-U(\d+)-L(\d+)-V(\d+)-?/i, 'Unit $1 Lesson $2: ');
          cleanTitle = cleanTitle.replace(/^SEE-OM-EM-[A-Z]+-U(\d+)-V(\d+)-?/i, 'Unit $1 Part $2: ');
          cleanTitle = cleanTitle.replace(/^SEE-OM-EM-[A-Z]+-U(\d+)-P(\d+)-?/i, 'Unit $1 Part $2: ');
          cleanTitle = cleanTitle.replace(/^SEE-OM-EM-\s*[A-Z]+-U(\d+)-P(\d+)-?/i, 'Unit $1 Part $2: ');
          cleanTitle = cleanTitle.replace(/^SEE-CM-[A-Z]+-U(\d+)-L(\d+)-V(\d+)-?/i, 'Unit $1 Lesson $2: ');
          cleanTitle = cleanTitle.replace(/^SO\s+U(\d+)\s+L(\d+)\s+/i, 'Unit $1: ');
          cleanTitle = cleanTitle.replace(/^SO\s+U(\d+)\s+P(\d+)\s+/i, 'Unit $1 Part $2: ');
          cleanTitle = cleanTitle.replace(/^SO\s+L(\d+)\s+V(\d+)\s*/i, 'Lesson $1 Video $2: ');
          cleanTitle = cleanTitle.replace(/^HRT\s+U(\d+)\s+P(\d+)\s*(V\d+)?/i, 'Unit $1 Part $2: ');
          cleanTitle = cleanTitle.replace(/^Q\.?\s*NO\s*(\d+)\s*/i, 'Q$1: ');
          cleanTitle = cleanTitle.replace(/^Q(\d+)\s*-\s*EM\s*-\s*[A-Z]+\s*-\s*/i, 'Q$1: ');
          cleanTitle = cleanTitle.replace(/^Q(\d+)\s*-\s*STORY\s*-\s*V\s*(\d+)\s*-\s*/i, 'Q$1 Story (Video $2): ');
          cleanTitle = cleanTitle.replace(/_1$|_new$|_001_new$|_002_new$|_NEW01$/i, '');
          cleanTitle = cleanTitle.replace(/\s+/g, ' ').trim();
          cleanTitle = cleanTitle.replace(/\s*:\s*$/, '');

          return {
            id: v.id,
            course_id: 'see_class_10',
            subject_slug: slug,
            chapter_name: chapter,
            title: cleanTitle,
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
