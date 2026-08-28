'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Swords, Zap, Trophy, Users, Clock, Star, Flame, Award, Shield, ArrowRight } from 'lucide-react';

const ARENA_CATEGORIES = [
  { id: 'cee', icon: '🩺', name: 'Samyak CEE Battle', topic: 'Medical Entrance MCQs', badge: 'CEE MEDICAL' },
  { id: 'see', icon: '🎓', name: 'Samyak SEE Battle', topic: 'Grade 10 Board Questions', badge: 'SEE CLASS 10' },
  { id: 'ielts', icon: '🌍', name: 'Samyak IELTS Vocab Duel', topic: 'AWL Lexical Speed Duel', badge: 'IELTS ENGLISH' },
  { id: 'grammar', icon: '🧠', name: 'Grammar Battle', topic: 'Sentence Error Duel', badge: 'GRAMMAR' },
  { id: 'ai_coding', icon: '💻', name: 'Coding & AI Challenge', topic: 'Python Syntax & Prompt Duel', badge: 'AI & TECH' },
];

function LiveBattleDemo() {
  const [progress, setProgress] = useState({ p1: 4, p2: 3 });
  const [time, setTime] = useState(42);
  const [activeCatIdx, setActiveCatIdx] = useState(0);

  const activeCat = ARENA_CATEGORIES[activeCatIdx];

  useEffect(() => {
    const id = setInterval(() => {
      setTime((t) => (t > 0 ? t - 1 : 45));
      setProgress((p) => ({
        p1: Math.min(10, p?.p1 + (Math.random() > 0.7 ? 1 : 0)),
        p2: Math.min(10, p?.p2 + (Math.random() > 0.65 ? 1 : 0)),
      }));
    }, 2000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white max-w-lg w-full mx-auto border border-amber-500/30 shadow-2xl space-y-5">
      
      {/* Category Tabs */}
      <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1 border-b border-white/10">
        {ARENA_CATEGORIES.map((cat, idx) => (
          <button
            key={cat.id}
            onClick={() => setActiveCatIdx(idx)}
            className={`px-2.5 py-1 rounded-xl text-[10px] font-black transition-all whitespace-nowrap ${
              activeCatIdx === idx
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {cat.icon} {cat.badge}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 bg-red-500/20 text-red-300 text-[10px] font-black px-3 py-1 rounded-full border border-red-500/30">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          LIVE ARENA MATCH
        </span>
        <span className="flex items-center gap-1 font-mono text-xs font-black text-amber-300">
          <Clock size={13} />
          {String(Math.floor(time / 60))?.padStart(2, '0')}:{String(time % 60)?.padStart(2, '0')}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 text-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto mb-1 text-lg font-black text-amber-300">
            P
          </div>
          <p className="text-xs font-bold">Priya T.</p>
          <p className="font-mono text-2xl font-black text-amber-400 mt-1">{progress?.p1 * 10}</p>
          <p className="text-[10px] text-slate-400 font-medium">{progress?.p1}/10 correct</p>
        </div>

        <div className="flex flex-col items-center gap-1">
          <Swords size={28} className="text-amber-400 animate-pulse" />
          <span className="text-[10px] text-amber-300 font-mono font-bold uppercase">{activeCat.topic}</span>
        </div>

        <div className="flex-1 text-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center mx-auto mb-1 text-lg font-black text-indigo-300">
            A
          </div>
          <p className="text-xs font-bold">Aarav S.</p>
          <p className="font-mono text-2xl font-black text-indigo-400 mt-1">{progress?.p2 * 10}</p>
          <p className="text-[10px] text-slate-400 font-medium">{progress?.p2}/10 correct</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-white/10 rounded-full h-2">
            <div
              className="h-2 rounded-full bg-amber-400 transition-all duration-500"
              style={{ width: `${(progress?.p1 / 10) * 100}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-300 font-mono w-8 text-right">{Math.round((progress?.p1 / 10) * 100)}%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-white/10 rounded-full h-2">
            <div
              className="h-2 rounded-full bg-indigo-400 transition-all duration-500"
              style={{ width: `${(progress?.p2 / 10) * 100}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-300 font-mono w-8 text-right">{Math.round((progress?.p2 / 10) * 100)}%</span>
        </div>
      </div>

      <p className="text-center text-[11px] text-slate-400 font-medium">
        Question 7 of 10 — {activeCat.name}
      </p>
    </div>
  );
}

export default function BattleArenaSection() {
  return (
    <section id="arena" className="py-20 bg-gradient-to-b from-slate-950 via-slate-900 to-background text-white relative overflow-hidden">
      
      {/* Glow Orbs */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column (7 cols): Identity & Verticals */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-black uppercase tracking-wider shadow-xs">
              <Swords size={14} className="animate-pulse" /> FLAGSHIP FEATURE
            </div>

            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              ⚔️ SAMYAK ARENA<br />
              <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 bg-clip-text text-transparent">
                Don&apos;t Just Study. Compete.
              </span>
            </h2>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl font-medium">
              Nepal&apos;s real-time 1v1 multiplayer learning arena with ELO ranking, exam timers, private rooms, and anti-cheat verification across all 5 verticals.
            </p>

            {/* 5 Vertical Arena Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                <span className="text-lg">🩺</span>
                <p className="text-xs font-bold text-white">CEE Battle</p>
                <p className="text-[10px] text-slate-400">Medical Entrance MCQs</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                <span className="text-lg">🎓</span>
                <p className="text-xs font-bold text-white">SEE Battle</p>
                <p className="text-[10px] text-slate-400">Class 10 Science &amp; Math</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                <span className="text-lg">🌍</span>
                <p className="text-xs font-bold text-white">IELTS Vocab Duel</p>
                <p className="text-[10px] text-slate-400">AWL Lexical Speed</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                <span className="text-lg">🧠</span>
                <p className="text-xs font-bold text-white">Grammar Battle</p>
                <p className="text-[10px] text-slate-400">Structure Error Duel</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                <span className="text-lg">💻</span>
                <p className="text-xs font-bold text-white">Coding &amp; AI Challenge</p>
                <p className="text-[10px] text-slate-400">Python Syntax &amp; Prompts</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 pt-4">
              <Link
                href="/match-lobby"
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2.5 shadow-xl shadow-amber-500/20 hover:scale-[1.02] transition-all"
              >
                <Swords size={18} />
                <span>Enter Samyak Arena Lobby</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          {/* Right Column (5 cols): Live Demo Component */}
          <div className="lg:col-span-5 flex justify-center">
            <LiveBattleDemo />
          </div>

        </div>
      </div>
    </section>
  );
}