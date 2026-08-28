'use client';

import React from 'react';
import {
  Trophy, Flame, Award, Coins, Zap, ShieldCheck, CheckCircle2,
  Sparkles, Swords, Star, Crown
} from 'lucide-react';

interface GamificationProps {
  levelNumber?: number;
  levelTitle?: string;
  xpPoints?: number;
  nextLevelXp?: number;
  coinsCount?: number;
  streakDays?: number;
  badges?: { id: string; title: string; unlocked: boolean; icon: string }[];
}

export default function StudentGamificationWidget({
  levelNumber = 7,
  levelTitle = 'SEE WARRIOR ⚔️',
  xpPoints = 7420,
  nextLevelXp = 10000,
  coinsCount = 1250,
  streakDays = 18,
  badges = [
    { id: 'b1', title: '100 MCQs', unlocked: true, icon: '⚡' },
    { id: 'b2', title: '7-Day Streak', unlocked: true, icon: '🔥' },
    { id: 'b3', title: 'First Mock', unlocked: true, icon: '📝' },
    { id: 'b4', title: 'Science Master', unlocked: true, icon: '🔬' },
    { id: 'b5', title: 'Arena Duelist', unlocked: false, icon: '⚔️' },
    { id: 'b6', title: 'Top 10% Nepal', unlocked: false, icon: '🏆' },
  ],
}: GamificationProps) {
  const xpPercentage = Math.min(100, Math.round((xpPoints / nextLevelXp) * 100));

  return (
    <div className="bg-card border-2 border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
      
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Level Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-border">
        
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border-2 border-amber-500/30 flex flex-col items-center justify-center text-center shrink-0 shadow-md">
            <span className="text-[10px] font-black uppercase text-amber-600 font-mono leading-none">LEVEL</span>
            <span className="text-2xl font-black text-amber-600 font-mono leading-none">0{levelNumber}</span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20 font-mono">
                STUDENT RANK BADGE
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
              {levelTitle}
            </h2>
            <div className="flex items-center gap-3 text-xs font-mono font-bold">
              <span className="text-amber-600">XP {xpPoints.toLocaleString()}</span>
              <span className="text-muted-foreground">/ {nextLevelXp.toLocaleString()} XP</span>
            </div>
          </div>
        </div>

        {/* XP Level Progress Bar & Streak Box */}
        <div className="flex items-center gap-4">
          
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center shrink-0 min-w-[120px]">
            <span className="text-[9px] font-black uppercase text-amber-600 block font-mono">ACTIVE STREAK</span>
            <span className="text-2xl font-black text-amber-600 flex items-center justify-center gap-1 font-mono">
              🔥 {streakDays} DAYS
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center shrink-0 min-w-[120px]">
            <span className="text-[9px] font-black uppercase text-emerald-600 block font-mono">COINS BALANCE</span>
            <span className="text-2xl font-black text-emerald-600 flex items-center justify-center gap-1 font-mono">
              🪙 {coinsCount}
            </span>
          </div>

        </div>

      </div>

      {/* Level XP Progress Bar */}
      <div className="space-y-1.5 font-mono">
        <div className="flex justify-between text-xs font-bold">
          <span className="text-foreground">Level 0{levelNumber} Progress ({xpPercentage}%)</span>
          <span className="text-amber-600">{nextLevelXp - xpPoints} XP to Level 0{levelNumber + 1}</span>
        </div>
        <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-amber-500 to-orange-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${xpPercentage}%` }}
          />
        </div>
      </div>

      {/* Badges Collection Grid */}
      <div className="p-6 rounded-3xl bg-muted/20 border border-border space-y-4 font-sans">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black uppercase text-foreground tracking-wider flex items-center gap-2 font-mono">
            <Trophy size={16} className="text-amber-500" />
            🏆 UNLOCKED ACADEMIC BADGES
          </h3>
          <span className="text-xs text-amber-600 font-bold font-mono">
            {badges.filter((b) => b.unlocked).length} / {badges.length} UNLOCKED
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {badges.map((b) => (
            <div
              key={b.id}
              className={`p-3.5 rounded-2xl border text-center space-y-1.5 transition-all ${
                b.unlocked
                  ? 'bg-amber-500/10 border-amber-500/30 text-foreground shadow-sm'
                  : 'bg-muted/30 border-border/60 text-muted-foreground opacity-50 grayscale'
              }`}
            >
              <div className="text-2xl">{b.icon}</div>
              <div className="text-xs font-bold font-mono">
                {b.unlocked ? <span className="text-emerald-500 font-black mr-1">✓</span> : null}
                {b.title}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
