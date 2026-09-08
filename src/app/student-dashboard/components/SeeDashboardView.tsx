'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Play,
  CheckCircle2,
  Circle,
  Radio,
  Clock,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Award,
  BookOpen,
  Sparkles,
  ChevronRight,
  Flame,
  Target,
  Zap,
  HelpCircle,
  FileText
} from 'lucide-react';

interface SeeDashboardViewProps {
  displayName: string;
}

interface MissionTask {
  id: string;
  label: string;
  type: 'watch' | 'mcq' | 'written' | 'test';
  link: string;
  completed: boolean;
}

export default function SeeDashboardView({ displayName }: SeeDashboardViewProps) {
  // Today's Mission state with local persistence
  const [tasks, setTasks] = useState<MissionTask[]>([
    {
      id: 'task-1',
      label: 'Watch Science Lesson 3: Acceleration due to Gravity & Free Fall',
      type: 'watch',
      link: '/see/lessons/see-sci-03',
      completed: true,
    },
    {
      id: 'task-2',
      label: 'Solve 20 Science Mechanics MCQs (Target: 85%+ Accuracy)',
      type: 'mcq',
      link: '/see#learning-suite',
      completed: false,
    },
    {
      id: 'task-3',
      label: 'Solve 5 Written Questions (Group B & C step marking)',
      type: 'written',
      link: '/see#learning-suite',
      completed: false,
    },
    {
      id: 'task-4',
      label: 'Take 10-Minute Chapter Drill Test',
      type: 'test',
      link: '/mock-tests',
      completed: false,
    },
  ]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('samyak_see_mission_tasks');
      if (saved) {
        setTasks(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, []);

  const toggleTask = (id: string) => {
    setTasks((prev) => {
      const updated = prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t));
      try {
        localStorage.setItem('samyak_see_mission_tasks', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const completedCount = tasks.filter((t) => t.completed).length;
  const missionProgress = Math.round((completedCount / tasks.length) * 100);

  const now = new Date();
  const timeOfDay = now.getHours() < 12 ? 'morning' : now.getHours() < 17 ? 'afternoon' : 'evening';

  const seeSubjects = [
    { id: 'science', name: 'Compulsory Science', chapters: '19/24 done', progress: 79, color: 'bg-emerald-500' },
    { id: 'math', name: 'Compulsory Math', chapters: '17/20 done', progress: 85, color: 'bg-blue-500' },
    { id: 'opt_math', name: 'Optional Math', chapters: '11/16 done', progress: 68, color: 'bg-purple-500' },
    { id: 'english', name: 'English Language', chapters: '12/15 done', progress: 80, color: 'bg-amber-500' },
    { id: 'nepali', name: 'Nepali (नेपाली)', chapters: '12/16 done', progress: 75, color: 'bg-red-500' },
    { id: 'social', name: 'Social Studies', chapters: '13/18 done', progress: 72, color: 'bg-orange-500' },
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-fadeIn">
      {/* ── 1. STUDENT GREETING & STATUS ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/80 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            Good {timeOfDay}, {displayName}!
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            SEE Class 10 Board Preparation · <span className="text-emerald-600 dark:text-emerald-400 font-bold">Mission 4.00 GPA</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-bold">
            <Flame size={14} className="fill-current text-amber-500" />
            <span>14 Day Streak</span>
          </div>
          <Link
            href="/see"
            className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
          >
            <span>SEE Hub</span>
            <ChevronRight size={14} />
          </Link>
        </div>
      </div>

      {/* ── 2. CONTINUE LEARNING (PRIMARY HERO CTA) ─────────────────────── */}
      <div className="rounded-3xl bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 border border-emerald-500/30 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black uppercase tracking-wider font-mono">
              <Sparkles size={13} /> CONTINUE WHERE YOU LEFT OFF
            </span>

            <h2 className="text-xl sm:text-2xl font-black text-white leading-snug">
              Compulsory Science · Lesson 3: Acceleration due to Gravity &amp; Free Fall
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Unit 1: Force &amp; Gravitation · Chapter Progress: 65% Completed
            </p>

            <div className="w-full max-w-md h-2 rounded-full bg-black/40 overflow-hidden">
              <div className="h-full bg-emerald-400 rounded-full" style={{ width: '65%' }} />
            </div>
          </div>

          <Link
            href="/see/lessons/see-sci-03"
            className="px-8 py-4 rounded-2xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-sm flex items-center justify-center gap-2.5 shadow-xl transition-all hover:scale-105 shrink-0"
          >
            <Play size={18} className="fill-current" />
            <span>CONTINUE LEARNING</span>
          </Link>
        </div>
      </div>

      {/* ── 3. LIVE CLASS TODAY ─────────────────────────────────────────── */}
      <div className="p-5 sm:p-6 rounded-3xl bg-card border border-red-500/30 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-red-500/10 text-red-600 flex items-center justify-center shrink-0 mt-0.5">
            <Radio size={20} className="animate-pulse" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-red-500 text-white font-mono">
                LIVE TODAY
              </span>
              <span className="text-xs text-muted-foreground font-mono font-bold flex items-center gap-1">
                <Clock size={12} /> 6:00 PM – 7:30 PM NST
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-black text-foreground">
              Science · Electricity &amp; Transformer Numericals
            </h3>
            <p className="text-xs text-muted-foreground">
              Instructor: Prof. Ram K. Adhikari · Live Doubt Solving &amp; 2082 Board Prediction
            </p>
          </div>
        </div>

        <Link
          href="/live-classes"
          className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-sm shrink-0 transition-all"
        >
          <Radio size={14} />
          <span>JOIN CLASS →</span>
        </Link>
      </div>

      {/* ── 4. TODAY'S MISSION ──────────────────────────────────────────── */}
      <div className="p-6 sm:p-7 rounded-3xl bg-card border border-border shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <Target size={18} className="text-primary" />
            <h3 className="text-base font-black text-foreground">Today&apos;s Mission</h3>
          </div>
          <span className="text-xs font-mono font-bold text-muted-foreground">
            {completedCount} of {tasks.length} Completed ({missionProgress}%)
          </span>
        </div>

        <div className="space-y-2.5">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                task.completed ? 'bg-muted/30 border-border/60 opacity-80' : 'bg-card border-border hover:border-border/90'
              }`}
            >
              <button
                type="button"
                onClick={() => toggleTask(task.id)}
                className="flex items-center gap-3 text-left flex-1"
              >
                {task.completed ? (
                  <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                ) : (
                  <Circle size={18} className="text-muted-foreground shrink-0" />
                )}
                <span className={`text-xs sm:text-sm font-semibold ${
                  task.completed ? 'line-through text-muted-foreground' : 'text-foreground'
                }`}>
                  {task.label}
                </span>
              </button>

              <Link
                href={task.link}
                className="text-xs font-bold text-primary hover:underline shrink-0 flex items-center gap-1"
              >
                <span>Start</span>
                <ArrowRight size={12} />
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* ── 5. SUBJECT PROGRESS ─────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-foreground flex items-center gap-2">
            <BookOpen size={18} className="text-primary" />
            <span>Class 10 Subject Progress</span>
          </h3>
          <Link href="/see#learning-suite" className="text-xs font-bold text-primary hover:underline">
            View All Chapters →
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {seeSubjects.map((sub) => (
            <Link
              key={sub.id}
              href={`/see/subject/${sub.id}`}
              className="p-4 rounded-2xl bg-card border border-border hover:border-primary/40 transition-all space-y-2.5 group"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-foreground group-hover:text-primary transition-colors">
                  {sub.name}
                </h4>
                <span className="text-xs font-mono font-bold text-foreground">{sub.progress}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div className={`h-full ${sub.color} rounded-full`} style={{ width: `${sub.progress}%` }} />
              </div>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>{sub.chapters}</span>
                <span className="text-primary font-bold group-hover:translate-x-0.5 transition-transform">
                  Practice →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── 6. WEAK AREAS (IMPROVE NOW) ─────────────────────────────────── */}
      <div className="p-6 rounded-3xl bg-card border border-amber-500/30 space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
            <AlertTriangle size={18} />
            <h3 className="text-sm sm:text-base font-black">Weak Areas Identified by AI</h3>
          </div>
          <span className="text-xs text-muted-foreground">Focus here to jump from A to A+</span>
        </div>

        <div className="grid sm:grid-cols-2 gap-3 pt-1">
          <div className="p-4 rounded-2xl bg-muted/30 border border-border space-y-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-foreground">Comp Math: Circle Theorems (Group D)</span>
                <span className="text-red-500 font-mono font-bold text-[11px]">48% Accuracy</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Frequent error in theoretical statement-reason proofs and cyclic quad angle deductions.
              </p>
            </div>
            <Link
              href="/see#learning-suite"
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs text-center flex items-center justify-center gap-1.5 transition-colors"
            >
              <Zap size={13} />
              <span>IMPROVE GEOMETRY NOW →</span>
            </Link>
          </div>

          <div className="p-4 rounded-2xl bg-muted/30 border border-border space-y-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-foreground">Science: Genetics &amp; Dihybrid Cross</span>
                <span className="text-red-500 font-mono font-bold text-[11px]">54% Accuracy</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Miscalculating Punnett square F₂ ratios and chromosome numbers in meiosis.
              </p>
            </div>
            <Link
              href="/see#learning-suite"
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs text-center flex items-center justify-center gap-1.5 transition-colors"
            >
              <Zap size={13} />
              <span>IMPROVE GENETICS NOW →</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── 7. RECENT TEST RESULT & RECOMMENDED NEXT ACTION ─────────────── */}
      <div className="p-6 rounded-3xl bg-card border border-border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 font-black text-lg">
            A+
          </div>
          <div className="space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground font-mono">
              LATEST COMPLETED EXAM
            </div>
            <h4 className="text-sm sm:text-base font-black text-foreground">
              SEE 2082 Science Mid-Term Diagnostic Set A
            </h4>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>Score: <strong className="text-foreground">64 / 75 (85.3%)</strong></span>
              <span>•</span>
              <span>Time: 1h 48m</span>
            </div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium pt-0.5">
              💡 Recommended Next Step: Practice Group D (4-mark) proofs to secure 72+/75 marks.
            </p>
          </div>
        </div>

        <Link
          href="/mock-tests"
          className="px-5 py-2.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-bold text-xs flex items-center justify-center gap-1.5 shrink-0 transition-colors"
        >
          <FileText size={14} />
          <span>Review Test Analysis</span>
        </Link>
      </div>
    </div>
  );
}
