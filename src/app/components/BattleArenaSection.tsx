'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Swords, Zap, Trophy, Users, Clock, Star } from 'lucide-react';

function LiveBattleDemo() {
  const [progress, setProgress] = useState({ p1: 3, p2: 2 });
  const [time, setTime] = useState(47);

  useEffect(() => {
    const id = setInterval(() => {
      setTime((t) => (t > 0 ? t - 1 : 60));
      setProgress((p) => ({
        p1: Math.min(10, p?.p1 + (Math.random() > 0.7 ? 1 : 0)),
        p2: Math.min(10, p?.p2 + (Math.random() > 0.65 ? 1 : 0)),
      }));
    }, 2000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="bg-gradient-battle rounded-2xl p-6 text-white max-w-md w-full mx-auto">
      <div className="flex items-center justify-between mb-4">
        <span className="flex items-center gap-1.5 bg-error/20 text-red-300 text-xs font-bold px-2.5 py-1 rounded-full border border-red-500/30">
          <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
          LIVE BATTLE
        </span>
        <span className="flex items-center gap-1 font-mono text-sm font-bold text-yellow-300">
          <Clock size={13} />
          {String(Math.floor(time / 60))?.padStart(2, '0')}:{String(time % 60)?.padStart(2, '0')}
        </span>
      </div>
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 text-center">
          <div className="w-12 h-12 rounded-full bg-primary/30 border-2 border-primary/60 flex items-center justify-center mx-auto mb-1 text-lg font-bold">P</div>
          <p className="text-xs font-semibold">Priya T.</p>
          <p className="font-mono text-2xl font-bold text-accent mt-1">{progress?.p1 * 4}</p>
          <p className="text-xs text-gray-400">{progress?.p1}/10 correct</p>
        </div>

        <div className="flex flex-col items-center gap-1">
          <Swords size={24} className="text-yellow-400" />
          <span className="text-xs text-gray-400">Biology</span>
        </div>

        <div className="flex-1 text-center">
          <div className="w-12 h-12 rounded-full bg-chem/30 border-2 border-chem/60 flex items-center justify-center mx-auto mb-1 text-lg font-bold">A</div>
          <p className="text-xs font-semibold">Aarav S.</p>
          <p className="font-mono text-2xl font-bold text-chem mt-1">{progress?.p2 * 4}</p>
          <p className="text-xs text-gray-400">{progress?.p2}/10 correct</p>
        </div>
      </div>
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-white/10 rounded-full h-2">
            <div
              className="h-2 rounded-full bg-accent transition-all duration-500"
              style={{ width: `${(progress?.p1 / 10) * 100}%` }}
            />
          </div>
          <span className="text-xs text-gray-400 w-8 text-right tabular-nums">{Math.round((progress?.p1 / 10) * 100)}%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-white/10 rounded-full h-2">
            <div
              className="h-2 rounded-full bg-chem transition-all duration-500"
              style={{ width: `${(progress?.p2 / 10) * 100}%` }}
            />
          </div>
          <span className="text-xs text-gray-400 w-8 text-right tabular-nums">{Math.round((progress?.p2 / 10) * 100)}%</span>
        </div>
      </div>
      <p className="text-center text-xs text-gray-400">Question 7 of 10 — Cell Membrane Transport</p>
    </div>
  );
}

export default function BattleArenaSection() {
  return (
    <section id="battle" className="py-20 bg-background relative overflow-hidden w-full max-w-full">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />
      <div className="absolute top-1/2 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />

      <div className="relative max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          
          {/* Battle Arena Interactive Preview Simulator */}
          <div className="relative flex justify-center">
            <div className="glass-card-interactive border-2 border-primary/30 rounded-3xl p-6 sm:p-7 text-white max-w-md w-full shadow-2xl relative overflow-hidden bg-gradient-battle">
              <LiveBattleDemo />
            </div>
          </div>

          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 bg-secondary border border-primary/20 text-primary text-xs sm:text-sm font-extrabold px-3.5 py-1.5 rounded-full shadow-xs">
              <Swords size={15} className="animate-bounce" />
              REAL-TIME MULTIPLAYER BATTLES
            </div>

            <h2 className="text-hero-md text-foreground font-black tracking-tight">
              Challenge a Friend.{' '}
              <span className="bg-gradient-to-r from-primary to-[#7C6BFF] bg-clip-text text-transparent">
                Beat the Clock.
              </span>
            </h2>

            <p className="text-muted-foreground leading-relaxed text-base">
              Nepal&apos;s first real-time 2-player exam arena — same questions, synchronous countdown timer, real-time score updates. Test your speed and precision against top rankers.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {[
                { key: 'bf-quick', icon: Zap, title: 'Quick Match', desc: 'Auto-match by subject & skill', color: 'text-primary', bg: 'bg-secondary' },
                { key: 'bf-private', icon: Users, title: 'Private Room', desc: 'Share room code, challenge friends', color: 'text-bio', bg: 'bg-bio-light' },
                { key: 'bf-rank', icon: Trophy, title: 'ELO Ranking', desc: 'Climb the battle leaderboard', color: 'text-ma', bg: 'bg-ma-light' },
                { key: 'bf-server', icon: Star, title: 'Exam Timer', desc: 'Fair play, anti-cheat protection', color: 'text-chem', bg: 'bg-chem-light' },
              ]?.map((f) => (
                <div key={f?.key} className="card-base glass-card-interactive flex items-start gap-3.5 p-4 border border-border/70 hover:border-primary/40">
                  <div className={`w-10 h-10 rounded-xl ${f?.bg} flex items-center justify-center shrink-0 shadow-xs`}>
                    <f.icon size={20} className={f?.color} />
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-foreground">{f?.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 font-medium">{f?.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <Link href="/battle-arena" className="btn-primary gap-2.5 text-base py-3.5 px-7 font-bold shadow-lg hover:shadow-primary/30">
                <Swords size={18} />
                Enter Battle Arena Now
              </Link>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}