'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useProgram, normalizeCourseId, CanonicalCourseId } from '@/contexts/ProgramContext';
import {
  Loader2, Play, BookOpen, Sparkles, Flame,
  Clock, ArrowRight, CheckCircle2, ChevronRight, X, AlertTriangle,
  Radio, FileText, Award, Calendar, MessageCircle,
  TrendingUp, BarChart2, ShieldCheck, RefreshCw, ExternalLink,
  Check, Zap, KeyRound, Swords, Trophy, Brain, Layers,
  Video, PlayCircle, Search, Download, HelpCircle, Send,
  ChevronDown, ChevronUp, GraduationCap, Stethoscope, RotateCcw,
  BookCheck, ListTodo, FileQuestion, Users, Bell
} from 'lucide-react';
import { SUPPORT_CONFIG } from '@/lib/config/support';
import toast from 'react-hot-toast';
import dynamic from 'next/dynamic';
import DashboardSkeleton from './DashboardSkeleton';

const BatchVideoPlayerModal = dynamic(
  () => import('./BatchVideoPlayerModal'),
  { ssr: false }
);

const RedeemVoucherModal = dynamic(
  () => import('@/components/billing/RedeemVoucherModal'),
  { ssr: false }
);

// ── Types ────────────────────────────────────────────────────────────────────

interface DashboardData {
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

interface CurriculumLesson {
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

interface CurriculumChapter {
  id: string;
  title: string;
  description?: string;
  lessons: CurriculumLesson[];
}

interface CurriculumUnit {
  id: string;
  title: string;
  chapters: CurriculumChapter[];
}

interface CurriculumSubject {
  id: string;
  name: string;
  displayName: string;
  units: CurriculumUnit[];
}

// ── Main PW-Style Dashboard Component ────────────────────────────────────────

type PWTab = 'schedule' | 'classes' | 'tests' | 'dpp' | 'doubts' | 'notices';

export default function DashboardPageClient() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { program, setProgram } = useProgram();

  const canonicalId = normalizeCourseId(program);

  // SWR Client-Side Cache (Instant Render from sessionStorage / memory)
  const [data, setData] = useState<DashboardData | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = sessionStorage.getItem(`samyak_swr_dash_${canonicalId}`);
      if (stored) return JSON.parse(stored);
    } catch {}
    return null;
  });
  const [loading, setLoading] = useState<boolean>(!data);
  const [isDark, setIsDark] = useState(false);
  const [activeTab, setActiveTab] = useState<PWTab>('schedule');

  // Interactive state
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({});
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [switchingBatch, setSwitchingBatch] = useState(false);
  const [backlogMode, setBacklogMode] = useState<'balanced' | 'express' | 'weekend'>('balanced');
  const [streakFreezeArmed, setStreakFreezeArmed] = useState(true);
  const [showRedeemModal, setShowRedeemModal] = useState(false);

  // Streak Repair Drill & Habit Engine state
  const [showStreakRepairModal, setShowStreakRepairModal] = useState(false);
  const [repairingStreak, setRepairingStreak] = useState(false);
  const [repairQuestionIndex, setRepairQuestionIndex] = useState(0);
  const [repairSelectedOption, setRepairSelectedOption] = useState<number | null>(null);
  const [repairScore, setRepairScore] = useState(0);
  const [repairCompleted, setRepairCompleted] = useState(false);
  const [claimingMissionBonus, setClaimingMissionBonus] = useState(false);

  const STREAK_REPAIR_QUESTIONS = [
    {
      id: 'srq-1',
      subject: 'Physics',
      question: 'Which of the following physical quantities has the dimensional formula [M L^2 T^-2]?',
      options: ['Force and Momentum', 'Work and Kinetic Energy', 'Power and Pressure', 'Impulse and Surface Tension'],
      correctIndex: 1,
      explanation: 'Work and Kinetic Energy both have the dimension of energy = Force × Displacement = [M L T^-2] × [L] = [M L^2 T^-2].',
    },
    {
      id: 'srq-2',
      subject: 'Biology',
      question: 'Which organelle is semi-autonomous, has its own 70S ribosomes and circular DNA, and generates cellular ATP?',
      options: ['Golgi Complex', 'Lysosome', 'Mitochondria', 'Endoplasmic Reticulum'],
      correctIndex: 2,
      explanation: 'Mitochondria are double-membrane semi-autonomous organelles containing 70S ribosomes and circular DNA that drive oxidative phosphorylation.',
    },
    {
      id: 'srq-3',
      subject: 'Chemistry',
      question: 'According to Le Chatelier’s principle, an exothermic reaction is favoured by which temperature condition?',
      options: ['High Temperature', 'Low Temperature', 'Extreme Pressure only', 'Presence of Inhibitor'],
      correctIndex: 1,
      explanation: 'For an exothermic reaction (ΔH < 0), lowering temperature shifts the equilibrium in the forward direction according to Le Chatelier’s principle.',
    },
  ];

  // Curriculum & Video state
  const [curriculumSubjects, setCurriculumSubjects] = useState<CurriculumSubject[]>([]);
  const [curriculumLoading, setCurriculumLoading] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [chapterSearch, setChapterSearch] = useState('');
  const [expandedChapterId, setExpandedChapterId] = useState<string | null>(null);
  const [activeVideo, setActiveVideo] = useState<{ id: string; title: string; videoUrl?: string; durationSec?: number } | null>(null);

  // Quick Doubt input state
  const [doubtQuestion, setDoubtQuestion] = useState('');

  // Streak freeze persistence
  useEffect(() => {
    if (!user?.id) return;
    try {
      const saved = localStorage.getItem(`samyak_streak_freeze_${user.id}`);
      if (saved !== null) {
        setStreakFreezeArmed(saved === 'true');
      }
    } catch {}
  }, [user?.id]);

  const handleToggleStreakFreeze = () => {
    if (!user?.id) return;
    const next = !streakFreezeArmed;
    setStreakFreezeArmed(next);
    try {
      localStorage.setItem(`samyak_streak_freeze_${user.id}`, String(next));
    } catch {}
    if (next) {
      toast.success('Streak Freeze Shield Armed! Protects consistency if you miss 1 day.', {
        icon: '🛡️',
        duration: 3500,
      });
    } else {
      toast('Streak Freeze Shield Disarmed. Strict daily tracking enabled.', {
        icon: '⚡',
        duration: 3000,
      });
    }
  };

  const handleStreakRepair = async () => {
    try {
      setRepairingStreak(true);
      const res = await fetch('/api/student/streak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'repair_streak' }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to repair streak');

      toast.success(result.message || '🔥 Streak Repaired! Restored with +50 XP bonus!', {
        duration: 4000,
        icon: '🔥',
      });

      setData((prev) => {
        if (!prev) return prev;
        const newStreak = result.currentStreak || Math.max(prev.weeklyProgress.currentStreak + 1, 7);
        const newXp = (prev.gamification?.xpPoints || 1250) + 50;
        return {
          ...prev,
          weeklyProgress: {
            ...prev.weeklyProgress,
            currentStreak: newStreak,
          },
          gamification: prev.gamification
            ? {
                ...prev.gamification,
                streakDays: newStreak,
                xpPoints: newXp,
              }
            : undefined,
        };
      });

      setShowStreakRepairModal(false);
      setRepairCompleted(false);
      setRepairQuestionIndex(0);
      setRepairSelectedOption(null);
      setRepairScore(0);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Streak repair failed';
      toast.error(msg);
    } finally {
      setRepairingStreak(false);
    }
  };

  const handleClaimDailyMission = async () => {
    if (!data?.gamification?.dailyMission) return;
    try {
      setClaimingMissionBonus(true);
      const res = await fetch('/api/student/streak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'complete_mission' }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to claim daily bonus');

      toast.success(result.message || '🎉 3-Pillar Daily Mission Bonus Claimed! +100 XP awarded!', {
        duration: 4000,
        icon: '🏆',
      });

      setData((prev) => {
        if (!prev) return prev;
        const newXp = (prev.gamification?.xpPoints || 1250) + 100;
        return {
          ...prev,
          gamification: prev.gamification
            ? {
                ...prev.gamification,
                xpPoints: newXp,
                dailyMission: {
                  ...prev.gamification.dailyMission,
                  bonusClaimed: true,
                } as any,
              }
            : undefined,
        };
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not claim daily mission bonus';
      toast.error(msg);
    } finally {
      setClaimingMissionBonus(false);
    }
  };

  const handleSwitchBatch = async (batchId: string) => {
    try {
      setSwitchingBatch(true);
      const res = await fetch('/api/student/batch/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseSlug: canonicalId, batchId }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to switch batch');
      toast.success(result.message || 'Batch switched successfully!');
      setShowBatchModal(false);

      // Refresh dashboard data
      const refreshRes = await fetch(`/api/student/dashboard?course=${canonicalId}&refresh=1`);
      if (refreshRes.ok) {
        const refreshed = await refreshRes.json();
        setData(refreshed);
        try {
          sessionStorage.setItem(`samyak_swr_dash_${user?.id}_${canonicalId}`, JSON.stringify(refreshed));
        } catch {}
      }
      // Re-fetch curriculum for new batch
      loadCurriculum();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not switch batch';
      toast.error(msg);
    } finally {
      setSwitchingBatch(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // SWR Pipeline: Fetch fresh data in background without blocking UI
  useEffect(() => {
    if (!user?.id) return;
    let active = true;

    // Check SWR cache if data not initialized
    try {
      const cached = sessionStorage.getItem(`samyak_swr_dash_${user.id}_${canonicalId}`);
      if (cached && !data) {
        const parsed = JSON.parse(cached);
        setData(parsed);
        setLoading(false);
      }
    } catch {}

    async function loadDashboard() {
      if (!data) setLoading(true);
      try {
        const res = await fetch(`/api/student/dashboard?course=${canonicalId}`);
        if (res.ok) {
          const json = await res.json();
          if (active) {
            setData(json);
            try {
              sessionStorage.setItem(`samyak_swr_dash_${user.id}_${canonicalId}`, JSON.stringify(json));
            } catch {}
            // Pre-seed completed tasks from API
            const initialTasks: Record<string, boolean> = {};
            json.todayStudyPlan?.tasks?.forEach((t: { id: string; isCompleted: boolean }) => {
              initialTasks[t.id] = !!t.isCompleted;
            });
            setCompletedTasks((prev) => ({ ...initialTasks, ...prev }));
          }
        }
      } catch (err) {
        console.error('Failed to load student dashboard:', err);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDashboard();
    return () => {
      active = false;
    };
  }, [user?.id, canonicalId]);

  // Load Curriculum for Classes Tab
  const loadCurriculum = async () => {
    try {
      setCurriculumLoading(true);
      const res = await fetch(`/api/curriculum?course=${canonicalId}`);
      if (res.ok) {
        const json = await res.json();
        if (json.subjects && Array.isArray(json.subjects)) {
          setCurriculumSubjects(json.subjects);
          // Auto-expand first chapter of first subject if none expanded
          if (!expandedChapterId && json.subjects[0]?.units?.[0]?.chapters?.[0]?.id) {
            setExpandedChapterId(json.subjects[0].units[0].chapters[0].id);
          }
        }
      }
    } catch (err) {
      console.warn('Curriculum fetch warning:', err);
    } finally {
      setCurriculumLoading(false);
    }
  };

  // Pre-fetch curriculum quietly 80ms after initial mount for 0ms tab switching
  useEffect(() => {
    if (!user?.id) return;
    const timer = setTimeout(() => {
      if (curriculumSubjects.length === 0) {
        loadCurriculum();
      }
    }, 80);
    return () => clearTimeout(timer);
  }, [user?.id, canonicalId, curriculumSubjects.length]);

  const toggleTask = (taskId: string) => {
    setCompletedTasks((prev) => {
      const next = !prev[taskId];
      if (next) {
        toast.success('Goal completed! Streak momentum locked in 🔥', {
          duration: 2500,
        });
      }
      return {
        ...prev,
        [taskId]: next,
      };
    });
  };

  const handleAskDoubt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!doubtQuestion.trim()) return;
    router.push(`/ai-tutor?prompt=${encodeURIComponent(doubtQuestion.trim())}`);
  };

  // Instant SWR: If loading and no cached data, render full-fidelity skeleton
  if (authLoading || (loading && !data)) {
    return <DashboardSkeleton />;
  }

  if (!user || !data) return null;

  const isSee = canonicalId === 'see_class_10';
  const isTrial = data.activeCourse.state === 'free_preview';
  const isExpired = data.activeCourse.state === 'expired';
  const checkoutPlanSku = isSee ? 'see-class-10-board-topper-batch' : 'cee-mbbs-mastery-2026';

  const completedCount = Object.values(completedTasks).filter(Boolean).length;
  const totalTasksCount = data.todayStudyPlan.tasks.length;

  // Backlog Recovery calculations
  const incompletePlanTasks = data.todayStudyPlan.tasks.filter((t) => !completedTasks[t.id]);
  const hasUnfinishedChapter = Boolean(data.lastLesson && data.lastLesson.masteryScore < 100);
  const unfinishedChapterCount = (hasUnfinishedChapter ? 1 : 0) + incompletePlanTasks.length;
  const unfinishedChapterMins =
    incompletePlanTasks.reduce((sum, t) => sum + (t.estimatedMins || 25), 0) +
    (hasUnfinishedChapter ? 30 : 0);

  const pendingDrillCount = data.weakTopics.length;
  const totalWeakTopicErrors = data.weakTopics.reduce((sum, w) => sum + (w.errorCount || 0), 0);

  const dynamicBacklogQueue: Array<{
    id: string;
    type: 'chapter' | 'dpp' | 'task';
    subject: string;
    title: string;
    meta: string;
    href: string;
    cta: string;
  }> = [];

  if (data.lastLesson && data.lastLesson.masteryScore < 100) {
    dynamicBacklogQueue.push({
      id: `lesson-${data.lastLesson.chapterId}`,
      type: 'chapter',
      subject: data.lastLesson.subjectDisplayName,
      title: `Master Chapter: ${data.lastLesson.chapterTitle}`,
      meta: `${data.lastLesson.masteryScore}% mastered`,
      href: data.lastLesson.resumeHref,
      cta: 'Resume',
    });
  }

  for (const wt of data.weakTopics) {
    if (dynamicBacklogQueue.length >= 6) break;
    dynamicBacklogQueue.push({
      id: `weak-${wt.id}`,
      type: 'dpp',
      subject: wt.subject,
      title: `Fix Weak Topic: ${wt.title}`,
      meta: `${wt.accuracy}% acc • ${wt.errorCount} misses`,
      href: wt.practiceHref,
      cta: 'Solve DPP',
    });
  }

  for (const pt of incompletePlanTasks) {
    if (dynamicBacklogQueue.length >= 6) break;
    dynamicBacklogQueue.push({
      id: `plan-${pt.id}`,
      type: 'task',
      subject: pt.subject,
      title: pt.title,
      meta: `~${pt.estimatedMins} mins target`,
      href: pt.actionHref,
      cta: 'Start Task',
    });
  }

  const displayedBacklogQueue =
    backlogMode === 'weekend' ? dynamicBacklogQueue.slice(0, 6) : dynamicBacklogQueue.slice(0, 3);

  const totalActionableItems =
    totalTasksCount + data.weakTopics.length + (data.lastLesson ? 1 : 0);
  const completedActionableItems =
    completedCount + (data.lastLesson && data.lastLesson.masteryScore >= 80 ? 1 : 0);
  const recoveryProgressPct =
    totalActionableItems > 0
      ? Math.min(100, Math.round((completedActionableItems / totalActionableItems) * 100))
      : 100;

  // Filtered curriculum subjects
  const filteredCurriculumSubjects = curriculumSubjects.filter((s) => {
    if (selectedSubjectId === 'all') return true;
    return s.id === selectedSubjectId || s.name.toLowerCase() === selectedSubjectId.toLowerCase();
  });

  // Calculate overall batch progress
  const batchCompletionPct = Math.min(
    95,
    Math.max(
      22,
      (data.weeklyProgress.totalQuestionsThisWeek > 0 ? 32 : 18) +
        completedCount * 8 +
        (data.recentTestPerformance.length > 0 ? 15 : 0)
    )
  );

  // ── PW CONTEXTUAL SIDEBAR (ACADEMIC COMPANION) ─────────────────────────────
  const contextualPanel = (
    <div className="space-y-5">
      {/* 1. Live Class Radar */}
      {data.upcomingLiveClass ? (
        <div className="bg-card border border-border/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5 hover:shadow-sm transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-600 border border-red-500/20 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
              <span>{data.upcomingLiveClass.status === 'live' ? 'Live Now' : 'Next Live Session'}</span>
            </span>
            <span className="text-xs font-mono text-muted-foreground font-semibold">
              {data.upcomingLiveClass.durationMins}m
            </span>
          </div>

          <div className="space-y-1">
            <h4 className="text-sm font-bold text-foreground leading-snug">
              {data.upcomingLiveClass.title}
            </h4>
            {data.upcomingLiveClass.instructorName && (
              <p className="text-[11px] text-muted-foreground">
                Faculty: <strong className="text-foreground">{data.upcomingLiveClass.instructorName}</strong>
              </p>
            )}
            <p className="text-[11px] text-muted-foreground">
              Starts at:{' '}
              {new Date(data.upcomingLiveClass.scheduledAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>

          <Link
            href="/live-classes"
            className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs text-center flex items-center justify-center gap-1.5 transition-all shadow-xs"
          >
            <Radio size={13} />
            <span>Join Live Classroom</span>
          </Link>
        </div>
      ) : (
        <div className="bg-card border border-border/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-muted text-muted-foreground">
              Live Classroom
            </span>
            <span className="text-xs text-muted-foreground font-medium">Daily Cohort</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            No live lectures scheduled right now. Evening interactive doubt sessions resume tomorrow.
          </p>
          <Link
            href="/live-classes"
            className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
          >
            <span>Browse HD Recordings Vault</span>
            <ArrowRight size={12} />
          </Link>
        </div>
      )}

      {/* Level & XP Progression Widget */}
      {data.gamification && (
        <div className="bg-card border border-border/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5 hover:shadow-sm transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Trophy size={15} className="text-primary" />
              <span>Rank &amp; Progression</span>
            </span>
            <span className="text-xs font-mono font-black px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
              Lvl {data.gamification.levelNumber}
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-foreground">
                {data.gamification.levelTitle}
              </span>
              <span className="text-[11px] font-mono text-muted-foreground">
                {data.gamification.xpPoints % 1000} / 1000 XP
              </span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-indigo-500 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, Math.round(((data.gamification.xpPoints % 1000) / 1000) * 100))}%`,
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60 text-center">
            <div className="p-2 rounded-xl bg-muted/30">
              <span className="text-[10px] text-muted-foreground block">Coins Balance</span>
              <span className="text-xs font-black text-amber-500 font-mono">
                🪙 {data.gamification.coinsCount}
              </span>
            </div>
            <Link
              href="/leaderboard"
              className="p-2 rounded-xl bg-muted/30 hover:bg-primary/10 transition-colors block group"
            >
              <span className="text-[10px] text-muted-foreground block">Cohort Rank</span>
              <span className="text-xs font-black text-primary font-mono group-hover:underline">
                #{data.gamification.rankPosition} (Top {100 - data.gamification.percentile}%)
              </span>
            </Link>
          </div>
        </div>
      )}

      {/* 2. Consistency & Study Volume */}
      <div className="bg-card border border-border/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4 hover:shadow-sm transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Flame size={15} className="text-amber-500" />
            <span>Study Consistency</span>
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 border border-amber-500/20">
              {data.gamification?.streakDays ?? data.weeklyProgress.currentStreak} Days
            </span>
            <button
              onClick={handleToggleStreakFreeze}
              title={
                streakFreezeArmed
                  ? 'Streak Freeze Shield Armed. Click to toggle.'
                  : 'Streak Freeze Shield Disarmed. Click to arm.'
              }
              className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                streakFreezeArmed
                  ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/20'
                  : 'bg-muted text-muted-foreground border-border hover:text-foreground'
              }`}
            >
              <ShieldCheck
                size={11}
                className={streakFreezeArmed ? 'text-cyan-500' : 'text-muted-foreground'}
              />
              <span>{streakFreezeArmed ? 'Shield' : 'Arm'}</span>
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Weekly Practice Goal</span>
            <span className="font-bold text-foreground">
              {data.weeklyProgress.totalQuestionsThisWeek} / 150 Qs
            </span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(
                  100,
                  (data.weeklyProgress.totalQuestionsThisWeek / 150) * 100
                )}%`,
              }}
            />
          </div>
        </div>

        {/* 7-Day Mini Sparkline Bars */}
        <div className="pt-2 border-t border-border/60">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-2">
            <span>Daily Activity (7 Days)</span>
            <span className="font-semibold text-foreground">
              {data.weeklyProgress.totalMinutesThisWeek}m study
            </span>
          </div>
          <div className="grid grid-cols-7 gap-1.5 items-end h-14 pt-1">
            {data.weeklyProgress.days.map((day, dIdx) => {
              const maxVal = Math.max(
                25,
                ...data.weeklyProgress.days.map((d) => d.questionsSolved)
              );
              const heightPct = Math.max(12, Math.round((day.questionsSolved / maxVal) * 100));

              return (
                <div key={dIdx} className="flex flex-col items-center gap-1 h-full justify-end group">
                  <div
                    className={`w-full rounded-md transition-all duration-300 ${
                      day.isToday
                        ? 'bg-primary'
                        : day.questionsSolved > 0
                        ? 'bg-primary/50 group-hover:bg-primary'
                        : 'bg-muted'
                    }`}
                    style={{ height: `${heightPct}%` }}
                    title={`${day.dayName}: ${day.questionsSolved} questions`}
                  />
                  <span
                    className={`text-[9px] font-semibold ${
                      day.isToday ? 'text-primary font-bold' : 'text-muted-foreground'
                    }`}
                  >
                    {day.dayName.slice(0, 1)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Streak Repair Drill 1-Click Trigger */}
        <div className="pt-2 border-t border-border/60">
          <button
            onClick={() => {
              setRepairQuestionIndex(0);
              setRepairSelectedOption(null);
              setRepairScore(0);
              setRepairCompleted(false);
              setShowStreakRepairModal(true);
            }}
            className="w-full py-2 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Zap size={13} className="text-amber-500" />
            <span>Streak Repair Drill (+50 XP)</span>
          </button>
        </div>
      </div>

      {/* 3. Academic Counselor WhatsApp Hotline */}
      <div className="bg-card border border-border/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3 hover:shadow-sm transition-all">
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <MessageCircle size={18} />
          </span>
          <div>
            <h4 className="text-xs font-bold text-foreground">Faculty Counseling Desk</h4>
            <p className="text-[11px] text-muted-foreground">Study plan questions &amp; queries</p>
          </div>
        </div>
        <a
          href={`https://wa.me/${SUPPORT_CONFIG.whatsappNumber}?text=${encodeURIComponent(
            'Hello Samyak Academic Team! I need guidance with my study plan.'
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold text-xs text-center border border-emerald-500/30 flex items-center justify-center gap-1.5 transition-all block"
        >
          <span>Chat with Academic Mentor</span>
          <ExternalLink size={12} />
        </a>
      </div>

      {/* 4. Abhibhabak WhatsApp Progress Digest */}
      <div className="bg-card border border-border/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3 hover:shadow-sm transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <span className="text-sm">👨‍👩‍👧</span>
            <span>Abhibhabak Card</span>
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary">
            Parent Peace
          </span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Share your weekly study hours &amp; consistency directly with parents on WhatsApp.
        </p>
        <a
          href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
            `नमस्ते बुवा/आमा! 📚\n\nSamyak बाट यो हप्ताको मेरो अध्ययन प्रगति प्रतिवेदन:\n⏱️ अध्ययन समय: ${data.weeklyProgress.totalMinutesThisWeek} मिनेट (${
              Math.round((data.weeklyProgress.totalMinutesThisWeek / 60) * 10) / 10
            } घण्टा)\n🔥 लगातार अध्ययन (Streak): ${data.weeklyProgress.currentStreak} दिन\n🎯 हल गरिएका प्रश्न: ${
              data.weeklyProgress.totalQuestionsThisWeek
            } MCQs\n\nम नियमित अभ्यास गरिरहेको छु र परीक्षाको लागि कटिबद्ध छु! धन्यवाद।`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-2.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-700 dark:text-teal-300 font-bold text-xs text-center border border-teal-500/30 flex items-center justify-center gap-1.5 transition-all block"
        >
          <span>Share Report with Parents</span>
          <ExternalLink size={12} />
        </a>
      </div>

      {/* 5. Offline Book Voucher & Activation Key */}
      <div className="bg-gradient-to-br from-primary/5 via-card to-card border border-primary/20 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3 hover:shadow-sm transition-all">
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <KeyRound size={18} />
          </span>
          <div>
            <h4 className="text-xs font-bold text-foreground">Have an Activation Code?</h4>
            <p className="text-[11px] text-muted-foreground">Redeem 16-character book voucher</p>
          </div>
        </div>
        <button
          onClick={() => setShowRedeemModal(true)}
          className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs text-center flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
        >
          <ShieldCheck size={13} />
          <span>Redeem Activation Key</span>
        </button>
      </div>
    </div>
  );

  return (
    <DashboardLayout
      isDark={isDark}
      onToggleDark={() => setIsDark(!isDark)}
      contextualPanel={contextualPanel}
    >
      {/* ── 0. TRIAL OR EXPIRED STATE BANNER ───────────────────────────────── */}
      {isTrial && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <span className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
              <ShieldCheck size={18} />
            </span>
            <div>
              <p className="text-xs sm:text-sm font-bold text-foreground">
                Free Starter Preview Active
              </p>
              <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                Upgrade to unlock all 15,000+ past questions, daily interactive live batches, and AI grading.
              </p>
            </div>
          </div>
          <Link
            href={`/checkout?plan=${checkoutPlanSku}`}
            className="btn-primary text-xs font-bold py-2.5 px-5 rounded-xl shrink-0 flex items-center gap-1.5 shadow-xs"
          >
            <span>Upgrade to Full Batch</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      )}

      {isExpired && (
        <div className="p-4 sm:p-5 rounded-2xl bg-red-500/10 border border-red-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <span className="w-9 h-9 rounded-xl bg-red-500/20 text-red-600 flex items-center justify-center shrink-0">
              <AlertTriangle size={18} />
            </span>
            <div>
              <p className="text-xs sm:text-sm font-bold text-foreground">
                Batch Access Expired
              </p>
              <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                Renew your enrollment to continue taking timed mocks and attending live sessions.
              </p>
            </div>
          </div>
          <Link
            href={`/checkout?plan=${checkoutPlanSku}`}
            className="btn-primary text-xs font-bold py-2.5 px-5 rounded-xl shrink-0 flex items-center gap-1.5 shadow-xs"
          >
            <span>Renew Access</span>
            <RefreshCw size={13} />
          </Link>
        </div>
      )}

      {/* ── 1. PW ACTIVE ENROLLED BATCH HERO CARD ──────────────────────────── */}
      <section className="bg-card border border-border/80 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Batch Title & Meta */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                <span>Enrolled &amp; Active</span>
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-muted text-muted-foreground border border-border/60">
                {data.activeCourse.shortName}
              </span>
              {data.activeCourse.daysRemaining && (
                <span className="text-[11px] font-medium text-muted-foreground">
                  • {data.activeCourse.daysRemaining} days left
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight leading-snug">
              {data.batchManagement?.currentBatchTitle || data.activeCourse.title}
            </h1>

            <p className="text-xs text-muted-foreground">
              Official Target 2026 Academic Batch • Includes HD Video Lectures, Class Notes, DPPs &amp; Timed Mocks
            </p>
          </div>

          {/* Action CTAs: Switch Batch & Redeem */}
          <div className="flex items-center gap-2 flex-wrap self-start lg:self-auto shrink-0">
            {data.batchManagement?.canSwitchBatch &&
              (data.batchManagement?.availableBatches?.length || 0) > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBatchId(data.batchManagement?.currentBatchId || null);
                    setShowBatchModal(true);
                  }}
                  className="px-3.5 py-2 rounded-xl border border-border/80 hover:border-primary/50 text-foreground font-bold text-xs flex items-center gap-1.5 bg-muted/40 hover:bg-muted transition-all cursor-pointer"
                >
                  <RotateCcw size={13} className="text-primary" />
                  <span>Switch Batch</span>
                </button>
              )}

            <button
              onClick={() => setShowRedeemModal(true)}
              className="px-3.5 py-2 rounded-xl border border-primary/30 hover:bg-primary/5 text-primary font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <KeyRound size={13} />
              <span>Redeem Key</span>
            </button>
          </div>
        </div>

        {/* Batch Progress Bar */}
        <div className="pt-2 border-t border-border/60 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-muted-foreground flex items-center gap-1.5">
              <TrendingUp size={13} className="text-emerald-500" />
              <span>Curriculum Completion</span>
            </span>
            <span className="font-bold text-foreground font-mono">
              {batchCompletionPct}% Completed
            </span>
          </div>
          <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-emerald-500 rounded-full transition-all duration-700"
              style={{ width: `${batchCompletionPct}%` }}
            />
          </div>
        </div>

        {/* PW Instant Resume Bar (What to study next in 1 click) */}
        <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center shrink-0 shadow-xs">
              <Play size={14} fill="currentColor" />
            </span>
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold text-primary tracking-wider block">
                {data.lastLesson ? 'Continue Where You Left Off' : 'Next Recommended Win'}
              </span>
              <p className="text-xs font-bold text-foreground truncate">
                {data.lastLesson
                  ? `${data.lastLesson.chapterTitle} (${data.lastLesson.subjectDisplayName})`
                  : data.recommendation.title}
              </p>
            </div>
          </div>

          <Link
            href={data.lastLesson ? data.lastLesson.resumeHref : data.recommendation.actionHref}
            className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs shrink-0 self-start sm:self-auto"
          >
            <span>{data.lastLesson ? 'Resume Lesson' : 'Start Task'}</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </section>

      {/* ── 2. PHYSICSWALLAH (PW) CORE 6-TAB NAVIGATION ────────────────────── */}
      <section className="space-y-4">
        {/* Navigation Tab Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-border/70">
          <button
            onClick={() => setActiveTab('schedule')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
              activeTab === 'schedule'
                ? 'bg-primary text-white shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            }`}
          >
            <Calendar size={14} />
            <span>Today&apos;s Schedule</span>
            {incompletePlanTasks.length > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  activeTab === 'schedule' ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'
                }`}
              >
                {incompletePlanTasks.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('classes')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
              activeTab === 'classes'
                ? 'bg-primary text-white shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            }`}
          >
            <BookOpen size={14} />
            <span>Classes &amp; Notes</span>
          </button>

          <button
            onClick={() => setActiveTab('tests')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
              activeTab === 'tests'
                ? 'bg-primary text-white shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            }`}
          >
            <Award size={14} />
            <span>Test Series</span>
            {data.recentTestPerformance.length > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  activeTab === 'tests' ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'
                }`}
              >
                {data.recentTestPerformance.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('dpp')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
              activeTab === 'dpp'
                ? 'bg-primary text-white shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            }`}
          >
            <Zap size={14} />
            <span>DPPs &amp; Practice</span>
            {pendingDrillCount > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  activeTab === 'dpp' ? 'bg-white/20 text-white' : 'bg-amber-500/10 text-amber-600'
                }`}
              >
                {pendingDrillCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('doubts')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
              activeTab === 'doubts'
                ? 'bg-primary text-white shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            }`}
          >
            <Brain size={14} />
            <span>Galti Sudhar &amp; Saarthi</span>
          </button>

          <button
            onClick={() => setActiveTab('notices')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
              activeTab === 'notices'
                ? 'bg-primary text-white shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            }`}
          >
            <Bell size={14} />
            <span>Notice Board</span>
            {data.announcements.length > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  activeTab === 'notices' ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'
                }`}
              >
                {data.announcements.length}
              </span>
            )}
          </button>
        </div>

        {/* ── TAB 1: SCHEDULE & TODAY ────────────────────────────────────────── */}
        {activeTab === 'schedule' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Live Class Highlight Banner */}
            {data.upcomingLiveClass && (
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-red-500/10 via-card to-card border border-red-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
                <div className="flex items-center gap-3.5">
                  <span className="w-10 h-10 rounded-xl bg-red-500/20 text-red-600 flex items-center justify-center shrink-0">
                    <Radio size={20} className="animate-pulse" />
                  </span>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase px-2 py-0.2 rounded bg-red-500 text-white">
                        {data.upcomingLiveClass.status === 'live' ? 'LIVE NOW' : 'NEXT LIVE CLASS'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(data.upcomingLiveClass.scheduledAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-foreground">
                      {data.upcomingLiveClass.title}
                    </h3>
                    {data.upcomingLiveClass.instructorName && (
                      <p className="text-[11px] text-muted-foreground">
                        Mentor: {data.upcomingLiveClass.instructorName}
                      </p>
                    )}
                  </div>
                </div>

                <Link
                  href="/live-classes"
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs shrink-0 self-start sm:self-auto"
                >
                  <Radio size={13} />
                  <span>Join Classroom</span>
                </Link>
              </div>
            )}

            {/* PW 3-Pillar Daily Mission Card (Psychological Habit Loop) */}
            {data.gamification && (
              <div className="bg-gradient-to-br from-primary/5 via-card to-card border border-primary/20 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg shrink-0">
                      🎯
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm sm:text-base font-black text-foreground">
                          PhysicsWallah 3-Pillar Daily Mission
                        </h3>
                        <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                          +100 XP Bonus
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Build relentless study momentum: Lecture + DPP Practice + Galti Sudhar Spaced Repetition
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-start sm:self-auto">
                    <div className="text-right">
                      <span className="text-xs font-bold text-foreground font-mono block">
                        {data.gamification.dailyMission.completedCount} of 3 Goals Done
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {data.gamification.dailyMission.completedCount === 3
                          ? 'All Goals Completed Today!'
                          : `${3 - data.gamification.dailyMission.completedCount} remaining`}
                      </span>
                    </div>

                    {data.gamification.dailyMission.completedCount === 3 && (
                      <button
                        onClick={handleClaimDailyMission}
                        disabled={claimingMissionBonus || (data.gamification.dailyMission as any).bonusClaimed}
                        className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-xs flex items-center gap-1 shadow-sm hover:opacity-95 transition-all disabled:opacity-50 cursor-pointer animate-pulse"
                      >
                        <Sparkles size={13} />
                        <span>
                          {(data.gamification.dailyMission as any).bonusClaimed
                            ? 'Claimed (+100 XP)'
                            : claimingMissionBonus
                            ? 'Claiming...'
                            : 'Claim +100 XP'}
                        </span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Mission Completion Progress Bar */}
                <div className="space-y-1.5">
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary via-emerald-500 to-amber-500 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.round((data.gamification.dailyMission.completedCount / 3) * 100)}%`,
                      }}
                    />
                  </div>
                </div>

                {/* 3 Pillars */}
                <div className="grid sm:grid-cols-3 gap-3.5 pt-1">
                  {/* Pillar 1: Lecture */}
                  <div
                    className={`p-4 rounded-xl border transition-all flex flex-col justify-between space-y-3 ${
                      data.gamification.dailyMission.watchLecture
                        ? 'bg-emerald-500/5 border-emerald-500/30'
                        : 'bg-muted/20 border-border/80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-base">🎬</span>
                          <span className="text-[10px] font-mono font-bold uppercase text-primary px-1.5 py-0.2 rounded bg-primary/10">
                            Pillar 1
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-foreground">Watch 1 Concept Lecture</h4>
                        <p className="text-[11px] text-muted-foreground">
                          Watch at least 10 mins of today&apos;s chapter lecture video
                        </p>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                          data.gamification.dailyMission.watchLecture
                            ? 'bg-emerald-500 text-white'
                            : 'border-2 border-muted-foreground/30 text-transparent'
                        }`}
                      >
                        <Check size={12} strokeWidth={3} />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border/40 text-[11px]">
                      <span className="font-mono text-muted-foreground">+50 XP</span>
                      <button
                        onClick={() => setActiveTab('classes')}
                        className="font-bold text-primary hover:underline flex items-center gap-0.5 cursor-pointer"
                      >
                        <span>{data.gamification.dailyMission.watchLecture ? 'Reviewed' : 'Start Lecture'}</span>
                        <ChevronRight size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Pillar 2: DPP */}
                  <div
                    className={`p-4 rounded-xl border transition-all flex flex-col justify-between space-y-3 ${
                      data.gamification.dailyMission.solveDpp
                        ? 'bg-emerald-500/5 border-emerald-500/30'
                        : 'bg-muted/20 border-border/80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-base">⚡</span>
                          <span className="text-[10px] font-mono font-bold uppercase text-emerald-600 px-1.5 py-0.2 rounded bg-emerald-500/10">
                            Pillar 2
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-foreground">Solve Today&apos;s Chapter DPP</h4>
                        <p className="text-[11px] text-muted-foreground">
                          Complete 5+ high-yield practice MCQs with -0.25 marking
                        </p>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                          data.gamification.dailyMission.solveDpp
                            ? 'bg-emerald-500 text-white'
                            : 'border-2 border-muted-foreground/30 text-transparent'
                        }`}
                      >
                        <Check size={12} strokeWidth={3} />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border/40 text-[11px]">
                      <span className="font-mono text-muted-foreground">+30 XP</span>
                      <button
                        onClick={() => setActiveTab('dpp')}
                        className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                      >
                        <span>{data.gamification.dailyMission.solveDpp ? 'Solved' : 'Open DPP'}</span>
                        <ChevronRight size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Pillar 3: Galti Sudhar SM-2 */}
                  <div
                    className={`p-4 rounded-xl border transition-all flex flex-col justify-between space-y-3 ${
                      data.gamification.dailyMission.reviewGaltiSudhar
                        ? 'bg-emerald-500/5 border-emerald-500/30'
                        : 'bg-muted/20 border-border/80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-base">🧠</span>
                          <span className="text-[10px] font-mono font-bold uppercase text-rose-600 px-1.5 py-0.2 rounded bg-rose-500/10">
                            Pillar 3
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-foreground">Galti Sudhar Review</h4>
                        <p className="text-[11px] text-muted-foreground">
                          {data.gamification.dueFlashcardsCount > 0
                            ? `${data.gamification.dueFlashcardsCount} spaced repetition cards due today`
                            : 'All due mistake flashcards cleared today'}
                        </p>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                          data.gamification.dailyMission.reviewGaltiSudhar
                            ? 'bg-emerald-500 text-white'
                            : 'border-2 border-muted-foreground/30 text-transparent'
                        }`}
                      >
                        <Check size={12} strokeWidth={3} />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border/40 text-[11px]">
                      <span className="font-mono text-muted-foreground">+20 XP</span>
                      <Link
                        href="/mistake-analyser"
                        className="font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-0.5"
                      >
                        <span>Review Notebook</span>
                        <ChevronRight size={12} />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Today's Structured Tasks (PW Daily Target) */}
            <div className="bg-card border border-border/80 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <ListTodo size={16} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">
                      {data.todayStudyPlan.planTitle}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Target: {data.todayStudyPlan.dailyHoursTarget} hours • {completedCount} of{' '}
                      {totalTasksCount} targets completed today
                    </p>
                  </div>
                </div>

                <Link
                  href="/study-plan"
                  className="text-xs font-bold text-primary hover:underline flex items-center gap-1 self-start sm:self-auto"
                >
                  <span>Customize Schedule</span>
                  <ChevronRight size={14} />
                </Link>
              </div>

              <div className="grid sm:grid-cols-3 gap-3.5">
                {data.todayStudyPlan.tasks.map((task) => {
                  const isDone = completedTasks[task.id];
                  return (
                    <div
                      key={task.id}
                      onClick={() => toggleTask(task.id)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                        isDone
                          ? 'bg-emerald-500/5 border-emerald-500/30 text-muted-foreground'
                          : 'bg-muted/20 border-border/80 hover:border-primary/40 text-foreground'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                            isDone ? 'bg-emerald-500 text-white' : 'border-2 border-muted-foreground/40'
                          }`}
                        >
                          {isDone && <Check size={12} strokeWidth={3} />}
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] font-mono font-bold uppercase text-primary px-2 py-0.5 rounded bg-primary/10">
                            {task.subject}
                          </span>
                          <h4
                            className={`text-xs font-bold leading-snug ${
                              isDone ? 'line-through opacity-70' : ''
                            }`}
                          >
                            {task.title}
                          </h4>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-border/40 text-[11px]">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Clock size={12} />
                          <span>~{task.estimatedMins} mins</span>
                        </span>
                        <Link
                          href={task.actionHref}
                          onClick={(e) => e.stopPropagation()}
                          className="font-bold text-primary hover:underline flex items-center gap-0.5"
                        >
                          <span>Start Task</span>
                          <ArrowRight size={11} />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick-Access 6 Pillars Navigation Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <Link
                href="/subjects"
                className="bg-card border border-border/80 hover:border-primary/50 rounded-2xl p-3.5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div className="flex items-center justify-between">
                  <span className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center text-sm font-bold">
                    📚
                  </span>
                  <span className="text-[9px] font-mono font-bold uppercase text-muted-foreground">
                    Learn
                  </span>
                </div>
                <div className="mt-2 space-y-0.5">
                  <h4 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                    Curriculum
                  </h4>
                  <p className="text-[10px] text-muted-foreground line-clamp-1">All subjects &amp; chapters</p>
                </div>
              </Link>

              <Link
                href="/practice"
                className="bg-card border border-border/80 hover:border-emerald-500/50 rounded-2xl p-3.5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div className="flex items-center justify-between">
                  <span className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-sm font-bold">
                    ⚡
                  </span>
                  <span className="text-[9px] font-mono font-bold uppercase text-emerald-600">
                    15,000+
                  </span>
                </div>
                <div className="mt-2 space-y-0.5">
                  <h4 className="text-xs font-bold text-foreground group-hover:text-emerald-600 transition-colors">
                    Question Bank
                  </h4>
                  <p className="text-[10px] text-muted-foreground line-clamp-1">Topicwise past MCQs</p>
                </div>
              </Link>

              <Link
                href="/mock-tests"
                className="bg-card border border-border/80 hover:border-indigo-500/50 rounded-2xl p-3.5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div className="flex items-center justify-between">
                  <span className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center text-sm font-bold">
                    📝
                  </span>
                  <span className="text-[9px] font-mono font-bold uppercase text-indigo-600">
                    CBT
                  </span>
                </div>
                <div className="mt-2 space-y-0.5">
                  <h4 className="text-xs font-bold text-foreground group-hover:text-indigo-600 transition-colors">
                    Mock Tests
                  </h4>
                  <p className="text-[10px] text-muted-foreground line-clamp-1">200Q -0.25 Marking</p>
                </div>
              </Link>

              <Link
                href="/battle-arena"
                className="bg-gradient-to-br from-amber-500/10 via-card to-card border border-amber-500/40 hover:border-amber-500 rounded-2xl p-3.5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div className="flex items-center justify-between">
                  <span className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center text-sm font-bold">
                    ⚔️
                  </span>
                  <span className="text-[9px] font-mono font-black uppercase px-1 rounded bg-amber-500 text-black">
                    Rs. 1,000
                  </span>
                </div>
                <div className="mt-2 space-y-0.5">
                  <h4 className="text-xs font-bold text-amber-600 dark:text-amber-400 group-hover:underline">
                    Battle Arena
                  </h4>
                  <p className="text-[10px] text-muted-foreground line-clamp-1">1v1 Daily Cash Duels</p>
                </div>
              </Link>

              <Link
                href="/free-resources"
                className="bg-card border border-border/80 hover:border-primary/50 rounded-2xl p-3.5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div className="flex items-center justify-between">
                  <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                    📖
                  </span>
                  <span className="text-[9px] font-mono font-bold uppercase text-primary">
                    Free
                  </span>
                </div>
                <div className="mt-2 space-y-0.5">
                  <h4 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                    Formula Vault
                  </h4>
                  <p className="text-[10px] text-muted-foreground line-clamp-1">KaTeX Notes &amp; Formulas</p>
                </div>
              </Link>

              <Link
                href="/mistake-analyser"
                className="bg-card border border-border/80 hover:border-rose-500/50 rounded-2xl p-3.5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div className="flex items-center justify-between">
                  <span className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center text-sm font-bold">
                    🔍
                  </span>
                  <span className="text-[9px] font-mono font-bold uppercase text-rose-600">
                    SM-2
                  </span>
                </div>
                <div className="mt-2 space-y-0.5">
                  <h4 className="text-xs font-bold text-foreground group-hover:text-rose-600 transition-colors">
                    Galti Sudhar
                  </h4>
                  <p className="text-[10px] text-muted-foreground line-clamp-1">Mistakes &amp; Flashcards</p>
                </div>
              </Link>
            </div>
          </div>
        )}

        {/* ── TAB 2: CLASSES & NOTES (PW CURRICULUM CLONE) ───────────────────── */}
        {activeTab === 'classes' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Subject Filters & Search Bar */}
            <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Subject Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                <button
                  onClick={() => setSelectedSubjectId('all')}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
                    selectedSubjectId === 'all'
                      ? 'bg-primary text-white shadow-xs'
                      : 'bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  All Subjects
                </button>
                {curriculumSubjects.map((sub) => {
                  const isSelected = selectedSubjectId === sub.id;
                  return (
                    <button
                      key={sub.id}
                      onClick={() => setSelectedSubjectId(sub.id)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
                        isSelected
                          ? 'bg-primary text-white shadow-xs'
                          : 'bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                    >
                      {sub.displayName}
                    </button>
                  );
                })}
              </div>

              {/* Search Box */}
              <div className="relative sm:w-64 shrink-0">
                <Search size={14} className="absolute left-3 top-2.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search chapters or topics..."
                  value={chapterSearch}
                  onChange={(e) => setChapterSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-muted/30 border border-border rounded-xl text-xs text-foreground focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* Chapters & Content View */}
            {curriculumLoading ? (
              <div className="p-12 flex flex-col items-center justify-center space-y-3 bg-card border border-border/80 rounded-2xl">
                <Loader2 size={32} className="animate-spin text-primary" />
                <p className="text-xs font-bold text-muted-foreground">
                  Fetching batch syllabus and lectures...
                </p>
              </div>
            ) : filteredCurriculumSubjects.length === 0 ? (
              <div className="p-8 text-center bg-card border border-border/80 rounded-2xl space-y-2">
                <BookOpen size={28} className="mx-auto text-muted-foreground/60" />
                <h4 className="text-sm font-bold text-foreground">No subjects found</h4>
                <p className="text-xs text-muted-foreground">
                  Curriculum for this batch is syncing with the academic timetable.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredCurriculumSubjects.map((subject) => {
                  // Collect all chapters across units
                  const allChapters = subject.units.flatMap((u) => u.chapters);
                  const filteredChapters = allChapters.filter((c) =>
                    c.title.toLowerCase().includes(chapterSearch.toLowerCase())
                  );

                  if (filteredChapters.length === 0) return null;

                  return (
                    <div
                      key={subject.id}
                      className="bg-card border border-border/80 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4"
                    >
                      <div className="flex items-center justify-between border-b border-border/60 pb-3">
                        <div className="flex items-center gap-2.5">
                          <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                            📖
                          </span>
                          <div>
                            <h3 className="text-base font-bold text-foreground">
                              {subject.displayName}
                            </h3>
                            <span className="text-xs text-muted-foreground">
                              {filteredChapters.length} Chapters in Syllabus
                            </span>
                          </div>
                        </div>

                        <Link
                          href={`/subjects?subject=${encodeURIComponent(subject.name)}`}
                          className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                        >
                          <span>Open Subject Portal</span>
                          <ArrowRight size={13} />
                        </Link>
                      </div>

                      {/* Chapters Accordion List */}
                      <div className="space-y-3">
                        {filteredChapters.map((chapter, chapIdx) => {
                          const isExpanded = expandedChapterId === chapter.id;
                          const videoLessons = chapter.lessons.filter(
                            (l) => l.type === 'recorded_video'
                          );
                          const noteLessons = chapter.lessons.filter(
                            (l) => l.type === 'pdf_note' || l.type === 'text_lesson'
                          );
                          const quizLessons = chapter.lessons.filter((l) => l.type === 'quiz');

                          return (
                            <div
                              key={chapter.id}
                              className={`border rounded-xl transition-all overflow-hidden ${
                                isExpanded
                                  ? 'border-primary/50 bg-primary/5 shadow-xs'
                                  : 'border-border/70 bg-card hover:border-border'
                              }`}
                            >
                              {/* Chapter Header */}
                              <div
                                onClick={() =>
                                  setExpandedChapterId(isExpanded ? null : chapter.id)
                                }
                                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer"
                              >
                                <div className="flex items-center gap-3">
                                  <span className="w-7 h-7 rounded-lg bg-muted text-muted-foreground font-mono font-bold text-xs flex items-center justify-center shrink-0">
                                    {chapIdx + 1}
                                  </span>
                                  <div>
                                    <h4 className="text-xs sm:text-sm font-bold text-foreground">
                                      {chapter.title}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                                      <span>🎥 {videoLessons.length} Lectures</span>
                                      <span>• 📄 {noteLessons.length} Notes</span>
                                      <span>• ⚡ {quizLessons.length} DPP Quiz</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3 self-end sm:self-auto">
                                  <span className="text-xs font-bold text-primary flex items-center gap-1">
                                    <span>{isExpanded ? 'Hide Content' : 'View Content'}</span>
                                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                  </span>
                                </div>
                              </div>

                              {/* Chapter Content Expanded (PW Style Lectures & DPPs) */}
                              {isExpanded && (
                                <div className="p-4 pt-0 border-t border-border/40 space-y-3">
                                  {chapter.lessons.length === 0 ? (
                                    <p className="text-xs text-muted-foreground py-2">
                                      Lectures and DPPs for this chapter are scheduled for this week.
                                    </p>
                                  ) : (
                                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-3">
                                      {chapter.lessons.map((lesson) => {
                                        const isVid = lesson.type === 'recorded_video';
                                        const isPdf = lesson.type === 'pdf_note' || lesson.type === 'text_lesson';
                                        const isQuiz = lesson.type === 'quiz';

                                        return (
                                          <div
                                            key={lesson.id}
                                            className="p-3.5 rounded-xl bg-card border border-border/80 hover:border-primary/40 transition-all flex flex-col justify-between space-y-3 shadow-xs"
                                          >
                                            <div className="space-y-1">
                                              <div className="flex items-center justify-between text-[10px]">
                                                <span
                                                  className={`font-mono font-bold uppercase px-1.5 py-0.2 rounded ${
                                                    isVid
                                                      ? 'bg-blue-500/10 text-blue-600'
                                                      : isPdf
                                                      ? 'bg-emerald-500/10 text-emerald-600'
                                                      : 'bg-amber-500/10 text-amber-600'
                                                  }`}
                                                >
                                                  {isVid
                                                    ? 'Video Lecture'
                                                    : isPdf
                                                    ? 'Class Notes'
                                                    : 'Chapter DPP'}
                                                </span>
                                                {lesson.durationSec && (
                                                  <span className="text-muted-foreground font-mono">
                                                    {Math.round(lesson.durationSec / 60)}m
                                                  </span>
                                                )}
                                              </div>
                                              <h5 className="text-xs font-bold text-foreground line-clamp-2">
                                                {lesson.title}
                                              </h5>
                                            </div>

                                            <div className="pt-2 border-t border-border/40 flex items-center justify-between text-xs">
                                              {isVid ? (
                                                <button
                                                  type="button"
                                                  onClick={() =>
                                                    setActiveVideo({
                                                      id: lesson.id,
                                                      title: lesson.title,
                                                      videoUrl: lesson.videoUrl,
                                                      durationSec: lesson.durationSec,
                                                    })
                                                  }
                                                  className="font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                                                >
                                                  <PlayCircle size={14} />
                                                  <span>Watch Lecture</span>
                                                </button>
                                              ) : isPdf ? (
                                                <a
                                                  href={lesson.pdfUrl || `/free-resources`}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="font-bold text-emerald-600 hover:underline flex items-center gap-1"
                                                >
                                                  <Download size={13} />
                                                  <span>Open Notes</span>
                                                </a>
                                              ) : (
                                                <Link
                                                  href={`/practice?chapter=${chapter.id}`}
                                                  className="font-bold text-amber-600 hover:underline flex items-center gap-1"
                                                >
                                                  <Zap size={13} />
                                                  <span>Solve DPP</span>
                                                </Link>
                                              )}

                                              <Link
                                                href={`/learn/${lesson.id}`}
                                                className="text-[11px] text-muted-foreground hover:text-foreground font-medium"
                                              >
                                                Full View &rarr;
                                              </Link>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 3: TEST SERIES & MOCKS ─────────────────────────────────────── */}
        {activeTab === 'tests' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Active Full Mock Test Hero */}
            <div className="bg-gradient-to-r from-indigo-900/90 via-indigo-800 to-primary text-white rounded-2xl p-6 sm:p-7 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
              <div className="space-y-2 max-w-xl">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 text-white border border-white/20">
                  {isSee ? '36-Set Board Model Papers' : 'CEE Standard 200Q CBT'}
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  {isSee
                    ? 'SEE Class 10 Model Examination 2082'
                    : 'CEE Full-Length Grand Mock Test #08'}
                </h3>
                <p className="text-xs text-white/85 leading-relaxed">
                  {isSee
                    ? '3 Hours • CDC Curriculum Standard • Step-by-step scoring with handwritten OCR check'
                    : '200 Questions • 3 Hours • -0.25 Negative Marking • Percentile Ranking across all Nepal peers'}
                </p>
              </div>

              <Link
                href="/mock-tests"
                className="px-6 py-3 bg-white text-indigo-950 font-black text-xs rounded-xl hover:bg-white/95 shadow-md transition-all flex items-center gap-2 shrink-0 self-start md:self-auto"
              >
                <Play size={14} fill="currentColor" />
                <span>Start Timed Exam</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            {/* Test Performance Breakdown & Past Attempts */}
            <div className="bg-card border border-border/80 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <BarChart2 size={16} className="text-primary" />
                  <h3 className="text-sm font-bold text-foreground">Past Mock Test Results &amp; Percentiles</h3>
                </div>
                <Link href="/mock-tests" className="text-xs font-bold text-primary hover:underline">
                  All Mock Sets &rarr;
                </Link>
              </div>

              {data.recentTestPerformance.length > 0 ? (
                <div className="space-y-3">
                  {data.recentTestPerformance.map((test) => (
                    <div
                      key={test.id}
                      className="p-4 rounded-xl bg-muted/20 border border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-primary/40 transition-all"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h5 className="text-xs sm:text-sm font-bold text-foreground">
                            {test.title}
                          </h5>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.2 rounded ${
                              test.percentage >= 75
                                ? 'bg-emerald-500/10 text-emerald-600'
                                : test.percentage >= 50
                                ? 'bg-amber-500/10 text-amber-600'
                                : 'bg-red-500/10 text-red-600'
                            }`}
                          >
                            {test.percentage}% Accuracy
                          </span>
                        </div>
                        <span className="text-[11px] text-muted-foreground">
                          Attempted on {test.date}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 self-start sm:self-auto">
                        <div className="text-right">
                          <span className="text-sm font-extrabold text-foreground">
                            {test.score} / {test.totalMarks}
                          </span>
                          <span className="text-[10px] text-muted-foreground block font-mono">
                            Score
                          </span>
                        </div>

                        <Link
                          href={test.reviewHref}
                          className="px-3.5 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs transition-colors"
                        >
                          Review Mistakes
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-muted/10 border border-border/50 rounded-xl space-y-2">
                  <Award size={26} className="mx-auto text-muted-foreground/60" />
                  <h4 className="text-xs font-bold text-foreground">No mock tests attempted yet</h4>
                  <p className="text-[11px] text-muted-foreground">
                    Take your first timed mock exam to generate rank predictions and error diagnosis.
                  </p>
                  <div className="pt-1">
                    <Link href="/mock-tests" className="btn-primary text-xs font-bold py-2 px-4 rounded-xl inline-flex">
                      Take First Mock Test
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Rank Predictor CTA */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
                  <Trophy size={18} />
                </span>
                <div>
                  <h4 className="text-xs font-bold text-foreground">
                    Nepal CEE / SEE Rank Predictor
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    Simulate your merit standing and scholarship probability based on mock accuracy.
                  </p>
                </div>
              </div>
              <Link
                href="/rank-predictor"
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs shrink-0 self-start sm:self-auto"
              >
                <span>Calculate My Rank</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        )}

        {/* ── TAB 4: DPPS & PRACTICE ─────────────────────────────────────────── */}
        {activeTab === 'dpp' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* PW Backlog Recovery Planner ("Study Sahayak") */}
            <div className="bg-card border border-border/80 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <Zap size={16} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-foreground">
                        Study Sahayak • Backlog &amp; DPP Catchup
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                        PW Mode
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Catch up on missed syllabus &amp; unattempted DPPs systematically
                    </p>
                  </div>
                </div>

                {/* Mode Selector */}
                <div className="flex items-center bg-muted/60 p-1 rounded-xl border border-border/60 text-xs self-start sm:self-auto">
                  <button
                    onClick={() => setBacklogMode('express')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                      backlogMode === 'express'
                        ? 'bg-card text-foreground font-bold shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Express (3D)
                  </button>
                  <button
                    onClick={() => setBacklogMode('balanced')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                      backlogMode === 'balanced'
                        ? 'bg-card text-foreground font-bold shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Balanced (7D)
                  </button>
                  <button
                    onClick={() => setBacklogMode('weekend')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                      backlogMode === 'weekend'
                        ? 'bg-card text-foreground font-bold shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Weekend Sprint
                  </button>
                </div>
              </div>

              {/* Backlog Summary & Progress */}
              <div className="grid sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                      Pending Syllabus
                    </span>
                    <p className="text-lg font-extrabold text-foreground">
                      {unfinishedChapterCount} {unfinishedChapterCount === 1 ? 'Session' : 'Sessions'}
                    </p>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground font-semibold">
                    ~{unfinishedChapterMins} mins
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-indigo-500/5 border border-indigo-500/20 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      Weak-Topic DPPs
                    </span>
                    <p className="text-lg font-extrabold text-foreground">
                      {pendingDrillCount} {pendingDrillCount === 1 ? 'Drill' : 'Drills'}
                    </p>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground font-semibold">
                    {totalWeakTopicErrors} Misses
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      Recovery Pace ({recoveryProgressPct}%)
                    </span>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      {backlogMode === 'express'
                        ? '+2h / day'
                        : backlogMode === 'balanced'
                        ? '+45m / day'
                        : 'Sat & Sun'}
                    </span>
                  </div>
                  <div className="w-full bg-emerald-500/20 h-1.5 rounded-full overflow-hidden mt-2">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${recoveryProgressPct}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Actionable Backlog Queue */}
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Catch-Up Priority Queue ({displayedBacklogQueue.length} Active)
                  </span>
                  <Link
                    href="/practice"
                    className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1"
                  >
                    <span>Browse All DPPs</span>
                    <ArrowRight size={11} />
                  </Link>
                </div>

                {displayedBacklogQueue.length > 0 ? (
                  <div className="grid sm:grid-cols-3 gap-3">
                    {displayedBacklogQueue.map((item) => (
                      <div
                        key={item.id}
                        className="p-3.5 rounded-xl bg-muted/20 border border-border/70 hover:border-primary/40 transition-all flex flex-col justify-between space-y-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono font-bold uppercase text-primary px-1.5 py-0.5 rounded bg-primary/10">
                              {item.subject}
                            </span>
                            <span className="text-[10px] font-semibold text-muted-foreground">
                              {item.type === 'chapter'
                                ? 'Chapter'
                                : item.type === 'dpp'
                                ? 'DPP Drill'
                                : 'Task'}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold leading-snug text-foreground">
                            {item.title}
                          </h4>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-border/40 text-[11px]">
                          <span className="text-muted-foreground font-mono">{item.meta}</span>
                          <Link
                            href={item.href}
                            className="font-bold text-primary hover:underline flex items-center gap-0.5"
                          >
                            <span>{item.cta}</span>
                            <ArrowRight size={11} />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-foreground">
                          Zero Backlog — You&apos;re 100% Caught Up!
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          All scheduled tasks and weak-topic drills are cleared.
                        </p>
                      </div>
                    </div>
                    <Link
                      href="/practice"
                      className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 shrink-0"
                    >
                      <span>Practice Ahead</span>
                      <ArrowRight size={12} />
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Target Weak Topics Drill List */}
            <div className="bg-card border border-border/80 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={16} className="text-amber-500" />
                  <h3 className="text-sm font-bold text-foreground">Target Weak Topics (Error Diagnostics)</h3>
                </div>
                <Link href="/mistake-analyser" className="text-xs font-bold text-primary hover:underline">
                  Full Error Log &rarr;
                </Link>
              </div>

              {data.weakTopics.length > 0 ? (
                <div className="grid sm:grid-cols-2 gap-3">
                  {data.weakTopics.map((wt) => (
                    <div
                      key={wt.id}
                      className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-center justify-between gap-3"
                    >
                      <div className="space-y-0.5">
                        <h5 className="text-xs font-bold text-foreground">{wt.title}</h5>
                        <span className="text-[10px] text-muted-foreground">
                          {wt.errorCount} incorrect attempts • {wt.accuracy}% accuracy
                        </span>
                      </div>
                      <Link
                        href={wt.practiceHref}
                        className="px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 font-bold text-xs flex items-center gap-1 shrink-0"
                      >
                        <span>Drill DPP</span>
                        <ArrowRight size={11} />
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center bg-muted/15 border border-border/50 rounded-xl space-y-2">
                  <CheckCircle2 size={24} className="mx-auto text-emerald-500" />
                  <p className="text-xs font-bold text-foreground">No weak topics detected</p>
                  <p className="text-[11px] text-muted-foreground">
                    Continue solving questions to trigger automatic error diagnostics.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB 5: GALTI SUDHAR & DOUBTS (PW SAARTHI) ───────────────────────── */}
        {activeTab === 'doubts' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Ask AI Saarthi Doubt Box */}
            <div className="bg-card border border-border/80 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-3 border-b border-border/60 pb-3">
                <span className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Brain size={18} />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    Ask PW Saarthi • Instant AI Doubt Solver
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    24/7 step-by-step solutions for Physics derivations, Chemistry reactions &amp; Biology traps
                  </p>
                </div>
              </div>

              <form onSubmit={handleAskDoubt} className="space-y-3">
                <div className="relative">
                  <textarea
                    rows={3}
                    placeholder="Type or paste your doubt here... (e.g. Why does boiling point increase with pressure? Solve a numerical problem...)"
                    value={doubtQuestion}
                    onChange={(e) => setDoubtQuestion(e.target.value)}
                    className="w-full p-3.5 bg-muted/20 border border-border rounded-xl text-xs text-foreground focus:outline-none focus:border-primary resize-none"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">
                    Supports KaTeX formulas &amp; CDC exam rubrics
                  </span>
                  <button
                    type="submit"
                    disabled={!doubtQuestion.trim()}
                    className="px-5 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    <Send size={12} />
                    <span>Ask AI Saarthi</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Galti Sudhar & Flashcards 2-Column Grid */}
            <div className="grid lg:grid-cols-2 gap-5">
              {/* Galti Sudhar Mistake Diary */}
              <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-xs space-y-3.5 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center font-bold text-sm">
                      📖
                    </span>
                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-rose-500/10 text-rose-600">
                      {data.gamification?.dueFlashcardsCount
                        ? `${data.gamification.dueFlashcardsCount} Due Today`
                        : 'Auto-Logged'}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-foreground">
                    Galti Sudhar • Error Notebook
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Every question you answered incorrectly in mock tests, quizzes, and Battle Arena is saved here for targeted revision.
                  </p>
                </div>

                <Link
                  href="/mistake-analyser"
                  className="w-full py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 font-bold text-xs text-center border border-rose-500/30 flex items-center justify-center gap-1.5 transition-all"
                >
                  <span>Open Galti Sudhar Mistake Diary</span>
                  <ArrowRight size={13} />
                </Link>
              </div>

              {/* SM-2 Spaced Repetition Flashcards */}
              <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-xs space-y-3.5 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold text-sm">
                      ⚡
                    </span>
                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600">
                      {data.gamification?.dueFlashcardsCount
                        ? `${data.gamification.dueFlashcardsCount} Cards Scheduled`
                        : 'SuperMemo SM-2'}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-foreground">
                    Active Recall Flashcards
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    High-yield definitions, formula derivations, and past medical entrance trivia scheduled for review today.
                  </p>
                </div>

                <Link
                  href="/flashcards"
                  className="w-full py-2.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-bold text-xs text-center border border-indigo-500/30 flex items-center justify-center gap-1.5 transition-all"
                >
                  <span>Review Due Flashcards</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>

            {/* Gamification Achievements & Mastery Badges */}
            {data.gamification?.badges && data.gamification.badges.length > 0 && (
              <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <div className="flex items-center gap-2">
                    <Award size={16} className="text-amber-500" />
                    <h3 className="text-sm font-bold text-foreground">
                      PW Habit &amp; Mastery Badges
                    </h3>
                  </div>
                  <span className="text-xs font-mono font-bold text-muted-foreground">
                    {data.gamification.badges.filter((b) => b.unlocked).length} of{' '}
                    {data.gamification.badges.length} Unlocked
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {data.gamification.badges.map((badge) => (
                    <div
                      key={badge.id}
                      className={`p-3 rounded-xl border text-center flex flex-col items-center justify-between space-y-2 transition-all ${
                        badge.unlocked
                          ? 'bg-amber-500/5 border-amber-500/30'
                          : 'bg-muted/10 border-border/60 opacity-50 grayscale'
                      }`}
                    >
                      <span className="text-2xl">{badge.icon}</span>
                      <div className="space-y-0.5">
                        <h5 className="text-[11px] font-bold text-foreground leading-snug">
                          {badge.title}
                        </h5>
                        <p className="text-[9px] text-muted-foreground line-clamp-2">
                          {badge.description}
                        </p>
                      </div>
                      <span
                        className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded-full ${
                          badge.unlocked
                            ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {badge.unlocked ? 'Unlocked' : 'Locked'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Vision Marker (Handwritten Paper Check) */}
            <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-emerald-600" />
                  <h3 className="text-sm font-bold text-foreground">
                    AI Subjective Paper Grader (Vision Marker)
                  </h3>
                </div>
                <Link href="/vision-marker" className="text-xs font-bold text-primary hover:underline">
                  Submit Paper &rarr;
                </Link>
              </div>

              {data.pendingAssignments.length > 0 ? (
                <div className="space-y-2.5">
                  {data.pendingAssignments.map((ass) => (
                    <div
                      key={ass.id}
                      className="p-3 rounded-xl bg-muted/20 border border-border/60 flex items-center justify-between gap-3"
                    >
                      <div className="space-y-0.5">
                        <h5 className="text-xs font-bold text-foreground">{ass.title}</h5>
                        <span className="text-[10px] text-muted-foreground">
                          Submitted {ass.submittedAt}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-foreground">
                          {ass.obtainedMarks !== undefined
                            ? `${ass.obtainedMarks} / ${ass.totalMarks}`
                            : 'Evaluating...'}
                        </span>
                        <Link
                          href={ass.actionHref}
                          className="text-[10px] font-bold text-primary hover:underline block"
                        >
                          View Rubric
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 rounded-xl bg-muted/15 border border-border/50 text-center space-y-2">
                  <FileText size={22} className="mx-auto text-muted-foreground/60" />
                  <p className="text-xs font-bold text-foreground">All assignments checked</p>
                  <p className="text-[11px] text-muted-foreground">
                    Snap a photo of your handwritten math derivations or science answers to get instant CDC rubric feedback.
                  </p>
                  <div className="pt-1">
                    <Link
                      href="/vision-marker"
                      className="btn-primary text-xs font-bold py-2 px-4 rounded-xl inline-flex"
                    >
                      Submit Handwritten Paper
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB 6: NOTICE BOARD ────────────────────────────────────────────── */}
        {activeTab === 'notices' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="bg-card border border-border/80 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-primary" />
                  <h3 className="text-sm font-bold text-foreground">Batch Official Announcements</h3>
                </div>
                <span className="text-xs text-muted-foreground">Official Faculty Noticeboard</span>
              </div>

              {data.announcements.length > 0 ? (
                <div className="space-y-3">
                  {data.announcements.map((ann) => (
                    <div
                      key={ann.id}
                      className="p-4 rounded-xl bg-primary/5 border border-primary/15 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {ann.isPinned && (
                            <span className="text-[10px] font-bold uppercase px-2 py-0.2 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300">
                              📌 Pinned
                            </span>
                          )}
                          <h5 className="text-xs sm:text-sm font-bold text-foreground">
                            {ann.title}
                          </h5>
                        </div>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {new Date(ann.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {ann.content}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-muted/15 border border-border/50 rounded-xl space-y-2">
                  <Sparkles size={24} className="mx-auto text-muted-foreground/60" />
                  <p className="text-xs font-bold text-foreground">No new announcements</p>
                  <p className="text-[11px] text-muted-foreground">
                    Important schedule updates, exam notices, and live batch reminders will appear here.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* ── BATCH SWITCHER MODAL ─────────────────────────────────────────── */}
      {showBatchModal && data.batchManagement?.availableBatches && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Switch Batch Cohort"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto"
        >
          <div className="bg-card border border-border/80 rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-5 relative">
            <button
              type="button"
              onClick={() => setShowBatchModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-foreground">Switch Cohort Batch</h3>
              <p className="text-xs text-muted-foreground">
                Choose the academic cohort that best matches your target exam timeline.
              </p>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto">
              {data.batchManagement.availableBatches.map((batch) => {
                const isSelected =
                  selectedBatchId === batch.id ||
                  (!selectedBatchId && batch.id === data.batchManagement?.currentBatchId);
                const isCurrent = batch.id === data.batchManagement?.currentBatchId;

                return (
                  <button
                    key={batch.id}
                    type="button"
                    onClick={() => setSelectedBatchId(batch.id)}
                    className={`w-full p-3.5 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                        : 'border-border/70 hover:bg-muted/40'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-foreground">{batch.title}</span>
                        {isCurrent && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-muted text-muted-foreground">
                            Active
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-muted-foreground font-mono">
                        {batch.priceNpr > 0 ? `NPR ${batch.priceNpr.toLocaleString()}` : 'Free'}
                      </span>
                    </div>

                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/40'
                      }`}
                    >
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-border/60 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowBatchModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={
                  switchingBatch ||
                  !selectedBatchId ||
                  selectedBatchId === data.batchManagement?.currentBatchId
                }
                onClick={() => selectedBatchId && handleSwitchBatch(selectedBatchId)}
                className="btn-primary text-xs font-bold py-2 px-5 rounded-xl flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {switchingBatch ? <Loader2 size={14} className="animate-spin" /> : null}
                <span>Confirm Switch</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── VIDEO PLAYER MODAL ───────────────────────────────────────────── */}
      {activeVideo && (
        <BatchVideoPlayerModal
          video={activeVideo}
          onClose={() => setActiveVideo(null)}
        />
      )}

      {/* ── STREAK REPAIR DRILL MODAL (ANTI-DROPOUT RECOVERY) ────────────── */}
      {showStreakRepairModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border w-full max-w-lg rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold">
                  🔥
                </span>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-foreground">
                    1-Click Streak Repair Drill
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Answer 3 rapid-fire revision questions to restore broken momentum
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowStreakRepairModal(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {!repairCompleted ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-primary">
                    Question {repairQuestionIndex + 1} of {STREAK_REPAIR_QUESTIONS.length}
                  </span>
                  <span className="text-muted-foreground">
                    Subject: {STREAK_REPAIR_QUESTIONS[repairQuestionIndex].subject}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-muted/20 border border-border/70 space-y-2">
                  <p className="text-xs sm:text-sm font-bold text-foreground">
                    {STREAK_REPAIR_QUESTIONS[repairQuestionIndex].question}
                  </p>
                </div>

                <div className="space-y-2">
                  {STREAK_REPAIR_QUESTIONS[repairQuestionIndex].options.map((opt, optIdx) => {
                    const isSelected = repairSelectedOption === optIdx;
                    return (
                      <button
                        key={optIdx}
                        type="button"
                        onClick={() => setRepairSelectedOption(optIdx)}
                        className={`w-full p-3 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-primary/10 border-primary text-primary font-bold'
                            : 'bg-card border-border/70 hover:bg-muted/40 text-foreground'
                        }`}
                      >
                        <span>{opt}</span>
                        <div
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/30'
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="pt-2 border-t border-border/60 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    disabled={repairSelectedOption === null}
                    onClick={() => {
                      if (repairSelectedOption === null) return;
                      const isCorrect =
                        repairSelectedOption ===
                        STREAK_REPAIR_QUESTIONS[repairQuestionIndex].correctIndex;
                      if (isCorrect) setRepairScore((s) => s + 1);

                      if (repairQuestionIndex + 1 < STREAK_REPAIR_QUESTIONS.length) {
                        setRepairQuestionIndex((i) => i + 1);
                        setRepairSelectedOption(null);
                      } else {
                        setRepairCompleted(true);
                      }
                    }}
                    className="btn-primary text-xs font-bold py-2 px-5 rounded-xl flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    <span>
                      {repairQuestionIndex + 1 < STREAK_REPAIR_QUESTIONS.length
                        ? 'Next Question'
                        : 'Review & Repair'}
                    </span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-center py-2">
                <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto text-2xl font-bold">
                  🔥
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-black text-foreground">
                    Drill Completed • {repairScore} / {STREAK_REPAIR_QUESTIONS.length} Correct
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Excellent focus! Confirm below to restore your continuous study streak and claim your +50 XP momentum bonus.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs font-bold text-amber-700 dark:text-amber-300 flex items-center justify-center gap-1.5">
                  <Zap size={14} className="text-amber-500" />
                  <span>Streak will be restored to {Math.max((data.weeklyProgress.currentStreak || 0) + 1, 7)} Days + 50 XP</span>
                </div>

                <div className="pt-2 border-t border-border/60 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowStreakRepairModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={repairingStreak}
                    onClick={handleStreakRepair}
                    className="btn-primary text-xs font-bold py-2 px-5 rounded-xl flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    {repairingStreak ? <Loader2 size={14} className="animate-spin" /> : null}
                    <span>Claim Restored Streak (+50 XP)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── REDEEM VOUCHER MODAL ─────────────────────────────────────────── */}
      <RedeemVoucherModal
        isOpen={showRedeemModal}
        onClose={() => setShowRedeemModal(false)}
      />
    </DashboardLayout>
  );
}
