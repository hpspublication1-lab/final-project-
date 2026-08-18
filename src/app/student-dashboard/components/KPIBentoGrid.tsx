'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Flame, Target, Trophy, Swords, AlertTriangle, TrendingUp, TrendingDown, ArrowRight, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// CEE countdown hook
function useCEEDays() {
  const target = new Date('2026-04-15T08:00:00');
  const now = new Date();
  return Math.max(0, Math.floor((target?.getTime() - now?.getTime()) / 86400000));
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
  const ceeDays = useCEEDays();
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
      <div className="col-span-2 row-span-2 bg-gradient-to-br from-primary to-primary-dark rounded-2xl p-5 sm:p-6 text-white relative overflow-hidden flex flex-col justify-between min-h-[160px]">
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10">
          <p className="text-white/70 text-xs font-medium uppercase tracking-wider mb-1">CEE 2026 Countdown</p>
          <p className="font-mono text-5xl sm:text-6xl font-bold tabular-nums leading-none">{ceeDays}</p>
          <p className="text-white/70 text-sm mt-1">days remaining</p>
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 bg-white/20 rounded-full h-2">
              <div className="bg-white h-2 rounded-full" style={{ width: `${Math.min(100, Math.round(((365 - ceeDays) / 365) * 100))}%` }} />
            </div>
            <span className="text-xs font-bold text-white/80 tabular-nums">
              {Math.round(((365 - ceeDays) / 365) * 100)}% prep time used
            </span>
          </div>
          <Link href="/study-plan" className="flex items-center gap-1 text-sm font-semibold text-white/80 hover:text-white transition-colors">
            View Study Plan <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      {/* Streak */}
      <div className="card-base flex flex-col gap-2 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <p className="section-label">Study Streak</p>
          <div className="w-8 h-8 rounded-lg bg-ma-light flex items-center justify-center">
            <Flame size={16} className="text-ma" />
          </div>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-2"><Loader2 size={16} className="animate-spin text-muted-foreground" /></div>
        ) : (
          <>
            <div>
              <p className="font-mono text-3xl font-bold text-foreground tabular-nums">{stats?.studyStreak ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-0.5">consecutive days</p>
            </div>
            <div className="flex gap-1 mt-auto">
              {Array.from({ length: 7 })?.map((_, i) => (
                <div
                  key={`streak-day-${i}`}
                  className={`flex-1 h-1.5 rounded-full ${i < Math.min(7, stats?.studyStreak || 0) ? 'bg-ma' : 'bg-border'}`}
                />
              ))}
            </div>
            {(stats?.studyStreak || 0) > 0 && (
              <p className="text-xs text-success font-medium">🔥 Keep it up!</p>
            )}
          </>
        )}
      </div>

      {/* Overall Accuracy */}
      <div className="card-base flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="section-label">Overall Accuracy</p>
          <div className="w-8 h-8 rounded-lg bg-success-light flex items-center justify-center">
            <Target size={16} className="text-success" />
          </div>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-2"><Loader2 size={16} className="animate-spin text-muted-foreground" /></div>
        ) : (
          <>
            <div>
              <p className="font-mono text-3xl font-bold text-foreground tabular-nums">{stats?.overallAccuracy ?? 0}%</p>
              <p className="text-xs text-muted-foreground mt-0.5">last 30 days</p>
            </div>
            <div className="flex items-center gap-1 mt-auto">
              {(stats?.accuracyDelta || 0) >= 0 ? (
                <TrendingUp size={13} className="text-success" />
              ) : (
                <TrendingDown size={13} className="text-error" />
              )}
              <span className={`text-xs font-semibold ${(stats?.accuracyDelta || 0) >= 0 ? 'text-success' : 'text-error'}`}>
                {(stats?.accuracyDelta || 0) >= 0 ? '+' : ''}{stats?.accuracyDelta ?? 0}% vs last month
              </span>
            </div>
          </>
        )}
      </div>

      {/* Rank */}
      <div className="card-base flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="section-label">All-India Rank</p>
          <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
            <Trophy size={16} className="text-primary" />
          </div>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-2"><Loader2 size={16} className="animate-spin text-muted-foreground" /></div>
        ) : (
          <>
            <div>
              <p className="font-mono text-3xl font-bold text-foreground tabular-nums">
                {stats?.rankPosition ? `#${stats.rankPosition.toLocaleString()}` : '—'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {stats?.totalStudents ? `of ${stats.totalStudents.toLocaleString()} students` : 'Complete exams to rank'}
              </p>
            </div>
            <div className="flex items-center gap-1 mt-auto">
              <TrendingUp size={13} className="text-success" />
              <span className="text-xs text-success font-semibold">Based on your profile</span>
            </div>
          </>
        )}
      </div>

      {/* Battle Win Rate */}
      <div className="card-base flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="section-label">Battle Win Rate</p>
          <div className="w-8 h-8 rounded-lg bg-chem-light flex items-center justify-center">
            <Swords size={16} className="text-chem" />
          </div>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-2"><Loader2 size={16} className="animate-spin text-muted-foreground" /></div>
        ) : (
          <>
            <div>
              <p className="font-mono text-3xl font-bold text-foreground tabular-nums">{battleWinRate}%</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {stats?.battleWins ?? 0} wins / {stats?.battleTotal ?? 0} battles
              </p>
            </div>
            <div className="flex items-center gap-1 mt-auto">
              {battleWinRate >= 50 ? (
                <TrendingUp size={13} className="text-success" />
              ) : (
                <TrendingDown size={13} className="text-error" />
              )}
              <span className={`text-xs font-semibold ${battleWinRate >= 50 ? 'text-success' : 'text-error'}`}>
                {battleWinRate >= 50 ? 'Above average' : 'Keep battling!'}
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