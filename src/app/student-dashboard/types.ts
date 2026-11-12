import { CanonicalCourseId } from '@/contexts/ProgramContext';

export interface DashboardData {
  user: {
    id: string;
    email: string;
    fullName: string;
    avatarUrl?: string;
    role: string;
    roleDisplayName: string;
    isSuspended: boolean;
  };
  activeCourse: {
    slug: CanonicalCourseId;
    title: string;
    shortName: string;
    state: string;
    isEnrolled: boolean;
    daysRemaining?: number;
    canAccessFullCourse: boolean;
  };
  enrolledCourses: Array<{
    slug: CanonicalCourseId;
    title: string;
    shortName: string;
    state: string;
    isEnrolled: boolean;
    daysRemaining?: number;
    canAccessFullCourse: boolean;
  }>;
  recommendation: {
    type: 'live_class' | 'resume_lesson' | 'study_plan' | 'diagnostic';
    title: string;
    subtitle: string;
    actionText: string;
    actionHref: string;
    badgeText: string;
  };
  todayStudyPlan: {
    planTitle: string;
    dailyHoursTarget: number;
    tasks: Array<{
      id: string;
      title: string;
      subject: string;
      actionHref: string;
      isCompleted: boolean;
      estimatedMins: number;
    }>;
  };
  upcomingLiveClass: {
    id: string;
    title: string;
    scheduledAt: string;
    instructorName?: string;
    durationMins: number;
    status: 'live' | 'scheduled';
    meetingUrl?: string;
    recordingUrl?: string;
    isEnrolledBatch: boolean;
  } | null;
  recentTestPerformance: Array<{
    id: string;
    title: string;
    score: number;
    totalMarks: number;
    percentage: number;
    date: string;
    accuracy: number;
    reviewHref: string;
  }>;
  weakTopics: Array<{
    id: string;
    title: string;
    subject: string;
    accuracy: number;
    errorCount: number;
    practiceHref: string;
  }>;
  pendingAssignments: Array<{
    id: string;
    title: string;
    subject: string;
    submittedAt: string;
    status: 'pending' | 'evaluated';
    obtainedMarks?: number;
    totalMarks?: number;
    feedbackPreview?: string;
    actionHref: string;
  }>;
  announcements: Array<{
    id: string;
    title: string;
    content: string;
    createdAt: string;
    isPinned: boolean;
  }>;
  weeklyProgress: {
    days: Array<{
      dayName: string;
      dateStr: string;
      questionsSolved: number;
      studyMinutes: number;
      isToday: boolean;
    }>;
    totalQuestionsThisWeek: number;
    totalMinutesThisWeek: number;
    currentStreak: number;
  };
  unreadNotificationsCount: number;
  lastLesson?: {
    chapterId: string;
    chapterTitle: string;
    subjectName: string;
    subjectDisplayName: string;
    masteryScore: number;
    lastPracticedAt: string;
    resumeHref: string;
  } | null;
  batchManagement?: {
    canSwitchBatch: boolean;
    currentBatchId: string | null;
    currentBatchTitle: string;
    availableBatches: Array<{
      id: string;
      title: string;
      slug: string;
      priceNpr: number;
    }>;
  };
  gamification?: {
    levelNumber: number;
    levelTitle: string;
    xpPoints: number;
    nextLevelXp: number;
    coinsCount: number;
    streakDays: number;
    rankPosition: number;
    cohortTotal: number;
    percentile: number;
    dueFlashcardsCount: number;
    dailyMission: {
      watchLecture: boolean;
      solveDpp: boolean;
      reviewGaltiSudhar: boolean;
      completedCount: number;
      totalGoals: number;
      bonusXp: number;
    };
    badges: Array<{
      id: string;
      title: string;
      unlocked: boolean;
      icon: string;
      description: string;
    }>;
  };
}

export interface CurriculumLesson {
  id: string;
  title: string;
  type: 'recorded_video' | 'pdf_note' | 'text_lesson' | 'quiz';
  durationSec?: number;
  videoUrl?: string;
  thumbnailUrl?: string;
  pdfUrl?: string;
  content?: string;
  isPremium?: boolean;
  isLocked?: boolean;
  isCompleted?: boolean;
}

export interface CurriculumChapter {
  id: string;
  title: string;
  description?: string;
  lessons: CurriculumLesson[];
}

export interface CurriculumUnit {
  id: string;
  title: string;
  chapters: CurriculumChapter[];
}

export interface CurriculumSubject {
  id: string;
  name: string;
  displayName: string;
  units: CurriculumUnit[];
}

export type PWTab = 'analytics' | 'schedule' | 'classes' | 'tests' | 'dpp' | 'doubts' | 'notices';
