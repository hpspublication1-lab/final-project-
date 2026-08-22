'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Languages, Mic, Award, Sparkles, BookOpen, CheckCircle, ArrowRight, Headphones, FileEdit, Volume2, Trophy, BarChart2 } from 'lucide-react';

interface PortalViewProps {
  displayName: string;
  isPro: boolean;
}

const ieltsModules = [
  {
    id: 'speaking',
    title: 'Speaking Cue Card Simulator',
    icon: Mic,
    desc: 'Record your voice on real Part 2 topics and get instant AI pronunciation & fluency band scores.',
    badge: 'AI LIVE SCORING',
    color: 'border-amber-500/20 bg-amber-500/5 text-amber-600',
    link: '/english',
    actionText: 'Start Speaking Drill',
  },
  {
    id: 'writing',
    title: 'Writing Task 1 & 2 Evaluator',
    icon: FileEdit,
    desc: 'Submit academic essays and get detailed rubric breakdowns on Task Response, Coherence & Lexical Resource.',
    badge: 'BAND 8.0+ RUBRIC',
    color: 'border-blue-500/20 bg-blue-500/5 text-blue-600',
    link: '/english',
    actionText: 'Evaluate Essay',
  },
  {
    id: 'listening',
    title: 'Listening Audio Modules',
    icon: Headphones,
    desc: 'Practice Cambridge-standard audio passages with real-time accent adaptation and timed answer sheets.',
    badge: '40 QUESTIONS / TEST',
    color: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-600',
    link: '/courses?sector=english',
    actionText: 'Practice Audio',
  },
  {
    id: 'reading',
    title: 'Reading Speed Strategies',
    icon: BookOpen,
    desc: 'Master skimming, scanning, True/False/Not Given, and paragraph matching under 60-minute time constraints.',
    badge: 'ACADEMIC & GT',
    color: 'border-purple-500/20 bg-purple-500/5 text-purple-600',
    link: '/courses?sector=english',
    actionText: 'Read Passages',
  },
];

export default function IeltsPortalView({ displayName }: PortalViewProps) {
  const [speakingScore, setSpeakingScore] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const handleTestSimulator = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setIsSimulating(false);
      setSpeakingScore('Overall IELTS Speaking Band: 8.0 (Fluency: 8.5, Lexical Resource: 8.0, Grammatical Range: 7.5, Pronunciation: 8.0)');
    }, 1800);
  };

  return (
    <div className="space-y-6">
      {/* IELTS Portal Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-amber-500/15 via-card to-orange-500/10 border border-amber-500/20 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-amber-600 text-white text-xs font-bold flex items-center gap-1 shadow-xs">
              <Languages size={15} /> IELTS &amp; English Mastery Portal
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">
              Academic &amp; General Training
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            Target Band 8.0+, {displayName} 🎓
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Complete 4-module mastery with AI Speaking Examiners, Essay Correctors &amp; Full Mock Tests.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-card border border-amber-500/30 text-xs font-bold text-amber-600">
            <Award size={16} className="text-amber-500" />
            <span>Target: Band 8.0+</span>
          </div>
          <Link
            href="/english"
            className="px-4.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-amber-600/20 transition-all"
          >
            <span>Live Practice Hub</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* 4 Core IELTS Modules Grid */}
      <div>
        <h2 className="text-base font-extrabold text-foreground mb-4 flex items-center gap-2">
          <Sparkles size={17} className="text-amber-500" /> 4 Core Examination Skills
        </h2>
        <div className="grid md:grid-cols-2 gap-5">
          {ieltsModules.map((mod) => {
            const Icon = mod.icon;
            return (
              <div
                key={mod.id}
                className="p-6 rounded-3xl bg-card border border-border hover:border-amber-500/40 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center border ${mod.color}`}>
                      <Icon size={20} />
                    </div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-muted border border-border text-foreground">
                      {mod.badge}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-foreground">{mod.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{mod.desc}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-border/50 flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">Unlimited AI Drills</span>
                  <Link
                    href={mod.link}
                    className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
                  >
                    <span>{mod.actionText}</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive AI Speaking Cue Card Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-600 via-orange-600 to-amber-700 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-[11px] font-bold">
            <Mic size={13} /> AI Speaking Examiner Demo
          </div>
          <h3 className="text-xl sm:text-2xl font-black">Practice Speaking Part 2 in Real-Time</h3>
          <p className="text-xs sm:text-sm text-amber-100 leading-relaxed">
            Topic: &ldquo;Describe an unforgettable journey you have taken. Explain where you went, whom you went with, and why it was memorable.&rdquo;
          </p>
          {speakingScore && (
            <div className="p-3 rounded-xl bg-white/20 border border-white/30 text-xs font-semibold mt-2 animate-fadeIn">
              ✨ {speakingScore}
            </div>
          )}
        </div>

        <button
          onClick={handleTestSimulator}
          disabled={isSimulating}
          className="px-6 py-3.5 rounded-2xl bg-white text-amber-900 font-black text-xs sm:text-sm hover:bg-amber-50 transition-all shadow-lg shrink-0 flex items-center gap-2 disabled:opacity-70"
        >
          <Mic size={16} />
          <span>{isSimulating ? 'Analyzing Acoustic Intonation...' : 'Test AI Speaking Voice'}</span>
        </button>
      </div>
    </div>
  );
}
