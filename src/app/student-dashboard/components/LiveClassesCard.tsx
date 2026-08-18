'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Radio, Lock, ArrowRight, Calendar, Loader2, Sparkles, Video } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface LiveClassRow {
  id: string;
  title: string;
  scheduled_at: string;
  status: string;
  is_premium: boolean;
  meeting_url: string | null;
}

const PAID_PLANS = ['student', 'pro', 'institution'];

function whenLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  if (sameDay) return `Today, ${time}`;
  const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1);
  if (d.toDateString() === tomorrow.toDateString()) return `Tomorrow, ${time}`;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + `, ${time}`;
}

export default function LiveClassesCard() {
  const [cls, setCls] = useState<LiveClassRow | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const supabase = createClient();
        // Prefer a class that's live now; otherwise the next scheduled one.
        const [{ data: classes }, meRes] = await Promise.all([
          supabase
            .from('live_classes')
            .select('id, title, scheduled_at, status, is_premium, meeting_url')
            .in('status', ['live', 'scheduled'])
            .order('scheduled_at', { ascending: true })
            .limit(20),
          fetch('/api/profile/me').then((r) => (r.ok ? r.json() : null)).catch(() => null),
        ]);

        if (!active) return;

        if (meRes) {
          const exp = meRes.subscription_expires_at;
          const planActive = !exp || new Date(exp) > new Date();
          setIsPremium(!!meRes.is_admin || (PAID_PLANS.includes(meRes.subscription_plan) && planActive));
        }

        const list = classes ?? [];
        const liveNow = list.find((c) => c.status === 'live');
        const upcoming = list.filter((c) => c.status === 'scheduled').sort(
          (a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
        )[0];
        setCls(liveNow ?? upcoming ?? null);
      } catch {
        // leave empty
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 flex items-center justify-center h-28">
        <Loader2 size={22} className="animate-spin text-primary" />
      </div>
    );
  }

  const isLive = cls?.status === 'live';
  const gated = cls?.is_premium && !isPremium;

  // No live/scheduled classes → gentle placeholder that still promotes the feature.
  if (!cls) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Radio size={22} className="text-primary" />
          </span>
          <div>
            <p className="font-bold text-foreground">Live Classes</p>
            <p className="text-sm text-muted-foreground">No live class scheduled right now — check back soon.</p>
          </div>
        </div>
        <Link href="/live-classes" className="btn-secondary text-sm py-2 px-4 gap-1.5">
          <Video size={15} /> View schedule
        </Link>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-2xl border p-5 ${
      isLive ? 'border-error/40 bg-gradient-to-br from-error/10 via-card to-card' : 'border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card'
    }`}>
      <div className="absolute -top-16 -right-12 w-40 h-40 rounded-full blur-3xl pointer-events-none opacity-60"
        style={{ background: isLive ? 'rgba(239,68,68,0.18)' : 'rgba(30,58,95,0.18)' }} />

      <div className="relative flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3 min-w-0">
          <span className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${isLive ? 'bg-error/15' : 'bg-primary/10'}`}>
            <Radio size={22} className={isLive ? 'text-error' : 'text-primary'} />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {isLive ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-error text-white animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-white" /> LIVE NOW
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  <Calendar size={11} /> {whenLabel(cls.scheduled_at)}
                </span>
              )}
              {cls.is_premium && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-ma-light text-ma flex items-center gap-0.5">
                  <Sparkles size={9} /> PRO
                </span>
              )}
            </div>
            <p className="font-bold text-foreground mt-1 truncate">{cls.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {gated
                ? 'Upgrade to Pro to join live classes streamed in HD.'
                : isLive ? 'Your class is streaming now — jump in.' : 'Streamed live in-app, in HD.'}
            </p>
          </div>
        </div>

        {/* CTA — Pro users join the live dashboard; others are asked to subscribe. */}
        {gated ? (
          <Link href="/checkout?plan=pro-monthly" className="shrink-0 btn-primary text-sm py-2.5 px-5 gap-1.5 font-bold">
            <Lock size={15} /> Subscribe to Join
          </Link>
        ) : (
          <Link
            href="/live-classes"
            className={`shrink-0 text-sm py-2.5 px-5 gap-1.5 font-bold rounded-lg inline-flex items-center justify-center transition-colors ${
              isLive ? 'bg-error text-white hover:bg-error/90' : 'btn-primary'
            }`}
          >
            {isLive ? <><Radio size={15} /> Join Live Class</> : <>Enter Live Dashboard <ArrowRight size={15} /></>}
          </Link>
        )}
      </div>
    </div>
  );
}
