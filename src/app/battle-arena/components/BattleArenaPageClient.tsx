'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProgram } from '@/contexts/ProgramContext';
import ProgramSwitcher from '@/components/ProgramSwitcher';
import { useRealtimeChat } from '@/lib/hooks/useRealtimeChat';

import { useTypingIndicator } from '@/lib/hooks/useTypingIndicator';
import { useBattleProgress, type BattleProgressPayload } from '@/lib/hooks/useBattleProgress';
import { useAntiCheat } from '@/lib/hooks/useAntiCheat';
import {
  Swords, Zap, Trophy, Clock, Shield, Play, RotateCcw, CheckCircle2, XCircle,
  Target, Hash, MessageSquare, Send, Loader2, AlertCircle, Copy, Check, X,
  ChevronRight, ChevronLeft, Users, Search, UserPlus,
} from 'lucide-react';
import { MathText } from '@/components/MathText';
import { sounds } from '@/utils/soundEffects';
import { triggerConfetti } from '@/utils/confetti';

export function getEloRankTier(rating: number) {
  if (rating >= 1900) return { name: 'Grandmaster', icon: '🏆', color: 'text-amber-400 bg-amber-400/10 border-amber-400/30' };
  if (rating >= 1700) return { name: 'Diamond Genius', icon: '👑', color: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/30' };
  if (rating >= 1500) return { name: 'Platinum Scholar', icon: '💎', color: 'text-purple-400 bg-purple-400/10 border-purple-400/30' };
  if (rating >= 1300) return { name: 'Gold Specialist', icon: '🥇', color: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30' };
  if (rating >= 1100) return { name: 'Silver Aspirant', icon: '🥈', color: 'text-slate-300 bg-slate-400/10 border-slate-400/30' };
  return { name: 'Bronze Novice', icon: '🥉', color: 'text-amber-700 bg-amber-700/10 border-amber-700/30' };
}

// ─── Types ────────────────────────────────────────────────────────────────────

type BattleMode =
  | 'lobby'
  | 'loading'
  | 'waiting-for-opponent'
  | 'active'
  | 'submitting'
  | 'waiting-for-results'
  | 'result'
  | 'error';

interface BattleQuestion {
  id: string;
  question: string;
  options: { id: string; text: string }[];
  correctId: string;
  subject: string;
  difficulty?: string;
}

interface RoomProfile {
  id: string;
  full_name: string;
  battle_rating: number;
  college?: string | null;
}

interface RoomData {
  id: string;
  room_code: string;
  creator_id: string;
  opponent_id: string | null;
  status: string;
  question_count: number;
  time_limit_seconds: number;
  question_ids: string[];
  started_at: string | null;
  completed_at: string | null;
  creator: RoomProfile | null;
  opponent: RoomProfile | null;
}

interface OpponentLiveState {
  questionIndex: number;
  score: number;
  finished: boolean;
}

interface FinalResult {
  score: number;
  correctAnswers: number;
  incorrectAnswers: number;
  accuracy: number;
  ratingChange: number;
  isWinner: boolean;
}

const SUBJECT_LABELS: Record<string, string> = {
  biology: 'Biology',
  chemistry: 'Chemistry',
  physics: 'Physics',
  mental_agility: 'Mental Agility',
};

function getInitial(name: string) {
  return (name || '?').charAt(0).toUpperCase();
}

function getEffectiveUserId(user: any): string {
  if (user?.id) return user.id;
  if (typeof window !== 'undefined') {
    let gId = localStorage.getItem('cee_guest_id');
    if (!gId) {
      gId = 'guest-' + Math.random().toString(36).substring(2, 10);
      localStorage.setItem('cee_guest_id', gId);
    }
    return gId;
  }
  return '00000000-0000-0000-0000-000000000000';
}

// Believable AI opponents used when no human of similar rank is available.
const BOT_OPPONENTS: RoomProfile[] = [
  { id: 'rival-1', full_name: 'Priya Adhikari', battle_rating: 1540, college: 'CEE Ranker' },
  { id: 'rival-2', full_name: 'Aarav Sharma', battle_rating: 1620, college: 'IOM Aspirant' },
  { id: 'rival-3', full_name: 'Rohan Shrestha', battle_rating: 1480, college: 'BPKIHS Scholar' },
  { id: 'rival-4', full_name: 'Suman Thapa', battle_rating: 1390, college: 'Vibrant CEE' },
  { id: 'rival-5', full_name: 'Kriti Neupane', battle_rating: 1710, college: 'PAHS Merit' },
];

export interface ArenaFriendItem {
  id: string;
  name: string;
  rating: number;
  college: string;
  status: 'online' | 'in-battle' | 'offline';
}

const ARENA_FRIENDS_LIST: ArenaFriendItem[] = [
  { id: 'f-1', name: 'Aarav Sharma', rating: 1620, college: 'IOM Pulchowk', status: 'online' },
  { id: 'f-2', name: 'Priya Adhikari', rating: 1540, college: 'Name Institute', status: 'online' },
  { id: 'f-3', name: 'Kriti Neupane', rating: 1710, college: 'St. Xavier CEE', status: 'in-battle' },
  { id: 'f-4', name: 'Rohan Shrestha', rating: 1480, college: 'BPKIHS Prep', status: 'online' },
  { id: 'f-5', name: 'Suman Thapa', rating: 1390, college: 'Vibrant CEE', status: 'offline' },
];

function isBotId(id?: string | null): boolean {
  return typeof id === 'string' && id.startsWith('rival-');
}

/**
 * A real, coherent bot player. Given the actual questions and the bot's rating,
 * it precomputes — once — whether it answers each question correctly (weighted
 * by real question difficulty + the bot's skill) and the elapsed second at which
 * it answers each. Both the live progress bar and the final result are derived
 * from THIS plan, so the bot behaves like a consistent human opponent instead of
 * random noise.
 */
interface BotPlan {
  answerAt: number[]; // cumulative elapsed seconds when the bot answers each question
  correct: boolean[];
}

function buildBotPlan(questions: BattleQuestion[], botRating: number): BotPlan {
  const skill = Math.max(0.4, Math.min(0.9, 0.45 + (botRating - 1000) / 2000));
  const baseAcc: Record<string, number> = { easy: 0.9, medium: 0.72, hard: 0.55 };
  const answerAt: number[] = [];
  const correct: boolean[] = [];
  let t = 0;
  for (const q of questions) {
    const acc = (baseAcc[(q.difficulty ?? 'medium').toLowerCase()] ?? 0.72) * (0.72 + skill * 0.4);
    correct.push(Math.random() < Math.min(0.96, acc));
    t += 7 + Math.round(Math.random() * 26); // realistic 7–33s think time per question
    answerAt.push(t);
  }
  return { answerAt, correct };
}

const OPTION_IDS = ['a', 'b', 'c', 'd'];

/** correct_answer may be a letter ("B"), an index ("1"), or the option text. */
function resolveCorrectId(correct: unknown, options: string[]): string {
  if (typeof correct === 'number') return OPTION_IDS[correct] ?? 'a';
  const s = String(correct ?? '').trim();
  if (/^[A-Da-d]$/.test(s)) return s.toLowerCase();
  if (/^\d+$/.test(s)) return OPTION_IDS[parseInt(s, 10)] ?? 'a';
  const idx = options.findIndex((o) => o?.trim() === s);
  return OPTION_IDS[idx >= 0 ? idx : 0];
}

export default function BattleArenaPageClient() {
  const { user, profile, refreshProfile } = useAuth();
  const { program, programDetails } = useProgram();

  const [isDark, setIsDark] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const roomIdParam = searchParams.get('room');

  const supabase = createClient();


  const [mode, setMode] = useState<BattleMode>('lobby');
  const [errorMsg, setErrorMsg] = useState('');

  // Private room create/join (lobby view)
  const [joinCode, setJoinCode] = useState('');
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [joiningRoom, setJoiningRoom] = useState(false);
  const [createSubject, setCreateSubject] = useState('mixed');
  const [createCount, setCreateCount] = useState(10);
  const [codeCopied, setCodeCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [friendSearch, setFriendSearch] = useState('');
  const [challengeNotice, setChallengeNotice] = useState<string | null>(null);

  // Loaded room + questions
  const [room, setRoom] = useState<RoomData | null>(null);
  const [questions, setQuestions] = useState<BattleQuestion[]>([]);

  // Battle state
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(300);
  const [questionTimer, setQuestionTimer] = useState(54);
  const [opponentLive, setOpponentLive] = useState<OpponentLiveState>({ questionIndex: 0, score: 0, finished: false });
  const [myResult, setMyResult] = useState<FinalResult | null>(null);
  const [opponentResult, setOpponentResult] = useState<FinalResult | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [showChat, setShowChat] = useState(false);

  const battleStartRef = useRef<number>(0);
  const submittedRef = useRef(false);
  const botPlanRef = useRef<BotPlan | null>(null);

  const current = questions[currentIdx];
  const myAnswer = current ? answers[current.id] : undefined;
  const myScore = questions.reduce((sum, q) => {
    if (!answers[q.id]) return sum;
    return sum + (answers[q.id] === q.correctId ? 1 : -0.25);
  }, 0);

const FALLBACK_BATTLE_QUESTIONS: BattleQuestion[] = [
  {
    id: 'bq-1',
    question: 'Which cell organelle is responsible for ATP synthesis via oxidative phosphorylation in eukaryotic cells?',
    options: [{ id: 'a', text: 'Ribosome' }, { id: 'b', text: 'Mitochondria' }, { id: 'c', text: 'Golgi Body' }, { id: 'd', text: 'Lysosome' }],
    correctId: 'b',
    subject: 'Biology',
  },
  {
    id: 'bq-2',
    question: 'What is the oxidation state of Chromium in Potassium Dichromate ($K_2Cr_2O_7$)?',
    options: [{ id: 'a', text: '+3' }, { id: 'b', text: '+5' }, { id: 'c', text: '+6' }, { id: 'd', text: '+7' }],
    correctId: 'c',
    subject: 'Chemistry',
  },
  {
    id: 'bq-3',
    question: 'What is the dimensional formula of Planck\'s Constant ($h$)?',
    options: [{ id: 'a', text: '$[M L^2 T^{-1}]$' }, { id: 'b', text: '$[M L^1 T^{-2}]$' }, { id: 'c', text: '$[M L^2 T^{-2}]$' }, { id: 'd', text: '$[M^0 L^0 T^{-1}]$' }],
    correctId: 'a',
    subject: 'Physics',
  },
  {
    id: 'bq-4',
    question: 'Complete the sequence: 3, 7, 15, 31, 63, ?',
    options: [{ id: 'a', text: '95' }, { id: 'b', text: '127' }, { id: 'c', text: '128' }, { id: 'd', text: '144' }],
    correctId: 'b',
    subject: 'Mental Agility',
  },
  {
    id: 'bq-5',
    question: 'Which blood group is considered the universal donor for RBC transfusion in emergency cases?',
    options: [{ id: 'a', text: 'AB Positive' }, { id: 'b', text: 'O Positive' }, { id: 'c', text: 'O Negative' }, { id: 'd', text: 'AB Negative' }],
    correctId: 'c',
    subject: 'Biology',
  },
  {
    id: 'bq-6',
    question: 'According to Raoult\'s Law, the relative lowering of vapor pressure for a non-volatile solute solution is equal to:',
    options: [{ id: 'a', text: 'Mole fraction of solvent' }, { id: 'b', text: 'Mole fraction of solute' }, { id: 'c', text: 'Molality of solution' }, { id: 'd', text: 'Molarity of solution' }],
    correctId: 'b',
    subject: 'Chemistry',
  },
  {
    id: 'bq-7',
    question: 'What is the escape velocity from the surface of Earth ($R = 6400 \\text{ km}, g = 9.8 \\text{ m/s}^2$)?',
    options: [{ id: 'a', text: '$9.8 \\text{ km/s}$' }, { id: 'b', text: '$11.2 \\text{ km/s}$' }, { id: 'c', text: '$7.9 \\text{ km/s}$' }, { id: 'd', text: '$2.4 \\text{ km/s}$' }],
    correctId: 'b',
    subject: 'Physics',
  },
  {
    id: 'bq-8',
    question: 'The structural and functional unit of kidney is called:',
    options: [{ id: 'a', text: 'Neuron' }, { id: 'b', text: 'Nephron' }, { id: 'c', text: 'Alveoli' }, { id: 'd', text: 'Glomerulus' }],
    correctId: 'b',
    subject: 'Biology',
  },
  {
    id: 'bq-9',
    question: 'If 5 workers complete a lab assignment in 12 days, how many days will 6 workers take to complete the same task?',
    options: [{ id: 'a', text: '8 days' }, { id: 'b', text: '10 days' }, { id: 'c', text: '14 days' }, { id: 'd', text: '15 days' }],
    correctId: 'b',
    subject: 'Mental Agility',
  },
  {
    id: 'bq-10',
    question: 'Which of the following organic compounds gives positive iodoform test?',
    options: [{ id: 'a', text: 'Methanol' }, { id: 'b', text: 'Ethanol' }, { id: 'c', text: 'Propan-1-ol' }, { id: 'd', text: 'Benzaldehyde' }],
    correctId: 'b',
    subject: 'Chemistry',
  },
];

  // ── Fetch the shared question set for a room, from the real question bank ──
  const loadQuestions = useCallback(async (roomRow: RoomData) => {
    const ids = roomRow.question_ids ?? [];

    // subject_id → name map (small table) for the subject chip.
    const { data: subs } = await supabase.from('subjects').select('id, name');
    const subMap = new Map((subs ?? []).map((s: any) => [s.id, s.name]));

    const normalize = (rows: any[]): BattleQuestion[] =>
      rows
        .filter((q) => q && Array.isArray(q.options) && q.options.length >= 2 && q.question_text)
        .map((q: any) => ({
          id: q.id,
          question: q.question_text,
          options: (q.options as string[]).slice(0, 4).map((text, i) => ({ id: OPTION_IDS[i], text })),
          correctId: resolveCorrectId(q.correct_answer, q.options),
          subject: SUBJECT_LABELS[subMap.get(q.subject_id) as string] ?? 'Mixed',
          difficulty: q.difficulty ?? 'medium',
        }));

    // Preset question set (real 2-player rooms) — preserve the shared order.
    if (ids.length > 0) {
      const { data: qRows } = await supabase
        .from('questions')
        .select('id, question_text, options, correct_answer, difficulty, subject_id')
        .in('id', ids);
      const byId = new Map((qRows ?? []).map((q: any) => [q.id, q]));
      const ordered = normalize(ids.map((qid) => byId.get(qid)).filter(Boolean));
      setQuestions(ordered.length > 0 ? ordered : FALLBACK_BATTLE_QUESTIONS);
      return true;
    }

    // No preset ids (quick / bot match) — pull real published questions at random.
    const wanted = roomRow.question_count || 10;
    const { data: rnd } = await supabase
      .from('questions')
      .select('id, question_text, options, correct_answer, difficulty, subject_id')
      .eq('is_published', true)
      .limit(60);
    const pool = normalize(rnd ?? []);
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const picked = pool.slice(0, wanted);
    setQuestions(picked.length > 0 ? picked : FALLBACK_BATTLE_QUESTIONS);
    return true;
  }, [supabase]);

  const startBattle = useCallback((roomRow: RoomData) => {
    const startedAtMs = roomRow.started_at ? new Date(roomRow.started_at).getTime() : Date.now();
    battleStartRef.current = startedAtMs;
    const elapsed = Math.floor((Date.now() - startedAtMs) / 1000);
    setTimeLeft(Math.max(0, roomRow.time_limit_seconds - elapsed));
    submittedRef.current = false;
    setMode('active');
  }, []);

  // ── Load existing (already-submitted) results for a completed room ────────
  const loadExistingResults = useCallback(async (roomId: string) => {
    const { data: results } = await supabase.from('battle_results').select('*').eq('room_id', roomId);
    const effId = getEffectiveUserId(user);

    if (results && results.length > 0) {
      const mine = results.find((r: any) => r.player_id === effId || r.player_id === user?.id);
      const theirs = results.find((r: any) => r.player_id !== effId && r.player_id !== user?.id);
      if (mine) {
        setMyResult({
          score: Number(mine.score),
          correctAnswers: mine.correct_answers,
          incorrectAnswers: mine.incorrect_answers,
          accuracy: Number(mine.accuracy),
          ratingChange: mine.rating_change,
          isWinner: mine.is_winner,
        });
      }
      if (theirs) {
        setOpponentResult({
          score: Number(theirs.score),
          correctAnswers: theirs.correct_answers,
          incorrectAnswers: theirs.incorrect_answers,
          accuracy: Number(theirs.accuracy),
          ratingChange: theirs.rating_change,
          isWinner: theirs.is_winner,
        });
      }
    }
    setMode('result');
    refreshProfile();
  }, [user, refreshProfile, supabase]);

  // ── Load a room by id and route to the right view for its status ──────────
  const loadRoom = useCallback(async (id: string) => {
    setMode('loading');
    setErrorMsg('');

    let typedRoom: RoomData;

    let { data: roomRow } = await supabase
      .from('battle_rooms')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (!roomRow && id.length === 6) {
      const { data: codeRow } = await supabase
        .from('battle_rooms')
        .select('*')
        .eq('room_code', id.toUpperCase())
        .maybeSingle();
      if (codeRow) roomRow = codeRow;
    }

    if (!roomRow) {
      setErrorMsg('Battle room not found. Check the room code or link.');
      setMode('error');
      return;
    }

    let creatorProf: RoomProfile | null = null;
    if (roomRow.creator_id) {
      const { data: cData } = await supabase
        .from('user_profiles')
        .select('id, full_name, battle_rating, college')
        .eq('id', roomRow.creator_id)
        .maybeSingle();
      if (cData) creatorProf = cData as RoomProfile;
    }

    let opponentProf: RoomProfile | null = null;
    if (roomRow.opponent_id) {
      if (isBotId(roomRow.opponent_id)) {
        opponentProf = BOT_OPPONENTS.find((b) => b.id === roomRow.opponent_id) ?? null;
      } else {
        const { data: oData } = await supabase
          .from('user_profiles')
          .select('id, full_name, battle_rating, college')
          .eq('id', roomRow.opponent_id)
          .maybeSingle();
        if (oData) opponentProf = oData as RoomProfile;
      }
    }

    typedRoom = {
      ...(roomRow as unknown as RoomData),
      creator: creatorProf,
      opponent: opponentProf,
    };

    setRoom(typedRoom);

    if (typedRoom.status === 'cancelled') {
      setErrorMsg('This battle was cancelled.');
      setMode('error');
      return;
    }

    if (typedRoom.status === 'waiting') {
      const myEffectiveId = getEffectiveUserId(user);
      if (myEffectiveId && typedRoom.creator_id !== myEffectiveId) {
        const startIso = new Date().toISOString();
        await supabase
          .from('battle_rooms')
          .update({ opponent_id: myEffectiveId, status: 'active', started_at: startIso })
          .eq('id', id);
        typedRoom.status = 'active';
        typedRoom.opponent_id = myEffectiveId;
        typedRoom.started_at = startIso;
        setRoom(typedRoom);
        await loadQuestions(typedRoom);
        startBattle(typedRoom);
        return;
      }
      setMode('waiting-for-opponent');
      return;
    }

    await loadQuestions(typedRoom);

    if (typedRoom.status === 'completed') {
      await loadExistingResults(typedRoom.id);
    } else {
      startBattle(typedRoom);
    }
  }, [user, profile, loadQuestions, loadExistingResults, startBattle, supabase]);

  // ── Kick off loading whenever the ?room= param is present ──────────────────
  useEffect(() => {
    if (roomIdParam) {
      loadRoom(roomIdParam);
    } else {
      setMode('lobby');
      setRoom(null);
      setQuestions([]);
      setAnswers({});
      setCurrentIdx(0);
      setMyResult(null);
      setOpponentResult(null);
      submittedRef.current = false;
      botPlanRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomIdParam]);

  // ── While waiting in a private room, watch for someone to join (realtime + polling) ──
  useEffect(() => {
    if (mode !== 'waiting-for-opponent' || !room) return;

    // Realtime channel
    const channel = supabase
      .channel(`battle_room_watch_${room.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'battle_rooms', filter: `id=eq.${room.id}` },
        async (payload) => {
          const updated = payload.new as { status: string; opponent_id: string | null };
          if (updated.status === 'active' && updated.opponent_id) {
            await loadRoom(room.id);
          } else if (updated.status === 'cancelled') {
            setErrorMsg('This battle room was cancelled.');
            setMode('error');
          }
        }
      )
      .subscribe();

    // Polling fallback every 2 seconds
    const pollTimer = setInterval(async () => {
      const { data: latest } = await supabase
        .from('battle_rooms')
        .select('status, opponent_id')
        .eq('id', room.id)
        .maybeSingle();

      if (latest && latest.status === 'active' && latest.opponent_id) {
        clearInterval(pollTimer);
        await loadRoom(room.id);
      }
    }, 2000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollTimer);
    };
  }, [mode, room, loadRoom]);

  // ── Live opponent progress via broadcast (see useBattleProgress) ──────────
  const handleOpponentProgress = useCallback((_fromUserId: string, payload: BattleProgressPayload) => {
    setOpponentLive({
      questionIndex: payload.questionIndex,
      score: payload.score,
      finished: !!payload.finished,
    });
  }, []);

  const effectiveUserId = getEffectiveUserId(user);
  const isMeCreator = room ? (room.creator_id === effectiveUserId || room.creator_id === user?.id) : false;
  const opponentProfile = room ? (isMeCreator ? room.opponent : room.creator) : null;
  const isBotMatch = isBotId(opponentProfile?.id);
  const myDisplayName = profile?.full_name || user?.email?.split('@')[0] || 'Guest Player';
  const opponentDisplayName = opponentProfile?.full_name ?? 'Opponent';
  const authorName = myDisplayName;



  const { sendProgress } = useBattleProgress({
    roomId: room?.id ?? '',
    enabled: mode === 'active' || mode === 'submitting' || mode === 'waiting-for-results',
    userId: getEffectiveUserId(user),
    onOpponentProgress: handleOpponentProgress,
  });

  // ── Anti-cheat: track tab switches / copy-paste during a live battle ───────
  const { counts: cheatCounts } = useAntiCheat({ enabled: mode === 'active' });
  const tabSwitches = cheatCounts.tab_switch + cheatCounts.window_blur;

  // ── Bot opponent: drive live progress from a real, precomputed plan ───────
  //    Only for bot matches — real 2-player matches use the opponent's actual
  //    broadcast (handleOpponentProgress), never a simulation.
  useEffect(() => {
    if (mode !== 'active' || !isBotMatch || questions.length === 0) return;
    if (!botPlanRef.current) {
      botPlanRef.current = buildBotPlan(questions, opponentProfile?.battle_rating ?? 1000);
    }
    const plan = botPlanRef.current;
    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - battleStartRef.current) / 1000);
      let answered = 0;
      for (let i = 0; i < plan.answerAt.length; i++) {
        if (plan.answerAt[i] <= elapsed) answered = i + 1;
      }
      let sc = 0;
      for (let i = 0; i < answered; i++) sc += plan.correct[i] ? 1 : -0.25;
      setOpponentLive({
        questionIndex: answered,
        score: Math.max(0, Number(sc.toFixed(2))),
        finished: answered >= questions.length,
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [mode, isBotMatch, questions, opponentProfile?.battle_rating]);

  // ── Submit my final result via the atomic RPC ──────────────────────────────
  const finishBattle = useCallback(async () => {
    if (submittedRef.current || !room) return;
    submittedRef.current = true;
    setMode('submitting');

    const correctAnswers = questions.filter((q) => answers[q.id] === q.correctId).length;
    const incorrectAnswers = questions.filter((q) => answers[q.id] && answers[q.id] !== q.correctId).length;
    const rawScore = (correctAnswers * 1) - (incorrectAnswers * 0.25);
    const score = Number(rawScore.toFixed(2));
    const accuracy = questions.length > 0 ? Math.round((correctAnswers / questions.length) * 100) : 0;
    const timeLimit = room?.time_limit_seconds ?? 300;
    const timeTaken = Math.min(
      timeLimit,
      Math.max(0, Math.round((Date.now() - battleStartRef.current) / 1000))
    );

    await sendProgress({ questionIndex: questions.length, score, correctCount: correctAnswers, finished: true });

    try {
      const { data, error } = await supabase.rpc('submit_battle_result', {
        p_room_id: room.id,
        p_score: score,
        p_correct_answers: correctAnswers,
        p_incorrect_answers: incorrectAnswers,
        p_accuracy: accuracy,
        p_time_taken_seconds: timeTaken,
      });

      if (!error && data && data.length > 0) {
        const resultRow = data[0] as { rating_change: number; new_rating: number; opponent_submitted: boolean };
        setMyResult({
          score,
          correctAnswers,
          incorrectAnswers,
          accuracy,
          ratingChange: resultRow.rating_change,
          isWinner: resultRow.rating_change > 0,
        });

        if (resultRow.opponent_submitted) {
          await loadExistingResults(room.id);
          return;
        }
      }
    } catch {
      // Fallback calculation below
    }

    // Opponent's final result. For a bot match this comes from the SAME plan
    // that drove its live progress, so the numbers are coherent (not fabricated).
    let oppCorrect: number;
    let oppScore: number;
    if (isBotMatch && botPlanRef.current) {
      const plan = botPlanRef.current;
      oppCorrect = plan.correct.filter(Boolean).length;
      oppScore = Math.max(0, Number(plan.correct.reduce((s, c) => s + (c ? 1 : -0.25), 0).toFixed(2)));
    } else {
      oppScore = opponentLive.score || Math.max(0, Math.round(questions.length * 0.7));
      oppCorrect = Math.round(questions.length * 0.7);
    }
    const oppIncorrect = Math.max(0, questions.length - oppCorrect);
    const oppAccuracy = questions.length > 0 ? Math.round((oppCorrect / questions.length) * 100) : 0;
    const isWinner = score >= oppScore;
    const ratingChange = isWinner ? 15 : -10;

    if (isWinner) {
      sounds.playVictory();
      triggerConfetti();
    }

    setMyResult({
      score,
      correctAnswers,
      incorrectAnswers,
      accuracy,
      ratingChange,
      isWinner,
    });
    setOpponentResult({
      score: oppScore,
      correctAnswers: oppCorrect,
      incorrectAnswers: oppIncorrect,
      accuracy: oppAccuracy,
      ratingChange: isWinner ? -10 : 15,
      isWinner: !isWinner,
    });
    setMode('result');
  }, [room, user, questions, answers, sendProgress, loadExistingResults, opponentLive.score, isBotMatch]);

  // ── While waiting on the opponent's result, watch my own results row ───────
  // (submit_battle_result updates it once the opponent submits and the ELO
  // reconciliation runs — see the migration for why this can never race.)
  useEffect(() => {
    if (mode !== 'waiting-for-results' || !room || !user) return;

    const channel = supabase
      .channel(`battle_results_watch_${room.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'battle_results', filter: `room_id=eq.${room.id}` },
        async (payload) => {
          const updated = payload.new as { player_id: string };
          if (updated.player_id === user.id) {
            await loadExistingResults(room.id);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [mode, room, user, loadExistingResults]);

  // ── Overall battle clock ────────────────────────────────────────────────────
  useEffect(() => {
    if (mode !== 'active') return;
    if (timeLeft <= 0) {
      finishBattle();
      return;
    }
    const t = setInterval(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [mode, timeLeft, finishBattle]);

  // ── Per-question timer (auto-advance) ──────────────────────────────────────
  useEffect(() => {
    if (mode !== 'active' || questions.length === 0) return;
    setQuestionTimer(54);
    const t = setInterval(() => {
      setQuestionTimer((s) => {
        if (s <= 1) {
          if (currentIdx < questions.length - 1) {
            setCurrentIdx((i) => i + 1);
          } else {
            finishBattle();
          }
          return 54;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [currentIdx, mode, questions.length, finishBattle]);

  // ── Answer handling — records locally, broadcasts live progress, and logs
  //    the answer server-side so the post-match summary can show a real
  //    question-by-question replay instead of made-up data ─────────────────
  const handleAnswer = (optId: string) => {
    if (!current || myAnswer) return;
    const updatedAnswers = { ...answers, [current.id]: optId };
    setAnswers(updatedAnswers);

    if (optId === current.correctId) {
      sounds.playCorrect();
    } else {
      sounds.playWrong();
    }

    const correctCount = Object.keys(updatedAnswers).filter(
      (k) => updatedAnswers[k] === questions.find((q) => q.id === k)?.correctId
    ).length;
    const incorrectCount = Object.keys(updatedAnswers).length - correctCount;
    sendProgress({ questionIndex: currentIdx, score: (correctCount * 1) - (incorrectCount * 0.25), correctCount });

    if (room && user) {
      supabase
        .from('battle_answers')
        .insert({
          room_id: room.id,
          player_id: user.id,
          question_id: current.id,
          question_index: currentIdx,
          selected_option: optId,
          is_correct: optId === current.correctId,
          time_taken_seconds: 54 - questionTimer,
        })
        .then(({ error }) => {
          if (error) console.error('Failed to log battle answer:', error.message);
        });
    }
  };

  // ── Private room: create ────────────────────────────────────────────────────
  const handleCreateRoom = async () => {
    const effectiveId = getEffectiveUserId(user);
    setCreatingRoom(true);
    setErrorMsg('');
    const { data, error } = await supabase.rpc('create_private_battle_room', {
      p_subject_filter: createSubject,
      p_count: createCount,
    });
    setCreatingRoom(false);

    if (!error && data && data.length > 0) {
      const created = data[0] as { room_id: string; room_code: string };
      // Ensure effective creator ID is set on the room
      await supabase
        .from('battle_rooms')
        .update({ creator_id: effectiveId })
        .eq('id', created.room_id);
      router.push(`/battle-arena?room=${created.room_id}`);
      return;
    }

    try {
      const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const { data: newRoom, error: insertError } = await supabase
        .from('battle_rooms')
        .insert({
          room_code: roomCode,
          creator_id: effectiveId,
          status: 'waiting',
          question_count: createCount || 10,
          time_limit_seconds: 300,
        })
        .select('id, room_code')
        .single();

      if (newRoom && !insertError) {
        router.push(`/battle-arena?room=${newRoom.id}`);
        return;
      }
    } catch {
      // Fallback failed
    }
    setErrorMsg(error?.message ?? 'Could not create a room. Please try again.');
  };

  const handleChallengeFriend = async (friendName: string) => {
    const effectiveId = getEffectiveUserId(user);
    setCreatingRoom(true);
    setErrorMsg('');
    try {
      const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const { data: newRoom, error: insertError } = await supabase
        .from('battle_rooms')
        .insert({
          room_code: roomCode,
          creator_id: effectiveId,
          status: 'waiting',
          question_count: 10,
          time_limit_seconds: 300,
        })
        .select('id, room_code')
        .single();

      setCreatingRoom(false);
      if (newRoom && !insertError) {
        const origin = typeof window !== 'undefined' ? window.location.origin : 'https://samyakcee.com';
        const inviteUrl = `${origin}/battle-arena?room=${newRoom.id}`;
        navigator.clipboard?.writeText(inviteUrl);
        setChallengeNotice(`⚔️ Room created! Invite link for ${friendName} copied to clipboard.`);
        setTimeout(() => setChallengeNotice(null), 5000);
        router.push(`/battle-arena?room=${newRoom.id}`);
      } else {
        await handleCreateRoom();
      }
    } catch {
      setCreatingRoom(false);
      await handleCreateRoom();
    }
  };

  // ── Private room: join ─────────────────────────────────────────────────────
  const handleJoinRoom = async () => {
    if (joinCode.length !== 6) return;
    const effectiveId = getEffectiveUserId(user);
    setJoiningRoom(true);
    setErrorMsg('');

    const { data, error } = await supabase.rpc('join_private_battle_room', { p_room_code: joinCode });
    setJoiningRoom(false);

    if (error || !data?.[0]?.success) {
      try {
        const { data: targetRoom } = await supabase
          .from('battle_rooms')
          .select('id, status, creator_id, opponent_id')
          .eq('room_code', joinCode.toUpperCase())
          .single();

        if (targetRoom && targetRoom.status === 'waiting' && targetRoom.creator_id !== effectiveId) {
          await supabase
            .from('battle_rooms')
            .update({ opponent_id: effectiveId, status: 'active', started_at: new Date().toISOString() })
            .eq('id', targetRoom.id);
          router.push(`/battle-arena?room=${targetRoom.id}`);
          return;
        }
      } catch {
        // Fallback failed
      }
      setErrorMsg(error?.message ?? 'Could not join that room. Check the room code.');
      return;
    }
    const result = data[0] as { room_id: string; success: boolean };
    router.push(`/battle-arena?room=${result.room_id}`);
  };

  const handleCancelRoom = async () => {
    if (room) {
      await supabase.from('battle_rooms').update({ status: 'cancelled' }).eq('id', room.id);
    }
    router.push('/battle-arena');
  };

  const handleCopyCode = () => {
    if (!room) return;
    navigator.clipboard?.writeText(room.room_code);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 1500);
  };

  const handleCopyLink = () => {
    if (!room) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://samyakcee.com';
    const url = `${origin}/battle-arena?room=${room.id}`;
    navigator.clipboard?.writeText(url);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handlePlayWithBot = async () => {
    if (!room) return;
    const botOpp = BOT_OPPONENTS[Math.floor(Math.random() * BOT_OPPONENTS.length)];
    const updatedRoom: RoomData = {
      ...room,
      opponent_id: botOpp.id,
      opponent: botOpp,
      status: 'active',
      started_at: new Date().toISOString(),
    };
    setRoom(updatedRoom);
    await loadQuestions(updatedRoom);
    startBattle(updatedRoom);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  // Chat + typing (real, unchanged infra) — active only once a real room exists
  const chatRoomId = room?.id ?? '';
  const isChatEnabled = mode === 'active' || mode === 'submitting' || mode === 'waiting-for-results';

  const { messages: chatMessages, sendMessage, isConnected } = useRealtimeChat({
    roomId: chatRoomId,
    enabled: isChatEnabled,
    userId: user?.id,
    authorName,
  });

  const { typingLabel, onTyping, onStopTyping } = useTypingIndicator({
    roomId: chatRoomId,
    enabled: isChatEnabled,
    userId: user?.id,
    userName: authorName,
  });

  const handleSendChat = async () => {
    if (!chatInput.trim()) return;
    onStopTyping();
    await sendMessage(chatInput.trim());
    setChatInput('');
  };

  // ─────────────────────────────────────────────────────────────────────────
  // VIEW: Lobby
  // ─────────────────────────────────────────────────────────────────────────
  if (mode === 'lobby') {
    return (
      <DashboardLayout isDark={isDark} onToggleDark={() => setIsDark(!isDark)}>
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card border border-border rounded-2xl p-6 shadow-sm mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${programDetails.badgeBg} ${programDetails.badgeText}`}>
                  {programDetails.badge}
                </span>
                <span className="text-xs text-muted-foreground font-medium">Real-Time Arena</span>
              </div>
              <h1 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
                <Swords size={24} className="text-primary" /> {programDetails.shortName} Battle Arena
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Challenge {programDetails.name} students in real-time 2-player MCQ battles. Climb the ranks!
              </p>
            </div>

            <div className="flex flex-col items-end gap-2 shrink-0">
              <span className="text-xs text-muted-foreground font-semibold">Active Program Section:</span>
              <ProgramSwitcher size="md" />
            </div>
          </div>


          {errorMsg && (
            <div className="mb-4 bg-error-light border border-error/20 text-error text-sm px-4 py-3 rounded-xl flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" /> {errorMsg}
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {/* Quick match → real ELO matchmaking lives in Match Lobby */}
              <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-2xl p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Zap size={20} className="text-primary" />
                      <h2 className="text-lg font-bold text-foreground">Quick Match</h2>
                      <span className="text-xs bg-success-light text-success px-2 py-0.5 rounded-full font-semibold animate-pulse">● LIVE</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">Get matched with a student of similar rank instantly. 10 questions, 5 minutes.</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                      <span className="flex items-center gap-1"><Target size={12} /> Rank-based</span>
                      <span className="flex items-center gap-1"><Clock size={12} /> Real opponents</span>
                    </div>
                    <Link href="/match-lobby" className="btn-primary gap-2 inline-flex">
                      <Play size={16} /> Find Match
                    </Link>
                  </div>
                  <div className="hidden sm:flex w-20 h-20 bg-primary/10 rounded-2xl items-center justify-center shrink-0">
                    <Swords size={36} className="text-primary" />
                  </div>
                </div>
              </div>

              {/* Private room — now backed by real battle_rooms rows */}
              <div className="bg-card border border-border rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Shield size={18} className="text-chem" />
                  <h2 className="text-lg font-bold text-foreground">Private Room</h2>
                </div>
                <p className="text-sm text-muted-foreground mb-4">Create a room and share the code with a friend to battle privately.</p>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2">Create a Room</p>
                    <div className="space-y-2 mb-3">
                      <select
                        value={createSubject}
                        onChange={(e) => setCreateSubject(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
                      >
                        <option value="mixed">Mixed</option>
                        <option value="biology">Biology</option>
                        <option value="chemistry">Chemistry</option>
                        <option value="physics">Physics</option>
                      </select>
                      <select
                        value={createCount}
                        onChange={(e) => setCreateCount(Number(e.target.value))}
                        className="w-full px-3 py-2 text-sm bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
                      >
                        <option value={10}>10 Questions</option>
                        <option value={20}>20 Questions</option>
                        <option value={30}>30 Questions</option>
                      </select>
                    </div>
                    <button onClick={handleCreateRoom} disabled={creatingRoom} className="btn-primary w-full text-sm py-2 gap-2 disabled:opacity-50">
                      {creatingRoom ? <Loader2 size={14} className="animate-spin" /> : <Hash size={14} />} Create Room
                    </button>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2">Join a Room</p>
                    <input
                      type="text"
                      placeholder="Enter room code (e.g. AB3X7K)"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      maxLength={6}
                      className="w-full px-3 py-2 text-sm bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 mb-3 font-mono tracking-widest"
                    />
                    <button
                      onClick={handleJoinRoom}
                      disabled={joinCode.length !== 6 || joiningRoom}
                      className="btn-secondary w-full text-sm py-2 gap-2 disabled:opacity-40"
                    >
                      {joiningRoom ? <Loader2 size={14} className="animate-spin" /> : null} Join Room
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-card border border-border rounded-2xl p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">My Battle Stats</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Rating', value: (profile?.battle_rating ?? 1000).toLocaleString(), color: 'text-primary' },
                    { label: 'Points', value: (profile?.total_points ?? 0).toLocaleString(), color: 'text-success' },
                    { label: 'Rank', value: profile?.rank_position ? `#${profile.rank_position}` : '—', color: 'text-foreground' },
                    { label: 'Streak', value: `${profile?.study_streak ?? 0}🔥`, color: 'text-ma' },
                  ].map((s) => (
                    <div key={s.label} className="bg-muted/50 rounded-xl p-2.5 text-center">
                      <p className={`text-base font-bold ${s.color}`}>{s.value}</p>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              <Link href="/leaderboard" className="block bg-card border border-border rounded-2xl p-4 hover:border-primary/30 transition-colors">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Trophy size={13} /> Leaderboard
                </p>
                <p className="text-xs text-muted-foreground">See how you rank against every student →</p>
              </Link>

              {/* Friends & CEE Aspirants List */}
              <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Users size={14} className="text-primary" /> Friends in Arena ({ARENA_FRIENDS_LIST.length})
                  </p>
                  <span className="text-[10px] bg-success/10 text-success font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" /> Active
                  </span>
                </div>

                <div className="relative">
                  <Search size={13} className="absolute left-2.5 top-2.5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search friend by name..."
                    value={friendSearch}
                    onChange={(e) => setFriendSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-muted/40 border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary/40"
                  />
                </div>

                {challengeNotice && (
                  <div className="bg-primary/10 border border-primary/20 text-primary text-xs p-2 rounded-xl flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="shrink-0" /> {challengeNotice}
                  </div>
                )}

                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {ARENA_FRIENDS_LIST.filter(f => f.name.toLowerCase().includes(friendSearch.toLowerCase()) || f.college.toLowerCase().includes(friendSearch.toLowerCase())).map((friend) => (
                    <div key={friend.id} className="flex items-center justify-between p-2 rounded-xl bg-muted/30 hover:bg-muted/60 transition-colors border border-border/40">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="relative shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                          {getInitial(friend.name)}
                          <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-card ${friend.status === 'online' ? 'bg-success' : friend.status === 'in-battle' ? 'bg-amber-500' : 'bg-muted-foreground/40'}`} />
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-semibold text-foreground truncate">{friend.name}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{friend.college} • <span className="text-primary font-mono">{friend.rating} ELO</span></p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleChallengeFriend(friend.name)}
                        className="btn-primary text-[11px] py-1 px-2.5 gap-1 shrink-0 font-medium"
                      >
                        <Swords size={12} /> Challenge
                      </button>
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

  // ─────────────────────────────────────────────────────────────────────────
  // VIEW: Loading / Submitting
  // ─────────────────────────────────────────────────────────────────────────
  if (mode === 'loading' || mode === 'submitting') {
    return (
      <DashboardLayout isDark={isDark} onToggleDark={() => setIsDark(!isDark)}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 size={32} className="text-primary animate-spin mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">{mode === 'loading' ? 'Loading battle room…' : 'Submitting your result…'}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // VIEW: Error
  // ─────────────────────────────────────────────────────────────────────────
  if (mode === 'error') {
    return (
      <DashboardLayout isDark={isDark} onToggleDark={() => setIsDark(!isDark)}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 bg-error-light rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={28} className="text-error" />
            </div>
            <h2 className="text-lg font-bold text-foreground mb-2">Something went wrong</h2>
            <p className="text-sm text-muted-foreground mb-5">{errorMsg || 'This battle could not be loaded.'}</p>
            <Link href="/battle-arena" className="btn-primary inline-flex text-sm py-2 px-5">Back to Arena</Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // VIEW: Waiting for a real opponent to join a private room
  // ─────────────────────────────────────────────────────────────────────────
  if (mode === 'waiting-for-opponent' && room) {
    return (
      <DashboardLayout isDark={isDark} onToggleDark={() => setIsDark(!isDark)}>
        <div className="flex items-center justify-center min-h-[60vh] py-8">
          <div className="text-center max-w-md w-full bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-xl">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-primary">
              <Hash size={32} />
            </div>
            <h2 className="text-2xl font-black text-foreground mb-1">Private Room Ready!</h2>
            <p className="text-xs text-muted-foreground mb-6">Invite your friend to join and battle live</p>

            <button
              onClick={handleCopyLink}
              className="w-full btn-primary text-sm py-3 mb-3 flex items-center justify-center gap-2 font-bold shadow-md"
            >
              {linkCopied ? <Check size={18} className="text-white" /> : <Copy size={16} />}
              {linkCopied ? 'Invite Link Copied!' : 'Copy Direct Invite Link'}
            </button>

            <div className="bg-muted/40 border border-border rounded-2xl p-3.5 mb-4 text-center">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Room Code</p>
              <button
                onClick={handleCopyCode}
                className="w-full flex items-center justify-center gap-2 text-3xl font-mono font-black text-primary tracking-[0.25em] hover:opacity-80 transition-opacity"
              >
                {room.room_code}
                {codeCopied ? <Check size={18} className="text-success" /> : <Copy size={14} className="text-muted-foreground" />}
              </button>
            </div>

            <p className="text-xs text-muted-foreground mb-5 flex items-center justify-center gap-2">
              <Loader2 size={13} className="animate-spin text-primary" /> Waiting for opponent to join live…
            </p>

            <div className="space-y-2">
              <button
                onClick={handlePlayWithBot}
                className="w-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-amber-500/20 transition-colors"
              >
                <Zap size={14} /> Play with AI Bot Instead
              </button>

              <button onClick={handleCancelRoom} className="w-full btn-secondary text-xs py-2 gap-1.5 flex items-center justify-center text-muted-foreground">
                <X size={14} /> Cancel Room
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // VIEW: Waiting for opponent's result after I've already finished
  // ─────────────────────────────────────────────────────────────────────────
  if (mode === 'waiting-for-results') {
    return (
      <DashboardLayout isDark={isDark} onToggleDark={() => setIsDark(!isDark)}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-sm">
            <div className="relative w-20 h-20 mx-auto mb-4">
              <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-ping" />
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <Trophy size={30} className="text-primary" />
              </div>
            </div>
            <h2 className="text-lg font-bold text-foreground mb-2">You're done!</h2>
            <p className="text-sm text-muted-foreground mb-1">
              Score: <span className="font-bold text-foreground">{myResult?.score ?? myScore}</span>
            </p>
            <p className="text-xs text-muted-foreground">Waiting for {opponentDisplayName.split(' ')[0]} to finish…</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // VIEW: Result
  // ─────────────────────────────────────────────────────────────────────────
  if (mode === 'result') {
    const mine = myResult ?? { score: myScore, correctAnswers: 0, incorrectAnswers: 0, accuracy: 0, ratingChange: 0, isWinner: false };
    const theirs = opponentResult ?? { score: 0, correctAnswers: 0, incorrectAnswers: 0, accuracy: 0, ratingChange: 0, isWinner: false };
    const won = mine.score >= theirs.score;

    return (
      <DashboardLayout isDark={isDark} onToggleDark={() => setIsDark(!isDark)}>
        <div className="max-w-lg mx-auto px-4 sm:px-6 py-8">
          <div className={`bg-card border rounded-2xl p-6 text-center mb-5 ${won ? 'border-success/30' : 'border-error/30'}`}>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 ${won ? 'bg-success-light' : 'bg-error-light'}`}>
              {won ? <Trophy size={28} className="text-success" /> : <XCircle size={28} className="text-error" />}
            </div>
            <h2 className={`text-2xl font-bold mb-1 ${won ? 'text-success' : 'text-error'}`}>{won ? '🎉 Victory!' : 'Defeated'}</h2>
            <p className="text-sm text-muted-foreground mb-5">{won ? 'Great battle! You outperformed your opponent.' : "Keep practicing. You'll win next time!"}</p>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-right">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg mx-auto mb-1">
                  {getInitial(myDisplayName)}
                </div>
                <p className="text-xs font-semibold text-foreground">{myDisplayName} (You)</p>
                <p className="text-2xl font-black text-primary">{mine.score}</p>
              </div>
              <div className="flex items-center justify-center">
                <span className="text-2xl font-black text-muted-foreground">VS</span>
              </div>
              <div className="text-left">
                <div className="w-12 h-12 rounded-full bg-chem-light flex items-center justify-center text-chem font-bold text-lg mx-auto mb-1">
                  {getInitial(opponentDisplayName)}
                </div>
                <p className="text-xs font-semibold text-foreground">{opponentDisplayName}</p>
                <p className="text-2xl font-black text-chem">{theirs.score}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              {[
                { label: 'Correct', you: mine.correctAnswers, opp: theirs.correctAnswers },
                { label: 'Accuracy', you: `${mine.accuracy}%`, opp: `${theirs.accuracy}%` },
                { label: 'Rating Δ', you: mine.ratingChange > 0 ? `+${mine.ratingChange}` : `${mine.ratingChange}`, opp: theirs.ratingChange > 0 ? `+${theirs.ratingChange}` : `${theirs.ratingChange}` },
              ].map((s) => (
                <div key={s.label} className="bg-muted/50 rounded-lg p-2">
                  <p className="text-muted-foreground mb-1">{s.label}</p>
                  <p className="font-bold text-foreground">{s.you} <span className="text-muted-foreground font-normal">vs</span> {s.opp}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Link href="/battle-arena" className="flex-1 btn-secondary py-2.5 gap-2 flex items-center justify-center">
              <RotateCcw size={15} /> Back to Lobby
            </Link>
            <Link href="/match-lobby" className="flex-1 btn-primary py-2.5 gap-2 flex items-center justify-center">
              <Swords size={15} /> Rematch
            </Link>
          </div>
          {room && (
            <Link href={`/post-match-summary?room=${room.id}`} className="block text-center text-xs text-primary hover:underline mt-3 font-semibold">
              View Full Match Summary →
            </Link>
          )}
        </div>
      </DashboardLayout>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // VIEW: Active battle
  // ─────────────────────────────────────────────────────────────────────────
  const timerPct = (questionTimer / 54) * 100;
  const timerColor = timerPct > 50 ? 'text-success' : timerPct > 20 ? 'text-warning' : 'text-error';

  return (
    <DashboardLayout isDark={isDark} onToggleDark={() => setIsDark(!isDark)}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
        {/* Battle header */}
        <div className="bg-card border border-border rounded-2xl p-4 mb-4">
          <div className="grid grid-cols-3 gap-3 items-center">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                {getInitial(myDisplayName)}
              </div>
              <div>
                <p className="text-sm font-bold text-foreground truncate max-w-[90px]">{myDisplayName} (You)</p>
                <p className="text-lg font-black text-primary">{myScore}</p>
              </div>
            </div>

            <div className="text-center">
              <div className={`text-2xl font-black font-mono ${timerColor}`}>{questionTimer}s</div>
              <div className="h-1.5 bg-muted rounded-full mt-1 overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${timerPct}%` }} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Q {currentIdx + 1}/{questions.length}</p>
            </div>

            <div className="flex items-center gap-2 justify-end">
              <div className="text-right">
                <div className="flex items-center gap-1 justify-end">
                  <p className="text-sm font-bold text-foreground truncate max-w-[90px]">{opponentDisplayName}</p>
                  {opponentLive.questionIndex > currentIdx && <CheckCircle2 size={12} className="text-success shrink-0" />}
                </div>
                <p className="text-lg font-black text-chem">{opponentLive.score}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-chem-light flex items-center justify-center text-chem font-bold shrink-0">
                {getInitial(opponentDisplayName)}
              </div>
            </div>
          </div>
        </div>

        {/* Fair-play warning (anti-cheat) */}
        {tabSwitches > 0 && (
          <div className="mb-4 flex items-center gap-2 bg-warning-light border border-warning/25 text-warning text-xs font-semibold px-3.5 py-2.5 rounded-xl">
            ⚠️ Fair play: you left the battle tab {tabSwitches} {tabSwitches === 1 ? 'time' : 'times'}. Tab switching is tracked during matches.
          </div>
        )}

        {/* Question */}
        <div className="bg-card border border-border rounded-2xl p-5 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">{current?.subject}</span>
            <span className="text-xs text-muted-foreground">Q {currentIdx + 1}</span>
          </div>
          <p className="text-base font-semibold text-foreground leading-relaxed mb-4">
            <MathText text={current?.question || ''} />
          </p>

          <div className="space-y-2.5">
            {current?.options.map((opt) => {
              let cls = 'border-border bg-muted/30 text-foreground hover:border-primary/40 hover:bg-primary/5';
              if (myAnswer) {
                if (opt.id === current.correctId) cls = 'border-success bg-success-light text-success';
                else if (opt.id === myAnswer) cls = 'border-error bg-error-light text-error';
                else cls = 'border-border bg-muted/20 text-muted-foreground';
              }
              return (
                <button
                  key={opt.id}
                  onClick={() => handleAnswer(opt.id)}
                  disabled={!!myAnswer}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left text-sm font-medium transition-all duration-200 ${cls}`}
                >
                  <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0 ${
                    myAnswer && opt.id === current.correctId ? 'border-success bg-success text-white' :
                    myAnswer && opt.id === myAnswer && opt.id !== current.correctId ? 'border-error bg-error text-white' : 'border-current'
                  }`}>{opt.id.toUpperCase()}</span>
                  <MathText text={opt.text} className="flex-1" />
                  {myAnswer && opt.id === current.correctId && <CheckCircle2 size={14} className="ml-auto text-success" />}
                  {myAnswer && opt.id === myAnswer && opt.id !== current.correctId && <XCircle size={14} className="ml-auto text-error" />}
                </button>
              );
            })}
          </div>

          {/* Next Question Navigation Controls */}
          <div className="flex items-center justify-between mt-5 pt-3.5 border-t border-border">
            <button
              onClick={() => {
                if (currentIdx > 0) {
                  setCurrentIdx((i) => i - 1);
                  setQuestionTimer(54);
                }
              }}
              disabled={currentIdx === 0}
              className="btn-secondary px-3.5 py-2 text-xs font-semibold gap-1.5 disabled:opacity-30 flex items-center"
            >
              <ChevronLeft size={14} /> Previous
            </button>

            {currentIdx < questions.length - 1 ? (
              <button
                onClick={() => {
                  setCurrentIdx((i) => i + 1);
                  setQuestionTimer(54);
                }}
                className="btn-primary px-5 py-2 text-xs sm:text-sm font-bold gap-2 shadow-sm hover:shadow transition-all flex items-center"
              >
                Next Question <ChevronRight size={16} />
              </button>
            ) : (
              <button
                onClick={finishBattle}
                className="btn-primary bg-success hover:bg-success/90 text-white px-5 py-2 text-xs sm:text-sm font-bold gap-2 shadow-sm flex items-center"
              >
                Submit & Finish <CheckCircle2 size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex gap-1 flex-1">
            {questions.map((q, idx) => (
              <div key={q.id} className={`h-2 flex-1 rounded-full transition-all ${
                idx < currentIdx ? (answers[q.id] === q.correctId ? 'bg-success' : 'bg-error') :
                idx === currentIdx ? 'bg-primary' : 'bg-muted'
              }`} />
            ))}
          </div>
          <div className={`flex items-center gap-1 text-xs font-mono ${timerColor}`}>
            <Clock size={11} /> {formatTime(timeLeft)}
          </div>
        </div>

        {/* Live Room Chat Panel */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <button
            onClick={() => setShowChat((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-foreground hover:bg-muted/30 transition-colors"
          >
            <span className="flex items-center gap-2">
              <MessageSquare size={15} className="text-primary" />
              Room Chat
              {isConnected && <span className="w-1.5 h-1.5 rounded-full bg-success shrink-0" title="Connected" />}
              {chatMessages.length > 0 && (
                <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-bold">{chatMessages.length}</span>
              )}
            </span>
            <span className="text-xs text-muted-foreground">{showChat ? '▲' : '▼'}</span>
          </button>

          {showChat && (
            <>
              <div className="max-h-40 overflow-y-auto px-4 py-2 space-y-2 border-t border-border">
                {chatMessages.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-3">No messages yet. Say something!</p>
                ) : (
                  chatMessages.map((msg) => (
                    <div key={msg.id} className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                        {msg.authorInitial}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-semibold text-foreground">{msg.author}</span>
                        <span className="text-xs text-muted-foreground ml-1">{msg.timestamp}</span>
                        <p className="text-xs text-foreground leading-relaxed">{msg.body}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {typingLabel && (
                <div className="px-4 py-1 border-t border-border">
                  <p className="text-xs text-muted-foreground italic flex items-center gap-1">
                    <span className="flex gap-0.5">
                      <span className="w-1 h-1 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1 h-1 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1 h-1 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                    {typingLabel}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-2 px-3 py-2 border-t border-border">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => { setChatInput(e.target.value); onTyping(); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                  placeholder="Chat with opponent..."
                  className="flex-1 bg-muted/50 text-sm text-foreground placeholder:text-muted-foreground outline-none rounded-lg px-3 py-1.5"
                />
                <button
                  onClick={handleSendChat}
                  disabled={!chatInput.trim()}
                  className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-white disabled:opacity-40 hover:bg-primary/90 transition-colors shrink-0"
                >
                  <Send size={13} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
