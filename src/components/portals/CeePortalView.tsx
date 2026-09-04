'use client';

import React from 'react';
import Link from 'next/link';
import { COURSE_PORTAL_CONFIGS } from '@/lib/config/courseFeatures';
import KPIBentoGrid from '@/app/student-dashboard/components/KPIBentoGrid';
import SubjectMasteryRings from '@/app/student-dashboard/components/SubjectMasteryRings';
import AccuracyTrendChart from '@/app/student-dashboard/components/AccuracyTrendChart';
import WeakTopicsPanel from '@/app/student-dashboard/components/WeakTopicsPanel';
import RecentExamsTable from '@/app/student-dashboard/components/RecentExamsTable';
import StudyPlanTasks from '@/app/student-dashboard/components/StudyPlanTasks';
import LiveClassesCard from '@/app/student-dashboard/components/LiveClassesCard';
import UpcomingSchedule from '@/app/student-dashboard/components/UpcomingSchedule';
import {
  Zap, BookOpen, ArrowRight, Target, Trophy, Flame,
  ChevronRight, Play, Timer, BarChart2,
} from 'lucide-react';

interface PortalViewProps {
  displayName: string;
  isEnrolled?: boolean;
  isPro?: boolean;
  profile?: any;
  onOpenCourseSelector?: () => void;
}

// 4 primary CEE subjects for quick access
const CEE_SUBJECTS = [
  { id: 'biology',   label: 'Biology',   icon: '🧬', href: '/subjects?subject=biology',   color: 'bg-green-500/10 text-green-700 dark:text-green-400',  border: 'hover:border-green-400/50' },
  { id: 'chemistry', label: 'Chemistry', icon: '⚗️', href: '/subjects?subject=chemistry', color: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',    border: 'hover:border-blue-400/50'  },
  { id: 'physics',   label: 'Physics',   icon: '⚡', href: '/subjects?subject=physics',   color: 'bg-amber-500/10 text-amber-700 dark:text-amber-400', border: 'hover:border-amber-400/50' },
  { id: 'mat',       label: 'MAT',       icon: '🧠', href: '/subjects?subject=mat',       color: 'bg-purple-500/10 text-purple-700 dark:text-purple-400', border: 'hover:border-purple-400/50' },
];

export default function CeePortalView({
  displayName,
  isEnrolled = true,
  isPro = false,
  profile,
  onOpenCourseSelector,
}: PortalViewProps) {
  const config = COURSE_PORTAL_CONFIGS.cee_medical;

  const targetDate = new Date('2026-04-15T08:00:00');
  const now = new Date();
  const ceeDays = Math.max(0, Math.floor((targetDate.getTime() - now.getTime()) / 86400000));

  const firstName = displayName?.split(' ')?.[0] || 'Student';

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">

      {/* ── 1. Greeting + countdown strip ──────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-foreground">
            Good {now.getHours() < 12 ? 'morning' : now.getHours() < 17 ? 'afternoon' : 'evening'}, {firstName}! 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Ready to crack CEE Medical 2026?</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-primary/10 border border-primary/20 self-start sm:self-auto">
          <Timer size={16} className="text-primary" />
          <span className="font-black text-lg text-primary font-mono">{ceeDays}</span>
          <span className="text-xs text-muted-foreground font-semibold">days to CEE</span>
        </div>
      </div>

      {/* ── 2. TODAY'S FOCUS hero action ────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-indigo-700 p-6 text-white shadow-luxury">
        <div className="absolute right-0 top-0 w-48 h-48 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-white/70">TODAY&apos;S FOCUS 🎯</span>
            <h2 className="text-lg sm:text-xl font-black mt-1">Continue where you left off</h2>
            <p className="text-sm text-white/75 mt-0.5">Biology · Chapter 12: Cell Division</p>
          </div>
          <Link
            href="/subjects"
            className="flex items-center gap-2 px-6 py-3 bg-white text-primary font-black text-sm rounded-2xl hover:bg-white/90 transition-all active:scale-95 shrink-0 shadow-sm"
          >
            <Play size={16} fill="currentColor" />
            CONTINUE LEARNING
          </Link>
        </div>
      </div>

      {/* ── 3. Quick Practice Buttons ──────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: '10 MCQs', desc: '~5 min', href: '/practice?count=10' },
          { label: '25 MCQs', desc: '~12 min', href: '/practice?count=25' },
          { label: '50 MCQs', desc: '~25 min', href: '/practice?count=50' },
        ].map((q) => (
          <Link
            key={q.label}
            href={q.href}
            className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl bg-card border border-border hover:border-primary/50 hover:bg-primary/5 transition-all group"
          >
            <Zap size={18} className="text-primary mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-black text-foreground">{q.label}</span>
            <span className="text-[10px] text-muted-foreground">{q.desc}</span>
          </Link>
        ))}
      </div>

      {/* ── 4. 4 Subject Quick Access ──────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-extrabold text-foreground flex items-center gap-2">
            <BookOpen size={16} className="text-primary" /> Subjects
          </h2>
          <Link href="/subjects" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
            All chapters <ChevronRight size={13} />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {CEE_SUBJECTS.map((sub) => (
            <Link
              key={sub.id}
              href={sub.href}
              className={`flex items-center gap-3 p-4 rounded-2xl bg-card border border-border ${sub.border} transition-all hover:shadow-md group`}
            >
              <span className="text-2xl">{sub.icon}</span>
              <div>
                <p className="text-sm font-extrabold text-foreground">{sub.label}</p>
                <p className="text-[10px] text-muted-foreground">Practice MCQs</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── 5. Mock Test CTA ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/mock-tests"
          className="flex-1 flex items-center justify-between p-4 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all hover:shadow-sm group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Trophy size={18} className="text-primary" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-foreground">Full Mock Test</p>
              <p className="text-xs text-muted-foreground">200 MCQs · 3 hours</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
        </Link>
        <Link
          href="/leaderboard"
          className="flex-1 flex items-center justify-between p-4 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all hover:shadow-sm group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Target size={18} className="text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-foreground">My Rank</p>
              <p className="text-xs text-muted-foreground">CEE leaderboard</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
        </Link>
      </div>

      {/* ── 6. Progress Summary (collapsed by default, link to full) ────── */}
      <div className="p-4 rounded-2xl bg-card border border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-extrabold text-foreground flex items-center gap-2">
            <BarChart2 size={16} className="text-primary" /> My Progress
          </h2>
          <Link href="/student-dashboard?tab=progress" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
            Full analytics <ChevronRight size={13} />
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: <Flame size={16} className="text-error" />, label: 'Streak', value: `${profile?.study_streak ?? 0}d` },
            { icon: <Zap size={16} className="text-primary" />, label: 'Questions', value: `${(profile?.questions_solved ?? 0).toLocaleString()}` },
            { icon: <Trophy size={16} className="text-amber-500" />, label: 'Accuracy', value: `${profile?.overall_accuracy ?? 0}%` },
          ].map((stat) => (
            <div key={stat.label} className="text-center p-3 rounded-xl bg-muted/40">
              <div className="flex justify-center mb-1">{stat.icon}</div>
              <p className="text-base font-black text-foreground">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── 7. Today's study plan (compact) ─────────────────────────────── */}
      <StudyPlanTasks />

      {/* ── 8. Advanced Analytics (for those who want depth) ────────────── */}
      <details className="group">
        <summary className="cursor-pointer list-none flex items-center justify-between p-4 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all">
          <span className="text-sm font-extrabold text-foreground flex items-center gap-2">
            <BarChart2 size={16} className="text-primary" /> Detailed Analytics
          </span>
          <span className="text-xs text-muted-foreground group-open:hidden">Show ▼</span>
          <span className="text-xs text-muted-foreground hidden group-open:inline">Hide ▲</span>
        </summary>
        <div className="mt-4 space-y-4">
          <KPIBentoGrid />
          <div className="grid sm:grid-cols-2 gap-4">
            <SubjectMasteryRings />
            <AccuracyTrendChart />
          </div>
          <WeakTopicsPanel />
          <RecentExamsTable />
          <LiveClassesCard />
          <UpcomingSchedule />
        </div>
      </details>

    </div>
  );
}
