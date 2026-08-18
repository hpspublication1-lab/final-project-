'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { User, Phone, GraduationCap, Calendar, Loader2, Sparkles } from 'lucide-react';
import AppLogo from '@/components/ui/AppLogo';
import PageTransitionWrapper from '@/components/PageTransitionWrapper';

interface OnboardingFormData {
  fullName: string;
  phone: string;
  college: string;
  ceeYear: string;
}

/** Safe same-origin ?redirect= target (e.g. back to /checkout), else dashboard. */
function nextDestination(): string {
  if (typeof window === 'undefined') return '/student-dashboard';
  const raw = new URLSearchParams(window.location.search).get('redirect');
  return raw && raw.startsWith('/') && !raw.startsWith('//') ? raw : '/student-dashboard';
}

export default function OnboardingClient() {
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<OnboardingFormData>();

  // Guard the route: require a session, skip if the profile is already complete,
  // and prefill anything we already know about the user.
  useEffect(() => {
    let active = true;
    (async () => {
      // Read via the service-role route (works despite user_profiles RLS recursion).
      const res = await fetch('/api/profile/me');
      if (res.status === 401) {
        window.location.href = '/sign-up-login-screen';
        return;
      }
      const me = res.ok ? await res.json() : null;

      if (me?.college && me?.cee_year) {
        window.location.href = nextDestination();
        return;
      }
      if (!active) return;
      // Don't prefill a full_name that's just the email prefix the trigger set.
      const emailPrefix = (me?.email ?? '').split('@')[0];
      reset({
        fullName: me?.full_name && me.full_name !== emailPrefix ? me.full_name : '',
        phone: me?.phone ? String(me.phone).replace(/^\+977/, '') : '',
        college: me?.college ?? '',
        ceeYear: me?.cee_year ? String(me.cee_year) : '',
      });
      setReady(true);
    })();
    return () => {
      active = false;
    };
  }, [reset]);

  const onSubmit = async (data: OnboardingFormData) => {
    setSaving(true);
    try {
      const res = await fetch('/api/profile/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: data.fullName.trim(),
          phone: `+977${data.phone.trim()}`,
          college: data.college.trim(),
          ceeYear: data.ceeYear,
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (res.status === 401) {
        window.location.href = '/sign-up-login-screen';
        return;
      }
      if (!res.ok) {
        throw new Error(payload.error ?? 'Could not save. Please try again.');
      }

      toast.success('All set! Welcome to Samyak CEE Mastery 🎉');
      window.location.href = nextDestination();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not save. Please try again.';
      toast.error(message);
      setSaving(false);
    }
  };

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <PageTransitionWrapper>
      <div className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center mb-8">
            <div className="flex items-center gap-2 mb-3">
              <AppLogo size={30} />
              <span className="font-extrabold text-base text-primary tracking-tight">Samyak CEE</span>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Sparkles size={26} className="text-primary" />
            </div>
          </div>

          <div className="card-base p-6 sm:p-8">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-extrabold text-foreground">Tell us about you</h1>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                A few quick details so we can personalize your CEE preparation.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Full Name */}
              <div>
                <label htmlFor="ob-name" className="block text-sm font-semibold text-foreground mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="ob-name"
                    type="text"
                    autoComplete="name"
                    placeholder="Priya Thapa"
                    className={`input-field pl-9 ${errors.fullName ? 'border-error' : ''}`}
                    {...register('fullName', {
                      required: 'Full name is required',
                      minLength: { value: 2, message: 'Name must be at least 2 characters' },
                    })}
                  />
                </div>
                {errors.fullName && <p className="text-xs text-error mt-1.5">{errors.fullName.message}</p>}
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="ob-phone" className="block text-sm font-semibold text-foreground mb-1.5">
                  Phone Number
                  <span className="text-xs text-muted-foreground font-normal ml-1">(Nepal)</span>
                </label>
                <div className="relative flex min-w-0">
                  <span className="flex items-center px-2 sm:px-3 bg-muted border border-r-0 border-border rounded-l-[10px] text-sm font-medium text-muted-foreground shrink-0 whitespace-nowrap">
                    🇳🇵 +977
                  </span>
                  <input
                    id="ob-phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="98XXXXXXXX"
                    className={`input-field rounded-l-none border-l-0 min-w-0 flex-1 ${errors.phone ? 'border-error' : ''}`}
                    {...register('phone', {
                      required: 'Phone number is required',
                      pattern: { value: /^[9][6-9]\d{8}$/, message: 'Enter a valid Nepal mobile number (e.g. 9812345678)' },
                    })}
                  />
                </div>
                {errors.phone && <p className="text-xs text-error mt-1.5">{errors.phone.message}</p>}
              </div>

              {/* College */}
              <div>
                <label htmlFor="ob-college" className="block text-sm font-semibold text-foreground mb-1.5">
                  School / College
                </label>
                <div className="relative">
                  <GraduationCap size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="ob-college"
                    type="text"
                    placeholder="Kathmandu Model Higher Secondary School"
                    className={`input-field pl-9 ${errors.college ? 'border-error' : ''}`}
                    {...register('college', { required: 'School/College is required' })}
                  />
                </div>
                {errors.college && <p className="text-xs text-error mt-1.5">{errors.college.message}</p>}
              </div>

              {/* CEE Year */}
              <div>
                <label htmlFor="ob-year" className="block text-sm font-semibold text-foreground mb-1.5">
                  CEE Target Year
                </label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <select
                    id="ob-year"
                    className={`input-field pl-9 appearance-none ${errors.ceeYear ? 'border-error' : ''}`}
                    defaultValue=""
                    {...register('ceeYear', { required: 'Please select your target year' })}
                  >
                    <option value="">Select target year</option>
                    <option value="2026">CEE 2026 (This year)</option>
                    <option value="2027">CEE 2027 (Next year)</option>
                    <option value="2028">CEE 2028</option>
                  </select>
                </div>
                {errors.ceeYear && <p className="text-xs text-error mt-1.5">{errors.ceeYear.message}</p>}
              </div>

              <button
                type="submit"
                disabled={saving}
                className="btn-primary w-full justify-center py-3 text-base font-bold shadow-md mt-2 disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Saving…
                  </>
                ) : (
                  'Continue to Dashboard'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </PageTransitionWrapper>
  );
}
