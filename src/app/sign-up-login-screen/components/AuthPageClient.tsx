'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Mail, MailCheck, Loader2, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import AppLogo from '@/components/ui/AppLogo';
import { useAuth } from '@/contexts/AuthContext';
import { Analytics } from '@/lib/analytics/mixpanel';
import PageTransitionWrapper from '@/components/PageTransitionWrapper';

type Step = 'email' | 'otp';

const RESEND_SECONDS = 30;
const OTP_LENGTH = 6;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Maps raw Supabase errors to calm, human copy. */
function friendlyError(err: unknown): string {
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  if (msg.includes('expired') || msg.includes('invalid') || msg.includes('token')) {
    return 'That code is invalid or expired. Request a new one.';
  }
  if (msg.includes('rate') || msg.includes('too many') || msg.includes('seconds')) {
    return 'Too many attempts. Wait a moment and try again.';
  }
  if (msg.includes('network') || msg.includes('fetch')) {
    return 'Network problem. Check your connection and try again.';
  }
  return 'Something went wrong. Please try again.';
}

export default function AuthPageClient() {
  const { signInWithEmailOtp, verifyEmailOtp } = useAuth();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);

  const emailInputRef = useRef<HTMLInputElement | null>(null);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  const emailValid = EMAIL_RE.test(email.trim());

  useEffect(() => {
    if (step === 'email') emailInputRef.current?.focus();
  }, [step]);

  // Resend countdown timer.
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setInterval(() => setResendIn((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => clearInterval(t);
  }, [resendIn]);

  const sendCode = useCallback(async () => {
    if (!emailValid) {
      setError('Enter a valid email address');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await signInWithEmailOtp(email.trim());
      setStep('otp');
      setOtp(Array(OTP_LENGTH).fill(''));
      setResendIn(RESEND_SECONDS);
      setTimeout(() => otpRefs.current[0]?.focus(), 50);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }, [email, emailValid, signInWithEmailOtp]);

  const routeAfterLogin = useCallback(async () => {
    // Honour a safe ?redirect= target (e.g. back to /checkout) — same-origin
    // paths only, to avoid open-redirects. Falls back to the dashboard.
    const searchStr = typeof window !== 'undefined' ? window.location.search : '';
    const raw = new URLSearchParams(searchStr).get('redirect');
    const safeRedirect = raw && raw.startsWith('/') && !raw.startsWith('//') ? raw : null;

    // Everyone — including the super admin — lands on the user dashboard after
    // login. The admin panel is NEVER an auto-destination; it's reachable only
    // via its secret URL (see middleware / ADMIN_ACCESS_KEY).
    let destination = safeRedirect ?? '/student-dashboard';
    try {
      const res = await fetch('/api/profile/me');
      if (res.ok) {
        const me = await res.json();
        if (!me.college || !me.cee_year) {
          // New user → collect study details once, then continue to the target.
          destination = safeRedirect
            ? `/onboarding?redirect=${encodeURIComponent(safeRedirect)}`
            : '/onboarding';
        }
      }
    } catch {
      // fall back to the default destination
    }
    window.location.href = destination;
  }, []);

  const verifyCode = useCallback(
    async (code: string) => {
      if (code.length < OTP_LENGTH) {
        setError('Enter the 6-digit code');
        return;
      }
      setLoading(true);
      setError(null);
      try {
        await verifyEmailOtp(email.trim(), code);
        Analytics.loggedIn('email-otp');
        toast.success('Verified! Redirecting…');
        await routeAfterLogin();
      } catch (err) {
        setError(friendlyError(err));
        setOtp(Array(OTP_LENGTH).fill(''));
        setTimeout(() => otpRefs.current[0]?.focus(), 50);
        setLoading(false);
      }
    },
    [email, verifyEmailOtp, routeAfterLogin]
  );

  const handleOtpChange = (index: number, value: string) => {
    setError(null);
    // Handle a pasted full code landing in one box.
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, OTP_LENGTH).split('');
      const next = Array(OTP_LENGTH).fill('');
      digits.forEach((d, i) => (next[i] = d));
      setOtp(next);
      const filled = Math.min(digits.length, OTP_LENGTH - 1);
      otpRefs.current[filled]?.focus();
      if (digits.length === OTP_LENGTH) verifyCode(next.join(''));
      return;
    }
    const digit = value.replace(/\D/g, '');
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
    if (digit && index === OTP_LENGTH - 1) {
      verifyCode(next.join(''));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const changeEmail = () => {
    setStep('email');
    setError(null);
    setOtp(Array(OTP_LENGTH).fill(''));
  };

  return (
    <PageTransitionWrapper>
      <div className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          {/* Brand bar */}
          <div className="flex items-center mb-8">
            {step === 'otp' ? (
              <button
                onClick={changeEmail}
                aria-label="Change email"
                className="w-10 h-10 flex items-center justify-center rounded-xl border border-border bg-card text-foreground hover:bg-muted transition-colors"
              >
                <ArrowLeft size={18} />
              </button>
            ) : (
              <Link
                href="/"
                aria-label="Back to home"
                className="w-10 h-10 flex items-center justify-center rounded-xl border border-border bg-card text-foreground hover:bg-muted transition-colors"
              >
                <ArrowLeft size={18} />
              </Link>
            )}
            <div className="flex-1 flex items-center justify-center gap-2">
              <AppLogo size={30} />
              <span className="font-extrabold text-base text-primary tracking-tight">Samyak CEE</span>
            </div>
            <div className="w-10" aria-hidden />
          </div>

          <div className="card-base p-6 sm:p-8">
            {step === 'email' ? (
              /* ── Step 1: email ─────────────────────────────── */
              <div>
                <p className="text-xs font-extrabold uppercase tracking-widest text-ma mb-2">Welcome</p>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground leading-tight">
                  Log in or sign up
                </h1>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  Enter your email and we&apos;ll send a 6-digit code — no password to remember.
                </p>

                <div className="mt-7">
                  <label htmlFor="auth-email" className="block text-sm font-semibold text-foreground mb-1.5">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      id="auth-email"
                      ref={emailInputRef}
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError(null);
                      }}
                      onKeyDown={(e) => e.key === 'Enter' && sendCode()}
                      className={`input-field pl-9 ${error ? 'border-error focus:border-error' : ''}`}
                    />
                  </div>
                  {error && (
                    <p className="text-xs text-error mt-1.5 flex items-center gap-1.5">
                      <AlertCircle size={13} className="shrink-0" />
                      {error}
                    </p>
                  )}
                </div>

                <button
                  onClick={sendCode}
                  disabled={loading}
                  className="btn-primary w-full justify-center py-3 text-base font-bold shadow-md mt-6 disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Sending code…
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </div>
            ) : (
              /* ── Step 2: OTP ───────────────────────────────── */
              <div>
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
                  <MailCheck size={26} className="text-primary" />
                </div>
                <h1 className="text-2xl font-extrabold text-foreground">Enter the code</h1>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  We sent a 6-digit code to{' '}
                  <span className="font-bold text-foreground break-all">{email.trim()}</span>
                </p>

                <div className="mt-7 flex justify-between gap-2">
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => {
                        otpRefs.current[i] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      autoComplete={i === 0 ? 'one-time-code' : 'off'}
                      maxLength={OTP_LENGTH}
                      value={digit}
                      disabled={loading}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      className={`w-full h-14 text-center text-xl font-extrabold rounded-xl border bg-muted text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 ${
                        digit ? 'border-primary/40 bg-primary/5' : 'border-border'
                      } disabled:opacity-60`}
                    />
                  ))}
                </div>

                {error && (
                  <p className="text-xs text-error mt-3 flex items-center gap-1.5">
                    <AlertCircle size={13} className="shrink-0" />
                    {error}
                  </p>
                )}

                <button
                  onClick={() => verifyCode(otp.join(''))}
                  disabled={loading}
                  className="btn-primary w-full justify-center py-3 text-base font-bold shadow-md mt-6 disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Verifying…
                    </>
                  ) : (
                    <>
                      Verify &amp; continue
                      <CheckCircle2 size={18} />
                    </>
                  )}
                </button>

                <div className="text-center mt-5">
                  {resendIn > 0 ? (
                    <p className="text-sm text-muted-foreground font-medium">
                      Resend code in {resendIn}s
                    </p>
                  ) : (
                    <button
                      onClick={sendCode}
                      disabled={loading}
                      className="text-sm font-bold text-primary hover:underline disabled:opacity-60"
                    >
                      Resend code
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-center gap-1.5 mt-6 text-muted-foreground">
            <ShieldCheck size={14} />
            <span className="text-xs font-medium">Secured with a one-time code</span>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-3">
            &copy; 2026 Samyak Online Education Pvt. Ltd.
          </p>
        </div>
      </div>
    </PageTransitionWrapper>
  );
}
