'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Rocket, Star, ShieldCheck, Trophy, GraduationCap, Users, BookOpen, Bot, Swords, Video,
  Zap, Brain, FileText, Radio, CheckCircle2, ArrowRight, Clock, Loader2, PhoneCall,
  Sparkles, BadgeCheck, Wallet, Copy, ChevronRight, PartyPopper, Layers, Smartphone, RefreshCw,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// CONFIG — edit these before launch
// ═══════════════════════════════════════════════════════════════════════════

// Offer deadline (6 days from now). Nepal time (UTC+05:45).
const PREBOOKING_DEADLINE = new Date('2026-08-03T23:59:59+05:45');

const PREBOOK_FEE = 300;       // pay now to reserve
const COURSE_PRICE = 2299;     // prebooker price for the full course
const ORIGINAL_PRICE = 2999;   // regular price
const COURSE_DAYS = 45;
const SAVINGS = ORIGINAL_PRICE - COURSE_PRICE; // 700

// Fonepay dynamic-QR polling — a QR expires around 5 minutes.
const POLL_INTERVAL_MS = 3000;
const MAX_POLL_MS = 5 * 60 * 1000;

import { SUPPORT_CONFIG } from '@/lib/config/support';

// Payment details — editable configuration.
const PAYMENT = {
  whatsapp: SUPPORT_CONFIG.whatsappNumber, // full intl format, digits only
};

const COURSE_FEATURES = [
  { icon: GraduationCap, title: 'Top MBBS rank-holder classes', desc: 'Learn directly from Nepal\'s top CEE & MBBS toppers — the exact strategies that cracked the exam.' },
  { icon: Users, title: '1-on-1 mentorship & guidance', desc: 'A dedicated mentor tracks your progress, fixes weak areas, and keeps you on target for 45 days.' },
  { icon: Rocket, title: '45-day intensive crash course', desc: 'A day-by-day battle plan engineered to peak exactly on exam day. No wasted hours.' },
  { icon: Trophy, title: 'MEC CEE pattern mock tests', desc: 'Full 200-MCQ mocks (Physics 50 · Chemistry 50 · Botany 40 · Zoology 40 · MAT 20) with real +1 / −0.25 scoring.' },
];

const APP_FEATURES = [
  { icon: BookOpen, label: '15,000+ MCQs with explanations', color: 'text-bio', bg: 'bg-bio-light' },
  { icon: Bot, label: 'AI Tutor — 24/7 doubt solving', color: 'text-chem', bg: 'bg-chem-light' },
  { icon: Swords, label: 'Real-time 2-player Battle Arena', color: 'text-error', bg: 'bg-error-light' },
  { icon: Video, label: 'Samyak Guru App video lectures', color: 'text-physics', bg: 'bg-physics-light' },
  { icon: FileText, label: 'Full mock tests + instant analysis', color: 'text-primary', bg: 'bg-secondary' },
  { icon: Brain, label: 'AI Mistake Analyser', color: 'text-ma', bg: 'bg-ma-light' },
  { icon: Layers, label: 'Spaced-repetition flashcards', color: 'text-bio', bg: 'bg-bio-light' },
  { icon: Radio, label: 'Samyak Guru App live classes', color: 'text-error', bg: 'bg-error-light' },
  { icon: Trophy, label: 'Leaderboard & rank predictor', color: 'text-ma', bg: 'bg-ma-light' },
];

const FAQS = [
  { q: 'What exactly am I paying for now?', a: `Rs ${PREBOOK_FEE} reserves your seat and locks the discounted course price. When the 45-day crash course begins, you pay only Rs ${COURSE_PRICE} instead of Rs ${ORIGINAL_PRICE}.` },
  { q: 'Is the Rs 300 refundable?', a: 'Your prebooking amount is adjusted toward your course fee. If we ever cancel the batch, you are fully refunded.' },
  { q: 'When does the crash course start?', a: 'The batch begins right after the prebooking window closes. You\'ll get the exact schedule on WhatsApp and inside the app.' },
  { q: 'How do I get access to the app?', a: 'The moment your payment is confirmed, we activate your account so you can start using all the app features immediately.' },
];

// ═══════════════════════════════════════════════════════════════════════════
// Countdown
// ═══════════════════════════════════════════════════════════════════════════

function useCountdown() {
  const [targetMs] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('prebook_offer_deadline_v2');
      if (saved && !isNaN(Number(saved))) {
        return Number(saved);
      }
      const newTarget = Date.now() + 6 * 24 * 60 * 60 * 1000;
      localStorage.setItem('prebook_offer_deadline_v2', String(newTarget));
      return newTarget;
    }
    return Date.now() + 6 * 24 * 60 * 60 * 1000;
  });

  const [left, setLeft] = useState({ days: 6, hours: 0, minutes: 0, seconds: 0, done: false });

  useEffect(() => {
    const tick = () => {
      const diff = targetMs - Date.now();
      if (diff <= 0) {
        setLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, done: true });
        return;
      }
      setLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
        done: false,
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetMs]);

  return left;
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center bg-card border border-border rounded-2xl px-3 py-2.5 sm:px-5 sm:py-3.5 min-w-[62px] sm:min-w-[84px] shadow-sm">
      <span className="font-mono text-2xl sm:text-4xl font-extrabold text-foreground tabular-nums leading-none">
        {String(value).padStart(2, '0')}
      </span>
      <span className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground mt-1.5 font-semibold">{label}</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Main
// ═══════════════════════════════════════════════════════════════════════════

type Step = 'form' | 'payment' | 'done';

export default function PrebookClient() {
  const countdown = useCountdown();
  const reserveRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const [step, setStep] = useState<Step>('form');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reference, setReference] = useState<string>('');
  const [copied, setCopied] = useState<string | null>(null);

  const [form, setForm] = useState({ fullName: '', phone: '', email: '', college: '', ceeYear: '2026' });

  // Fonepay dynamic-QR state for the payment step.
  const [qr, setQr] = useState<{ prn: string; amount: number; label: string; qrDataUrl: string } | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef<number>(0);

  const scrollToReserve = () => reserveRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => stopPolling, [stopPolling]);

  const startPolling = useCallback(
    (ref: string, phone: string) => {
      startedAtRef.current = Date.now();
      stopPolling();
      pollRef.current = setInterval(async () => {
        if (Date.now() - startedAtRef.current > MAX_POLL_MS) {
          stopPolling();
          setQr(null);
          setError('This QR expired. Tap "Show a fresh QR" to continue.');
          return;
        }
        try {
          const res = await fetch('/api/payments/fonepay/prebook-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reference: ref, phone }),
          });
          const data = await res.json();
          if (data.status === 'completed') {
            stopPolling();
            setStep('done');
            setTimeout(() => reserveRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
          }
        } catch {
          // transient network blip — keep polling
        }
      }, POLL_INTERVAL_MS);
    },
    [stopPolling]
  );

  const generatePrebookQr = useCallback(
    async (ref: string, phone: string) => {
      setError(null);
      setQr(null);
      setQrLoading(true);
      stopPolling();
      try {
        const res = await fetch('/api/payments/fonepay/prebook-qr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reference: ref, phone }),
        });
        const data = await res.json();
        if (!res.ok) {
          if (data.alreadyPaid) {
            setStep('done');
            return;
          }
          setError(data.error ?? 'Could not generate the QR. Please try again.');
          return;
        }
        setQr(data);
        startPolling(ref, phone);
      } catch {
        setError('Something went wrong generating the QR. Please try again.');
      } finally {
        setQrLoading(false);
      }
    },
    [startPolling, stopPolling]
  );

  // Create the booking straight from known profile fields and jump to the QR —
  // used when a signed-in user arrives to pay (login → onboarding → /prebook?pay=1).
  const autoStartPayment = useCallback(
    async (p: { fullName: string; phone: string; email: string; college: string; ceeYear: string }) => {
      if (p.fullName.trim().length < 2 || p.phone.replace(/\D/g, '').length < 10) return;
      setSubmitting(true);
      try {
        const supabase = createClient();
        const { data, error: rpcError } = await supabase.rpc('create_prebooking', {
          p_full_name: p.fullName,
          p_phone: p.phone,
          p_email: p.email || null,
          p_college: p.college || null,
          p_cee_year: p.ceeYear ? parseInt(p.ceeYear) : null,
          p_utm: null,
        });
        const res = data as { success?: boolean; reference?: string } | null;
        if (rpcError || !res?.success || !res.reference) {
          setSubmitting(false);
          return; // fall back to the normal form
        }
        setReference(res.reference);
        setStep('payment');
        setTimeout(scrollToReserve, 50);
        generatePrebookQr(res.reference, p.phone);
      } catch {
        // fall back to the form
      }
      setSubmitting(false);
    },
    [generatePrebookQr]
  );

  // On load, prefill from the signed-in user's profile (via a service-role
  // route, so it works despite the user_profiles RLS recursion). If they were
  // sent here to pay (?pay=1), start the Fonepay QR straight away.
  useEffect(() => {
    const wantPay =
      typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('pay') === '1';
    (async () => {
      try {
        const res = await fetch('/api/profile/me');
        if (!res.ok) return; // not signed in
        const me = await res.json();
        const prefilled = {
          fullName: me.full_name || '',
          phone: me.phone ? String(me.phone).replace(/^\+977/, '') : '',
          email: me.email || '',
          college: me.college || '',
          ceeYear: me.cee_year ? String(me.cee_year) : '2026',
        };
        setForm(prefilled);
        if (wantPay) autoStartPayment(prefilled);
      } catch {
        // ignore — leave the form empty
      }
    })();
  }, [autoStartPayment]);

  const copy = useCallback((text: string, key: string) => {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    });
  }, []);

  const submitReservation = async () => {
    setError(null);

    // Require login before starting payment — send guests to the auth screen
    // and bring them right back to /prebook once they're in.
    const supabase = createClient();
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      router.push(`/sign-up-login-screen?redirect=${encodeURIComponent('/prebook?pay=1')}`);
      return;
    }

    if (form.fullName.trim().length < 2) { setError('Please enter your full name.'); return; }
    if (form.phone.replace(/\D/g, '').length < 10) { setError('Please enter a valid 10-digit mobile number.'); return; }

    setSubmitting(true);
    try {
      const { data, error: rpcError } = await supabase.rpc('create_prebooking', {
        p_full_name: form.fullName,
        p_phone: form.phone,
        p_email: form.email || null,
        p_college: form.college || null,
        p_cee_year: form.ceeYear ? parseInt(form.ceeYear) : null,
        p_utm: typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('utm_source') : null,
      });
      const res = data as { success?: boolean; reference?: string; error?: string } | null;
      if (rpcError || !res?.success || !res.reference) {
        setError(res?.error ?? rpcError?.message ?? 'Something went wrong. Please try again.');
        setSubmitting(false);
        return;
      }
      setReference(res.reference);
      setStep('payment');
      setTimeout(scrollToReserve, 50);
      // Immediately generate the Fonepay dynamic QR for the Rs 300 deposit.
      generatePrebookQr(res.reference, form.phone);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error. Please try again.');
    }
    setSubmitting(false);
  };

  const whatsappLink = `https://wa.me/${PAYMENT.whatsapp}?text=${encodeURIComponent(
    `Hi Samyak CEE Mastery! I want to prebook the 45-day crash course.${reference ? ` My reference is ${reference}.` : ''}`
  )}`;

  const offerEnded = countdown.done;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Top bar ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-card/70 backdrop-blur-xl border-b border-border/70">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <Rocket size={16} className="text-primary" />
            </span>
            <span className="font-extrabold text-sm sm:text-base tracking-tight">Samyak <span className="text-primary">CEE Mastery</span></span>
          </Link>
          <div className="flex items-center gap-3">
            {!offerEnded && (
              <span className="hidden sm:flex items-center gap-1.5 text-xs font-mono font-bold text-primary bg-secondary px-2.5 py-1 rounded-full">
                <Clock size={12} />
                {countdown.days}d {String(countdown.hours).padStart(2, '0')}:{String(countdown.minutes).padStart(2, '0')}:{String(countdown.seconds).padStart(2, '0')}
              </span>
            )}
            <button onClick={scrollToReserve} className="btn-primary text-sm py-1.5 px-4">Prebook Rs {PREBOOK_FEE}</button>
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden gradient-hero">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-14 pb-16 text-center">
          <div className="inline-flex items-center gap-2 bg-card border border-border rounded-full pl-1.5 pr-3.5 py-1.5 shadow-xs mb-6 animate-fade-in">
            <span className="inline-flex items-center gap-1 bg-secondary text-primary text-xs font-bold px-2 py-0.5 rounded-full">
              <Sparkles size={11} /> LAUNCH OFFER
            </span>
            <span className="text-sm font-medium">Nepal&apos;s most advanced CEE system — now open for prebooking</span>
          </div>

          <h1 className="text-hero-xl text-foreground max-w-4xl mx-auto">
            Reserve your seat for{' '}
            <span className="bg-gradient-to-r from-primary to-[#7C6BFF] bg-clip-text text-transparent">just Rs {PREBOOK_FEE}</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mt-5 leading-relaxed">
            The {COURSE_DAYS}-day CEE crash course by <span className="font-semibold text-foreground">top MBBS rank-holders</span>, with 1-on-1 mentorship and Nepal&apos;s most advanced prep app. Prebook today and pay only <span className="font-semibold text-foreground">Rs {COURSE_PRICE}</span> for the full course — instead of Rs {ORIGINAL_PRICE}.
          </p>

          {/* Countdown */}
          <div className="mt-9">
            <p className="section-label mb-3">{offerEnded ? 'Prebooking window' : 'Offer closes in'}</p>
            {offerEnded ? (
              <p className="text-lg font-bold text-error">This prebooking window has closed.</p>
            ) : (
              <div className="flex items-center justify-center gap-2.5 sm:gap-3">
                <CountdownUnit value={countdown.days} label="Days" />
                <span className="text-2xl font-bold text-border pb-4">:</span>
                <CountdownUnit value={countdown.hours} label="Hrs" />
                <span className="text-2xl font-bold text-border pb-4">:</span>
                <CountdownUnit value={countdown.minutes} label="Min" />
                <span className="text-2xl font-bold text-border pb-4">:</span>
                <CountdownUnit value={countdown.seconds} label="Sec" />
              </div>
            )}
          </div>

          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button onClick={scrollToReserve} disabled={offerEnded} className="btn-primary gap-2 text-base py-3 px-7 disabled:opacity-50">
              Prebook now for Rs {PREBOOK_FEE} <ArrowRight size={18} />
            </button>
            <a href={whatsappLink} target="_blank" rel="noreferrer" className="btn-secondary gap-2 text-base py-3 px-6">
              <PhoneCall size={16} /> Talk to us on WhatsApp
            </a>
          </div>

          {/* Trust strip */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><BadgeCheck size={15} className="text-accent" /> Top MBBS rank-holders</span>
            <span className="flex items-center gap-1.5"><ShieldCheck size={15} className="text-accent" /> 1-on-1 mentorship</span>
            <span className="flex items-center gap-1.5"><Star size={15} className="text-accent fill-accent" /> Most advanced app in Nepal</span>
          </div>
        </div>
      </section>

      {/* ── Pricing highlight ───────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 -mt-8">
        <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-card to-bio-light/20 border-2 border-primary/40 rounded-3xl shadow-2xl p-6 sm:p-8 grid md:grid-cols-[1.2fr_1fr] gap-6 items-center">
          {/* Background Ambient Glow */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-bio/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider bg-error text-white px-3 py-1 rounded-full animate-pulse shadow-sm">
                🔥 SPECIAL PREBOOKING DEAL
              </span>
              <span className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                <Clock size={13} className="text-primary" /> Valid for next 7 weeks
              </span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mb-4">
              Reserve Now & Lock Your Early-Bird Discount!
            </h3>

            <div className="grid sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-card/80 backdrop-blur border border-border/80 shadow-inner">
              {/* Token Fee Box */}
              <div className="flex flex-col justify-between border-b sm:border-b-0 sm:border-r border-border pb-3 sm:pb-0 sm:pr-3">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Pay Now to Reserve</p>
                <div className="flex items-baseline gap-1 my-1">
                  <span className="text-4xl sm:text-5xl font-black text-primary leading-none">Rs {PREBOOK_FEE}</span>
                  <span className="text-xs font-bold text-muted-foreground">/ token</span>
                </div>
                <p className="text-[11px] font-bold text-ma flex items-center gap-1">
                  <Wallet size={12} /> 100% Adjusts toward your final fee!
                </p>
              </div>

              {/* Course Price Box */}
              <div className="flex flex-col justify-between pt-1 sm:pt-0 sm:pl-2">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Final 45-Day Course Price</p>
                <div className="flex items-baseline gap-2 my-1 flex-wrap">
                  <span className="text-3xl sm:text-4xl font-black text-foreground leading-none">Rs {COURSE_PRICE}</span>
                  <span className="text-sm font-bold text-muted-foreground line-through decoration-error/60">Rs {ORIGINAL_PRICE}</span>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-black text-success bg-success-light px-2 py-0.5 rounded-md w-fit">
                  <CheckCircle2 size={11} /> SAVE RS {SAVINGS} INSTANTLY
                </span>
              </div>
            </div>

            {/* Feature Bullets */}
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-foreground">
              <span className="inline-flex items-center gap-1.5 bg-secondary text-primary px-3 py-1.5 rounded-xl border border-primary/20">
                <CheckCircle2 size={13} /> Full App & Live Classes Included
              </span>
              <span className="inline-flex items-center gap-1.5 bg-ma-light text-ma px-3 py-1.5 rounded-xl border border-ma/20">
                <BadgeCheck size={13} /> Guaranteed Seat Reservation
              </span>
            </div>
          </div>

          <div className="relative z-10 flex flex-col items-center justify-center gap-3 bg-card/90 p-5 sm:p-6 rounded-2xl border border-border/80 text-center shadow-lg">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Limited Seats Available</p>
            <div className="text-2xl font-black text-foreground">
              Pay <span className="text-primary underline decoration-primary/40">Rs 300</span> Today
            </div>
            <p className="text-xs text-muted-foreground leading-snug">
              Secure your 45-Day Crash Course at <strong>Rs 2,299</strong> (Save Rs 700 before price increases to Rs 2,999).
            </p>
            <button
              onClick={scrollToReserve}
              disabled={offerEnded}
              className="btn-primary w-full justify-center text-base py-4 font-black shadow-xl hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 mt-1"
            >
              🔥 Reserve My Seat for Rs 300 <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </section>

      {/* ── Course features ─────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-hero-md text-foreground">What makes this the most advanced CEE course in Nepal</h2>
          <p className="text-muted-foreground mt-3">A topper-built system that combines elite teaching with technology no other platform in Nepal offers.</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-5">
          {COURSE_FEATURES.map((f) => (
            <div key={f.title} className="card-base card-hover flex items-start gap-4 p-6">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                <f.icon size={24} className="text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">{f.title}</h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── App features ────────────────────────────────────────── */}
      <section className="bg-muted/40 border-y border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-secondary text-primary px-3 py-1 rounded-full mb-3">
              <Zap size={12} /> INCLUDED FREE WITH YOUR SEAT
            </span>
            <h2 className="text-hero-md text-foreground">Full access to the Samyak app</h2>
            <p className="text-muted-foreground mt-3">Every prebooked student gets the complete platform — the same tools that turn practice into rank.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {APP_FEATURES.map((f) => (
              <div key={f.label} className="flex items-center gap-3 bg-card border border-border rounded-2xl px-4 py-3.5 shadow-xs">
                <span className={`w-9 h-9 rounded-xl ${f.bg} flex items-center justify-center shrink-0`}>
                  <f.icon size={17} className={f.color} />
                </span>
                <span className="text-sm font-medium text-foreground">{f.label}</span>
                <CheckCircle2 size={16} className="text-success ml-auto shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Reserve / booking card ──────────────────────────────── */}
      <section ref={reserveRef} className="max-w-2xl mx-auto px-4 sm:px-6 py-16 scroll-mt-16">
        {step !== 'done' && (
          <div className="text-center mb-8">
            <h2 className="text-hero-md text-foreground">Reserve your seat</h2>
            <p className="text-muted-foreground mt-2">Takes 60 seconds. Pay Rs {PREBOOK_FEE} to lock the Rs {COURSE_PRICE} price.</p>
          </div>
        )}

        <div className="bg-card border border-border rounded-3xl shadow-floating p-6 sm:p-8">
          {/* Step indicator */}
          {step !== 'done' && (
            <div className="flex items-center gap-2 mb-6 text-xs font-semibold">
              <span className={`flex items-center gap-1.5 ${step === 'form' ? 'text-primary' : 'text-success'}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-white ${step === 'form' ? 'bg-primary' : 'bg-success'}`}>
                  {step === 'form' ? '1' : <CheckCircle2 size={13} />}
                </span> Your details
              </span>
              <span className="flex-1 h-px bg-border" />
              <span className={`flex items-center gap-1.5 ${step === 'payment' ? 'text-primary' : 'text-muted-foreground'}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center ${step === 'payment' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>2</span> Payment
              </span>
            </div>
          )}

          {error && (
            <div className="mb-4 bg-error-light border border-error/20 text-error text-sm px-4 py-3 rounded-xl">{error}</div>
          )}

          {/* STEP 1 — details */}
          {step === 'form' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Full name *</label>
                <input value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} placeholder="e.g. Aarav Sharma" className="input-field" />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Mobile number *</label>
                  <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} inputMode="numeric" placeholder="98XXXXXXXX" className="input-field" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">CEE year</label>
                  <select value={form.ceeYear} onChange={(e) => setForm((f) => ({ ...f, ceeYear: e.target.value }))} className="input-field">
                    <option value="2026">CEE 2026</option>
                    <option value="2027">CEE 2027</option>
                    <option value="2028">CEE 2028</option>
                  </select>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Email <span className="font-normal">(optional)</span></label>
                  <input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} type="email" placeholder="you@email.com" className="input-field" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">College <span className="font-normal">(optional)</span></label>
                  <input value={form.college} onChange={(e) => setForm((f) => ({ ...f, college: e.target.value }))} placeholder="Your +2 college" className="input-field" />
                </div>
              </div>
              <button onClick={submitReservation} disabled={submitting || offerEnded} className="btn-primary w-full justify-center text-base py-3.5 mt-2 disabled:opacity-50">
                {submitting ? <><Loader2 size={18} className="animate-spin" /> Reserving…</> : <>Continue to payment <ArrowRight size={18} /></>}
              </button>
              <p className="text-xs text-muted-foreground text-center">By reserving you agree to be contacted on WhatsApp about your booking.</p>
            </div>
          )}

          {/* STEP 2 — Fonepay dynamic QR */}
          {step === 'payment' && (
            <div className="space-y-5">
              <div className="bg-secondary/60 border border-primary/15 rounded-2xl p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Your booking reference</p>
                  <p className="text-lg font-extrabold text-primary tracking-wide">{reference}</p>
                </div>
                <button onClick={() => copy(reference, 'ref')} className="flex items-center gap-1.5 text-xs font-semibold text-primary bg-card border border-border rounded-lg px-3 py-2 hover:bg-muted transition-colors">
                  <Copy size={13} /> {copied === 'ref' ? 'Copied!' : 'Copy'}
                </button>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Smartphone size={22} className="text-primary" />
                </div>
                <p className="font-bold text-foreground">Scan &amp; pay Rs {PREBOOK_FEE} with Fonepay</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Open any mobile-banking or wallet app that supports Fonepay, scan the QR, and your seat is confirmed automatically — no slips, no waiting.
                </p>
              </div>

              {/* QR + live polling */}
              {qrLoading ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3 text-muted-foreground">
                  <Loader2 size={30} className="animate-spin text-primary" />
                  <p className="text-sm font-medium">Generating your Fonepay QR…</p>
                </div>
              ) : qr ? (
                <div className="text-center">
                  <div className="inline-block rounded-2xl border border-border bg-white p-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={qr.qrDataUrl} alt="Fonepay payment QR" width={260} height={260} className="w-[260px] h-[260px]" />
                  </div>
                  <p className="mt-4 text-xl font-extrabold text-foreground">Rs {qr.amount.toLocaleString('en-IN')}</p>
                  <p className="text-xs text-muted-foreground">{qr.label}</p>
                  <div className="mt-3 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Loader2 size={15} className="animate-spin" />
                    Waiting for payment…
                  </div>
                  <button
                    onClick={() => generatePrebookQr(reference, form.phone)}
                    className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                  >
                    <RefreshCw size={13} /> Show a fresh QR
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => generatePrebookQr(reference, form.phone)}
                  className="btn-primary w-full justify-center text-base py-3.5"
                >
                  <Smartphone size={18} /> Generate Fonepay QR
                </button>
              )}

              <a href={whatsappLink} target="_blank" rel="noreferrer" className="flex items-center gap-3 border border-border rounded-2xl px-4 py-3 hover:bg-muted/50 transition-colors">
                <span className="w-9 h-9 rounded-xl bg-success/15 flex items-center justify-center shrink-0">
                  <PhoneCall size={16} className="text-success" />
                </span>
                <div className="flex-1">
                  <p className="text-xs sm:text-sm font-bold text-foreground">Payment not working?</p>
                  <p className="text-[11px] text-muted-foreground">Message us on WhatsApp for instant assistance</p>
                </div>
                <ChevronRight size={16} className="text-muted-foreground" />
              </a>

              <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5">
                <ShieldCheck size={13} /> Verified directly with Fonepay — your seat confirms the moment payment lands.
              </p>
            </div>
          )}

          {/* STEP 3 — congratulations */}
          {step === 'done' && (
            <div className="py-2 space-y-6">
              {/* Celebration header */}
              <div className="relative text-center overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-success/5 to-ma/10 border border-primary/20 p-7">
                <div className="absolute -top-16 -right-10 w-40 h-40 bg-primary/15 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-16 -left-10 w-40 h-40 bg-success/15 rounded-full blur-3xl pointer-events-none" />
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-success/15 border border-success/30 flex items-center justify-center mx-auto mb-4 animate-bounce">
                    <PartyPopper size={38} className="text-success" />
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-foreground">
                    🎉 Congratulations{form.fullName ? `, ${form.fullName.split(' ')[0]}` : ''}!
                  </h3>
                  <p className="text-base font-bold text-primary mt-1">Your seat is booked.</p>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-sm mx-auto">
                    Your Rs {PREBOOK_FEE} is confirmed and your place in the 45-Day CEE Crash Course is locked at{' '}
                    <span className="font-semibold text-foreground">Rs {COURSE_PRICE}</span>.
                  </p>
                </div>
              </div>

              {/* Pro unlocked */}
              <div className="rounded-2xl border border-ma/30 bg-ma-light p-5 flex items-start gap-3">
                <span className="w-10 h-10 rounded-xl bg-ma/15 flex items-center justify-center shrink-0">
                  <Sparkles size={20} className="text-ma" />
                </span>
                <div>
                  <p className="font-extrabold text-foreground">Pro is now unlocked ✨</p>
                  <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
                    You can access <span className="font-semibold text-foreground">all Pro features right now</span> — every premium note, unlimited MCQs, full mock tests, Battle Arena, the AI Tutor and more.
                  </p>
                </div>
              </div>

              {/* Classes coming soon */}
              <div className="rounded-2xl border border-border bg-muted/40 p-5 flex items-start gap-3">
                <span className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Radio size={20} className="text-primary" />
                </span>
                <div>
                  <p className="font-extrabold text-foreground">Live classes — coming soon 🚀</p>
                  <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
                    The crash-course batch starts right after prebooking closes. <span className="font-semibold text-foreground">We&apos;ll inform you very soon</span> with the schedule on WhatsApp and inside the app.
                  </p>
                </div>
              </div>

              {/* Booking reference chip */}
              <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3">
                <div>
                  <p className="text-[11px] text-muted-foreground">Booking reference</p>
                  <p className="font-mono font-bold text-primary tracking-wide">{reference}</p>
                </div>
                <span className="bg-success/15 text-success text-[11px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1">
                  <BadgeCheck size={13} /> PAID &amp; CONFIRMED
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link href="/student-dashboard" className="btn-primary w-full sm:w-auto justify-center gap-2 text-sm py-3 px-6 font-bold">
                  Go to Dashboard <ArrowRight size={16} />
                </Link>
                <Link href="/subjects" className="btn-secondary w-full sm:w-auto justify-center gap-2 text-sm py-3 px-6 font-bold">
                  <BookOpen size={16} /> Start Learning
                </Link>
              </div>
              <p className="text-center text-xs text-muted-foreground">
                Questions? <a href={whatsappLink} target="_blank" rel="noreferrer" className="text-primary font-semibold hover:underline">Message us on WhatsApp</a>.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-20">
        <h2 className="text-hero-md text-foreground text-center mb-8">Questions, answered</h2>
        <div className="space-y-3">
          {FAQS.map((f) => (
            <details key={f.q} className="group card-base">
              <summary className="flex items-center justify-between cursor-pointer list-none font-semibold text-foreground">
                {f.q}
                <ChevronRight size={18} className="text-muted-foreground group-open:rotate-90 transition-transform shrink-0" />
              </summary>
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ── Footer CTA ──────────────────────────────────────────── */}
      <section className="bg-foreground text-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-14 text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold">Seats are limited. The price isn&apos;t coming back.</h2>
          <p className="text-background opacity-70 mt-3 max-w-xl mx-auto">Prebook for Rs {PREBOOK_FEE} today, lock the Rs {COURSE_PRICE} course price, and start using Nepal&apos;s most advanced CEE app right away.</p>
          <button onClick={scrollToReserve} disabled={offerEnded} className="mt-7 inline-flex items-center gap-2 bg-primary text-white font-bold text-base py-3.5 px-8 rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50">
            Prebook now for Rs {PREBOOK_FEE} <ArrowRight size={18} />
          </button>
          <p className="text-background opacity-50 text-xs mt-8">© {new Date().getFullYear()} Samyak CEE Mastery · Nepal&apos;s CEE preparation platform</p>
        </div>
      </section>
    </div>
  );
}
