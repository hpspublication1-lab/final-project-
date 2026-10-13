import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  evaluateAccessContext,
  normalizeCourseSlug,
  RawUserProfile,
  RawEnrollment,
} from '@/lib/auth/accessControl';
import { CanonicalCourseSlug } from '@/types/lms';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const rawCourse = searchParams.get('course') || 'cee_medical';
    let courseSlug: CanonicalCourseSlug = normalizeCourseSlug(rawCourse) || 'cee_medical';
    const batchIdParam = searchParams.get('batchId');
    const lessonIdParam = searchParams.get('lessonId');

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const admin = createAdminClient() || supabase;

    // 1. Authoritative access control check
    let isEnrolled = false;
    let isPrivileged = false;
    let userAccess = null;

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

      const accessCtx = evaluateAccessContext(user, profile, rawEnrollments);
      userAccess = accessCtx.courses[courseSlug];
      isEnrolled = Boolean(userAccess?.canAccessFullCourse);
      isPrivileged = accessCtx.role === 'super_administrator' || accessCtx.role === 'administrator' || accessCtx.role === 'teacher';
    }

    const hasAccess = isPrivileged || isEnrolled;
    const nowIso = new Date().toISOString();

    // 2. Fetch batches for this course
    const { data: allBatches } = await admin
      .from('batches')
      .select('id, title, slug, start_date, end_date, price_npr, is_premium, is_active, instructor_name')
      .eq('is_active', true);

    const trackBatches = (allBatches || []).filter((b: any) => {
      const s = ((b.slug || '') + ' ' + (b.title || '')).toLowerCase();
      if (courseSlug === 'see_class_10') return s.includes('see');
      if (courseSlug === 'cee_medical') return s.includes('cee') || s.includes('biology') || s.includes('chemistry');
      if (courseSlug === 'ielts') return s.includes('ielts');
      if (courseSlug === 'digital_marketing') return s.includes('marketing');
      if (courseSlug === 'artificial_intelligence') return s.includes('ai') || s.includes('digital');
      return true;
    });

    const activeBatch =
      (batchIdParam ? trackBatches.find((b: any) => b.id === batchIdParam) : null) ||
      trackBatches[0] || {
        id: 'default-batch',
        title: courseSlug === 'see_class_10' ? 'SEE 2026 Toppers Batch' : 'Target CEE 2026 Super Batch',
        slug: courseSlug === 'see_class_10' ? 'see-2026-english-medium' : 'target-cee-2026-full',
        instructor_name: 'Samyak Senior Faculty',
        price_npr: courseSlug === 'see_class_10' ? 4990 : 7990,
      };

    // 3. Fetch subjects for this course
    const { data: allSubs } = await admin
      .from('subjects')
      .select('id, name, display_name, slug, sort_order, is_active')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    let subjects = allSubs || [];
    if (courseSlug === 'see_class_10') {
      const seeFiltered = subjects.filter((s: any) =>
        (s.slug || '').toLowerCase().includes('see') || (s.name || '').toLowerCase().includes('see')
      );
      if (seeFiltered.length > 0) subjects = seeFiltered;
    }

    // 4. Fetch chapters
    const subjectIds = (subjects || []).map((s: any) => s.id);
    const { data: chapters } = await admin
      .from('chapters')
      .select('id, subject_id, title, description, sort_order, is_premium, is_active')
      .in('subject_id', subjectIds)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    // 5. Fetch video lectures for these subjects
    const { data: videos } = await admin
      .from('video_lectures')
      .select('id, title, description, video_url, thumbnail_url, duration_sec, subject_id, chapter_id, is_premium, is_active, created_at')
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    // 6. Fetch notes for these subjects
    const { data: notes } = await admin
      .from('notes')
      .select('id, title, content, pdf_url, subject_id, chapter_id, is_premium, is_active, created_at')
      .eq('is_active', true);

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
        const chapterVideos = (videos || []).filter(
          (v: any) => v.chapter_id === chap.id || (v.subject_id === subject.id && !v.chapter_id && idx === 0)
        );
        const chapterNotes = (notes || []).filter(
          (n: any) => n.chapter_id === chap.id || (n.subject_id === subject.id && !n.chapter_id && idx === 0)
        );

        const lessons: any[] = [];
        let order = 1;

        // Add Video Lessons
        chapterVideos.forEach((v: any) => {
          lessons.push({
            id: v.id,
            title: v.title,
            type: 'recorded_video',
            durationSec: v.duration_sec || 1800,
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

        // Default Chapter Quiz lesson
        lessons.push({
          id: `quiz-${chap.id}`,
          title: `${chap.title} — High-Yield Mastery Quiz`,
          type: 'quiz',
          durationSec: 900,
          isPremium: chap.is_premium,
          isLocked: chap.is_premium && !hasAccess,
          isCompleted: (masteryMap[chap.id] || 0) >= 80,
          order: order++,
        });

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
                chapterId: chap.id,
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

      // Resilient fallback: If lesson not in current course filter, look up directly in database
      if (!foundLesson) {
        const { data: directVideo } = await admin
          .from('video_lectures')
          .select('*, subjects(id, name, display_name, program_type), chapters(id, title)')
          .eq('id', lessonIdParam)
          .maybeSingle();

        if (directVideo) {
          foundLesson = {
            id: directVideo.id,
            title: directVideo.title,
            type: 'recorded_video',
            durationSec: directVideo.duration_sec || 1800,
            videoUrl: directVideo.video_url,
            thumbnailUrl: directVideo.thumbnail_url,
            isPremium: directVideo.is_premium,
            isLocked: directVideo.is_premium && !hasAccess,
            isCompleted: false,
            subjectId: directVideo.subjects?.id,
            subjectDisplayName: directVideo.subjects?.display_name,
            chapterId: directVideo.chapters?.id,
            chapterTitle: directVideo.chapters?.title,
          };
        } else {
          const { data: directNote } = await admin
            .from('notes')
            .select('*, subjects(id, name, display_name, program_type), chapters(id, title)')
            .eq('id', lessonIdParam)
            .maybeSingle();

          if (directNote) {
            foundLesson = {
              id: directNote.id,
              title: directNote.title,
              type: directNote.pdf_url ? 'pdf_note' : 'text_lesson',
              pdfUrl: directNote.pdf_url,
              content: directNote.content,
              isPremium: directNote.is_premium,
              isLocked: directNote.is_premium && !hasAccess,
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

    return NextResponse.json({
      course: {
        slug: courseSlug,
        title: courseSlug === 'see_class_10' ? 'SEE Class 10 Board Exam' : 'CEE Medical Entrance Preparation',
      },
      batch: activeBatch,
      availableBatches: trackBatches,
      hasAccess,
      isEnrolled,
      subjects: structuredSubjects,
      activeLesson: activeLessonPayload,
    });
  } catch (err: any) {
    console.error('Curriculum error:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
