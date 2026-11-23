'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Mail,
  MailCheck,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  Smartphone,
  ExternalLink,
  Copy,
} from 'lucide-react';
import { toast } from 'sonner';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import AppLogo from '@/components/ui/AppLogo';
import { useAuth } from '@/contexts/AuthContext';
import { Analytics } from '@/lib/analytics/mixpanel';
import { SUPPORT_CONFIG } from '@/lib/config/support';
import { toE164Nepal, maskNepalPhone } from '@/lib/auth/nepalPhone';
import PageTransitionWrapper from '@/components/PageTransitionWrapper';
import PasswordStrength from './PasswordStrength';
import SampleQuestion from './SampleQuestion';

/*
 * One screen for every way in: Google, a texted code (Aakash SMS via the
 * Supabase Send SMS hook), email + password, or an emailed code.
 *
 * Phone sign-in only appears when NEXT_PUBLIC_PHONE_LOGIN=on, so production
 * keeps working until the Supabase phone provider and SMS hook are set up.
 */
const PHONE_LOGIN_ENABLED = process.env.NEXT_PUBLIC_PHONE_LOGIN === 'on';

type View = 'start' | 'signup' | 'forgot' | 'forgot_sent' | 'code';
type Method = 'phone' | 'email';
type CodeTarget = { kind: 'phone'; e164: string } | { kind: 'email'; email: string };

const OTP_LENGTH = 6;
const RESEND_SECONDS = 60; // Supabase allows one new code per minute per address.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Turns Supabase, server and URL error codes into one plain sentence that says
 * what happened and what to do. Matches on specific phrases only — the old
 * version mapped anything containing "provider" or "disabled" to a Google
 * message, so unrelated failures blamed Google.
 */
function friendlyError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err ?? '');
  const m = raw.toLowerCase();

  // Codes the /auth/callback route puts in ?error=
  if (m === 'oauth_browser_switched')
    return 'That sign-in finished in a different browser from the one it started in. Please try again here.';
  if (m === 'oauth_code_expired') return 'That sign-in link has expired or was already used. Please try again.';
  if (m === 'oauth_exchange_failed' || m === 'authenticationfailed' || m === 'sessionexchangeerror')
    return 'Sign-in didn’t finish. Please try again, or use another way in below.';
  if (m.includes('access_denied') || m.includes('user denied')) return 'Google sign-in was cancelled.';
  if (m === 'rate_limited') return 'Too many attempts. Wait a minute and try again.';

  // Messages written for people already — pass them through.
  if (m.includes('temporarily locked') || m.includes('failed attempts')) return raw;
  if (m.includes('only nepali mobile numbers') || m.includes('could not send the code by sms')) return raw;
  if (m.includes('uppercase') || m.includes('lowercase') || m.includes('one number') || m.includes('too common'))
    return raw;
  if (m.includes('for security purposes, you can only request this after')) return raw;

  if (m.includes('invalid login credentials') || m.includes('invalid email or password'))
    return 'That email and password don’t match. Try again, or reset your password.';
  if (m.includes('email not confirmed'))
    return 'Confirm your email first — we sent you a link when you signed up. Or sign in with an emailed code.';
  if (m.includes('token has expired') || m.includes('otp_expired') || m.includes('invalid otp') || m.includes('token is invalid'))
    return 'That code is wrong or has expired. Check it, or send a new one.';
  if (m.includes('already registered') || m.includes('user_already_exists') || m.includes('already exists'))
    return 'There’s already an account with this email. Sign in instead.';
  if (m.includes('phone') && (m.includes('disabled') || m.includes('unsupported') || m.includes('provider')))
    return 'Phone sign-in isn’t switched on yet. Use Google or email for now.';
  if (m.includes('signups not allowed'))
    return 'New accounts can’t be created this way right now. Try Google, or create an account with email.';
  if (m.includes('suspended') || m.includes('banned'))
    return 'This account has been suspended. Contact support if you think that’s a mistake.';
  if (m.includes('rate limit') || m.includes('too many')) return 'Too many attempts. Wait a minute and try again.';
  if (m.includes('failed to fetch') || m.includes('network')) return 'Can’t reach the server. Check your connection and try again.';
  return 'Something went wrong. Please try again.';
}

type LastMethod = 'google' | 'phone' | 'email';
const LAST_METHOD_KEY = 'samyak_last_sign_in';

/** Which way this browser signed in last time, so returning students land on it. */
function readLastMethod(): LastMethod | null {
  try {
    const v = localStorage.getItem(LAST_METHOD_KEY);
    return v === 'google' || v === 'phone' || v === 'email' ? v : null;
  } catch {
    return null;
  }
}

function rememberMethod(m: LastMethod) {
  try {
    localStorage.setItem(LAST_METHOD_KEY, m);
  } catch {
    // Private mode or storage blocked: nothing to remember.
  }
}

/**
 * "9812345678", "+977 981-234-5678", "09812345678" → "981 234 5678" while typing.
 * No Nepali mobile starts with 977, 00977 or 0, so those prefixes are dropped as
 * soon as they appear — the field already shows +977.
 */
function formatNepalInput(raw: string): string {
  let d = raw.replace(/\D/g, '');
  if (d.startsWith('00977')) d = d.slice(5);
  else if (d.startsWith('977')) d = d.slice(3);
  d = d.replace(/^0+/, '').slice(0, 10);
  return [d.slice(0, 3), d.slice(3, 6), d.slice(6)].filter(Boolean).join(' ');
}

function LastUsed() {
  return (
    // Below 360px wide it shrinks to a dot; the text stays for screen readers.
    <span
      title="Last used"
      className="whitespace-nowrap rounded-full bg-[rgba(var(--primary-rgb),0.12)] px-2 py-0.5 text-[11px] font-semibold text-primary max-[359px]:h-2 max-[359px]:w-2 max-[359px]:overflow-hidden max-[359px]:bg-primary max-[359px]:p-0 max-[359px]:text-[0px]"
    >
      Last used
    </span>
  );
}

/** Google refuses OAuth inside embedded app browsers ("disallowed_useragent"). */
function detectInAppBrowser(ua: string): string | null {
  if (/FBAN|FBAV|FB_IAB|FB4A/i.test(ua)) return /Messenger/i.test(ua) ? 'Messenger' : 'Facebook';
  if (/Instagram/i.test(ua)) return 'Instagram';
  if (/musical_ly|TikTok|BytedanceWebview/i.test(ua)) return 'TikTok';
  if (/Viber/i.test(ua)) return 'Viber';
  if (/Snapchat/i.test(ua)) return 'Snapchat';
  if (/\bLine\//i.test(ua)) return 'LINE';
  if (/Android/.test(ua) && /; wv\)/.test(ua)) return 'this app';
  return null;
}

function readRedirectParams() {
  if (typeof window === 'undefined') return { next: null as string | null, reason: null as string | null };
  const params = new URLSearchParams(window.location.search);
  const raw = params.get('redirect') || params.get('returnUrl') || params.get('redirectTo') || params.get('next');
  const next = raw && raw.startsWith('/') && !raw.startsWith('//') ? raw : null;
  let reason = params.get('reason');
  if (!reason && next) {
    if (next.includes('/checkout')) reason = 'Sign in to finish enrolling.';
    else if (next.includes('/mock-tests')) reason = 'Sign in to save your mock test scores.';
    else if (next.includes('/practice')) reason = 'Sign in to save bookmarks and track your accuracy.';
    else if (next.includes('/batches')) reason = 'Sign in to join your live classes.';
    else reason = 'Sign in to continue. We’ll bring you straight back.';
  }
  return { next, reason };
}

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 shrink-0">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
    </svg>
  );
}

function FieldError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="mt-3 flex items-start gap-2 rounded-lg bg-error-light px-3 py-2 text-sm text-[#B42318] dark:text-[#FDA29B]">
      <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </p>
  );
}

function Spinner({ label }: { label: string }) {
  return (
    <>
      <Loader2 size={18} className="animate-spin" aria-hidden="true" />
      {label}
    </>
  );
}

interface AuthPageClientProps {
  initialMode?: 'signin' | 'signup';
  isAdminPortal?: boolean;
}

export default function AuthPageClient({ initialMode = 'signin', isAdminPortal = false }: AuthPageClientProps = {}) {
  const {
    signInWithEmailOtp,
    verifyEmailOtp,
    signInWithPhone,
    verifyPhoneOtp,
    signOut,
    signInWithOAuth,
    resetPasswordForEmail,
    user,
  } = useAuth();

  const phoneAllowed = PHONE_LOGIN_ENABLED && !isAdminPortal;

  const [view, setView] = useState<View>(initialMode === 'signup' && !isAdminPortal ? 'signup' : 'start');
  const [method, setMethod] = useState<Method>(phoneAllowed ? 'phone' : 'email');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [phoneInput, setPhoneInput] = useState('');

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [codeTarget, setCodeTarget] = useState<CodeTarget | null>(null);
  const [resendIn, setResendIn] = useState(0);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [reason, setReason] = useState<string | null>(null);
  const [inAppBrowser, setInAppBrowser] = useState<string | null>(null);
  const [showInAppHelp, setShowInAppHelp] = useState(false);
  const [platform, setPlatform] = useState<'android' | 'ios' | 'other'>('other');
  const [lastMethod, setLastMethod] = useState<LastMethod | null>(null);
  const [capsLock, setCapsLock] = useState(false);

  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);
  const firstFieldRef = useRef<HTMLInputElement | null>(null);

  const emailValid = EMAIL_RE.test(email.trim());

  // Read ?mode, ?error, ?redirect and the browser we're in.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const path = window.location.pathname.toLowerCase();
    const mode = params.get('mode');
    if (mode === 'forgot' || mode === 'reset') setView('forgot');
    else if (!isAdminPortal && (mode === 'signup' || path.includes('/signup') || path.includes('/register'))) setView('signup');

    const urlError = params.get('error') || params.get('error_description');
    if (urlError) setGoogleError(friendlyError(urlError));

    setReason(isAdminPortal ? null : readRedirectParams().reason);

    const ua = navigator.userAgent || '';
    setInAppBrowser(detectInAppBrowser(ua));
    setPlatform(/Android/i.test(ua) ? 'android' : /iPhone|iPad|iPod/i.test(ua) ? 'ios' : 'other');

    const last = readLastMethod();
    setLastMethod(last);
    if (last === 'email') setMethod('email');
  }, [isAdminPortal]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setInterval(() => setResendIn((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => clearInterval(t);
  }, [resendIn]);

  // Runs after the 180 ms view transition, once the new step's fields exist.
  useEffect(() => {
    const t = setTimeout(() => {
      if (view === 'code') otpRefs.current[0]?.focus();
      else firstFieldRef.current?.focus();
    }, 240);
    return () => clearTimeout(t);
  }, [view, method]);

  const go = (next: View) => {
    setError(null);
    setGoogleError(null);
    setView(next);
  };

  // ── After any successful sign-in ──────────────────────────────────────────
  const routeAfterLogin = useCallback(async () => {
    const { next } = readRedirectParams();
    let destination = next ?? (isAdminPortal ? '/admin' : '/student-dashboard');
    try {
      const res = await fetch('/api/profile/me');
      if (res.ok) {
        const me = await res.json();
        const role = String(me?.role || me?.role_name || '').toLowerCase();
        const isFullAdmin = Boolean(me?.is_admin || me?.is_super_admin || role === 'admin' || role === 'super_admin');
        const isTeacher = role === 'teacher';
        const isStaff = ['support_staff', 'support_agent', 'content_manager', 'content_reviewer', 'payment_staff'].includes(role);

        if (isFullAdmin && (isAdminPortal || !next)) {
          destination = next && next.startsWith('/admin') ? next : '/admin';
        } else if (!next) {
          if (isTeacher) destination = '/teacher';
          else if (isStaff) destination = '/staff';
        }

        const localDone = typeof window !== 'undefined' && localStorage.getItem('samyak_onboarding_completed') === 'true';
        if (!(me?.onboarding_completed || localDone || isFullAdmin || isTeacher || isStaff)) {
          destination = next ? `/onboarding?redirect=${encodeURIComponent(next)}` : '/onboarding';
        }
      }
    } catch {
      // Fall through to the default destination.
    }
    window.location.href = destination;
  }, [isAdminPortal]);

  // ── Google ────────────────────────────────────────────────────────────────
  const handleGoogle = async () => {
    setError(null);
    setGoogleError(null);
    if (inAppBrowser) {
      setShowInAppHelp(true);
      return;
    }
    setGoogleLoading(true);
    try {
      const { next } = readRedirectParams();
      const origin = window.location.origin;
      const callbackUrl = next ? `${origin}/auth/callback?next=${encodeURIComponent(next)}` : `${origin}/auth/callback`;
      Analytics.loggedIn('google-oauth');
      rememberMethod('google');
      await signInWithOAuth('google', { redirectTo: callbackUrl, queryParams: { prompt: 'select_account' } });
      // The browser is now on its way to Google; leave the spinner running.
    } catch (err) {
      setGoogleError(friendlyError(err));
      setGoogleLoading(false);
    }
  };

  const openInBrowserUrl =
    typeof window !== 'undefined'
      ? `intent://${window.location.host}${window.location.pathname}${window.location.search}#Intent;scheme=https;package=com.android.chrome;end`
      : '#';

  const copyPageLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied. Paste it into Chrome or Safari.');
    } catch {
      toast.error('Couldn’t copy. Long-press the address bar to copy it instead.');
    }
  };

  // ── Codes (phone or email) ──────────────────────────────────────────────────
  const sendCode = async (target: CodeTarget) => {
    setLoading(true);
    setError(null);
    setGoogleError(null);
    try {
      if (target.kind === 'phone') await signInWithPhone(target.e164);
      else await signInWithEmailOtp(target.email);
      setCodeTarget(target);
      setOtp(Array(OTP_LENGTH).fill(''));
      setResendIn(RESEND_SECONDS);
      setView('code');
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const e164 = toE164Nepal(phoneInput);
    if (!e164) {
      setError('Enter a 10-digit Nepali mobile number, like 98XXXXXXXX.');
      return;
    }
    void sendCode({ kind: 'phone', e164 });
  };

  const handleEmailCode = () => {
    if (!emailValid) {
      setError('Enter your email address first, then we’ll send the code there.');
      firstFieldRef.current?.focus();
      return;
    }
    void sendCode({ kind: 'email', email: email.trim() });
  };

  const verifyCode = useCallback(
    async (code: string) => {
      if (!codeTarget) return;
      if (code.length < OTP_LENGTH) {
        setError('Enter all 6 digits of the code.');
        return;
      }
      setLoading(true);
      setError(null);
      try {
        if (codeTarget.kind === 'phone') {
          await verifyPhoneOtp(codeTarget.e164, code);
          Analytics.loggedIn('phone-otp');
          rememberMethod('phone');
        } else {
          await verifyEmailOtp(codeTarget.email, code);
          Analytics.loggedIn('email-otp');
          rememberMethod('email');
        }
        toast.success('You’re in. Taking you there…');
        await routeAfterLogin();
      } catch (err) {
        setError(friendlyError(err));
        setOtp(Array(OTP_LENGTH).fill(''));
        setTimeout(() => otpRefs.current[0]?.focus(), 50);
        setLoading(false);
      }
    },
    [codeTarget, verifyPhoneOtp, verifyEmailOtp, routeAfterLogin]
  );

  // Chrome on Android can read the texted code (the SMS ends "@samyakcee.com #123456").
  useEffect(() => {
    if (view !== 'code' || codeTarget?.kind !== 'phone') return;
    if (typeof window === 'undefined' || !('OTPCredential' in window)) return;
    const ac = new AbortController();
    (navigator.credentials as any)
      .get({ otp: { transport: ['sms'] }, signal: ac.signal })
      .then((cred: { code?: string } | null) => {
        const code = (cred?.code || '').replace(/\D/g, '').slice(0, OTP_LENGTH);
        if (code.length === OTP_LENGTH) {
          setOtp(code.split(''));
          void verifyCode(code);
        }
      })
      .catch(() => undefined);
    return () => ac.abort();
  }, [view, codeTarget, verifyCode]);

  const handleOtpChange = (index: number, value: string) => {
    setError(null);
    const digits = value.replace(/\D/g, '');
    if (digits.length > 1) {
      // Autofill or paste into one box: spread it across the boxes.
      const next = Array(OTP_LENGTH).fill('');
      digits.slice(0, OTP_LENGTH).split('').forEach((d, i) => (next[i] = d));
      setOtp(next);
      otpRefs.current[Math.min(digits.length, OTP_LENGTH - 1)]?.focus();
      if (digits.length >= OTP_LENGTH) void verifyCode(next.join(''));
      return;
    }
    const next = [...otp];
    next[index] = digits;
    setOtp(next);
    if (digits && index < OTP_LENGTH - 1) otpRefs.current[index + 1]?.focus();
    if (next.every((d) => d !== '')) void verifyCode(next.join(''));
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const next = [...otp];
      next[index - 1] = '';
      setOtp(next);
      otpRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) otpRefs.current[index - 1]?.focus();
    else if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    handleOtpChange(0, e.clipboardData.getData('text'));
  };

  // ── Email + password ──────────────────────────────────────────────────────
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailValid) return setError('Enter a valid email address.');
    if (!password) return setError('Enter your password.');
    setLoading(true);
    setError(null);
    try {
      if (user?.id && user.email?.toLowerCase() !== email.trim().toLowerCase()) {
        await signOut().catch(() => null);
      }
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Invalid login credentials');
      // The route set the session cookie on its response; every path below
      // leaves with a full navigation, so the next page reads it from there.
      Analytics.loggedIn('password');
      rememberMethod('email');

      const { next } = readRedirectParams();
      const role = String(data.role || '').toLowerCase();
      if (data.isSuperAdmin || role === 'admin' || role === 'super_admin') {
        window.location.href = next && next.startsWith('/admin') ? next : '/admin';
        return;
      }
      if (role === 'teacher' && !next) {
        window.location.href = '/teacher';
        return;
      }
      if (data.onboardingCompleted) {
        window.location.href = next ?? '/student-dashboard';
        return;
      }
      await routeAfterLogin();
    } catch (err) {
      setError(friendlyError(err));
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return setError('Enter your full name.');
    if (!emailValid) return setError('Enter a valid email address.');
    if (password.length < 8) return setError('Use at least 8 characters for your password.');
    if (signupPhone.trim() && !toE164Nepal(signupPhone)) return setError('That mobile number doesn’t look right. Leave it blank if you prefer.');
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
          fullName: fullName.trim(),
          phone: toE164Nepal(signupPhone) || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not create account');
      Analytics.signedUp('password');
      toast.success('Account created.');
      window.location.href = '/onboarding';
    } catch (err) {
      setError(friendlyError(err));
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailValid) return setError('Enter the email address you signed up with.');
    setLoading(true);
    setError(null);
    try {
      await resetPasswordForEmail(email.trim());
      setView('forgot_sent');
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  // ── Pieces ────────────────────────────────────────────────────────────────
  const labelCls = 'mb-1.5 block text-sm font-semibold text-foreground';
  const linkCls = 'font-semibold text-primary underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none';

  const emailField = (id: string, autoFocus = true) => (
    <div>
      <label htmlFor={id} className={labelCls}>
        Email
      </label>
      <input
        id={id}
        ref={autoFocus ? firstFieldRef : undefined}
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          setError(null);
        }}
        className="input-field text-base"
      />
    </div>
  );

  const passwordField = (id: string, mode: 'current' | 'new') => (
    <div className="relative">
      <input
        id={id}
        type={showPassword ? 'text' : 'password'}
        autoComplete={mode === 'current' ? 'current-password' : 'new-password'}
        value={password}
        onChange={(e) => {
          setPassword(e.target.value);
          setError(null);
        }}
        onKeyUp={(e) => setCapsLock(e.getModifierState?.('CapsLock') ?? false)}
        onKeyDown={(e) => setCapsLock(e.getModifierState?.('CapsLock') ?? false)}
        onBlur={() => setCapsLock(false)}
        aria-describedby={capsLock ? `${id}-caps` : undefined}
        className="input-field pr-11 text-base"
      />
      <button
        type="button"
        onClick={() => setShowPassword((v) => !v)}
        aria-label={showPassword ? 'Hide password' : 'Show password'}
        aria-pressed={showPassword}
        className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-2 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--primary-rgb),0.4)]"
      >
        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
      {capsLock && (
        <p id={`${id}-caps`} className="mt-1.5 text-sm font-medium text-[#B54708] dark:text-[#FEC84B]">
          Caps Lock is on.
        </p>
      )}
    </div>
  );

  const backTo = (label: string, to: View) => (
    <button type="button" onClick={() => go(to)} className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground">
      <ArrowLeft size={16} aria-hidden="true" />
      {label}
    </button>
  );

  // ── Views ─────────────────────────────────────────────────────────────────
  const renderStart = () => (
    <>
      <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
        {isAdminPortal ? 'Staff sign in' : 'Sign in to Samyak Guru'}
      </h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        {isAdminPortal ? (
          <>
            For teachers and staff. Students, please use the{' '}
            <Link href="/login" className={linkCls}>
              student sign-in
            </Link>
            .
          </>
        ) : (
          phoneAllowed
            ? 'New here? Google and phone codes create your account automatically.'
            : 'New here? Continue with Google and your account is created automatically.'
        )}
      </p>

      {reason && <p className="mt-4 rounded-lg bg-[rgba(var(--primary-rgb),0.1)] px-3 py-2 text-sm text-foreground">{reason}</p>}

      {user?.email && (
        <div className="mt-4 rounded-lg border border-border bg-muted px-3 py-3 text-sm">
          <p className="text-foreground">
            You’re signed in as <span className="font-semibold break-all">{user.email}</span>.
          </p>
          <div className="mt-2.5 flex gap-2">
            <button type="button" onClick={() => routeAfterLogin()} className="btn-primary flex-1 py-2 text-sm">
              Continue
            </button>
            <button
              type="button"
              onClick={async () => {
                await signOut();
                toast.success('Signed out.');
              }}
              className="btn-secondary flex-1 py-2 text-sm"
            >
              Sign out
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={handleGoogle}
        disabled={googleLoading || loading}
        className="mt-6 flex h-12 w-full items-center justify-center gap-3 rounded-[10px] border border-border bg-white text-[15px] font-semibold text-[#1f1f1f] shadow-sm transition-colors hover:bg-[#f7f8f8] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[rgba(var(--primary-rgb),0.3)] disabled:opacity-60 dark:border-white/15"
      >
        {googleLoading ? <Spinner label="Opening Google…" /> : (
          <>
            <GoogleMark />
            Continue with Google
            {lastMethod === 'google' && <LastUsed />}
          </>
        )}
      </button>
      <FieldError message={googleError} />

      {inAppBrowser && (showInAppHelp || platform !== 'other') && (
        <div role="note" className="mt-3 rounded-lg border border-border bg-warning-light px-3 py-3 text-sm text-foreground">
          <p className="font-semibold">Google sign-in doesn’t work inside {inAppBrowser}.</p>
          <p className="mt-1 text-muted-foreground">
            {platform === 'ios'
              ? 'Tap the ••• or share button and choose “Open in Safari”, or sign in another way below.'
              : 'Open this page in Chrome, or sign in another way below.'}
          </p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {platform === 'android' && (
              <a href={openInBrowserUrl} className="btn-secondary px-3 py-1.5 text-sm">
                <ExternalLink size={15} aria-hidden="true" /> Open in Chrome
              </a>
            )}
            <button type="button" onClick={copyPageLink} className="btn-secondary px-3 py-1.5 text-sm">
              <Copy size={15} aria-hidden="true" /> Copy link
            </button>
          </div>
        </div>
      )}

      <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground" aria-hidden="true">
        <span className="h-px flex-1 bg-border" />
        or
        <span className="h-px flex-1 bg-border" />
      </div>

      {phoneAllowed && (
        <div role="tablist" aria-label="Sign in with" className="mb-5 grid grid-cols-2 gap-1 rounded-[10px] bg-muted p-1 text-sm font-semibold">
          {(['phone', 'email'] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={method === m}
              onClick={() => {
                setMethod(m);
                setError(null);
              }}
              className={`relative flex items-center justify-center gap-2 rounded-lg py-2 transition-colors ${
                method === m ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {method === m && (
                <motion.span
                  layoutId="sign-in-method"
                  className="absolute inset-0 rounded-lg bg-card shadow-sm"
                  transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                />
              )}
              <span className="relative flex items-center gap-2">
                <span className={lastMethod === m ? 'max-[399px]:hidden' : ''}>
                  {m === 'phone' ? <Smartphone size={16} aria-hidden="true" /> : <Mail size={16} aria-hidden="true" />}
                </span>
                {m === 'phone' ? 'Phone' : 'Email'}
                {lastMethod === m && <LastUsed />}
              </span>
            </button>
          ))}
        </div>
      )}

      {phoneAllowed && method === 'phone' ? (
        <form onSubmit={handlePhoneSubmit} noValidate>
          <label htmlFor="login-phone" className={labelCls}>
            Mobile number
          </label>
          <div className="flex rounded-[10px] border-[1.5px] border-border bg-input transition-colors focus-within:border-primary focus-within:bg-card focus-within:shadow-[0_0_0_3px_rgba(var(--primary-rgb),0.14)]">
            <span className="flex items-center border-r border-border px-3 text-base font-semibold text-muted-foreground">+977</span>
            <input
              id="login-phone"
              ref={firstFieldRef}
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              placeholder="98X XXX XXXX"
              value={phoneInput}
              onChange={(e) => {
                setPhoneInput(formatNepalInput(e.target.value));
                setError(null);
              }}
              className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-base text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
          <p className="mt-1.5 text-sm text-muted-foreground">We’ll text you a 6-digit code.</p>
          <FieldError message={error} />
          <button type="submit" disabled={loading} className="btn-primary mt-5 h-12 w-full text-base">
            {loading ? <Spinner label="Sending code…" /> : 'Send code'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleSignIn} noValidate>
          <div className="space-y-4">
            {emailField('login-email')}
            <div>
              <div className="mb-1.5 flex items-baseline justify-between">
                <label htmlFor="login-password" className="text-sm font-semibold text-foreground">
                  Password
                </label>
                <button type="button" onClick={() => go('forgot')} className={`text-sm ${linkCls}`}>
                  Forgot password?
                </button>
              </div>
              {passwordField('login-password', 'current')}
            </div>
          </div>
          <FieldError message={error} />
          <button type="submit" disabled={loading} className="btn-primary mt-5 h-12 w-full text-base">
            {loading ? <Spinner label="Signing in…" /> : 'Sign in'}
          </button>
          {!isAdminPortal && (
            <button type="button" onClick={handleEmailCode} disabled={loading} className={`mt-3 w-full text-center text-sm ${linkCls}`}>
              Email me a sign-in code instead
            </button>
          )}
        </form>
      )}

      {!isAdminPortal && (
        <p className="mt-6 border-t border-border pt-5 text-center text-sm text-muted-foreground">
          New to Samyak Guru?{' '}
          <button type="button" onClick={() => go('signup')} className={linkCls}>
            Create an account
          </button>
        </p>
      )}
    </>
  );

  const renderSignup = () => (
    <>
      {backTo('Back to sign in', 'start')}
      <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Create your account</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">Free practice and diagnostics. No payment needed to start.</p>
      <form onSubmit={handleSignUp} noValidate className="mt-6 space-y-4">
        <div>
          <label htmlFor="signup-name" className={labelCls}>
            Full name
          </label>
          <input
            id="signup-name"
            ref={firstFieldRef}
            type="text"
            autoComplete="name"
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              setError(null);
            }}
            className="input-field text-base"
          />
        </div>
        {emailField('signup-email', false)}
        <div>
          <label htmlFor="signup-password" className={labelCls}>
            Password
          </label>
          {passwordField('signup-password', 'new')}
          {password && <PasswordStrength password={password} />}
        </div>
        <div>
          <label htmlFor="signup-phone" className={labelCls}>
            Mobile number <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <input
            id="signup-phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            placeholder="98XXXXXXXX"
            value={signupPhone}
            onChange={(e) => {
              setSignupPhone(e.target.value);
              setError(null);
            }}
            className="input-field text-base"
          />
          <p className="mt-1.5 text-sm text-muted-foreground">For class reminders and results.</p>
        </div>
        <FieldError message={error} />
        <button type="submit" disabled={loading} className="btn-primary h-12 w-full text-base">
          {loading ? <Spinner label="Creating account…" /> : 'Create account'}
        </button>
        <p className="text-center text-xs leading-relaxed text-muted-foreground">
          By creating an account you agree to the{' '}
          <Link href="/terms" className={linkCls}>
            Terms
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className={linkCls}>
            Privacy Policy
          </Link>
          .
        </p>
      </form>
    </>
  );

  const renderForgot = () => (
    <>
      {backTo('Back to sign in', 'start')}
      <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Reset your password</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Enter the email you signed up with. We’ll send a link to set a new password.
      </p>
      <form onSubmit={handleForgot} noValidate className="mt-6">
        {emailField('forgot-email')}
        <FieldError message={error} />
        <button type="submit" disabled={loading} className="btn-primary mt-5 h-12 w-full text-base">
          {loading ? <Spinner label="Sending link…" /> : 'Send reset link'}
        </button>
      </form>
      {phoneAllowed && (
        <p className="mt-5 text-sm text-muted-foreground">
          Signed up with your phone? You don’t have a password —{' '}
          <button
            type="button"
            onClick={() => {
              setMethod('phone');
              go('start');
            }}
            className={linkCls}
          >
            sign in with a code
          </button>
          .
        </p>
      )}
    </>
  );

  const renderForgotSent = () => (
    <>
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[rgba(var(--primary-rgb),0.1)] text-primary">
        <MailCheck size={24} aria-hidden="true" />
      </div>
      <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Check your email</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        If there’s an account for <span className="font-semibold text-foreground break-all">{email.trim()}</span>, a
        link to reset your password is on its way. It can take a minute — check spam too.
      </p>
      <div className="mt-6 flex flex-col gap-2">
        <button type="button" onClick={() => go('start')} className="btn-primary h-12 w-full text-base">
          Back to sign in
        </button>
        <button type="button" onClick={() => go('forgot')} className="btn-secondary h-11 w-full text-sm">
          Use a different email
        </button>
      </div>
    </>
  );

  const renderCode = () => {
    const shownTo =
      codeTarget?.kind === 'phone' ? `+977 ${maskNepalPhone(codeTarget.e164)}` : codeTarget?.kind === 'email' ? codeTarget.email : '';
    return (
      <>
        {backTo(codeTarget?.kind === 'phone' ? 'Use a different number' : 'Use a different email', 'start')}
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Enter your code</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          We sent a 6-digit code to <span className="font-semibold text-foreground break-all">{shownTo}</span>.
        </p>
        <div className="mt-6 flex justify-between gap-2" role="group" aria-label="6-digit code">
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={(el) => {
                otpRefs.current[i] = el;
              }}
              type="text"
              inputMode="numeric"
              autoComplete={i === 0 ? 'one-time-code' : 'off'}
              aria-label={`Digit ${i + 1}`}
              maxLength={i === 0 ? OTP_LENGTH : 1}
              value={digit}
              disabled={loading}
              onChange={(e) => handleOtpChange(i, e.target.value)}
              onKeyDown={(e) => handleOtpKeyDown(i, e)}
              onPaste={handleOtpPaste}
              className={`h-14 w-full min-w-0 rounded-[10px] border-[1.5px] bg-input text-center text-xl font-bold text-foreground outline-none transition-colors focus:border-primary focus:bg-card focus:shadow-[0_0_0_3px_rgba(var(--primary-rgb),0.14)] disabled:opacity-60 ${
                digit ? 'border-[rgba(var(--primary-rgb),0.5)]' : 'border-border'
              }`}
            />
          ))}
        </div>
        <FieldError message={error} />
        <button type="button" onClick={() => verifyCode(otp.join(''))} disabled={loading} className="btn-primary mt-5 h-12 w-full text-base">
          {loading ? <Spinner label="Checking…" /> : 'Verify and continue'}
        </button>
        <p className="mt-5 text-center text-sm text-muted-foreground" aria-live="polite">
          {resendIn > 0 ? (
            <>Didn’t get it? You can ask for a new code in {resendIn}s.</>
          ) : (
            <>
              Didn’t get it?{' '}
              <button type="button" onClick={() => codeTarget && sendCode(codeTarget)} disabled={loading} className={linkCls}>
                Send a new code
              </button>
            </>
          )}
        </p>
        {codeTarget?.kind === 'phone' && resendIn === 0 && (
          <p className="mt-2 text-center text-sm text-muted-foreground">
            SMS not arriving?{' '}
            <button
              type="button"
              onClick={() => {
                setMethod('email');
                go('start');
              }}
              className={linkCls}
            >
              Sign in with email instead
            </button>
          </p>
        )}
      </>
    );
  };

  const brandLink = (light: boolean) => (
    <Link
      href="/"
      aria-label="Samyak Guru home"
      className="flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--primary-rgb),0.4)]"
    >
      <AppLogo size={32} onDark={light} />
      <span className={`text-lg font-extrabold tracking-tight ${light ? 'text-white' : 'text-foreground'}`}>Samyak Guru</span>
    </Link>
  );

  return (
    <PageTransitionWrapper>
      <MotionConfig reducedMotion="user">
        <main className="min-h-screen bg-background lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:bg-card">
          {/* Desktop: what Samyak is, shown rather than told. */}
          {!isAdminPortal && (
            <aside className="hidden flex-col justify-between bg-[#3B2DB8] px-10 py-10 text-white lg:flex xl:px-16 dark:bg-[#1A1452]">
              {brandLink(true)}
              <div className="mx-auto w-full max-w-[440px]">
                <p className="mb-4 text-[15px] font-semibold text-white/85">Try today’s question</p>
                <SampleQuestion />
                <p className="mt-5 text-[15px] leading-relaxed text-white/80">
                  Sign in to save your answers and pick up where you left off.
                </p>
              </div>
              <p className="text-sm text-white/70">Practice questions, mock tests and live classes for CEE, SEE and IELTS.</p>
            </aside>
          )}

          <section
            className={`flex justify-center px-4 py-8 sm:items-center sm:py-12 lg:px-10 ${
              isAdminPortal ? 'lg:col-span-2 lg:bg-background' : ''
            }`}
          >
            <div className="w-full max-w-[420px]">
              <div className={`mb-6 flex justify-center ${isAdminPortal ? '' : 'lg:hidden'}`}>{brandLink(false)}</div>

              <div
                className={`card-base p-6 sm:p-8 ${
                  isAdminPortal ? '' : 'lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none'
                }`}
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={view}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {view === 'start' && renderStart()}
                    {view === 'signup' && renderSignup()}
                    {view === 'forgot' && renderForgot()}
                    {view === 'forgot_sent' && renderForgotSent()}
                    {view === 'code' && renderCode()}
                  </motion.div>
                </AnimatePresence>
              </div>

              <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground">
                By continuing you agree to our{' '}
                <Link href="/terms" className="underline underline-offset-2 hover:text-foreground">
                  Terms
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="underline underline-offset-2 hover:text-foreground">
                  Privacy Policy
                </Link>
                .
                <br />
                Trouble signing in?{' '}
                <a
                  href={SUPPORT_CONFIG.whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:text-foreground"
                >
                  Message us on WhatsApp
                </a>{' '}
                or email{' '}
                <a href={`mailto:${SUPPORT_CONFIG.email}`} className="underline underline-offset-2 hover:text-foreground">
                  {SUPPORT_CONFIG.email}
                </a>
                .
              </p>
            </div>
          </section>
        </main>
      </MotionConfig>
    </PageTransitionWrapper>
  );
}
