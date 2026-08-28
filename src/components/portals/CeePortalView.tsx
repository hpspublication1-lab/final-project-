'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import CoursePortalHeader from './CoursePortalHeader';
import TodayPersonalizedOSWidget from '@/components/TodayPersonalizedOSWidget';
import { COURSE_PORTAL_CONFIGS } from '@/lib/config/courseFeatures';
import KPIBentoGrid from '@/app/student-dashboard/components/KPIBentoGrid';
import SubjectMasteryRings from '@/app/student-dashboard/components/SubjectMasteryRings';
import AccuracyTrendChart from '@/app/student-dashboard/components/AccuracyTrendChart';
import WeakTopicsPanel from '@/app/student-dashboard/components/WeakTopicsPanel';
import UpcomingSchedule from '@/app/student-dashboard/components/UpcomingSchedule';
import RecentExamsTable from '@/app/student-dashboard/components/RecentExamsTable';
import StudyPlanTasks from '@/app/student-dashboard/components/StudyPlanTasks';
import LiveClassesCard from '@/app/student-dashboard/components/LiveClassesCard';
import {
  Zap,
  FileText,
  Bot,
  Swords,
  BookOpen,
  ArrowRight,
  ClipboardList,
  Stethoscope,
  Trophy,
  Sparkles,
  Brain,
  Timer,
  CheckCircle,
  AlertTriangle,
  History,
  TrendingUp,
} from 'lucide-react';

interface PortalViewProps {
  displayName: string;
  isEnrolled?: boolean;
  isPro?: boolean;
  profile?: any;
  onOpenCourseSelector?: () => void;
}

export default function CeePortalView({
  displayName,
  isEnrolled = true,
  isPro = false,
  profile,
  onOpenCourseSelector,
}: PortalViewProps) {
  const config = COURSE_PORTAL_CONFIGS.cee_medical;

  return (
    <div className="space-y-6">
      {/* 1. Header Identity */}
      <CoursePortalHeader
        displayName={displayName}
        isEnrolled={isEnrolled}
        isPro={isPro}
        onOpenCourseSelector={onOpenCourseSelector}
      />

      {/* 2. Today Personal AI Education OS Stream */}
      <TodayPersonalizedOSWidget />

      {/* 2. Medical Entrance Countdown & Target Bar */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 text-white border border-indigo-500/30 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center shrink-0">
            <Timer size={28} className="text-indigo-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300 border border-indigo-400/30">
                MECEE 2026 Countdown
              </span>
              <span className="text-xs text-indigo-200 font-semibold">Nepal Medical Commission</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black mt-0.5">Target: Top 100 Government Scholarship</h3>
            <p className="text-xs text-indigo-200/80">MBBS · BDS · B.Sc Nursing · B.Pharm · BPT</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/15">
          <div className="text-center px-2">
            <p className="text-xl sm:text-2xl font-black text-white">128</p>
            <p className="text-[9px] uppercase font-bold text-white/70">Days Left</p>
          </div>
          <span className="text-white/40 font-light text-xl">:</span>
          <div className="text-center px-2">
            <p className="text-xl sm:text-2xl font-black text-white">14</p>
            <p className="text-[9px] uppercase font-bold text-white/70">Hours</p>
          </div>
          <span className="text-white/40 font-light text-xl">:</span>
          <div className="text-center px-2">
            <p className="text-xl sm:text-2xl font-black text-indigo-300">45</p>
            <p className="text-[9px] uppercase font-bold text-white/70">Mins</p>
          </div>
        </div>
      </div>

      {/* 3. CEE Quick Actions Launchpad */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-extrabold text-foreground flex items-center gap-2">
            <Sparkles size={16} className="text-primary" /> CEE High-Yield Entrance Launchpad
          </h3>
          <Link href="/study-plan" className="flex items-center gap-1 text-xs text-primary font-bold hover:underline">
            <ClipboardList size={13} />
            View CEE Daily Plan
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {config.quickActions.map((qa) => (
            <Link
              key={qa.key}
              href={qa.href}
              className="p-4 rounded-2xl bg-card border border-border hover:border-indigo-500/40 hover:shadow-md transition-all duration-150 flex flex-col justify-between space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 group-hover:scale-110 transition-transform">
                  <Zap size={18} />
                </span>
                {qa.badge && (
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-700 dark:text-indigo-300">
                    {qa.badge}
                  </span>
                )}
              </div>
              <div>
                <p className="text-xs font-bold text-foreground group-hover:text-indigo-600 transition-colors">{qa.label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{qa.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* 4. Live Classes (Bunny.net HD Stream) */}
      <LiveClassesCard />

      {/* 5. KPI Bento Grid (Accuracy, Speed, Questions Solved, Rank) */}
      <KPIBentoGrid />

      {/* 6. Medical Subjects (Zoology, Botany, Chemistry, Physics, MAT) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
              <BookOpen size={18} className="text-indigo-500" /> CEE Medical Subjects ({config.defaultSubjects.length})
            </h3>
            <p className="text-xs text-muted-foreground">High-yield syllabus with weightage distribution.</p>
          </div>
          <Link href="/subjects" className="text-xs font-bold text-indigo-600 hover:underline">
            All Chapters →
          </Link>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-3">
          {config.defaultSubjects.map((sub) => (
            <div
              key={sub.id}
              className="p-4 rounded-2xl bg-card border border-border hover:border-indigo-500/40 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">{sub.icon}</span>
                <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                  {sub.weightage}
                </span>
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-foreground">{sub.name}</h4>
                <p className="text-[10px] text-muted-foreground mt-0.5">{sub.chaptersCount} Chapters</p>
              </div>
              <Link
                href="/subjects"
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center justify-between pt-2 border-t border-border/50"
              >
                <span>Practice MCQs</span>
                <ArrowRight size={12} />
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* 7. Previous Years' Questions & MEC Mock Sets */}
      <div className="p-6 rounded-3xl bg-card border border-border space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm sm:text-base font-extrabold text-foreground flex items-center gap-2">
            <History size={16} className="text-indigo-500" /> Previous Years&apos; CEE / IOM / BPKIHS Solved Sets
          </h3>
          <Link href="/mock-tests" className="text-xs font-bold text-indigo-600 hover:underline">
            All Past Papers →
          </Link>
        </div>
        <div className="grid md:grid-cols-3 gap-3">
          {pastPapers.map((pp) => (
            <div
              key={pp.id}
              className="p-4 rounded-2xl bg-muted/40 border border-border hover:border-indigo-500/30 flex flex-col justify-between space-y-3 transition-all"
            >
              <div>
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600">
                  {pp.type}
                </span>
                <h5 className="text-xs font-bold text-foreground mt-2 leading-snug">{pp.title}</h5>
                <p className="text-[10px] text-muted-foreground mt-1">{pp.marks}</p>
              </div>
              <Link
                href="/mock-tests"
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>{pp.solved ? 'Review Solution' : 'Start Timed Test'}</span>
                <ArrowRight size={12} />
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* 8. Accuracy Trend & Weak Topics Review */}
      <div className="grid lg:grid-cols-3 xl:grid-cols-4 gap-5">
        <div className="lg:col-span-2 xl:col-span-3">
          <AccuracyTrendChart />
        </div>
        <div className="lg:col-span-1 xl:col-span-1">
          <WeakTopicsPanel />
        </div>
      </div>

      {/* 9. Subject Mastery & Schedule */}
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

      {/* 10. Recent Exams Table */}
      <RecentExamsTable />
    </div>
  );
}
