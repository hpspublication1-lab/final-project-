'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Coins,
  ExternalLink,
  Flame,
  KeyRound,
  MessageCircle,
  Radio,
  ShieldCheck,
  Trophy,
  Users,
  Zap,
} from 'lucide-react';
import { SUPPORT_CONFIG } from '@/lib/config/support';
import { DashboardData } from '../types';

interface WorkspaceRailProps {
  data: DashboardData;
  streakFreezeArmed: boolean;
  onToggleStreakFreeze: () => void;
  onOpenStreakRepair: () => void;
  onOpenRedeem: () => void;
}

function RailCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-xs space-y-3">
      {children}
    </div>
  );
}

function RailLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-zinc-500 px-1">
      {children}
    </p>
  );
}

export default function WorkspaceRail({
  data,
  streakFreezeArmed,
  onToggleStreakFreeze,
  onOpenStreakRepair,
  onOpenRedeem,
}: WorkspaceRailProps) {
  const streakDays = data.gamification?.streakDays ?? data.weeklyProgress.currentStreak;
  const weeklyHours = Math.round((data.weeklyProgress.totalMinutesThisWeek / 60) * 10) / 10;

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <RailLabel>Today</RailLabel>

        {data.upcomingLiveClass ? (
          <RailCard>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                {data.upcomingLiveClass.status === 'live' ? 'Live now' : 'Next class'}
              </span>
              <span className="text-xs font-mono tabular-nums text-muted-foreground">
                {data.upcomingLiveClass.durationMins}m
              </span>
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-foreground leading-snug tracking-tight">
                {data.upcomingLiveClass.title}
              </h4>
              <p className="text-xs text-muted-foreground">
                {data.upcomingLiveClass.instructorName
                  ? `${data.upcomingLiveClass.instructorName} · `
                  : ''}
                {new Date(data.upcomingLiveClass.scheduledAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
            <Link
              href="/live-classes"
              className="min-h-11 w-full rounded-xl bg-primary hover:bg-primary-dark text-white font-semibold text-xs inline-flex items-center justify-center gap-1.5 transition-colors"
            >
              <Radio size={14} />
              Join classroom
            </Link>
          </RailCard>
        ) : (
          <RailCard>
            <h4 className="text-sm font-semibold text-foreground tracking-tight">Live classroom</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              No live session right now. Recordings stay available in the vault.
            </p>
            <Link
              href="/live-classes"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline min-h-11"
            >
              Browse recordings
              <ArrowRight size={12} />
            </Link>
          </RailCard>
        )}

        {data.gamification && (
          <RailCard>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground inline-flex items-center gap-1.5">
                <Trophy size={14} className="text-primary" />
                Progress
              </span>
              <span className="text-xs font-mono tabular-nums font-semibold px-2 py-0.5 rounded-md bg-primary/10 text-primary">
                Lvl {data.gamification.levelNumber}
              </span>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{data.gamification.levelTitle}</span>
                <span className="font-mono tabular-nums text-muted-foreground">
                  {data.gamification.xpPoints % 1000} / 1000 XP
                </span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{
                    width: `${Math.min(100, Math.round(((data.gamification.xpPoints % 1000) / 1000) * 100))}%`,
                  }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="p-2.5 rounded-xl bg-muted/40 text-center">
                <span className="text-[10px] text-muted-foreground block">Coins</span>
                <span className="text-xs font-semibold font-mono tabular-nums text-foreground inline-flex items-center justify-center gap-1">
                  <Coins size={12} className="text-amber-500" />
                  {data.gamification.coinsCount}
                </span>
              </div>
              <Link
                href="/leaderboard"
                className="p-2.5 rounded-xl bg-muted/40 hover:bg-primary/10 transition-colors text-center min-h-11"
              >
                <span className="text-[10px] text-muted-foreground block">Rank</span>
                <span className="text-xs font-semibold font-mono tabular-nums text-primary">
                  #{data.gamification.rankPosition}
                </span>
              </Link>
            </div>
          </RailCard>
        )}

        <RailCard>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-foreground inline-flex items-center gap-1.5">
              <Flame size={14} className="text-amber-500" />
              Consistency
            </span>
            <span className="text-xs font-mono tabular-nums font-semibold text-foreground">
              {streakDays}d streak
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Weekly questions</span>
              <span className="font-semibold font-mono tabular-nums text-foreground">
                {data.weeklyProgress.totalQuestionsThisWeek} / 150
              </span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full"
                style={{
                  width: `${Math.min(100, (data.weeklyProgress.totalQuestionsThisWeek / 150) * 100)}%`,
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1.5 items-end h-12">
            {data.weeklyProgress.days.map((day) => {
              const maxVal = Math.max(25, ...data.weeklyProgress.days.map((d) => d.questionsSolved));
              const heightPct = Math.max(12, Math.round((day.questionsSolved / maxVal) * 100));
              return (
                <div key={day.dateStr} className="flex flex-col items-center gap-1 h-full justify-end">
                  <div
                    className={`w-full rounded-md ${
                      day.isToday ? 'bg-primary' : day.questionsSolved > 0 ? 'bg-primary/40' : 'bg-muted'
                    }`}
                    style={{ height: `${heightPct}%` }}
                    title={`${day.dayName}: ${day.questionsSolved} questions`}
                  />
                  <span
                    className={`text-[9px] font-semibold ${
                      day.isToday ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    {day.dayName.slice(0, 1)}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onToggleStreakFreeze}
              className={`flex-1 min-h-11 px-2 rounded-xl border text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                streakFreezeArmed
                  ? 'bg-primary/10 text-primary border-primary/20'
                  : 'bg-muted text-muted-foreground border-border hover:text-foreground'
              }`}
            >
              <ShieldCheck size={13} />
              {streakFreezeArmed ? 'Freeze on' : 'Arm freeze'}
            </button>
            <button
              type="button"
              onClick={onOpenStreakRepair}
              className="flex-1 min-h-11 px-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground border border-border text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Zap size={13} />
              Repair
            </button>
          </div>
        </RailCard>
      </section>

      <section className="space-y-3">
        <RailLabel>Support</RailLabel>

        <RailCard>
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-muted text-foreground flex items-center justify-center shrink-0">
              <MessageCircle size={16} />
            </span>
            <div>
              <h4 className="text-xs font-semibold text-foreground">Academic mentor</h4>
              <p className="text-[11px] text-muted-foreground">Study plan and batch questions</p>
            </div>
          </div>
          <a
            href={`https://wa.me/${SUPPORT_CONFIG.whatsappNumber}?text=${encodeURIComponent(
              'Hello Samyak Academic Team! I need guidance with my study plan.'
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-11 w-full rounded-xl bg-muted hover:bg-muted/80 text-foreground font-semibold text-xs inline-flex items-center justify-center gap-1.5 border border-border"
          >
            WhatsApp mentor
            <ExternalLink size={12} />
          </a>
        </RailCard>

        <RailCard>
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-muted text-foreground flex items-center justify-center shrink-0">
              <Users size={16} />
            </span>
            <div>
              <h4 className="text-xs font-semibold text-foreground">Parent update</h4>
              <p className="text-[11px] text-muted-foreground">
                {data.weeklyProgress.totalMinutesThisWeek} min · {streakDays} day streak
              </p>
            </div>
          </div>
          <a
            href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
              `नमस्ते बुवा/आमा!\n\nSamyak बाट यो हप्ताको अध्ययन प्रगति:\nअध्ययन समय: ${data.weeklyProgress.totalMinutesThisWeek} मिनेट (${weeklyHours} घण्टा)\nStreak: ${streakDays} दिन\nप्रश्न: ${data.weeklyProgress.totalQuestionsThisWeek} MCQs`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-11 w-full rounded-xl bg-muted hover:bg-muted/80 text-foreground font-semibold text-xs inline-flex items-center justify-center gap-1.5 border border-border"
          >
            Share weekly report
            <ExternalLink size={12} />
          </a>
        </RailCard>

        <RailCard>
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <KeyRound size={16} />
            </span>
            <div>
              <h4 className="text-xs font-semibold text-foreground">Activation key</h4>
              <p className="text-[11px] text-muted-foreground">Redeem a book voucher</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenRedeem}
            className="min-h-11 w-full rounded-xl bg-primary hover:bg-primary-dark text-white font-semibold text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer"
          >
            Redeem key
          </button>
        </RailCard>
      </section>
    </div>
  );
}
