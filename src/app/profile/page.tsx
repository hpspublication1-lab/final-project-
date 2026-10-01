'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import {
  User, Trophy, Crown, Flame, Star, Award, Shield, Swords, Check, Copy,
  Wallet, ArrowDownToLine, Settings, CheckCircle2, Zap, Target, Edit3, X, Loader2
} from 'lucide-react';

const PRESET_AVATARS = [
  '🧑‍🎓', '👨‍🎓', '👩‍🎓', '🧑‍💻', '🧑‍🔬', '👨‍🔬', '👩‍🔬', '🦁', '🦅', '⚡', '🧬', '🧪'
];

const AVAILABLE_TITLES = [
  'CEE Challenger',
  'Biology Beast',
  'Chemistry Master',
  'Physics Warrior',
  'Top 100 Nepal',
  'Arena Elite',
  'Grandmaster Aspirant',
];

export default function StudentProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  // Form State
  const [usernameInput, setUsernameInput] = useState('');
  const [displayNameInput, setDisplayNameInput] = useState('');
  const [bioInput, setBioInput] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('🧑‍🎓');
  const [selectedTitle, setSelectedTitle] = useState('CEE Challenger');
  const [msg, setMsg] = useState<{ text: string; error: boolean } | null>(null);

  // Withdrawal Modal
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('1000');
  const [paymentDetails, setPaymentDetails] = useState('');

  useEffect(() => {
    fetch('/api/profile/me')
      .then((r) => r.json())
      .then((d) => {
        if (d?.id) {
          fetch(`/api/arena/profile?userId=${d.id}`)
            .then((res) => res.json())
            .then((data) => {
              if (data.profile) {
                setProfile(data.profile);
                setUsernameInput(data.profile.username || '');
                setDisplayNameInput(data.profile.full_name || '');
                setBioInput(data.profile.bio || '');
                setSelectedAvatar(data.profile.avatar_url || '🧑‍🎓');
                setSelectedTitle(data.profile.selected_title || 'CEE Challenger');
              }
              if (data.achievements) setAchievements(data.achievements);
              setLoading(false);
            });

          // Fetch Wallet
          fetch(`/api/arena/wallet?userId=${d.id}`)
            .then((res) => res.json())
            .then((data) => {
              if (data.wallet) setWallet(data.wallet);
              if (data.transactions) setTransactions(data.transactions);
            });
        }
      });
  }, []);

  const handleSaveProfile = async () => {
    if (!profile?.id) return;
    setMsg(null);

    try {
      const res = await fetch('/api/arena/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: profile.id,
          username: usernameInput,
          displayName: displayNameInput,
          bio: bioInput,
          avatarUrl: selectedAvatar,
          selectedTitle,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setMsg({ text: data.error || 'Failed to update profile', error: true });
        return;
      }

      setMsg({ text: 'Profile updated successfully!', error: false });
      setIsEditing(false);
      setProfile((prev: any) => ({
        ...prev,
        username: usernameInput,
        full_name: displayNameInput,
        bio: bioInput,
        avatar_url: selectedAvatar,
        selected_title: selectedTitle,
      }));
    } catch {
      setMsg({ text: 'Error saving profile', error: true });
    }
  };

  const handleWithdrawalRequest = async () => {
    if (!profile?.id) return;
    try {
      const res = await fetch('/api/arena/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: profile.id,
          amountNpr: Number(withdrawAmount),
          paymentDetails,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowWithdrawModal(false);
        setMsg({ text: data.message, error: false });
      }
    } catch {}
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

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-background text-foreground py-8 px-4 sm:px-6 lg:px-8 space-y-8 max-w-6xl mx-auto">
        {/* Profile Banner */}
        <div className="bg-gradient-to-br from-card via-card to-primary/10 border border-border/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
            <div className="w-24 h-24 rounded-3xl bg-primary/10 border-2 border-primary/40 flex items-center justify-center text-4xl shadow-md shrink-0">
              {profile?.avatar_url || '🧑‍🎓'}
            </div>

            <div className="space-y-2 flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-foreground">{profile?.full_name}</h1>
                <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-mono font-bold">
                  @{profile?.username}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 text-xs font-bold border border-amber-500/20">
                  {profile?.selected_title}
                </span>
              </div>

              <p className="text-xs text-muted-foreground max-w-xl">{profile?.bio}</p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-1 font-mono text-xs font-bold">
                <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <Crown size={14} /> 🇳🇵 Nepal Rank #{profile?.country_rank}
                </span>
                <span className="text-primary flex items-center gap-1">
                  <Swords size={14} /> {profile?.battle_rating} ELO Rating
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Flame size={14} /> {profile?.win_streak} Win Streak
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsEditing(!isEditing)}
              className="btn-secondary text-xs font-bold py-2.5 px-4 flex items-center gap-2 shrink-0"
            >
              <Edit3 size={14} />
              <span>{isEditing ? 'Cancel' : 'Edit Profile'}</span>
            </button>
          </div>
        </div>

        {msg && (
          <div className={`p-4 rounded-2xl border text-xs font-bold text-center ${msg.error ? 'bg-error/10 border-error/30 text-error' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600'}`}>
            {msg.text}
          </div>
        )}

        {/* Edit Form Modal */}
        {isEditing && (
          <div className="bg-card border-2 border-primary/40 rounded-3xl p-6 shadow-xl space-y-5 animate-fade-in">
            <h3 className="text-lg font-black text-foreground border-b border-border/60 pb-3">Customize Arena Student Identity</h3>

            <div className="grid sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-bold text-muted-foreground block mb-1">Display Name</label>
                <input
                  type="text"
                  value={displayNameInput}
                  onChange={(e) => setDisplayNameInput(e.target.value)}
                  className="w-full p-3 rounded-xl bg-muted/30 border border-border text-foreground font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-muted-foreground block mb-1">Unique Username (@username)</label>
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className="w-full p-3 rounded-xl bg-muted/30 border border-border text-foreground font-bold font-mono"
                  placeholder="surajcee"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="font-bold text-muted-foreground block mb-1">Bio / Entrance Goal</label>
                <input
                  type="text"
                  value={bioInput}
                  onChange={(e) => setBioInput(e.target.value)}
                  className="w-full p-3 rounded-xl bg-muted/30 border border-border text-foreground"
                  placeholder="IOM Medical Aspirant 2026"
                />
              </div>

              <div>
                <label className="font-bold text-muted-foreground block mb-1">Select Avatar Emoji</label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {PRESET_AVATARS.map((av) => (
                    <button
                      key={av}
                      onClick={() => setSelectedAvatar(av)}
                      className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center border transition-all ${
                        selectedAvatar === av ? 'border-primary bg-primary/20 scale-110 shadow-xs' : 'border-border/60 bg-muted/20'
                      }`}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-muted-foreground block mb-1">Select Earned Title</label>
                <select
                  value={selectedTitle}
                  onChange={(e) => setSelectedTitle(e.target.value)}
                  className="w-full p-3 rounded-xl bg-muted/30 border border-border text-foreground font-bold"
                >
                  {AVAILABLE_TITLES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setIsEditing(false)} className="btn-secondary py-2.5 px-4 text-xs font-bold">
                Cancel
              </button>
              <button onClick={handleSaveProfile} className="btn-primary py-2.5 px-5 text-xs font-black">
                Save Identity Changes
              </button>
            </div>
          </div>
        )}

        {/* 💰 CASH REWARDS WALLET CARD */}
        {wallet && (
          <div className="bg-gradient-to-br from-card via-card to-amber-500/5 border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
              <div className="space-y-1">
                <span className="text-xs font-black uppercase text-amber-600 font-mono flex items-center gap-1.5">
                  <Wallet size={16} /> SAMYAK CEE REWARD WALLET
                </span>
                <h2 className="text-xl font-black text-foreground">Cash Prizes &amp; Season Tournament Wallet</h2>
              </div>

              <button
                onClick={() => setShowWithdrawModal(true)}
                className="btn-primary py-2.5 px-5 text-xs font-black flex items-center gap-2"
              >
                <ArrowDownToLine size={14} />
                <span>Request Payout (eSewa / Fonepay)</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
              <div className="p-4 rounded-2xl bg-card border border-border/60 space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">AVAILABLE BALANCE</span>
                <div className="text-2xl font-black text-emerald-600">NPR {wallet.availableNpr}</div>
              </div>
              <div className="p-4 rounded-2xl bg-card border border-border/60 space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">PENDING REVIEW</span>
                <div className="text-2xl font-black text-amber-500">NPR {wallet.pendingNpr}</div>
              </div>
              <div className="p-4 rounded-2xl bg-card border border-border/60 space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">TOTAL EARNED</span>
                <div className="text-2xl font-black text-foreground">NPR {wallet.totalEarnedNpr}</div>
              </div>
            </div>

            {/* Payout Modal */}
            {showWithdrawModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                <div className="bg-card border border-border rounded-3xl p-6 shadow-2xl max-w-md w-full space-y-5">
                  <div className="flex items-center justify-between border-b border-border/60 pb-3">
                    <h3 className="text-lg font-black text-foreground">Request Cash Reward Payout</h3>
                    <button onClick={() => setShowWithdrawModal(false)}><X size={20} /></button>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="font-bold text-muted-foreground block mb-1">Amount (NPR)</label>
                      <input
                        type="number"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        className="w-full p-3 rounded-xl bg-muted/30 border border-border text-foreground font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-muted-foreground block mb-1">Payment Method &amp; Account Number</label>
                      <input
                        type="text"
                        value={paymentDetails}
                        onChange={(e) => setPaymentDetails(e.target.value)}
                        placeholder="e.g. Fonepay Mobile / eSewa ID (98XXXXXXXX)"
                        className="w-full p-3 rounded-xl bg-muted/30 border border-border text-foreground"
                      />
                    </div>
                  </div>

                  <p className="text-[10px] text-muted-foreground">
                    Payouts are reviewed by admin anti-cheat monitoring before release to eSewa / Fonepay account.
                  </p>

                  <button
                    onClick={handleWithdrawalRequest}
                    className="btn-primary w-full py-3 text-xs font-black justify-center"
                  >
                    Submit Withdrawal Request
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 🏆 ACHIEVEMENTS DISPLAY CARD */}
        <div className="bg-card border border-border/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
          <h3 className="text-lg font-black text-foreground border-b border-border/60 pb-3 flex items-center gap-2">
            <Trophy size={18} className="text-amber-500" /> EARNED ACHIEVEMENTS &amp; BADGES
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { code: 'FIRST_VICTORY', title: 'First Victory', icon: '⚔️', desc: 'Win 1st Arena Match' },
              { code: 'FIVE_ALIVE', title: 'Five Alive', icon: '🔥', desc: '5 Match Win Streak' },
              { code: 'BIO_BEAST', title: 'Biology Beast', icon: '🧬', desc: '85%+ Biology Accuracy' },
              { code: 'TOP_100', title: 'Top 100 Nepal', icon: '🏆', desc: 'Reach Top 100 Rankings' },
            ].map((b) => (
              <div key={b.code} className="p-3.5 rounded-2xl bg-muted/20 border border-border/60 text-center space-y-1">
                <span className="text-2xl block">{b.icon}</span>
                <span className="font-bold text-xs text-foreground block">{b.title}</span>
                <span className="text-[10px] text-muted-foreground block">{b.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
