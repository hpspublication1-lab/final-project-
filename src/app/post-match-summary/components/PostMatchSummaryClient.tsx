'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Trophy, XCircle, Swords, RotateCcw, ChevronRight, TrendingUp, TrendingDown,
  Target, Zap, CheckCircle2, Clock, Shield, Star, Award, Crown, Flame,
  ChevronDown, ChevronUp, BarChart2, Play, Loader2, AlertCircle,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface QuestionReplay {
  id: string;
  index: number;
  question: string;
  subject: string;
  yourAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  timeTaken: number;
  opponentCorrect: boolean;
}

interface PlayerResult {
  name: string;
  initials: string;
  score: number;
  correct: number;
  wrong: number;
  skipped: number;
  accuracy: number;
  avgTime: number;
  streak: number;
  eloRating: number;
  eloDelta: number;
  isYou: boolean;
}

// ─── Rank helpers (mirrors MatchLobbyClient) ──────────────────────────────────

interface RankTier {
  name: string;
  minRating: number;
  color: string;
  bgColor: string;
  borderColor: string;
  gradient: string;
  icon: React.ReactNode;
}

const RANK_TIERS: RankTier[] = [
  { name: 'Bronze',      minRating: 0,    color: 'text-amber-700', bgColor: 'bg-amber-100',  borderColor: 'border-amber-300',  gradient: 'from-amber-700 to-amber-500',   icon: <Shield size={12} /> },
  { name: 'Silver',      minRating: 1000, color: 'text-slate-500', bgColor: 'bg-slate-100',  borderColor: 'border-slate-300',  gradient: 'from-slate-500 to-slate-400',   icon: <Shield size={12} /> },
  { name: 'Gold',        minRating: 1300, color: 'text-yellow-600',bgColor: 'bg-yellow-50',  borderColor: 'border-yellow-300', gradient: 'from-yellow-600 to-yellow-400', icon: <Star size={12} /> },
  { name: 'Platinum',    minRating: 1600, color: 'text-cyan-600',  bgColor: 'bg-cyan-50',    borderColor: 'border-cyan-300',   gradient: 'from-cyan-600 to-cyan-400',     icon: <Award size={12} /> },
  { name: 'Diamond',     minRating: 1900, color: 'text-blue-600',  bgColor: 'bg-blue-50',    borderColor: 'border-blue-300',   gradient: 'from-blue-600 to-blue-400',     icon: <Crown size={12} /> },
  { name: 'Master',      minRating: 2200, color: 'text-purple-600',bgColor: 'bg-purple-50',  borderColor: 'border-purple-300', gradient: 'from-purple-600 to-purple-400', icon: <Crown size={12} /> },
  { name: 'Grandmaster', minRating: 2500, color: 'text-rose-600',  bgColor: 'bg-rose-50',    borderColor: 'border-rose-300',   gradient: 'from-rose-600 to-orange-500',   icon: <Flame size={12} /> },
];

function getRank(rating: number): RankTier {
  return [...RANK_TIERS].reverse().find((t) => rating >= t.minRating) ?? RANK_TIERS[0];
}

function RankBadge({ rating }: { rating: number }) {
  const rank = getRank(rating);
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-bold border ${rank.bgColor} ${rank.color} ${rank.borderColor}`}>
      {rank.icon} {rank.name}
    </span>
  );
}

function EloBar({ after }: { after: number }) {
  const rank = getRank(after);
  const nextTier = [...RANK_TIERS].find((t) => t.minRating > rank.minRating);
  const progress = nextTier
    ? Math.min(100, Math.round(((after - rank.minRating) / (nextTier.minRating - rank.minRating)) * 100))
    : 100;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className={`font-semibold ${rank.color}`}>{rank.name}</span>
        {nextTier && <span className="text-muted-foreground">{nextTier.minRating - after} pts to {nextTier.name}</span>}
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${rank.gradient} transition-all duration-1000`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

function getInitials(name: string): string {
  return (name || '?')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * A to-one PostgREST embed is usually an object but can come back as an array
 * for ambiguous relationships. Normalize so `.full_name` / `.option_a` lookups
 * don't silently read from an array and return undefined ("missing data").
 */
function pickOne<T = any>(value: unknown): T | null {
  if (Array.isArray(value)) return (value[0] as T) ?? null;
  return (value as T) ?? null;
}

const SUBJECT_LABELS: Record<string, string> = {
  biology: 'Biology',
  chemistry: 'Chemistry',
  physics: 'Physics',
  mental_agility: 'Mental Agility',
};

const SUBJECT_COLORS: Record<string, string> = {
  Biology: 'bg-bio-light text-bio border-bio/20',
  Chemistry: 'bg-chem-light text-chem border-chem/20',
  Physics: 'bg-physics-light text-physics border-physics/20',
  'Mental Agility': 'bg-ma-light text-ma border-ma/20',
};

const emptyPlayer = (name: string, isYou: boolean): PlayerResult => ({
  name, initials: getInitials(name), score: 0, correct: 0, wrong: 0, skipped: 0,
  accuracy: 0, avgTime: 0, streak: 0, eloRating: 1000, eloDelta: 0, isYou,
});

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PostMatchSummaryClient() {
  const [isDark, setIsDark] = useState(false);
  const [showReplay, setShowReplay] = useState(false);
  const [animIn, setAnimIn] = useState(false);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error' | 'no-room'>('loading');

  const [you, setYou] = useState<PlayerResult>(emptyPlayer('You', true));
  const [opp, setOpp] = useState<PlayerResult>(emptyPlayer('Opponent', false));
  const [questions, setQuestions] = useState<QuestionReplay[]>([]);

  const searchParams = useSearchParams();
  const roomId = searchParams.get('room');
  const { user } = useAuth();
  const supabase = createClient();

  useEffect(() => {
    const t = setTimeout(() => setAnimIn(true), 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!roomId) {
      setLoadState('no-room');
      return;
    }
    if (!user) return;

    let cancelled = false;

    (async () => {
      setLoadState('loading');

      const { data: roomRow, error: roomErr } = await supabase
        .from('battle_rooms')
        .select(
          'id, creator_id, opponent_id, ' +
          'creator:user_profiles!battle_rooms_creator_id_fkey(id, full_name, battle_rating), ' +
          'opponent:user_profiles!battle_rooms_opponent_id_fkey(id, full_name, battle_rating)'
        )
        .eq('id', roomId)
        .single();

      if (cancelled) return;

      if (roomErr || !roomRow) {
        setLoadState('error');
        return;
      }
      const typedRoom = roomRow as any;
      if (typedRoom.creator_id !== user.id && typedRoom.opponent_id !== user.id) {
        setLoadState('error');
        return;
      }

      const isMeCreator = typedRoom.creator_id === user.id;
      const creatorProfile = pickOne(typedRoom.creator);
      const opponentProfile = pickOne(typedRoom.opponent);
      const myProfile = isMeCreator ? creatorProfile : opponentProfile;
      const oppProfile = isMeCreator ? opponentProfile : creatorProfile;

      const [{ data: resultRows }, { data: answerRows }] = await Promise.all([
        supabase.from('battle_results').select('*').eq('room_id', roomId),
        supabase
          .from('battle_answers')
          .select(
            'player_id, question_id, question_index, selected_option, is_correct, time_taken_seconds, ' +
            'questions(question_text, option_a, option_b, option_c, option_d, correct_option, subjects(name))'
          )
          .eq('room_id', roomId)
          .order('question_index', { ascending: true }),
      ]);

      if (cancelled) return;

      const myResultRow = (resultRows ?? []).find((r: any) => r.player_id === user.id) as any;
      const oppResultRow = (resultRows ?? []).find((r: any) => r.player_id !== user.id) as any;

      const myAnswers = (answerRows ?? []).filter((a: any) => a.player_id === user.id);
      const oppAnswers = (answerRows ?? []).filter((a: any) => a.player_id !== user.id);

      const avgTime = (rows: any[]) =>
        rows.length > 0
          ? Math.round(rows.reduce((sum, r) => sum + (r.time_taken_seconds ?? 0), 0) / rows.length)
          : 0;

      const longestStreak = (rows: any[]) => {
        let max = 0;
        let cur = 0;
        for (const r of [...rows].sort((a, b) => a.question_index - b.question_index)) {
          if (r.is_correct) { cur += 1; max = Math.max(max, cur); } else { cur = 0; }
        }
        return max;
      };

      const totalQuestions = Math.max(
        myAnswers.length,
        oppAnswers.length,
        ...(answerRows ?? []).map((a: any) => a.question_index + 1),
        0
      );

      setYou({
        name: myProfile?.full_name ?? 'You',
        initials: getInitials(myProfile?.full_name ?? 'You'),
        score: myResultRow ? Number(myResultRow.score) : 0,
        correct: myResultRow?.correct_answers ?? myAnswers.filter((a: any) => a.is_correct).length,
        wrong: myResultRow?.incorrect_answers ?? myAnswers.filter((a: any) => !a.is_correct).length,
        skipped: Math.max(0, totalQuestions - myAnswers.length),
        accuracy: myResultRow ? Number(myResultRow.accuracy) : 0,
        avgTime: avgTime(myAnswers),
        streak: longestStreak(myAnswers),
        eloRating: myProfile?.battle_rating ?? 1000,
        eloDelta: myResultRow?.rating_change ?? 0,
        isYou: true,
      });

      setOpp({
        name: oppProfile?.full_name ?? 'Opponent',
        initials: getInitials(oppProfile?.full_name ?? 'Opponent'),
        score: oppResultRow ? Number(oppResultRow.score) : 0,
        correct: oppResultRow?.correct_answers ?? oppAnswers.filter((a: any) => a.is_correct).length,
        wrong: oppResultRow?.incorrect_answers ?? oppAnswers.filter((a: any) => !a.is_correct).length,
        skipped: Math.max(0, totalQuestions - oppAnswers.length),
        accuracy: oppResultRow ? Number(oppResultRow.accuracy) : 0,
        avgTime: avgTime(oppAnswers),
        streak: longestStreak(oppAnswers),
        eloRating: oppProfile?.battle_rating ?? 1000,
        eloDelta: oppResultRow?.rating_change ?? 0,
        isYou: false,
      });

      // Build the replay from every question index either player answered
      const indices = Array.from(
        new Set((answerRows ?? []).map((a: any) => a.question_index))
      ).sort((a, b) => a - b);

      const optionText = (row: any, letter: string | null) => {
        const q = pickOne<any>(row?.questions);
        if (!letter || !q) return '';
        const key = `option_${letter}` as 'option_a' | 'option_b' | 'option_c' | 'option_d';
        return q[key] ?? '';
      };

      const replay: QuestionReplay[] = indices.map((idx) => {
        const mine = myAnswers.find((a: any) => a.question_index === idx) as any;
        const theirs = oppAnswers.find((a: any) => a.question_index === idx) as any;
        const source = (mine ?? theirs) as any;
        const q = pickOne<any>(source?.questions);
        const subj = pickOne<any>(q?.subjects);
        const subjectName = subj?.name ? SUBJECT_LABELS[subj.name] ?? 'Mixed' : 'Mixed';
        return {
          id: source?.question_id ?? `q-${idx}`,
          index: idx,
          question: q?.question_text ?? '',
          subject: subjectName,
          yourAnswer: mine ? optionText(mine, mine.selected_option) : '',
          correctAnswer: optionText(source, q?.correct_option ?? null),
          isCorrect: !!mine?.is_correct,
          timeTaken: mine?.time_taken_seconds ?? 0,
          opponentCorrect: !!theirs?.is_correct,
        };
      });

      setQuestions(replay);
      setLoadState('ready');
    })();

    return () => { cancelled = true; };
  }, [roomId, user]);

  const won = you.score >= opp.score;

  const subjectBreakdown = Object.values(SUBJECT_LABELS).map((subj) => {
    const qs = questions.filter((q) => q.subject === subj);
    const correct = qs.filter((q) => q.isCorrect).length;
    return { subj, total: qs.length, correct, pct: qs.length ? Math.round((correct / qs.length) * 100) : 0 };
  });

  if (loadState === 'no-room') {
    return (
      <DashboardLayout isDark={isDark} onToggleDark={() => setIsDark(!isDark)}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Swords size={28} className="text-muted-foreground" />
            </div>
            <h2 className="text-lg font-bold text-foreground mb-2">No match selected</h2>
            <p className="text-sm text-muted-foreground mb-5">Finish a battle in the Arena to see its full summary here.</p>
            <Link href="/battle-arena" className="btn-primary inline-flex text-sm py-2 px-5">Go to Battle Arena</Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (loadState === 'error') {
    return (
      <DashboardLayout isDark={isDark} onToggleDark={() => setIsDark(!isDark)}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 bg-error-light rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={28} className="text-error" />
            </div>
            <h2 className="text-lg font-bold text-foreground mb-2">Couldn't load this match</h2>
            <p className="text-sm text-muted-foreground mb-5">It may not exist, or you weren't a participant in it.</p>
            <Link href="/battle-arena" className="btn-primary inline-flex text-sm py-2 px-5">Back to Arena</Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (loadState === 'loading') {
    return (
      <DashboardLayout isDark={isDark} onToggleDark={() => setIsDark(!isDark)}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 size={32} className="text-primary animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout isDark={isDark} onToggleDark={() => setIsDark(!isDark)}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-4">

        {/* ── Result Banner ── */}
        <div
          className={`relative overflow-hidden rounded-2xl border-2 p-6 text-center transition-all duration-700 ${
            animIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          } ${won ? 'border-success/40 bg-gradient-to-br from-success/10 via-success/5 to-transparent' : 'border-error/30 bg-gradient-to-br from-error/8 via-error/4 to-transparent'}`}
        >
          <div className={`absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-10 ${won ? 'bg-success' : 'bg-error'}`} />

          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3 ${won ? 'bg-success-light' : 'bg-error-light'}`}>
            {won ? <Trophy size={30} className="text-success" /> : <XCircle size={30} className="text-error" />}
          </div>
          <h1 className={`text-3xl font-extrabold mb-1 ${won ? 'text-success' : 'text-error'}`}>
            {won ? '🎉 Victory!' : 'Defeated'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {won ? 'Outstanding performance! You outplayed your opponent.' : "A tough battle. Keep grinding — you'll get them next time."}
          </p>
        </div>

        {/* ── VS Score Card ── */}
        <div className={`bg-card border border-border rounded-2xl p-5 transition-all duration-700 delay-100 ${animIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 border-2 border-primary/30 flex items-center justify-center text-primary font-extrabold text-xl mx-auto">
                {you.initials}
              </div>
              <div>
                <p className="text-sm font-bold text-foreground truncate">{you.name}</p>
                <p className="text-xs text-muted-foreground">You</p>
              </div>
              <RankBadge rating={you.eloRating} />
              <p className={`text-4xl font-black ${won ? 'text-success' : 'text-foreground'}`}>{you.score}</p>
            </div>

            <div className="flex flex-col items-center gap-1">
              <span className="text-xl font-black text-muted-foreground">VS</span>
              <div className="w-px h-12 bg-border" />
            </div>

            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-chem-light border-2 border-chem/30 flex items-center justify-center text-chem font-extrabold text-xl mx-auto">
                {opp.initials}
              </div>
              <div>
                <p className="text-sm font-bold text-foreground truncate">{opp.name}</p>
                <p className="text-xs text-muted-foreground">Opponent</p>
              </div>
              <RankBadge rating={opp.eloRating} />
              <p className={`text-4xl font-black ${!won ? 'text-success' : 'text-foreground'}`}>{opp.score}</p>
            </div>
          </div>
        </div>

        {/* ── ELO Change ── */}
        <div className={`bg-card border border-border rounded-2xl p-5 transition-all duration-700 delay-150 ${animIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <BarChart2 size={13} /> ELO Rating Update
          </p>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className={`rounded-xl p-3.5 border ${you.eloDelta >= 0 ? 'bg-success/5 border-success/20' : 'bg-error/5 border-error/20'}`}>
              <p className="text-xs text-muted-foreground mb-1">Your Rating</p>
              <div className="flex items-end gap-2">
                <p className="text-2xl font-extrabold text-foreground">{you.eloRating}</p>
                <span className={`flex items-center gap-0.5 text-sm font-bold pb-0.5 ${you.eloDelta >= 0 ? 'text-success' : 'text-error'}`}>
                  {you.eloDelta >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {you.eloDelta > 0 ? '+' : ''}{you.eloDelta}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">was {you.eloRating - you.eloDelta}</p>
            </div>

            <div className={`rounded-xl p-3.5 border ${opp.eloDelta >= 0 ? 'bg-success/5 border-success/20' : 'bg-error/5 border-error/20'}`}>
              <p className="text-xs text-muted-foreground mb-1">{opp.name.split(' ')[0]}'s Rating</p>
              <div className="flex items-end gap-2">
                <p className="text-2xl font-extrabold text-foreground">{opp.eloRating}</p>
                <span className={`flex items-center gap-0.5 text-sm font-bold pb-0.5 ${opp.eloDelta >= 0 ? 'text-success' : 'text-error'}`}>
                  {opp.eloDelta >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {opp.eloDelta > 0 ? '+' : ''}{opp.eloDelta}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">was {opp.eloRating - opp.eloDelta}</p>
            </div>
          </div>
          <EloBar after={you.eloRating} />
        </div>

        {/* ── Battle Stats ── */}
        <div className={`bg-card border border-border rounded-2xl p-5 transition-all duration-700 delay-200 ${animIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <Target size={13} /> Battle Stats
          </p>

          <div className="space-y-3">
            {[
              { label: 'Accuracy',    youVal: `${you.accuracy}%`,           oppVal: `${opp.accuracy}%`,           youBetter: you.accuracy > opp.accuracy,  icon: <Target size={13} /> },
              { label: 'Correct',     youVal: `${you.correct}/${questions.length || you.correct + you.wrong}`, oppVal: `${opp.correct}/${questions.length || opp.correct + opp.wrong}`, youBetter: you.correct > opp.correct, icon: <CheckCircle2 size={13} /> },
              { label: 'Wrong',       youVal: `${you.wrong}`,               oppVal: `${opp.wrong}`,               youBetter: you.wrong < opp.wrong,        icon: <XCircle size={13} /> },
              { label: 'Avg Time',    youVal: `${you.avgTime}s`,            oppVal: `${opp.avgTime}s`,            youBetter: you.avgTime < opp.avgTime && you.avgTime > 0, icon: <Clock size={13} /> },
              { label: 'Best Streak', youVal: `${you.streak}🔥`,            oppVal: `${opp.streak}🔥`,            youBetter: you.streak > opp.streak,      icon: <Zap size={13} /> },
            ].map((stat) => (
              <div key={stat.label} className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
                <div className={`text-right text-sm font-bold ${stat.youBetter ? 'text-success' : 'text-foreground'}`}>
                  {stat.youVal}
                  {stat.youBetter && <span className="ml-1 text-xs">✓</span>}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-[90px] justify-center">
                  {stat.icon}
                  <span>{stat.label}</span>
                </div>
                <div className={`text-left text-sm font-bold ${!stat.youBetter ? 'text-success' : 'text-foreground'}`}>
                  {!stat.youBetter && <span className="mr-1 text-xs">✓</span>}
                  {stat.oppVal}
                </div>
              </div>
            ))}
          </div>

          {questions.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs font-semibold text-muted-foreground mb-3">Your Subject Accuracy</p>
              <div className="space-y-2">
                {subjectBreakdown.filter((s) => s.total > 0).map((s) => (
                  <div key={s.subj} className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold w-24 text-center shrink-0 ${SUBJECT_COLORS[s.subj] ?? 'bg-muted text-foreground border-border'}`}>
                      {s.subj}
                    </span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${s.pct >= 70 ? 'bg-success' : s.pct >= 40 ? 'bg-warning' : 'bg-error'}`}
                        style={{ width: `${s.pct}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-foreground w-14 text-right shrink-0">{s.correct}/{s.total} ({s.pct}%)</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Question Replay ── */}
        {questions.length > 0 && (
          <div className={`bg-card border border-border rounded-2xl overflow-hidden transition-all duration-700 delay-250 ${animIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <button
              onClick={() => setShowReplay(!showReplay)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/40 transition-colors"
            >
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Play size={13} /> Question Replay
                <span className="ml-1 text-xs bg-muted text-foreground px-1.5 py-0.5 rounded-full font-normal normal-case tracking-normal">
                  {questions.length} questions
                </span>
              </span>
              {showReplay ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
            </button>

            {showReplay && (
              <div className="border-t border-border divide-y divide-border">
                {questions.map((q) => (
                  <div key={q.id} className="px-5 py-3.5">
                    <div className="flex items-start gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${q.isCorrect ? 'bg-success-light' : q.yourAnswer === '' ? 'bg-muted' : 'bg-error-light'}`}>
                        {q.isCorrect
                          ? <CheckCircle2 size={13} className="text-success" />
                          : q.yourAnswer === ''
                            ? <span className="text-xs text-muted-foreground font-bold">—</span>
                            : <XCircle size={13} className="text-error" />
                        }
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-xs text-muted-foreground font-medium">Q{q.index + 1}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded-full border font-semibold ${SUBJECT_COLORS[q.subject] ?? 'bg-muted text-foreground border-border'}`}>
                            {q.subject}
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-0.5 ml-auto">
                            <Clock size={10} /> {q.timeTaken}s
                          </span>
                        </div>
                        <p className="text-sm text-foreground font-medium leading-snug mb-2">{q.question}</p>

                        <div className="flex flex-wrap gap-2 text-xs">
                          <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full border font-semibold ${q.isCorrect ? 'bg-success-light text-success border-success/20' : q.yourAnswer === '' ? 'bg-muted text-muted-foreground border-border' : 'bg-error-light text-error border-error/20'}`}>
                            You: {q.yourAnswer || 'Skipped'}
                          </span>
                          {!q.isCorrect && q.yourAnswer !== '' && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full border bg-success-light text-success border-success/20 font-semibold">
                              Correct: {q.correctAnswer}
                            </span>
                          )}
                          <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full border font-semibold ${q.opponentCorrect ? 'bg-chem-light text-chem border-chem/20' : 'bg-muted text-muted-foreground border-border'}`}>
                            {opp.name.split(' ')[0]}: {q.opponentCorrect ? '✓' : '✗'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Action Buttons ── */}
        <div className={`grid grid-cols-2 gap-3 transition-all duration-700 delay-300 ${animIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <Link href="/battle-arena" className="btn-secondary py-3 gap-2 text-sm justify-center flex items-center">
            <RotateCcw size={15} /> Back to Arena
          </Link>
          <Link href="/match-lobby" className="btn-primary py-3 gap-2 text-sm justify-center flex items-center">
            <Swords size={15} /> Rematch
          </Link>
        </div>

        {/* ── Secondary links ── */}
        <div className={`flex items-center justify-center gap-6 text-xs transition-all duration-700 delay-350 ${animIn ? 'opacity-100' : 'opacity-0'}`}>
          <Link href="/leaderboard" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
            <Trophy size={12} /> Leaderboard <ChevronRight size={11} />
          </Link>
          <Link href="/student-dashboard" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
            <BarChart2 size={12} /> My Analytics <ChevronRight size={11} />
          </Link>
          <Link href="/practice" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
            <Zap size={12} /> Practice <ChevronRight size={11} />
          </Link>
        </div>

      </div>
    </DashboardLayout>
  );
}
