'use client';

import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { createClient } from '@/lib/supabase/client';
import { Trophy, Medal, Star, TrendingUp, Zap, Target, Swords, ChevronUp, ChevronDown, Loader2, Crown, Flame, BookOpen, FlaskConical, Atom, Brain, RefreshCw } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


interface LeaderboardEntry {
  student_id: string;
  full_name: string;
  avatar_url: string | null;
  college: string | null;
  cee_year: number | null;
  subscription_plan: string;
  battle_rating: number;
  total_points: number;
  mock_score_avg: number;
  accuracy: number;
  questions_attempted: number;
  battles_won: number;
  battles_played: number;
  rank_position: number;
  rank_change: number;
  joined_at: string;
}

interface MyRank {
  rank_position: number;
  total_students: number;
  percentile: number;
}

const PERIODS = [
  { key: 'daily', label: 'Today' },
  { key: 'weekly', label: 'This Week' },
  { key: 'all_time', label: 'All Time' },
] as const;

const SUBJECTS = [
  { key: 'all', label: 'All Subjects', icon: Star, color: 'text-primary' },
  { key: 'biology', label: 'Biology', icon: BookOpen, color: 'text-bio' },
  { key: 'chemistry', label: 'Chemistry', icon: FlaskConical, color: 'text-chem' },
  { key: 'physics', label: 'Physics', icon: Atom, color: 'text-physics' },
  { key: 'mental_agility', label: 'Mental Agility', icon: Brain, color: 'text-ma' },
] as const;

type Period = typeof PERIODS[number]['key'];
type Subject = typeof SUBJECTS[number]['key'];

function getRankMedal(rank: number) {
  if (rank === 1) return { icon: Crown, color: 'text-yellow-500', bg: 'bg-yellow-500/10' };
  if (rank === 2) return { icon: Medal, color: 'text-slate-400', bg: 'bg-slate-400/10' };
  if (rank === 3) return { icon: Medal, color: 'text-amber-600', bg: 'bg-amber-600/10' };
  return null;
}

function getInitials(name: string) {
  return name?.split(' ')?.map(n => n[0])?.join('')?.toUpperCase()?.slice(0, 2) || '??';
}

function getPlanBadge(plan: string) {
  if (plan === 'pro' || plan === 'institution') {
    return <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary leading-none">PRO</span>;
  }
  return null;
}

interface LeaderboardClientProps {
  currentUserId: string | null;
}

export default function LeaderboardClient({ currentUserId }: LeaderboardClientProps) {
  const [isDark, setIsDark] = useState(false);
  const [period, setPeriod] = useState<Period>('all_time');
  const [subject, setSubject] = useState<Subject>('all');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [myRank, setMyRank] = useState<MyRank | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'rank' | 'accuracy' | 'mock_score' | 'battles'>('rank');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const supabase = createClient();

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [lbRes, myRes] = await Promise.all([
        supabase.rpc('get_leaderboard', {
          p_period: period,
          p_subject: subject,
          p_limit: 100,
        }),
        supabase.rpc('get_my_rank', {
          p_period: period,
          p_subject: subject,
        }),
      ]);

      if (lbRes.error) throw new Error(lbRes.error.message);
      if (myRes.error) throw new Error(myRes.error.message);

      setEntries((lbRes.data as LeaderboardEntry[]) || []);
      if (myRes.data && myRes.data.length > 0) {
        setMyRank(myRes.data[0] as MyRank);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  }, [period, subject]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  useEffect(() => {
    if (isDark) {
      document.documentElement?.classList?.add('dark');
    } else {
      document.documentElement?.classList?.remove('dark');
    }
  }, [isDark]);

  const sortedEntries = [...entries].sort((a, b) => {
    let aVal: number, bVal: number;
    if (sortBy === 'rank') { aVal = a.rank_position; bVal = b.rank_position; }
    else if (sortBy === 'accuracy') { aVal = a.accuracy; bVal = b.accuracy; }
    else if (sortBy === 'mock_score') { aVal = a.mock_score_avg; bVal = b.mock_score_avg; }
    else { aVal = a.battles_won; bVal = b.battles_won; }
    return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
  });

  const handleSort = (col: typeof sortBy) => {
    if (sortBy === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(col);
      setSortDir(col === 'rank' ? 'asc' : 'desc');
    }
  };

  const top3 = sortedEntries.slice(0, 3);
  const rest = sortedEntries.slice(3);
  const myEntry = entries.find(e => e.student_id === currentUserId);

  const SortIcon = ({ col }: { col: typeof sortBy }) => {
    if (sortBy !== col) return <ChevronUp size={12} className="text-muted-foreground opacity-40" />;
    return sortDir === 'asc'
      ? <ChevronUp size={12} className="text-primary" />
      : <ChevronDown size={12} className="text-primary" />;
  };

  return (
    <DashboardLayout isDark={isDark} onToggleDark={() => setIsDark(!isDark)}>
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Trophy size={24} className="text-yellow-500" />
              Leaderboard
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Rankings based on battle rating, accuracy, and mock test performance
            </p>
          </div>
          <button
            onClick={fetchLeaderboard}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* My Rank Banner */}
        {myEntry && myRank && (
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-xl p-4 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                {getInitials(myEntry.full_name)}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Your Ranking</p>
                <p className="text-xs text-muted-foreground">{myEntry.full_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-6 flex-wrap">
              <div className="text-center">
                <p className="text-2xl font-extrabold text-primary">#{myRank.rank_position}</p>
                <p className="text-xs text-muted-foreground">Rank</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">{myRank.percentile}%</p>
                <p className="text-xs text-muted-foreground">Percentile</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">{myEntry.battle_rating}</p>
                <p className="text-xs text-muted-foreground">Battle Rating</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">{myEntry.accuracy?.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">Accuracy</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">{myEntry.mock_score_avg?.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">Mock Avg</p>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Period tabs */}
          <div className="flex items-center bg-muted rounded-lg p-1 gap-1">
            {PERIODS.map(p => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  period === p.key
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Subject filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {SUBJECTS.map(s => {
              const Icon = s.icon;
              return (
                <button
                  key={s.key}
                  onClick={() => setSubject(s.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                    subject === s.key
                      ? 'border-primary bg-primary/10 text-primary' :'border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <Icon size={14} className={subject === s.key ? 'text-primary' : s.color} />
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Loading / Error */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <Loader2 size={32} className="animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading rankings...</p>
            </div>
          </div>
        )}

        {error && !loading && (
          <div className="bg-error/10 border border-error/20 rounded-xl p-4 text-center">
            <p className="text-sm text-error font-medium">{error}</p>
            <button onClick={fetchLeaderboard} className="mt-2 text-xs text-primary hover:underline">
              Try again
            </button>
          </div>
        )}

        {!loading && !error && entries.length === 0 && (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <Trophy size={40} className="text-muted-foreground mx-auto mb-3" />
            <p className="text-foreground font-semibold">No rankings yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Complete practice sessions, mock tests, or battles to appear on the leaderboard.
            </p>
          </div>
        )}

        {!loading && !error && entries.length > 0 && (
          <>
            {/* Top 3 Podium */}
            {top3.length >= 3 && (
              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                {/* 2nd place */}
                <PodiumCard entry={top3[1]} rank={2} isCurrentUser={top3[1]?.student_id === currentUserId} />
                {/* 1st place */}
                <PodiumCard entry={top3[0]} rank={1} isCurrentUser={top3[0]?.student_id === currentUserId} />
                {/* 3rd place */}
                <PodiumCard entry={top3[2]} rank={3} isCurrentUser={top3[2]?.student_id === currentUserId} />
              </div>
            )}

            {/* Full Rankings Table */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <p className="font-semibold text-sm text-foreground">
                  Full Rankings
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    {entries.length} students
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Tie-breaking: Rating → Accuracy → Mock Score → Questions
                </p>
              </div>

              {/* Table Header */}
              <div className="hidden sm:grid grid-cols-[3rem_1fr_7rem_7rem_7rem_6rem_5rem] gap-2 px-4 py-2 border-b border-border bg-muted/30">
                <button onClick={() => handleSort('rank')} className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground">
                  # <SortIcon col="rank" />
                </button>
                <span className="text-xs font-semibold text-muted-foreground">Student</span>
                <button onClick={() => handleSort('rank')} className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground">
                  <Swords size={11} /> Rating <SortIcon col="rank" />
                </button>
                <button onClick={() => handleSort('accuracy')} className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground">
                  <Target size={11} /> Accuracy <SortIcon col="accuracy" />
                </button>
                <button onClick={() => handleSort('mock_score')} className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground">
                  <Zap size={11} /> Mock Avg <SortIcon col="mock_score" />
                </button>
                <button onClick={() => handleSort('battles')} className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground">
                  <Flame size={11} /> Battles <SortIcon col="battles" />
                </button>
                <span className="text-xs font-semibold text-muted-foreground">Progress</span>
              </div>

              {/* Table Rows */}
              <div className="divide-y divide-border">
                {sortedEntries.map((entry) => {
                  const isMe = entry.student_id === currentUserId;
                  const medal = getRankMedal(entry.rank_position);
                  const winRate = entry.battles_played > 0
                    ? Math.round((entry.battles_won / entry.battles_played) * 100)
                    : 0;

                  return (
                    <div
                      key={entry.student_id}
                      className={`grid grid-cols-[3rem_1fr] sm:grid-cols-[3rem_1fr_7rem_7rem_7rem_6rem_5rem] gap-2 px-4 py-3 items-center transition-colors ${
                        isMe
                          ? 'bg-primary/5 border-l-2 border-primary' :'hover:bg-muted/30'
                      }`}
                    >
                      {/* Rank */}
                      <div className="flex items-center justify-center">
                        {medal ? (
                          <div className={`w-7 h-7 rounded-full ${medal.bg} flex items-center justify-center`}>
                            <medal.icon size={14} className={medal.color} />
                          </div>
                        ) : (
                          <span className={`text-sm font-bold ${isMe ? 'text-primary' : 'text-muted-foreground'}`}>
                            {entry.rank_position}
                          </span>
                        )}
                      </div>

                      {/* Student info */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          isMe ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                        }`}>
                          {getInitials(entry.full_name)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`text-sm font-semibold truncate ${isMe ? 'text-primary' : 'text-foreground'}`}>
                              {entry.full_name}
                              {isMe && <span className="ml-1 text-xs text-primary">(You)</span>}
                            </span>
                            {getPlanBadge(entry.subscription_plan)}
                          </div>
                          {entry.college && (
                            <p className="text-xs text-muted-foreground truncate">{entry.college}</p>
                          )}
                        </div>
                        {/* Mobile stats */}
                        <div className="sm:hidden ml-auto flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <p className="text-sm font-bold text-foreground">{entry.battle_rating}</p>
                            <p className="text-xs text-muted-foreground">Rating</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-foreground">{entry.accuracy?.toFixed(1)}%</p>
                            <p className="text-xs text-muted-foreground">Acc</p>
                          </div>
                        </div>
                      </div>

                      {/* Battle Rating */}
                      <div className="hidden sm:flex items-center gap-1.5">
                        <Swords size={13} className="text-primary shrink-0" />
                        <span className="text-sm font-bold text-foreground">{entry.battle_rating}</span>
                      </div>

                      {/* Accuracy */}
                      <div className="hidden sm:flex items-center gap-1.5">
                        <Target size={13} className="text-bio shrink-0" />
                        <div>
                          <span className="text-sm font-semibold text-foreground">{entry.accuracy?.toFixed(1)}%</span>
                          <p className="text-xs text-muted-foreground">{entry.questions_attempted} Qs</p>
                        </div>
                      </div>

                      {/* Mock Score */}
                      <div className="hidden sm:flex items-center gap-1.5">
                        <Zap size={13} className="text-chem shrink-0" />
                        <span className="text-sm font-semibold text-foreground">
                          {entry.mock_score_avg > 0 ? `${entry.mock_score_avg?.toFixed(1)}%` : '—'}
                        </span>
                      </div>

                      {/* Battles */}
                      <div className="hidden sm:flex items-center gap-1.5">
                        <Flame size={13} className="text-physics shrink-0" />
                        <div>
                          <span className="text-sm font-semibold text-foreground">{entry.battles_won}W</span>
                          <span className="text-xs text-muted-foreground ml-1">/ {entry.battles_played}</span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="hidden sm:block">
                        <div className="w-full bg-muted rounded-full h-1.5">
                          <div
                            className="bg-primary rounded-full h-1.5 transition-all"
                            style={{ width: `${Math.min(100, (entry.battle_rating / 2000) * 100)}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {winRate}% win
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tie-breaking legend */}
            <div className="bg-muted/30 border border-border rounded-xl p-4">
              <p className="text-xs font-semibold text-muted-foreground mb-2">Ranking Tie-Breaking Logic</p>
              <div className="flex flex-wrap gap-3">
                {[
                  { icon: Swords, label: '1st: Battle Rating', color: 'text-primary' },
                  { icon: Target, label: '2nd: Accuracy', color: 'text-bio' },
                  { icon: Zap, label: '3rd: Mock Score Avg', color: 'text-chem' },
                  { icon: BookOpen, label: '4th: Questions Attempted', color: 'text-physics' },
                  { icon: TrendingUp, label: '5th: Join Date (earlier = better)', color: 'text-ma' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <item.icon size={13} className={item.color} />
                    <span className="text-xs text-muted-foreground">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

function PodiumCard({
  entry,
  rank,
  isCurrentUser,
}: {
  entry: LeaderboardEntry;
  rank: 1 | 2 | 3;
  isCurrentUser: boolean;
}) {
  const heights = { 1: 'pt-0', 2: 'pt-6', 3: 'pt-10' };
  const sizes = { 1: 'w-16 h-16 text-base', 2: 'w-12 h-12 text-sm', 3: 'w-11 h-11 text-xs' };
  const medals = {
    1: { icon: Crown, color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
    2: { icon: Medal, color: 'text-slate-400', bg: 'bg-slate-400/10', border: 'border-slate-400/30' },
    3: { icon: Medal, color: 'text-amber-600', bg: 'bg-amber-600/10', border: 'border-amber-600/30' },
  };
  const medal = medals[rank];
  const MedalIcon = medal.icon;

  return (
    <div className={`flex flex-col items-center ${heights[rank]}`}>
      <div className={`relative flex flex-col items-center bg-card border ${medal.border} rounded-xl p-3 w-full ${
        isCurrentUser ? 'ring-2 ring-primary' : ''
      } ${rank === 1 ? 'shadow-card-hover' : ''}`}>
        {/* Medal badge */}
        <div className={`absolute -top-3 w-6 h-6 rounded-full ${medal.bg} border ${medal.border} flex items-center justify-center`}>
          <MedalIcon size={12} className={medal.color} />
        </div>

        {/* Avatar */}
        <div className={`${sizes[rank]} rounded-full ${isCurrentUser ? 'bg-primary' : 'bg-muted'} flex items-center justify-center font-bold ${isCurrentUser ? 'text-white' : 'text-muted-foreground'} mt-2`}>
          {getInitials(entry.full_name)}
        </div>

        {/* Name */}
        <p className={`text-xs font-semibold text-center mt-2 truncate w-full ${isCurrentUser ? 'text-primary' : 'text-foreground'}`}>
          {entry.full_name.split(' ')[0]}
          {isCurrentUser && ' (You)'}
        </p>

        {/* Rating */}
        <div className="flex items-center gap-1 mt-1">
          <Swords size={10} className="text-primary" />
          <span className="text-xs font-bold text-primary">{entry.battle_rating}</span>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-2 mt-1.5 flex-wrap justify-center">
          <span className="text-xs text-muted-foreground">{entry.accuracy?.toFixed(0)}% acc</span>
          {entry.mock_score_avg > 0 && (
            <span className="text-xs text-muted-foreground">{entry.mock_score_avg?.toFixed(0)}% mock</span>
          )}
        </div>

        {/* Rank number */}
        <div className={`mt-2 text-lg font-extrabold ${medal.color}`}>#{rank}</div>
      </div>
    </div>
  );
}
