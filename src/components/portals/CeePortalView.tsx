'use client';

import React from 'react';
import Link from 'next/link';
import KPIBentoGrid from '@/app/student-dashboard/components/KPIBentoGrid';
import SubjectMasteryRings from '@/app/student-dashboard/components/SubjectMasteryRings';
import AccuracyTrendChart from '@/app/student-dashboard/components/AccuracyTrendChart';
import WeakTopicsPanel from '@/app/student-dashboard/components/WeakTopicsPanel';
import UpcomingSchedule from '@/app/student-dashboard/components/UpcomingSchedule';
import RecentExamsTable from '@/app/student-dashboard/components/RecentExamsTable';
import StudyPlanTasks from '@/app/student-dashboard/components/StudyPlanTasks';
import LiveClassesCard from '@/app/student-dashboard/components/LiveClassesCard';
import { Zap, FileText, Bot, Swords, BookOpen, Video, ArrowRight, ClipboardList, Stethoscope, Trophy, Sparkles, Brain } from 'lucide-react';

interface PortalViewProps {
  displayName: string;
  isPro: boolean;
  profile: any;
}

const ceeQuickActions = [
  {
    key: 'qa-practice',
    label: 'Practice CEE MCQs',
    desc: '15,000+ Topicwise Questions',
    href: '/practice',
    icon: Zap,
    color: 'bg-primary/10 text-primary',
    border: 'border-primary/20',
  },
  {
    key: 'qa-mock',
    label: 'MEC Mock Exam',
    desc: '200-Q Timed Simulation',
    href: '/mock-tests',
    icon: FileText,
    color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-500/20',
  },
  {
    key: 'qa-battle',
    label: 'Battle Arena',
    desc: 'Real-Time 2-Player Match',
    href: '/battle-arena',
    icon: Swords,
    color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
    border: 'border-rose-500/20',
  },
  {
    key: 'qa-ai',
    label: 'AI Medical Tutor',
    desc: 'Instant Step-by-Step Help',
    href: '/ai-tutor',
    icon: Bot,
    color: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
    border: 'border-cyan-500/20',
  },
  {
    key: 'qa-subjects',
    label: 'Medical Subjects',
    desc: 'Bio, Chem, Physics & MAT',
    href: '/subjects',
    icon: BookOpen,
    color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    border: 'border-indigo-500/20',
  },
  {
    key: 'qa-flashcards',
    label: 'SM-2 Flashcards',
    desc: 'Spaced Repetition High-Yield',
    href: '/flashcards',
    icon: Brain,
    color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    border: 'border-amber-500/20',
  },
];

export default function CeePortalView({ displayName, isPro, profile }: PortalViewProps) {
  return (
    <div className="space-y-6">
      {/* Portal Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-primary/15 via-card to-indigo-500/10 border border-primary/20 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-primary text-white text-xs font-bold flex items-center gap-1 shadow-xs">
              <Stethoscope size={14} /> CEE Medical Entrance Portal
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              MECEE 2026 Batch
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            Welcome back, {displayName} 🩺
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Targeting MBBS / BDS / B.Sc Nursing · Current Rating: <strong className="text-foreground">{profile?.battle_rating || 1200} ELO</strong>
            {profile?.study_streak ? <span className="ml-2 text-primary font-bold">🔥 {profile.study_streak} Day Streak</span> : null}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 border text-xs font-bold px-3.5 py-2 rounded-2xl ${
            isPro ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-muted border-border text-muted-foreground'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isPro ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground'}`} />
            {isPro ? 'CEE Pro Access Active' : 'Free Trial Mode'}
          </div>
          <Link href="/practice" className="btn-primary text-xs sm:text-sm py-2 px-4.5 gap-1.5 rounded-xl shadow-md">
            Start CEE Practice
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>

      {/* CEE Quick Actions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm sm:text-base font-extrabold text-foreground flex items-center gap-2">
            <Sparkles size={16} className="text-primary" /> CEE Entrance Quick Launchpad
          </h2>
          <Link href="/study-plan" className="flex items-center gap-1 text-xs text-primary font-bold hover:underline">
            <ClipboardList size={13} />
            View CEE Daily Schedule
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {ceeQuickActions.map((action) => (
            <Link
              key={action.key}
              href={action.href}
              className={`flex flex-col items-center text-center gap-2.5 p-4 rounded-2xl border bg-card hover:shadow-md transition-all duration-150 hover:-translate-y-0.5 ${action.border}`}
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${action.color}`}>
                <action.icon size={22} />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground leading-tight">{action.label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{action.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Live Classes (Bunny.net) */}
      <LiveClassesCard />

      {/* KPI Bento Grid */}
      <KPIBentoGrid />

      {/* Accuracy & Weak Topics */}
      <div className="grid lg:grid-cols-3 xl:grid-cols-4 gap-5">
        <div className="lg:col-span-2 xl:col-span-3">
          <AccuracyTrendChart />
        </div>
        <div className="lg:col-span-1 xl:col-span-1">
          <WeakTopicsPanel />
        </div>
      </div>

      {/* Subject mastery & schedule */}
      <div className="grid lg:grid-cols-3 xl:grid-cols-4 gap-5">
        <div className="lg:col-span-2 xl:col-span-2">
          <SubjectMasteryRings />
        </div>
        <div className="lg:col-span-1 xl:col-span-1">
          <UpcomingSchedule />
        </div>
        <div className="lg:col-span-3 xl:col-span-1">
          <StudyPlanTasks />
        </div>
      </div>

      {/* Recent exams */}
      <RecentExamsTable />
    </div>
  );
}
