'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Flame, Target, Trophy, Swords, AlertTriangle, TrendingUp, TrendingDown, ArrowRight, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// CEE countdown hook with Nepal Standard Time (+05:45)
function useCEEDays() {
  const targetStr = process.env.NEXT_PUBLIC_CEE_EXAM_DATE || '2027-04-15T08:00:00+05:45';
  const target = new Date(targetStr);
  const now = new Date();
  const diffDays = Math.ceil((target.getTime() - now.getTime()) / 86400000);
  return {
    days: Math.max(0, diffDays),
    isExpired: diffDays <= 0,
    targetYear: target.getFullYear(),
  };
}

interface KPIStats {
  studyStreak: number;
  overallAccuracy: number;
  accuracyDelta: number;
  rankPosition: number | null;
  totalStudents: number;
  battleWins: number;
  battleTotal: number;
  weakTopicsCount: number;
}

export default function KPIBentoGrid() {
  const ceeCountdown = useCEEDays();
  const { user, profile } = useAuth();
  const [stats, setStats] = useState<KPIStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    const fetchStats = async () => {
      setLoading(true);
      try {
        const supabase = createClient();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

        // Fetch all in parallel
        const [practiceRecent, practicePrev, battleResults, weakTopics, totalStudents] = await Promise.all([
          // Last 30 days practice accuracy
          supabase
            .from('practice_attempts')
            .select('is_correct')
            .eq('student_id', user.id)
            .gte('created_at', thirtyDaysAgo.toISOString()),

          // 30-60 days ago practice accuracy (for delta)
          supabase
            .from('practice_attempts')
            .select('is_correct')
            .eq('student_id', user.id)
            .gte('created_at', sixtyDaysAgo.toISOString())
            .lt('created_at', thirtyDaysAgo.toISOString()),

          // Battle results
          supabase
            .from('battle_results')
            .select('is_winner')
            .eq('player_id', user.id),

          // Weak topics count
          supabase
            .from('topic_mastery')
            .select('id', { count: 'exact', head: true })
            .eq('student_id', user.id)
            .in('mastery_level', ['critical', 'weak']),

          // Total active students for rank context
          supabase
            .from('user_profiles')
            .select('id', { count: 'exact', head: true })
            .eq('is_active', true),
        ]);

        // Compute accuracy
        const recentAttempts = practiceRecent.data || [];
        const recentCorrect = recentAttempts.filter((r: any) => r.is_correct).length;
        const overallAccuracy = recentAttempts.length > 0
          ? Math.round((recentCorrect / recentAttempts.length) * 100 * 10) / 10
          : 0;

        const prevAttempts = practicePrev.data || [];
        const prevCorrect = prevAttempts.filter((r: any) => r.is_correct).length;
        const prevAccuracy = prevAttempts.length > 0
          ? Math.round((prevCorrect / prevAttempts.length) * 100 * 10) / 10
          : 0;
        const accuracyDelta = Math.round((overallAccuracy - prevAccuracy) * 10) / 10;

        // Battle stats
        const battles = battleResults.data || [];
        const battleWins = battles.filter((b: any) => b.is_winner).length;

        setStats({
          studyStreak: profile?.study_streak || 0,
          overallAccuracy,
          accuracyDelta,
          rankPosition: profile?.rank_position || null,
          totalStudents: totalStudents.count || 0,
          battleWins,
          battleTotal: battles.length,
          weakTopicsCount: weakTopics.count || 0,
        });
      } catch {
        // Fall back to profile data only
        setStats({
          studyStreak: profile?.study_streak || 0,
          overallAccuracy: 0,
          accuracyDelta: 0,
          rankPosition: profile?.rank_position || null,
          totalStudents: 0,
          battleWins: 0,
          battleTotal: 0,
          weakTopicsCount: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user?.id, profile?.study_streak, profile?.rank_position]);

  const battleWinRate = stats && stats.battleTotal > 0
    ? Math.round((stats.battleWins / stats.battleTotal) * 100)
    : 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4 gap-4">
      {/* HERO: CEE Countdown — spans 2 cols, 2 rows */}
      <div className="col-span-2 row-span-2 bg-gradient-to-br from-primary via-primary-dark to-[#3726B0] rounded-3xl p-6 sm:p-7 text-white relative overflow-hidden flex flex-col justify-between min-h-[170px] shadow-xl border border-white/15">
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/10 -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-36 h-36 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/2 blur-xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/80 bg-black/25 px-2.5 py-0.5 rounded-full border border-white/15">Countdown</span>
            <span className="text-xs font-bold text-white/90">CEE Medical {ceeCountdown.targetYear}</span>
          </div>
          <p className="font-mono text-5xl sm:text-6xl font-black tabular-nums leading-none tracking-tight">{ceeCountdown.days}</p>
          <p className="text-white/80 text-xs font-semibold mt-1.5 uppercase tracking-wide">
            {ceeCountdown.isExpired ? 'Session Completed · Preparing Next Batch' : 'Days Remaining Until Entrance'}
          </p>
        </div>
        <div className="relative z-10 pt-4">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="flex-1 bg-white/25 rounded-full h-2 overflow-hidden backdrop-blur-sm">
              <div className="bg-gradient-to-r from-emerald-300 to-white h-2 rounded-full shadow-xs transition-all duration-500" style={{ width: `${Math.min(100, Math.round(((365 - ceeCountdown.days) / 365) * 100))}%` }} />
            </div>
            <span className="text-xs font-black text-white/90 tabular-nums">
              {Math.round(((365 - ceeCountdown.days) / 365) * 100)}%
            </span>
          </div>
          <Link href="/study-plan" className="inline-flex items-center gap-1.5 text-xs font-bold text-white/90 hover:text-white bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-xl transition-all border border-white/20">
            <span>View Today&apos;s Study Plan</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      {/* Streak */}
      <div className="card-luxury p-5 flex flex-col gap-2 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Study Streak</p>
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
            <Flame size={16} className="text-amber-500" />
          </div>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-4"><Loader2 size={16} className="animate-spin text-muted-foreground" /></div>
        ) : (
          <>
            <div>
              <p className="font-mono text-3xl font-black text-foreground tabular-nums">{stats?.studyStreak ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-0.5 font-medium">Consecutive days</p>
            </div>
            <div className="flex gap-1 mt-auto pt-2">
              {Array.from({ length: 7 })?.map((_, i) => (
                <div
                  key={`streak-day-${i}`}
                  className={`flex-1 h-1.5 rounded-full ${i < Math.min(7, stats?.studyStreak || 0) ? 'bg-amber-500' : 'bg-muted'}`}
                />
              ))}
            </div>
            {(stats?.studyStreak || 0) > 0 && (
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">🔥 On a roll!</p>
            )}
          </>
        )}
      </div>

      {/* Overall Accuracy */}
      <div className="card-luxury p-5 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Overall Accuracy</p>
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
            <Target size={16} className="text-emerald-500" />
          </div>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-4"><Loader2 size={16} className="animate-spin text-muted-foreground" /></div>
        ) : (
          <>
            <div>
              <p className="font-mono text-3xl font-black text-foreground tabular-nums">{stats?.overallAccuracy ?? 0}%</p>
              <p className="text-xs text-muted-foreground mt-0.5 font-medium">Last 30 days drills</p>
            </div>
            <div className="flex items-center gap-1 mt-auto pt-2">
              {(stats?.accuracyDelta || 0) >= 0 ? (
                <TrendingUp size={13} className="text-emerald-500" />
              ) : (
                <TrendingDown size={13} className="text-rose-500" />
              )}
              <span className={`text-[11px] font-bold ${(stats?.accuracyDelta || 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                {(stats?.accuracyDelta || 0) >= 0 ? '+' : ''}{stats?.accuracyDelta ?? 0}% vs last month
              </span>
            </div>
          </>
        )}
      </div>

      {/* Rank */}
      <div className="card-luxury p-5 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">National Rank</p>
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
            <Trophy size={16} className="text-primary" />
          </div>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-4"><Loader2 size={16} className="animate-spin text-muted-foreground" /></div>
        ) : (
          <>
            <div>
              <p className="font-mono text-3xl font-black text-foreground tabular-nums">
                {stats?.rankPosition ? `#${stats.rankPosition.toLocaleString()}` : '—'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                {stats?.totalStudents ? `of ${stats.totalStudents.toLocaleString()} students` : 'Complete tests to rank'}
              </p>
            </div>
            <div className="flex items-center gap-1 mt-auto pt-2">
              <TrendingUp size={13} className="text-primary" />
              <span className="text-[11px] text-primary font-bold">Verified percentile</span>
            </div>
          </>
        )}
      </div>

      {/* Battle Win Rate */}
      <div className="card-luxury p-5 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Battle Arena</p>
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
            <Swords size={16} className="text-purple-500" />
          </div>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-4"><Loader2 size={16} className="animate-spin text-muted-foreground" /></div>
        ) : (
          <>
            <div>
              <p className="font-mono text-3xl font-black text-foreground tabular-nums">{battleWinRate}%</p>
              <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                {stats?.battleWins ?? 0} wins / {stats?.battleTotal ?? 0} matches
              </p>
            </div>
            <div className="flex items-center gap-1 mt-auto pt-2">
              {battleWinRate >= 50 ? (
                <TrendingUp size={13} className="text-emerald-500" />
              ) : (
                <TrendingDown size={13} className="text-rose-500" />
              )}
              <span className={`text-[11px] font-bold ${battleWinRate >= 50 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                {battleWinRate >= 50 ? 'Above average' : 'Join live duels'}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Weak Topic Alert — spans 2 cols */}
      <div className="col-span-2 bg-error-light border border-error/20 rounded-2xl p-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-error/10 flex items-center justify-center shrink-0">
          <AlertTriangle size={20} className="text-error" />
        </div>
        <div className="flex-1 min-w-0">
          {loading ? (
            <p className="text-sm font-bold text-error">Loading weak topics...</p>
          ) : (stats?.weakTopicsCount || 0) > 0 ? (
            <>
              <p className="text-sm font-bold text-error">{stats?.weakTopicsCount} Critical Weak Topic{(stats?.weakTopicsCount || 0) > 1 ? 's' : ''} Detected</p>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                Review your weak topics to improve your score
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-bold text-success">No critical weak topics!</p>
              <p className="text-xs text-muted-foreground mt-0.5">Keep practicing to maintain your mastery.</p>
            </>
          )}
        </div>
        <Link
          href="/student-dashboard#weak"
          className="shrink-0 flex items-center gap-1 text-xs font-bold text-error bg-error/10 hover:bg-error/20 px-3 py-2 rounded-lg transition-colors whitespace-nowrap"
        >
          Review Now <ArrowRight size={12} />
        </Link>
      </div>
    </div>
  );
}