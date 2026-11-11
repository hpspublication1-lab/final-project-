'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Trophy, Swords, Clock, ShieldCheck, AlertCircle, Play, RotateCcw,
  Sparkles, CheckCircle2, Award, Zap, HelpCircle, Users, Flame,
  Crown, Gift, Wallet, ArrowRight, Volume2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { sounds } from '@/utils/soundEffects';
import { triggerConfetti } from '@/utils/confetti';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  college: string;
  eloRating: number;
  matchesPlayed: number;
  totalScore: number;
  accuracy: number;
  totalTimeSeconds: number;
}

interface MyEntry {
  rank: number;
  matchesPlayed: number;
  totalScore: number;
  accuracy: number;
  totalTimeSeconds: number;
  correctCount: number;
  incorrectCount: number;
  disqualified: boolean;
  disqualificationReason?: string;
  maxMatches: number;
}

interface ChampionshipMeta {
  id?: string;
  competition_date: string;
  status: string;
  prize_amount_npr: number;
  total_participants: number;
  seconds_remaining: number;
}

export default function DailyChampionshipLobby({ onStartBattle }: { onStartBattle: () => void }) {
  const [meta, setMeta] = useState<ChampionshipMeta | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [myEntry, setMyEntry] = useState<MyEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [secondsLeft, setSecondsLeft] = useState(0);

  const fetchChampionshipData = useCallback(async () => {
    try {
      const res = await fetch('/api/arena/championship');
      if (res.ok) {
        const data = await res.json();
        setMeta(data.championship);
        setLeaderboard(data.leaderboard || []);
        setMyEntry(data.myEntry || null);
        if (data.championship?.seconds_remaining) {
          setSecondsLeft(data.championship.seconds_remaining);
        }
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchChampionshipData();
    const interval = setInterval(fetchChampionshipData, 15000); // refresh every 15s
    return () => clearInterval(interval);
  }, [fetchChampionshipData]);

  // Local ticker countdown
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [secondsLeft]);

  const formatCountdown = (totalSec: number) => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
  };

  const isDisqualified = myEntry?.disqualified;
  const isCapped = (myEntry?.matchesPlayed || 0) >= 10;

  // Psychological Distance & Leaderboard Calculations
  const rank1Leader = leaderboard.length > 0 ? leaderboard[0] : null;
  const rank3Leader = leaderboard.length >= 3 ? leaderboard[2] : null;
  const myRank = myEntry?.rank;
  const myScore = myEntry?.totalScore || 0;
  const isRank1 = myRank === 1 && myScore > 0;
  const isPodium = !!(myRank && myRank <= 3 && myScore > 0);
  const ptsToRank1 = rank1Leader ? Math.max(0, rank1Leader.totalScore - myScore + 1) : 0;
  const ptsToPodium = rank3Leader ? Math.max(0, rank3Leader.totalScore - myScore + 1) : 0;

  const handleStartBattle = () => {
    try {
      sounds.playPowerUp();
    } catch {}
    onStartBattle();
  };

  const handleCelebrateRank1 = () => {
    try {
      sounds.playVictory();
      triggerConfetti();
      toast.success('👑 You are defending the #1 spot! Keep it until midnight to win NPR 1,000!');
    } catch {}
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Hero Banner: Rs 1,000 Daily Prize with eSewa Verified Badge */}
      <div className="relative overflow-hidden bg-gradient-to-br from-amber-500/20 via-primary/10 to-emerald-500/15 border-2 border-amber-500/50 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-black text-xs font-black uppercase tracking-wider shadow-md flex items-center gap-1.5 animate-pulse">
                <Crown size={14} className="fill-black" /> Rank 1: NPR 1,000 Daily Cash
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5">
                <CheckCircle2 size={13} /> Verified eSewa Payout
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-muted/70 text-muted-foreground text-xs font-mono">
                Window: 00:00 – 23:59 NPT
              </span>
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight flex items-center gap-2">
              All-Nepal Daily CEE Championship
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-medium">
              High-stakes medical entrance competitive arena. 100% free entry for all Nepali students. The verified #1 ranker on tonight&apos;s leaderboard wins <strong className="text-amber-500">NPR 1,000</strong> directly to their eSewa wallet at midnight.
            </p>

            <div className="pt-2 flex items-center gap-4 text-xs font-semibold text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1 text-foreground">
                <CheckCircle2 size={14} className="text-emerald-500" /> Free to Compete
              </span>
              <span className="flex items-center gap-1 text-foreground">
                <ShieldCheck size={14} className="text-primary" /> Anti-Cheat Server Monitored
              </span>
              <span className="flex items-center gap-1 text-foreground">
                <Flame size={14} className="text-amber-500" /> First 10 Battles Count
              </span>
            </div>
          </div>

          {/* Right Action & Countdown Box */}
          <div className="bg-card/95 border-2 border-amber-500/30 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col items-center text-center gap-3 shrink-0 min-w-[260px] backdrop-blur-md">
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <Clock size={13} className="text-amber-500" /> Payout Countdown:
            </div>
            <div className="font-mono text-2xl sm:text-3xl font-black text-amber-500 tracking-wider">
              {formatCountdown(secondsLeft)}
            </div>

            {isDisqualified ? (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-xs font-bold">
                ⚠️ Account Flagged: {myEntry?.disqualificationReason || 'Disqualified for today'}
              </div>
            ) : isCapped ? (
              <div className="p-3 rounded-xl bg-muted/60 border border-border text-muted-foreground text-xs font-bold">
                ✓ 10/10 Daily Battles Completed
              </div>
            ) : (
              <button
                onClick={handleStartBattle}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-black font-black text-sm shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 group"
              >
                <Swords size={18} className="group-hover:rotate-12 transition-transform" />
                <span>Enter Championship Match</span>
              </button>
            )}

            <span className="text-[10px] text-muted-foreground">
              Daily battles: <strong className="text-foreground">{myEntry?.matchesPlayed || 0} / 10</strong> completed
            </span>
          </div>
        </div>
      </div>

      {/* Psychological Momentum & Distance-to-Podium Feedback Card */}
      {isRank1 ? (
        <div className="bg-gradient-to-r from-amber-500/20 via-yellow-400/15 to-amber-500/20 border-2 border-amber-500/60 rounded-3xl p-5 sm:p-6 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-black flex items-center justify-center font-black text-2xl shadow-md shrink-0">
              👑
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500 text-black">
                  Current Rank #1
                </span>
                <span className="text-xs font-bold text-amber-500">Defending NPR 1,000 Bounty</span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-foreground mt-0.5">
                You are currently leading All-Nepal!
              </h3>
              <p className="text-xs text-muted-foreground">
                If the championship closes at midnight right now, you win NPR 1,000 via eSewa. Keep your guard up!
              </p>
            </div>
          </div>
          <button
            onClick={handleCelebrateRank1}
            className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-black font-black text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
          >
            <Sparkles size={14} />
            <span>Celebrate 🎉</span>
          </button>
        </div>
      ) : isPodium ? (
        <div className="bg-gradient-to-r from-primary/15 via-purple-500/10 to-amber-500/15 border border-primary/40 rounded-3xl p-5 sm:p-6 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 text-primary flex items-center justify-center font-black text-xl shrink-0">
              🔥
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-primary text-white">
                  Podium Rank #{myRank}
                </span>
                <span className="text-xs font-bold text-amber-500">
                  {ptsToRank1} pts behind #1
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-foreground mt-0.5">
                You are in the Top 3 Podium!
              </h3>
              <p className="text-xs text-muted-foreground">
                You need only <strong>{ptsToRank1} points</strong> to overtake #1. You have <strong>{10 - (myEntry?.matchesPlayed || 0)} matches</strong> left today to claim the NPR 1,000 bounty!
              </p>
            </div>
          </div>
          {!isCapped && (
            <button
              onClick={handleStartBattle}
              className="px-5 py-2.5 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            >
              <Swords size={14} />
              <span>Attack Rank #1 Now</span>
            </button>
          )}
        </div>
      ) : myEntry && myEntry.matchesPlayed > 0 ? (
        <div className="bg-card border border-border/80 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-black text-xl shrink-0">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-muted text-foreground">
                  Rank #{myRank}
                </span>
                <span className="text-xs font-semibold text-muted-foreground">
                  {ptsToPodium > 0 ? `${ptsToPodium} pts to break into Top 3` : 'Climbing the ranks'}
                </span>
              </div>
              <h3 className="text-base font-bold text-foreground mt-0.5">
                Keep the momentum going!
              </h3>
              <p className="text-xs text-muted-foreground">
                You have <strong>{10 - myEntry.matchesPlayed} battles remaining</strong>. Speed and accuracy grant up to +15 bonus points per battle.
              </p>
            </div>
          </div>
          {!isCapped && (
            <button
              onClick={handleStartBattle}
              className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-black font-black text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            >
              <Swords size={14} />
              <span>Play Next Battle</span>
            </button>
          )}
        </div>
      ) : (
        <div className="bg-gradient-to-r from-emerald-500/10 via-card to-amber-500/10 border border-emerald-500/30 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-600 flex items-center justify-center font-black text-xl shrink-0">
              🎯
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500 text-white">
                  100% Free Entry
                </span>
                <span className="text-xs font-bold text-amber-500">NPR 1,000 Up for Grabs Today</span>
              </div>
              <h3 className="text-base font-bold text-foreground mt-0.5">
                Claim your spot on tonight&apos;s national leaderboard!
              </h3>
              <p className="text-xs text-muted-foreground">
                You haven&apos;t played any championship battles yet. 10 rapid MCQ duels can put your name in 1st place!
              </p>
            </div>
          </div>
          <button
            onClick={handleStartBattle}
            className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
          >
            <Swords size={14} />
            <span>Start Battle #1</span>
          </button>
        </div>
      )}

      {/* Verified eSewa Payout Proof Banner */}
      <div className="bg-card border border-border/70 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white font-black text-xs flex items-center justify-center shadow-xs shrink-0">
            eS
          </div>
          <div>
            <p className="font-bold text-foreground flex items-center gap-1.5">
              <span>Verified Daily eSewa Cash Disbursement</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </p>
            <p className="text-muted-foreground text-[11px]">
              Every midnight at 23:59:59 NPT, the server finalizes the audit. Rank 1 receives NPR 1,000 via eSewa with zero fee deduction.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[11px] border border-emerald-500/20 flex items-center gap-1">
            <ShieldCheck size={12} /> Guaranteed Payout
          </span>
        </div>
      </div>

      {/* Student's Daily Standing Cards */}
      {myEntry && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-card border border-border/80 rounded-2xl p-4 text-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Your Rank Today</span>
            <p className="text-2xl font-black text-amber-500 mt-1">#{myEntry.rank}</p>
          </div>
          <div className="bg-card border border-border/80 rounded-2xl p-4 text-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Championship Points</span>
            <p className="text-2xl font-black text-primary mt-1">{myEntry.totalScore} pts</p>
          </div>
          <div className="bg-card border border-border/80 rounded-2xl p-4 text-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Net Accuracy</span>
            <p className="text-2xl font-black text-emerald-500 mt-1">{myEntry.accuracy}%</p>
          </div>
          <div className="bg-card border border-border/80 rounded-2xl p-4 text-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Matches Remaining</span>
            <p className="text-2xl font-black text-foreground mt-1">{10 - myEntry.matchesPlayed}</p>
          </div>
        </div>
      )}

      {/* Live Daily Leaderboard */}
      <div className="bg-card border border-border/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Trophy size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Live Daily Championship Leaderboard</h3>
              <p className="text-xs text-muted-foreground">Rankings update automatically based on verified server results.</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live Updating
            </span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-border/80 text-[11px] text-muted-foreground uppercase tracking-wider">
                <th className="py-3 px-3">Rank</th>
                <th className="py-3 px-3">Student</th>
                <th className="py-3 px-3">Matches</th>
                <th className="py-3 px-3">Accuracy</th>
                <th className="py-3 px-3 text-right">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 font-medium">
              {leaderboard.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground text-xs">
                    No completed championship matches yet today. Be the first to take the lead!
                  </td>
                </tr>
              ) : (
                leaderboard.map((row) => {
                  const isTop1 = row.rank === 1;
                  return (
                    <tr
                      key={row.userId}
                      className={`hover:bg-muted/40 transition-colors ${
                        isTop1 ? 'bg-amber-500/10 font-bold' : ''
                      }`}
                    >
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span
                          className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-xs font-black ${
                            row.rank === 1
                              ? 'bg-amber-500 text-black'
                              : row.rank === 2
                              ? 'bg-slate-300 text-black'
                              : row.rank === 3
                              ? 'bg-amber-700 text-white'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {row.rank}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="truncate">
                          <p className="font-bold text-foreground truncate flex items-center gap-1.5">
                            <span>{row.name}</span>
                            {isTop1 && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 font-extrabold">
                                Leader (Rs. 1,000)
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate">{row.college} • {row.eloRating} ELO</p>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-muted-foreground whitespace-nowrap">
                        {row.matchesPlayed} / 10
                      </td>
                      <td className="py-3.5 px-3 text-emerald-600 font-semibold whitespace-nowrap">
                        {row.accuracy}%
                      </td>
                      <td className="py-3.5 px-3 text-right font-black text-primary text-sm sm:text-base whitespace-nowrap">
                        {row.totalScore}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Rules & Integrity Note */}
        <div className="p-4 rounded-2xl bg-muted/30 border border-border/80 space-y-1.5 text-xs text-muted-foreground">
          <p className="font-bold text-foreground flex items-center gap-1.5">
            <HelpCircle size={13} /> Official Championship Rules:
          </p>
          <ul className="list-disc pl-4 space-y-1 leading-relaxed">
            <li>Minimum 5 completed battles required to be eligible for the daily cash prize.</li>
            <li>First 10 championship battles count toward daily points. Extra battles do not add score (eliminates grinding).</li>
            <li>Tab switches, automated answers, and multi-accounting result in disqualification upon server audit.</li>
            <li>Winner is finalized at 23:59:59 NPT. Payout is processed to the verified student&apos;s eSewa account.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
