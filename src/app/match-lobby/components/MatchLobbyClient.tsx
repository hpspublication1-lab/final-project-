'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Swords, Zap, Trophy, Shield, Users, Clock, Star, Crown, ChevronRight, X, CheckCircle2, Loader2, Radio, Target, TrendingUp, Award, Flame, RotateCcw, Play } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type LobbyView = 'home' | 'searching' | 'found' | 'countdown';
type QueueMode = 'quick' | 'ranked';

interface RankTier {
  name: string;
  minRating: number;
  maxRating: number;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ReactNode;
  gradient: string;
}

interface OpponentProfile {
  id: string;
  full_name: string;
  battle_rating: number;
  total_points: number;
  college?: string;
  rank_position?: number;
}

interface QueueEntry {
  id: string;
  player_id: string;
  queue_mode: string;
  player_rating: number;
  status: string;
  matched_room_id: string | null;
  joined_at: string;
}

// ─── ELO Rank Tiers ──────────────────────────────────────────────────────────

const RANK_TIERS: RankTier[] = [
  {
    name: 'Bronze',
    minRating: 0,
    maxRating: 999,
    color: 'text-amber-700',
    bgColor: 'bg-amber-100',
    borderColor: 'border-amber-300',
    gradient: 'from-amber-700 to-amber-500',
    icon: <Shield size={14} />,
  },
  {
    name: 'Silver',
    minRating: 1000,
    maxRating: 1299,
    color: 'text-slate-500',
    bgColor: 'bg-slate-100',
    borderColor: 'border-slate-300',
    gradient: 'from-slate-500 to-slate-400',
    icon: <Shield size={14} />,
  },
  {
    name: 'Gold',
    minRating: 1300,
    maxRating: 1599,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-300',
    gradient: 'from-yellow-600 to-yellow-400',
    icon: <Star size={14} />,
  },
  {
    name: 'Platinum',
    minRating: 1600,
    maxRating: 1899,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-300',
    gradient: 'from-cyan-600 to-cyan-400',
    icon: <Award size={14} />,
  },
  {
    name: 'Diamond',
    minRating: 1900,
    maxRating: 2199,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-300',
    gradient: 'from-blue-600 to-blue-400',
    icon: <Crown size={14} />,
  },
  {
    name: 'Master',
    minRating: 2200,
    maxRating: 2499,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-300',
    gradient: 'from-purple-600 to-purple-400',
    icon: <Crown size={14} />,
  },
  {
    name: 'Grandmaster',
    minRating: 2500,
    maxRating: 99999,
    color: 'text-rose-600',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-300',
    gradient: 'from-rose-600 to-orange-500',
    icon: <Flame size={14} />,
  },
];

function getRank(rating: number): RankTier {
  return RANK_TIERS.find((t) => rating >= t.minRating && rating <= t.maxRating) ?? RANK_TIERS[0];
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * PostgREST returns a to-one embed (e.g. creator:user_profiles!fk(...)) as an
 * object, but under an ambiguous relationship it can come back as an array.
 * Normalize to a single object so property lookups never silently miss.
 */
function pickOne<T>(value: unknown): T | null {
  if (Array.isArray(value)) return (value[0] as T) ?? null;
  return (value as T) ?? null;
}

// ─── Rank Badge Component ─────────────────────────────────────────────────────

function RankBadge({ rating, size = 'sm' }: { rating: number; size?: 'xs' | 'sm' | 'md' | 'lg' }) {
  const rank = getRank(rating);
  const sizeClasses = {
    xs: 'text-xs px-1.5 py-0.5 gap-1',
    sm: 'text-xs px-2 py-1 gap-1',
    md: 'text-sm px-2.5 py-1 gap-1.5',
    lg: 'text-base px-3 py-1.5 gap-2',
  };
  return (
    <span
      className={`inline-flex items-center rounded-full font-bold border ${rank.bgColor} ${rank.color} ${rank.borderColor} ${sizeClasses[size]}`}
    >
      {rank.icon}
      {rank.name}
    </span>
  );
}

// ─── ELO Progress Bar ─────────────────────────────────────────────────────────

function EloProgressBar({ rating }: { rating: number }) {
  const rank = getRank(rating);
  const nextRank = RANK_TIERS.find((t) => t.minRating > rank.minRating);
  const progress = nextRank
    ? Math.round(((rating - rank.minRating) / (nextRank.minRating - rank.minRating)) * 100)
    : 100;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className={`font-semibold ${rank.color}`}>{rank.name}</span>
        {nextRank && (
          <span className="text-muted-foreground">
            {nextRank.minRating - rating} pts to {nextRank.name}
          </span>
        )}
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${rank.gradient} transition-all duration-700`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

// ─── Player Card ──────────────────────────────────────────────────────────────

function PlayerCard({
  profile,
  label,
  isYou = false,
  animate = false,
}: {
  profile: OpponentProfile;
  label: string;
  isYou?: boolean;
  animate?: boolean;
}) {
  const rank = getRank(profile.battle_rating);
  return (
    <div
      className={`relative flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all duration-500 ${
        isYou
          ? 'border-primary/40 bg-primary/5' :'border-chem/40 bg-chem/5'
      } ${animate ? 'scale-100 opacity-100' : ''}`}
    >
      <span
        className={`absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold px-3 py-0.5 rounded-full ${
          isYou ? 'bg-primary text-white' : 'bg-chem text-white'
        }`}
      >
        {label}
      </span>

      {/* Avatar */}
      <div
        className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-extrabold border-2 ${
          isYou ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-chem/10 border-chem/30 text-chem'
        }`}
      >
        {getInitials(profile.full_name)}
      </div>

      {/* Name */}
      <div className="text-center">
        <p className="font-bold text-foreground text-sm leading-tight">{profile.full_name}</p>
        {profile.college && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[140px]">{profile.college}</p>
        )}
      </div>

      {/* Rating */}
      <div className="text-center">
        <p className={`text-2xl font-extrabold ${isYou ? 'text-primary' : 'text-chem'}`}>
          {profile.battle_rating.toLocaleString()}
        </p>
        <p className="text-xs text-muted-foreground">ELO Rating</p>
      </div>

      {/* Rank Badge */}
      <RankBadge rating={profile.battle_rating} size="sm" />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 w-full">
        <div className="bg-muted/50 rounded-xl p-2 text-center">
          <p className="text-sm font-bold text-foreground">{profile.total_points.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Points</p>
        </div>
        <div className="bg-muted/50 rounded-xl p-2 text-center">
          <p className="text-sm font-bold text-foreground">
            {profile.rank_position ? `#${profile.rank_position}` : '—'}
          </p>
          <p className="text-xs text-muted-foreground">Rank</p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MatchLobbyClient() {
  const [isDark, setIsDark] = useState(false);
  const { profile, user } = useAuth();
  const supabase = createClient();

  // AuthContext's profile can be null (its client-side user_profiles read hits
  // the RLS recursion). Load the real profile via the service-role route so the
  // lobby knows the user is signed in and can show their real rating/name.
  const [me, setMe] = useState<OpponentProfile | null>(null);
  useEffect(() => {
    let active = true;
    fetch('/api/profile/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (active && d?.id) {
          setMe({
            id: d.id,
            full_name: d.full_name || 'You',
            battle_rating: d.battle_rating ?? 1000,
            total_points: d.total_points ?? 0,
            college: d.college || undefined,
            rank_position: undefined,
          });
        }
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  // Signed in if either the auth session OR the resolved profile is present.
  const signedIn = !!user || !!me;

  const [view, setView] = useState<LobbyView>('home');
  const [queueMode, setQueueMode] = useState<QueueMode>('quick');
  const [searchTime, setSearchTime] = useState(0);
  const [countdown, setCountdown] = useState(5);
  const [opponent, setOpponent] = useState<OpponentProfile | null>(null);
  const [queueId, setQueueId] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [onlineCount, setOnlineCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLeaving, setIsLeaving] = useState(false);

  const searchTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const botTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const roomIdRef = useRef<string | null>(null);

  // ── Fetch online count ──────────────────────────────────────────────────────
  useEffect(() => {
    const fetchOnlineCount = async () => {
      const { count } = await supabase
        .from('matchmaking_queue')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'searching');
      setOnlineCount((count ?? 0) + 847);
    };
    fetchOnlineCount();
  }, []);

  // ── Search timer ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (view === 'searching') {
      searchTimerRef.current = setInterval(() => setSearchTime((s) => s + 1), 1000);
    } else {
      setSearchTime(0);
      if (searchTimerRef.current) clearInterval(searchTimerRef.current);
    }
    return () => {
      if (searchTimerRef.current) clearInterval(searchTimerRef.current);
    };
  }, [view]);

  // ── Countdown timer ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (view === 'countdown') {
      setCountdown(5);
      countdownTimerRef.current = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            clearInterval(countdownTimerRef.current!);
            // Navigate to the real matched room in Battle Arena
            window.location.href = roomIdRef.current
              ? `/battle-arena?room=${roomIdRef.current}`
              : '/battle-arena';
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    }
    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [view]);

  // ── Cleanup on unmount ──────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
      if (searchTimerRef.current) clearInterval(searchTimerRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, []);

  // ── Handle match found: fetch the room + whichever profile isn't me ────────
  const handleMatchFound = useCallback(async (matchedRoomId: string) => {
    const { data: room, error: roomError } = await supabase
      .from('battle_rooms')
      .select('*')
      .eq('id', matchedRoomId)
      .maybeSingle();

    if (roomError || !room) {
      setError('Match found but the room could not be loaded. Please try again.');
      setView('home');
      return;
    }

    const otherUserId = room.creator_id === user?.id ? room.opponent_id : room.creator_id;
    let opponentProfile: OpponentProfile | null = null;

    if (otherUserId) {
      if (typeof otherUserId === 'string' && otherUserId.startsWith('rival-')) {
        opponentProfile = CEE_RIVALS.find((r) => r.id === otherUserId) ?? null;
      } else {
        const { data: pData } = await supabase
          .from('user_profiles')
          .select('id, full_name, battle_rating, total_points, college, rank_position')
          .eq('id', otherUserId)
          .maybeSingle();
        if (pData) opponentProfile = pData as OpponentProfile;
      }
    }

    if (opponentProfile) {
      setOpponent(opponentProfile);
      setRoomId(matchedRoomId);
      roomIdRef.current = matchedRoomId;
      setView('found');
      setTimeout(() => setView('countdown'), 2000);
    } else {
      setError('Match found but opponent details could not be loaded.');
      setView('home');
    }
  }, [user]);

const CEE_RIVALS: OpponentProfile[] = [
  { id: 'rival-1', full_name: 'Priya Adhikari', battle_rating: 1540, total_points: 3450, college: 'PEA CEE Ranker', rank_position: 14 },
  { id: 'rival-2', full_name: 'Aarav Sharma', battle_rating: 1620, total_points: 4120, college: 'IOM Aspirant (Rank 42)', rank_position: 8 },
  { id: 'rival-3', full_name: 'Rohan Shrestha', battle_rating: 1480, total_points: 2980, college: 'BPKIHS Scholar', rank_position: 23 },
  { id: 'rival-4', full_name: 'Suman Thapa', battle_rating: 1390, total_points: 2150, college: 'Vibrant CEE Prep', rank_position: 35 },
  { id: 'rival-5', full_name: 'Kriti Neupane', battle_rating: 1710, total_points: 5200, college: 'PAHS Merit Aspirant', rank_position: 5 },
];

  // ── Join queue ──────────────────────────────────────────────────────────────
  const joinQueue = useCallback(async (mode: QueueMode) => {
    if (!signedIn) {
      setError('Please sign in to join the queue.');
      return;
    }
    setError(null);
    setQueueMode(mode);
    setView('searching');

    // Auto-match fallback after 60 seconds if no human player is found in queue
    if (botTimeoutRef.current) clearTimeout(botTimeoutRef.current);
    botTimeoutRef.current = setTimeout(async () => {
      const randomRival = CEE_RIVALS[Math.floor(Math.random() * CEE_RIVALS.length)];
      setOpponent(randomRival);
      let matchedId = `room-${Date.now().toString(36)}`;
      try {
        const { data } = await supabase.rpc('create_private_battle_room', {
          p_subject_filter: 'mixed',
          p_count: 10,
        });
        if (data && data.length > 0) {
          matchedId = data[0].room_id;
        }
      } catch {
        // Fallback to client-generated room ID
      }
      setRoomId(matchedId);
      roomIdRef.current = matchedId;
      setView('found');
      setTimeout(() => setView('countdown'), 1800);
    }, 60000);

    try {
      const { data, error: rpcError } = await supabase.rpc('find_or_create_battle_match', {
        p_queue_mode: mode,
        p_subject_filter: 'mixed',
      });

      if (rpcError || !data || data.length === 0) {
        // RPC absent or errored — auto-fallback timer handles rival matching
        return;
      }

      const result = data[0] as { queue_id: string; room_id: string | null; matched: boolean };
      setQueueId(result.queue_id);

      if (result.matched && result.room_id) {
        if (botTimeoutRef.current) clearTimeout(botTimeoutRef.current);
        await handleMatchFound(result.room_id);
        return;
      }

      // Nobody waiting yet — stay in queue and listen for a real-time match
      const channel = supabase
        .channel(`queue_${result.queue_id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'matchmaking_queue',
            filter: `id=eq.${result.queue_id}`,
          },
          async (payload) => {
            const updated = payload.new as QueueEntry;
            if (updated.status === 'matched' && updated.matched_room_id) {
              if (botTimeoutRef.current) clearTimeout(botTimeoutRef.current);
              await handleMatchFound(updated.matched_room_id);
            }
          }
        )
        .subscribe();

      channelRef.current = channel;
    } catch {
      // Fallback timer handles rival matching
    }
  }, [signedIn, handleMatchFound, supabase]);

  // ── Leave queue ─────────────────────────────────────────────────────────────
  const leaveQueue = useCallback(async () => {
    setIsLeaving(true);
    if (botTimeoutRef.current) {
      clearTimeout(botTimeoutRef.current);
      botTimeoutRef.current = null;
    }
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    if (queueId) {
      await supabase
        .from('matchmaking_queue')
        .update({ status: 'cancelled' })
        .eq('id', queueId);
      setQueueId(null);
    }
    if (roomIdRef.current) {
      // Already matched into a real room — cancel it so the opponent
      // isn't left waiting on someone who bailed.
      await supabase
        .from('battle_rooms')
        .update({ status: 'cancelled' })
        .eq('id', roomIdRef.current);
      setRoomId(null);
      roomIdRef.current = null;
    }
    setOpponent(null);
    setView('home');
    setIsLeaving(false);
  }, [queueId]);

  const formatSearchTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const myProfile: OpponentProfile | null = me
    ? me
    : profile
    ? {
        id: user?.id ?? '',
        full_name: profile.full_name,
        battle_rating: profile.battle_rating ?? 1000,
        total_points: profile.total_points ?? 0,
        college: profile.college ?? undefined,
        rank_position: profile.rank_position ?? undefined,
      }
    : null;

  // ─── VIEW: Home ─────────────────────────────────────────────────────────────
  if (view === 'home') {
    return (
      <DashboardLayout isDark={isDark} onToggleDark={() => setIsDark(!isDark)}>
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-foreground flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Swords size={20} className="text-primary" />
                </span>
                Match Lobby
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                ELO-based matchmaking · Rank up · Prove your mastery
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-success bg-success-light px-3 py-1.5 rounded-full animate-pulse">
              <Radio size={12} />
              {onlineCount.toLocaleString()} online
            </div>
          </div>

          {error && (
            <div className="bg-error-light border border-error/20 text-error text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left: Queue modes */}
            <div className="lg:col-span-2 space-y-4">
              {/* Quick Play */}
              <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-2xl p-6">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="relative flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap size={20} className="text-primary" />
                      <h2 className="text-lg font-bold text-foreground">Quick Play</h2>
                      <span className="text-xs bg-success-light text-success px-2 py-0.5 rounded-full font-semibold">
                        ● LIVE
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                      Get matched instantly with a student of similar skill. Wider ELO range (±400), faster queue times. No rank points at stake.
                    </p>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-5">
                      <span className="flex items-center gap-1.5 bg-muted/60 px-2.5 py-1 rounded-full">
                        <Users size={11} /> ~15s avg wait
                      </span>
                      <span className="flex items-center gap-1.5 bg-muted/60 px-2.5 py-1 rounded-full">
                        <Target size={11} /> ±400 ELO range
                      </span>
                      <span className="flex items-center gap-1.5 bg-muted/60 px-2.5 py-1 rounded-full">
                        <Clock size={11} /> 10 questions · 5 min
                      </span>
                    </div>
                    <button
                      onClick={() => joinQueue('quick')}
                      className="btn-primary gap-2 text-sm"
                    >
                      <Play size={15} /> Find Quick Match
                      <ChevronRight size={15} />
                    </button>
                  </div>
                  <div className="hidden sm:flex w-20 h-20 bg-primary/10 rounded-2xl items-center justify-center shrink-0">
                    <Zap size={36} className="text-primary" />
                  </div>
                </div>
              </div>

              {/* Ranked Queue */}
              <div className="relative overflow-hidden bg-gradient-to-br from-ma/10 via-ma/5 to-transparent border border-ma/20 rounded-2xl p-6">
                <div className="absolute top-0 right-0 w-32 h-32 bg-ma/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="relative flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Trophy size={20} className="text-ma" />
                      <h2 className="text-lg font-bold text-foreground">Ranked Queue</h2>
                      <span className="text-xs bg-ma/10 text-ma px-2 py-0.5 rounded-full font-semibold border border-ma/20">
                        COMPETITIVE
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                      Compete for ELO rating and climb the leaderboard. Tighter skill matching (±150 ELO). Win to gain rating, lose to drop.
                    </p>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-5">
                      <span className="flex items-center gap-1.5 bg-muted/60 px-2.5 py-1 rounded-full">
                        <Users size={11} /> ~45s avg wait
                      </span>
                      <span className="flex items-center gap-1.5 bg-muted/60 px-2.5 py-1 rounded-full">
                        <Target size={11} /> ±150 ELO range
                      </span>
                      <span className="flex items-center gap-1.5 bg-muted/60 px-2.5 py-1 rounded-full">
                        <TrendingUp size={11} /> ELO changes
                      </span>
                    </div>
                    <button
                      onClick={() => joinQueue('ranked')}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-ma text-white font-semibold text-sm hover:opacity-90 transition-opacity"
                    >
                      <Trophy size={15} /> Enter Ranked Queue
                      <ChevronRight size={15} />
                    </button>
                  </div>
                  <div className="hidden sm:flex w-20 h-20 bg-ma/10 rounded-2xl items-center justify-center shrink-0">
                    <Trophy size={36} className="text-ma" />
                  </div>
                </div>
              </div>

              {/* Rank Tiers Reference */}
              <div className="bg-card border border-border rounded-2xl p-5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                  Rank Tiers
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {RANK_TIERS.map((tier) => (
                    <div
                      key={tier.name}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${tier.bgColor} ${tier.borderColor}`}
                    >
                      <span className={tier.color}>{tier.icon}</span>
                      <div>
                        <p className={`text-xs font-bold ${tier.color}`}>{tier.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {tier.minRating === 0 ? '0' : tier.minRating.toLocaleString()}
                          {tier.maxRating === 99999 ? '+' : `–${tier.maxRating.toLocaleString()}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: My profile + leaderboard */}
            <div className="space-y-4">
              {/* My ELO Card */}
              <div className="bg-card border border-border rounded-2xl p-5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                  My Rating
                </p>
                {myProfile ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-extrabold text-lg">
                        {getInitials(myProfile.full_name)}
                      </div>
                      <div>
                        <p className="font-bold text-foreground text-sm">{myProfile.full_name}</p>
                        <p className="text-xs text-muted-foreground">{myProfile.college ?? 'CEE Aspirant'}</p>
                      </div>
                    </div>
                    <div className="text-center py-2">
                      <p className="text-4xl font-extrabold text-primary">
                        {myProfile.battle_rating.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">ELO Rating</p>
                    </div>
                    <RankBadge rating={myProfile.battle_rating} size="md" />
                    <EloProgressBar rating={myProfile.battle_rating} />
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-muted/50 rounded-xl p-2.5 text-center">
                        <p className="text-sm font-bold text-foreground">{myProfile.total_points.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Points</p>
                      </div>
                      <div className="bg-muted/50 rounded-xl p-2.5 text-center">
                        <p className="text-sm font-bold text-foreground">
                          {myProfile.rank_position ? `#${myProfile.rank_position}` : '—'}
                        </p>
                        <p className="text-xs text-muted-foreground">Rank</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground text-sm">
                    Sign in to see your rating
                  </div>
                )}
              </div>

              {/* Top Ranked */}
              <div className="bg-card border border-border rounded-2xl p-5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Top Ranked
                </p>
                <div className="space-y-2">
                  {[
                    { rank: 1, name: 'Sita Rai', rating: 2341, emoji: '🥇' },
                    { rank: 2, name: 'Bikash KC', rating: 2198, emoji: '🥈' },
                    { rank: 3, name: 'Priya Thapa', rating: 1847, emoji: '🥉' },
                    { rank: 4, name: 'Aarav Sharma', rating: 1720, emoji: '4' },
                    { rank: 5, name: 'Nisha Poudel', rating: 1654, emoji: '5' },
                  ].map((p) => (
                    <div key={p.rank} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-muted/50 transition-colors">
                      <span className="text-sm w-6 text-center font-bold text-muted-foreground">
                        {p.rank <= 3 ? p.emoji : p.rank}
                      </span>
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                        {p.name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{p.name}</p>
                        <RankBadge rating={p.rating} size="xs" />
                      </div>
                      <span className="text-xs font-bold text-muted-foreground">{p.rating.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ─── VIEW: Searching ────────────────────────────────────────────────────────
  if (view === 'searching') {
    return (
      <DashboardLayout isDark={isDark} onToggleDark={() => setIsDark(!isDark)}>
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-lg mx-auto">
            <div className="bg-card border border-border rounded-2xl p-8 text-center space-y-6">
              {/* Mode badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold border bg-muted/50">
                {queueMode === 'ranked' ? (
                  <>
                    <Trophy size={14} className="text-ma" />
                    <span className="text-ma">Ranked Queue</span>
                  </>
                ) : (
                  <>
                    <Zap size={14} className="text-primary" />
                    <span className="text-primary">Quick Play</span>
                  </>
                )}
              </div>

              {/* Animated search ring */}
              <div className="relative w-32 h-32 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-ping" />
                <div className="absolute inset-2 rounded-full border-4 border-primary/30 animate-ping" style={{ animationDelay: '0.3s' }} />
                <div className="absolute inset-4 rounded-full border-4 border-primary/40 animate-ping" style={{ animationDelay: '0.6s' }} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center">
                    <Swords size={32} className="text-primary" />
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-extrabold text-foreground">Searching for Opponent</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Finding a{queueMode === 'ranked' ? ' ranked' : ''} player near your ELO rating…
                </p>
              </div>

              {/* Timer */}
              <div className="flex items-center justify-center gap-2 text-3xl font-mono font-extrabold text-primary">
                <Clock size={24} className="text-muted-foreground" />
                {formatSearchTime(searchTime)}
              </div>

              {/* My profile mini */}
              {myProfile && (
                <div className="flex items-center gap-3 bg-muted/50 rounded-xl px-4 py-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {getInitials(myProfile.full_name)}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-semibold text-foreground">{myProfile.full_name}</p>
                    <p className="text-xs text-muted-foreground">{myProfile.battle_rating} ELO</p>
                  </div>
                  <RankBadge rating={myProfile.battle_rating} size="xs" />
                </div>
              )}

              {/* Queue info */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-muted/50 rounded-xl p-3">
                  <p className="font-bold text-foreground">{queueMode === 'ranked' ? '±150' : '±400'}</p>
                  <p className="text-xs text-muted-foreground">ELO Range</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-3">
                  <p className="font-bold text-foreground">{onlineCount.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Players Online</p>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  onClick={async () => {
                    const randomRival = CEE_RIVALS[Math.floor(Math.random() * CEE_RIVALS.length)];
                    setOpponent(randomRival);
                    let matchedId = `room-${Date.now().toString(36)}`;
                    try {
                      const { data } = await supabase.rpc('create_private_battle_room', {
                        p_subject_filter: 'mixed',
                        p_count: 10,
                      });
                      if (data && data.length > 0) {
                        matchedId = data[0].room_id;
                      }
                    } catch {
                      // Fallback
                    }
                    setRoomId(matchedId);
                    roomIdRef.current = matchedId;
                    setView('found');
                    setTimeout(() => setView('countdown'), 1800);
                  }}
                  className="w-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-amber-500/20 transition-colors"
                >
                  <Zap size={14} /> Match with AI Bot Instantly
                </button>

                <button
                  onClick={leaveQueue}
                  disabled={isLeaving}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-sm font-medium disabled:opacity-50"
                >
                  {isLeaving ? <Loader2 size={16} className="animate-spin" /> : <X size={16} />}
                  Cancel Search
                </button>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ─── VIEW: Match Found ──────────────────────────────────────────────────────
  if (view === 'found' && opponent && myProfile) {
    return (
      <DashboardLayout isDark={isDark} onToggleDark={() => setIsDark(!isDark)}>
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Match found banner */}
            <div className="text-center">
              <div className="inline-flex items-center gap-2 bg-success-light text-success px-4 py-2 rounded-full text-sm font-bold mb-3 animate-bounce">
                <CheckCircle2 size={16} />
                Match Found!
              </div>
              <h2 className="text-2xl font-extrabold text-foreground">Opponent Located</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {queueMode === 'ranked' ? 'Ranked' : 'Quick Play'} · Preparing battle…
              </p>
            </div>

            {/* VS layout */}
            <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
              <PlayerCard profile={myProfile} label="You" isYou animate />

              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-chem flex items-center justify-center shadow-lg">
                  <Swords size={22} className="text-white" />
                </div>
                <span className="text-lg font-extrabold text-muted-foreground">VS</span>
                {/* ELO diff */}
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">ELO diff</p>
                  <p className={`text-sm font-bold ${Math.abs(myProfile.battle_rating - opponent.battle_rating) <= 100 ? 'text-success' : 'text-warning'}`}>
                    {Math.abs(myProfile.battle_rating - opponent.battle_rating)}
                  </p>
                </div>
              </div>

              <PlayerCard profile={opponent} label="Opponent" animate />
            </div>

            {/* Mode info */}
            <div className="bg-card border border-border rounded-2xl p-4">
              <div className="grid grid-cols-3 gap-4 text-center text-sm">
                <div>
                  <p className="font-bold text-foreground">10</p>
                  <p className="text-xs text-muted-foreground">Questions</p>
                </div>
                <div>
                  <p className="font-bold text-foreground">5 min</p>
                  <p className="text-xs text-muted-foreground">Time Limit</p>
                </div>
                <div>
                  <p className={`font-bold ${queueMode === 'ranked' ? 'text-ma' : 'text-primary'}`}>
                    {queueMode === 'ranked' ? 'Ranked' : 'Casual'}
                  </p>
                  <p className="text-xs text-muted-foreground">Mode</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ─── VIEW: Countdown ────────────────────────────────────────────────────────
  if (view === 'countdown' && opponent && myProfile) {
    return (
      <DashboardLayout isDark={isDark} onToggleDark={() => setIsDark(!isDark)}>
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Countdown header */}
            <div className="text-center">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                Battle Starting In
              </p>
              <div className="relative inline-flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping scale-150" />
                <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-xl">
                  <span className="text-5xl font-extrabold text-white">{countdown}</span>
                </div>
              </div>
            </div>

            {/* VS layout compact */}
            <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 text-center">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-extrabold text-lg mx-auto mb-2">
                  {getInitials(myProfile.full_name)}
                </div>
                <p className="text-sm font-bold text-foreground truncate">{myProfile.full_name}</p>
                <p className="text-xs text-primary font-semibold mt-1">{myProfile.battle_rating} ELO</p>
                <div className="mt-2">
                  <RankBadge rating={myProfile.battle_rating} size="xs" />
                </div>
              </div>

              <div className="flex flex-col items-center gap-1">
                <Swords size={28} className="text-primary" />
                <span className="text-base font-extrabold text-muted-foreground">VS</span>
              </div>

              <div className="bg-chem/5 border border-chem/20 rounded-2xl p-4 text-center">
                <div className="w-12 h-12 rounded-xl bg-chem/10 flex items-center justify-center text-chem font-extrabold text-lg mx-auto mb-2">
                  {getInitials(opponent.full_name)}
                </div>
                <p className="text-sm font-bold text-foreground truncate">{opponent.full_name}</p>
                <p className="text-xs text-chem font-semibold mt-1">{opponent.battle_rating} ELO</p>
                <div className="mt-2">
                  <RankBadge rating={opponent.battle_rating} size="xs" />
                </div>
              </div>
            </div>

            {/* Battle info */}
            <div className="bg-card border border-border rounded-2xl p-4 text-center">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">10 MCQ questions</span> · 5 minute time limit ·{' '}
                <span className={`font-semibold ${queueMode === 'ranked' ? 'text-ma' : 'text-primary'}`}>
                  {queueMode === 'ranked' ? 'Ranked match' : 'Quick play'}
                </span>
              </p>
              <div className="flex items-center justify-center gap-2 mt-3 text-xs text-muted-foreground">
                <Loader2 size={12} className="animate-spin" />
                Redirecting to Battle Arena…
              </div>
            </div>

            <button
              onClick={leaveQueue}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-sm"
            >
              <RotateCcw size={14} />
              Cancel & Return to Lobby
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return null;
}
