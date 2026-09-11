'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Lock, Sparkles, Rocket, ShieldCheck, Loader2, ArrowRight, CheckCircle2, LogIn } from 'lucide-react';
import PageTransitionWrapper from '@/components/PageTransitionWrapper';
import AppLogo from '@/components/ui/AppLogo';

import { useProgram, normalizeCourseId } from '@/contexts/ProgramContext';

type Status = 'loading' | 'allowed' | 'guest' | 'locked';

const PAID_PLANS = ['student', 'pro', 'institution'];

const CEE_PERKS = [
  'Real-time 1v1 Battle Arena',
  'Full-length 200-mark mock tests + analysis',
  'SamyakGURU AI Tutor & Mistake Analyser',
  '15,000+ Topic-wise High Yield MCQs',
  'All 1,200+ premium notes & flashcards',
];

const SEE_PERKS = [
  'Full NEB Class 10 Model Question Bank',
  'AI Handwritten Subjective Answer Evaluator',
  'Full 10-Year Solved Past Board Exam Papers',
  'All Chapter Revision Notes & Formula Guides',
  'Daily Live Classes & Board Prediction Drills',
];

/**
 * Gates a premium feature. Free/guest users see a paywall; users on an active
 * paid plan (or prebookers, who are granted Pro) see the feature.
 */
export default function PremiumGate({
  feature = 'This feature',
  program: programProp,
  children,
}: {
  feature?: string;
  program?: string;
  children: React.ReactNode;
}) {
  const [status, setStatus] = useState<Status>('loading');
  const { program: contextProgram } = useProgram();
  const canonicalId = normalizeCourseId(programProp || contextProgram);
  const isSee = canonicalId === 'see_class_10';

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch('/api/profile/me');
        if (res.status === 401) {
          if (active) setStatus('guest');
          return;
        }
        const me = await res.json();
        const exp = me.subscription_expires_at;
        const planActive = !exp || new Date(exp) > new Date();
        const paid = PAID_PLANS.includes(me.subscription_plan);
        if (active) setStatus(me.is_admin || (paid && planActive) ? 'allowed' : 'locked');
      } catch {
        if (active) setStatus('locked');
      }
    })();
    return () => { active = false; };
  }, []);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (status === 'allowed') return <>{children}</>;

  const currentPath = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/';
  const isGuest = status === 'guest';
  const perks = isSee ? SEE_PERKS : CEE_PERKS;
  const brandName = isSee ? 'Samyak SEE' : 'Samyak CEE';
  const upgradeHref = isSee ? '/checkout?plan=see-class-10-board-topper-batch' : '/checkout?plan=pro-monthly';
  const freePracticeHref = isSee ? '/see/question-bank' : '/practice';

  return (
    <PageTransitionWrapper>
      <div className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-center gap-2 mb-8">
            <AppLogo size={28} />
            <span className="font-extrabold text-base text-primary tracking-tight">{brandName}</span>
          </div>

          <div className="card-base p-7 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
              <Lock size={30} className="text-primary" />
            </div>

            <h1 className="text-2xl font-extrabold text-foreground">
              {feature} is a Pro feature
            </h1>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              {isGuest
                ? `Sign in and unlock full ${brandName} access with any active plan.`
                : `Unlock ${feature} and every premium tool with the ${brandName} Pro plan.`}
            </p>

            {/* What you unlock */}
            <ul className="mt-6 space-y-2 text-left">
              {perks.map((p) => (
                <li key={p} className="flex items-center gap-2.5 text-sm text-foreground">
                  <CheckCircle2 size={16} className="text-success shrink-0" />
                  {p}
                </li>
              ))}
            </ul>

            {/* CTAs */}
            <div className="mt-7 flex flex-col gap-2.5">
              {isGuest ? (
                <Link
                  href={`/login?redirect=${encodeURIComponent(currentPath)}`}
                  className="btn-primary w-full justify-center py-3 text-base font-bold shadow-md"
                >
                  <LogIn size={18} /> Sign In to Continue
                </Link>
              ) : (
                <>
                  <Link href={upgradeHref} className="btn-primary w-full justify-center py-3 text-base font-bold shadow-md">
                    <Sparkles size={18} /> Upgrade to Pro
                    <ArrowRight size={16} />
                  </Link>
                  {!isSee && (
                    <Link href="/prebook" className="btn-secondary w-full justify-center py-2.5 text-sm font-bold">
                      <Rocket size={16} /> Prebook the Crash Course (Rs 300)
                    </Link>
                  )}
                </>
              )}
              <Link href={freePracticeHref} className="text-xs text-muted-foreground hover:text-primary transition-colors mt-1">
                Continue with free practice →
              </Link>
            </div>

            <p className="mt-5 text-xs text-muted-foreground flex items-center justify-center gap-1.5">
              <ShieldCheck size={13} /> Instant access the moment your payment is confirmed.
            </p>
          </div>
        </div>
      </div>
    </PageTransitionWrapper>
  );
}
