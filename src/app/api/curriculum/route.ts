import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  evaluateAccessContext,
  RawUserProfile,
  RawEnrollment,
} from '@/lib/auth/accessControl';
import { CanonicalCourseSlug } from '@/types/lms';
import { COURSE_TITLES, parseCourseId, resolveRowCourse, strictCourseIsolation } from '@/lib/courses/courseIds';
import { withProgramType } from '@/lib/courses/programColumn';

export const dynamic = 'force-dynamic';

const curriculumCache = new Map<string, { payload: any; exp: number }>();
const CURRICULUM_CACHE_TTL_MS = 60_000;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    // A missing course still means CEE (older callers omit it); an unknown one is an
    // error. It used to become CEE too, which is how other courses got CEE content.
    const rawCourse = searchParams.get('course');
    const parsedCourse = rawCourse ? parseCourseId(rawCourse) : 'cee_medical';
    if (!parsedCourse) {
      return NextResponse.json(
        { success: false, error: `Unknown course "${String(rawCourse).slice(0, 40)}".`, subjects: [] },
        { status: 400 }
      );
    }
    const courseSlug = parsedCourse as CanonicalCourseSlug;
    const batchIdParam = searchParams.get('batchId');
    const lessonIdParam = searchParams.get('lessonId');

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const cacheKey = `${user?.id || 'anon'}:${courseSlug}:${batchIdParam || 'def'}:${lessonIdParam || 'def'}`;
    const cached = curriculumCache.get(cacheKey);
    if (cached && Date.now() < cached.exp) {
      return NextResponse.json(cached.payload, {
        headers: {
          'Cache-Control': 'private, max-age=30, stale-while-revalidate=120',
          'X-Curriculum-Cache': 'HIT',
        },
      });
    }

    const admin = createAdminClient() || supabase;

    // 1. Authoritative access control check
    let isEnrolled = false;
    let isPrivileged = false;
    let userAccess = null;
    let accessCtx: ReturnType<typeof evaluateAccessContext> | null = null;

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

      accessCtx = evaluateAccessContext(user, profile, rawEnrollments);
      userAccess = accessCtx.courses[courseSlug];
      isEnrolled = Boolean(userAccess?.canAccessFullCourse);
      isPrivileged = accessCtx.role === 'super_administrator' || accessCtx.role === 'administrator' || accessCtx.role === 'teacher';
    }

    const hasAccess = isPrivileged || isEnrolled;
    const nowIso = new Date().toISOString();

    // 2. Fetch batches for this course
    // program_type only where the live table has it (see programColumn.ts).
    const { data: allBatches, error: batchErr } = await admin
      .from('batches')
      .select(await withProgramType(admin, 'batches', 'id, title, slug, start_date, end_date, price_npr, is_premium, is_active, instructor_name'))
      .eq('is_active', true);
    if (batchErr) console.error('[curriculum] batches query failed:', batchErr.message);

    // Each batch belongs to the course resolveRowCourse() places it in. Before:
    // CEE took any title with "biology" or "chemistry", AI any title containing
    // the letters "ai" ("Main Batch"), and every other course took every batch.
    const trackBatches = (allBatches || []).filter((b: any) => resolveRowCourse(b) === courseSlug);

    // No batch is better than an invented one (it used to be "Target CEE 2026
    // Super Batch", "Samyak Senior Faculty", Rs 7,990).
    const activeBatch =
      (batchIdParam ? trackBatches.find((b: any) => b.id === batchIdParam) : null) || trackBatches[0] || null;

    // 3. Fetch subjects for this course
    const { data: allSubs, error: subjectErr } = await admin
      .from('subjects')
      .select(await withProgramType(admin, 'subjects', 'id, name, display_name, slug, sort_order, is_active'))
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    if (subjectErr) console.error('[curriculum] subjects query failed:', subjectErr.message);

    // Only this course's subjects. Before, every course except SEE received every
    // program's subjects (and their videos and notes), and SEE fell back to all of
    // them — CEE's included — whenever it had none of its own.
    const subjects = (allSubs || []).filter((s: any) => resolveRowCourse(s) === courseSlug);

    // 4. Fetch chapters
    const subjectIds = (subjects || []).map((s: any) => s.id);
    const { data: chapters } = subjectIds.length === 0 ? { data: [] as any[] } : await admin
      .from('chapters')
      .select('id, subject_id, title, description, sort_order, is_premium, is_active')
      .in('subject_id', subjectIds)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    // 5. Fetch video lectures for these subjects
    const strict = strictCourseIsolation();
    const ownRow = (r: any) => !strict || resolveRowCourse(r) === courseSlug;
    const { data: videoRows } = subjectIds.length
      ? await admin
          .from('video_lectures')
          .select(await withProgramType(admin, 'video_lectures', 'id, title, description, video_url, thumbnail_url, duration_sec, subject_id, chapter_id, is_premium, is_active, created_at'))
          .in('subject_id', subjectIds)
          .eq('is_active', true)
          .order('created_at', { ascending: true })
      : { data: [] as any[] };
    const videos = (videoRows || []).filter(ownRow);

    // 6. Fetch notes for these subjects
    const { data: noteRows } = subjectIds.length
      ? await admin
          .from('notes')
          .select(await withProgramType(admin, 'notes', 'id, title, content, pdf_url, subject_id, chapter_id, is_premium, is_active, created_at'))
          .in('subject_id', subjectIds)
          .eq('is_active', true)
      : { data: [] as any[] };
    const notes = (noteRows || []).filter(ownRow);

    // 7. Fetch user mastery / completed chapters if logged in
    let masteryMap: Record<string, number> = {};
    if (user) {
      const { data: masteryRows } = await admin
        .from('topic_mastery')
        .select('chapter_id, mastery_score')
        .eq('student_id', user.id);

      (masteryRows || []).forEach((m: any) => {
        if (m.chapter_id) masteryMap[m.chapter_id] = Number(m.mastery_score) || 0;
      });
    }

    // Chapters that actually have published questions. Every chapter used to get a
    // "High-Yield Mastery Quiz" (with an invented 15-minute length), even with none.
    const chapterIdList = (chapters || []).map((c: any) => c.id);
    const { data: quizRows, error: quizErr } = chapterIdList.length
      ? await admin.from('questions').select('chapter_id').in('chapter_id', chapterIdList).eq('is_published', true).limit(50000)
      : { data: [] as any[], error: null };
    if (quizErr) console.error('[curriculum] question count failed:', quizErr.message);
    // If the count failed, keep the quizzes as before rather than hide real ones.
    const chapterHasQuiz = (id: string) => Boolean(quizErr) || (quizRows || []).some((q: any) => q.chapter_id === id);

    // Grouping by Subject -> Unit -> Chapter -> Lessons
    const structuredSubjects = (subjects || []).map((subject: any) => {
      const subChapters = (chapters || []).filter((c: any) => c.subject_id === subject.id);
      
      // Pedagogical Unit mapping: group chapters into units
      const unitsMap: Record<string, { id: string; title: string; order: number; chapters: any[] }> = {};

      subChapters.forEach((chap: any, idx: number) => {
        const unitNum = Math.floor(idx / 4) + 1;
        const unitId = `unit-${subject.id}-${unitNum}`;
        const unitTitle = `Unit ${unitNum}: Core Foundations & Applications`;

        if (!unitsMap[unitId]) {
          unitsMap[unitId] = { id: unitId, title: unitTitle, order: unitNum, chapters: [] };
        }

        // Find lessons for this chapter
        // Only resources assigned to this chapter. Ones with no chapter used to be
        // shown inside the subject's first chapter; they now wait for an admin to
        // place them (the audit SQL lists them).
        const chapterVideos = (videos || []).filter((v: any) => v.chapter_id === chap.id);
        const chapterNotes = (notes || []).filter((n: any) => n.chapter_id === chap.id);

        const lessons: any[] = [];
        let order = 1;

        // Add Video Lessons
        chapterVideos.forEach((v: any) => {
          lessons.push({
            id: v.id,
            title: v.title,
            type: 'recorded_video',
            durationSec: v.duration_sec || undefined, // unknown length: show none (was an invented 30 min)
            videoUrl: v.video_url,
            thumbnailUrl: v.thumbnail_url,
            isPremium: v.is_premium,
            isLocked: v.is_premium && !hasAccess,
            isCompleted: (masteryMap[chap.id] || 0) >= 90,
            order: order++,
          });
        });

        // Add Text / PDF Lessons
        chapterNotes.forEach((n: any) => {
          lessons.push({
            id: n.id,
            title: n.title,
            type: n.pdf_url ? 'pdf_note' : 'text_lesson',
            pdfUrl: n.pdf_url,
            content: n.content,
            isPremium: n.is_premium,
            isLocked: n.is_premium && !hasAccess,
            isCompleted: (masteryMap[chap.id] || 0) >= 80,
            order: order++,
          });
        });

        // Chapter quiz, only when the chapter has published questions.
        if (chapterHasQuiz(chap.id)) {
          lessons.push({
            id: `quiz-${chap.id}`,
            title: `${chap.title} — High-Yield Mastery Quiz`,
            type: 'quiz',
            isPremium: chap.is_premium,
            isLocked: chap.is_premium && !hasAccess,
            isCompleted: (masteryMap[chap.id] || 0) >= 80,
            order: order++,
          });
        }

        // Subjective Assignment for SEE Class 10
        if (courseSlug === 'see_class_10') {
          lessons.push({
            id: `assign-${chap.id}`,
            title: `${chap.title} — Handwritten Board Model Paper Check`,
            type: 'assignment',
            isPremium: true,
            isLocked: !hasAccess,
            isCompleted: false,
            order: order++,
          });
        }

        const masteryScore = masteryMap[chap.id] || 0;

        unitsMap[unitId].chapters.push({
          id: chap.id,
          title: chap.title,
          description: chap.description,
          order: chap.sort_order || idx + 1,
          masteryScore,
          isCompleted: masteryScore >= 80,
          lessons,
        });
      });

      // Videos and notes filed under this subject but not in a chapter. They used to be
      // shown inside the subject's first chapter as if they belonged to it.
      const looseVideos = (videos || []).filter((v: any) => v.subject_id === subject.id && !v.chapter_id);
      const looseNotes = (notes || []).filter((n: any) => n.subject_id === subject.id && !n.chapter_id);
      if (looseVideos.length || looseNotes.length) {
        let order = 1;
        const lessons: any[] = [
          ...looseVideos.map((v: any) => ({
            id: v.id,
            title: v.title,
            type: 'recorded_video',
            durationSec: v.duration_sec || undefined,
            videoUrl: v.video_url,
            thumbnailUrl: v.thumbnail_url,
            isPremium: v.is_premium,
            isLocked: v.is_premium && !hasAccess,
            isCompleted: false,
            order: order++,
          })),
          ...looseNotes.map((n: any) => ({
            id: n.id,
            title: n.title,
            type: n.pdf_url ? 'pdf_note' : 'text_lesson',
            pdfUrl: n.pdf_url,
            content: n.content,
            isPremium: n.is_premium,
            isLocked: n.is_premium && !hasAccess,
            isCompleted: false,
            order: order++,
          })),
        ];
        const otherId = `other-${subject.id}`;
        unitsMap[`unit-${otherId}`] = {
          id: `unit-${otherId}`,
          title: 'Other materials',
          order: Number.MAX_SAFE_INTEGER,
          chapters: [{
            id: otherId,
            title: `More ${subject.display_name || subject.name} materials`,
            description: 'Not placed in a chapter yet.',
            order: Number.MAX_SAFE_INTEGER,
            masteryScore: 0,
            isCompleted: false,
            lessons,
          }],
        };
      }

      const units = Object.values(unitsMap).sort((a, b) => a.order - b.order);

      return {
        id: subject.id,
        name: subject.name,
        displayName: subject.display_name,
        units,
      };
    });

    // If specific lessonId requested, resolve adjacent navigation & active lesson payload
    let activeLessonPayload = null;
    if (lessonIdParam) {
      let foundLesson: any = null;
      let prevLesson: any = null;
      let nextLesson: any = null;

      const allFlatLessons: any[] = [];
      structuredSubjects.forEach((sub) => {
        sub.units.forEach((unit) => {
          unit.chapters.forEach((chap) => {
            chap.lessons.forEach((les: any) => {
              allFlatLessons.push({
                ...les,
                subjectId: sub.id,
                subjectDisplayName: sub.displayName,
                // "Other materials" is a section, not a chapter: no chapter id to record progress against.
                chapterId: String(chap.id).startsWith('other-') ? null : chap.id,
                chapterTitle: chap.title,
              });
            });
          });
        });
      });

      const currentIndex = allFlatLessons.findIndex((l) => l.id === lessonIdParam);
      if (currentIndex !== -1) {
        foundLesson = allFlatLessons[currentIndex];
        prevLesson = currentIndex > 0 ? allFlatLessons[currentIndex - 1] : null;
        nextLesson = currentIndex < allFlatLessons.length - 1 ? allFlatLessons[currentIndex + 1] : null;
      }

      // A lesson outside this course's list (a deep link, or one with no chapter):
      // look it up, find the course it actually belongs to, and check access
      // against THAT course. Before, it was unlocked by access to whatever course
      // was in the URL — an enrolment in one course opened premium lessons of any other.
      const lessonCourseAccess = (lessonSubject: any, lessonRow: any) => {
        const lessonCourse = resolveRowCourse(lessonSubject);
        if (!lessonCourse || (strictCourseIsolation() && resolveRowCourse(lessonRow) !== lessonCourse)) return null;
        const canAccess =
          isPrivileged || Boolean((accessCtx?.courses as any)?.[lessonCourse]?.canAccessFullCourse);
        return { lessonCourse, canAccess };
      };
      // A string variable, so the typed query parser doesn't try to read the embed.
      const lessonSelect: string = `*, subjects(${await withProgramType(admin, 'subjects', 'id, name, display_name, slug')}), chapters(id, title)`;
      if (!foundLesson) {
        const { data: directVideo } = await admin
          .from('video_lectures')
          .select(lessonSelect)
          .eq('id', lessonIdParam)
          .maybeSingle<any>();
        const videoAccess = directVideo ? lessonCourseAccess(directVideo.subjects, directVideo) : null;

        if (directVideo && videoAccess) {
          foundLesson = {
            courseId: videoAccess.lessonCourse,
            id: directVideo.id,
            title: directVideo.title,
            type: 'recorded_video',
            durationSec: directVideo.duration_sec || undefined,
            videoUrl: directVideo.video_url,
            thumbnailUrl: directVideo.thumbnail_url,
            isPremium: directVideo.is_premium,
            isLocked: directVideo.is_premium && !videoAccess.canAccess,
            isCompleted: false,
            subjectId: directVideo.subjects?.id,
            subjectDisplayName: directVideo.subjects?.display_name,
            chapterId: directVideo.chapters?.id,
            chapterTitle: directVideo.chapters?.title,
          };
        } else {
          const { data: directNote } = await admin
            .from('notes')
            .select(lessonSelect)
            .eq('id', lessonIdParam)
            .maybeSingle<any>();
          const noteAccess = directNote ? lessonCourseAccess(directNote.subjects, directNote) : null;

          if (directNote && noteAccess) {
            foundLesson = {
              courseId: noteAccess.lessonCourse,
              id: directNote.id,
              title: directNote.title,
              type: directNote.pdf_url ? 'pdf_note' : 'text_lesson',
              pdfUrl: directNote.pdf_url,
              content: directNote.content,
              isPremium: directNote.is_premium,
              isLocked: directNote.is_premium && !noteAccess.canAccess,
              isCompleted: false,
              subjectId: directNote.subjects?.id,
              subjectDisplayName: directNote.subjects?.display_name,
              chapterId: directNote.chapters?.id,
              chapterTitle: directNote.chapters?.title,
            };
          }
        }
      }

      if (foundLesson) {
        activeLessonPayload = {
          lesson: foundLesson,
          prevLesson: prevLesson ? { id: prevLesson.id, title: prevLesson.title, type: prevLesson.type } : null,
          nextLesson: nextLesson ? { id: nextLesson.id, title: nextLesson.title, type: nextLesson.type } : null,
        };
      }
    }

    const resultPayload = {
      course: {
        slug: courseSlug,
        // The course's own name. Every course except SEE used to be titled CEE.
        title: COURSE_TITLES[courseSlug as keyof typeof COURSE_TITLES] ?? courseSlug,
      },
      batch: activeBatch,
      availableBatches: trackBatches,
      hasAccess,
      isEnrolled,
      subjects: structuredSubjects,
      activeLesson: activeLessonPayload,
    };

    if (curriculumCache.size > 200) {
      const oldestKey = curriculumCache.keys().next().value;
      if (oldestKey) curriculumCache.delete(oldestKey);
    }
    curriculumCache.set(cacheKey, { payload: resultPayload, exp: Date.now() + CURRICULUM_CACHE_TTL_MS });

    return NextResponse.json(resultPayload, {
      headers: {
        'Cache-Control': 'private, max-age=30, stale-while-revalidate=120',
        'X-Curriculum-Cache': 'MISS',
      },
    });
  } catch (err: any) {
    console.error('Curriculum error:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
