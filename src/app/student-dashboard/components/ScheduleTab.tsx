'use client';

import React from 'react';
import Link from 'next/link';
import {
  Radio,
  Target,
  Sparkles,
  Video,
  Check,
  ChevronRight,
  Zap,
  Brain,
  ListTodo,
  Clock,
  ArrowRight,
  BookOpen,
  FileText,
  Swords,
  BookCheck,
  RotateCcw,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { DashboardData, PWTab } from '../types';

interface ScheduleTabProps {
  data: DashboardData;
  completedTasks: Record<string, boolean>;
  toggleTask: (taskId: string) => void;
  claimingMissionBonus: boolean;
  handleClaimDailyMission: () => void;
  setActiveTab: (tab: PWTab) => void;
}

export default function ScheduleTab({
  data,
  completedTasks,
  toggleTask,
  claimingMissionBonus,
  handleClaimDailyMission,
  setActiveTab,
}: ScheduleTabProps) {
  const completedCount = Object.values(completedTasks).filter(Boolean).length;
  const totalTasksCount = data.todayStudyPlan.tasks.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="space-y-6"
    >
      {/* ── LIVE CLASS HIGHLIGHT BANNER ───────────────────────────────── */}
      {data.upcomingLiveClass && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-red-500/10 via-card to-card border border-red-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-center gap-3.5">
            <span className="w-10 h-10 rounded-xl bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
              <Radio size={20} className="animate-pulse" />
            </span>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase px-2 py-0.2 rounded bg-red-500 text-white">
                  {data.upcomingLiveClass.status === 'live' ? 'LIVE NOW' : 'NEXT LIVE CLASS'}
                </span>
                <span className="text-xs text-muted-foreground font-mono">
                  {new Date(data.upcomingLiveClass.scheduledAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <h3 className="text-sm font-bold text-foreground">
                {data.upcomingLiveClass.title}
              </h3>
              {data.upcomingLiveClass.instructorName && (
                <p className="text-[11px] text-muted-foreground">
                  Mentor: <strong className="text-foreground">{data.upcomingLiveClass.instructorName}</strong>
                </p>
              )}
            </div>
          </div>

          <Link
            href="/live-classes"
            className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs shrink-0 self-start sm:self-auto"
          >
            <Radio size={13} />
            <span>Join Classroom</span>
          </Link>
        </div>
      )}

      {/* ── SAMYAK CEE 3-PILLAR DAILY RIGOR (Psychological Habit Loop) ── */}
      {data.gamification && (
        <div className="bg-gradient-to-br from-indigo-500/5 via-card to-card border border-indigo-500/20 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg shrink-0">
                <Target size={20} className="text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-black text-foreground">
                    Samyak CEE 3-Pillar Daily Rigor
                  </h3>
                  <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    +100 XP Bonus
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Build relentless study momentum: Lecture + DPP Practice + Galti Sudhar Spaced Repetition
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-start sm:self-auto">
              <div className="text-right">
                <span className="text-xs font-bold text-foreground font-mono block">
                  {data.gamification.dailyMission.completedCount} of 3 Goals Done
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {data.gamification.dailyMission.completedCount === 3
                    ? 'All Goals Completed Today!'
                    : `${3 - data.gamification.dailyMission.completedCount} remaining`}
                </span>
              </div>

              {data.gamification.dailyMission.completedCount === 3 && (
                <button
                  onClick={handleClaimDailyMission}
                  disabled={claimingMissionBonus || (data.gamification.dailyMission as any).bonusClaimed}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-xs flex items-center gap-1 shadow-sm hover:opacity-95 transition-all disabled:opacity-50 cursor-pointer animate-pulse"
                >
                  <Sparkles size={13} />
                  <span>
                    {(data.gamification.dailyMission as any).bonusClaimed
                      ? 'Claimed (+100 XP)'
                      : claimingMissionBonus
                      ? 'Claiming...'
                      : 'Claim +100 XP'}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Mission Completion Progress Bar */}
          <div className="space-y-1.5">
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary via-emerald-500 to-amber-500 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.round((data.gamification.dailyMission.completedCount / 3) * 100)}%`,
                }}
              />
            </div>
          </div>

          {/* 3 Pillars */}
          <div className="grid sm:grid-cols-3 gap-3.5 pt-1">
            {/* Pillar 1: Lecture */}
            <div
              className={`p-4 rounded-xl border transition-all flex flex-col justify-between space-y-3 ${
                data.gamification.dailyMission.watchLecture
                  ? 'bg-emerald-500/5 border-emerald-500/30'
                  : 'bg-muted/20 border-border/80'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-6 h-6 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                      <Video size={13} />
                    </span>
                    <span className="text-[10px] font-mono font-bold uppercase text-primary px-1.5 py-0.2 rounded bg-primary/10">
                      Pillar 1
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-foreground">Watch 1 Concept Lecture</h4>
                  <p className="text-[11px] text-muted-foreground">
                    Watch at least 10 mins of today&apos;s chapter lecture video
                  </p>
                </div>
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                    data.gamification.dailyMission.watchLecture
                      ? 'bg-emerald-500 text-white'
                      : 'border-2 border-muted-foreground/30 text-transparent'
                  }`}
                >
                  <Check size={12} strokeWidth={3} />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/40 text-[11px]">
                <span className="font-mono text-muted-foreground">+50 XP</span>
                <button
                  onClick={() => setActiveTab('classes')}
                  className="font-bold text-primary hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <span>{data.gamification.dailyMission.watchLecture ? 'Reviewed' : 'Start Lecture'}</span>
                  <ChevronRight size={12} />
                </button>
              </div>
            </div>

            {/* Pillar 2: DPP */}
            <div
              className={`p-4 rounded-xl border transition-all flex flex-col justify-between space-y-3 ${
                data.gamification.dailyMission.solveDpp
                  ? 'bg-emerald-500/5 border-emerald-500/30'
                  : 'bg-muted/20 border-border/80'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-6 h-6 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <Zap size={13} />
                    </span>
                    <span className="text-[10px] font-mono font-bold uppercase text-emerald-600 dark:text-emerald-400 px-1.5 py-0.2 rounded bg-emerald-500/10">
                      Pillar 2
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-foreground">Solve Today&apos;s Chapter DPP</h4>
                  <p className="text-[11px] text-muted-foreground">
                    Complete 5+ high-yield practice MCQs with -0.25 marking
                  </p>
                </div>
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                    data.gamification.dailyMission.solveDpp
                      ? 'bg-emerald-500 text-white'
                      : 'border-2 border-muted-foreground/30 text-transparent'
                  }`}
                >
                  <Check size={12} strokeWidth={3} />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/40 text-[11px]">
                <span className="font-mono text-muted-foreground">+30 XP</span>
                <button
                  onClick={() => setActiveTab('dpp')}
                  className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <span>{data.gamification.dailyMission.solveDpp ? 'Solved' : 'Open DPP'}</span>
                  <ChevronRight size={12} />
                </button>
              </div>
            </div>

            {/* Pillar 3: Galti Sudhar SM-2 */}
            <div
              className={`p-4 rounded-xl border transition-all flex flex-col justify-between space-y-3 ${
                data.gamification.dailyMission.reviewGaltiSudhar
                  ? 'bg-emerald-500/5 border-emerald-500/30'
                  : 'bg-muted/20 border-border/80'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-6 h-6 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                      <Brain size={13} />
                    </span>
                    <span className="text-[10px] font-mono font-bold uppercase text-rose-600 dark:text-rose-400 px-1.5 py-0.2 rounded bg-rose-500/10">
                      Pillar 3
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-foreground">Galti Sudhar Review</h4>
                  <p className="text-[11px] text-muted-foreground">
                    {data.gamification.dueFlashcardsCount > 0
                      ? `${data.gamification.dueFlashcardsCount} spaced repetition cards due today`
                      : 'All due mistake flashcards cleared today'}
                  </p>
                </div>
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                    data.gamification.dailyMission.reviewGaltiSudhar
                      ? 'bg-emerald-500 text-white'
                      : 'border-2 border-muted-foreground/30 text-transparent'
                  }`}
                >
                  <Check size={12} strokeWidth={3} />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/40 text-[11px]">
                <span className="font-mono text-muted-foreground">+20 XP</span>
                <Link
                  href="/mistake-analyser"
                  className="font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-0.5"
                >
                  <span>Review Notebook</span>
                  <ChevronRight size={12} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TODAY'S STRUCTURED TASKS (PW Daily Target) ────────────────── */}
      <div className="bg-card border border-border/80 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <ListTodo size={16} />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                {data.todayStudyPlan.planTitle}
              </h3>
              <p className="text-xs text-muted-foreground">
                Target: {data.todayStudyPlan.dailyHoursTarget} hours • {completedCount} of{' '}
                {totalTasksCount} targets completed today
              </p>
            </div>
          </div>

          <Link
            href="/study-plan"
            className="text-xs font-bold text-primary hover:underline flex items-center gap-1 self-start sm:self-auto"
          >
            <span>Customize Schedule</span>
            <ChevronRight size={14} />
          </Link>
        </div>

        <div className="grid sm:grid-cols-3 gap-3.5">
          {data.todayStudyPlan.tasks.map((task) => {
            const isDone = completedTasks[task.id];
            return (
              <div
                key={task.id}
                onClick={() => toggleTask(task.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                  isDone
                    ? 'bg-emerald-500/5 border-emerald-500/30 text-muted-foreground'
                    : 'bg-muted/20 border-border/80 hover:border-primary/40 text-foreground'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                      isDone ? 'bg-emerald-500 text-white' : 'border-2 border-muted-foreground/40'
                    }`}
                  >
                    {isDone && <Check size={12} strokeWidth={3} />}
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold uppercase text-primary px-2 py-0.5 rounded bg-primary/10">
                      {task.subject}
                    </span>
                    <h4
                      className={`text-xs font-bold leading-snug ${
                        isDone ? 'line-through opacity-70' : ''
                      }`}
                    >
                      {task.title}
                    </h4>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/40 text-[11px]">
                  <span className="text-muted-foreground flex items-center gap-1 font-mono">
                    <Clock size={12} />
                    <span>~{task.estimatedMins} mins</span>
                  </span>
                  <Link
                    href={task.actionHref}
                    onClick={(e) => e.stopPropagation()}
                    className="font-bold text-primary hover:underline flex items-center gap-0.5"
                  >
                    <span>Start Task</span>
                    <ArrowRight size={11} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── QUICK-ACCESS 6 PILLARS NAVIGATION STRIP ─────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Link
          href="/subjects"
          className="bg-card border border-border/80 hover:border-primary/50 rounded-2xl p-3.5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <span className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center text-sm font-bold">
              <BookOpen size={16} />
            </span>
            <span className="text-[9px] font-mono font-bold uppercase text-muted-foreground">
              Learn
            </span>
          </div>
          <div className="mt-2 space-y-0.5">
            <h4 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
              Curriculum
            </h4>
            <p className="text-[10px] text-muted-foreground line-clamp-1">All subjects &amp; chapters</p>
          </div>
        </Link>

        <Link
          href="/practice"
          className="bg-card border border-border/80 hover:border-emerald-500/50 rounded-2xl p-3.5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <span className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-sm font-bold">
              <Zap size={16} />
            </span>
            <span className="text-[9px] font-mono font-bold uppercase text-emerald-600 dark:text-emerald-400">
              15,000+
            </span>
          </div>
          <div className="mt-2 space-y-0.5">
            <h4 className="text-xs font-bold text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              Question Bank
            </h4>
            <p className="text-[10px] text-muted-foreground line-clamp-1">Topicwise past MCQs</p>
          </div>
        </Link>

        <Link
          href="/mock-tests"
          className="bg-card border border-border/80 hover:border-indigo-500/50 rounded-2xl p-3.5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <span className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-sm font-bold">
              <FileText size={16} />
            </span>
            <span className="text-[9px] font-mono font-bold uppercase text-indigo-600 dark:text-indigo-400">
              CBT
            </span>
          </div>
          <div className="mt-2 space-y-0.5">
            <h4 className="text-xs font-bold text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              Mock Tests
            </h4>
            <p className="text-[10px] text-muted-foreground line-clamp-1">200Q -0.25 Marking</p>
          </div>
        </Link>

        <Link
          href="/battle-arena"
          className="bg-gradient-to-br from-amber-500/10 via-card to-card border border-amber-500/40 hover:border-amber-500 rounded-2xl p-3.5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <span className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center text-sm font-bold">
              <Swords size={16} />
            </span>
            <span className="text-[9px] font-mono font-black uppercase px-1 rounded bg-amber-500 text-black">
              Rs. 1,000
            </span>
          </div>
          <div className="mt-2 space-y-0.5">
            <h4 className="text-xs font-bold text-amber-600 dark:text-amber-400 group-hover:underline">
              Battle Arena
            </h4>
            <p className="text-[10px] text-muted-foreground line-clamp-1">1v1 Daily Cash Duels</p>
          </div>
        </Link>

        <Link
          href="/free-resources"
          className="bg-card border border-border/80 hover:border-primary/50 rounded-2xl p-3.5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
              <BookCheck size={16} />
            </span>
            <span className="text-[9px] font-mono font-bold uppercase text-primary">
              Free
            </span>
          </div>
          <div className="mt-2 space-y-0.5">
            <h4 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
              Formula Vault
            </h4>
            <p className="text-[10px] text-muted-foreground line-clamp-1">KaTeX Notes &amp; Formulas</p>
          </div>
        </Link>

        <Link
          href="/mistake-analyser"
          className="bg-card border border-border/80 hover:border-rose-500/50 rounded-2xl p-3.5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <span className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center text-sm font-bold">
              <RotateCcw size={16} />
            </span>
            <span className="text-[9px] font-mono font-bold uppercase text-rose-600 dark:text-rose-400">
              SM-2
            </span>
          </div>
          <div className="mt-2 space-y-0.5">
            <h4 className="text-xs font-bold text-foreground group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
              Galti Sudhar
            </h4>
            <p className="text-[10px] text-muted-foreground line-clamp-1">Mistakes &amp; Flashcards</p>
          </div>
        </Link>
      </div>
    </motion.div>
  );
}
