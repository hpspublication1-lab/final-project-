'use client';

import React from 'react';
import Link from 'next/link';
import CoursePortalHeader from './CoursePortalHeader';
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
  BookOpen,
  ArrowRight,
  ClipboardList,
  Sparkles,
  Timer,
  History,
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

  const pastPapers = [
    { id: 'cee-2025', title: 'CEE Medical 2025 Official Entrance Paper', type: 'MEC Past Paper', marks: '200 MCQs · 180 Mins', solved: true },
    { id: 'cee-2024', title: 'CEE Medical 2024 Official Entrance Paper', type: 'MEC Past Paper', marks: '200 MCQs · 180 Mins', solved: false },
    { id: 'iom-2023', title: 'IOM MBBS Entrance Model Set 2023', type: 'IOM Archive', marks: '200 MCQs · 180 Mins', solved: false },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Header Identity & Overview */}
      <CoursePortalHeader
        displayName={displayName}
        isEnrolled={isEnrolled}
        isPro={isPro}
        onOpenCourseSelector={onOpenCourseSelector}
      />

      {/* 2. Compact Medical Entrance Target & Countdown Ribbon */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 text-white border border-indigo-500/30 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center shrink-0">
            <Timer size={20} className="text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300 border border-indigo-400/30">
                MECEE 2026 Target
              </span>
              <span className="text-xs text-indigo-200 font-semibold">Nepal Medical Commission</span>
            </div>
            <h3 className="text-sm sm:text-base font-black mt-0.5">Target: Top 100 Government Scholarship</h3>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/15 text-xs font-bold">
          <span className="text-white font-black text-sm">128</span>
          <span className="text-white/70 text-[10px] uppercase">Days Left</span>
        </div>
      </div>

      {/* 3. Main 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Main Curriculum, Practice & Exams (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Quick Actions Launchpad */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-extrabold text-foreground flex items-center gap-2">
                <Sparkles size={16} className="text-primary" /> CEE Entrance High-Yield Launchpad
              </h3>
              <Link href="/study-plan" className="flex items-center gap-1 text-xs text-primary font-bold hover:underline">
                <ClipboardList size={13} />
                Daily Plan
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {config.quickActions.map((qa) => (
                <Link
                  key={qa.key}
                  href={qa.href}
                  className="p-3.5 rounded-2xl bg-card border border-border hover:border-indigo-500/40 hover:shadow-md transition-all flex flex-col justify-between space-y-2 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 group-hover:scale-110 transition-transform">
                      <Zap size={16} />
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

          {/* Performance Bento Grid */}
          <KPIBentoGrid />

          {/* Medical Subjects Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-foreground flex items-center gap-2">
                  <BookOpen size={16} className="text-indigo-500" /> CEE Medical Subjects ({config.defaultSubjects.length})
                </h3>
                <p className="text-[11px] text-muted-foreground">High-yield syllabus with official weightage distribution.</p>
              </div>
              <Link href="/subjects" className="text-xs font-bold text-indigo-600 hover:underline">
                All Chapters →
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
              {config.defaultSubjects.map((sub) => (
                <div
                  key={sub.id}
                  className="p-3.5 rounded-2xl bg-card border border-border hover:border-indigo-500/40 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xl">{sub.icon}</span>
                    <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                      {sub.weightage}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-foreground">{sub.name}</h4>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{sub.chaptersCount} Chapters</p>
                  </div>
                  <Link
                    href="/subjects"
                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center justify-between pt-2 border-t border-border/50"
                  >
                    <span>Practice MCQs</span>
                    <ArrowRight size={11} />
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Past Papers & Solved Sets */}
          <div className="p-5 rounded-2xl bg-card border border-border space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-foreground flex items-center gap-2">
                <History size={16} className="text-indigo-500" /> Previous Years&apos; CEE / IOM Solved Sets
              </h3>
              <Link href="/mock-tests" className="text-xs font-bold text-indigo-600 hover:underline">
                All Past Papers →
              </Link>
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              {pastPapers.map((pp) => (
                <div
                  key={pp.id}
                  className="p-3.5 rounded-xl bg-muted/40 border border-border hover:border-indigo-500/30 flex flex-col justify-between space-y-2.5 transition-all"
                >
                  <div>
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600">
                      {pp.type}
                    </span>
                    <h5 className="text-xs font-bold text-foreground mt-1.5 leading-snug">{pp.title}</h5>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{pp.marks}</p>
                  </div>
                  <Link
                    href="/mock-tests"
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] flex items-center justify-center gap-1 transition-colors"
                  >
                    <span>{pp.solved ? 'Review Solution' : 'Start Timed Test'}</span>
                    <ArrowRight size={11} />
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Mastery & Trends */}
          <div className="grid sm:grid-cols-2 gap-4">
            <SubjectMasteryRings />
            <AccuracyTrendChart />
          </div>

          {/* Recent Exams Table */}
          <RecentExamsTable />
        </div>

        {/* RIGHT COLUMN: AI Copilot, Daily Plan & Schedule (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Today's Actionable Study Plan */}
          <StudyPlanTasks />

          {/* AI Weakness & Mistake Diagnostic */}
          <WeakTopicsPanel />

          {/* Live Classes Stream */}
          <LiveClassesCard />

          {/* Upcoming Schedule */}
          <UpcomingSchedule />
        </div>

      </div>
    </div>
  );
}
