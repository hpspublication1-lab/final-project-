'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Lock, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import PageTransitionWrapper from '@/components/PageTransitionWrapper';
import AppLogo from '@/components/ui/AppLogo';
import PasswordStrength from '../../sign-up-login-screen/components/PasswordStrength';
import { toast } from 'sonner';

export default function ResetPasswordClient() {
  const { updatePassword } = useAuth();
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
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
      toast.success('Password updated successfully!');
      router.push('/student-dashboard');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransitionWrapper>
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden relative">
        <div className="absolute top-6 left-6">
          <AppLogo />
        </div>

        <div className="w-full max-w-[420px] bg-card rounded-[2rem] shadow-2xl shadow-blue-500/5 border border-border overflow-hidden relative z-10">
          <div className="p-8 sm:p-10">
            <h1 className="text-2xl font-extrabold text-foreground leading-tight mb-2">
              Set New Password
            </h1>
            <p className="text-sm text-muted-foreground mb-6">
              Please enter your new password below. Make it strong and secure.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type={showPassword ? 'text' : 'password'}
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
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {password && <PasswordStrength password={password} />}
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
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
          </div>
        </div>
      </div>
    </PageTransitionWrapper>
  );
}
