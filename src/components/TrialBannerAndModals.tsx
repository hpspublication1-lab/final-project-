'use client';

import React from 'react';
import Link from 'next/link';
import { useTrial } from '@/contexts/TrialContext';
import { Sparkles, Clock, Zap, CheckCircle2, ChevronRight, X, Lock, RefreshCw, Trophy, Star } from 'lucide-react';

export default function TrialBannerAndModals() {
  const [mounted, setMounted] = React.useState(false);
  const {
    isTrialActive,
    formattedTime,
    timeLeftSeconds,
    showWelcomeModal,
    showExpiredModal,
    dismissWelcomeModal,
    dismissExpiredModal,
    resetTrial,
  } = useTrial();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <>
      {/* ── Sticky Top VIP Trial Banner ────────────────────────── */}
      {isTrialActive && (
        <div className="sticky top-0 z-40 bg-gradient-to-r from-primary via-ma to-primary text-white px-3 py-2 shadow-md border-b border-white/20 animate-fade-in">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold">
            {/* Left: Badge & Live Timer */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="inline-flex items-center gap-1 bg-white text-primary text-[11px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wide shadow-xs">
                <Zap size={12} className="fill-primary" /> VIP TRIAL
              </span>
              <div className="flex items-center gap-1 font-mono font-bold bg-black/30 px-2.5 py-0.5 rounded-lg border border-white/20 text-yellow-300">
                <Clock size={13} className="text-yellow-300 animate-pulse" />
                <span>{formattedTime}</span>
              </div>
            </div>

            {/* Middle: Feature Unlocked Description */}
            <p className="hidden md:block text-xs font-medium text-white/95 truncate">
              🎉 <strong>All Plans Unlocked!</strong> Access 1,200+ Notes, 300+ Videos, Live Classes, AI Tutor & Mock Exams.
            </p>

            {/* Right: Prebook CTA */}
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/prebook"
                className="bg-white hover:bg-white/90 text-primary font-black text-xs px-3 py-1 rounded-lg transition-all shadow-xs flex items-center gap-1"
              >
                Prebook (Rs 300) <ChevronRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── First-Time Visitor Welcome Modal ────────────────────── */}
      {showWelcomeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-card border-2 border-primary/40 rounded-3xl shadow-2xl p-6 sm:p-7 text-center overflow-hidden">
            {/* Ambient Background Light */}
            <div className="absolute -top-20 -right-20 w-44 h-44 bg-primary/20 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-44 h-44 bg-ma/20 rounded-full blur-2xl pointer-events-none" />

            <button
              onClick={dismissWelcomeModal}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={20} />
            </button>

            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-primary to-ma text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/30">
              <Sparkles size={32} className="animate-spin-slow" />
            </div>

            <span className="inline-flex items-center gap-1 text-xs font-extrabold bg-primary/10 text-primary px-3 py-1 rounded-full uppercase tracking-wider mb-2">
              🎉 1st Time Visitor Gift
            </span>

            <h3 className="text-2xl font-black text-foreground tracking-tight">
              15-Minute All-Access VIP Trial Activated!
            </h3>

            <p className="text-xs sm:text-sm text-muted-foreground mt-2 leading-relaxed">
              Welcome to Samyak CEE Mastery! For the next <strong>15 minutes</strong>, every single plan and premium feature is <strong>100% UNLOCKED</strong> for you.
            </p>

            {/* Included features list */}
            <div className="grid grid-cols-2 gap-2 text-left my-5 p-3 rounded-2xl bg-muted/50 border border-border text-xs font-semibold text-foreground">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-success shrink-0" /> 1,200+ Sub-Chapter Notes
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-success shrink-0" /> 300+ Video Lectures
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-success shrink-0" /> Live Classes & Q&A
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-success shrink-0" /> AI Tutor Assistant
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-success shrink-0" /> 2-Player Battle Arena
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-success shrink-0" /> Full Mock Exams
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={dismissWelcomeModal}
                className="btn-primary w-full justify-center py-3.5 text-sm font-black shadow-lg shadow-primary/20"
              >
                🚀 Start Exploring Now ({formattedTime})
              </button>
              <p className="text-[11px] text-muted-foreground">
                No credit card required. Timer starts automatically.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Trial Expired Modal ───────────────────────────────── */}
      {showExpiredModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-card border-2 border-primary/50 rounded-3xl shadow-2xl p-6 sm:p-7 text-center overflow-hidden">
            <button
              onClick={dismissExpiredModal}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={20} />
            </button>

            <div className="w-16 h-16 rounded-3xl bg-secondary text-primary flex items-center justify-center mx-auto mb-4 border border-primary/20 shadow-md">
              <Clock size={32} className="text-primary" />
            </div>

            <h3 className="text-2xl font-black text-foreground tracking-tight">
              Your 15-Minute VIP Trial Has Ended ⏰
            </h3>

            <p className="text-xs sm:text-sm text-muted-foreground mt-2 leading-relaxed">
              We hope you enjoyed testing Nepal&apos;s most advanced CEE preparation platform! Prebook your seat for just <strong>Rs 300</strong> to lock full access to the 45-day course and app.
            </p>

            <div className="my-5 p-4 rounded-2xl bg-primary/5 border border-primary/20 text-left">
              <div className="flex items-center justify-between text-xs font-bold mb-1">
                <span className="text-foreground">Prebooking Special Offer</span>
                <span className="text-success bg-success-light px-2 py-0.5 rounded-full">Save Rs 700</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Pay Rs 300 today to reserve. Course fee is <strong>Rs 2,299</strong> (regularly Rs 2,999).
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Link
                href="/prebook"
                onClick={dismissExpiredModal}
                className="btn-primary w-full justify-center py-3.5 text-sm font-black shadow-lg"
              >
                🔥 Prebook My Seat for Rs 300 <ChevronRight size={18} />
              </Link>
              <button
                onClick={resetTrial}
                className="btn-secondary w-full justify-center py-2.5 text-xs font-semibold gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <RefreshCw size={12} /> Restart 15-Min VIP Demo
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
