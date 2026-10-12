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

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const requestedCourse = normalizeCourseSlug(searchParams.get('course'));

    const admin = createAdminClient() || supabase;

    // Parallel fetch for user profile, enrollments, and initial metrics
    const [profileRes, enrollmentsRes] = await Promise.all([
      admin.from('user_profiles').select('*').eq('id', user.id).maybeSingle(),
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

    // Authoritative access control summary
    const accessContext = evaluateAccessContext(
      user,
      profile,
      rawEnrollments
    );

    // Determine active course
    const activeCourseSlug: CanonicalCourseSlug =
      requestedCourse ||
      (profile.primary_program ? normalizeCourseSlug(profile.primary_program) || 'cee_medical' : 'cee_medical');

    const activeCourseAccess = accessContext.courses[activeCourseSlug];

    // Parallel fetch for dashboard operational data
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();

    const [
      liveClassesRes,
      studyPlansRes,
      examAttemptsRes,
      practiceAttemptsRes,
      subjectiveEvalsRes,
      announcementsRes,
      notificationsRes,
      batchesRes,
      lastPracticedRes,
    ] = await Promise.all([
      // 1. Upcoming or Live classes
      admin
        .from('live_classes')
        .select('id, title, description, scheduled_at, duration_min, status, meeting_url, recording_url, batch_id, is_premium')
        .in('status', ['live', 'scheduled'])
        .order('scheduled_at', { ascending: true })
        .limit(10),

      // 2. Today's study plan
      admin
        .from('study_plans')
        .select('*')
        .eq('student_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1),

      // 3. Recent mock exam attempts
      admin
        .from('exam_attempts')
        .select('id, score, total_marks, percentage, percentile, completed_at, created_at, exams(title, total_marks)')
        .eq('student_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5),

      // 4. Practice attempts for weak topics & weekly activity
      admin
        .from('practice_attempts')
        .select('id, question_id, selected_option, is_correct, subject_id, created_at')
        .eq('student_id', user.id)
        .order('created_at', { ascending: false })
        .limit(200),

      // 5. Subjective paper submissions / evaluations
      admin
        .from('subjective_evaluations')
        .select('id, question_id, obtained_marks, total_marks, percentage, feedback, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5),

      // 6. Announcements
      admin
        .from('announcements')
        .select('id, title, content, is_pinned, created_at')
        .order('created_at', { ascending: false })
        .limit(5),

      // 7. Unread notifications
      admin
        .from('notifications')
        .select('id, title, message, type, is_read, action_url, created_at')
        .eq('user_id', user.id)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(10),

      // 8. Enrolled batch titles
      admin
        .from('batches')
        .select('id, title, slug, start_date, end_date, price_npr')
        .eq('is_active', true),

      // 9. Topic mastery for resume last lesson
      admin
        .from('topic_mastery')
        .select('id, chapter_id, subject_id, mastery_score, last_practiced_at, chapters(id, title, sort_order), subjects(id, name, display_name)')
        .eq('student_id', user.id)
        .order('last_practiced_at', { ascending: false })
        .limit(1),
    ]);

    // Format active & enrolled courses
    const COURSE_TITLES: Record<CanonicalCourseSlug, { title: string; shortName: string }> = {
      see_class_10: { title: 'SEE Class 10 Board Exam Batch', shortName: 'SEE Class 10' },
      cee_medical: { title: 'CEE Medical Entrance Super Target Batch', shortName: 'CEE Medical' },
      ielts: { title: 'IELTS Academic & General Target Band 8.0+', shortName: 'IELTS English' },
      digital_marketing: { title: 'Digital Marketing & Freelancing 101', shortName: 'Digital Marketing' },
      artificial_intelligence: { title: 'Python Programming & AI Tools', shortName: 'AI & Python' },
    };

    const enrolledCourses = (Object.keys(accessContext.courses) as CanonicalCourseSlug[]).map(
      (slug) => {
        const info = accessContext.courses[slug];
        const meta = COURSE_TITLES[slug] || { title: slug, shortName: slug };
        return {
          slug,
          title: meta.title,
          shortName: meta.shortName,
          state: info.state,
          isEnrolled: info.isEnrolled,
          daysRemaining: info.daysRemaining,
          canAccessFullCourse: info.canAccessFullCourse,
        };
      }
    );

    // Match upcoming live class
    const allClasses = liveClassesRes.data || [];
    const liveNow = allClasses.find((c: any) => c.status === 'live');
    const nextScheduled = allClasses.find((c: any) => c.status === 'scheduled');
    const chosenClass = liveNow || nextScheduled || null;

    let upcomingLiveClass = null;
    if (chosenClass) {
      upcomingLiveClass = {
        id: chosenClass.id,
        title: chosenClass.title,
        scheduledAt: chosenClass.scheduled_at,
        durationMins: chosenClass.duration_min || 60,
        status: chosenClass.status as 'live' | 'scheduled',
        meetingUrl: chosenClass.meeting_url || null,
        recordingUrl: chosenClass.recording_url || null,
        isEnrolledBatch: true,
      };
    }

    // Weekly activity computation from real practice_attempts
    const practiceAttempts = practiceAttemptsRes.data || [];
    const daysMap: Record<string, { questionsSolved: number; studyMinutes: number }> = {};

    const now = new Date();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const daysList = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const isoDate = d.toISOString().split('T')[0];
      const dayName = dayNames[d.getDay()];
      daysMap[isoDate] = { questionsSolved: 0, studyMinutes: 0 };
      daysList.push({
        dayName,
        dateStr: isoDate,
        isToday: i === 0,
      });
    }

    practiceAttempts.forEach((att: any) => {
      if (att.created_at) {
        const date = att.created_at.split('T')[0];
        if (daysMap[date]) {
          daysMap[date].questionsSolved += 1;
          daysMap[date].studyMinutes += 1.5;
        }
      }
    });

    const weeklyDays = daysList.map((d) => ({
      dayName: d.dayName,
      dateStr: d.dateStr,
      questionsSolved: daysMap[d.dateStr]?.questionsSolved || 0,
      studyMinutes: Math.round(daysMap[d.dateStr]?.studyMinutes || 0),
      isToday: d.isToday,
    }));

    const totalQuestionsThisWeek = weeklyDays.reduce((acc, curr) => acc + curr.questionsSolved, 0);
    const totalMinutesThisWeek = weeklyDays.reduce((acc, curr) => acc + curr.studyMinutes, 0);

    // Weak topics calculation from incorrect attempts
    const subjectErrors: Record<string, { total: number; incorrect: number }> = {};
    practiceAttempts.forEach((att: any) => {
      const sub = att.subject_id || 'General Practice';
      if (!subjectErrors[sub]) subjectErrors[sub] = { total: 0, incorrect: 0 };
      subjectErrors[sub].total += 1;
      if (!att.is_correct) subjectErrors[sub].incorrect += 1;
    });

    const weakTopics = Object.entries(subjectErrors)
      .filter(([_, stats]) => stats.total >= 3 && stats.incorrect > 0)
      .map(([sub, stats]) => ({
        id: sub,
        title: sub,
        subject: activeCourseSlug === 'see_class_10' ? 'Class 10 Board' : 'CEE Medical',
        accuracy: Math.round(((stats.total - stats.incorrect) / stats.total) * 100),
        errorCount: stats.incorrect,
        practiceHref:
          activeCourseSlug === 'see_class_10'
            ? `/practice?program=see_class_10&subject=${encodeURIComponent(sub)}`
            : `/practice?subject=${encodeURIComponent(sub)}`,
      }))
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 4);

    // Recent test performance
    const examAttempts = (examAttemptsRes.data || []).map((ex: any) => ({
      id: ex.id,
      title: ex.exams?.title || 'Mock Test Attempt',
      score: Math.round(Number(ex.score) || 0),
      totalMarks: ex.total_marks || ex.exams?.total_marks || 100,
      percentage: Math.round(Number(ex.percentage) || 0),
      date: new Date(ex.completed_at || ex.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      accuracy: Math.round(Number(ex.percentage) || 0),
      reviewHref: `/mock-tests`,
    }));

    // Pending subjective assignments
    const pendingAssignments = (subjectiveEvalsRes.data || []).map((sub: any) => ({
      id: sub.id,
      title: 'Handwritten Solution Evaluation',
      subject: activeCourseSlug === 'see_class_10' ? 'Science / Math' : 'Medical Biology',
      submittedAt: new Date(sub.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      status: (sub.obtained_marks !== null && sub.obtained_marks !== undefined ? 'evaluated' : 'pending') as 'pending' | 'evaluated',
      obtainedMarks: sub.obtained_marks,
      totalMarks: sub.total_marks,
      feedbackPreview: sub.feedback ? sub.feedback.slice(0, 100) + '...' : undefined,
      actionHref: '/vision-marker',
    }));

    // Today's Study Plan Tasks
    const activeStudyPlan = studyPlansRes.data?.[0];
    const defaultTasks = activeCourseSlug === 'see_class_10'
      ? [
          { id: 'task-1', title: 'Watch Science Chapter 4: Pressure & Mechanics Video', subject: 'Science', actionHref: '/subjects?subject=science', isCompleted: practiceAttempts.length > 0, estimatedMins: 25 },
          { id: 'task-2', title: 'Solve 10 Compulsory Math Algebra Board Questions', subject: 'Mathematics', actionHref: '/see/question-bank', isCompleted: practiceAttempts.length > 5, estimatedMins: 20 },
          { id: 'task-3', title: 'Submit 1 Handwritten Derivation for AI Vision Rubric Check', subject: 'Opt Math', actionHref: '/vision-marker', isCompleted: pendingAssignments.length > 0, estimatedMins: 15 },
        ]
      : [
          { id: 'task-1', title: 'Practice 20 High-Yield Botany Cell Biology MCQs', subject: 'Botany', actionHref: '/practice?subject=botany', isCompleted: practiceAttempts.length > 0, estimatedMins: 20 },
          { id: 'task-2', title: 'Physics Mechanics: Review Newton\'s Laws Formula Sheet', subject: 'Physics', actionHref: '/subjects?subject=physics', isCompleted: practiceAttempts.length > 5, estimatedMins: 15 },
          { id: 'task-3', title: 'Take 20-Question Timed Chemistry Mini-Mock', subject: 'Chemistry', actionHref: '/mock-tests', isCompleted: examAttempts.length > 0, estimatedMins: 25 },
        ];

    const todayStudyPlan = {
      planTitle: activeStudyPlan?.title || (activeCourseSlug === 'see_class_10' ? 'SEE GPA 4.0 Daily Blueprint' : 'CEE High-Yield Daily Blueprint'),
      dailyHoursTarget: activeStudyPlan?.daily_hours || 3,
      tasks: defaultTasks,
    };

    // Resume last studied lesson from real database topic mastery
    const lastItem: any = lastPracticedRes.data?.[0];
    const lastLesson = lastItem ? {
      chapterId: lastItem.chapter_id,
      chapterTitle: lastItem.chapters?.title || 'Core Syllabus Chapter',
      subjectName: lastItem.subjects?.name || (activeCourseSlug === 'see_class_10' ? 'science' : 'biology'),
      subjectDisplayName: lastItem.subjects?.display_name || (activeCourseSlug === 'see_class_10' ? 'Science' : 'Biology'),
      masteryScore: Math.round(Number(lastItem.mastery_score) || 0),
      lastPracticedAt: lastItem.last_practiced_at,
      resumeHref: `/subjects?subject=${encodeURIComponent(lastItem.subjects?.name || (activeCourseSlug === 'see_class_10' ? 'science' : 'biology'))}&chapter=${lastItem.chapter_id}`,
    } : null;

    // Track-tailored batches and batch switching
    const trackBatches = (batchesRes.data || []).filter((b: any) => {
      const s = ((b.slug || '') + ' ' + (b.title || '')).toLowerCase();
      if (activeCourseSlug === 'see_class_10') return s.includes('see');
      if (activeCourseSlug === 'cee_medical') return s.includes('cee') || s.includes('biology') || s.includes('chemistry');
      if (activeCourseSlug === 'ielts') return s.includes('ielts');
      if (activeCourseSlug === 'digital_marketing') return s.includes('marketing');
      if (activeCourseSlug === 'artificial_intelligence') return s.includes('ai') || s.includes('digital');
      return true;
    });

    const matchingEnrollment = rawEnrollments.find((e) => normalizeCourseSlug(e.course_id) === activeCourseSlug);
    const currentBatchId = matchingEnrollment?.batch_id || (trackBatches.length > 0 ? trackBatches[0].id : null);
    const currentBatch = trackBatches.find((b: any) => b.id === currentBatchId) || trackBatches[0] || null;

    const batchManagement = {
      canSwitchBatch: Boolean(activeCourseAccess.canAccessFullCourse || activeCourseAccess.state === 'free_preview'),
      currentBatchId: currentBatch?.id || null,
      currentBatchTitle: currentBatch?.title || 'Main Cohort Batch',
      availableBatches: trackBatches.map((b: any) => ({
        id: b.id,
        title: b.title,
        slug: b.slug,
        priceNpr: b.price_npr || 0,
      })),
    };

    // Primary Recommendation: "What should I study next?"
    let recommendation = {
      type: 'diagnostic' as 'live_class' | 'resume_lesson' | 'study_plan' | 'diagnostic',
      title: 'Take Your Baseline Diagnostic Test',
      subtitle: 'Identify your strongest and weakest topics with instant accuracy reports and rank estimates.',
      actionText: 'Start Free Diagnostic',
      actionHref: activeCourseSlug === 'see_class_10' ? '/see' : '/cee-medical-entrance',
      badgeText: 'RECOMMENDED FIRST STEP',
    };

    if (liveNow) {
      recommendation = {
        type: 'live_class',
        title: `🔴 Live Class Happening Now: ${liveNow.title}`,
        subtitle: 'Interactive live batch lecture is currently active. Join the class to ask teacher questions in real time.',
        actionText: 'Join Live Class Now',
        actionHref: '/live-classes',
        badgeText: 'LIVE BROADCAST',
      };
    } else if (nextScheduled) {
      const scheduledTime = new Date(nextScheduled.scheduled_at).getTime();
      const diffMins = Math.round((scheduledTime - Date.now()) / 60000);
      if (diffMins > 0 && diffMins <= 60) {
        recommendation = {
          type: 'live_class',
          title: `Live Class in ${diffMins} Minutes: ${nextScheduled.title}`,
          subtitle: 'Prepare your notebook and question list. Teacher session starts shortly.',
          actionText: 'Open Live Classroom',
          actionHref: '/live-classes',
          badgeText: 'STARTING SOON',
        };
      } else if (lastLesson && lastLesson.masteryScore < 100) {
        recommendation = {
          type: 'resume_lesson',
          title: `Resume Learning: ${lastLesson.chapterTitle}`,
          subtitle: `Pick up where you left off in ${lastLesson.subjectDisplayName}. Current chapter mastery is ${lastLesson.masteryScore}%.`,
          actionText: `Resume Lesson (${lastLesson.masteryScore}%)`,
          actionHref: lastLesson.resumeHref,
          badgeText: 'RESUME LAST LESSON',
        };
      } else if (weakTopics.length > 0) {
        recommendation = {
          type: 'study_plan',
          title: `Focus Weak Area: Master ${weakTopics[0].title}`,
          subtitle: `Your recent accuracy is ${weakTopics[0].accuracy}%. Drill 10 targeted practice questions to boost this topic.`,
          actionText: 'Practice Weak Topic',
          actionHref: weakTopics[0].practiceHref,
          badgeText: 'ACCURACY BOOSTER',
        };
      } else {
        recommendation = {
          type: 'resume_lesson',
          title: activeCourseSlug === 'see_class_10'
            ? 'Continue: Science Chapter 4 Pressure & Gravitation'
            : 'Continue: Biology Chapter 12 Genetics & Cell Division',
          subtitle: 'Complete the next concept lecture and solve the attached past board MCQs.',
          actionText: 'Resume Lesson',
          actionHref: activeCourseSlug === 'see_class_10' ? '/subjects?subject=science' : '/subjects?subject=biology',
          badgeText: 'CONTINUE LEARNING',
        };
      }
    } else if (lastLesson && lastLesson.masteryScore < 100) {
      recommendation = {
        type: 'resume_lesson',
        title: `Resume Learning: ${lastLesson.chapterTitle}`,
        subtitle: `Pick up where you left off in ${lastLesson.subjectDisplayName}. Current chapter mastery is ${lastLesson.masteryScore}%.`,
        actionText: `Resume Lesson (${lastLesson.masteryScore}%)`,
        actionHref: lastLesson.resumeHref,
        badgeText: 'RESUME LAST LESSON',
      };
    } else if (weakTopics.length > 0) {
      recommendation = {
        type: 'study_plan',
        title: `Priority Topic: ${weakTopics[0].title}`,
        subtitle: `You scored ${weakTopics[0].accuracy}% on recent attempts. Solve 10 questions to clear conceptual traps.`,
        actionText: 'Practice Topic',
        actionHref: weakTopics[0].practiceHref,
        badgeText: 'SMART RECOMMENDATION',
      };
    } else {
      recommendation = {
        type: 'resume_lesson',
        title: activeCourseSlug === 'see_class_10'
          ? 'Next Up: Compulsory Science & Math Solved Model Sets'
          : 'Next Up: High-Yield Botany & Zoology MEC Question Drills',
        subtitle: 'Step-by-step solutions and rubrics verified according to CDC Nepal exam guidelines.',
        actionText: 'Start Next Lesson',
        actionHref: activeCourseSlug === 'see_class_10' ? '/subjects?subject=science' : '/subjects?subject=biology',
        badgeText: 'WHAT TO STUDY NEXT',
      };
    }

    // Role display name helper
    const ROLE_LABELS: Record<string, string> = {
      visitor: 'Visitor',
      student_free: 'Free Student',
      student_paid: 'Paid Student',
      student_paid_see: 'SEE Student (Class 10)',
      student_paid_cee: 'CEE Student (Medical)',
      student_all_access: 'All-Access Scholar',
      teacher: 'Faculty Educator',
      content_manager: 'Content Manager',
      support_agent: 'Academic Counselor',
      administrator: 'Administrator',
      super_administrator: 'Super Administrator',
    };

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email || '',
        fullName: (profile as any).full_name || user.email?.split('@')[0] || 'Student',
        avatarUrl: (profile as any).avatar_url || null,
        role: accessContext.role,
        roleDisplayName: ROLE_LABELS[accessContext.role] || 'Student',
        isSuspended: accessContext.isSuspended,
      },
      activeCourse: {
        slug: activeCourseSlug,
        title: COURSE_TITLES[activeCourseSlug]?.title || 'Samyak Academic Course',
        shortName: COURSE_TITLES[activeCourseSlug]?.shortName || 'Course',
        state: activeCourseAccess.state,
        isEnrolled: activeCourseAccess.isEnrolled,
        daysRemaining: activeCourseAccess.daysRemaining,
        canAccessFullCourse: activeCourseAccess.canAccessFullCourse,
      },
      enrolledCourses,
      recommendation,
      todayStudyPlan,
      upcomingLiveClass,
      recentTestPerformance: examAttempts,
      weakTopics,
      pendingAssignments,
      announcements: announcementsRes.data || [],
      weeklyProgress: {
        days: weeklyDays,
        totalQuestionsThisWeek,
        totalMinutesThisWeek,
        currentStreak: (profile as any).study_streak || (totalQuestionsThisWeek > 0 ? 3 : 1),
      },
      unreadNotificationsCount: (notificationsRes.data || []).length,
      notifications: notificationsRes.data || [],
    });
  } catch (err: any) {
    console.error('Student Dashboard API error:', err);
    return NextResponse.json(
      { error: 'Failed to load student dashboard', details: err?.message },
      { status: 500 }
    );
  }
}
