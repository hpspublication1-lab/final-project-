'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';
import { Eye, EyeOff, Lock, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import AppLogo from '@/components/ui/AppLogo';
import PasswordStrength from '@/app/sign-up-login-screen/components/PasswordStrength';

interface ResetPasswordFormData {
  password: string;
  confirmPassword: string;
}

type SessionState = 'checking' | 'valid' | 'invalid';

export default function ResetPasswordClient() {
  const [sessionState, setSessionState] = useState<SessionState>('checking');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [done, setDone] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormData>();

  const password = watch('password', '');

  useEffect(() => {
    const supabase = createClient();

    // The /auth/callback route already exchanged the reset-link code for a
    // session (cookie-based) before redirecting here, so we should have a
    // valid session by the time this page loads.
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSessionState(session ? 'valid' : 'invalid');
    });

    // Some Supabase client versions also emit this event directly.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) {
        setSessionState('valid');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const onSubmit = async (data: ResetPasswordFormData) => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: data.password });
      if (error) throw error;

      setDone(true);
      toast.success('Password updated! You can now sign in with your new password.');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Could not update password';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex items-center gap-3 mb-2">
            <AppLogo size={40} />
            <div className="flex flex-col leading-none">
              <span className="font-extrabold text-xl text-foreground tracking-tight">Samyak</span>
              <span className="text-sm font-medium text-muted-foreground">CEE Mastery</span>
            </div>
          </Link>
        </div>

        <div className="bg-card border border-border rounded-2xl shadow-sm p-4 sm:p-6 lg:p-8">
          {sessionState === 'checking' && (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 size={28} className="animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Verifying your reset link...</p>
            </div>
          )}

          {sessionState === 'invalid' && (
            <div className="text-center space-y-4 py-4">
              <div className="w-14 h-14 rounded-full bg-error/10 flex items-center justify-center mx-auto">
                <AlertTriangle size={28} className="text-error" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Link expired or invalid</h2>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  This password reset link is no longer valid. Request a new one from the sign-in page.
                </p>
              </div>
              <Link
                href="/sign-up-login-screen"
                className="btn-primary w-full justify-center py-3 text-base inline-flex"
              >
                Back to Sign In
              </Link>
            </div>
          )}

          {sessionState === 'valid' && !done && (
            <>
              <div className="mb-5">
                <h2 className="text-2xl font-bold text-foreground">Set a new password</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Choose a strong password you haven&apos;t used before.
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label htmlFor="new-password" className="block text-sm font-semibold text-foreground mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      id="new-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="Create a strong password"
                      className={`input-field pl-9 pr-10 ${errors.password ? 'border-error' : ''}`}
                      {...register('password', {
                        required: 'Password is required',
                        minLength: { value: 8, message: 'Password must be at least 8 characters' },
                      })}
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
                  {errors.password && <p className="text-xs text-error mt-1.5">{errors.password.message}</p>}
                  {password && <PasswordStrength password={password} />}
                </div>

                <div>
                  <label htmlFor="confirm-password" className="block text-sm font-semibold text-foreground mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      id="confirm-password"
                      type={showConfirm ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="Repeat your password"
                      className={`input-field pl-9 pr-10 ${errors.confirmPassword ? 'border-error' : ''}`}
                      {...register('confirmPassword', {
                        required: 'Please confirm your password',
                        validate: (value) => value === password || 'Passwords do not match',
                      })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={showConfirm ? 'Hide password' : 'Show password'}
                    >
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-xs text-error mt-1.5">{errors.confirmPassword.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full justify-center py-3 text-base"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Updating password...
                    </>
                  ) : (
                    'Update Password'
                  )}
                </button>
              </form>
            </>
          )}

          {sessionState === 'valid' && done && (
            <div className="text-center space-y-4 py-4">
              <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center mx-auto">
                <CheckCircle2 size={28} className="text-success" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Password updated</h2>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  Your password has been changed successfully.
                </p>
              </div>
              <button
                type="button"
                onClick={() => router.push('/sign-up-login-screen')}
                className="btn-primary w-full justify-center py-3 text-base"
              >
                Continue to Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
