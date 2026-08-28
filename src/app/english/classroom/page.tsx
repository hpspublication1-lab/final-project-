'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import PublicNav from '@/components/PublicNav';
import StudentWeaknessEngineWidget from '@/components/english/StudentWeaknessEngineWidget';
import {
  Video, Mic, PenTool, BookOpen, Headphones, Sparkles, Award, BarChart2,
  Brain, Target, ArrowRight, CheckCircle2, Zap, Flame, Globe
} from 'lucide-react';

const CLASSROOM_MODULES = [
  {
    id: 'speaking_sim',
    icon: Mic,
    title: '🎤 Speaking Simulator',
    description: 'Full 3-part Cambridge Speaking Exam simulator (Part 1 Intro, Part 2 Cue Card timer, Part 3 Abstract Discussion).',
    routePath: '/english/speaking/simulator',
    badge: '3-PART SIMULATOR',
    badgeBg: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  },
  {
    id: 'live_teacher',
    icon: Video,
    title: '👩‍🏫 AI LIVE Teacher Avatar',
    description: '1-on-1 spoken WebRTC / WebSocket AI teacher stage with viseme mouth lip-sync and live blackboard notes.',
    routePath: '/live-teacher',
    badge: 'AI LIVE REALTIME',
    badgeBg: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  },
  {
    id: 'writing_eval',
    icon: PenTool,
    title: '✍️ Writing Evaluator',
    description: 'Instant Band 9.0 Examiner scoring for Task 1 academic charts & Task 2 opinion/discussion essays.',
    routePath: '/english/syllabus#live-essay-evaluator',
    badge: 'TASK 1 & TASK 2',
    badgeBg: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
  },
  {
    id: 'writing_rubric',
    icon: BookOpen,
    title: '📋 Cambridge Rubric Explorer',
    description: 'Detailed examiner band descriptor rubric breakdown across TR, CC, LR, and GRA for Bands 6, 7, and 9.',
    routePath: '/english/writing/rubric',
    badge: 'BAND RUBRICS',
    badgeBg: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
  },
  {
    id: 'listening_trainer',
    icon: Headphones,
    title: '🎧 Listening Audio Sets',
    description: 'Multi-accent ElevenLabs audio sets (British, Australian, US) with synchronized transcript and auto-grading.',
    routePath: '/english/listening',
    badge: 'AUDIO PRACTICE SETS',
    badgeBg: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  },
  {
    id: 'speed_drills',
    icon: Zap,
    title: '📖 Reading Speed Drills',
    description: 'WPM target trainer (200 WPM to 500 WPM) with skimming/scanning stopwatch and comprehension checks.',
    routePath: '/english/reading/speed-drills',
    badge: 'WPM SPEED TRAINER',
    badgeBg: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  },
  {
    id: 'vocab_engine',
    icon: BookOpen,
    title: '📚 Vocabulary Engine',
    description: 'Academic Word List (AWL) & C1/C2 lexical upgrades with collocations, audio pronunciation, and essay examples.',
    routePath: '/english/vocabulary',
    badge: 'AWL C1/C2 VAULT',
    badgeBg: 'bg-violet-500/10 text-violet-600 border-violet-500/20',
  },
  {
    id: 'grammar_coach',
    icon: Brain,
    title: '🧠 Grammar Coach',
    description: 'Complex sentence builders, passive voice transformations, conditional clauses, and IT technical interview STAR drills.',
    routePath: '/english/it-english',
    badge: 'IT TECH STAR DRILL',
    badgeBg: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
  },
  {
    id: 'band_predictor',
    icon: BarChart2,
    title: '📊 Band Predictor',
    description: 'Calculate your calibrated 4-skill IELTS overall band score using official Cambridge half-band rounding formulas.',
    routePath: '/english/band-predictor',
    badge: 'SCORE CALIBRATOR',
    badgeBg: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
  },
  {
    id: 'study_plan',
    icon: Target,
    title: '🎯 Personalized Study Plan',
    description: 'Masterclass 8-Week Curriculum Roadmap guided by the AI Master Weakness Engine and active bottleneck detector.',
    routePath: '/english/syllabus',
    badge: '8-WEEK ROADMAP',
    badgeBg: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  },
  {
    id: 'duolingo_det',
    icon: Zap,
    title: '⚡ Duolingo DET IT Engine',
    description: 'Duolingo English Test 10–160 scale subscores (Literacy, Comprehension, Conversation, Production).',
    routePath: '/english/duolingo',
    badge: 'DET 10-160 SCALE',
    badgeBg: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  },
];

export default function IELTSClassroomHubPage() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (isDark) {
      document.documentElement?.classList?.add('dark');
    } else {
      document.documentElement?.classList?.remove('dark');
    }
  }, [isDark]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <PublicNav isDark={isDark} onToggleDark={() => setIsDark(!isDark)} />

      {/* Hero Section */}
      <section className="pt-28 pb-10 bg-gradient-to-b from-amber-500/10 via-card to-background border-b border-border">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 text-amber-600 text-xs font-black border border-amber-500/20">
            <Sparkles size={14} /> FLAGSHIP DEMO PLATFORM
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight leading-tight">
            🧑‍🏫 SAMYAK AI <span className="text-amber-600">IELTS CLASSROOM</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl mx-auto font-medium">
            Your personalized Band 8.5+ AI teacher. Sees your goal, explains strategies, asks questions, listens to speech, corrects writing, gives exercises, and remembers your weaknesses.
          </p>

          {/* 5-Skill Pipeline Architecture Banner */}
          <div className="max-w-3xl mx-auto p-4 rounded-2xl bg-card border border-border shadow-md space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-600">
              ⚡ SAMYAK 5-SKILL AI TEACHER PIPELINE
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs font-black">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
                🗣️ Speaking<br />
                <span className="text-[9px] font-normal text-muted-foreground">Live Conversation</span>
              </div>
              <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-600 border border-cyan-500/20">
                ✍️ Writing<br />
                <span className="text-[9px] font-normal text-muted-foreground">Live Correction</span>
              </div>
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 border border-blue-500/20">
                📖 Reading<br />
                <span className="text-[9px] font-normal text-muted-foreground">Guided Practice</span>
              </div>
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 border border-purple-500/20">
                🎧 Listening<br />
                <span className="text-[9px] font-normal text-muted-foreground">Audio Drills</span>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 col-span-2 sm:col-span-1">
                💡 Vocabulary<br />
                <span className="text-[9px] font-normal text-muted-foreground">Adaptive Engine</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Workspace */}
      <section className="py-8 max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1 space-y-10">
        
        {/* Dual Student Skill Tree & Master Weakness Engine */}
        <StudentWeaknessEngineWidget />

        {/* 10-Module Grid */}
        <div className="space-y-6">
          <div className="text-center max-w-xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-black text-foreground">Explore 10 AI Classroom Modules</h2>
            <p className="text-xs text-muted-foreground mt-1">Click any module to launch your dedicated practice session</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {CLASSROOM_MODULES.map((mod) => (
              <Link
                key={mod.id}
                href={mod.routePath}
                className="bg-card border border-border rounded-3xl p-6 hover:border-amber-500/40 hover:shadow-xl transition-all flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
                      <mod.icon size={22} />
                    </div>
                    <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${mod.badgeBg}`}>
                      {mod.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-black text-foreground group-hover:text-amber-600 transition-colors">
                      {mod.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {mod.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-black text-amber-600 pt-2 border-t border-border/60">
                  <span>Launch Module</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </div>

      </section>
    </div>
  );
}
