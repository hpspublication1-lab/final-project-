'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import {
  User,
  Phone,
  GraduationCap,
  Calendar,
  Loader2,
  Sparkles,
  Stethoscope,
  BookOpen,
  Languages,
  TrendingUp,
  Cpu,
  CheckCircle2,
} from 'lucide-react';
import AppLogo from '@/components/ui/AppLogo';
import PageTransitionWrapper from '@/components/PageTransitionWrapper';
import { useProgram, CanonicalCourseId } from '@/contexts/ProgramContext';

interface OnboardingFormData {
  fullName: string;
  phone: string;
  college: string;
  ceeYear: string;
}

const PROGRAM_TRACKS: {
  id: CanonicalCourseId;
  name: string;
  subtitle: string;
  icon: any;
  color: string;
  borderColor: string;
  bgActive: string;
}[] = [
  {
    id: 'cee_medical',
    name: 'Samyak CEE',
    subtitle: 'Medical Entrance (MBBS / BDS / Nursing)',
    icon: Stethoscope,
    color: 'text-indigo-600 dark:text-indigo-400',
    borderColor: 'border-indigo-500',
    bgActive: 'bg-indigo-500/10 dark:bg-indigo-500/20 border-indigo-500',
  },
  {
    id: 'see_class_10',
    name: 'Samyak SEE',
    subtitle: 'Class 10 NEB Board Exam',
    icon: GraduationCap,
    color: 'text-emerald-600 dark:text-emerald-400',
    borderColor: 'border-emerald-500',
    bgActive: 'bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500',
  },
  {
    id: 'ielts',
    name: 'Samyak IELTS',
    subtitle: 'Target Band 8.0+ English Mastery',
    icon: Languages,
    color: 'text-amber-600 dark:text-amber-400',
    borderColor: 'border-amber-500',
    bgActive: 'bg-amber-500/10 dark:bg-amber-500/20 border-amber-500',
  },
  {
    id: 'digital_marketing',
    name: 'Samyak Digital',
    subtitle: 'Performance Marketing, Ads & SEO',
    icon: TrendingUp,
    color: 'text-rose-600 dark:text-rose-400',
    borderColor: 'border-rose-500',
    bgActive: 'bg-rose-500/10 dark:bg-rose-500/20 border-rose-500',
  },
  {
    id: 'artificial_intelligence',
    name: 'Samyak AI',
    subtitle: 'Prompt Engineering & Python',
    icon: Cpu,
    color: 'text-purple-600 dark:text-purple-400',
    borderColor: 'border-purple-500',
    bgActive: 'bg-purple-500/10 dark:bg-purple-500/20 border-purple-500',
  },
];

/** Safe same-origin ?redirect= target (e.g. back to /checkout), else dashboard. */
function nextDestination(): string {
  if (typeof window === 'undefined') return '/student-dashboard';
  const raw = new URLSearchParams(window.location.search).get('redirect');
  return raw && raw.startsWith('/') && !raw.startsWith('//') ? raw : '/student-dashboard';
}

export default function OnboardingClient() {
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const { program, setProgram } = useProgram();
  const [selectedTrack, setSelectedTrack] = useState<CanonicalCourseId>(program || 'cee_medical');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<OnboardingFormData>();

  useEffect(() => {
    let active = true;
    (async () => {
      const res = await fetch('/api/profile/me');
      if (res.status === 401) {
        window.location.href = '/login';
        return;
      }
      const me = res.ok ? await res.json() : null;

      // If user already has a valid completed profile (name & phone), allow navigating
      if (me?.full_name && me.full_name !== (me.email || '').split('@')[0] && me?.phone) {
        window.location.href = nextDestination();
        return;
      }

      if (!active) return;
      const emailPrefix = (me?.email ?? '').split('@')[0];
      reset({
        fullName: me?.full_name && me.full_name !== emailPrefix ? me.full_name : '',
        phone: me?.phone ? String(me.phone).replace(/^\+977/, '') : '',
        college: me?.college ?? '',
        ceeYear: me?.cee_year ? String(me.cee_year) : '2026',
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
          phone: data.phone?.trim() ? `+977${data.phone.trim()}` : '',
          college: data.college?.trim() || '',
          ceeYear: selectedTrack === 'cee_medical' ? data.ceeYear : null,
          program: selectedTrack,
        }),
      });

      const payload = await res.json().catch(() => ({}));
      if (res.status === 401) {
        window.location.href = '/login';
        return;
      }
      if (!res.ok) {
        throw new Error(payload.error ?? 'Could not save. Please try again.');
      }

      // Sync active program to context & storage
      setProgram(selectedTrack);

      toast.success('All set! Welcome to your learning portal 🎉');
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
        <div className="w-full max-w-lg">
          <div className="flex flex-col items-center mb-6">
            <div className="flex items-center gap-2 mb-2">
              <AppLogo size={32} />
              <span className="font-extrabold text-base text-primary tracking-tight">Samyak LMS</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Sparkles size={24} className="text-primary" />
            </div>
          </div>

          <div className="card-base p-6 sm:p-8">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-extrabold text-foreground">Welcome! Let&apos;s personalize your learning</h1>
              <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                Choose your learning track and tell us a few quick details to get started.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* 1. Track Selector */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Select Your Main Preparation Track
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {PROGRAM_TRACKS.map((track) => {
                    const active = selectedTrack === track.id;
                    const IconComp = track.icon;
                    return (
                      <button
                        type="button"
                        key={track.id}
                        onClick={() => setSelectedTrack(track.id)}
                        className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                          active
                            ? `${track.bgActive} shadow-xs font-semibold`
                            : 'border-border bg-card hover:bg-muted/60 text-muted-foreground'
                        }`}
                      >
                        <div className={`p-1.5 rounded-lg bg-background border border-border/50 shrink-0 ${track.color}`}>
                          <IconComp size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-foreground truncate">{track.name}</span>
                            {active && <CheckCircle2 size={14} className={track.color} />}
                          </div>
                          <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">{track.subtitle}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Full Name */}
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

              {/* 3. Phone */}
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

              {/* 4. Dynamic School/College/Institution */}
              <div>
                <label htmlFor="ob-college" className="block text-sm font-semibold text-foreground mb-1.5">
                  {selectedTrack === 'see_class_10'
                    ? 'School Name'
                    : selectedTrack === 'cee_medical'
                    ? 'College / Higher Secondary'
                    : 'School / College / Organization'}
                </label>
                <div className="relative">
                  <GraduationCap size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="ob-college"
                    type="text"
                    placeholder={
                      selectedTrack === 'see_class_10'
                        ? 'e.g. Siddhartha Secondary School'
                        : 'e.g. Kathmandu Model College'
                    }
                    className="input-field pl-9"
                    {...register('college')}
                  />
                </div>
              </div>

              {/* 5. CEE Target Year (if CEE track selected) */}
              {selectedTrack === 'cee_medical' && (
                <div>
                  <label htmlFor="ob-year" className="block text-sm font-semibold text-foreground mb-1.5">
                    CEE Target Year
                  </label>
                  <div className="relative">
                    <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <select
                      id="ob-year"
                      className="input-field pl-9 appearance-none"
                      defaultValue="2026"
                      {...register('ceeYear')}
                    >
                      <option value="2026">CEE 2026 (This year)</option>
                      <option value="2027">CEE 2027 (Next year)</option>
                      <option value="2028">CEE 2028</option>
                    </select>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="btn-primary w-full justify-center py-3.5 text-base font-bold shadow-md mt-2 disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Saving profile…
                  </>
                ) : (
                  'Continue to Learning Portal'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </PageTransitionWrapper>
  );
}
