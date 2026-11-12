'use client';

import React from 'react';
import Link from 'next/link';
import {
  Award,
  Target,
  TrendingUp,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  ChevronRight,
  Clock,
  Sparkles,
} from 'lucide-react';

export interface TremorKPIProps {
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
  weeklyTarget?: number;
  daysToCee?: number;
  weeklyActivity?: Array<{ day: string; questions: number; isToday: boolean }>;
}

export default function TremorKPICards({
  score = 162,
  totalMarks = 200,
  scoreDelta = 14,
  accuracy = 78.4,
  accuracyDelta = 4.2,
  rankEstimate = '~140',
  cohortSize = 18500,
  percentile = 99.2,
  streakDays = 7,
  questionsSolved = 1420,
  weeklyTarget = 1500,
  daysToCee = 38,
  weeklyActivity = [
    { day: 'Sun', questions: 45, isToday: false },
    { day: 'Mon', questions: 60, isToday: false },
    { day: 'Tue', questions: 55, isToday: false },
    { day: 'Wed', questions: 70, isToday: false },
    { day: 'Thu', questions: 85, isToday: false },
    { day: 'Fri', questions: 90, isToday: false },
    { day: 'Sat', questions: 65, isToday: true },
  ],
}: TremorKPIProps) {
  const maxQuestions = Math.max(1, ...weeklyActivity.map((d) => d.questions));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* ── CARD 1: PROJECTED CEE SCORE ─────────────────────────────────── */}
      <div className="group relative bg-card border border-border/80 hover:border-primary/50 rounded-2xl p-5 shadow-xs transition-all hover:shadow-md flex flex-col justify-between">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <span>MEC CEE Projected Score</span>
            </span>
            <div className="flex items-baseline gap-2 pt-1">
              <span className="text-3xl font-black font-mono tracking-tight text-foreground">
                {score}
              </span>
              <span className="text-xs font-mono font-medium text-muted-foreground">
                / {totalMarks}
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Award size={20} />
          </div>
        </div>

        <div className="pt-4 border-t border-border/60 mt-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
              <ArrowUpRight size={13} />
              <span>+{scoreDelta} pts vs baseline</span>
            </span>
            <span className="text-[11px] text-muted-foreground font-medium">
              Cutoff: 140+
            </span>
          </div>

          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-indigo-500 rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, Math.round((score / totalMarks) * 100))}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground flex items-center justify-between">
            <span>Scholarship Tier: <strong className="text-foreground">Full Open Merit</strong></span>
            <span className="font-mono">{daysToCee}d left</span>
          </p>
        </div>
      </div>

      {/* ── CARD 2: OVERALL ACCURACY RATE ─────────────────────────────────── */}
      <div className="group relative bg-card border border-border/80 hover:border-emerald-500/50 rounded-2xl p-5 shadow-xs transition-all hover:shadow-md flex flex-col justify-between">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Examination Accuracy
            </span>
            <div className="flex items-baseline gap-2 pt-1">
              <span className="text-3xl font-black font-mono tracking-tight text-foreground">
                {accuracy.toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Target size={20} />
          </div>
        </div>

        <div className="pt-4 border-t border-border/60 mt-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
              <ArrowUpRight size={13} />
              <span>+{accuracyDelta}% this week</span>
            </span>
            <span className="text-[11px] text-muted-foreground font-medium">
              Target: 80%+
            </span>
          </div>

          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, Math.round(accuracy))}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground flex items-center justify-between">
            <span>Negative Marking Penalty: <strong className="text-rose-600 dark:text-rose-400">-0.25 MEC</strong></span>
          </p>
        </div>
      </div>

      {/* ── CARD 3: MERIT RANK ESTIMATION ──────────────────────────────────── */}
      <div className="group relative bg-card border border-border/80 hover:border-amber-500/50 rounded-2xl p-5 shadow-xs transition-all hover:shadow-md flex flex-col justify-between">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              All-Nepal Merit Forecast
            </span>
            <div className="flex items-baseline gap-2 pt-1">
              <span className="text-3xl font-black font-mono tracking-tight text-foreground">
                #{rankEstimate}
              </span>
              <span className="text-xs font-mono font-medium text-muted-foreground">
                / {cohortSize.toLocaleString()}
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <TrendingUp size={20} />
          </div>
        </div>

        <div className="pt-4 border-t border-border/60 mt-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 font-mono bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
              Top {(100 - percentile).toFixed(1)}% Cohort
            </span>
            <Link
              href="/leaderboard"
              className="text-[11px] font-bold text-primary hover:underline inline-flex items-center gap-0.5"
            >
              <span>View Leaderboard</span>
              <ChevronRight size={12} />
            </Link>
          </div>

          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-primary rounded-full transition-all duration-700"
              style={{ width: `${percentile}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground flex items-center justify-between">
            <span>Projection Model: <strong className="text-foreground">MEC 2026 Normalization</strong></span>
          </p>
        </div>
      </div>

      {/* ── CARD 4: STUDY VELOCITY & STREAK ───────────────────────────────── */}
      <div className="group relative bg-card border border-border/80 hover:border-cyan-500/50 rounded-2xl p-5 shadow-xs transition-all hover:shadow-md flex flex-col justify-between">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Study Velocity &amp; Streak
            </span>
            <div className="flex items-baseline gap-2 pt-1">
              <span className="text-3xl font-black font-mono tracking-tight text-foreground">
                {streakDays}
              </span>
              <span className="text-xs font-mono font-medium text-muted-foreground">
                Days Unbroken
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Zap size={20} />
          </div>
        </div>

        {/* 7-Day Micro Activity Sparkline */}
        <div className="pt-4 border-t border-border/60 mt-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[11px] text-muted-foreground font-mono">
              <strong>{questionsSolved.toLocaleString()}</strong> Qs solved
            </span>
            <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-bold uppercase font-mono">
              Consistent Pace
            </span>
          </div>

          <div className="grid grid-cols-7 gap-1 items-end h-7 pt-1">
            {weeklyActivity.map((day, idx) => {
              const heightPct = Math.max(15, Math.round((day.questions / maxQuestions) * 100));
              return (
                <div
                  key={idx}
                  className="flex flex-col items-center justify-end h-full gap-0.5 group/bar"
                  title={`${day.day}: ${day.questions} questions`}
                >
                  <div
                    className={`w-full rounded-xs transition-all duration-300 ${
                      day.isToday
                        ? 'bg-cyan-500'
                        : 'bg-muted hover:bg-cyan-500/60'
                    }`}
                    style={{ height: `${heightPct}%` }}
                  />
                </div>
              );
            })}
          </div>

          <div className="flex justify-between text-[9px] font-mono text-muted-foreground pt-0.5">
            <span>S</span>
            <span>M</span>
            <span>T</span>
            <span>W</span>
            <span>T</span>
            <span>F</span>
            <span className="text-cyan-600 dark:text-cyan-400 font-bold">S</span>
          </div>
        </div>
      </div>
    </div>
  );
}
