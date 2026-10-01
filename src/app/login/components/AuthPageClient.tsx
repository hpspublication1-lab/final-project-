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
  User,
  Phone,
} from 'lucide-react';
import { toast } from 'sonner';
import AppLogo from '@/components/ui/AppLogo';
import { useAuth } from '@/contexts/AuthContext';
import { Analytics } from '@/lib/analytics/mixpanel';
import PageTransitionWrapper from '@/components/PageTransitionWrapper';
import PasswordStrength from './PasswordStrength';

type Step = 'email' | 'otp';
type AuthMode = 'password' | 'otp' | 'forgot_password';
type PasswordAction = 'signin' | 'signup';

const RESEND_SECONDS = 30;
const OTP_LENGTH = 6;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Maps raw Supabase errors to calm, human copy. */
function friendlyError(err: unknown): string {
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  if (
    msg.includes('missing oauth secret') ||
    msg.includes('unsupported provider') ||
    msg.includes('provider') ||
    msg.includes('unsupported') ||
    msg.includes('not enabled') ||
    msg.includes('disabled')
  ) {
    return 'Google OAuth is currently updating. Please sign in directly using Email & Password or Instant OTP code below.';
  }
  if (
    msg.includes('authenticationfailed') ||
    msg.includes('sessionexchangeerror') ||
    msg.includes('oauth') ||
    msg.includes('redirect_uri_mismatch') ||
    msg.includes('access_denied')
  ) {
    return 'Google Sign-In session could not be verified. You can log in instantly using Email & Password or Instant OTP Code below.';
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

function getRedirectInfo(searchStr: string) {
  if (typeof window === 'undefined') return { redirectUrl: null, reasonText: null };
  const params = new URLSearchParams(searchStr);
  const raw = params.get('redirect') || params.get('returnUrl') || params.get('redirectTo') || params.get('next');
  const safeRedirect = raw && raw.startsWith('/') && !raw.startsWith('//') ? raw : null;
  const explicitReason = params.get('reason');

  if (explicitReason) {
    return { redirectUrl: safeRedirect, reasonText: explicitReason };
  }

  if (safeRedirect) {
    if (safeRedirect.includes('/checkout')) {
      return { redirectUrl: safeRedirect, reasonText: 'Sign in to complete your course enrollment and activate your batch access.' };
    }
    if (safeRedirect.includes('/mock-tests')) {
      return { redirectUrl: safeRedirect, reasonText: 'Sign in to save your mock exam scores and track your national percentile rank.' };
    }
    if (safeRedirect.includes('/practice')) {
      return { redirectUrl: safeRedirect, reasonText: 'Sign in to save question bookmarks and track your topic accuracy.' };
    }
    if (safeRedirect.includes('/study-plan')) {
      return { redirectUrl: safeRedirect, reasonText: 'Sign in to access your personalized daily study plan and tasks.' };
    }
    if (safeRedirect.includes('/mistake')) {
      return { redirectUrl: safeRedirect, reasonText: 'Sign in to access your personalized mistakes notebook and revision sets.' };
    }
    if (safeRedirect.includes('/batches')) {
      return { redirectUrl: safeRedirect, reasonText: 'Sign in to access your live cohort masterclasses, replays, and notes.' };
    }
    return { redirectUrl: safeRedirect, reasonText: 'Sign in to continue to your learning destination. You will be redirected automatically.' };
  }

  return { redirectUrl: null, reasonText: null };
}

interface AuthPageClientProps {
  initialMode?: 'signin' | 'signup';
}

export default function AuthPageClient({ initialMode = 'signin' }: AuthPageClientProps = {}) {
  const { signInWithEmailOtp, verifyEmailOtp, signIn, signUp, signInWithOAuth, resetPasswordForEmail, user } = useAuth();

  const [authMode, setAuthMode] = useState<AuthMode>('password');
  const [passwordAction, setPasswordAction] = useState<PasswordAction>(initialMode);
  const [step, setStep] = useState<Step>('email');

  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);
  const [redirectInfo, setRedirectInfo] = useState<{ redirectUrl: string | null; reasonText: string | null }>({
    redirectUrl: null,
    reasonText: null,
  });

  const emailInputRef = useRef<HTMLInputElement | null>(null);
  const passwordInputRef = useRef<HTMLInputElement | null>(null);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  const emailValid = EMAIL_RE.test(email.trim());

  // Auto-detect signup / register from URL path or query params & read redirect info
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const path = window.location.pathname.toLowerCase();
    const modeParam = new URLSearchParams(window.location.search).get('mode');

    if (path.includes('/signup') || path.includes('/register') || modeParam === 'signup') {
      setPasswordAction('signup');
    } else if (path.includes('/signin') || path.includes('/login') || modeParam === 'signin') {
      setPasswordAction('signin');
    }

    setRedirectInfo(getRedirectInfo(window.location.search));
  }, []);

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
    const params = new URLSearchParams(searchStr);
    const raw = params.get('redirect') || params.get('returnUrl') || params.get('redirectTo') || params.get('next');
    const safeRedirect = raw && raw.startsWith('/') && !raw.startsWith('//') ? raw : null;

    let destination = safeRedirect ?? '/student-dashboard';
    try {
      const res = await fetch('/api/profile/me');
      if (res.ok) {
        const me = await res.json();
        const emailPrefix = (me?.email || '').split('@')[0];
        const isNewIncomplete = !me?.full_name || me.full_name === emailPrefix || !me?.phone;
        if (isNewIncomplete && !safeRedirect) {
          destination = '/onboarding';
        }
      }
    } catch {
      // fall back to default
    }
    window.location.href = destination;
  }, []);

  // Auto-route to destination if already authenticated
  useEffect(() => {
    if (user?.id) {
      routeAfterLogin();
    }
  }, [user?.id, routeAfterLogin]);

  // Handle Google OAuth with dynamic redirect preservation and account picker
  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      const searchStr = typeof window !== 'undefined' ? window.location.search : '';
      const params = new URLSearchParams(searchStr);
      const rawRedirect = params.get('redirect') || params.get('returnUrl') || params.get('redirectTo') || params.get('next');
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
    if (passwordAction === 'signup' && !fullName.trim()) {
      setError('Full Name is required');
      return;
    }
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
        await signUp(email.trim(), password, {
          fullName: fullName.trim(),
          phone: phone.trim() || undefined,
        });
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
              <span className="font-extrabold text-base text-primary tracking-tight">Samyak Guru</span>
            </div>
            <div className="w-10" aria-hidden />
          </div>

          <div className="card-base p-6 sm:p-8">
            {step === 'email' ? (
              <div>
                {/* Account-Required Action Notice */}
                {redirectInfo.reasonText && (
                  <div className="mb-5 p-3.5 rounded-2xl bg-primary/10 border border-primary/20 flex items-start gap-2.5 animate-fade-in text-xs text-foreground">
                    <ShieldCheck size={16} className="text-primary shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <p className="font-bold text-primary">Account Required</p>
                      <p className="text-muted-foreground leading-relaxed">{redirectInfo.reasonText}</p>
                      {redirectInfo.redirectUrl && (
                        <p className="text-[10px] font-mono text-muted-foreground pt-0.5">
                          Destination: <span className="text-foreground font-semibold">{redirectInfo.redirectUrl}</span>
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="mb-5">
                  <p className="text-xs font-extrabold uppercase tracking-widest text-primary mb-1">Welcome to Samyak Guru</p>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                    Log in or sign up
                  </h1>
                </div>

                {/* Preferred Hero Action: Google Sign In Button */}
                <div className="relative group mb-6">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 rounded-2xl blur opacity-30 group-hover:opacity-85 transition duration-300 group-hover:duration-200" />
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={googleLoading || loading}
                    className="relative w-full flex items-center justify-between py-3.5 px-4 rounded-xl border border-blue-500/30 bg-card hover:bg-card/90 text-foreground font-extrabold text-sm sm:text-base transition-all duration-200 shadow-md active:scale-[0.98] disabled:opacity-60"
                  >
                    <div className="flex items-center gap-3">
                      {googleLoading ? (
                        <Loader2 size={22} className="animate-spin text-primary shrink-0" />
                      ) : (
                        <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center p-1 shadow-sm shrink-0">
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

                    <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                      1-Click
                    </span>
                  </button>
                </div>

                {/* Google Benefits Quick Bar */}
                <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground bg-blue-500/5 dark:bg-blue-500/10 py-2 px-3 rounded-xl border border-blue-500/15">
                  <span className="flex items-center gap-1 text-foreground font-semibold">
                    <span className="text-amber-500">⚡</span> Fast 1-Click
                  </span>
                  <span className="text-border">|</span>
                  <span className="flex items-center gap-1 text-foreground font-semibold">
                    <span className="text-emerald-500">🔒</span> 256-Bit SSL
                  </span>
                  <span className="text-border">|</span>
                  <span className="flex items-center gap-1 text-foreground font-semibold">
                    <span className="text-blue-500">📱</span> Auto-Sync
                  </span>
                </div>

                {/* Divider */}
                <div className="relative my-6 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <span className="relative bg-card px-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Or continue with email
                  </span>
                </div>

                {/* Mode Selector Tabs */}
                <div className="grid grid-cols-2 gap-1 p-1 bg-muted rounded-xl mb-6 text-sm font-semibold">
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
                    Magic Link
                  </button>
                </div>

                {authMode === 'otp' ? (
                  /* ── OTP / Magic Link Mode Form ───────────────────────────── */
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      sendCode();
                    }}
                  >
                    <div>
                      <h1 className="text-xl sm:text-2xl font-extrabold text-foreground leading-tight">
                        Sign in with Magic Link
                      </h1>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        Enter your email and we&apos;ll send a secure link or 6-digit code.
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
                ) : authMode === 'forgot_password' ? (
                  /* ── Forgot Password Form ──────────────────────── */
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!emailValid) {
                        setError('Enter a valid email address');
                        return;
                      }
                      setLoading(true);
                      setError(null);
                      try {
                        await resetPasswordForEmail(email.trim());
                        toast.success('Password reset email sent! Check your inbox.');
                        setAuthMode('password');
                      } catch (err) {
                        setError(friendlyError(err));
                      } finally {
                        setLoading(false);
                      }
                    }}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <h1 className="text-xl sm:text-2xl font-extrabold text-foreground leading-tight">
                          Reset Password
                        </h1>
                        <button
                          type="button"
                          onClick={() => {
                            setAuthMode('password');
                            setError(null);
                          }}
                          className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                        >
                          <ArrowLeft size={14} /> Back to login
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground mb-5 leading-relaxed">
                        Enter your email address and we&apos;ll send you a link to reset your password.
                      </p>

                      <div className="space-y-4">
                        <div>
                          <label htmlFor="reset-email" className="block text-xs font-bold text-foreground uppercase tracking-wider mb-1.5">
                            Email address
                          </label>
                          <div className="relative">
                            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input
                              id="reset-email"
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
                            Sending link…
                          </>
                        ) : (
                          <>
                            Send Reset Link
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
                      {/* Segmented Auth Mode Switcher */}
                      <div className="grid grid-cols-2 p-1 bg-muted/50 border border-border rounded-xl mb-5">
                        <button
                          type="button"
                          onClick={() => {
                            setPasswordAction('signin');
                            setError(null);
                          }}
                          className={`py-2 text-xs font-black rounded-lg transition-all ${
                            passwordAction === 'signin'
                              ? 'bg-card text-primary shadow-sm border border-border/40'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          Sign In
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPasswordAction('signup');
                            setError(null);
                          }}
                          className={`py-2 text-xs font-black rounded-lg transition-all ${
                            passwordAction === 'signup'
                              ? 'bg-primary text-white shadow-sm'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          Create Account
                        </button>
                      </div>

                      <div className="flex items-center justify-between mb-1">
                        <h1 className="text-xl sm:text-2xl font-extrabold text-foreground leading-tight">
                          {passwordAction === 'signin' ? 'Welcome Back' : 'Create Student Account'}
                        </h1>
                      </div>
                      <p className="text-xs text-muted-foreground mb-4">
                        {passwordAction === 'signin'
                          ? 'Enter your email and password to log into your account.'
                          : 'Set up your name, email, and password to create a new Samyak CEE student account.'}
                      </p>

                      <div className="space-y-4">
                        {/* Registration Extra Fields: Full Name & Phone Number */}
                        {passwordAction === 'signup' && (
                          <>
                            <div>
                              <label htmlFor="auth-fullname" className="block text-xs font-bold text-foreground uppercase tracking-wider mb-1.5">
                                Full Name <span className="text-error">*</span>
                              </label>
                              <div className="relative">
                                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <input
                                  id="auth-fullname"
                                  type="text"
                                  autoComplete="name"
                                  placeholder="e.g. Aazam Ali"
                                  value={fullName}
                                  onChange={(e) => {
                                    setFullName(e.target.value);
                                    setError(null);
                                  }}
                                  className={`input-field pl-9 ${error && !fullName.trim() ? 'border-error' : ''}`}
                                />
                              </div>
                            </div>

                            <div>
                              <label htmlFor="auth-phone" className="block text-xs font-bold text-foreground uppercase tracking-wider mb-1.5">
                                Phone / WhatsApp Number <span className="text-[10px] text-muted-foreground font-normal">(Optional for updates)</span>
                              </label>
                              <div className="relative">
                                <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <input
                                  id="auth-phone"
                                  type="tel"
                                  inputMode="tel"
                                  autoComplete="tel"
                                  placeholder="+977 98XXXXXXXX"
                                  value={phone}
                                  onChange={(e) => {
                                    setPhone(e.target.value);
                                    setError(null);
                                  }}
                                  className="input-field pl-9"
                                />
                              </div>
                            </div>
                          </>
                        )}

                        <div>
                          <label htmlFor="password-email" className="block text-xs font-bold text-foreground uppercase tracking-wider mb-1.5">
                            Email address <span className="text-error">*</span>
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
                              Password <span className="text-error">*</span>
                            </label>
                            {passwordAction === 'signin' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setAuthMode('forgot_password');
                                  setError(null);
                                }}
                                className="text-xs font-semibold text-primary hover:underline"
                              >
                                Forgot password?
                              </button>
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
                        className="btn-primary w-full justify-center py-3.5 text-base font-extrabold shadow-md mt-6 disabled:opacity-60"
                      >
                        {loading ? (
                          <>
                            <Loader2 size={18} className="animate-spin" />
                            {passwordAction === 'signin' ? 'Signing in…' : 'Creating account…'}
                          </>
                        ) : (
                          <>
                            {passwordAction === 'signin' ? 'Sign In to Dashboard' : 'Create Free Account'}
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

          {/* Trust & Social Proof Bar */}
          <div className="mt-6 p-4 rounded-2xl bg-card border border-border text-center shadow-sm">
            <div className="flex items-center justify-center gap-1 text-amber-400 mb-1 text-sm font-black">
              ★ ★ ★ ★ ★
            </div>
            <p className="text-xs font-extrabold text-foreground">
              Trusted by 15,000+ CEE &amp; SEE Medical Aspirants
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
              Instant sync with Samyak AI Tutor, Live Mock Tests &amp; Battle Arena
            </p>
          </div>

          {/* Help & FAQ Collapsible Drawer */}
          <details className="mt-4 group text-xs text-muted-foreground">
            <summary className="cursor-pointer font-bold hover:text-foreground text-center flex items-center justify-center gap-1 list-none transition-colors py-1">
              <span>Need help logging in? FAQ &amp; Support</span>
              <span className="group-open:rotate-180 transition-transform">▾</span>
            </summary>
            <div className="mt-3 p-4 rounded-xl bg-card space-y-3 text-left border border-border/80 shadow-sm">
              <div>
                <p className="font-extrabold text-foreground">Google Sign-In:</p>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  Click &ldquo;Continue with Google&rdquo; above for instant 1-click access. No passwords to remember or reset.
                </p>
              </div>
              <div className="border-t border-border/50 pt-2">
                <p className="font-extrabold text-foreground">Email Passcode (OTP):</p>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  Enter your email address to receive a 6-digit verification code. Please check your inbox (and Spam/Junk folder if delayed).
                </p>
              </div>
              <div className="border-t border-border/50 pt-2">
                <p className="font-extrabold text-foreground">Technical Support:</p>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  Reach out at <span className="font-bold text-primary">support@samyakcee.com</span> for 24/7 student account assistance.
                </p>
              </div>
            </div>
          </details>

          {/* Security Footer */}
          <div className="flex items-center justify-center gap-1.5 mt-6 text-muted-foreground">
            <ShieldCheck size={14} className="text-emerald-500" />
            <span className="text-xs font-semibold">256-Bit SSL Encrypted &amp; Supabase Auth Secured</span>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-3">
            &copy; 2026 Samyak Online Education Pvt. Ltd. All rights reserved.
          </p>
        </div>
      </div>
    </PageTransitionWrapper>
  );
}
