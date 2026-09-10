'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useProgram, normalizeCourseId, COURSES_MAP } from '@/contexts/ProgramContext';
import { useEntitlements } from '@/lib/hooks/useEntitlements';
import { ProgramSelectorModal } from '@/components/ProgramSelectorModal';
import { createClient } from '@/lib/supabase/client';
import {
  Loader2,
  Play,
  BookOpen,
  Sparkles,
  Zap,
  Target,
  Flame,
  Clock,
  ArrowRight,
  ChevronRight,
  X,
  CheckCircle2,
  Compass,
  Timer,
} from 'lucide-react';
import { SUPPORT_CONFIG } from '@/lib/config/support';

import WeakTopicsPanel from '@/app/student-dashboard/components/WeakTopicsPanel';
import RecentExamsTable from '@/app/student-dashboard/components/RecentExamsTable';
import LiveClassesCard from '@/app/student-dashboard/components/LiveClassesCard';
import UpcomingSchedule from '@/app/student-dashboard/components/UpcomingSchedule';
import SeeDashboardView from '@/app/student-dashboard/components/SeeDashboardView';
import CeeDashboardView from '@/app/student-dashboard/components/CeeDashboardView';

interface StudentMetrics {
  studyMinutes: number;
  questionsSolved: number;
  accuracy: number;
  streak: number;
  loading: boolean;
}

const PROGRAM_DEFAULT_LESSONS: Record<
  string,
  { topic: string; subject: string; link: string; progressPct: number }
> = {
  cee_medical: {
    topic: 'Biology · Chapter 12: Cell Division & Genetics',
    subject: 'Biology',
    link: '/subjects?subject=biology',
    progressPct: 52,
  },
  see_class_10: {
    topic: 'Compulsory Science · Chapter 4: Pressure & Mechanics',
    subject: 'Compulsory Science',
    link: '/subjects?subject=science',
    progressPct: 45,
  },
  ielts: {
    topic: 'Writing Task 2 · Essay Structure & Argumentation',
    subject: 'Writing Module',
    link: '/subjects?subject=writing',
    progressPct: 38,
  },
  digital_marketing: {
    topic: 'Meta & Instagram Ads · Audience Retargeting & Scaling',
    subject: 'Meta & Instagram Ads',
    link: '/subjects?subject=marketing',
    progressPct: 60,
  },
  artificial_intelligence: {
    topic: 'Prompt Engineering · Advanced Chains & Agents',
    subject: 'Prompt Studio',
    link: '/subjects?subject=ai',
    progressPct: 40,
  },
};

export default function DashboardPageClient() {
  const [isDark, setIsDark] = useState(false);
  const [showSelectorModal, setShowSelectorModal] = useState(false);
  const [reviewDismissed, setReviewDismissed] = useState(false);
  const [lastLesson, setLastLesson] = useState<{ topic: string; link: string; progressPct: number } | null>(null);

  const [metrics, setMetrics] = useState<StudentMetrics>({
    studyMinutes: 45,
    questionsSolved: 0,
    accuracy: 0,
    streak: 1,
    loading: true,
  });

  const { user, profile, loading } = useAuth();
  const { program } = useProgram();
  const { isEnrolledIn, getCourseTier } = useEntitlements();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router?.replace('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (isDark) {
      document.documentElement?.classList?.add('dark');
    } else {
      document.documentElement?.classList?.remove('dark');
    }
  }, [isDark]);

  const canonicalId = normalizeCourseId(program);
  const currentProgram = COURSES_MAP[canonicalId] || COURSES_MAP.cee_medical;
  const courseTier = getCourseTier(canonicalId);
  const isPro = courseTier === 'pro' || courseTier === 'institution' || profile?.subscription_plan === 'pro';

  // Load metrics and last lesson info
  useEffect(() => {
    if (!user?.id) return;

    try {
      const saved = localStorage.getItem('samyak_recent_lesson');
      if (saved) {
        setLastLesson(JSON.parse(saved));
      }
    } catch {
      // ignore JSON parse error
    }

    async function fetchStats() {
      try {
        const supabase = createClient();
        const [attemptsRes, profileRes] = await Promise.all([
          supabase
            .from('practice_attempts')
            .select('is_correct, created_at')
            .eq('student_id', user.id),
          supabase
            .from('profiles')
            .select('study_streak')
            .eq('id', user.id)
            .maybeSingle(),
        ]);

        const attempts = attemptsRes.data || [];
        const totalSolved = attempts.length;
        const correctCount = attempts.filter((a) => a.is_correct).length;
        const accuracy = totalSolved > 0 ? Math.round((correctCount / totalSolved) * 100) : 0;
        const estimatedMinutes = Math.max(20, Math.round(totalSolved * 1.8));
        const streak = profileRes.data?.study_streak || profile?.study_streak || 3;

        setMetrics({
          studyMinutes: totalSolved > 0 ? estimatedMinutes : 35,
          questionsSolved: totalSolved,
          accuracy: totalSolved > 0 ? accuracy : 78,
          streak: Math.max(1, streak),
          loading: false,
        });
      } catch (err) {
        console.warn('Metrics load error', err);
        setMetrics((prev) => ({ ...prev, loading: false }));
      }
    }

    fetchStats();
  }, [user?.id, profile?.study_streak]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-primary" />
          <p className="text-sm text-muted-foreground font-medium">Loading your Samyak Tutor dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const displayName = profile?.full_name?.split(' ')?.[0] || user?.email?.split('@')?.[0] || 'Student';
  const now = new Date();
  const timeOfDay = now.getHours() < 12 ? 'morning' : now.getHours() < 17 ? 'afternoon' : 'evening';

  // Target countdown for major exams
  const ceeTarget = new Date('2026-04-15T08:00:00');
  const daysToCee = Math.max(0, Math.floor((ceeTarget.getTime() - now.getTime()) / 86400000));

  const activeLesson = lastLesson || PROGRAM_DEFAULT_LESSONS[canonicalId] || PROGRAM_DEFAULT_LESSONS.cee_medical;

  // Dedicated SEE Class 10 Dashboard (Prompt 2: 7 Focused Sections)
  if (canonicalId === 'see_class_10') {
    return (
      <DashboardLayout isDark={isDark} onToggleDark={() => setIsDark(!isDark)}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
          {/* Track Switcher Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-card/60 p-4 sm:p-5 rounded-3xl border border-border/80 shadow-xs backdrop-blur-xs">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                  Samyak SEE · Grade 10 Board
                </h1>
                {isPro && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-primary text-white shadow-xs">
                    PRO
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 font-medium">
                Target 4.00 GPA with live classes, chapter question bank, and CDC model tests.
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-secondary/80 border border-border text-xs font-semibold">
                <span className="text-muted-foreground">Track:</span>
                <span className="font-bold text-foreground">SEE (Class 10)</span>
              </div>

              <button
                onClick={() => setShowSelectorModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/25 text-xs font-bold transition-all active:scale-95 cursor-pointer"
              >
                <Compass size={13} />
                <span>Switch Track</span>
              </button>
            </div>
          </div>

          <SeeDashboardView displayName={displayName} />
        </div>

        <ProgramSelectorModal
          isOpen={showSelectorModal}
          onClose={() => setShowSelectorModal(false)}
        />
      </DashboardLayout>
    );
  }

  // Dedicated CEE Medical Entrance Dashboard
  if (canonicalId === 'cee_medical') {
    return (
      <DashboardLayout isDark={isDark} onToggleDark={() => setIsDark(!isDark)}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
          {/* Track Switcher Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-card/60 p-4 sm:p-5 rounded-3xl border border-border/80 shadow-xs backdrop-blur-xs">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                  Samyak CEE · Medical Entrance
                </h1>
                {isPro && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-primary text-white shadow-xs">
                    PRO
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 font-medium">
                Target 180+ marks with high-yield MCQs, 200-Q Grand Mocks, and smart revision.
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-secondary/80 border border-border text-xs font-semibold">
                <span className="text-muted-foreground">Track:</span>
                <span className="font-bold text-foreground">CEE (Medical)</span>
              </div>

              <button
                onClick={() => setShowSelectorModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/25 text-xs font-bold transition-all active:scale-95 cursor-pointer"
              >
                <Compass size={13} />
                <span>Switch Track</span>
              </button>
            </div>
          </div>

          <CeeDashboardView displayName={displayName} daysToCee={daysToCee} isPro={isPro} />
        </div>

        <ProgramSelectorModal
          isOpen={showSelectorModal}
          onClose={() => setShowSelectorModal(false)}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout isDark={isDark} onToggleDark={() => setIsDark(!isDark)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        
        {/* ── 1. GREETING & TRACK SELECTOR BAR ──────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-card/60 p-4 sm:p-5 rounded-3xl border border-border/80 shadow-xs backdrop-blur-xs">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                Good {timeOfDay}, {displayName}! 👋
              </h1>
              {isPro && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-primary text-white shadow-xs">
                  PRO
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 font-medium">
              Continue where you left off or complete today&apos;s recommended practice.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
            {/* Active Track Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-secondary/80 border border-border text-xs font-semibold">
              <span className="text-muted-foreground">Track:</span>
              <span className="font-bold text-foreground">{currentProgram.shortName}</span>
            </div>

            {/* Switch Track Button */}
            <button
              onClick={() => setShowSelectorModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/25 text-xs font-bold transition-all active:scale-95 cursor-pointer"
            >
              <Compass size={13} />
              <span>Switch Track</span>
            </button>
          </div>
        </div>

        {/* ── 2. CONTINUED LEARNING HERO CARD ──────────────────────────── */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary via-indigo-600 to-primary/95 text-white p-6 sm:p-8 shadow-xl">
          {/* Subtle background glow */}
          <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2.5 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs text-[11px] font-bold uppercase tracking-wider text-white/95">
                <Sparkles size={13} />
                <span>CURRENT LEARNING FOCUS · {currentProgram.badge}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
                {activeLesson.topic}
              </h2>
              <p className="text-xs sm:text-sm text-white/80 font-medium leading-relaxed">
                Pick up right where you left off. Watch bite-sized video concepts, solve chapter MCQs, and track your syllabus mastery.
              </p>

              {/* Progress Bar */}
              <div className="pt-2 max-w-md">
                <div className="flex justify-between text-[11px] font-bold text-white/90 mb-1.5">
                  <span>Chapter Progress</span>
                  <span>{activeLesson.progressPct}% Completed</span>
                </div>
                <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full transition-all duration-500"
                    style={{ width: `${activeLesson.progressPct}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
              <Link
                href={activeLesson.link}
                className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-white text-primary font-bold text-sm rounded-2xl hover:bg-white/90 shadow-md transition-all active:scale-95"
              >
                <Play size={15} fill="currentColor" />
                <span>CONTINUE LEARNING</span>
                <ArrowRight size={15} />
              </Link>
              <Link
                href="/subjects"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-2xl border border-white/20 transition-all"
              >
                <BookOpen size={14} />
                <span>Browse All Subjects</span>
              </Link>
            </div>
          </div>
        </div>

        {/* ── 3. TODAY'S PROGRESS 4-METRIC STRIP ───────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card p-4 sm:p-5 rounded-2xl border border-border/80 shadow-xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Clock size={22} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Study Time</p>
              <p className="text-xl sm:text-2xl font-extrabold text-foreground tabular-nums">{metrics.studyMinutes}m</p>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">Active today</p>
            </div>
          </div>

          <div className="bg-card p-4 sm:p-5 rounded-2xl border border-border/80 shadow-xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <CheckCircle2 size={22} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Questions Solved</p>
              <p className="text-xl sm:text-2xl font-extrabold text-foreground tabular-nums">{metrics.questionsSolved}</p>
              <p className="text-[11px] text-muted-foreground font-medium mt-0.5">Across all modules</p>
            </div>
          </div>

          <div className="bg-card p-4 sm:p-5 rounded-2xl border border-border/80 shadow-xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Target size={22} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Average Accuracy</p>
              <p className="text-xl sm:text-2xl font-extrabold text-foreground tabular-nums">{metrics.accuracy}%</p>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">Target: 80%+</p>
            </div>
          </div>

          <div className="bg-card p-4 sm:p-5 rounded-2xl border border-border/80 shadow-xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Flame size={22} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Daily Streak</p>
              <p className="text-xl sm:text-2xl font-extrabold text-foreground tabular-nums">{metrics.streak} Days</p>
              <p className="text-[11px] text-amber-600 dark:text-amber-400 font-bold mt-0.5">Keep the fire burning!</p>
            </div>
          </div>
        </div>

        {/* ── 4. RECOMMENDED FOR YOU (3 FOCUSED ACTIONS) ───────────────── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-black text-foreground">
              Recommended for You
            </h3>
            <span className="text-xs text-muted-foreground font-medium">
              Based on your current progress &amp; weak areas
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Action 1: Quick Practice Drill */}
            <div className="card-luxury p-5 rounded-2xl border border-border/80 shadow-xs hover:border-primary/50 transition-all flex flex-col justify-between group">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Zap size={20} />
                </div>
                <h4 className="text-sm font-black text-foreground">
                  Quick Practice Drills
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Solve 10 high-yield questions with instant explanations and immediate feedback.
                </p>
              </div>
              <Link
                href="/practice?count=10"
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-black text-primary hover:text-primary-dark transition-colors"
              >
                <span>Start Practice (~5 min)</span>
                <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Action 2: Mock Assessment */}
            <div className="card-luxury p-5 rounded-2xl border border-border/80 shadow-xs hover:border-indigo-500/50 transition-all flex flex-col justify-between group">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Target size={20} />
                </div>
                <h4 className="text-sm font-black text-foreground">
                  Full-Length Mock Test
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Timed simulation under real exam conditions with negative marking and instant ranking.
                </p>
              </div>
              <Link
                href="/mock-tests"
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-black text-indigo-600 dark:text-indigo-400 hover:underline transition-colors"
              >
                <span>Take Mock Test</span>
                <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Action 3: AI Mistakes Analysis */}
            <div className="card-luxury p-5 rounded-2xl border border-border/80 shadow-xs hover:border-purple-500/50 transition-all flex flex-col justify-between group">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Sparkles size={20} />
                </div>
                <h4 className="text-sm font-black text-foreground">
                  Samyak AI Mistake Review
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Diagnose patterns in your incorrect answers and receive targeted AI remedial drills.
                </p>
              </div>
              <Link
                href="/ai-tutor?tab=mistakes"
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-black text-purple-600 dark:text-purple-400 hover:underline transition-colors"
              >
                <span>Review with AI</span>
                <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>

        {/* ── 5. CURRENT PROGRAM SUBJECTS GRID ─────────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base sm:text-lg font-black text-foreground">
                {currentProgram.shortName} Subjects &amp; Curriculum
              </h3>
              <p className="text-xs text-muted-foreground font-medium">
                Select a subject to access video lessons, chapter notes, and question banks.
              </p>
            </div>
            <Link
              href="/subjects"
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1 shrink-0"
            >
              <span>View All</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {currentProgram.subjects.map((sub) => {
              const slug = sub.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
              return (
                <Link
                  key={sub.name}
                  href={`/subjects?subject=${slug}`}
                  className="card-luxury p-4 rounded-2xl border border-border/80 hover:border-primary/50 hover:bg-primary/5 transition-all flex flex-col items-center text-center group"
                >
                  <span className="text-2xl mb-2 group-hover:scale-125 transition-transform">
                    {sub.icon}
                  </span>
                  <p className="text-xs sm:text-sm font-black text-foreground line-clamp-1">
                    {sub.name}
                  </p>
                  <span className="text-[11px] text-muted-foreground font-semibold mt-1">
                    {sub.chaptersCount} Chapters
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* ── 6. TWO-COLUMN: WEAK TOPICS + LIVE CLASSES & SCHEDULE ──────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <WeakTopicsPanel />
          </div>
          <div className="space-y-6">
            <LiveClassesCard />
            <UpcomingSchedule />
          </div>
        </div>

        {/* ── 7. RECENT EXAM ATTEMPTS & HISTORY ────────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base sm:text-lg font-black text-foreground">
                Recent Exam &amp; Practice History
              </h3>
              <p className="text-xs text-muted-foreground font-medium">
                Detailed test scores, accuracy breakdowns, and answer analytics.
              </p>
            </div>
            <Link
              href="/mock-tests"
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
            >
              <span>Mock Tests Hub</span>
              <ChevronRight size={14} />
            </Link>
          </div>
          <RecentExamsTable />
        </div>

        {/* ── 8. REVIEW / FEEDBACK BANNER ───────────────────────────────── */}
        {!reviewDismissed && (
          <div className="relative p-5 sm:p-6 rounded-3xl bg-card border border-amber-500/20 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <button
              onClick={() => setReviewDismissed(true)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition-colors"
              title="Dismiss"
            >
              <X size={16} />
            </button>

            <div className="space-y-1.5 max-w-2xl pr-6">
              <div className="flex items-center gap-2">
                <span className="text-amber-400 text-sm">★★★★★</span>
                <span className="text-xs font-bold text-foreground">
                  How is your learning experience on Samyak Tutor, {displayName}?
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Your feedback helps us refine AI evaluation accuracy, chapter videos, and mock tests for fellow students across Nepal.
              </p>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto shrink-0 pt-1 md:pt-0">
              <a
                href="https://www.trustpilot.com/evaluate/samyakcee.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 md:flex-none px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <span>Rate on Trustpilot</span>
                <ArrowRight size={13} />
              </a>
              <a
                href={SUPPORT_CONFIG.googleReviewLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 md:flex-none px-4 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground border border-border/80 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <span>Rate on Google</span>
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Program / Course Selector Modal */}
      <ProgramSelectorModal
        isOpen={showSelectorModal}
        onClose={() => setShowSelectorModal(false)}
      />
    </DashboardLayout>
  );
}