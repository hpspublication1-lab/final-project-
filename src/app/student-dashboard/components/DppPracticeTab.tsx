'use client';

import React from 'react';
import Link from 'next/link';
import {
  Zap,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { DashboardData } from '../types';

interface DppPracticeTabProps {
  data: DashboardData;
  backlogMode: 'express' | 'balanced' | 'weekend';
  setBacklogMode: (mode: 'express' | 'balanced' | 'weekend') => void;
  unfinishedChapterCount: number;
  unfinishedChapterMins: number;
  pendingDrillCount: number;
  totalWeakTopicErrors: number;
  recoveryProgressPct: number;
  displayedBacklogQueue: Array<{
    id: string;
    type: 'chapter' | 'dpp' | 'task';
    subject: string;
    title: string;
    meta: string;
    href: string;
    cta: string;
  }>;
}

export default function DppPracticeTab({
  data,
  backlogMode,
  setBacklogMode,
  unfinishedChapterCount,
  unfinishedChapterMins,
  pendingDrillCount,
  totalWeakTopicErrors,
  recoveryProgressPct,
  displayedBacklogQueue,
}: DppPracticeTabProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="space-y-5"
    >
      {/* PW Backlog Recovery Planner ("Study Sahayak") */}
      <div className="bg-card border border-border/80 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Zap size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-foreground tracking-tight">
                  Practice queue
                </h3>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Catch up missed chapters and unattempted DPPs
              </p>
            </div>
          </div>

          {/* Mode Selector */}
          <div className="flex items-center bg-muted/60 p-1 rounded-xl border border-border/60 text-xs self-start sm:self-auto">
            <button
              onClick={() => setBacklogMode('express')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                backlogMode === 'express'
                  ? 'bg-card text-foreground font-bold shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Express (3D)
            </button>
            <button
              onClick={() => setBacklogMode('balanced')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                backlogMode === 'balanced'
                  ? 'bg-card text-foreground font-bold shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Balanced (7D)
            </button>
            <button
              onClick={() => setBacklogMode('weekend')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                backlogMode === 'weekend'
                  ? 'bg-card text-foreground font-bold shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Weekend Sprint
            </button>
          </div>
        </div>

        {/* Backlog Summary & Progress */}
        <div className="grid sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Pending Syllabus
              </span>
              <p className="text-lg font-extrabold text-foreground font-mono">
                {unfinishedChapterCount} {unfinishedChapterCount === 1 ? 'Session' : 'Sessions'}
              </p>
            </div>
            <span className="text-xs font-mono text-muted-foreground font-semibold">
              ~{unfinishedChapterMins} mins
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-indigo-500/5 border border-indigo-500/20 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Weak-Topic DPPs
              </span>
              <p className="text-lg font-extrabold text-foreground font-mono">
                {pendingDrillCount} {pendingDrillCount === 1 ? 'Drill' : 'Drills'}
              </p>
            </div>
            <span className="text-xs font-mono text-muted-foreground font-semibold">
              {totalWeakTopicErrors} Misses
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Recovery Pace ({recoveryProgressPct}%)
              </span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                {backlogMode === 'express'
                  ? '+2h / day'
                  : backlogMode === 'balanced'
                  ? '+45m / day'
                  : 'Sat & Sun'}
              </span>
            </div>
            <div className="w-full bg-emerald-500/20 h-1.5 rounded-full overflow-hidden mt-2">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${recoveryProgressPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Actionable Backlog Queue */}
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Catch-Up Priority Queue ({displayedBacklogQueue.length} Active)
            </span>
            <Link
              href="/practice"
              className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1"
            >
              <span>Browse All DPPs</span>
              <ArrowRight size={11} />
            </Link>
          </div>

          {displayedBacklogQueue.length > 0 ? (
            <div className="grid sm:grid-cols-3 gap-3">
              {displayedBacklogQueue.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl bg-muted/20 border border-border/70 hover:border-primary/40 transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold uppercase text-primary px-1.5 py-0.5 rounded bg-primary/10">
                        {item.subject}
                      </span>
                      <span className="text-[10px] font-semibold text-muted-foreground">
                        {item.type === 'chapter'
                          ? 'Chapter'
                          : item.type === 'dpp'
                          ? 'DPP Drill'
                          : 'Task'}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold leading-snug text-foreground">
                      {item.title}
                    </h4>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/40 text-[11px]">
                    <span className="text-muted-foreground font-mono">{item.meta}</span>
                    <Link
                      href={item.href}
                      className="font-bold text-primary hover:underline flex items-center gap-0.5"
                    >
                      <span>{item.cta}</span>
                      <ArrowRight size={11} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-foreground">
                    Zero Backlog — You&apos;re 100% Caught Up!
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    All scheduled tasks and weak-topic drills are cleared.
                  </p>
                </div>
              </div>
              <Link
                href="/practice"
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 shrink-0"
              >
                <span>Practice Ahead</span>
                <ArrowRight size={12} />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Target Weak Topics Drill List */}
      <div className="bg-card border border-border/80 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-500" />
            <h3 className="text-sm font-bold text-foreground">Target Weak Topics (Error Diagnostics)</h3>
          </div>
          <Link href="/mistake-analyser" className="text-xs font-bold text-primary hover:underline">
            Full Error Log &rarr;
          </Link>
        </div>

        {data.weakTopics.length > 0 ? (
          <div className="grid sm:grid-cols-2 gap-3">
            {data.weakTopics.map((wt) => (
              <div
                key={wt.id}
                className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-center justify-between gap-3"
              >
                <div className="space-y-0.5">
                  <h5 className="text-xs font-bold text-foreground">{wt.title}</h5>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {wt.errorCount} incorrect attempts • {wt.accuracy}% accuracy
                  </span>
                </div>
                <Link
                  href={wt.practiceHref}
                  className="px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 font-bold text-xs flex items-center gap-1 shrink-0"
                >
                  <span>Drill DPP</span>
                  <ArrowRight size={11} />
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center bg-muted/15 border border-border/50 rounded-xl space-y-2">
            <CheckCircle2 size={24} className="mx-auto text-emerald-500" />
            <p className="text-xs font-bold text-foreground">No weak topics detected</p>
            <p className="text-[11px] text-muted-foreground">
              Continue solving questions to trigger automatic error diagnostics.
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
