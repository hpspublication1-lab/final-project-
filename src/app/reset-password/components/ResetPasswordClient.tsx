'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { Lock, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, ArrowLeft, KeyRound } from 'lucide-react';
import PageTransitionWrapper from '@/components/PageTransitionWrapper';
import AppLogo from '@/components/ui/AppLogo';
import PasswordStrength from '@/app/login/components/PasswordStrength';
import { toast } from 'sonner';

export default function ResetPasswordClient() {
  const { updatePassword, user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [verifyingLink, setVerifyingLink] = useState(true);
  const [sessionValid, setSessionValid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const supabase = createClient();

    async function verifyRecoverySession() {
      try {
        if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search);
          const urlError = params.get('error_description') || params.get('error');
          if (urlError) {
            if (active) {
              setError('This password reset link is invalid or has expired. Please request a new reset link.');
              setSessionValid(false);
              setVerifyingLink(false);
            }
            return;
          }

          const code = params.get('code');
          const tokenHash = params.get('token_hash');
          const type = (params.get('type') || 'recovery') as any;

          if (code) {
            const { error: codeErr } = await supabase.auth.exchangeCodeForSession(code);
            if (!codeErr && active) {
              window.history.replaceState({}, document.title, window.location.pathname);
              setSessionValid(true);
              setVerifyingLink(false);
              return;
            }
          }

          if (tokenHash) {
            const { error: hashErr } = await supabase.auth.verifyOtp({
              token_hash: tokenHash,
              type,
            });
            if (!hashErr && active) {
              window.history.replaceState({}, document.title, window.location.pathname);
              setSessionValid(true);
              setVerifyingLink(false);
              return;
            }
          }
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (active) {
          setSessionValid(!!session?.user);
          setVerifyingLink(false);
        }
      } catch {
        if (active) {
          setSessionValid(false);
          setVerifyingLink(false);
        }
      }
    }

    verifyRecoverySession();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (user?.id) {
      setSessionValid(true);
    }
  }, [user?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await updatePassword(password);
      toast.success('Password updated successfully! Redirecting to your dashboard…');
      router.push('/student-dashboard');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.toLowerCase().includes('session') || msg.toLowerCase().includes('expired')) {
        setError('Your recovery session has expired. Please request a new password reset link.');
        setSessionValid(false);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  if (verifyingLink || authLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Loader2 size={32} className="animate-spin text-primary mb-3" />
        <p className="text-sm font-semibold text-muted-foreground">Verifying your password recovery link…</p>
      </div>
    );
  }

  return (
    <PageTransitionWrapper>
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden relative">
        <div className="w-full max-w-[420px] mb-6 flex items-center justify-between">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={15} />
            Back to Sign In
          </Link>
          <div className="flex items-center gap-2">
            <AppLogo size={26} />
            <span className="font-extrabold text-sm text-primary">Samyak Guru</span>
          </div>
        </div>

        <div className="w-full max-w-[420px] bg-card rounded-[2rem] shadow-2xl shadow-blue-500/5 border border-border overflow-hidden relative z-10">
          <div className="p-8 sm:p-10">
            {!sessionValid ? (
              <div className="text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
                  <KeyRound size={24} />
                </div>
                <h1 className="text-xl font-extrabold text-foreground">
                  Recovery Link Expired or Invalid
                </h1>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {error || 'For your security, password recovery links expire after a short window or single use. Request a fresh link or sign in with a 6-digit email code.'}
                </p>
                <div className="pt-2 space-y-2.5">
                  <Link
                    href="/login?mode=forgot"
                    className="btn-primary w-full justify-center py-3 text-sm font-bold flex items-center gap-2"
                  >
                    Request New Reset Link
                  </Link>
                  <Link
                    href="/login"
                    className="w-full py-2.5 px-4 rounded-xl border border-border bg-muted/50 hover:bg-muted text-xs font-bold text-foreground flex items-center justify-center transition-colors"
                  >
                    Sign In with Email OTP Instead
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-extrabold text-foreground leading-tight mb-2">
                  Set New Password
                </h1>
                <p className="text-sm text-muted-foreground mb-6">
                  Enter a strong new password (minimum 8 characters) for your Samyak Guru account.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="new-password" className="block text-xs font-bold text-foreground uppercase tracking-wider mb-1.5">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        id="new-password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        placeholder="Minimum 8 characters"
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
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {password && <PasswordStrength password={password} />}
                  </div>

                  <div>
                    <label htmlFor="confirm-password" className="block text-xs font-bold text-foreground uppercase tracking-wider mb-1.5">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        id="confirm-password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        placeholder="Re-enter new password"
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          setError(null);
                        }}
                        className={`input-field pl-9 pr-10 ${error ? 'border-error' : ''}`}
                      />
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
                        Updating…
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={18} />
                        Update Password
                      </>
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </PageTransitionWrapper>
  );
}

