'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { KeyRound, CheckCircle2, AlertCircle, Loader2, MessageCircle, ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import PageTransitionWrapper from '@/components/PageTransitionWrapper';

type ActivationState = 'idle' | 'loading' | 'success' | 'error';

interface ActivationResult {
  success: boolean;
  plan?: string;
  expires_at?: string;
  error?: string;
}

export default function ActivatePlanClient() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [state, setState] = useState<ActivationState>('idle');
  const [result, setResult] = useState<ActivationResult | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setIsAuthenticated(!!data.user);
    });
  }, []);

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setState('loading');
    setResult(null);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc('activate_plan_with_code', {
        p_code: code.trim().toUpperCase(),
      });

      if (error) {
        setState('error');
        setResult({ success: false, error: error.message });
        return;
      }

      const res = data as ActivationResult;
      if (res?.success) {
        setState('success');
        setResult(res);
        setTimeout(() => {
          router.push('/student-dashboard');
        }, 3000);
      } else {
        setState('error');
        setResult(res);
      }
    } catch {
      setState('error');
      setResult({ success: false, error: 'Something went wrong. Please try again.' });
    }
  };

  const planLabel: Record<string, string> = {
    student: 'Student Plan',
    pro: 'Pro Plan',
    institution: 'Institution Plan',
  };

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <PageTransitionWrapper>
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
          <div className="card-base max-w-md w-full text-center p-8">
            <KeyRound size={40} className="text-primary mx-auto mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">Sign in to Activate</h2>
            <p className="text-muted-foreground text-sm mb-6">
              You need to be signed in to activate a plan with your code.
            </p>
            <Link href="/sign-up-login-screen" className="btn-primary w-full justify-center">
              Sign In / Register
            </Link>
          </div>
        </div>
      </PageTransitionWrapper>
    );
  }

  return (
    <PageTransitionWrapper>
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <Link href="/#pricing" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft size={15} />
            Back to Pricing
          </Link>

          <div className="card-base p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <KeyRound size={28} className="text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">Activate Your Plan</h1>
              <p className="text-muted-foreground text-sm mt-2">
                Enter the activation code you received over WhatsApp to unlock your premium plan.
              </p>
            </div>

            {/* Success State */}
            {state === 'success' && result?.success && (
              <div className="bg-success-light border border-success/20 rounded-xl p-5 text-center mb-6">
                <CheckCircle2 size={36} className="text-success mx-auto mb-3" />
                <p className="font-bold text-foreground text-lg">Plan Activated!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Your <strong>{planLabel[result.plan ?? ''] ?? result.plan}</strong> is now active.
                </p>
                {result.expires_at && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Valid until {new Date(result.expires_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-3">Redirecting to dashboard...</p>
              </div>
            )}

            {/* Error State */}
            {state === 'error' && result && (
              <div className="bg-error-light border border-error/20 rounded-xl p-4 flex items-start gap-3 mb-6">
                <AlertCircle size={18} className="text-error shrink-0 mt-0.5" />
                <p className="text-sm text-error">{result.error}</p>
              </div>
            )}

            {/* Form */}
            {state !== 'success' && (
              <form onSubmit={handleActivate} className="space-y-4">
                <div>
                  <label htmlFor="activation-code" className="block text-sm font-medium text-foreground mb-1.5">
                    Activation Code
                  </label>
                  <input
                    id="activation-code"
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="e.g. SAMYAK-XXXX-XXXX"
                    className="input-base w-full font-mono tracking-widest text-center text-lg uppercase"
                    maxLength={24}
                    disabled={state === 'loading'}
                    autoComplete="off"
                    spellCheck={false}
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Codes are case-insensitive. Enter exactly as received.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={state === 'loading' || !code.trim()}
                  className="btn-primary w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {state === 'loading' ? (
                    <>
                      <Loader2 size={16} className="animate-spin mr-2" />
                      Activating...
                    </>
                  ) : (
                    'Activate Plan'
                  )}
                </button>
              </form>
            )}

            {/* WhatsApp CTA */}
            {state !== 'success' && (
              <div className="mt-6 pt-6 border-t border-border text-center">
                <p className="text-sm text-muted-foreground mb-3">
                  Don&apos;t have a code yet?
                </p>
                <a
                  href="https://wa.me/9779800000000?text=Hi!%20I%20want%20to%20get%20an%20activation%20code%20for%20Samyak%20CEE%20Mastery."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary w-full justify-center flex items-center gap-2"
                >
                  <MessageCircle size={16} />
                  Contact us on WhatsApp
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageTransitionWrapper>
  );
}
