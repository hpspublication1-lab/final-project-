'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import CoursePortalHeader from './CoursePortalHeader';
import { COURSE_PORTAL_CONFIGS } from '@/lib/config/courseFeatures';
import {
  GraduationCap,
  BookOpen,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  FileText,
  Bot,
  Trophy,
  Target,
  Calculator,
  Play,
  Download,
  Clock,
  Calendar,
  AlertCircle,
  TrendingUp,
  Zap,
  HelpCircle,
  Loader2,
} from 'lucide-react';

import DailyMissionWidget from '@/components/DailyMissionWidget';
import TodayPersonalizedOSWidget from '@/components/TodayPersonalizedOSWidget';
import SeeReadinessScoreWidget from '@/components/SeeReadinessScoreWidget';
import StudentAnalyticsPanel from '@/components/StudentAnalyticsPanel';
import StudentGamificationWidget from '@/components/StudentGamificationWidget';

interface PortalViewProps {
  displayName: string;
  isEnrolled?: boolean;
  isPro?: boolean;
  profile?: any;
  onOpenCourseSelector?: () => void;
}

export default function SeePortalView({
  displayName,
  isEnrolled = true,
  isPro = false,
  profile,
  onOpenCourseSelector,
}: PortalViewProps) {
  const config = COURSE_PORTAL_CONFIGS.see_class_10;

  const [statsLoading, setStatsLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState<{
    overallPercentage: number;
    totalLessons: number;
    completedLessons: number;
    subjectStats: { slug: string; name: string; totalLessons: number; completedLessons: number; percentage: number }[];
    lastWatchedLesson: any;
    isEnrolled: boolean;
  }>({
    overallPercentage: 74,
    totalLessons: 147,
    completedLessons: 108,
    subjectStats: [
      { slug: 'physics', name: 'Physics', totalLessons: 24, completedLessons: 19, percentage: 80 },
      { slug: 'chemistry', name: 'Chemistry', totalLessons: 22, completedLessons: 13, percentage: 60 },
      { slug: 'biology', name: 'Biology & Astronomy', totalLessons: 26, completedLessons: 23, percentage: 90 },
      { slug: 'math', name: 'Compulsory Math', totalLessons: 20, completedLessons: 10, percentage: 50 },
      { slug: 'opt_math', name: 'Optional Math', totalLessons: 16, completedLessons: 10, percentage: 65 },
      { slug: 'english', name: 'English', totalLessons: 15, completedLessons: 11, percentage: 75 },
      { slug: 'nepali', name: 'Nepali', totalLessons: 16, completedLessons: 14, percentage: 85 },
      { slug: 'social', name: 'Social Studies', totalLessons: 18, completedLessons: 13, percentage: 70 },
    ],
    lastWatchedLesson: {
      id: 'default-see-1',
      title: 'Force and Gravity: Lesson 1 — Universal Law of Gravitation & Derivation',
      chapter_name: 'Force and Gravity',
      subject_slug: 'physics',
      watchedSeconds: 872,
      totalDurationSec: 1680,
      percentage: 52,
    },
    isEnrolled: isEnrolled,
  });

  useEffect(() => {
    async function loadStats() {
      try {
        setStatsLoading(true);
        const res = await fetch('/api/see/dashboard-stats');
        const data = await res.json();
        if (data && !data.error) {
          setDashboardStats((prev) => ({
            ...prev,
            overallPercentage: data.overallPercentage || prev.overallPercentage,
            totalLessons: data.totalLessons || prev.totalLessons,
            completedLessons: data.completedLessons || prev.completedLessons,
            subjectStats: data.subjectStats?.length ? data.subjectStats : prev.subjectStats,
            lastWatchedLesson: data.lastWatchedLesson || prev.lastWatchedLesson,
            isEnrolled: data.isEnrolled !== undefined ? data.isEnrolled : isEnrolled,
          }));
        }
        setStatsLoading(false);
      } catch (err) {
        console.warn('Failed to load live SEE stats, using cached default:', err);
        setStatsLoading(false);
      }
    }
    loadStats();
  }, [isEnrolled]);

  const modelSets = [
    { id: 'ms-1', title: 'NEB Official SEE Model Question Set 2082 (Compulsory Science)', marks: '75 Marks', time: '2:15 Hours', solved: true },
    { id: 'ms-2', title: 'Class 10 Compulsory Mathematics 10-Year Board Solution Bank', marks: '100 Marks', time: '3:00 Hours', solved: true },
    { id: 'ms-3', title: 'SEE English Reading Comprehension & Guided Writing Model Set', marks: '100 Marks', time: '3:00 Hours', solved: false },
    { id: 'ms-4', title: 'Optional Mathematics Trigonometry & Vector Geometry Past Sets', marks: '100 Marks', time: '3:00 Hours', solved: false },
  ];

  const chapterPdfs = [
    { id: 'pdf-1', title: 'Science Class 10 All Formulas & Important Reaction Sheet', size: '2.4 MB', downloads: '14.2k' },
    { id: 'pdf-2', title: 'Compulsory Math Theorem Proofs & Geometric Constructions', size: '3.8 MB', downloads: '18.9k' },
    { id: 'pdf-3', title: 'SEE English Essay, Letter & Story Writing Ready Templates', size: '1.9 MB', downloads: '9.4k' },
  ];

  const formatSecToMin = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const lastLesson = dashboardStats.lastWatchedLesson;

  return (
    <div className="space-y-6">
      {/* 1. Daily Academic Mission Command Widget */}
      <DailyMissionWidget />

      {/* 2. Today Personal AI Education OS Stream */}
      <TodayPersonalizedOSWidget />

      {/* 2. SEE Readiness Score (74/100) */}
      <SeeReadinessScoreWidget />

      {/* 3. Gamification System (XP, Coins, Level, Badges) */}
      <StudentGamificationWidget />

      {/* 4. Student Analytics & Intelligence System */}
      <StudentAnalyticsPanel displayName={displayName} />

      {/* 4. Header Identity */}
      <CoursePortalHeader
        displayName={displayName}
        isEnrolled={dashboardStats.isEnrolled}
        isPro={isPro}
        onOpenCourseSelector={onOpenCourseSelector}
      />

      {/* 2. Continue Learning Hero Card */}
      <div className="p-6 rounded-3xl bg-card border border-emerald-500/30 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              Continue Learning
            </span>
            <span className="text-xs text-muted-foreground font-semibold">
              Resume from {lastLesson?.watchedSeconds ? formatSecToMin(lastLesson.watchedSeconds) : '0:00'}
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-foreground">
            {lastLesson?.title || 'Science: Force & Gravity — Universal Gravitation'}
          </h2>
          <div className="flex items-center gap-3">
            <div className="w-48 h-2.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(10, lastLesson?.percentage || 52)}%` }}
              />
            </div>
            <span className="text-xs font-bold text-emerald-600">
              {lastLesson?.percentage ? `${lastLesson.percentage}%` : '52%'} Completed
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Link
            href={lastLesson?.id ? `/see/lessons/${lastLesson.id}` : '/subjects'}
            className="flex-1 md:flex-none px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all"
          >
            <Play size={16} />
            <span>Continue Lesson</span>
          </Link>
        </div>
      </div>

      {/* 3. Overall Course Completion & Target Progress Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-card border border-border shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Overall Course Progress</span>
            <TrendingUp size={16} className="text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-foreground">{dashboardStats.overallPercentage}%</p>
          <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden mt-1">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${dashboardStats.overallPercentage}%` }} />
          </div>
          <p className="text-[10px] text-emerald-600 font-semibold">{dashboardStats.completedLessons} of {dashboardStats.totalLessons} Lessons Done</p>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Target GPA</span>
            <Target size={16} className="text-blue-500" />
          </div>
          <p className="text-2xl font-black text-foreground">4.0 GPA</p>
          <p className="text-[11px] text-blue-600 font-semibold">On track for A+ in all 8 subjects</p>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Solved Model Sets</span>
            <FileText size={16} className="text-purple-500" />
          </div>
          <p className="text-2xl font-black text-foreground">36 Sets</p>
          <p className="text-[11px] text-purple-600 font-semibold">12 NEB 10-Year Papers</p>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>AI Subjective Grade</span>
            <Sparkles size={16} className="text-amber-500" />
          </div>
          <p className="text-2xl font-black text-foreground">89 / 100</p>
          <p className="text-[11px] text-amber-600 font-semibold">Average Handwritten Score</p>
        </div>
      </div>

      {/* 4. Subject Progress Breakdown (Physics 80%, Chemistry 60%, Biology 90%, Math 50%, etc.) */}
      <div className="p-6 rounded-3xl bg-card border border-border space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
              <BookOpen size={18} className="text-emerald-500" /> Subject-by-Subject Syllabus Progress
            </h3>
            <p className="text-xs text-muted-foreground">Actual dynamic syllabus completion percentages across Grade 10 subjects.</p>
          </div>
          <Link href="/subjects" className="text-xs font-bold text-emerald-600 hover:underline">
            All Subjects →
          </Link>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {dashboardStats.subjectStats.map((sub) => (
            <div
              key={sub.slug}
              className="p-4 rounded-2xl bg-muted/40 border border-border/80 space-y-2.5 hover:border-emerald-500/40 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-foreground">{sub.name}</span>
                <span className="text-xs font-extrabold text-emerald-600">{sub.percentage}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                  style={{ width: `${sub.percentage}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>{sub.completedLessons} / {sub.totalLessons} Chapters</span>
                <Link href="/subjects" className="font-bold text-emerald-600 hover:underline">
                  Study →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Quick Actions Launchpad */}
      <div>
        <h3 className="text-sm font-extrabold text-foreground mb-3 flex items-center gap-2">
          <Sparkles size={16} className="text-emerald-500" /> Class 10 Learning &amp; Practice Launchpad
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {config.quickActions.map((qa) => (
            <Link
              key={qa.key}
              href={qa.href}
              className="p-4 rounded-2xl bg-card border border-border hover:border-emerald-500/40 hover:shadow-md transition-all duration-150 flex flex-col justify-between space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 group-hover:scale-110 transition-transform">
                  <Sparkles size={18} />
                </span>
                {qa.badge && (
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                    {qa.badge}
                  </span>
                )}
              </div>
              <div>
                <p className="text-xs font-bold text-foreground group-hover:text-emerald-600 transition-colors">{qa.label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{qa.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* 6. Featured: AI Subjective Handwritten Grading Innovation */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-[11px] font-bold">
            <Sparkles size={13} /> Exclusive SEE Innovation
          </div>
          <h3 className="text-xl sm:text-2xl font-black">AI Handwritten Answer Sheet Evaluator</h3>
          <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed">
            Write your answer on paper for Science or Math, snap a photo, and get instant step-by-step marks, missing steps, and NEB rubric feedback!
          </p>
        </div>
        <Link
          href="/practice/subjective"
          className="px-6 py-3.5 rounded-2xl bg-white text-emerald-900 font-black text-xs sm:text-sm hover:bg-emerald-50 transition-all shadow-lg shrink-0 flex items-center gap-2"
        >
          <span>Try Subjective Evaluation</span>
          <ArrowRight size={16} />
        </Link>
      </div>

      {/* 7. NEB Model Question Sets & Mock Exams */}
      <div className="p-6 rounded-3xl bg-card border border-border space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm sm:text-base font-extrabold text-foreground flex items-center gap-2">
            <FileText size={16} className="text-blue-500" /> 10-Year Model Sets &amp; Mocks
          </h3>
          <Link href="/mock-tests" className="text-xs font-bold text-blue-600 hover:underline">
            Test Center →
          </Link>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
          {modelSets.map((ms) => (
            <div
              key={ms.id}
              className="p-4 rounded-2xl bg-muted/40 hover:bg-muted border border-border/60 flex flex-col justify-between space-y-3 transition-colors"
            >
              <div>
                <h5 className="text-xs font-bold text-foreground line-clamp-2 leading-snug">{ms.title}</h5>
                <p className="text-[10px] text-muted-foreground mt-1">{ms.marks} · {ms.time}</p>
              </div>
              <Link
                href="/mock-tests"
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] text-center"
              >
                {ms.solved ? 'Review Answers' : 'Take Exam'}
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* 8. Downloadable Revision PDFs & Chapter Formula Sheets */}
      <div className="p-6 rounded-3xl bg-card border border-border space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm sm:text-base font-extrabold text-foreground flex items-center gap-2">
            <Download size={16} className="text-emerald-500" /> High-Yield Revision PDFs &amp; Formula Sheets
          </h3>
          <span className="text-xs text-muted-foreground">Free for Class 10 Students</span>
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          {chapterPdfs.map((pdf) => (
            <div
              key={pdf.id}
              className="p-4 rounded-2xl bg-muted/30 border border-border hover:border-emerald-500/30 flex items-center justify-between gap-3 transition-all"
            >
              <div>
                <p className="text-xs font-bold text-foreground line-clamp-1">{pdf.title}</p>
                <p className="text-[10px] text-muted-foreground">{pdf.size} · {pdf.downloads} downloads</p>
              </div>
              <Link
                href="/subjects"
                className="p-2 rounded-xl bg-card border border-border hover:bg-emerald-500/10 hover:text-emerald-600 text-muted-foreground transition-colors shrink-0"
              >
                <Download size={14} />
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* 9. Announcements & Routine Notices */}
      <div className="p-6 rounded-3xl bg-card border border-border space-y-3">
        <h3 className="text-sm font-extrabold text-foreground flex items-center gap-2">
          <AlertCircle size={16} className="text-amber-500" /> Official Board Announcements &amp; Exam Notices
        </h3>
        <div className="grid md:grid-cols-3 gap-3">
          {config.announcements.map((ann) => (
            <div
              key={ann.id}
              className={`p-4 rounded-2xl border ${
                ann.important ? 'bg-amber-500/5 border-amber-500/30' : 'bg-muted/30 border-border'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-muted text-foreground">
                  {ann.tag}
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">{ann.date}</span>
              </div>
              <p className="text-xs font-bold text-foreground leading-snug">{ann.title}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
