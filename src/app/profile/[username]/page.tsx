'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import {
  User, Trophy, Crown, Flame, Star, Award, Shield, Swords, Check, UserPlus,
  BarChart3, Loader2, ArrowLeft
} from 'lucide-react';

export default function PublicStudentProfilePage() {
  const { username } = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [headToHead, setHeadToHead] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (username) {
      fetch(`/api/arena/profile?username=${encodeURIComponent(username as string)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.profile) {
            setProfile(data.profile);
            // Fetch Head to head if logged in
            if (user?.id) {
              fetch(`/api/arena/rivals?userId=${user.id}&opponentId=${data.profile.id}`)
                .then((r) => r.json())
                .then((h) => setHeadToHead(h.headToHead));
            }
          }
          setLoading(false);
        });
    }
  }, [username, user]);

  const sendFriendRequest = async () => {
    if (!user?.id || !profile?.id) return;
    try {
      const res = await fetch('/api/arena/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send_request', userId: user.id, targetUserId: profile.id }),
      });
      const data = await res.json();
      setMsg(data.message || 'Request sent!');
      setTimeout(() => setMsg(null), 3000);
    } catch {
      setMsg('Failed to send request');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="animate-spin text-primary" size={36} />
        </div>
      </DashboardLayout>
    );
  }

  if (!profile) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex flex-col items-center justify-center text-center space-y-4">
          <h2 className="text-2xl font-black text-foreground">Student Identity Not Found</h2>
          <Link href="/match-lobby" className="btn-primary text-xs font-bold py-2.5 px-4">
            Back to Match Lobby
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-background text-foreground py-8 px-4 sm:px-6 lg:px-8 space-y-8 max-w-5xl mx-auto">
        <Link href="/match-lobby" className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground">
          <ArrowLeft size={14} /> Back to Lobby
        </Link>

        {msg && (
          <div className="p-3 rounded-2xl bg-primary/10 text-primary text-xs font-bold text-center">
            {msg}
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-gradient-to-br from-card via-card to-primary/10 border border-border/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
            <div className="w-24 h-24 rounded-3xl bg-primary/10 border-2 border-primary/40 flex items-center justify-center text-4xl shadow-md shrink-0">
              {profile.avatar_url || '🧑‍🎓'}
            </div>

            <div className="space-y-2 flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-foreground">{profile.full_name}</h1>
                <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-mono font-bold">
                  @{profile.username}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 text-xs font-bold border border-amber-500/20">
                  {profile.selected_title}
                </span>
              </div>

              <p className="text-xs text-muted-foreground">{profile.bio}</p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-1 font-mono text-xs font-bold">
                <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <Crown size={14} /> 🇳🇵 Nepal Rank #{profile.country_rank}
                </span>
                <span className="text-primary flex items-center gap-1">
                  <Swords size={14} /> {profile.battle_rating} ELO
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Flame size={14} /> {profile.win_streak} Streak
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={sendFriendRequest}
                className="btn-secondary py-2.5 px-4 text-xs font-bold flex items-center gap-1.5"
              >
                <UserPlus size={14} />
                <span>Add Friend</span>
              </button>
              <Link
                href={`/match-lobby`}
                className="btn-primary py-2.5 px-4 text-xs font-black flex items-center gap-1.5"
              >
                <Swords size={14} />
                <span>Challenge</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Head-To-Head Card */}
        {headToHead && (
          <div className="bg-card border-2 border-primary/30 rounded-3xl p-6 shadow-xs space-y-4">
            <h3 className="text-base font-black text-foreground border-b border-border/60 pb-3 flex items-center gap-2">
              <Swords size={16} className="text-primary" /> HEAD-TO-HEAD VS {profile.full_name.toUpperCase()}
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center font-mono">
              <div className="p-3 rounded-2xl bg-muted/20 border border-border/60">
                <span className="text-[10px] text-muted-foreground block">MATCHES</span>
                <span className="text-lg font-black text-foreground">{headToHead.totalBattles}</span>
              </div>
              <div className="p-3 rounded-2xl bg-muted/20 border border-border/60">
                <span className="text-[10px] text-muted-foreground block">YOUR WINS</span>
                <span className="text-lg font-black text-emerald-600">{headToHead.userWins}</span>
              </div>
              <div className="p-3 rounded-2xl bg-muted/20 border border-border/60">
                <span className="text-[10px] text-muted-foreground block">THEIR WINS</span>
                <span className="text-lg font-black text-amber-600">{headToHead.opponentWins}</span>
              </div>
              <div className="p-3 rounded-2xl bg-muted/20 border border-border/60">
                <span className="text-[10px] text-muted-foreground block">ACCURACY</span>
                <span className="text-lg font-black text-primary">{headToHead.userAccuracy}% vs {headToHead.opponentAccuracy}%</span>
              </div>
            </div>
          </div>
        )}

        {/* Subject Ratings */}
        <div className="bg-card border border-border/80 rounded-3xl p-6 shadow-xs space-y-4">
          <h3 className="text-base font-black text-foreground border-b border-border/60 pb-3 flex items-center gap-2">
            <BarChart3 size={16} className="text-primary" /> SUBJECT PERFORMANCE BREAKDOWN
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-muted-foreground block">🧬 Biology</span>
              <span className="text-lg font-black text-emerald-600">{profile.bio_rating} ELO</span>
            </div>
            <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20">
              <span className="text-muted-foreground block">🧪 Chemistry</span>
              <span className="text-lg font-black text-purple-600">{profile.chem_rating} ELO</span>
            </div>
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
              <span className="text-muted-foreground block">⚡ Physics</span>
              <span className="text-lg font-black text-amber-600">{profile.phy_rating} ELO</span>
            </div>
            <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20">
              <span className="text-muted-foreground block">🧠 Mental Agility</span>
              <span className="text-lg font-black text-cyan-600">{profile.ma_rating} ELO</span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
