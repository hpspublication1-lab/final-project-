'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Swords, Clock, CheckCircle2, Play, Flame, Sparkles, Award, ArrowRight, Check
} from 'lucide-react';
import toast from 'react-hot-toast';

interface MissionTask {
  id: string;
  title: string;
  duration: string;
  subject: string;
  slug: string;
  completed: boolean;
}

export default function DailyMissionWidget() {
  const [tasks, setTasks] = useState<MissionTask[]>([
    { id: 'm1', title: '20 min Science: Universal Gravitation Video & Notes', duration: '20 min', subject: 'Science', slug: 'science', completed: false },
    { id: 'm2', title: '15 min Mathematics: Quadratic Equation Proof Drills', duration: '15 min', subject: 'Mathematics', slug: 'mathematics', completed: false },
    { id: 'm3', title: '10 High-Yield Board Exam MCQs & Speed Quiz', duration: '10 min', subject: 'All Subjects', slug: 'see', completed: false },
  ]);

  const [missionActive, setMissionActive] = useState(false);

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
    toast.success('Task progress updated!');
  };

  const completedCount = tasks.filter((t) => t.completed).length;
  const progressPct = Math.round((completedCount / tasks.length) * 100);

  const handleStartMission = () => {
    setMissionActive(true);
    toast.success('⚔️ TODAY\'S MISSION STARTED! 45-Minute Timer Active.');
  };

  return (
    <div className="bg-gradient-to-br from-card via-card to-amber-500/10 border-2 border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
      
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border-2 border-amber-500/30 flex items-center justify-center text-amber-600 shrink-0 shadow-md">
            <Swords size={28} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20 font-mono">
                DAILY ACADEMIC WARRIOR DRILL
              </span>
              <span className="text-xs font-bold text-amber-600 font-mono">🔥 18 DAY STREAK</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight flex items-center gap-2">
              TODAY&apos;S MISSION ⚔️
            </h2>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-card border border-border text-center shrink-0 min-w-[130px] font-mono">
          <span className="text-[9px] font-black uppercase text-muted-foreground block">ESTIMATED TIME</span>
          <span className="text-xl font-black text-amber-600 flex items-center justify-center gap-1">
            <Clock size={16} /> 45 MIN
          </span>
        </div>
      </div>

      {/* Mission Tasks Breakdown List */}
      <div className="space-y-3 font-sans">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase text-foreground font-mono">
            MISSION CHECKLIST ({completedCount} / {tasks.length} COMPLETED)
          </h3>
          <span className="text-xs font-bold text-amber-600 font-mono">{progressPct}% DONE</span>
        </div>

        <div className="space-y-2.5">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                task.completed
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-muted-foreground line-through'
                  : 'bg-card border-border hover:border-amber-500/40 text-foreground'
              }`}
            >
              <div
                onClick={() => toggleTask(task.id)}
                className="flex items-center gap-3 cursor-pointer flex-1"
              >
                <div
                  className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-colors ${
                    task.completed
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'border-border bg-card'
                  }`}
                >
                  {task.completed && <Check size={14} />}
                </div>

                <div>
                  <p className="text-xs sm:text-sm font-black text-foreground">{task.title}</p>
                  <span className="text-[10px] font-bold text-muted-foreground font-mono">{task.subject} · {task.duration}</span>
                </div>
              </div>

              <Link
                href={`/see/subject/${task.slug}`}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 font-bold text-xs shrink-0 transition-colors"
              >
                Start Task
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5 font-mono">
        <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-amber-500 to-orange-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Main START MISSION Action Button */}
      <div className="pt-2">
        <button
          onClick={handleStartMission}
          disabled={missionActive}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-600 to-amber-600 hover:from-amber-600 hover:to-orange-700 text-white font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 transition-all disabled:opacity-80"
        >
          <Swords size={20} />
          <span>{missionActive ? 'MISSION IN PROGRESS ⏱️ (45m TIMER)' : '[ START MISSION ⚔️ ]'}</span>
        </button>
      </div>

    </div>
  );
}
