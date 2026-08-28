'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Mail,
  MailCheck,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  KeyRound,
  UserPlus,
  LogIn,
} from 'lucide-react';
import { toast } from 'sonner';
import AppLogo from '@/components/ui/AppLogo';
import { useAuth } from '@/contexts/AuthContext';
import { Analytics } from '@/lib/analytics/mixpanel';
import PageTransitionWrapper from '@/components/PageTransitionWrapper';
import PasswordStrength from './PasswordStrength';

type Step = 'email' | 'otp';
type AuthMode = 'otp' | 'password';
type PasswordAction = 'signin' | 'signup';

const RESEND_SECONDS = 30;
const OTP_LENGTH = 6;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Maps raw Supabase errors to calm, human copy. */
function friendlyError(err: unknown): string {
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  if (
    msg.includes('provider') ||
    msg.includes('unsupported') ||
    msg.includes('not enabled') ||
    msg.includes('disabled')
  ) {
    return 'Google Sign-In is not enabled in your Supabase Dashboard yet. Enable Google in Supabase > Authentication > Providers, or sign in using Email OTP / Password below.';
  }
  if (msg.includes('expired') || msg.includes('invalid') || msg.includes('token')) {
    return 'That code or password is invalid or expired. Please try again.';
  }
  if (msg.includes('invalid login credentials')) {
    return 'Incorrect email or password. Please check your credentials.';
  }
  if (msg.includes('already registered') || msg.includes('user_already_exists')) {
    return 'An account with this email already exists. Try signing in with OTP or password.';
  }
  if (msg.includes('rate') || msg.includes('too many') || msg.includes('seconds')) {
    return 'Too many attempts. Wait a moment and try again.';
  }
  if (msg.includes('network') || msg.includes('fetch')) {
    return 'Network problem. Check your connection and try again.';
  }
  return err instanceof Error ? err.message : 'Something went wrong. Please try again.';
}

export default function AuthPageClient() {
  const { signInWithEmailOtp, verifyEmailOtp, signIn, signUp, signInWithOAuth } = useAuth();

  const [authMode, setAuthMode] = useState<AuthMode>('otp');
  const [passwordAction, setPasswordAction] = useState<PasswordAction>('signin');
  const [step, setStep] = useState<Step>('email');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);

  const emailInputRef = useRef<HTMLInputElement | null>(null);
  const passwordInputRef = useRef<HTMLInputElement | null>(null);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  const emailValid = EMAIL_RE.test(email.trim());

  useEffect(() => {
    if (step === 'email') {
      emailInputRef.current?.focus();
    }
  }, [step, authMode]);

  // Read error parameters from URL (e.g. redirect back from OAuth error)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    const urlError = urlParams.get('error') || urlParams.get('error_description');
    if (urlError) {
      setError(friendlyError(urlError));
    }
  }, []);

  // Resend countdown timer
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setInterval(() => setResendIn((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => clearInterval(t);
  }, [resendIn]);

  const routeAfterLogin = useCallback(async () => {
    const searchStr = typeof window !== 'undefined' ? window.location.search : '';
    const raw = new URLSearchParams(searchStr).get('redirect');
    const safeRedirect = raw && raw.startsWith('/') && !raw.startsWith('//') ? raw : null;

    let destination = safeRedirect ?? '/student-dashboard';
    try {
      const res = await fetch('/api/profile/me');
      if (res.ok) {
        const me = await res.json();
        if (!me.college || !me.cee_year) {
          destination = safeRedirect
            ? `/onboarding?redirect=${encodeURIComponent(safeRedirect)}`
            : '/onboarding';
        }
      }
    } catch {
      // fall back to default
    }
    window.location.href = destination;
  }, []);

  // Handle Google OAuth with dynamic redirect preservation and account picker
  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      const searchStr = typeof window !== 'undefined' ? window.location.search : '';
      const rawRedirect = new URLSearchParams(searchStr).get('redirect');
      const safeRedirect = rawRedirect && rawRedirect.startsWith('/') && !rawRedirect.startsWith('//') ? rawRedirect : null;

      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const callbackUrl = safeRedirect
        ? `${origin}/auth/callback?next=${encodeURIComponent(safeRedirect)}`
        : `${origin}/auth/callback`;

      Analytics.loggedIn('google-oauth');
      await signInWithOAuth('google', {
        redirectTo: callbackUrl,
        queryParams: {
          prompt: 'select_account',
        },
      });
    } catch (err) {
      setError(friendlyError(err));
      setGoogleLoading(false);
    }
  };

  // Send OTP code
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

  // Verify OTP code
  const verifyCode = useCallback(
    async (code: string) => {
      if (code.length < OTP_LENGTH) {
        setError('Enter the complete 6-digit code');
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

  // Handle Password Submit (SignIn or SignUp)
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailValid) {
      setError('Enter a valid email address');
      return;
    }
    if (!password) {
      setError('Password is required');
      return;
    }
    if (passwordAction === 'signup' && password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (passwordAction === 'signin') {
        await signIn(email.trim(), password);
        Analytics.loggedIn('password');
        toast.success('Signed in! Redirecting…');
        await routeAfterLogin();
      } else {
        await signUp(email.trim(), password);
        Analytics.signedUp('password');
        toast.success('Account created! Redirecting…');
        await routeAfterLogin();
      }
    } catch (err) {
      setError(friendlyError(err));
      setLoading(false);
    }
  };

  // OTP Input event handlers (fixed single-character + paste behavior)
  const handleOtpChange = (index: number, value: string) => {
    setError(null);
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);

    if (digit && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
    if (next.every((d) => d !== '') && next.join('').length === OTP_LENGTH) {
      verifyCode(next.join(''));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        otpRefs.current[index - 1]?.focus();
        const next = [...otp];
        next[index - 1] = '';
        setOtp(next);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = Array(OTP_LENGTH).fill('');
    pasted.split('').forEach((char, i) => {
      next[i] = char;
    });
    setOtp(next);
    const nextFocus = Math.min(pasted.length, OTP_LENGTH - 1);
    otpRefs.current[nextFocus]?.focus();
    if (pasted.length === OTP_LENGTH) {
      verifyCode(pasted);
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
              <div>
                {/* Mode Selector Tabs */}
                <div className="grid grid-cols-2 gap-1 p-1 bg-muted rounded-xl mb-6 text-sm font-semibold">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('otp');
                      setError(null);
                    }}
                    className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                      authMode === 'otp'
                        ? 'bg-card text-foreground shadow-sm font-bold'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <KeyRound size={15} />
                    Code / OTP
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('password');
                      setError(null);
                    }}
                    className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                      authMode === 'password'
                        ? 'bg-card text-foreground shadow-sm font-bold'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Lock size={15} />
                    Password
                  </button>
                </div>

                {/* Advanced Google Sign In Button */}
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 rounded-2xl blur opacity-20 group-hover:opacity-70 transition duration-300 group-hover:duration-200" />
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={googleLoading || loading}
                    className="relative w-full flex items-center justify-between py-3 px-4 rounded-xl border border-border/80 bg-card hover:bg-card/90 text-foreground font-bold text-sm transition-all duration-200 shadow-sm active:scale-[0.98] disabled:opacity-60"
                  >
                    <div className="flex items-center gap-3">
                      {googleLoading ? (
                        <Loader2 size={20} className="animate-spin text-primary shrink-0" />
                      ) : (
                        <div className="w-6 h-6 rounded-lg bg-white flex items-center justify-center p-1 shadow-sm shrink-0">
                          <svg className="w-full h-full" viewBox="0 0 24 24">
                            <path
                              fill="#4285F4"
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                              fill="#34A853"
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                              fill="#FBBC05"
                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                            />
                            <path
                              fill="#EA4335"
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                            />
                          </svg>
                        </div>
                      )}
                      <span className="tracking-tight">
                        {googleLoading ? 'Connecting to Google...' : 'Continue with Google'}
                      </span>
                    </div>

                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                      1-Click
                    </span>
                  </button>
                </div>

                {/* Divider */}
                <div className="relative my-6 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <span className="relative bg-card px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Or continue with email
                  </span>
                </div>

                {authMode === 'otp' ? (
                  /* ── OTP Mode Form ───────────────────────────── */
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      sendCode();
                    }}
                  >
                    <div>
                      <h1 className="text-xl sm:text-2xl font-extrabold text-foreground leading-tight">
                        Sign in with Passcode
                      </h1>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        Enter your email and we&apos;ll send a 6-digit code — no password needed.
                      </p>

                      <div className="mt-5">
                        <label htmlFor="auth-email" className="block text-xs font-bold text-foreground uppercase tracking-wider mb-1.5">
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
                        type="submit"
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
                            Send Code
                            <ArrowRight size={18} />
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                ) : (
                  /* ── Password Mode Form ──────────────────────── */
                  <form onSubmit={handlePasswordSubmit}>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <h1 className="text-xl sm:text-2xl font-extrabold text-foreground leading-tight">
                          {passwordAction === 'signin' ? 'Welcome Back' : 'Create Account'}
                        </h1>
                        <button
                          type="button"
                          onClick={() => {
                            setPasswordAction(passwordAction === 'signin' ? 'signup' : 'signin');
                            setError(null);
                          }}
                          className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                        >
                          {passwordAction === 'signin' ? (
                            <>
                              <UserPlus size={13} />
                              New user? Sign up
                            </>
                          ) : (
                            <>
                              <LogIn size={13} />
                              Existing user? Sign in
                            </>
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground mb-4">
                        {passwordAction === 'signin'
                          ? 'Enter your email and password to log into your account.'
                          : 'Set up your email and password to create a new student account.'}
                      </p>

                      <div className="space-y-4">
                        <div>
                          <label htmlFor="password-email" className="block text-xs font-bold text-foreground uppercase tracking-wider mb-1.5">
                            Email address
                          </label>
                          <div className="relative">
                            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input
                              id="password-email"
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
                              className={`input-field pl-9 ${error ? 'border-error' : ''}`}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label htmlFor="auth-password" className="block text-xs font-bold text-foreground uppercase tracking-wider">
                              Password
                            </label>
                            {passwordAction === 'signin' && (
                              <Link
                                href="/reset-password"
                                className="text-xs font-semibold text-primary hover:underline"
                              >
                                Forgot password?
                              </Link>
                            )}
                          </div>
                          <div className="relative">
                            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input
                              id="auth-password"
                              ref={passwordInputRef}
                              type={showPassword ? 'text' : 'password'}
                              autoComplete={passwordAction === 'signin' ? 'current-password' : 'new-password'}
                              placeholder="••••••••"
                              value={password}
                              onChange={(e) => {
                                setPassword(e.target.value);
                                setError(null);
                              }}
                              className={`input-field pl-9 pr-10 ${error ? 'border-error' : ''}`}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                              aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                          {passwordAction === 'signup' && password && (
                            <PasswordStrength password={password} />
                          )}
                        </div>
                      </div>

                      {error && (
                        <p className="text-xs text-error mt-3 flex items-center gap-1.5">
                          <AlertCircle size={13} className="shrink-0" />
                          {error}
                        </p>
                      )}

                      <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary w-full justify-center py-3 text-base font-bold shadow-md mt-6 disabled:opacity-60"
                      >
                        {loading ? (
                          <>
                            <Loader2 size={18} className="animate-spin" />
                            {passwordAction === 'signin' ? 'Signing in…' : 'Creating account…'}
                          </>
                        ) : (
                          <>
                            {passwordAction === 'signin' ? 'Sign In' : 'Create Account'}
                            <ArrowRight size={18} />
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ) : (
              /* ── Step 2: OTP Verification ──────────────────────── */
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
                      maxLength={1}
                      value={digit}
                      disabled={loading}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      onPaste={handleOtpPaste}
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
                  type="button"
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
                      Verify &amp; Continue
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
                      type="button"
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
            <span className="text-xs font-medium">Secured with end-to-end authentication</span>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-3">
            &copy; 2026 Samyak Online Education Pvt. Ltd.
          </p>
        </div>
      </div>
    </PageTransitionWrapper>
  );
}
