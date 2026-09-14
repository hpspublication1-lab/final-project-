'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useProgram, normalizeCourseId, CanonicalCourseId } from '@/contexts/ProgramContext';
import {
  Loader2, Play, BookOpen, Sparkles, Zap, Target, Flame,
  Clock, ArrowRight, CheckCircle2, ChevronRight, X, AlertTriangle,
  Radio, FileText, Award, Calendar, HelpCircle, MessageCircle,
  TrendingUp, BarChart2, ShieldCheck, RefreshCw, ExternalLink
} from 'lucide-react';
import { SUPPORT_CONFIG } from '@/lib/config/support';
import toast from 'react-hot-toast';

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
}

export default function DashboardPageClient() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const { program, setProgram } = useProgram();

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(false);
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({});
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [switchingBatch, setSwitchingBatch] = useState(false);

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
      const refreshRes = await fetch(`/api/student/dashboard?course=${canonicalId}`);
      if (refreshRes.ok) {
        const refreshed = await refreshRes.json();
        setData(refreshed);
      }
    } catch (err: any) {
      toast.error(err.message || 'Could not switch batch');
    } finally {
      setSwitchingBatch(false);
    }
  };

  const canonicalId = normalizeCourseId(program);

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

  // Fetch unified dashboard data
  useEffect(() => {
    if (!user?.id) return;
    let active = true;

    async function loadDashboard() {
      setLoading(true);
      try {
        const res = await fetch(`/api/student/dashboard?course=${canonicalId}`);
        if (res.ok) {
          const json = await res.json();
          if (active) {
            setData(json);
            // Pre-seed completed tasks from API
            const initialTasks: Record<string, boolean> = {};
            json.todayStudyPlan?.tasks?.forEach((t: any) => {
              initialTasks[t.id] = !!t.isCompleted;
            });
            setCompletedTasks(initialTasks);
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

  const toggleTask = (taskId: string) => {
    setCompletedTasks((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={36} className="animate-spin text-primary" />
          <p className="text-sm font-semibold text-muted-foreground animate-pulse">
            Loading your Samyak Tutor learning workspace...
          </p>
        </div>
      </div>
    );
  }

  if (!user || !data) return null;

  const isSee = canonicalId === 'see_class_10';
  const isTrial = data.activeCourse.state === 'free_preview';
  const isExpired = data.activeCourse.state === 'expired';
  const isExpiringSoon = data.activeCourse.state === 'expiring_soon';

  const checkoutPlanSku = isSee ? 'see-class-10-board-topper-batch' : 'cee-mbbs-mastery-2026';

  // ── COMPACT CONTEXTUAL PANEL ──────────────────────────────────────────────
  const contextualPanel = (
    <div className="space-y-6">
      
      {/* 1. Today's Quick Focus & Streak */}
      <div className="bg-card border border-border/80 rounded-3xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Flame size={15} className="text-amber-500" />
            <span>Study Streak</span>
          </span>
          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600">
            {data.weeklyProgress.currentStreak} Days Active
          </span>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Weekly Solved Questions</span>
            <span className="font-bold text-foreground">{data.weeklyProgress.totalQuestionsThisWeek} Qs</span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (data.weeklyProgress.totalQuestionsThisWeek / 150) * 100)}%` }}
            />
          </div>
        </div>

        <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Est. Study Time</span>
          <span className="font-semibold text-foreground">{data.weeklyProgress.totalMinutesThisWeek} mins</span>
        </div>
      </div>

      {/* 2. Quick Live Class Reminder */}
      {data.upcomingLiveClass && (
        <div className="bg-card border-2 border-primary/20 rounded-3xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-primary/10 text-primary">
              {data.upcomingLiveClass.status === 'live' ? '🔴 LIVE NOW' : 'NEXT LIVE CLASS'}
            </span>
            <span className="text-xs font-mono text-muted-foreground">{data.upcomingLiveClass.durationMins}m</span>
          </div>
          <h4 className="text-sm font-bold text-foreground leading-snug">{data.upcomingLiveClass.title}</h4>
          <Link
            href="/live-classes"
            className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs text-center flex items-center justify-center gap-1.5 transition-all block shadow-xs"
          >
            <Radio size={13} />
            <span>Join Live Room</span>
          </Link>
        </div>
      )}

      {/* 3. Academic Counselor WhatsApp Hotline */}
      <div className="bg-card border border-border/80 rounded-3xl p-5 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <MessageCircle size={16} />
          </span>
          <div>
            <h4 className="text-xs font-bold text-foreground">Need Academic Guidance?</h4>
            <p className="text-[11px] text-muted-foreground">Connect with faculty counselors</p>
          </div>
        </div>
        <a
          href={`https://wa.me/${SUPPORT_CONFIG.whatsappNumber}?text=${encodeURIComponent('Hello Samyak Academic Team! I need guidance with my study plan.')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold text-xs text-center border border-emerald-500/30 flex items-center justify-center gap-1.5 transition-all block"
        >
          <span>Chat on WhatsApp</span>
          <ExternalLink size={12} />
        </a>
      </div>

    </div>
  );

  return (
    <DashboardLayout isDark={isDark} onToggleDark={() => setIsDark(!isDark)} contextualPanel={contextualPanel}>
      
      {/* ── 0. TRIAL OR EXPIRED STATE BANNER ───────────────────────────────── */}
      {isTrial && (
        <div className="p-4 sm:p-5 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
              <ShieldCheck size={20} />
            </span>
            <div>
              <p className="text-xs sm:text-sm font-bold text-foreground">
                You are currently on the Free Starter Preview
              </p>
              <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                Unlock full access to 15,000+ past questions, daily live classes, and AI subjective answer grading.
              </p>
            </div>
          </div>
          <Link
            href={`/checkout?plan=${checkoutPlanSku}`}
            className="btn-primary text-xs font-bold py-2.5 px-5 rounded-2xl shrink-0 flex items-center gap-1.5 shadow-sm"
          >
            <span>Upgrade to Full Batch</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      )}

      {isExpired && (
        <div className="p-4 sm:p-5 rounded-3xl bg-red-500/10 border border-red-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-red-500/20 text-red-600 flex items-center justify-center shrink-0">
              <AlertTriangle size={20} />
            </span>
            <div>
              <p className="text-xs sm:text-sm font-bold text-foreground">
                Your batch access has expired
              </p>
              <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                Renew your enrollment to continue taking timed mocks and attending live classes.
              </p>
            </div>
          </div>
          <Link
            href={`/checkout?plan=${checkoutPlanSku}`}
            className="btn-primary text-xs font-bold py-2.5 px-5 rounded-2xl shrink-0 flex items-center gap-1.5 shadow-sm"
          >
            <span>Renew Access</span>
            <RefreshCw size={13} />
          </Link>
        </div>
      )}

      {/* ── 1. WHAT SHOULD I STUDY NEXT? (HERO ACTION CARD) ───────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary via-indigo-600 to-primary/95 text-white p-6 sm:p-8 shadow-xl">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/20 backdrop-blur-xs text-[10px] sm:text-xs font-black uppercase tracking-wider text-white">
              <Sparkles size={13} />
              <span>{data.recommendation.badgeText}</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              {data.recommendation.title}
            </h2>

            <p className="text-xs sm:text-sm text-white/85 font-medium leading-relaxed max-w-xl">
              {data.recommendation.subtitle}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
            <Link
              href={data.recommendation.actionHref}
              className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 bg-white text-primary font-black text-sm rounded-2xl hover:bg-white/95 shadow-md transition-all active:scale-95"
            >
              <Play size={15} fill="currentColor" />
              <span>{data.recommendation.actionText}</span>
              <ArrowRight size={15} />
            </Link>

            <Link
              href="/subjects"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-2xl border border-white/20 transition-all"
            >
              <BookOpen size={14} />
              <span>Browse All Subjects</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── RESUME LAST LESSON BANNER (WHEN AVAILABLE) ────────────────────── */}
      {data.lastLesson && (
        <div className="p-4 sm:p-5 rounded-3xl bg-card border border-border/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <BookOpen size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  Resume Previous Chapter
                </span>
                <span className="text-[10px] font-extrabold text-primary px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                  {data.lastLesson.masteryScore}% Mastered
                </span>
              </div>
              <h4 className="text-sm sm:text-base font-bold text-foreground">
                {data.lastLesson.chapterTitle}{' '}
                <span className="text-muted-foreground font-medium text-xs">({data.lastLesson.subjectDisplayName})</span>
              </h4>
            </div>
          </div>
          <Link
            href={data.lastLesson.resumeHref}
            className="btn-primary text-xs font-bold py-2.5 px-5 rounded-2xl shrink-0 flex items-center justify-center gap-2 shadow-xs"
          >
            <span>Resume Lesson</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      )}

      {/* ── 2. TODAY'S STUDY PLAN ──────────────────────────────────────────── */}
      <section className="bg-card border border-border/80 rounded-3xl p-6 sm:p-7 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-primary" />
              <h3 className="text-lg font-bold text-foreground">{data.todayStudyPlan.planTitle}</h3>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Daily Target: {data.todayStudyPlan.dailyHoursTarget} hours · Check off tasks as you complete them
            </p>
          </div>

          <Link
            href="/study-plan"
            className="text-xs font-bold text-primary hover:underline flex items-center gap-1 self-start sm:self-auto"
          >
            <span>Customize Plan</span>
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
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                  isDone
                    ? 'bg-emerald-500/5 border-emerald-500/30 text-muted-foreground'
                    : 'bg-muted/30 border-border/80 hover:border-primary/40 text-foreground'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                      isDone ? 'bg-emerald-500 text-white' : 'border-2 border-muted-foreground/40'
                    }`}
                  >
                    {isDone && <CheckCircle2 size={14} />}
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold uppercase text-primary px-2 py-0.5 rounded bg-primary/10">
                      {task.subject}
                    </span>
                    <h4 className={`text-xs font-bold leading-snug ${isDone ? 'line-through opacity-70' : ''}`}>
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
                    <span>Start</span>
                    <ArrowRight size={11} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 3. UPCOMING LIVE CLASS ────────────────────────────────────────── */}
      <section className="bg-card border border-border/80 rounded-3xl p-6 sm:p-7 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <Radio size={18} className="text-red-500" />
            <h3 className="text-lg font-bold text-foreground">Interactive Live Classes</h3>
          </div>
          <Link href="/live-classes" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
            <span>Full Schedule</span>
            <ChevronRight size={14} />
          </Link>
        </div>

        {data.upcomingLiveClass ? (
          <div className="p-5 rounded-2xl bg-gradient-to-r from-red-500/10 via-card to-card border border-red-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-red-500 text-white animate-pulse">
                  {data.upcomingLiveClass.status === 'live' ? '🔴 LIVE STREAM' : 'UPCOMING CLASS'}
                </span>
                <span className="text-xs font-semibold text-muted-foreground">
                  {new Date(data.upcomingLiveClass.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <h4 className="text-base font-extrabold text-foreground">{data.upcomingLiveClass.title}</h4>
              <p className="text-xs text-muted-foreground">
                Join live problem solving and ask faculty questions in real time.
              </p>
            </div>

            <Link
              href="/live-classes"
              className="btn-primary text-xs font-bold py-3 px-6 rounded-2xl shrink-0 flex items-center gap-2 shadow-sm"
            >
              <Radio size={14} />
              <span>Enter Classroom</span>
            </Link>
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-muted/20 border border-border/60 text-center space-y-2">
            <Radio size={24} className="mx-auto text-muted-foreground/60" />
            <p className="text-xs font-bold text-foreground">No live classes scheduled for today</p>
            <p className="text-[11px] text-muted-foreground max-w-md mx-auto">
              Check back for tomorrow&apos;s evening problem-solving batch, or review previous HD recordings.
            </p>
            <div className="pt-2">
              <Link href="/live-classes" className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline">
                <span>Browse Class Recordings Vault</span>
                <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* ── 4. ENROLLED COURSES & BATCH SWITCHER ───────────────────────────── */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <BookOpen size={18} className="text-primary" />
            <div>
              <h3 className="text-lg font-bold text-foreground">Your Academic Tracks & Cohort Batches</h3>
              {data.batchManagement?.currentBatchTitle && (
                <p className="text-xs text-muted-foreground">
                  Active Cohort: <span className="font-semibold text-foreground">{data.batchManagement.currentBatchTitle}</span>
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            {data.batchManagement?.canSwitchBatch && (data.batchManagement?.availableBatches?.length || 0) > 1 && (
              <button
                type="button"
                onClick={() => setShowBatchModal(true)}
                className="text-xs font-bold text-primary px-3 py-1.5 rounded-xl border border-primary/30 hover:bg-primary/5 transition-colors cursor-pointer"
              >
                Switch Batch Cohort
              </button>
            )}
            <span className="text-xs font-semibold text-muted-foreground">
              {data.enrolledCourses.filter((c) => c.isEnrolled).length} Active Enrolled
            </span>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.enrolledCourses.map((c) => {
            const isCurrent = c.slug === canonicalId;
            return (
              <div
                key={c.slug}
                className={`p-5 rounded-3xl border transition-all flex flex-col justify-between space-y-4 ${
                  isCurrent
                    ? 'bg-card border-primary ring-2 ring-primary/20 shadow-md'
                    : 'bg-card border-border/80 hover:border-border shadow-xs'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-muted text-muted-foreground">
                      {c.shortName}
                    </span>
                    {isCurrent && (
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-foreground leading-snug">{c.title}</h4>
                </div>

                <div className="pt-3 border-t border-border/60 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    {c.isEnrolled ? (c.daysRemaining ? `${c.daysRemaining} days left` : 'Active Access') : 'Free Starter'}
                  </span>

                  {isCurrent ? (
                    <span className="text-xs font-bold text-primary flex items-center gap-1">
                      <CheckCircle2 size={13} />
                      <span>Current View</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => setProgram(c.slug)}
                      className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Switch Track</span>
                      <ArrowRight size={13} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 5 & 6. RECENT TEST PERFORMANCE + WEAK TOPICS ───────────────────── */}
      <div className="grid lg:grid-cols-2 gap-6">
        
        {/* 5. Recent Test Performance */}
        <section className="bg-card border border-border/80 rounded-3xl p-6 sm:p-7 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <BarChart2 size={18} className="text-blue-500" />
                <h3 className="text-base font-bold text-foreground">Recent Test Performance</h3>
              </div>
              <Link href="/mock-tests" className="text-xs font-bold text-primary hover:underline">
                Take Mock Test &rarr;
              </Link>
            </div>

            {data.recentTestPerformance.length > 0 ? (
              <div className="space-y-3">
                {data.recentTestPerformance.map((test) => (
                  <div
                    key={test.id}
                    className="p-3.5 rounded-2xl bg-muted/30 border border-border/60 flex items-center justify-between gap-3"
                  >
                    <div>
                      <h5 className="text-xs font-bold text-foreground">{test.title}</h5>
                      <span className="text-[10px] text-muted-foreground">{test.date}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-foreground">{test.score} / {test.totalMarks}</span>
                      <span className="text-[10px] font-bold text-emerald-600 block">{test.percentage}% Accuracy</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-muted/20 border border-border/60 text-center space-y-2">
                <Award size={24} className="mx-auto text-muted-foreground/60" />
                <p className="text-xs font-bold text-foreground">No mock tests attempted yet</p>
                <p className="text-[11px] text-muted-foreground">
                  Take your first timed mock exam to see score percentiles and detailed error breakdowns.
                </p>
                <div className="pt-2">
                  <Link href="/mock-tests" className="btn-primary text-xs font-bold py-2 px-4 rounded-xl inline-flex">
                    Take First Mock Test
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 6. Weak Topics (Focus Areas) */}
        <section className="bg-card border border-border/80 rounded-3xl p-6 sm:p-7 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="text-amber-500" />
                <h3 className="text-base font-bold text-foreground">Target Weak Topics</h3>
              </div>
              <Link href="/mistake-analyser" className="text-xs font-bold text-primary hover:underline">
                View Error Log &rarr;
              </Link>
            </div>

            {data.weakTopics.length > 0 ? (
              <div className="space-y-3">
                {data.weakTopics.map((wt) => (
                  <div
                    key={wt.id}
                    className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex items-center justify-between gap-3"
                  >
                    <div>
                      <h5 className="text-xs font-bold text-foreground">{wt.title}</h5>
                      <span className="text-[10px] text-muted-foreground">{wt.errorCount} incorrect attempts</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono font-bold text-amber-600">{wt.accuracy}%</span>
                      <Link
                        href={wt.practiceHref}
                        className="text-xs font-bold text-primary hover:underline flex items-center gap-0.5"
                      >
                        <span>Drill</span>
                        <ArrowRight size={11} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-muted/20 border border-border/60 text-center space-y-2">
                <CheckCircle2 size={24} className="mx-auto text-emerald-500" />
                <p className="text-xs font-bold text-foreground">No critical weak topics detected</p>
                <p className="text-[11px] text-muted-foreground">
                  Keep solving chapter quizzes! As you practice, our diagnostic engine will identify specific sub-chapters to revise.
                </p>
                <div className="pt-2">
                  <Link href="/practice" className="btn-primary text-xs font-bold py-2 px-4 rounded-xl inline-flex">
                    Solve Practice MCQs
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>

      </div>

      {/* ── 7 & 8. PENDING ASSIGNMENTS + ANNOUNCEMENTS ──────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-6">
        
        {/* 7. Pending Assignments */}
        <section className="bg-card border border-border/80 rounded-3xl p-6 sm:p-7 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <FileText size={18} className="text-emerald-600" />
              <h3 className="text-base font-bold text-foreground">Subjective Assignments</h3>
            </div>
            <Link href="/vision-marker" className="text-xs font-bold text-primary hover:underline">
              AI Vision Marker &rarr;
            </Link>
          </div>

          {data.pendingAssignments.length > 0 ? (
            <div className="space-y-3">
              {data.pendingAssignments.map((ass) => (
                <div
                  key={ass.id}
                  className="p-3.5 rounded-2xl bg-muted/30 border border-border/60 flex items-center justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <h5 className="text-xs font-bold text-foreground">{ass.title}</h5>
                    <span className="text-[10px] text-muted-foreground">Submitted {ass.submittedAt}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-foreground">
                      {ass.obtainedMarks !== undefined ? `${ass.obtainedMarks} / ${ass.totalMarks}` : 'Evaluating...'}
                    </span>
                    <Link href={ass.actionHref} className="text-[10px] font-bold text-primary hover:underline block">
                      View Rubric
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-muted/20 border border-border/60 text-center space-y-2">
              <FileText size={24} className="mx-auto text-muted-foreground/60" />
              <p className="text-xs font-bold text-foreground">All assignments up to date</p>
              <p className="text-[11px] text-muted-foreground">
                Snap a photo of your handwritten math derivations or science answers to get instant CDC rubric feedback.
              </p>
              <div className="pt-2">
                <Link href="/vision-marker" className="btn-primary text-xs font-bold py-2 px-4 rounded-xl inline-flex">
                  Submit Handwritten Paper
                </Link>
              </div>
            </div>
          )}
        </section>

        {/* 8. Batch Announcements */}
        <section className="bg-card border border-border/80 rounded-3xl p-6 sm:p-7 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-primary" />
              <h3 className="text-base font-bold text-foreground">Batch Announcements</h3>
            </div>
            <span className="text-xs text-muted-foreground">Official Mentors</span>
          </div>

          {data.announcements.length > 0 ? (
            <div className="space-y-3">
              {data.announcements.map((ann) => (
                <div
                  key={ann.id}
                  className="p-3.5 rounded-2xl bg-primary/5 border border-primary/15 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold text-foreground">{ann.title}</h5>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(ann.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{ann.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-muted/20 border border-border/60 text-center space-y-2">
              <Sparkles size={24} className="mx-auto text-muted-foreground/60" />
              <p className="text-xs font-bold text-foreground">No new announcements for this batch</p>
              <p className="text-[11px] text-muted-foreground">
                Important schedule updates, exam notices, and live batch reminders will be posted here.
              </p>
            </div>
          )}
        </section>

      </div>

      {/* ── 9. WEEKLY PROGRESS BAR CHART ──────────────────────────────────── */}
      <section className="bg-card border border-border/80 rounded-3xl p-6 sm:p-7 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-emerald-500" />
              <h3 className="text-base font-bold text-foreground">Weekly Practice Volume</h3>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Real questions practiced over the past 7 days (updated in real time)
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div>
              <span className="text-muted-foreground block text-[10px]">TOTAL THIS WEEK</span>
              <span className="text-sm font-black text-foreground">{data.weeklyProgress.totalQuestionsThisWeek} Qs</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px]">TIME SPENT</span>
              <span className="text-sm font-black text-foreground">{data.weeklyProgress.totalMinutesThisWeek}m</span>
            </div>
          </div>
        </div>

        {/* 7-Day Bars */}
        <div className="grid grid-cols-7 gap-2 sm:gap-4 items-end pt-4 h-40">
          {data.weeklyProgress.days.map((day, dIdx) => {
            const maxVal = Math.max(30, ...data.weeklyProgress.days.map((d) => d.questionsSolved));
            const heightPct = Math.max(8, Math.round((day.questionsSolved / maxVal) * 100));

            return (
              <div key={dIdx} className="flex flex-col items-center gap-2 h-full justify-end group">
                <span className="text-[10px] font-mono font-bold text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                  {day.questionsSolved}
                </span>
                <div
                  className={`w-full rounded-2xl transition-all duration-500 ${
                    day.isToday
                      ? 'bg-primary shadow-sm'
                      : day.questionsSolved > 0
                      ? 'bg-primary/50 group-hover:bg-primary'
                      : 'bg-muted/40'
                  }`}
                  style={{ height: `${heightPct}%` }}
                />
                <span className={`text-[10px] font-bold ${day.isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                  {day.dayName}
                </span>
              </div>
            );
          })}
        </div>
      </section>

    </DashboardLayout>
  );
}
