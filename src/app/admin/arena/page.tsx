'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Shield, Wallet, Trophy, CheckCircle2, XCircle, AlertTriangle, RefreshCw, Loader2, Crown, Flame
} from 'lucide-react';

export default function AdminArenaControlPage() {
  const [pendingPayouts, setPendingPayouts] = useState<any[]>([]);
  const [flaggedUsers, setFlaggedUsers] = useState<any[]>([]);
  const [seasons, setSeasons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/arena/admin');
      if (res.ok) {
        const data = await res.json();
        setPendingPayouts(data.pendingPayouts || []);
        setFlaggedUsers(data.flaggedUsers || []);
        setSeasons(data.seasons || []);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleApprovePayout = async (transactionId: string) => {
    try {
      const res = await fetch('/api/arena/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve_payout', transactionId }),
      });
      const data = await res.json();
      setMsg(data.message || 'Payout status updated');
      fetchAdminData();
    } catch {}
  };

  const handleSetAntiCheatStatus = async (targetUserId: string, newStatus: string) => {
    try {
      const res = await fetch('/api/arena/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set_anti_cheat_status', targetUserId, newStatus }),
      });
      const data = await res.json();
      setMsg(data.message || 'User status updated');
      fetchAdminData();
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
        <div className="flex items-center justify-between border-b border-border/60 pb-4">
          <div className="space-y-1">
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-black border border-primary/20">
              🛡️ ADMIN ARENA 3.0 CONTROL PANEL
            </span>
            <h1 className="text-3xl font-black text-foreground">Cash Rewards &amp; Anti-Cheat Audit</h1>
          </div>
          <button onClick={fetchAdminData} className="btn-secondary py-2 px-3 text-xs font-bold flex items-center gap-1.5">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {msg && (
          <div className="p-3 rounded-2xl bg-primary/10 text-primary text-xs font-bold text-center">
            {msg}
          </div>
        )}

        {/* 💰 PENDING PAYOUT APPROVAL QUEUE */}
        <div className="bg-card border border-border/80 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <h3 className="text-base font-black text-foreground flex items-center gap-2">
              <Wallet size={18} className="text-emerald-600" /> Pending Reward Payouts ({pendingPayouts.length})
            </h3>
            <span className="text-xs font-bold text-muted-foreground">Server-Authoritative Queue</span>
          </div>

          {pendingPayouts.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">No pending payout requests requiring review.</p>
          ) : (
            <div className="space-y-3">
              {pendingPayouts.map((tx) => (
                <div key={tx.id} className="p-4 rounded-2xl bg-muted/20 border border-border/60 flex items-center justify-between gap-4 text-xs">
                  <div className="space-y-0.5">
                    <span className="font-mono font-black text-foreground text-sm">NPR {tx.amount_npr}</span>
                    <span className="text-muted-foreground block">{tx.reason}</span>
                    <span className="text-[10px] text-muted-foreground block">User ID: {tx.user_id}</span>
                  </div>

                  <button
                    onClick={() => handleApprovePayout(tx.id)}
                    className="btn-primary py-2 px-4 text-xs font-black flex items-center gap-1.5"
                  >
                    <CheckCircle2 size={14} />
                    <span>Approve &amp; Pay</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 🛡️ ANTI-CHEAT FLAGGED USERS */}
        <div className="bg-card border border-border/80 rounded-3xl p-6 shadow-xs space-y-4">
          <h3 className="text-base font-black text-foreground border-b border-border/60 pb-3 flex items-center gap-2">
            <Shield size={18} className="text-error" /> Anti-Cheat &amp; Risk Audit Queue
          </h3>

          <div className="space-y-3">
            {flaggedUsers.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">All active players are currently in NORMAL status.</p>
            ) : (
              flaggedUsers.map((u) => (
                <div key={u.id} className="p-3.5 rounded-2xl bg-muted/20 border border-border/60 flex items-center justify-between gap-4 text-xs">
                  <div>
                    <span className="font-bold text-foreground block">{u.full_name} (@{u.username})</span>
                    <span className="text-[10px] text-muted-foreground">{u.battle_rating} ELO · Status: <span className="uppercase font-bold text-error">{u.anti_cheat_status}</span></span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button onClick={() => handleSetAntiCheatStatus(u.id, 'normal')} className="px-3 py-1 rounded-xl bg-emerald-600 text-white font-bold text-[10px]">
                      Clear Flag
                    </button>
                    <button onClick={() => handleSetAntiCheatStatus(u.id, 'suspended')} className="px-3 py-1 rounded-xl bg-error text-white font-bold text-[10px]">
                      Suspend Account
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 🏆 ACTIVE SEASONS MANAGEMENT */}
        <div className="bg-card border border-border/80 rounded-3xl p-6 shadow-xs space-y-4">
          <h3 className="text-base font-black text-foreground border-b border-border/60 pb-3 flex items-center gap-2">
            <Crown size={18} className="text-amber-500" /> CEE Seasons &amp; Prize Pools
          </h3>

          <div className="space-y-3 text-xs">
            {seasons.map((s) => (
              <div key={s.id} className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/30 flex items-center justify-between gap-4">
                <div>
                  <span className="font-black text-foreground text-sm block">{s.title}</span>
                  <span className="text-[10px] text-muted-foreground font-mono">Code: {s.season_code} · Status: {s.is_active ? 'ACTIVE' : 'COMPLETED'}</span>
                </div>

                <div className="text-right font-mono">
                  <span className="text-xs text-muted-foreground block">PRIZE POOL</span>
                  <span className="text-base font-black text-amber-600">NPR {s.prize_pool_npr}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
