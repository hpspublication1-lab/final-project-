'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles, Target, CheckSquare, Square, Flame, ShieldAlert, Award,
  ArrowRight, PlayCircle, Clock, Zap, CheckCircle2, TrendingUp
} from 'lucide-react';
import { useProgram } from '@/contexts/ProgramContext';
import { useAuth } from '@/contexts/AuthContext';

interface DailyTask {
  id: string;
  title: string;
  completed: boolean;
  route: string;
}

export default function TodayPersonalizedOSWidget() {
  const { program } = useProgram();
  const { user, profile } = useAuth();

  const displayName = profile?.full_name?.split(' ')?.[0] || user?.email?.split('@')?.[0] || 'Suraj';

  // State for Today's Targets
  const [tasks, setTasks] = useState<DailyTask[]>([
    { id: 't1', title: 'Physics Revision & Video Lecture', completed: true, route: '/subjects' },
    { id: 't2', title: '30 Chapter MCQs Speed Drill', completed: true, route: '/practice' },
    { id: 't3', title: 'Mathematics Vector & Algebra Practice', completed: false, route: '/live-teacher' },
    { id: 't4', title: '1 Full Model Mock Test', completed: false, route: '/mock-tests' },
  ]);

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <div className="bg-card border-2 border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
      
      {/* Background Subtle Gradient Glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Greeting & Days Counter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border">
        
        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            STUDENT TODAY OPERATING SYSTEM
          </span>
          <h1 className="text-2xl sm:text-4xl font-black text-foreground tracking-tight">
            GOOD MORNING, <span className="uppercase text-emerald-600">{displayName}</span> 👋
          </h1>
          <p className="text-xs text-muted-foreground font-medium">
            Here is your active learning roadmap for today. Stay on track to reach your target!
          </p>
        </div>

        {/* SEE Days Left Progress Bar Card */}
        <div className="p-4 rounded-2xl bg-muted/40 border border-border min-w-[240px] space-y-2 shrink-0">
          <div className="flex items-center justify-between text-xs font-black">
            <span className="text-foreground uppercase">SEE DAYS LEFT</span>
            <span className="text-emerald-600 font-mono font-bold">42 DAYS</span>
          </div>
          <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 h-3 rounded-full w-3/4" />
          </div>
          <span className="text-[10px] font-bold text-muted-foreground block text-right">
            75% Preparation Period Passed
          </span>
        </div>

      </div>

      {/* 4 Metric Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1 text-center">
          <span className="text-[9px] font-black uppercase text-emerald-600 block">YOUR TARGET</span>
          <div className="text-2xl font-black text-emerald-600">GPA 3.8</div>
          <span className="text-[10px] text-muted-foreground font-semibold">High Distinction</span>
        </div>

        <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 space-y-1 text-center">
          <span className="text-[9px] font-black uppercase text-blue-600 block">CURRENT PERFORMANCE</span>
          <div className="text-2xl font-black text-blue-600">72%</div>
          <span className="text-[10px] text-muted-foreground font-semibold">Average Accuracy</span>
        </div>

        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 space-y-1 text-center">
          <span className="text-[9px] font-black uppercase text-red-600 block">WEAK TOPIC</span>
          <div className="text-xl font-black text-red-600 flex items-center justify-center gap-1">
            🔴 Algebra
          </div>
          <span className="text-[10px] text-muted-foreground font-semibold">Accuracy: 48%</span>
        </div>

        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1 text-center">
          <span className="text-[9px] font-black uppercase text-amber-600 block">STREAK</span>
          <div className="text-2xl font-black text-amber-600 flex items-center justify-center gap-1">
            🔥 12 DAYS
          </div>
          <span className="text-[10px] text-muted-foreground font-semibold">Daily Active Learner</span>
        </div>

      </div>

      {/* TODAY'S TARGET checklist section */}
      <div className="p-6 rounded-3xl bg-muted/20 border border-border space-y-4">
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target size={18} className="text-emerald-600" />
            <h3 className="text-base font-black text-foreground uppercase tracking-wider">
              TODAY&apos;S TARGET ({completedCount} / {tasks.length} DONE)
            </h3>
          </div>
          <span className="text-xs font-mono font-extrabold text-emerald-600">
            {Math.round((completedCount / tasks.length) * 100)}% COMPLETE
          </span>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              onClick={() => toggleTask(task.id)}
              className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                task.completed
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-muted-foreground line-through'
                  : 'bg-card border-border hover:border-emerald-500/40 text-foreground'
              }`}
            >
              <div className="flex items-center gap-3">
                {task.completed ? (
                  <CheckSquare size={18} className="text-emerald-500 shrink-0" />
                ) : (
                  <Square size={18} className="text-muted-foreground shrink-0" />
                )}
                <span className="text-xs font-bold">{task.title}</span>
              </div>

              <Link
                href={task.route}
                onClick={(e) => e.stopPropagation()}
                className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-black hover:bg-emerald-700 transition-colors shrink-0"
              >
                Go
              </Link>
            </div>
          ))}
        </div>

        {/* Action button */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border/60">
          <p className="text-xs text-muted-foreground font-medium">
            Next Bottleneck: <span className="text-foreground font-bold">Mathematics Algebra Practice</span>
          </p>

          <Link
            href="/live-teacher"
            className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all"
          >
            <span>START TODAY&apos;S TARGET</span>
            <ArrowRight size={16} />
          </Link>
        </div>

      </div>

    </div>
  );
}
