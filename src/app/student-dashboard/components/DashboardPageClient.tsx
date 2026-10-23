'use client';

import React, { useState, useEffect } from 'react';
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
  Check
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
  const { user, loading: authLoading } = useAuth();
  const { program, setProgram } = useProgram();

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(false);
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({});
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [switchingBatch, setSwitchingBatch] = useState(false);

  const canonicalId = normalizeCourseId(program);

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
            json.todayStudyPlan?.tasks?.forEach((t: { id: string; isCompleted: boolean }) => {
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
            Loading your academic learning workspace...
          </p>
        </div>
      </div>
    );
  }

  if (!user || !data) return null;

  const isSee = canonicalId === 'see_class_10';
  const isTrial = data.activeCourse.state === 'free_preview';
  const isExpired = data.activeCourse.state === 'expired';
  const checkoutPlanSku = isSee ? 'see-class-10-board-topper-batch' : 'cee-mbbs-mastery-2026';

  const completedCount = Object.values(completedTasks).filter(Boolean).length;
  const totalTasksCount = data.todayStudyPlan.tasks.length;

  // ── REFINED CONTEXTUAL PANEL (ACADEMIC PREMIUM SIDEBAR) ──────────────────
  const contextualPanel = (
    <div className="space-y-6">
      
      {/* 1. Live Class Module */}
      {data.upcomingLiveClass ? (
        <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-xs space-y-3.5 hover:shadow-sm transition-all">
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
              Starts at: {new Date(data.upcomingLiveClass.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
        <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-muted text-muted-foreground">
              Live Classroom
            </span>
            <span className="text-xs text-muted-foreground font-medium">Daily Cohort</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            No live lectures scheduled today. Evening interactive doubt sessions resume tomorrow.
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

      {/* 2. Consistency & Study Volume (Integrated Weekly Progress) */}
      <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-xs space-y-4 hover:shadow-sm transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Flame size={15} className="text-amber-500" />
            <span>Study Consistency</span>
          </span>
          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 border border-amber-500/20">
            {data.weeklyProgress.currentStreak} Days Streak
          </span>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Weekly Practice Goal</span>
            <span className="font-bold text-foreground">{data.weeklyProgress.totalQuestionsThisWeek} / 150 Qs</span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (data.weeklyProgress.totalQuestionsThisWeek / 150) * 100)}%` }}
            />
          </div>
        </div>

        {/* 7-Day Mini Sparkline Bars */}
        <div className="pt-2 border-t border-border/60">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-2">
            <span>Daily Activity (7 Days)</span>
            <span className="font-semibold text-foreground">{data.weeklyProgress.totalMinutesThisWeek}m study time</span>
          </div>
          <div className="grid grid-cols-7 gap-1.5 items-end h-16 pt-1">
            {data.weeklyProgress.days.map((day, dIdx) => {
              const maxVal = Math.max(25, ...data.weeklyProgress.days.map((d) => d.questionsSolved));
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
                  <span className={`text-[9px] font-semibold ${day.isToday ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
                    {day.dayName.slice(0, 1)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Academic Counselor WhatsApp Hotline */}
      <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-xs space-y-3 hover:shadow-sm transition-all">
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
          href={`https://wa.me/${SUPPORT_CONFIG.whatsappNumber}?text=${encodeURIComponent('Hello Samyak Academic Team! I need guidance with my study plan.')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold text-xs text-center border border-emerald-500/30 flex items-center justify-center gap-1.5 transition-all block"
        >
          <span>Chat with Academic Mentor</span>
          <ExternalLink size={12} />
        </a>
      </div>

    </div>
  );

  return (
    <DashboardLayout isDark={isDark} onToggleDark={() => setIsDark(!isDark)} contextualPanel={contextualPanel}>
      
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
                Upgrade to unlock 15,000+ past questions, daily interactive live batches, and AI grading.
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

      {/* ── 1. WHAT SHOULD I STUDY NEXT? (HERO ACTION & FAST RESUME) ──────── */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/95 via-primary to-indigo-700 text-white p-6 sm:p-8 shadow-sm">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs text-[10px] sm:text-xs font-bold uppercase tracking-wider text-white">
              <Sparkles size={13} />
              <span>{data.recommendation.badgeText}</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
              {data.recommendation.title}
            </h2>

            <p className="text-xs sm:text-sm text-white/85 leading-relaxed max-w-xl">
              {data.recommendation.subtitle}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
            <Link
              href={data.recommendation.actionHref}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-primary font-bold text-xs rounded-xl hover:bg-white/95 shadow-sm transition-all"
            >
              <Play size={14} fill="currentColor" />
              <span>{data.recommendation.actionText}</span>
              <ArrowRight size={14} />
            </Link>

            <Link
              href="/subjects"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-medium text-xs rounded-xl border border-white/20 transition-all"
            >
              <BookOpen size={13} />
              <span>Browse All Subjects</span>
            </Link>
          </div>
        </div>

        {/* Integrated Resume Lesson Pill if available */}
        {data.lastLesson && (
          <div className="relative z-10 mt-6 pt-5 border-t border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                <BookOpen size={14} />
              </span>
              <div>
                <span className="text-white/70 text-[10px] uppercase font-bold tracking-wider">Previous Chapter:</span>{' '}
                <strong className="text-white font-semibold">{data.lastLesson.chapterTitle}</strong>{' '}
                <span className="text-white/75">({data.lastLesson.subjectDisplayName})</span>
              </div>
            </div>
            <Link
              href={data.lastLesson.resumeHref}
              className="inline-flex items-center gap-1.5 text-white font-bold hover:underline self-start sm:self-auto"
            >
              <span>Resume ({data.lastLesson.masteryScore}% Mastered)</span>
              <ChevronRight size={14} />
            </Link>
          </div>
        )}
      </section>

      {/* ── 2. TODAY'S STRUCTURED STUDY AGENDA ───────────────────────────── */}
      <section className="bg-card border border-border/80 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Calendar size={16} />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">{data.todayStudyPlan.planTitle}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Target: {data.todayStudyPlan.dailyHoursTarget} hours · {completedCount} of {totalTasksCount} completed today
              </p>
            </div>
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

      {/* ── 3 & 4. PERFORMANCE & DIAGNOSTICS (SIDE-BY-SIDE GRID) ─────────── */}
      <div className="grid lg:grid-cols-2 gap-6">
        
        {/* Recent Test Performance */}
        <section className="bg-card border border-border/80 rounded-2xl p-6 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <BarChart2 size={16} className="text-blue-500" />
                <h3 className="text-sm font-bold text-foreground">Recent Test Performance</h3>
              </div>
              <Link href="/mock-tests" className="text-xs font-bold text-primary hover:underline">
                Take Mock Test &rarr;
              </Link>
            </div>

            {data.recentTestPerformance.length > 0 ? (
              <div className="space-y-2.5">
                {data.recentTestPerformance.map((test) => (
                  <div
                    key={test.id}
                    className="p-3 rounded-xl bg-muted/20 border border-border/60 flex items-center justify-between gap-3"
                  >
                    <div>
                      <h5 className="text-xs font-bold text-foreground">{test.title}</h5>
                      <span className="text-[10px] text-muted-foreground">{test.date}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-foreground">{test.score} / {test.totalMarks}</span>
                      <span className="text-[10px] font-semibold text-emerald-600 block">{test.percentage}% Accuracy</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 rounded-xl bg-muted/15 border border-border/50 text-center space-y-2">
                <Award size={22} className="mx-auto text-muted-foreground/60" />
                <p className="text-xs font-bold text-foreground">No mock tests attempted yet</p>
                <p className="text-[11px] text-muted-foreground">
                  Take your first timed mock exam to see score percentiles and detailed error breakdowns.
                </p>
                <div className="pt-1">
                  <Link href="/mock-tests" className="btn-primary text-xs font-bold py-2 px-4 rounded-xl inline-flex">
                    Take First Mock Test
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Weak Topics Drill */}
        <section className="bg-card border border-border/80 rounded-2xl p-6 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-500" />
                <h3 className="text-sm font-bold text-foreground">Target Weak Topics</h3>
              </div>
              <Link href="/mistake-analyser" className="text-xs font-bold text-primary hover:underline">
                View Error Log &rarr;
              </Link>
            </div>

            {data.weakTopics.length > 0 ? (
              <div className="space-y-2.5">
                {data.weakTopics.map((wt) => (
                  <div
                    key={wt.id}
                    className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-center justify-between gap-3"
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
              <div className="p-6 rounded-xl bg-muted/15 border border-border/50 text-center space-y-2">
                <CheckCircle2 size={22} className="mx-auto text-emerald-500" />
                <p className="text-xs font-bold text-foreground">No critical weak topics detected</p>
                <p className="text-[11px] text-muted-foreground">
                  Keep solving chapter quizzes! Our diagnostic engine will highlight sub-chapters needing review.
                </p>
                <div className="pt-1">
                  <Link href="/practice" className="btn-primary text-xs font-bold py-2 px-4 rounded-xl inline-flex">
                    Solve Practice MCQs
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>

      </div>

      {/* ── 5. ACADEMIC TRACKS & COHORT SWITCHER ─────────────────────────── */}
      <section className="bg-card border border-border/80 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
          <div>
            <h3 className="text-sm font-bold text-foreground">Your Academic Tracks &amp; Cohort Batches</h3>
            {data.batchManagement?.currentBatchTitle && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Current Cohort: <span className="font-semibold text-foreground">{data.batchManagement.currentBatchTitle}</span>
              </p>
            )}
          </div>
          <div className="flex items-center gap-2.5">
            {data.batchManagement?.canSwitchBatch && (data.batchManagement?.availableBatches?.length || 0) > 1 && (
              <button
                type="button"
                onClick={() => {
                  setSelectedBatchId(data.batchManagement?.currentBatchId || null);
                  setShowBatchModal(true);
                }}
                className="text-xs font-bold text-primary px-3 py-1.5 rounded-xl border border-primary/30 hover:bg-primary/5 transition-colors cursor-pointer"
              >
                Switch Batch Cohort
              </button>
            )}
            <span className="text-xs font-medium text-muted-foreground">
              {data.enrolledCourses.filter((c) => c.isEnrolled).length} Active Enrolled
            </span>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {data.enrolledCourses.map((c) => {
            const isCurrent = c.slug === canonicalId;
            return (
              <div
                key={c.slug}
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between space-y-3 ${
                  isCurrent
                    ? 'bg-primary/5 border-primary ring-1 ring-primary/30 shadow-xs'
                    : 'bg-card border-border/70 hover:border-border'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-muted text-muted-foreground">
                      {c.shortName}
                    </span>
                    {isCurrent && (
                      <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                        Current View
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-foreground leading-snug">{c.title}</h4>
                </div>

                <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-muted-foreground">
                    {c.isEnrolled ? (c.daysRemaining ? `${c.daysRemaining} days left` : 'Active Access') : 'Free Starter'}
                  </span>

                  {isCurrent ? (
                    <span className="text-[11px] font-bold text-primary flex items-center gap-1">
                      <CheckCircle2 size={12} />
                      <span>Active</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setProgram(c.slug)}
                      className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Switch</span>
                      <ArrowRight size={12} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 6 & 7. SUBMISSIONS & ANNOUNCEMENTS (2-COLUMN GRID) ─────────────── */}
      <div className="grid lg:grid-cols-2 gap-6">
        
        {/* Subjective Assignments */}
        <section className="bg-card border border-border/80 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-emerald-600" />
              <h3 className="text-sm font-bold text-foreground">Subjective Assignments</h3>
            </div>
            <Link href="/vision-marker" className="text-xs font-bold text-primary hover:underline">
              AI Vision Marker &rarr;
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
                    <span className="text-[10px] text-muted-foreground">Submitted {ass.submittedAt}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-foreground">
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
            <div className="p-6 rounded-xl bg-muted/15 border border-border/50 text-center space-y-2">
              <FileText size={22} className="mx-auto text-muted-foreground/60" />
              <p className="text-xs font-bold text-foreground">All assignments up to date</p>
              <p className="text-[11px] text-muted-foreground">
                Snap a photo of your handwritten math derivations or science answers to get instant CDC rubric feedback.
              </p>
              <div className="pt-1">
                <Link href="/vision-marker" className="btn-primary text-xs font-bold py-2 px-4 rounded-xl inline-flex">
                  Submit Handwritten Paper
                </Link>
              </div>
            </div>
          )}
        </section>

        {/* Batch Announcements */}
        <section className="bg-card border border-border/80 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-primary" />
              <h3 className="text-sm font-bold text-foreground">Batch Announcements</h3>
            </div>
            <span className="text-xs text-muted-foreground">Official Mentors</span>
          </div>

          {data.announcements.length > 0 ? (
            <div className="space-y-2.5">
              {data.announcements.map((ann) => (
                <div
                  key={ann.id}
                  className="p-3 rounded-xl bg-primary/5 border border-primary/15 space-y-1"
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
            <div className="p-6 rounded-xl bg-muted/15 border border-border/50 text-center space-y-2">
              <Sparkles size={22} className="mx-auto text-muted-foreground/60" />
              <p className="text-xs font-bold text-foreground">No new announcements</p>
              <p className="text-[11px] text-muted-foreground">
                Important schedule updates, exam notices, and live batch reminders will be posted here.
              </p>
            </div>
          )}
        </section>

      </div>

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
              className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
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
                const isSelected = selectedBatchId === batch.id || (!selectedBatchId && batch.id === data.batchManagement?.currentBatchId);
                const isCurrent = batch.id === data.batchManagement?.currentBatchId;

                return (
                  <button
                    key={batch.id}
                    type="button"
                    onClick={() => setSelectedBatchId(batch.id)}
                    className={`w-full p-3.5 rounded-xl border text-left transition-all flex items-center justify-between ${
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
                      <span className="text-[11px] text-muted-foreground">
                        NPR {batch.priceNpr.toLocaleString()}
                      </span>
                    </div>

                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/40'
                    }`}>
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
                className="px-4 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={switchingBatch || !selectedBatchId || selectedBatchId === data.batchManagement?.currentBatchId}
                onClick={() => selectedBatchId && handleSwitchBatch(selectedBatchId)}
                className="btn-primary text-xs font-bold py-2 px-5 rounded-xl flex items-center gap-1.5 disabled:opacity-50"
              >
                {switchingBatch ? <Loader2 size={14} className="animate-spin" /> : null}
                <span>Confirm Switch</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}
