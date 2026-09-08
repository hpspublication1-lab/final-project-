'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  Target,
  Award,
  CheckCircle2,
  Flame,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Calendar,
  Sparkles,
  Zap,
  BarChart3
} from 'lucide-react';

interface SubjectProgress {
  id: string;
  name: string;
  icon: string;
  gpaTarget: string;
  completionRate: number;
  totalChapters: number;
  completedChapters: number;
  accuracy: number;
  weakTopics: string[];
}

const SEE_PROGRESS_DATA: SubjectProgress[] = [
  {
    id: 'science',
    name: 'Compulsory Science & Tech',
    icon: '🔬',
    gpaTarget: 'A+ (3.6 - 4.0)',
    completionRate: 78,
    totalChapters: 24,
    completedChapters: 19,
    accuracy: 86,
    weakTopics: ['Mendelian Dihybrid Cross', 'Extraction of Iron Chemical Steps'],
  },
  {
    id: 'math',
    name: 'Compulsory Mathematics',
    icon: '📐',
    gpaTarget: 'A+ (3.6 - 4.0)',
    completionRate: 85,
    totalChapters: 20,
    completedChapters: 17,
    accuracy: 91,
    weakTopics: ['Circle Cyclic Quad Theorems (Group D)', 'Combined Solid Mensuration'],
  },
  {
    id: 'opt_math',
    name: 'Optional Mathematics',
    icon: '📊',
    gpaTarget: 'A+ (3.6 - 4.0)',
    completionRate: 68,
    totalChapters: 16,
    completedChapters: 11,
    accuracy: 79,
    weakTopics: ['Conditional Trigonometry Identities', 'Vector Coordinate Geometry Proofs'],
  },
  {
    id: 'english',
    name: 'English Language',
    icon: '📚',
    gpaTarget: 'A+ (3.6 - 4.0)',
    completionRate: 82,
    totalChapters: 15,
    completedChapters: 12,
    accuracy: 88,
    weakTopics: ['Reported Speech Exceptions', 'Formal CV/Resume Formatting'],
  },
  {
    id: 'nepali',
    name: 'Nepali (नेपाली)',
    icon: '🇳🇵',
    gpaTarget: 'A+ (3.6 - 4.0)',
    completionRate: 74,
    totalChapters: 16,
    completedChapters: 12,
    accuracy: 84,
    weakTopics: ['वाच्य रूपान्तरण (कर्मवाच्य र भाववाच्य)', 'विवेचनात्मक समीक्षा लेखन'],
  },
  {
    id: 'social',
    name: 'Social Studies & Life Skills',
    icon: '🌍',
    gpaTarget: 'A+ (3.6 - 4.0)',
    completionRate: 72,
    totalChapters: 18,
    completedChapters: 13,
    accuracy: 82,
    weakTopics: ['Nepal Map Drawing Scale & Symbols', 'Organs of United Nations (UN)'],
  },
];

export default function SeeProgressTrackerTab() {
  const [targetGpa, setTargetGpa] = useState<string>('4.0 GPA (A+)');

  // Overall calculations
  const totalCompletion = Math.round(
    SEE_PROGRESS_DATA.reduce((acc, curr) => acc + curr.completionRate, 0) / SEE_PROGRESS_DATA.length
  );
  const avgAccuracy = Math.round(
    SEE_PROGRESS_DATA.reduce((acc, curr) => acc + curr.accuracy, 0) / SEE_PROGRESS_DATA.length
  );

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner: GPA 4.0 Master Dashboard */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 border border-emerald-500/30 text-white shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black border border-emerald-500/30">
              <Target size={14} className="text-emerald-400 animate-pulse" /> TARGET: 4.00 GPA (A+ GRADE)
            </div>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
              Samyak SEE 2082 Progress &amp; Mastery Tracker
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed">
              Real-time syllabus completion analytics across all 6 core subjects, diagnostic accuracy rates, and AI-identified weak chapter alerts.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 shrink-0 w-full lg:w-auto">
            <div className="p-4 rounded-2xl bg-white/10 border border-white/15 text-center">
              <div className="text-2xl sm:text-3xl font-black text-emerald-400">{totalCompletion}%</div>
              <div className="text-[10px] font-bold uppercase text-slate-300">Syllabus Done</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/10 border border-white/15 text-center">
              <div className="text-2xl sm:text-3xl font-black text-amber-400">{avgAccuracy}%</div>
              <div className="text-[10px] font-bold uppercase text-slate-300">Accuracy</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/10 border border-white/15 text-center">
              <div className="text-2xl sm:text-3xl font-black text-red-400 flex items-center justify-center gap-1">
                <Flame size={20} className="fill-current" /> 14
              </div>
              <div className="text-[10px] font-bold uppercase text-slate-300">Day Streak</div>
            </div>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="mt-6 pt-6 border-t border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <span>Overall Class 10 Syllabus Readiness</span>
            <span className="text-emerald-400">{totalCompletion}% Completed</span>
          </div>
          <div className="h-3 w-full rounded-full bg-black/40 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-1000"
              style={{ width: `${totalCompletion}%` }}
            />
          </div>
        </div>
      </div>

      {/* Weak Topic Alerts Panel */}
      <div className="p-6 rounded-3xl bg-amber-500/10 border border-amber-500/30 space-y-3">
        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 text-xs font-black uppercase tracking-wider">
          <AlertTriangle size={16} />
          <span>AI Weak Area Diagnosis (Focus Here to Boost from A to A+)</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Based on recent mock test and question bank performance, these chapters have lower accuracy:
        </p>

        <div className="grid sm:grid-cols-3 gap-3 pt-1">
          <div className="p-3 rounded-2xl bg-card border border-border space-y-1">
            <div className="text-xs font-black text-foreground">Science: Genetics &amp; Dihybrid Cross</div>
            <div className="text-[11px] text-muted-foreground">Current Accuracy: 62%</div>
            <Link href="/see/question-bank" className="text-[11px] font-bold text-primary hover:underline block pt-1">
              Practice 10 Questions →
            </Link>
          </div>
          <div className="p-3 rounded-2xl bg-card border border-border space-y-1">
            <div className="text-xs font-black text-foreground">Comp Math: Circle Geometry Proofs</div>
            <div className="text-[11px] text-muted-foreground">Current Accuracy: 68%</div>
            <Link href="/see/question-bank" className="text-[11px] font-bold text-primary hover:underline block pt-1">
              Practice 4-Mark Proofs →
            </Link>
          </div>
          <div className="p-3 rounded-2xl bg-card border border-border space-y-1">
            <div className="text-xs font-black text-foreground">Opt Math: Conditional Trigonometry</div>
            <div className="text-[11px] text-muted-foreground">Current Accuracy: 59%</div>
            <Link href="/see/question-bank" className="text-[11px] font-bold text-primary hover:underline block pt-1">
              Practice Derivations →
            </Link>
          </div>
        </div>
      </div>

      {/* Subject-Wise Mastery Cards */}
      <div className="space-y-4">
        <h3 className="text-lg font-black text-foreground flex items-center gap-2">
          <BarChart3 size={20} className="text-primary" />
          <span>Subject-by-Subject Syllabus Breakdown</span>
        </h3>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SEE_PROGRESS_DATA.map((sub) => (
            <div
              key={sub.id}
              className="p-6 rounded-3xl bg-card border border-border shadow-sm space-y-4 hover:border-border/80 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{sub.icon}</span>
                    <div>
                      <h4 className="text-sm font-black text-foreground">{sub.name}</h4>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                        Target: {sub.gpaTarget}
                      </span>
                    </div>
                  </div>
                  <span className="text-base font-black text-foreground font-mono">
                    {sub.completionRate}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${sub.completionRate}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                  <span>{sub.completedChapters} / {sub.totalChapters} Chapters</span>
                  <span className="font-bold text-foreground">Accuracy: {sub.accuracy}%</span>
                </div>

                {/* Weak topic badge */}
                <div className="pt-2 border-t border-border/60 text-[11px] text-muted-foreground space-y-1">
                  <span className="font-bold text-foreground block">Key Revisions Needed:</span>
                  {sub.weakTopics.map((wt, i) => (
                    <div key={i} className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      <span>{wt}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Link
                href={`/see/subject/${sub.id}`}
                className="w-full py-2.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-bold text-xs text-center transition-colors block mt-2"
              >
                Open {sub.name} Workspace →
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
