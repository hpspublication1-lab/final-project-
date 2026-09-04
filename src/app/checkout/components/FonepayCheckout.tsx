'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, AlertCircle, Loader2, ArrowLeft, ShieldCheck, Smartphone, Lock, Zap, Clock, CreditCard, MessageCircle, HelpCircle, FileText } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import PageTransitionWrapper from '@/components/PageTransitionWrapper';
import { SUPPORT_CONFIG } from '@/lib/config/support';

type Stage = 'idle' | 'generating' | 'awaiting' | 'success' | 'failed';

interface QrResponse {
  prn: string;
  amount: number;
  label: string;
  qrDataUrl: string;
}

const PLAN_DETAILS: Record<string, { title: string; price: number; validity: string; desc: string }> = {
  'student-monthly': { title: 'Student Monthly Plan', price: 799, validity: '30 Days', desc: 'Monthly CEE Question Bank, Flashcards & Mock Exams' },
  'student-yearly': { title: 'Samyak CEE All-Access Pass', price: 3490, validity: '365 Days (1 Year)', desc: 'Full access to CEE, SEE, IELTS, AI Teacher & Vision Marker' },
  'pro-monthly': { title: 'Pro Monthly Plan', price: 999, validity: '30 Days', desc: 'Full Access + 24/7 AI Agent Doubt Solver' },
  'pro-yearly': { title: 'Pro Yearly Intensive', price: 2490, validity: '365 Days (1 Year)', desc: 'Full Access + 24/7 AI Agent Doubt Solver + Weak-Topic Reports' },
  'crash-course': { title: 'Samyak CEE Crash Course', price: 1490, validity: '365 Days (1 Year)', desc: 'Complete 30-Day Revision Bootcamp & 100 High-Yield Derivations' },
};

// Poll Fonepay for up to ~5 minutes; a dynamic QR expires around then.
const POLL_INTERVAL_MS = 3000;
const MAX_POLL_MS = 5 * 60 * 1000;
const WHATSAPP_NUMBER = SUPPORT_CONFIG.whatsappNumber;

export default function FonepayCheckout({ plan }: { plan: string }) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [stage, setStage] = useState<Stage>('idle');
  const [qr, setQr] = useState<QrResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef<number>(0);

  const selectedPlanInfo = PLAN_DETAILS[plan] || PLAN_DETAILS['student-yearly'];

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
          setError('This payment QR session expired (5 minutes timeout). Generate a new QR code below.');
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
            router.push(`/payment-success?plan=${encodeURIComponent(label)}`);
          } else if (data.status === 'failed') {
            stopPolling();
            setStage('failed');
            setError('The payment did not complete. Please try scanning again or contact support.');
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
      setError('Connection error. Please verify your internet connection and try again.');
    }
  };

  const reset = () => {
    stopPolling();
    setQr(null);
    setError(null);
    setStage('idle');
  };

  const buildWhatsAppSupportUrl = () => {
    const prnStr = qr?.prn ? ` (PRN: ${qr.prn})` : '';
    const msg = `Hi! I need help with my payment on Samyak CEE for *${selectedPlanInfo.title}*${prnStr}. Please guide me.`;
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
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
          <div className="card-base max-w-md w-full text-center p-8 space-y-4">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto text-primary">
              <ShieldCheck size={32} />
            </div>
            <h2 className="text-xl font-extrabold text-foreground">Sign in to Complete Checkout</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Please sign in or create an account so your course activation and receipts are saved to your student profile.
            </p>
            <Link
              href={`/login?redirect=${encodeURIComponent(`/checkout?plan=${plan}`)}`}
              className="btn-primary w-full justify-center py-3 text-sm font-bold shadow-md"
            >
              Sign In / Register to Continue
            </Link>
          </div>
        </div>
      </PageTransitionWrapper>
    );
  }

  return (
    <PageTransitionWrapper>
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-2xl space-y-6">
          <Link
            href="/#pricing"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
          >
            <ArrowLeft size={15} />
            Back to Pricing
          </Link>

          <div className="grid md:grid-cols-12 gap-6 items-start">
            {/* Left: Order Summary & Trust Badges */}
            <div className="md:col-span-5 bg-card border border-border/80 rounded-3xl p-6 space-y-5 shadow-sm">
              <div className="border-b border-border/60 pb-3">
                <span className="text-xs font-black uppercase text-muted-foreground font-mono">ORDER SUMMARY</span>
                <h2 className="text-lg font-black text-foreground mt-1">{selectedPlanInfo.title}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{selectedPlanInfo.desc}</p>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-1">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Clock size={13} className="text-indigo-500" /> Validity Period
                  </span>
                  <span className="font-bold text-foreground">{selectedPlanInfo.validity}</span>
                </div>

                <div className="flex justify-between items-center py-1">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Zap size={13} className="text-amber-500" /> Access Activation
                  </span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">Instant Automatic</span>
                </div>

                <div className="flex justify-between items-center py-1">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <CreditCard size={13} className="text-primary" /> Gateway Network
                  </span>
                  <span className="font-bold text-foreground">Fonepay Dynamic QR</span>
                </div>

                <div className="pt-3 border-t border-border/60 flex justify-between items-center text-base font-black text-foreground">
                  <span>Total Amount</span>
                  <span className="text-primary font-mono">NPR {selectedPlanInfo.price.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Supported Banking Apps Banner */}
              <div className="bg-muted/40 border border-border/60 rounded-2xl p-3.5 space-y-2">
                <p className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
                  <Smartphone size={13} className="text-primary" /> Supported Nepal Payment Apps:
                </p>
                <div className="flex flex-wrap gap-1.5 text-[10px] font-bold text-muted-foreground">
                  <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">eSewa</span>
                  <span className="bg-purple-500/10 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-full border border-purple-500/20">Khalti</span>
                  <span className="bg-red-500/10 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full border border-red-500/20">IME Pay</span>
                  <span className="bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20">50+ Bank Apps</span>
                </div>
              </div>

              {/* Compact Security List */}
              <div className="space-y-1.5 text-[11px] text-muted-foreground pt-1">
                <div className="flex items-center gap-1.5">
                  <Lock size={12} className="text-emerald-500 shrink-0" />
                  <span>256-Bit TLS HTTPS-Encrypted Connection</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck size={12} className="text-primary shrink-0" />
                  <span>Server-Verified Idempotent Payment System</span>
                </div>
              </div>
            </div>

            {/* Right: Payment Action Card */}
            <div className="md:col-span-7 bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-md">
              {stage === 'success' ? (
                <div className="text-center space-y-4 py-4">
                  <div className="w-16 h-16 rounded-full bg-success-light border border-success/20 flex items-center justify-center mx-auto text-success">
                    <CheckCircle2 size={36} />
                  </div>
                  <h3 className="text-xl font-extrabold text-foreground">Payment Confirmed!</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
                    Your enrollment in <strong>{selectedPlanInfo.title}</strong> has been server-verified. Redirecting to confirmation page…
                  </p>
                  <div className="flex items-center justify-center gap-2 text-xs text-primary font-bold">
                    <Loader2 size={15} className="animate-spin" />
                    Opening Dashboard…
                  </div>
                </div>
              ) : (
                <>
                  <div className="text-center mb-6">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-3 text-primary">
                      <Smartphone size={24} />
                    </div>
                    <h1 className="text-xl font-black text-foreground">Pay with Fonepay Dynamic QR</h1>
                    <p className="text-muted-foreground text-xs mt-1 leading-relaxed">
                      Scan the dynamic QR code with any mobile banking app or wallet supporting Fonepay.
                    </p>
                  </div>

                  {/* Error Alert */}
                  {error && (
                    <div className="bg-error-light border border-error/20 rounded-2xl p-4 flex items-start gap-3 mb-5 text-xs text-error">
                      <AlertCircle size={16} className="shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-bold">Payment Status Update</p>
                        <p>{error}</p>
                      </div>
                    </div>
                  )}

                  {/* Awaiting QR Payment */}
                  {stage === 'awaiting' && qr ? (
                    <div className="text-center space-y-4">
                      <div className="inline-block rounded-2xl border-2 border-primary/30 bg-white p-4 shadow-md">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={qr.qrDataUrl}
                          alt="Fonepay payment QR"
                          width={240}
                          height={240}
                          className="w-[240px] h-[240px] mx-auto"
                        />
                      </div>

                      <div>
                        <p className="text-2xl font-black text-foreground font-mono">NPR {qr.amount.toLocaleString('en-IN')}</p>
                        <p className="text-xs text-muted-foreground font-medium">{qr.label} · PRN: {qr.prn}</p>
                      </div>

                      <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 text-xs text-primary font-bold flex items-center justify-center gap-2">
                        <Loader2 size={15} className="animate-spin shrink-0" />
                        <span>Checking Fonepay confirmation... Access activates automatically upon payment.</span>
                      </div>

                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        🔒 Safe &amp; Idempotent: Do not make a duplicate payment while waiting.
                      </p>

                      <div className="flex gap-2 pt-2">
                        <button onClick={reset} className="btn-secondary flex-1 justify-center text-xs py-2.5">
                          Cancel &amp; Reset
                        </button>
                        <a
                          href={buildWhatsAppSupportUrl()}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-primary flex-1 justify-center text-xs py-2.5 gap-1.5 bg-emerald-600 hover:bg-emerald-700 border-none"
                        >
                          <MessageCircle size={14} />
                          Need Help?
                        </a>
                      </div>
                    </div>
                  ) : (
                    /* Initial Generate Action */
                    <div className="space-y-5">
                      <div className="bg-muted/40 border border-border/60 rounded-2xl p-4 space-y-2 text-xs">
                        <p className="font-bold text-foreground">How to Pay:</p>
                        <ol className="list-decimal list-inside space-y-1 text-muted-foreground text-[11px] leading-relaxed">
                          <li>Click <strong>Generate Fonepay QR</strong> below.</li>
                          <li>Open your eSewa, Khalti, IME Pay, or Bank app.</li>
                          <li>Scan the QR code and confirm the exact amount.</li>
                          <li>Course access activates automatically upon verification.</li>
                        </ol>
                      </div>

                      <button
                        onClick={handleGenerate}
                        disabled={stage === 'generating'}
                        className="btn-primary w-full justify-center py-3.5 text-sm font-black shadow-md disabled:opacity-50"
                      >
                        {stage === 'generating' ? (
                          <>
                            <Loader2 size={16} className="animate-spin mr-2" />
                            Generating Fonepay Dynamic QR…
                          </>
                        ) : stage === 'failed' ? (
                          'Generate New Fonepay QR'
                        ) : (
                          'Generate Fonepay QR Code'
                        )}
                      </button>

                      <div className="text-center space-y-1.5 text-[11px] text-muted-foreground">
                        <div className="flex items-center justify-center gap-1.5 font-medium">
                          <ShieldCheck size={13} className="text-emerald-500" />
                          <span>Direct server-side verification with Fonepay.</span>
                        </div>
                        <p className="text-[10px]">
                          By continuing, you agree to Samyak CEE{' '}
                          <Link href="/terms" target="_blank" className="underline hover:text-foreground">Terms</Link>{' '}
                          &amp;{' '}
                          <Link href="/refund-policy" target="_blank" className="underline hover:text-foreground">Refund Policy</Link>.
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageTransitionWrapper>
  );
}
