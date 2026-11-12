'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Target,
  TrendingUp,
  ArrowUpRight,
  ChevronRight,
  Sparkles,
  Sliders,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  BarChart2,
  Dna,
  FlaskConical,
  Atom,
  Brain,
  Zap,
} from 'lucide-react';
import { motion } from 'framer-motion';
import AccuracyTrendChart from './AccuracyTrendChart';
import WeakTopicsPanel from './WeakTopicsPanel';
import RecentExamsTable from './RecentExamsTable';
import { CanonicalCourseId, COURSES_MAP } from '@/contexts/ProgramContext';

interface AnalyticsBentoCockpitProps {
  track?: CanonicalCourseId;
  score?: number;
  totalMarks?: number;
  scoreDelta?: number;
  accuracy?: number;
  accuracyDelta?: number;
  rankEstimate?: string | number;
  cohortSize?: number;
  percentile?: number;
  streakDays?: number;
  questionsSolved?: number;
  daysToCee?: number;
}

interface MedicalCollegeQuota {
  id: string;
  name: string;
  location: string;
  cutoff: number;
  openSeats: number;
  affiliation: string;
}

const MEDICAL_COLLEGES: MedicalCollegeQuota[] = [
  {
    id: 'iom',
    name: 'Maharajgunj Medical Campus (IOM)',
    location: 'Kathmandu',
    cutoff: 165,
    openSeats: 100,
    affiliation: 'TU',
  },
  {
    id: 'bpkihs',
    name: 'BPKIHS Medical College',
    location: 'Dharan',
    cutoff: 156,
    openSeats: 120,
    affiliation: 'Autonomous',
  },
  {
    id: 'pahs',
    name: 'Patan Academy of Health Sciences (PAHS)',
    location: 'Lalitpur',
    cutoff: 152,
    openSeats: 65,
    affiliation: 'State Univ',
  },
  {
    id: 'kmc',
    name: 'Kathmandu Medical College (KMC)',
    location: 'Sinamangal',
    cutoff: 138,
    openSeats: 150,
    affiliation: 'KU',
  },
];

const CEE_SUBJECTS = [
  {
    id: 'biology',
    name: 'Biology (Zoology & Botany)',
    weightageMarks: 80,
    accuracy: 82.5,
    masteredChapters: 24,
    totalChapters: 30,
    color: 'text-emerald-500',
    barColor: 'from-emerald-500 to-teal-400',
    icon: Dna,
    practiceHref: '/practice?subject=Biology&count=25',
  },
  {
    id: 'chemistry',
    name: 'Chemistry (Physical, Organic, Inorganic)',
    weightageMarks: 50,
    accuracy: 74.0,
    masteredChapters: 16,
    totalChapters: 22,
    color: 'text-blue-500',
    barColor: 'from-blue-500 to-indigo-400',
    icon: FlaskConical,
    practiceHref: '/practice?subject=Chemistry&count=25',
  },
  {
    id: 'physics',
    name: 'Physics (Mechanics, Optics, Modern)',
    weightageMarks: 50,
    accuracy: 68.2,
    masteredChapters: 14,
    totalChapters: 25,
    color: 'text-amber-500',
    barColor: 'from-amber-500 to-orange-400',
    icon: Atom,
    practiceHref: '/practice?subject=Physics&count=25',
  },
  {
    id: 'mat',
    name: 'Mental Agility Test (MAT)',
    weightageMarks: 20,
    accuracy: 88.0,
    masteredChapters: 7,
    totalChapters: 8,
    color: 'text-purple-500',
    barColor: 'from-purple-500 to-pink-400',
    icon: Brain,
    practiceHref: '/practice?subject=Mental%20Agility&count=20',
  },
];

export default function AnalyticsBentoCockpit({
  track = 'cee_medical',
  score = 162,
  totalMarks = 200,
  scoreDelta = 14,
  accuracy = 78.4,
  accuracyDelta = 4.2,
  rankEstimate = '~140',
  cohortSize = 18500,
  percentile = 99.2,
  daysToCee = 38,
}: AnalyticsBentoCockpitProps) {
  const [simulatedScore, setSimulatedScore] = useState<number>(score);
  const [showSimulator, setShowSimulator] = useState<boolean>(false);
  const isCee = track === 'cee_medical';
  const trackMeta = COURSES_MAP[track];

  const activeScore = showSimulator ? simulatedScore : score;
  const scorePct = Math.min(100, Math.round((activeScore / totalMarks) * 100));

  // Circular gauge calculations
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (scorePct / 100) * circumference;

  const getAdmissionStatus = (cutoff: number) => {
    const diff = activeScore - cutoff;
    if (diff >= 3) {
      return {
        label: 'Safe Tier (95%+)',
        color: 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border-emerald-500/25',
        icon: CheckCircle2,
      };
    } else if (diff >= -3) {
      return {
        label: 'Borderline',
        color: 'text-amber-700 dark:text-amber-300 bg-amber-500/10 border-amber-500/25',
        icon: AlertCircle,
      };
    } else {
      return {
        label: `Gap: ${Math.abs(diff)} pts`,
        color: 'text-rose-700 dark:text-rose-300 bg-rose-500/10 border-rose-500/25',
        icon: HelpCircle,
      };
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 320, damping: 28 }}
      className="space-y-6"
    >
      {/* ── BENTO ROW 1: SCORE COCKPIT (8 Cols) + ADMISSION PREDICTOR (4 Cols) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* HERO CARD: PROJECTED CEE SCORE & RADIAL GAUGE (Span 8) */}
        <div className={`${isCee ? 'lg:col-span-8' : 'lg:col-span-12'} bg-gradient-to-br from-indigo-500/[0.08] via-card to-card border border-indigo-500/25 dark:border-indigo-500/30 rounded-2xl sm:rounded-3xl p-6 sm:p-7 shadow-xs relative overflow-hidden flex flex-col justify-between`}>
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

          {/* Top Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
                  <Sparkles size={11} className="text-indigo-500" />
                  <span>{trackMeta.shortName} readiness</span>
                </span>
                <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/60 tabular-nums">
                  {daysToCee} days to exam
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight pt-1">
                Projected Merit Score
              </h2>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="inline-flex items-center gap-1 text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 rounded-xl">
                <ArrowUpRight size={14} />
                <span>+{scoreDelta} pts above cutoff</span>
              </span>
            </div>
          </div>

          {/* Center Gauge + Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 my-6 items-center relative z-10">
            {/* SVG Circular Radial Progress */}
            <div className="sm:col-span-5 flex items-center justify-center">
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 128 128">
                  <circle
                    cx="64"
                    cy="64"
                    r={radius}
                    className="stroke-muted/40"
                    strokeWidth="10"
                    fill="transparent"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r={radius}
                    stroke="url(#indigoGradient)"
                    strokeWidth="10"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-1000 ease-out"
                  />
                  <defs>
                    <linearGradient id="indigoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#6366F1" />
                      <stop offset="100%" stopColor="#A855F7" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* Inside Gauge Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-3xl font-black font-mono tracking-tight text-foreground">
                    {activeScore}
                  </span>
                  <span className="text-[11px] font-mono text-muted-foreground font-semibold">
                    / {totalMarks} Marks
                  </span>
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 font-mono mt-0.5">
                    {scorePct}% Score
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Metrics Breakdown */}
            <div className="sm:col-span-7 grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-100/70 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.06] space-y-1 shadow-2xs">
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">
                  All-Nepal Merit Rank
                </span>
                <span className="text-lg font-black font-mono text-foreground flex items-baseline gap-1">
                  <span>#{rankEstimate}</span>
                  <span className="text-[10px] text-muted-foreground font-normal">/ {cohortSize.toLocaleString()}</span>
                </span>
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 block font-mono">
                  Top {(100 - percentile).toFixed(1)}% Cohort
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-100/70 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.06] space-y-1 shadow-2xs">
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">
                  Exam Accuracy
                </span>
                <span className="text-lg font-black font-mono text-foreground">
                  {accuracy.toFixed(1)}%
                </span>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block font-mono">
                  +{accuracyDelta}% this week
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-100/70 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.06] space-y-1 shadow-2xs">
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">
                  Scholarship Tier
                </span>
                <span className="text-xs font-black text-foreground block truncate">
                  Full Open Merit
                </span>
                <span className="text-[10px] text-muted-foreground block">
                  TU IOM / BPKIHS Eligible
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-100/70 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.06] space-y-1 shadow-2xs">
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">
                  Negative Penalty
                </span>
                <span className="text-xs font-black font-mono text-rose-600 dark:text-rose-400 block">
                  -0.25 MEC Standard
                </span>
                <span className="text-[10px] text-muted-foreground block">
                  Strict Normalization
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Bar: Action CTAs */}
          <div className="pt-4 border-t border-border/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 relative z-10">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Target size={14} className="text-indigo-500 shrink-0" />
              <span>Target Open Cutoff: <strong>140 Marks</strong> (TU Maharajgunj Top Tier: <strong>165 Marks</strong>)</span>
            </div>
            <Link
              href="/mock-tests"
              className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs shrink-0"
            >
              <span>Take Next CBT Mock</span>
              <ChevronRight size={13} />
            </Link>
          </div>
        </div>

        {isCee && (
        <div className="lg:col-span-4 bg-card border border-border/80 rounded-2xl sm:rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-1.5 border-b border-border/60 pb-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <TrendingUp size={13} className="text-primary" />
                <span>Admission Forecaster</span>
              </span>
              <button
                type="button"
                onClick={() => setShowSimulator(!showSimulator)}
                className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Sliders size={11} />
                <span>{showSimulator ? 'Close Simulator' : 'Simulate Score'}</span>
              </button>
            </div>
            <h3 className="text-base font-bold text-foreground">
              College Eligibility Standing
            </h3>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Based on historical MEC cutoffs and current {activeScore} projected score.
            </p>

            {/* Score Simulation Slider */}
            {showSimulator && (
              <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl space-y-2 mt-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-muted-foreground">Simulate Score:</span>
                  <span className="font-bold text-primary font-mono text-sm">{simulatedScore} / 200</span>
                </div>
                <input
                  type="range"
                  min={100}
                  max={195}
                  value={simulatedScore}
                  onChange={(e) => setSimulatedScore(Number(e.target.value))}
                  className="w-full accent-primary h-1.5 bg-muted rounded-lg cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* College Probability List */}
          <div className="space-y-2.5 flex-1 overflow-y-auto">
            {MEDICAL_COLLEGES.map((college) => {
              const status = getAdmissionStatus(college.cutoff);
              const StatusIcon = status.icon;

              return (
                <div
                  key={college.id}
                  className="p-3 rounded-xl bg-slate-100/60 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/[0.05] flex items-center justify-between gap-2.5 hover:border-primary/40 transition-all shadow-2xs"
                >
                  <div className="space-y-0.5 truncate">
                    <p className="text-xs font-bold text-foreground truncate">{college.name}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">
                      Cutoff: {college.cutoff}+ • {college.location}
                    </p>
                  </div>
                  <span
                    className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border shrink-0 flex items-center gap-1 ${status.color}`}
                  >
                    <StatusIcon size={10} />
                    <span>{status.label}</span>
                  </span>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-border/60">
            <Link
              href="/rank-predictor"
              className="w-full py-2 rounded-xl bg-muted/60 hover:bg-muted text-foreground font-bold text-xs flex items-center justify-center gap-1.5 border border-border/80 transition-all"
            >
              <span>Detailed College Seat Matrix</span>
              <ChevronRight size={13} />
            </Link>
          </div>
        </div>
        )}
      </div>

      {/* ── BENTO ROW 2: MEC 200 MARKS BREAKDOWN (7 Cols) + ACCURACY TREND (5 Cols) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* MEC 200 MARKS BREAKDOWN BENTO (Span 7) */}
        <div className="lg:col-span-7 bg-card border border-border/80 rounded-2xl sm:rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <BarChart2 size={16} />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground tracking-tight">
                  {isCee ? 'Syllabus weightage' : `${trackMeta.shortName} subjects`}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {isCee
                    ? 'Biology 80 · Chemistry 50 · Physics 50 · MAT 20'
                    : trackMeta.subjects.map((s) => s.name).join(' · ')}
                </p>
              </div>
            </div>

            <Link
              href="/subjects"
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
            >
              <span>All Subjects</span>
              <ChevronRight size={13} />
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 gap-3.5">
            {(isCee ? CEE_SUBJECTS : trackMeta.subjects.map((s, idx) => ({
              id: s.name,
              name: s.name,
              weightageMarks: s.chaptersCount,
              accuracy: Math.max(55, 88 - idx * 6),
              masteredChapters: Math.max(4, s.chaptersCount - 4 - idx),
              totalChapters: s.chaptersCount,
              color: 'text-primary',
              barColor: 'from-primary to-indigo-400',
              icon: BarChart2,
              practiceHref: `/practice?subject=${encodeURIComponent(s.name)}&count=25`,
            }))).map((sub) => {
              const SubIcon = sub.icon;
              const chapPct = Math.round((sub.masteredChapters / sub.totalChapters) * 100);

              return (
                <div
                  key={sub.id}
                  className="p-4 rounded-2xl bg-slate-100/50 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/[0.06] hover:border-primary/40 transition-all flex flex-col justify-between space-y-3 shadow-2xs group"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-7 h-7 rounded-lg bg-primary/10 ${sub.color} flex items-center justify-center`}>
                          <SubIcon size={15} />
                        </span>
                        <span className="text-xs font-bold text-foreground truncate">
                          {sub.name}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 shrink-0 tabular-nums">
                        {isCee ? `${sub.weightageMarks} marks` : `${sub.totalChapters} ch`}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <span className="text-muted-foreground">Mastery Accuracy</span>
                      <span className="font-bold text-foreground font-mono">{sub.accuracy}%</span>
                    </div>

                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${sub.barColor} rounded-full transition-all duration-500`}
                        style={{ width: `${sub.accuracy}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border/40 flex items-center justify-between text-xs">
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {sub.masteredChapters}/{sub.totalChapters} Chaps ({chapPct}%)
                    </span>
                    <Link
                      href={sub.practiceHref}
                      className="font-bold text-primary group-hover:underline flex items-center gap-0.5"
                    >
                      <span>Drill MCQs</span>
                      <ChevronRight size={12} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 30-DAY ACCURACY RECHARTS TREND (Span 5) */}
        <div className="lg:col-span-5">
          <AccuracyTrendChart />
        </div>
      </div>

      {/* ── BENTO ROW 3: WEAK TOPICS RADAR (6 Cols) + RECENT CBT EXAMS (6 Cols) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <WeakTopicsPanel />
        <RecentExamsTable />
      </div>
    </motion.div>
  );
}
