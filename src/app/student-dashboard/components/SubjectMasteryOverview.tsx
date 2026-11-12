'use client';

import React from 'react';
import Link from 'next/link';
import {
  Dna,
  FlaskConical,
  Atom,
  Brain,
  Zap,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  BarChart2,
} from 'lucide-react';

interface SubjectOverviewItem {
  id: string;
  name: string;
  weightageMarks: number;
  weightagePct: number;
  accuracy: number;
  masteredChapters: number;
  totalChapters: number;
  weakestTopic: string;
  color: string;
  badgeClass: string;
  borderClass: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  practiceHref: string;
}

const CEE_SUBJECTS: SubjectOverviewItem[] = [
  {
    id: 'biology',
    name: 'Biology (Zoology & Botany)',
    weightageMarks: 80,
    weightagePct: 40,
    accuracy: 82.5,
    masteredChapters: 24,
    totalChapters: 30,
    weakestTopic: 'Genetics & Mendelian Inheritance',
    color: 'text-emerald-600 dark:text-emerald-400',
    badgeClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
    borderClass: 'hover:border-emerald-500/40',
    icon: Dna,
    practiceHref: '/practice?subject=Biology&count=25',
  },
  {
    id: 'chemistry',
    name: 'Chemistry (Physical, Organic & Inorganic)',
    weightageMarks: 50,
    weightagePct: 25,
    accuracy: 74.0,
    masteredChapters: 16,
    totalChapters: 22,
    weakestTopic: 'Chemical Bonding & Hybridization',
    color: 'text-blue-600 dark:text-blue-400',
    badgeClass: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20',
    borderClass: 'hover:border-blue-500/40',
    icon: FlaskConical,
    practiceHref: '/practice?subject=Chemistry&count=25',
  },
  {
    id: 'physics',
    name: 'Physics (Mechanics, Waves, Modern, Electro)',
    weightageMarks: 50,
    weightagePct: 25,
    accuracy: 68.2,
    masteredChapters: 14,
    totalChapters: 25,
    weakestTopic: "Newton's Laws & Rotational Dynamics",
    color: 'text-amber-600 dark:text-amber-400',
    badgeClass: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
    borderClass: 'hover:border-amber-500/40',
    icon: Atom,
    practiceHref: '/practice?subject=Physics&count=25',
  },
  {
    id: 'mat',
    name: 'Mental Agility Test (MAT)',
    weightageMarks: 20,
    weightagePct: 10,
    accuracy: 88.0,
    masteredChapters: 7,
    totalChapters: 8,
    weakestTopic: 'Syllogisms & Direction Sense',
    color: 'text-purple-600 dark:text-purple-400',
    badgeClass: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20',
    borderClass: 'hover:border-purple-500/40',
    icon: Brain,
    practiceHref: '/practice?subject=Mental%20Agility&count=20',
  },
];

export default function SubjectMasteryOverview() {
  return (
    <div className="bg-card border border-border/80 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
            <BarChart2 size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-foreground">
                Official CEE Subject Mastery &amp; Weightage Breakdown
              </h3>
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                200 Marks Total
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Live curriculum progress calibrated to Medical Education Commission (MEC) examination syllabus.
            </p>
          </div>
        </div>

        <Link
          href="/subjects"
          className="text-xs font-bold text-primary hover:underline flex items-center gap-1 self-start sm:self-auto"
        >
          <span>All Syllabus Chapters</span>
          <ChevronRight size={13} />
        </Link>
      </div>

      {/* Grid of 4 Subjects */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CEE_SUBJECTS.map((sub) => {
          const Icon = sub.icon;
          const completionPct = Math.round((sub.masteredChapters / sub.totalChapters) * 100);

          return (
            <div
              key={sub.id}
              className={`p-5 rounded-2xl bg-muted/20 border border-border/80 ${sub.borderClass} transition-all flex flex-col justify-between space-y-4 shadow-xs`}
            >
              {/* Top row */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center shrink-0 ${sub.color}`}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground leading-snug">
                      {sub.name}
                    </h4>
                    <span className="text-[11px] font-mono text-muted-foreground">
                      {sub.weightageMarks} Marks ({sub.weightagePct}% Weightage)
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-lg font-black font-mono text-foreground tabular-nums block">
                    {sub.accuracy.toFixed(1)}%
                  </span>
                  <span className="text-[10px] text-muted-foreground font-medium">
                    Accuracy Rate
                  </span>
                </div>
              </div>

              {/* Progress Bars */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-[11px] text-muted-foreground">
                    Chapter Mastery: <strong className="text-foreground font-mono">{sub.masteredChapters}/{sub.totalChapters}</strong>
                  </span>
                  <span className="text-[11px] font-mono font-bold text-foreground">
                    {completionPct}% Complete
                  </span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      sub.id === 'biology'
                        ? 'bg-emerald-500'
                        : sub.id === 'chemistry'
                        ? 'bg-blue-500'
                        : sub.id === 'physics'
                        ? 'bg-amber-500'
                        : 'bg-purple-500'
                    }`}
                    style={{ width: `${completionPct}%` }}
                  />
                </div>
              </div>

              {/* Weakest topic drill action */}
              <div className="pt-2 border-t border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                    Urgent Focus Area:
                  </span>
                  <p className="text-xs font-semibold text-foreground truncate" title={sub.weakestTopic}>
                    {sub.weakestTopic}
                  </p>
                </div>

                <Link
                  href={sub.practiceHref}
                  className="px-3.5 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold transition-all flex items-center justify-center gap-1 shrink-0 self-start sm:self-auto"
                >
                  <Zap size={12} />
                  <span>Drill MCQs</span>
                  <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
