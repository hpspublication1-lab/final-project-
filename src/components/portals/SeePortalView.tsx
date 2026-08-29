'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import CoursePortalHeader from './CoursePortalHeader';
import { COURSE_PORTAL_CONFIGS } from '@/lib/config/courseFeatures';
import {
  BookOpen,
  Sparkles,
  ArrowRight,
  FileText,
  Target,
  Play,
  Download,
  AlertCircle,
  TrendingUp,
  Zap,
} from 'lucide-react';

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
      { slug: 'physics', name: 'Science & Environment', totalLessons: 24, completedLessons: 19, percentage: 80 },
      { slug: 'math', name: 'Compulsory Mathematics', totalLessons: 20, completedLessons: 10, percentage: 50 },
      { slug: 'opt_math', name: 'Optional Mathematics', totalLessons: 16, completedLessons: 10, percentage: 65 },
      { slug: 'english', name: 'English Language', totalLessons: 15, completedLessons: 11, percentage: 75 },
      { slug: 'nepali', name: 'Nepali (नेपाली)', totalLessons: 16, completedLessons: 14, percentage: 85 },
      { slug: 'social', name: 'Social Studies', totalLessons: 18, completedLessons: 13, percentage: 70 },
    ],
    lastWatchedLesson: {
      id: 'default-see-1',
      title: 'Force and Gravity: Universal Law of Gravitation & Derivation',
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
      } catch (err) {
        console.warn('Failed to load SEE dashboard stats:', err);
      } finally {
        setStatsLoading(false);
      }
    }
    loadStats();
  }, [isEnrolled]);

  const modelSets = [
    { id: 'ms-1', title: 'SEE Science Compulsory Model Question Set 2082', marks: '75 Marks', time: '2:15 Hours', solved: true },
    { id: 'ms-2', title: 'Compulsory Mathematics Board Standard Set A', marks: '100 Marks', time: '3:00 Hours', solved: false },
    { id: 'ms-3', title: 'SEE English Reading & Guided Writing Model Set', marks: '100 Marks', time: '3:00 Hours', solved: false },
    { id: 'ms-4', title: 'Optional Math Trigonometry & Vectors Past Sets', marks: '100 Marks', time: '3:00 Hours', solved: false },
  ];

  const chapterPdfs = [
    { id: 'pdf-1', title: 'Science Class 10 All Formulas & Important Reaction Sheet', size: '2.4 MB', downloads: '14.2k' },
    { id: 'pdf-2', title: 'Compulsory Math Theorem Proofs & Geometric Constructions', size: '3.8 MB', downloads: '18.9k' },
    { id: 'pdf-3', title: 'SEE English Essay, Letter & Story Ready Templates', size: '1.9 MB', downloads: '9.4k' },
  ];

  const formatSecToMin = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const lastLesson = dashboardStats.lastWatchedLesson;

  return (
    <div className="space-y-6">
      <CoursePortalHeader
        displayName={displayName}
        isEnrolled={dashboardStats.isEnrolled}
        isPro={isPro}
        onOpenCourseSelector={onOpenCourseSelector}
      />

      {/* 2. Compact Continue Learning Card */}
      <div className="p-5 rounded-3xl card-luxury shadow-luxury flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-mono">
              Continue Learning
            </span>
            <span className="text-xs text-muted-foreground font-semibold">
              Resume from {lastLesson?.watchedSeconds ? formatSecToMin(lastLesson.watchedSeconds) : '0:00'}
            </span>
          </div>
          <h2 className="text-sm sm:text-base font-black text-foreground">
            {lastLesson?.title || 'Science: Force & Gravity — Universal Gravitation'}
          </h2>
          <div className="flex items-center gap-3">
            <div className="w-36 sm:w-48 h-2.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(10, lastLesson?.percentage || 52)}%` }}
              />
            </div>
            <span className="text-xs font-bold text-emerald-600 font-mono">
              {lastLesson?.percentage ? `${lastLesson.percentage}%` : '52%'} Done
            </span>
          </div>
        </div>

        <Link
          href={lastLesson?.id ? `/see/lessons/${lastLesson.id}` : '/subjects'}
          className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all shrink-0 active:scale-95"
        >
          <Play size={15} />
          <span>Resume Lesson</span>
        </Link>
      </div>

      {/* 3. Main 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Curriculum & Practice (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Quick Actions Launchpad */}
          <div>
            <h3 className="text-sm font-extrabold text-foreground mb-3 flex items-center gap-2">
              <Sparkles size={16} className="text-emerald-500" /> Class 10 Learning &amp; Practice Launchpad
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {config.quickActions.map((qa) => (
                <Link
                  key={qa.key}
                  href={qa.href}
                  className="p-4 rounded-2xl card-luxury hover:border-emerald-500/50 hover:shadow-luxury transition-all flex flex-col justify-between space-y-2 group shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 group-hover:scale-110 transition-transform">
                      <Zap size={16} />
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

          {/* Key Metric Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-card border border-border shadow-xs space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Progress</span>
                <TrendingUp size={14} className="text-emerald-500" />
              </div>
              <p className="text-xl font-black text-foreground">{dashboardStats.overallPercentage}%</p>
              <p className="text-[10px] text-emerald-600 font-semibold">{dashboardStats.completedLessons} / {dashboardStats.totalLessons} Lessons</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-card border border-border shadow-xs space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Target GPA</span>
                <Target size={14} className="text-blue-500" />
              </div>
              <p className="text-xl font-black text-foreground">4.0 GPA</p>
              <p className="text-[10px] text-blue-600 font-semibold">High Distinction Target</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-card border border-border shadow-xs space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Model Sets</span>
                <FileText size={14} className="text-purple-500" />
              </div>
              <p className="text-xl font-black text-foreground">36 Sets</p>
              <p className="text-[10px] text-purple-600 font-semibold">NEB 10-Year Solved</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-card border border-border shadow-xs space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Subjective AI</span>
                <Sparkles size={14} className="text-amber-500" />
              </div>
              <p className="text-xl font-black text-foreground">89 / 100</p>
              <p className="text-[10px] text-amber-600 font-semibold">Handwritten Score</p>
            </div>
          </div>

          {/* Subject-by-Subject Syllabus Progress */}
          <div className="p-5 rounded-2xl bg-card border border-border space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-foreground flex items-center gap-2">
                  <BookOpen size={16} className="text-emerald-500" /> Grade 10 Subject Progress
                </h3>
                <p className="text-[11px] text-muted-foreground">Syllabus completion percentage across core board subjects.</p>
              </div>
              <Link href="/subjects" className="text-xs font-bold text-emerald-600 hover:underline">
                All Subjects →
              </Link>
            </div>

            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
              {dashboardStats.subjectStats.map((sub) => (
                <div
                  key={sub.slug}
                  className="p-3 rounded-xl bg-muted/40 border border-border/80 space-y-2 hover:border-emerald-500/40 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">{sub.name}</span>
                    <span className="text-xs font-extrabold text-emerald-600">{sub.percentage}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                      style={{ width: `${sub.percentage}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>{sub.completedLessons} / {sub.totalLessons} Lessons</span>
                    <Link href="/subjects" className="font-bold text-emerald-600 hover:underline">
                      Study →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Subjective Evaluator Innovation Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold">
                <Sparkles size={12} /> Exclusive Innovation
              </div>
              <h3 className="text-base sm:text-lg font-black">AI Handwritten Answer Sheet Evaluator</h3>
              <p className="text-xs text-emerald-100 leading-relaxed">
                Snap a photo of your handwritten paper for Science or Math to get instant step-by-step marks, missing proofs, and NEB rubric feedback.
              </p>
            </div>
            <Link
              href="/practice/subjective"
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white text-emerald-900 font-black text-xs hover:bg-emerald-50 transition-all shadow-sm shrink-0 flex items-center justify-center gap-2"
            >
              <span>Try Marker</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* NEB Model Question Sets */}
          <div className="p-5 rounded-2xl bg-card border border-border space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-foreground flex items-center gap-2">
                <FileText size={16} className="text-blue-500" /> 10-Year Model Sets &amp; Mocks
              </h3>
              <Link href="/mock-tests" className="text-xs font-bold text-blue-600 hover:underline">
                Test Center →
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
              {modelSets.map((ms) => (
                <div
                  key={ms.id}
                  className="p-3 rounded-xl bg-muted/40 hover:bg-muted border border-border/60 flex flex-col justify-between space-y-2.5 transition-colors"
                >
                  <div>
                    <h5 className="text-xs font-bold text-foreground line-clamp-2 leading-snug">{ms.title}</h5>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{ms.marks} · {ms.time}</p>
                  </div>
                  <Link
                    href="/mock-tests"
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] text-center transition-colors"
                  >
                    {ms.solved ? 'Review Answers' : 'Take Exam'}
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Revision PDFs & Formula Sheets */}
          <div className="p-5 rounded-2xl bg-card border border-border space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-foreground flex items-center gap-2">
                <Download size={16} className="text-emerald-500" /> High-Yield Revision PDFs &amp; Formulas
              </h3>
              <span className="text-[11px] text-muted-foreground">Free for Students</span>
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              {chapterPdfs.map((pdf) => (
                <div
                  key={pdf.id}
                  className="p-3 rounded-xl bg-muted/30 border border-border hover:border-emerald-500/30 flex items-center justify-between gap-2 transition-all"
                >
                  <div>
                    <p className="text-xs font-bold text-foreground line-clamp-1">{pdf.title}</p>
                    <p className="text-[10px] text-muted-foreground">{pdf.size} · {pdf.downloads}</p>
                  </div>
                  <Link
                    href="/subjects"
                    className="p-1.5 rounded-lg bg-card border border-border hover:bg-emerald-500/10 hover:text-emerald-600 text-muted-foreground transition-colors shrink-0"
                  >
                    <Download size={13} />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Gamification, Analytics & Announcements (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Gamification Widget */}
          <StudentGamificationWidget />

          {/* Analytics Panel */}
          <StudentAnalyticsPanel displayName={displayName} />

          {/* Official Notices */}
          <div className="p-5 rounded-2xl bg-card border border-border space-y-3">
            <h3 className="text-sm font-extrabold text-foreground flex items-center gap-2">
              <AlertCircle size={15} className="text-amber-500" /> Official Board Notices
            </h3>
            <div className="space-y-2.5">
              {config.announcements.map((ann) => (
                <div
                  key={ann.id}
                  className={`p-3 rounded-xl border ${
                    ann.important ? 'bg-amber-500/5 border-amber-500/30' : 'bg-muted/30 border-border'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
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

      </div>
    </div>
  );
}
