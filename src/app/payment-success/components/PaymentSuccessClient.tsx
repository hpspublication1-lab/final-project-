'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, ArrowRight, LayoutDashboard, BookOpen, Sparkles, ShieldCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import PageTransitionWrapper from '@/components/PageTransitionWrapper';
import AppLogo from '@/components/ui/AppLogo';

export default function PaymentSuccessClient({ plan }: { plan: string }) {
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [activePlan, setActivePlan] = useState<string | null>(null);

  // Show the freshly-activated plan straight from the profile (source of truth).
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('subscription_plan, subscription_expires_at')
        .eq('id', data.user.id)
        .single();
      if (profile?.subscription_plan) setActivePlan(profile.subscription_plan);
      if (profile?.subscription_expires_at) setExpiresAt(profile.subscription_expires_at);
    });
  }, []);

  const prettyExpiry = expiresAt
    ? new Date(expiresAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  return (
    <PageTransitionWrapper>
      <div className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-center gap-2 mb-8">
            <AppLogo size={28} />
            <span className="font-extrabold text-base text-primary tracking-tight">Samyak CEE</span>
          </div>

          <div className="card-base p-8 text-center">
            {/* Success mark */}
            <div className="w-20 h-20 rounded-full bg-success-light border border-success/20 flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 size={40} className="text-success" />
            </div>

            <h1 className="text-2xl font-extrabold text-foreground">Payment Successful!</h1>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              Your payment is confirmed and your plan is now active. You have full access to everything it unlocks.
            </p>

            {/* Plan summary */}
            <div className="mt-6 rounded-xl border border-border bg-muted/40 p-4 text-left space-y-2.5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-medium text-muted-foreground">Plan</span>
                <span className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  <Sparkles size={14} className="text-primary" />
                  {plan ? decodeURIComponent(plan) : activePlan ? `${activePlan[0].toUpperCase()}${activePlan.slice(1)} Plan` : 'Premium Plan'}
                </span>
              </div>
              {prettyExpiry && (
                <div className="flex items-center justify-between gap-3 border-t border-border pt-2.5">
                  <span className="text-xs font-medium text-muted-foreground">Active until</span>
                  <span className="text-sm font-semibold text-foreground">{prettyExpiry}</span>
                </div>
              )}
              <div className="flex items-center justify-between gap-3 border-t border-border pt-2.5">
                <span className="text-xs font-medium text-muted-foreground">Paid with</span>
                <span className="text-sm font-semibold text-foreground">Fonepay</span>
              </div>
            </div>

            {/* CTAs */}
            <div className="mt-6 flex flex-col gap-2.5">
              <Link href="/student-dashboard" className="btn-primary w-full justify-center py-3 text-base font-bold shadow-md">
                <LayoutDashboard size={18} />
                Go to Dashboard
                <ArrowRight size={16} />
              </Link>
              <Link href="/subjects" className="btn-secondary w-full justify-center py-2.5 text-sm">
                <BookOpen size={16} />
                Start Learning
              </Link>
            </div>

            <p className="mt-5 text-xs text-muted-foreground flex items-center justify-center gap-1.5">
              <ShieldCheck size={13} />
              A receipt is saved under Account → Billing History.
            </p>
          </div>
        </div>
      </div>
    </PageTransitionWrapper>
  );
}
