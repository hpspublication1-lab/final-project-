'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Swords, Zap, Trophy, Shield, Users, Clock, Star, Crown, ChevronRight, X,
  CheckCircle2, Loader2, Radio, Target, TrendingUp, Award, Flame, RotateCcw,
  Play, UserPlus, UserCheck, UserX, UserMinus, ShieldOff, Settings, Check, Send,
  Sparkles, Brain, BookOpen, FlaskConical, Atom, AlertTriangle, ArrowRight, BarChart3,
  Dna, Microscope, Medal, ShieldCheck, Activity
} from 'lucide-react';

type LobbyView = 'home' | 'searching' | 'found' | 'countdown';
type QueueMode = 'quick' | 'ranked';
type MatchDifficulty = 'easy' | 'medium' | 'hard' | 'extreme';
type MatchMode = 'standard' | 'best_of_3';

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
  status?: string;
}

interface FriendItem {
  id: string;
  full_name: string;
  battle_rating: number;
  college?: string;
  status: 'online' | 'in_match' | 'away' | 'offline';
  current_room_id?: string | null;
}

interface FriendRequestItem {
  requestId: string;
  sender?: OpponentProfile;
  receiver?: OpponentProfile;
  createdAt: string;
}

interface InvitationItem {
  id: string;
  sender: OpponentProfile;
  subjectFilter: string;
  expiresAt: string;
}

interface SubjectRatings {
  overall: number;
  biology: number;
  chemistry: number;
  physics: number;
  mentalAgility: number;
}

interface DailyMission {
  id: string;
  mission_code: string;
  mission_title: string;
  target_count: number;
  current_count: number;
  xp_reward: number;
  completed: boolean;
  claimed: boolean;
}

const RANK_TIERS: RankTier[] = [
  { name: 'Bronze', minRating: 0, maxRating: 999, color: 'text-amber-700 dark:text-amber-500', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/30', gradient: 'from-amber-700 via-amber-600 to-amber-500', icon: <Shield size={12} /> },
  { name: 'Silver', minRating: 1000, maxRating: 1299, color: 'text-slate-600 dark:text-slate-300', bgColor: 'bg-slate-500/10', borderColor: 'border-slate-400/30', gradient: 'from-slate-600 via-slate-500 to-slate-400', icon: <Shield size={12} /> },
  { name: 'Gold', minRating: 1300, maxRating: 1599, color: 'text-yellow-600 dark:text-yellow-400', bgColor: 'bg-yellow-500/10', borderColor: 'border-yellow-500/30', gradient: 'from-yellow-600 via-amber-500 to-yellow-400', icon: <Star size={12} /> },
  { name: 'Platinum', minRating: 1600, maxRating: 1899, color: 'text-cyan-600 dark:text-cyan-400', bgColor: 'bg-cyan-500/10', borderColor: 'border-cyan-500/30', gradient: 'from-cyan-600 via-teal-500 to-cyan-400', icon: <Award size={12} /> },
  { name: 'Diamond', minRating: 1900, maxRating: 2199, color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/30', gradient: 'from-blue-600 via-indigo-600 to-cyan-400', icon: <Crown size={12} /> },
  { name: 'Master', minRating: 2200, maxRating: 2499, color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-500/10', borderColor: 'border-purple-500/30', gradient: 'from-purple-600 via-violet-600 to-fuchsia-500', icon: <Crown size={12} /> },
  { name: 'Grandmaster', minRating: 2500, maxRating: 99999, color: 'text-rose-600 dark:text-rose-400', bgColor: 'bg-rose-500/10', borderColor: 'border-rose-500/30', gradient: 'from-rose-600 via-red-500 to-amber-500', icon: <Flame size={12} /> },
];

function getRank(rating: number): RankTier {
  return RANK_TIERS.find((t) => rating >= t.minRating && rating <= t.maxRating) ?? RANK_TIERS[0];
}

function RankBadge({ rating, size = 'sm' }: { rating: number; size?: 'xs' | 'sm' | 'md' | 'lg' }) {
  const rank = getRank(rating);
  const sizeClasses = {
    xs: 'text-[10px] px-2 py-0.5 gap-1',
    sm: 'text-xs px-2.5 py-1 gap-1',
    md: 'text-xs px-3 py-1 gap-1.5 font-extrabold',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-black shadow-xs',
  };
  return (
    <span className={`inline-flex items-center rounded-full border ${rank.bgColor} ${rank.color} ${rank.borderColor} ${sizeClasses[size]}`}>
      {rank.icon}
      {rank.name}
    </span>
  );
}

function StudentAvatar({
  name,
  rating,
  size = 'md',
  showStatus = false,
  status = 'online',
}: {
  name: string;
  rating: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showStatus?: boolean;
  status?: 'online' | 'in_match' | 'away' | 'offline';
}) {
  const rank = getRank(rating);
  const initials = (name || 'Student')
    .trim()
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg border-2',
    xl: 'w-20 h-20 text-2xl border-4',
  };

  const badgeSizes = {
    sm: 'w-4 h-4 -bottom-1 -right-1',
    md: 'w-4.5 h-4.5 -bottom-1 -right-1',
    lg: 'w-6 h-6 -bottom-1 -right-1',
    xl: 'w-8 h-8 -bottom-1.5 -right-1.5',
  };

  const statusColors = {
    online: 'bg-emerald-500 border-white dark:border-gray-900',
    in_match: 'bg-amber-500 border-white dark:border-gray-900 animate-pulse',
    away: 'bg-slate-400 border-white dark:border-gray-900',
    offline: 'bg-gray-400 border-white dark:border-gray-900',
  };

  return (
    <div className="relative inline-block shrink-0">
      <div
        className={`rounded-full flex items-center justify-center font-black text-white bg-gradient-to-tr ${rank.gradient} shadow-md border-border ${sizeClasses[size]}`}
      >
        {initials}
      </div>
      <div
        className={`absolute rounded-full bg-card border border-border shadow-xs flex items-center justify-center ${rank.color} ${badgeSizes[size]}`}
      >
        {rank.icon}
      </div>
      {showStatus && (
        <span
          className={`absolute top-0 right-0 w-3 h-3 rounded-full border-2 ${statusColors[status]}`}
        />
      )}
    </div>
  );
}

export default function MatchLobbyClient() {
  const { profile, user } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [me, setMe] = useState<OpponentProfile | null>(null);
  const signedIn = !!user || !!me;

  // Arena 2.0 States
  const [view, setView] = useState<LobbyView>('home');
  const [queueMode, setQueueMode] = useState<QueueMode>('quick');
  const [subjectFilter, setSubjectFilter] = useState<string>('mixed');
  const [difficulty, setDifficulty] = useState<MatchDifficulty>('medium');
  const [matchMode, setMatchMode] = useState<MatchMode>('standard');
  const [questionCount, setQuestionCount] = useState<number>(10);

  // Stats & Diagnostics
  const [subjectRatings, setSubjectRatings] = useState<SubjectRatings>({ overall: 1284, biology: 1410, chemistry: 1260, physics: 1175, mentalAgility: 1300 });
  const [streakDays, setStreakDays] = useState<number>(7);
  const [xpPoints, setXpPoints] = useState<number>(340);
  const [level, setLevel] = useState<number>(4);
  const [dailyMissions, setDailyMissions] = useState<DailyMission[]>([]);
  const [weaknessData, setWeaknessData] = useState<any>(null);
  const [rivalData, setRivalData] = useState<any>(null);

  // Matchmaking & Timers
  const [searchTime, setSearchTime] = useState(0);
  const [countdown, setCountdown] = useState(5);
  const [opponent, setOpponent] = useState<OpponentProfile | null>(null);
  const [queueId, setQueueId] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isMatchmaking, setIsMatchmaking] = useState(false);

  // Friends & Invitations
  const [friends, setFriends] = useState<FriendItem[]>([]);
  const [pendingReceived, setPendingReceived] = useState<FriendRequestItem[]>([]);
  const [pendingSent, setPendingSent] = useState<FriendRequestItem[]>([]);
  const [incomingInvites, setIncomingInvites] = useState<InvitationItem[]>([]);
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [challengeTarget, setChallengeTarget] = useState<FriendItem | null>(null);
  const [addFriendInput, setAddFriendInput] = useState('');
  const [friendActionMsg, setFriendActionMsg] = useState<string | null>(null);

  const searchTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const roomIdRef = useRef<string | null>(null);

  const userId = user?.id || me?.id;

  // 1. Fetch Profile, Ratings & Arena 2.0 Ecosystem Data
  useEffect(() => {
    fetch('/api/profile/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.id) {
          setMe({
            id: d.id,
            full_name: d.full_name || 'You',
            battle_rating: d.battle_rating ?? 1284,
            total_points: d.total_points ?? 0,
            college: d.college || undefined,
          });

          // Presence Heartbeat
          fetch('/api/arena/presence', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: d.id, status: 'online' }),
          }).catch(() => {});
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (userId) {
      // Fetch Subject Ratings
      fetch(`/api/arena/subject-ratings?userId=${userId}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.ratings) setSubjectRatings(d.ratings);
          if (d.streakDays) setStreakDays(d.streakDays);
          if (d.xpPoints) setXpPoints(d.xpPoints);
          if (d.level) setLevel(d.level);
        })
        .catch(() => {});

      // Fetch Daily Missions
      fetch(`/api/arena/daily-missions?userId=${userId}`)
        .then((r) => r.json())
        .then((d) => { if (d.missions) setDailyMissions(d.missions); })
        .catch(() => {});

      // Fetch Weakness Diagnostics
      fetch(`/api/arena/weakness-hunter?userId=${userId}`)
        .then((r) => r.json())
        .then((d) => setWeaknessData(d))
        .catch(() => {});

      // Fetch Rivals
      fetch(`/api/arena/rivals?userId=${userId}`)
        .then((r) => r.json())
        .then((d) => setRivalData(d.rival))
        .catch(() => {});
    }
  }, [userId]);

  // 2. Fetch Friends & Incoming Invitations
  const refreshFriendsAndInvites = useCallback(async () => {
    if (!userId) return;
    try {
      const resF = await fetch(`/api/arena/friends?userId=${userId}`);
      if (resF.ok) {
        const dataF = await resF.json();
        setFriends(dataF.friends || []);
        setPendingReceived(dataF.pendingReceived || []);
        setPendingSent(dataF.pendingSent || []);
      }

      const resI = await fetch(`/api/arena/invitations?userId=${userId}`);
      if (resI.ok) {
        const dataI = await resI.json();
        setIncomingInvites(dataI.invitations || []);
      }
    } catch {}
  }, [userId]);

  useEffect(() => {
    if (userId) {
      refreshFriendsAndInvites();
      const interval = setInterval(refreshFriendsAndInvites, 5000);
      return () => clearInterval(interval);
    }
  }, [userId, refreshFriendsAndInvites]);

  // Timers
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

  useEffect(() => {
    if (view === 'countdown') {
      setCountdown(5);
      countdownTimerRef.current = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            clearInterval(countdownTimerRef.current!);
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

  const triggerMatchFound = useCallback(async (matchedRoomId: string) => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    roomIdRef.current = matchedRoomId;
    setRoomId(matchedRoomId);

    const { data: room } = await supabase
      .from('battle_rooms')
      .select('*')
      .eq('id', matchedRoomId)
      .maybeSingle();

    if (room) {
      const otherId = room.creator_id === userId ? room.opponent_id : room.creator_id;
      if (otherId) {
        const { data: p } = await supabase
          .from('user_profiles')
          .select('id, full_name, battle_rating, total_points, college')
          .eq('id', otherId)
          .maybeSingle();

        if (p) setOpponent(p as OpponentProfile);
      }
    }

    setView('found');
    setTimeout(() => setView('countdown'), 2000);
  }, [userId, supabase]);

  const joinQueue = useCallback(async (mode: QueueMode) => {
    if (!userId) {
      setError('Please sign in to enter the Battle Arena.');
      return;
    }
    setError(null);
    setQueueMode(mode);
    setView('searching');
    setIsMatchmaking(true);

    try {
      const res = await fetch('/api/arena/matchmake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'search',
          userId,
          queueMode: mode,
          subjectFilter,
          difficulty,
          matchMode,
          questionCount,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to join matchmaking queue');
        setView('home');
        setIsMatchmaking(false);
        return;
      }

      setQueueId(data.queueId);

      if (data.matched && data.roomId) {
        triggerMatchFound(data.roomId);
      } else {
        pollTimerRef.current = setInterval(async () => {
          const { data: qRow } = await supabase
            .from('matchmaking_queue')
            .select('*')
            .eq('id', data.queueId)
            .maybeSingle();

          if (qRow && qRow.status === 'matched' && qRow.matched_room_id) {
            triggerMatchFound(qRow.matched_room_id);
          }
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || 'Matchmaking error');
      setView('home');
      setIsMatchmaking(false);
    }
  }, [userId, subjectFilter, difficulty, matchMode, questionCount, triggerMatchFound, supabase]);

  const cancelSearch = useCallback(async () => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    if (userId) {
      fetch('/api/arena/matchmake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel', userId }),
      }).catch(() => {});
    }
    setView('home');
    setIsMatchmaking(false);
  }, [userId]);

  const handleInvitationResponse = async (invitationId: string, action: 'accept' | 'decline') => {
    if (!userId) return;
    try {
      const res = await fetch('/api/arena/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: `${action}_invite`, userId, invitationId }),
      });

      const data = await res.json();
      if (data.success && action === 'accept' && data.roomId) {
        setIncomingInvites([]);
        triggerMatchFound(data.roomId);
      } else {
        refreshFriendsAndInvites();
      }
    } catch {}
  };

  const sendCustomChallenge = async () => {
    if (!userId || !challengeTarget) return;
    try {
      const res = await fetch('/api/arena/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_invite',
          userId,
          targetUserId: challengeTarget.id,
          subjectFilter,
          difficulty,
          matchMode,
          questionCount,
        }),
      });
      const data = await res.json();
      setFriendActionMsg(data.message || (data.success ? 'Challenge sent!' : 'Could not send challenge'));
      setTimeout(() => setFriendActionMsg(null), 3000);
      setShowChallengeModal(false);
    } catch {
      setFriendActionMsg('Failed to send challenge');
    }
  };

  const claimMissionReward = async (missionId: string) => {
    if (!userId) return;
    try {
      const res = await fetch('/api/arena/daily-missions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, missionId, action: 'claim' }),
      });
      const data = await res.json();
      if (data.success) {
        setXpPoints((prev) => prev + data.xpEarned);
        setDailyMissions((prev) =>
          prev.map((m) => (m.id === missionId ? { ...m, claimed: true } : m))
        );
      }
    } catch {}
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-background text-foreground py-8 px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Real-time Challenge Pop-up */}
        {incomingInvites.length > 0 && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
            <div className="bg-card border-2 border-primary/50 rounded-3xl p-6 shadow-2xl max-w-md w-full space-y-5 text-center">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto text-primary">
                <Swords size={28} />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-primary font-mono">⚔️ PRIVATE BATTLE CHALLENGE</span>
                <h3 className="text-xl font-black text-foreground">
                  {incomingInvites[0].sender.full_name} Challenged You!
                </h3>
                <p className="text-xs text-muted-foreground">
                  Subject: <span className="font-bold text-foreground capitalize">{incomingInvites[0].subjectFilter}</span> · 10 MCQs
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => handleInvitationResponse(incomingInvites[0].id, 'decline')}
                  className="btn-secondary w-full py-3 text-xs font-bold justify-center"
                >
                  Decline
                </button>
                <button
                  onClick={() => handleInvitationResponse(incomingInvites[0].id, 'accept')}
                  className="btn-primary w-full py-3 text-xs font-black justify-center gap-2"
                >
                  <Play size={14} className="fill-current" />
                  <span>Accept &amp; Fight</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 🏟️ ARENA 2.0 STATS HEADER DASHBOARD */}
        <div className="bg-gradient-to-br from-card via-card to-primary/5 border border-border/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-black border border-primary/20 flex items-center gap-1.5">
                  <Swords size={14} /> SAMYAK CEE ARENA 2.0
                </span>
                <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-black border border-amber-500/20 flex items-center gap-1.5">
                  <Flame size={14} /> 🔥 {streakDays} Day Training Streak
                </span>
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-1">
                  <Sparkles size={12} /> Level {level} ({xpPoints} XP)
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">Competitive Learning Network</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">Train, compete, diagnose weak topics, and prove your CEE entrance preparation.</p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => setShowFriendsModal(true)}
                className="btn-secondary py-3 px-5 text-xs font-bold flex items-center gap-2 shadow-xs"
              >
                <Users size={16} className="text-primary" />
                <span>Friends ({friends.filter((f) => f.status === 'online').length} Online)</span>
              </button>
              {me && <RankBadge rating={subjectRatings.overall} size="lg" />}
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-card border border-border/60 space-y-1">
              <span className="text-[10px] font-black uppercase text-muted-foreground font-mono">YOUR ARENA RATING</span>
              <div className="text-2xl font-black text-foreground font-mono flex items-center gap-1">
                {subjectRatings.overall} <Trophy size={16} className="text-amber-500" />
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-card border border-border/60 space-y-1">
              <span className="text-[10px] font-black uppercase text-muted-foreground font-mono">GLOBAL RANK</span>
              <div className="text-2xl font-black text-foreground font-mono flex items-center gap-1">
                #247 <Crown size={16} className="text-yellow-500" />
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-card border border-border/60 space-y-1">
              <span className="text-[10px] font-black uppercase text-muted-foreground font-mono">WEEKLY RANK</span>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono flex items-center gap-1">
                #31 <TrendingUp size={16} />
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-card border border-border/60 space-y-1">
              <span className="text-[10px] font-black uppercase text-muted-foreground font-mono">ARENA WIN RATE</span>
              <div className="text-2xl font-black text-primary font-mono">
                68%
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-error/10 border border-error/30 text-error text-xs font-bold flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)}><X size={16} /></button>
          </div>
        )}

        {/* View 1: Home Lobby */}
        {view === 'home' && (
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 space-y-6">

              {/* 🎯 MATCH PERSONALIZATION PANEL */}
              <div className="bg-card border border-border/80 rounded-3xl p-6 shadow-xs space-y-5">
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <span className="text-xs font-black uppercase text-foreground font-mono flex items-center gap-2">
                    <Target size={16} className="text-primary" /> MATCH PERSONALIZATION &amp; FILTERS
                  </span>
                  <span className="text-[10px] font-bold text-muted-foreground">Select rules before finding match</span>
                </div>

                {/* Subject Selector */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase font-mono">1. Select Subject</span>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                    {[
                      { id: 'mixed', label: 'Mixed CEE', icon: <Zap size={20} className="text-amber-500" /> },
                      { id: 'biology', label: 'Biology', icon: <Dna size={20} className="text-emerald-500" /> },
                      { id: 'chemistry', label: 'Chemistry', icon: <FlaskConical size={20} className="text-purple-500" /> },
                      { id: 'physics', label: 'Physics', icon: <Atom size={20} className="text-blue-500" /> },
                      { id: 'mental_agility', label: 'Mental Agility', icon: <Brain size={20} className="text-pink-500" /> },
                    ].map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setSubjectFilter(s.id)}
                        className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                          subjectFilter === s.id
                            ? 'border-primary bg-primary/10 text-primary shadow-xs'
                            : 'border-border/60 bg-muted/20 text-muted-foreground hover:bg-muted/40'
                        }`}
                      >
                        <div className="p-2 rounded-xl bg-card border border-border/40 shadow-2xs">
                          {s.icon}
                        </div>
                        <span>{s.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Difficulty & Match Mode */}
                <div className="grid sm:grid-cols-2 gap-4 pt-1">
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase font-mono">2. Select Difficulty</span>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'medium', label: 'Medium', desc: 'Standard CEE', icon: <Zap size={14} className="text-amber-500" /> },
                        { id: 'hard', label: 'Hard', desc: 'Rank Booster', icon: <Flame size={14} className="text-orange-500" /> },
                        { id: 'extreme', label: 'Extreme', desc: 'Top 100 Elite', icon: <Crown size={14} className="text-rose-500" /> },
                        { id: 'easy', label: 'Warmup', desc: 'Quick Review', icon: <ShieldCheck size={14} className="text-emerald-500" /> },
                      ].map((d) => (
                        <button
                          key={d.id}
                          onClick={() => setDifficulty(d.id as MatchDifficulty)}
                          className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                            difficulty === d.id
                              ? 'border-primary bg-primary/10 text-foreground font-extrabold shadow-2xs'
                              : 'border-border/60 text-muted-foreground hover:bg-muted/20'
                          }`}
                        >
                          <div className="font-extrabold flex items-center gap-1.5">
                            {d.icon}
                            <span>{d.label}</span>
                          </div>
                          <div className="text-[9px] text-muted-foreground">{d.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase font-mono">3. Select Format</span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setMatchMode('standard')}
                        className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                          matchMode === 'standard'
                            ? 'border-primary bg-primary/10 text-foreground font-extrabold shadow-2xs'
                            : 'border-border/60 text-muted-foreground hover:bg-muted/20'
                        }`}
                      >
                        <div className="font-extrabold flex items-center gap-1.5">
                          <Swords size={14} className="text-primary" />
                          <span>Standard Match</span>
                        </div>
                        <div className="text-[9px] text-muted-foreground">1 Round · 10 Questions</div>
                      </button>
                      <button
                        onClick={() => setMatchMode('best_of_3')}
                        className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                          matchMode === 'best_of_3'
                            ? 'border-amber-500 bg-amber-500/10 text-amber-600 font-extrabold shadow-2xs'
                            : 'border-border/60 text-muted-foreground hover:bg-muted/20'
                        }`}
                      >
                        <div className="font-bold flex items-center gap-1.5">
                          <Trophy size={14} className="text-amber-500" />
                          <span>Best of 3</span>
                        </div>
                        <div className="text-[9px] text-muted-foreground">Series Rivalry</div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Matchmaking Queue Cards */}
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="bg-card border-2 border-primary/40 rounded-3xl p-6 shadow-md space-y-4 relative overflow-hidden group hover:border-primary transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-primary text-white font-mono flex items-center gap-1">
                      <Radio size={12} className="animate-pulse" /> LIVE COMPETITION
                    </span>
                    <Zap size={20} className="text-primary" />
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-xl font-black text-foreground">Quick Match</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Instant 1v1 battle against any online student matching your parameters.
                    </p>
                  </div>

                  <button
                    onClick={() => joinQueue('quick')}
                    className="btn-primary w-full py-3.5 text-xs font-black justify-center gap-2 shadow-md"
                  >
                    <Play size={14} className="fill-current" />
                    <span>Find Live Match Now</span>
                  </button>
                </div>

                <div className="bg-card border border-border/80 rounded-3xl p-6 shadow-xs space-y-4 hover:border-border transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20 font-mono flex items-center gap-1">
                      <Trophy size={12} /> ELO RANKED MATCH
                    </span>
                    <Crown size={20} className="text-amber-500" />
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-xl font-black text-foreground">Ranked ELO Battle</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Strict ±150 ELO rating matching. Winner gains ELO rating points on leaderboard.
                    </p>
                  </div>

                  <button
                    onClick={() => joinQueue('ranked')}
                    className="btn-secondary w-full py-3.5 text-xs font-bold justify-center gap-2"
                  >
                    <Trophy size={14} className="text-amber-500" />
                    <span>Enter Ranked Queue</span>
                  </button>
                </div>
              </div>

              {/* 🧠 WEAKNESS HUNTER CARD */}
              {weaknessData?.weakness && (
                <div className="bg-gradient-to-br from-card via-card to-error/5 border border-error/30 rounded-3xl p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-error font-mono flex items-center gap-1.5">
                      <AlertTriangle size={16} /> YOUR BIGGEST WEAKNESS DETECTED
                    </span>
                    <span className="text-xs font-mono font-bold text-muted-foreground">Accuracy: {weaknessData.weakness.accuracy}%</span>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-lg font-black text-foreground">
                      {weaknessData.weakness.subject} — {weaknessData.weakness.targetTopic}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Your battle data shows lower accuracy in {weaknessData.weakness.targetTopic}. Train targeted questions before your next battle.
                    </p>
                  </div>

                  <Link
                    href={weaknessData.recommendation?.actionUrl || '/practice'}
                    className="btn-primary inline-flex items-center gap-2 text-xs font-black py-2.5 px-5 shadow-xs"
                  >
                    <span>START TARGETED PRACTICE</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              )}

              {/* 🎯 TODAY'S DAILY MISSIONS */}
              {dailyMissions.length > 0 && (
                <div className="bg-card border border-border/80 rounded-3xl p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-border/60 pb-3">
                    <span className="text-xs font-black uppercase text-foreground font-mono flex items-center gap-2">
                      <Sparkles size={16} className="text-amber-500" /> TODAY&apos;S DAILY MISSIONS
                    </span>
                    <span className="text-[10px] font-bold text-muted-foreground">Resets at Midnight</span>
                  </div>

                  <div className="space-y-3">
                    {dailyMissions.map((m) => (
                      <div key={m.id} className="p-3.5 rounded-2xl bg-muted/20 border border-border/60 flex items-center justify-between gap-4 text-xs">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-foreground">{m.mission_title}</span>
                            <span className="text-[10px] font-mono font-bold text-amber-600">+{m.xp_reward} XP</span>
                          </div>
                          <div className="w-full bg-muted/60 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-primary h-full rounded-full transition-all"
                              style={{ width: `${Math.min(100, (m.current_count / m.target_count) * 100)}%` }}
                            />
                          </div>
                        </div>

                        {m.completed && !m.claimed ? (
                          <button
                            onClick={() => claimMissionReward(m.id)}
                            className="px-3.5 py-2 rounded-xl bg-amber-500 text-white text-[10px] font-black shrink-0 hover:bg-amber-600"
                          >
                            Claim XP
                          </button>
                        ) : m.claimed ? (
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full shrink-0">Claimed</span>
                        ) : (
                          <span className="text-[10px] font-mono text-muted-foreground shrink-0">{m.current_count}/{m.target_count}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Sidebar */}
            <div className="lg:col-span-4 space-y-6">

              {/* 📊 SUBJECT RATING DIAGNOSTIC BREAKDOWN */}
              <div className="bg-card border border-border/80 rounded-3xl p-6 shadow-xs space-y-4">
                <span className="text-xs font-black uppercase text-foreground font-mono flex items-center gap-2 border-b border-border/60 pb-3">
                  <BarChart3 size={16} className="text-primary" /> SKILL RATING DIAGNOSTIC
                </span>

                <div className="space-y-3 text-xs">
                  {[
                    { name: 'Biology', rating: subjectRatings.biology, icon: <Dna size={14} className="text-emerald-500" />, color: 'bg-emerald-500' },
                    { name: 'Chemistry', rating: subjectRatings.chemistry, icon: <FlaskConical size={14} className="text-purple-500" />, color: 'bg-purple-500' },
                    { name: 'Physics', rating: subjectRatings.physics, icon: <Atom size={14} className="text-amber-500" />, color: 'bg-amber-500' },
                    { name: 'Mental Agility', rating: subjectRatings.mentalAgility, icon: <Brain size={14} className="text-cyan-500" />, color: 'bg-cyan-500' },
                  ].map((sub) => (
                    <div key={sub.name} className="space-y-1">
                      <div className="flex items-center justify-between font-bold">
                        <span className="flex items-center gap-1.5">{sub.icon} {sub.name}</span>
                        <span className="font-mono text-foreground">{sub.rating} ELO</span>
                      </div>
                      <div className="w-full bg-muted/40 h-2 rounded-full overflow-hidden">
                        <div
                          className={`${sub.color} h-full rounded-full`}
                          style={{ width: `${Math.min(100, (sub.rating / 2500) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ⚔️ YOUR RIVAL CARD */}
              {rivalData && (
                <div className="bg-card border-2 border-amber-500/40 rounded-3xl p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-amber-600 font-mono">YOUR ARCH RIVAL</span>
                    <Flame size={18} className="text-amber-500" />
                  </div>

                  <div className="flex items-center gap-3">
                    <StudentAvatar name={rivalData.fullName} rating={rivalData.battleRating} size="md" />
                    <div className="space-y-0.5 min-w-0">
                      <h3 className="text-base font-black text-foreground truncate">{rivalData.fullName}</h3>
                      <p className="text-xs text-muted-foreground font-mono">{rivalData.battleRating} ELO · {rivalData.currentStreak}</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-muted/30 border border-border/60 grid grid-cols-2 text-center text-xs">
                    <div>
                      <span className="text-[10px] text-muted-foreground block font-bold">YOUR WINS</span>
                      <span className="font-black text-emerald-600 font-mono text-lg">{rivalData.userWins}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block font-bold">RIVAL WINS</span>
                      <span className="font-black text-amber-600 font-mono text-lg">{rivalData.rivalWins}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const f = friends.find((fr) => fr.id === rivalData.id);
                      if (f) {
                        setChallengeTarget(f);
                        setShowChallengeModal(true);
                      }
                    }}
                    className="btn-primary w-full py-2.5 text-xs font-black justify-center"
                  >
                    Challenge Rival Now
                  </button>
                </div>
              )}

              {/* Online Friends Drawer Callout */}
              <div className="bg-card border border-border/80 rounded-3xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <span className="text-xs font-black uppercase text-foreground font-mono">ONLINE FRIENDS</span>
                  <button onClick={() => setShowFriendsModal(true)} className="text-xs text-primary font-bold hover:underline">
                    Manage
                  </button>
                </div>

                <div className="space-y-3">
                  {friends.length === 0 ? (
                    <div className="text-center py-6 text-xs text-muted-foreground space-y-2">
                      <Users size={24} className="mx-auto text-muted-foreground/60" />
                      <p>No friends added yet.</p>
                      <button onClick={() => setShowFriendsModal(true)} className="text-primary font-bold underline text-xs">
                        + Add Friends
                      </button>
                    </div>
                  ) : (
                    friends.slice(0, 5).map((f) => (
                      <div key={f.id} className="p-3 rounded-2xl bg-muted/30 border border-border/60 flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <StudentAvatar name={f.full_name} rating={f.battle_rating} size="sm" showStatus status={f.status} />
                          <div className="space-y-0.5 min-w-0">
                            <span className="font-extrabold text-foreground truncate block">{f.full_name}</span>
                            <span className="text-[10px] font-mono text-muted-foreground block">{f.battle_rating} ELO</span>
                          </div>
                        </div>

                        {f.status === 'online' ? (
                          <button
                            onClick={() => {
                              setChallengeTarget(f);
                              setShowChallengeModal(true);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-primary text-white text-[10px] font-extrabold hover:bg-primary-dark transition-colors"
                          >
                            Challenge
                          </button>
                        ) : f.status === 'in_match' ? (
                          <span className="text-[10px] font-bold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full">In Match</span>
                        ) : (
                          <span className="text-[10px] font-medium text-muted-foreground">Offline</span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* View 2: Searching Screen */}
        {view === 'searching' && (
          <div className="max-w-md mx-auto bg-card border-2 border-primary/30 rounded-3xl p-8 shadow-xl text-center space-y-6">
            <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
              <Swords size={36} className="text-primary animate-pulse" />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-primary font-mono">SEARCHING FOR OPPONENT</span>
              <h2 className="text-2xl font-black text-foreground">Searching Online Players...</h2>
              <p className="text-xs text-muted-foreground">
                Time elapsed: <span className="font-mono font-bold text-foreground">{searchTime}s</span>
              </p>
            </div>

            <p className="text-[11px] text-muted-foreground bg-muted/40 p-3 rounded-2xl border border-border/60">
              Subject: <span className="font-bold text-foreground capitalize">{subjectFilter}</span> · Format: <span className="font-bold text-foreground uppercase">{matchMode}</span>
            </p>

            <button onClick={cancelSearch} className="btn-secondary w-full py-3 text-xs font-bold justify-center">
              Cancel Matchmaking
            </button>
          </div>
        )}

        {/* View 3 & 4: Match Found & Countdown */}
        {(view === 'found' || view === 'countdown') && opponent && me && (
          <div className="max-w-xl mx-auto bg-card border-2 border-emerald-500/40 rounded-3xl p-8 shadow-2xl text-center space-y-6">
            <span className="px-3.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-black border border-emerald-500/20 flex items-center gap-1.5 w-fit mx-auto">
              <Radio size={12} className="animate-pulse" /> MATCH FOUND!
            </span>

            <div className="grid grid-cols-2 gap-4 items-center pt-2">
              <div className="p-5 rounded-2xl bg-primary/5 border border-primary/30 flex flex-col items-center gap-2">
                <StudentAvatar name={me.full_name} rating={subjectRatings.overall} size="xl" />
                <div className="text-center">
                  <span className="text-[10px] font-black text-primary uppercase font-mono block">YOU</span>
                  <span className="text-base font-black text-foreground block truncate">{me.full_name}</span>
                  <RankBadge rating={subjectRatings.overall} size="xs" />
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/30 flex flex-col items-center gap-2">
                <StudentAvatar name={opponent.full_name} rating={opponent.battle_rating} size="xl" />
                <div className="text-center">
                  <span className="text-[10px] font-black text-amber-600 uppercase font-mono block">OPPONENT</span>
                  <span className="text-base font-black text-foreground block truncate">{opponent.full_name}</span>
                  <RankBadge rating={opponent.battle_rating} size="xs" />
                </div>
              </div>
            </div>

            <div className="space-y-1 pt-2">
              <span className="text-4xl font-black text-foreground font-mono">{countdown}</span>
              <p className="text-xs font-bold text-muted-foreground">Entering Synchronized Battle Room...</p>
            </div>
          </div>
        )}

        {/* Custom Friend Challenge Modal */}
        {showChallengeModal && challengeTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-card border border-border rounded-3xl p-6 shadow-2xl max-w-md w-full space-y-5">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <h3 className="text-lg font-black text-foreground">Challenge {challengeTarget.full_name}</h3>
                <button onClick={() => setShowChallengeModal(false)}><X size={20} /></button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="font-bold text-muted-foreground block mb-1">Subject</span>
                  <select
                    value={subjectFilter}
                    onChange={(e) => setSubjectFilter(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-muted/30 border border-border text-foreground font-bold"
                  >
                    <option value="mixed">Mixed CEE Syllabus</option>
                    <option value="biology">Biology</option>
                    <option value="chemistry">Chemistry</option>
                    <option value="physics">Physics</option>
                  </select>
                </div>

                <div>
                  <span className="font-bold text-muted-foreground block mb-1">Format</span>
                  <select
                    value={matchMode}
                    onChange={(e) => setMatchMode(e.target.value as MatchMode)}
                    className="w-full p-2.5 rounded-xl bg-muted/30 border border-border text-foreground font-bold"
                  >
                    <option value="standard">Standard Single Match</option>
                    <option value="best_of_3">Best of 3 Series</option>
                  </select>
                </div>
              </div>

              <button
                onClick={sendCustomChallenge}
                className="btn-primary w-full py-3 text-xs font-black justify-center gap-2"
              >
                <Swords size={16} />
                <span>Send Challenge</span>
              </button>
            </div>
          </div>
        )}

        {/* Friends Drawer Modal */}
        {showFriendsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <div className="bg-card border border-border rounded-3xl p-6 shadow-2xl max-w-lg w-full space-y-6 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-border/60 pb-4">
                <h3 className="text-lg font-black text-foreground">Friends &amp; Privacy</h3>
                <button onClick={() => setShowFriendsModal(false)}><X size={20} /></button>
              </div>

              {friendActionMsg && (
                <div className="p-3 rounded-xl bg-primary/10 text-primary text-xs font-bold text-center">
                  {friendActionMsg}
                </div>
              )}

              <div className="space-y-2">
                <span className="text-xs font-bold text-foreground block">Add Friend by User ID:</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter Student UUID..."
                    value={addFriendInput}
                    onChange={(e) => setAddFriendInput(e.target.value)}
                    className="flex-1 px-3.5 py-2 rounded-xl bg-muted/30 border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                  />
                  <button
                    onClick={() => {
                      if (addFriendInput.trim()) {
                        fetch('/api/arena/friends', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ action: 'send_request', userId, targetUserId: addFriendInput.trim() }),
                        });
                        setAddFriendInput('');
                      }
                    }}
                    className="btn-primary px-4 py-2 text-xs font-bold shrink-0"
                  >
                    Send Request
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-foreground block">My Friends ({friends.length}):</span>
                <div className="space-y-2">
                  {friends.map((f) => (
                    <div key={f.id} className="p-3 rounded-2xl bg-muted/30 border border-border/60 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <StudentAvatar name={f.full_name} rating={f.battle_rating} size="sm" showStatus status={f.status} />
                        <div className="space-y-0.5 min-w-0">
                          <span className="font-extrabold text-foreground block truncate">{f.full_name}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">{f.battle_rating} ELO · <span className="capitalize">{f.status}</span></span>
                        </div>
                      </div>
                      {f.status === 'online' && (
                        <button
                          onClick={() => {
                            setChallengeTarget(f);
                            setShowChallengeModal(true);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-primary text-white text-[10px] font-extrabold hover:bg-primary-dark transition-colors"
                        >
                          Challenge
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
