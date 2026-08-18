'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, AlertCircle, Loader2, ArrowLeft, ShieldCheck, Smartphone } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import PageTransitionWrapper from '@/components/PageTransitionWrapper';

type Stage = 'idle' | 'generating' | 'awaiting' | 'success' | 'failed';

interface QrResponse {
  prn: string;
  amount: number;
  label: string;
  qrDataUrl: string;
}

// Poll Fonepay for up to ~5 minutes; a dynamic QR expires around then.
const POLL_INTERVAL_MS = 3000;
const MAX_POLL_MS = 5 * 60 * 1000;

export default function FonepayCheckout({ plan }: { plan: string }) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [stage, setStage] = useState<Stage>('idle');
  const [qr, setQr] = useState<QrResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef<number>(0);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setIsAuthenticated(!!data.user));
  }, []);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => stopPolling, [stopPolling]);

  const startPolling = useCallback(
    (prn: string, label: string) => {
      startedAtRef.current = Date.now();
      stopPolling();
      pollRef.current = setInterval(async () => {
        if (Date.now() - startedAtRef.current > MAX_POLL_MS) {
          stopPolling();
          setStage('failed');
          setError('This QR has expired. Please start a new payment.');
          return;
        }
        try {
          const res = await fetch('/api/payments/fonepay/status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prn }),
          });
          const data = await res.json();
          if (data.status === 'completed') {
            stopPolling();
            setStage('success');
            // Hand off to the dedicated confirmation page.
            router.push(`/payment-success?plan=${encodeURIComponent(label)}`);
          } else if (data.status === 'failed') {
            stopPolling();
            setStage('failed');
            setError('The payment did not go through. Please try again.');
          }
        } catch {
          // transient network blip — keep polling
        }
      }, POLL_INTERVAL_MS);
    },
    [router, stopPolling]
  );

  const handleGenerate = async () => {
    setStage('generating');
    setError(null);
    try {
      const res = await fetch('/api/payments/fonepay/qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStage('failed');
        setError(data.error ?? 'Could not generate the QR. Please try again.');
        return;
      }
      setQr(data as QrResponse);
      setStage('awaiting');
      startPolling(data.prn, data.label ?? plan);
    } catch {
      setStage('failed');
      setError('Something went wrong. Please try again.');
    }
  };

  const reset = () => {
    stopPolling();
    setQr(null);
    setError(null);
    setStage('idle');
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
            <ShieldCheck size={40} className="text-primary mx-auto mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">Sign in to Continue</h2>
            <p className="text-muted-foreground text-sm mb-6">
              You need to be signed in to complete your purchase.
            </p>
            <Link
              href={`/sign-up-login-screen?redirect=${encodeURIComponent(`/checkout?plan=${plan}`)}`}
              className="btn-primary w-full justify-center"
            >
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
          <Link
            href="/#pricing"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft size={15} />
            Back to Pricing
          </Link>

          <div className="card-base p-8">
            {/* Success */}
            {stage === 'success' ? (
              <div className="text-center">
                <div className="bg-success-light border border-success/20 rounded-xl p-6 mb-4">
                  <CheckCircle2 size={40} className="text-success mx-auto mb-3" />
                  <p className="font-bold text-foreground text-lg">Payment Successful!</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your plan is now active. Redirecting to your dashboard…
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="text-center mb-6">
                  <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Smartphone size={28} className="text-primary" />
                  </div>
                  <h1 className="text-2xl font-bold text-foreground">Pay with Fonepay</h1>
                  <p className="text-muted-foreground text-sm mt-2">
                    Scan the QR with any mobile-banking or wallet app that supports Fonepay.
                  </p>
                </div>

                {/* Error */}
                {error && (
                  <div className="bg-error-light border border-error/20 rounded-xl p-4 flex items-start gap-3 mb-6">
                    <AlertCircle size={18} className="text-error shrink-0 mt-0.5" />
                    <p className="text-sm text-error">{error}</p>
                  </div>
                )}

                {/* QR + polling */}
                {stage === 'awaiting' && qr ? (
                  <div className="text-center">
                    <div className="inline-block rounded-2xl border border-border bg-white p-4">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={qr.qrDataUrl}
                        alt="Fonepay payment QR"
                        width={280}
                        height={280}
                        className="w-[280px] h-[280px]"
                      />
                    </div>
                    <p className="mt-4 text-lg font-bold text-foreground">Rs. {qr.amount.toLocaleString('en-IN')}</p>
                    <p className="text-xs text-muted-foreground">{qr.label}</p>
                    <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Loader2 size={15} className="animate-spin" />
                      Waiting for payment…
                    </div>
                    <button onClick={reset} className="btn-secondary w-full justify-center mt-6">
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={handleGenerate}
                      disabled={stage === 'generating'}
                      className="btn-primary w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {stage === 'generating' ? (
                        <>
                          <Loader2 size={16} className="animate-spin mr-2" />
                          Generating QR…
                        </>
                      ) : stage === 'failed' ? (
                        'Try Again'
                      ) : (
                        'Generate Fonepay QR'
                      )}
                    </button>
                    <p className="mt-4 text-xs text-muted-foreground text-center flex items-center justify-center gap-1.5">
                      <ShieldCheck size={13} />
                      Payments are verified directly with Fonepay.
                    </p>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </PageTransitionWrapper>
  );
}
