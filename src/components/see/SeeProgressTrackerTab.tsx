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

interface ChapterDiagnostic {
  subjectId: string;
  chapter: string;
  status: 'strong' | 'improving' | 'weak';
  accuracy: number;
  questionsSolved: number;
  reason: string;
  actionUrl: string;
}

const CHAPTER_DIAGNOSTICS: ChapterDiagnostic[] = [
  // Science
  {
    subjectId: 'science',
    chapter: 'Force & Gravitation',
    status: 'strong',
    accuracy: 92,
    questionsSolved: 48,
    reason: 'Excellent retention of Newton’s formula, g-variations, and free fall numericals.',
    actionUrl: '/see/question-bank?subject=science&chapter=Force%20%26%20Gravitation',
  },
  {
    subjectId: 'science',
    chapter: 'Pressure & Hydraulics',
    status: 'improving',
    accuracy: 74,
    questionsSolved: 32,
    reason: 'Good grasp on Pascal’s law, but occasional sign errors in Archimedes upthrust questions.',
    actionUrl: '/see/question-bank?subject=science&chapter=Pressure',
  },
  {
    subjectId: 'science',
    chapter: 'Genetics & Heredity',
    status: 'weak',
    accuracy: 54,
    questionsSolved: 20,
    reason: 'Confusions in Mendelian 9:3:3:1 dihybrid Punnett square ratios & phenotype vs genotype definitions.',
    actionUrl: '/see/question-bank?subject=science&chapter=Genetics',
  },
  {
    subjectId: 'science',
    chapter: 'Chemical Reactions & Periodic Table',
    status: 'improving',
    accuracy: 71,
    questionsSolved: 28,
    reason: 'Balancing displacement equations requires practice with oxidation states.',
    actionUrl: '/see/question-bank?subject=science&chapter=Chemical%20Reactions',
  },
  {
    subjectId: 'science',
    chapter: 'Metals & Metallurgy (Iron Extraction)',
    status: 'weak',
    accuracy: 48,
    questionsSolved: 16,
    reason: 'Missing chemical equations at different temperature zones of the blast furnace.',
    actionUrl: '/see/question-bank?subject=science&chapter=Metals',
  },

  // Comp Math
  {
    subjectId: 'math',
    chapter: 'Compound Interest & Depreciation',
    status: 'strong',
    accuracy: 94,
    questionsSolved: 50,
    reason: 'Formula substitution (semi-annual & annual compounding) mastered with high speed.',
    actionUrl: '/see/question-bank?subject=math&chapter=Compound%20Interest',
  },
  {
    subjectId: 'math',
    chapter: 'Circle Geometry Theorems',
    status: 'weak',
    accuracy: 56,
    questionsSolved: 24,
    reason: 'Struggles with auxiliary construction lines in cyclic quadrilateral 4-mark theoretical proofs.',
    actionUrl: '/see/question-bank?subject=math&chapter=Circle%20Theorems',
  },
  {
    subjectId: 'math',
    chapter: 'Mensuration of Combined Solids',
    status: 'improving',
    accuracy: 69,
    questionsSolved: 35,
    reason: 'Good on cylinder-cone volume, but occasional formula mixing on curved surface areas.',
    actionUrl: '/see/question-bank?subject=math&chapter=Mensuration',
  },

  // Opt Math
  {
    subjectId: 'opt_math',
    chapter: 'Trigonometric Transformations & Compound Angles',
    status: 'improving',
    accuracy: 72,
    questionsSolved: 40,
    reason: 'Good algebraic manipulation, but needs speed on multi-step identities.',
    actionUrl: '/see/question-bank?subject=opt_math&chapter=Trigonometry',
  },
  {
    subjectId: 'opt_math',
    chapter: 'Conditional Trigonometric Identities (Group D)',
    status: 'weak',
    accuracy: 51,
    questionsSolved: 18,
    reason: 'High dropout on A+B+C=π identity substitutions in 5-mark long questions.',
    actionUrl: '/see/question-bank?subject=opt_math&chapter=Conditional%20Trig',
  },
  {
    subjectId: 'opt_math',
    chapter: 'Matrices & Determinants',
    status: 'strong',
    accuracy: 90,
    questionsSolved: 36,
    reason: 'Cramer’s rule and Inverse Matrix solutions solved with 100% computational accuracy.',
    actionUrl: '/see/question-bank?subject=opt_math&chapter=Matrices',
  },

  // English
  {
    subjectId: 'english',
    chapter: 'Grammar: Indirect Speech & Passive Voice',
    status: 'improving',
    accuracy: 78,
    questionsSolved: 45,
    reason: 'Tense backshifts are correct, but reporting verbs with modal auxiliaries need caution.',
    actionUrl: '/see/question-bank?subject=english&chapter=Grammar',
  },
  {
    subjectId: 'english',
    chapter: 'Writing: Job Application & Resume',
    status: 'weak',
    accuracy: 58,
    questionsSolved: 12,
    reason: 'Salutation, cover letter formatting, and formal sign-offs do not match CDC marking rubric.',
    actionUrl: '/see/question-bank?subject=english&chapter=Job%20Application',
  },

  // Nepali
  {
    subjectId: 'nepali',
    chapter: 'व्याकरण: वाच्य रूपान्तरण (कर्तृ, कर्म, भाव)',
    status: 'weak',
    accuracy: 55,
    questionsSolved: 22,
    reason: 'अकर्मक धातुहरूमा भाववाच्य बनाउँदा द्वारा/बाट प्रयोगमा दोहोरो गल्ती भेटियो।',
    actionUrl: '/see/question-bank?subject=nepali&chapter=वाच्य',
  },
  {
    subjectId: 'nepali',
    chapter: 'निबन्ध तथा मनोवाद लेखन',
    status: 'strong',
    accuracy: 88,
    questionsSolved: 15,
    reason: 'विषयवस्तुको प्रस्तुति, अनुच्छेद विभाजन र निष्कर्ष लेखन उत्कृष्ट।',
    actionUrl: '/see/question-bank?subject=nepali&chapter=निबन्ध',
  },

  // Social Studies
  {
    subjectId: 'social',
    chapter: 'Nepal Map Drawing & Location Marking',
    status: 'weak',
    accuracy: 52,
    questionsSolved: 14,
    reason: 'Scale ratio inaccuracy and incorrect symbol placement for national parks & heritage sites.',
    actionUrl: '/see/question-bank?subject=social&chapter=Map%20Work',
  },
  {
    subjectId: 'social',
    chapter: 'Our Constitution & Good Governance',
    status: 'strong',
    accuracy: 86,
    questionsSolved: 30,
    reason: 'Clear understanding of Fundamental Rights (Articles 16-46) and constitutional bodies.',
    actionUrl: '/see/question-bank?subject=social&chapter=Constitution',
  },
];

export default function SeeProgressTrackerTab() {
  const [targetGpa, setTargetGpa] = useState<string>('4.0 GPA (A+)');
  const [selectedDiagnosticSubject, setSelectedDiagnosticSubject] = useState<string>('all');
  const [selectedDiagnosticStatus, setSelectedDiagnosticStatus] = useState<'all' | 'weak' | 'improving' | 'strong'>('all');

  // Overall calculations
  const totalCompletion = Math.round(
    SEE_PROGRESS_DATA.reduce((acc, curr) => acc + curr.completionRate, 0) / SEE_PROGRESS_DATA.length
  );
  const avgAccuracy = Math.round(
    SEE_PROGRESS_DATA.reduce((acc, curr) => acc + curr.accuracy, 0) / SEE_PROGRESS_DATA.length
  );

  const filteredDiagnostics = CHAPTER_DIAGNOSTICS.filter((c) => {
    if (selectedDiagnosticSubject !== 'all' && c.subjectId !== selectedDiagnosticSubject) return false;
    if (selectedDiagnosticStatus !== 'all' && c.status !== selectedDiagnosticStatus) return false;
    return true;
  });

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

      {/* ── CHAPTER-LEVEL HEALTH CHECK & REMEDIAL ACTIONS (Prompt 9) ── */}
      <div className="space-y-4 pt-4 border-t border-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-black text-foreground flex items-center gap-2">
              <Target size={20} className="text-emerald-500" />
              <span>Chapter Mastery Diagnostic &amp; Remedial Engine</span>
            </h3>
            <p className="text-xs text-muted-foreground">
              Chapters classified by accuracy &amp; exam readiness. Focus on red areas with &quot;Improve Now&quot; to reach 4.0 GPA.
            </p>
          </div>

          {/* Status Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-card border border-border self-start">
            {[
              { id: 'all', label: 'All' },
              { id: 'weak', label: '🔴 Weak' },
              { id: 'improving', label: '🟡 Improving' },
              { id: 'strong', label: '🟢 Strong' },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setSelectedDiagnosticStatus(st.id as any)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedDiagnosticStatus === st.id
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* Subject Selector Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setSelectedDiagnosticSubject('all')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors cursor-pointer ${
              selectedDiagnosticSubject === 'all'
                ? 'bg-secondary text-foreground border border-primary/30'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            All Subjects
          </button>
          {SEE_PROGRESS_DATA.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedDiagnosticSubject(s.id)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
                selectedDiagnosticSubject === s.id
                  ? 'bg-secondary text-foreground border border-primary/30'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              <span>{s.icon}</span>
              <span>{s.name}</span>
            </button>
          ))}
        </div>

        {/* Classified Chapters Grid */}
        <div className="grid md:grid-cols-2 gap-4">
          {filteredDiagnostics.map((c, idx) => {
            const statusConfig = {
              strong: {
                label: 'STRONG MASTERY',
                badgeBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
                dot: 'bg-emerald-500',
                actionLabel: 'Revise Key Derivations →',
              },
              improving: {
                label: 'IMPROVING',
                badgeBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
                dot: 'bg-amber-500',
                actionLabel: 'Solve 10 More MCQs →',
              },
              weak: {
                label: 'WEAK AREA',
                badgeBg: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30',
                dot: 'bg-red-500',
                actionLabel: 'IMPROVE NOW →',
              },
            }[c.status];

            return (
              <div
                key={`${c.subjectId}-${c.chapter}-${idx}`}
                className={`p-5 rounded-3xl bg-card border shadow-xs flex flex-col justify-between gap-4 transition-all ${
                  c.status === 'weak'
                    ? 'border-red-500/30 hover:border-red-500/60'
                    : 'border-border/80 hover:border-border'
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider font-mono">
                      {c.subjectId.toUpperCase()}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border font-mono ${statusConfig.badgeBg}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                      <span>{statusConfig.label}</span>
                    </span>
                  </div>

                  <h4 className="text-sm font-black text-foreground">{c.chapter}</h4>

                  <div className="p-3 rounded-2xl bg-muted/50 border border-border/50 text-xs text-muted-foreground leading-relaxed">
                    <span className="font-bold text-foreground block mb-0.5">Diagnostic Reason:</span>
                    <span>{c.reason}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/60">
                  <div className="text-xs text-muted-foreground">
                    <span className="font-bold text-foreground">{c.accuracy}% Accuracy</span>
                    <span className="mx-1.5">·</span>
                    <span>{c.questionsSolved} Qs Solved</span>
                  </div>

                  <Link
                    href={c.actionUrl}
                    className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-xs ${
                      c.status === 'weak'
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-primary hover:bg-primary/90 text-white'
                    }`}
                  >
                    <span>{statusConfig.actionLabel}</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
