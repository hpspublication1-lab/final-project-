'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import {
  User,
  GraduationCap,
  Calendar,
  Loader2,
  Sparkles,
  Stethoscope,
  Languages,
  TrendingUp,
  Cpu,
  CheckCircle2,
  Clock,
  Target,
  Globe,
  ArrowRight,
  Zap,
  ShieldCheck,
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
    subtitle: 'Medical Entrance (MBBS / BDS / B.Sc Nursing)',
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

export const PREP_STAGES_BY_TRACK: Record<
  string,
  Array<{ id: string; label: string; desc: string }>
> = {
  cee_medical: [
    { id: 'class_12_fresh', label: 'Grade 12 / Fresh', desc: 'Preparing alongside Class 12 or first CEE attempt' },
    { id: 'dropper_1st', label: 'Repeater / Dropper', desc: 'Full-time dedicated preparation for scholarship rank' },
    { id: 'class_11_foundation', label: 'Grade 11 Foundation', desc: 'Building early conceptual base for future CEE' },
  ],
  see_class_10: [
    { id: 'class_10_regular', label: 'Class 10 Regular', desc: 'Full-year preparation targeting GPA 3.8 – 4.0' },
    { id: 'pre_board_revision', label: 'Pre-Board / Final Revision', desc: 'Intensive past-paper & model set practice' },
  ],
  default: [
    { id: 'beginner', label: 'Starting Fresh', desc: 'Building core fundamentals from scratch' },
    { id: 'intermediate', label: 'Practicing & Advancing', desc: 'Strengthening skills with guided practice & projects' },
  ],
};

export const STUDY_TIME_OPTIONS = [
  { hours: 2, label: '1–2 hrs / day', desc: 'Steady daily consistency' },
  { hours: 4, label: '3–4 hrs / day', desc: 'Balanced chapter + MCQ drill' },
  { hours: 6, label: '6+ hrs / day', desc: 'Intensive scholarship target' },
];

export const LANGUAGE_OPTIONS = [
  { id: 'english', label: 'English Medium', desc: 'Standard MEC / NEB English medium' },
  { id: 'bilingual', label: 'English + नेपाली', desc: 'English terms with Nepali explanations' },
  { id: 'nepali', label: 'नेपाली माध्यम', desc: 'Nepali medium board preparation' },
];

/** Safe same-origin ?redirect= target (e.g. back to /checkout), else dashboard. Never loops to /onboarding. */
export function resolveNextDestination(searchStr?: string | null): string {
  const query = searchStr ?? (typeof window !== 'undefined' ? window.location.search : '');
  const raw =
    query.startsWith('?') || query.includes('redirect=')
      ? new URLSearchParams(query).get('redirect')
      : query || null;
  return raw &&
    raw.startsWith('/') &&
    !raw.startsWith('//') &&
    !raw.startsWith('/\\') &&
    !raw.startsWith('/onboarding')
    ? raw
    : '/student-dashboard';
}

/** Infers the canonical onboarding track from a preserved ?redirect=/checkout?plan=... URL. */
export function inferTrackFromRedirect(redirectPath: string): CanonicalCourseId | null {
  if (!redirectPath.startsWith('/checkout')) return null;
  const qIndex = redirectPath.indexOf('?');
  if (qIndex === -1) return null;
  const plan = (new URLSearchParams(redirectPath.slice(qIndex)).get('plan') || '').toLowerCase();
  if (!plan) return null;
  if (plan.startsWith('see-')) return 'see_class_10';
  if (plan.startsWith('english-') || plan.includes('ielts')) return 'ielts';
  if (plan.includes('python') || plan.includes('ai-prompt')) return 'artificial_intelligence';
  if (plan.startsWith('digital-')) return 'digital_marketing';
  if (plan.startsWith('cee-') || plan.includes('crash') || plan.startsWith('pro') || plan.startsWith('student')) {
    return 'cee_medical';
  }
  return null;
}

export default function OnboardingClient() {
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const { program, setProgram } = useProgram();
  const [selectedTrack, setSelectedTrack] = useState<CanonicalCourseId>(() => {
    if (typeof window !== 'undefined') {
      const inferred = inferTrackFromRedirect(resolveNextDestination(window.location.search));
      if (inferred) return inferred;
    }
    return program || 'cee_medical';
  });
  const [prepStage, setPrepStage] = useState<string>('class_12_fresh');
  const [dailyStudyHours, setDailyStudyHours] = useState<number>(4);
  const [languagePreference, setLanguagePreference] = useState<string>('english');
  const [launchDiagnostic, setLaunchDiagnostic] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<OnboardingFormData>();

  // Sync default prepStage when track changes
  useEffect(() => {
    const stages = PREP_STAGES_BY_TRACK[selectedTrack] || PREP_STAGES_BY_TRACK.default;
    if (!stages.some((s) => s.id === prepStage)) {
      setPrepStage(stages[0].id);
    }
  }, [selectedTrack, prepStage]);

  useEffect(() => {
    let active = true;
    (async () => {
      const res = await fetch('/api/profile/me');
      if (res.status === 401) {
        window.location.href = '/login';
        return;
      }
      const me = res.ok ? await res.json() : null;
      if (me && me.authenticated === false) {
        window.location.href = '/login';
        return;
      }

      const isEditMode =
        typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('edit') === '1';

      // If user already completed onboarding (and isn't explicitly editing), navigate cleanly
      if (!isEditMode && me?.onboarding_completed) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('samyak_onboarding_completed', 'true');
        }
        window.location.href = resolveNextDestination();
        return;
      }

      if (!active) return;
      const emailPrefix = (me?.email ?? '').split('@')[0];
      const redirectTrack =
        typeof window !== 'undefined'
          ? inferTrackFromRedirect(resolveNextDestination(window.location.search))
          : null;
      if (redirectTrack) {
        setSelectedTrack(redirectTrack);
      } else if (me?.target_exam) {
        setSelectedTrack(me.target_exam as CanonicalCourseId);
      }
      if (me?.prep_stage) {
        setPrepStage(me.prep_stage);
      }
      if (me?.daily_study_hours) {
        setDailyStudyHours(Number(me.daily_study_hours));
      }
      if (me?.language_preference) {
        setLanguagePreference(me.language_preference);
      }

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

  const handleSkipOnboarding = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('samyak_onboarding_completed', 'true');
      localStorage.setItem('samyak_active_program', selectedTrack);
    }
    setProgram(selectedTrack);
    window.location.href = resolveNextDestination();
  };

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
          prepStage,
          dailyStudyHours,
          languagePreference,
          consentAccepted: true,
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

      // Sync active program & onboarding state to context & storage
      setProgram(selectedTrack);
      if (typeof window !== 'undefined') {
        localStorage.setItem('samyak_onboarding_completed', 'true');
        localStorage.setItem('samyak_prep_stage', prepStage);
        localStorage.setItem('samyak_daily_hours', String(dailyStudyHours));
        localStorage.setItem('samyak_language_pref', languagePreference);
      }

      if (launchDiagnostic) {
        toast.success('Profile saved! Launching your free baseline diagnostic…');
        const diagUrl =
          selectedTrack === 'see_class_10'
            ? '/mock-tests?program=see&diagnostic=1'
            : '/mock-tests?program=cee&diagnostic=1';
        window.location.href = diagUrl;
      } else {
        toast.success('All set! Welcome to your Samyak Guru study portal');
        window.location.href = resolveNextDestination();
      }
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

  const activeStages = PREP_STAGES_BY_TRACK[selectedTrack] || PREP_STAGES_BY_TRACK.default;

  return (
    <PageTransitionWrapper>
      <div className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <AppLogo size={30} />
              <span className="font-extrabold text-base text-primary tracking-tight">Samyak Guru</span>
            </div>
            <button
              type="button"
              onClick={handleSkipOnboarding}
              className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg border border-border bg-card"
            >
              Skip to Dashboard →
            </button>
          </div>

          <div className="card-base p-6 sm:p-8">
            <div className="mb-6">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-extrabold uppercase tracking-wider mb-2">
                <Sparkles size={13} />
                <span>60-Second Study Setup · Free Access</span>
              </div>
              <h1 className="text-2xl font-extrabold text-foreground">Personalize Your Study Plan</h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
                Tell us your target exam, preparation stage, and daily schedule so we can tailor your practice sets and mock tests. No purchase required.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* 1. Target Exam Selector */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-foreground mb-2.5">
                  <Target size={14} className="text-primary" />
                  <span>1. Target Exam / Track</span>
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

              {/* 2. Preparation Stage */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-foreground mb-2.5">
                  <GraduationCap size={14} className="text-primary" />
                  <span>2. Current Preparation Stage</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {activeStages.map((stage) => {
                    const active = prepStage === stage.id;
                    return (
                      <button
                        type="button"
                        key={stage.id}
                        onClick={() => setPrepStage(stage.id)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          active
                            ? 'bg-primary/10 border-primary text-foreground shadow-xs'
                            : 'border-border bg-card hover:bg-muted/60 text-muted-foreground'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-foreground">{stage.label}</span>
                          {active && <CheckCircle2 size={13} className="text-primary shrink-0" />}
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-snug">{stage.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Available Daily Study Time */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-foreground mb-2.5">
                  <Clock size={14} className="text-primary" />
                  <span>3. Available Daily Study Time</span>
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {STUDY_TIME_OPTIONS.map((opt) => {
                    const active = dailyStudyHours === opt.hours;
                    return (
                      <button
                        type="button"
                        key={opt.hours}
                        onClick={() => setDailyStudyHours(opt.hours)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          active
                            ? 'bg-primary/10 border-primary text-foreground shadow-xs'
                            : 'border-border bg-card hover:bg-muted/60 text-muted-foreground'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-foreground">{opt.label}</span>
                          {active && <CheckCircle2 size={13} className="text-primary shrink-0" />}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">{opt.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Language / Medium Preference */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-foreground mb-2.5">
                  <Globe size={14} className="text-primary" />
                  <span>4. Preferred Study Medium</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {LANGUAGE_OPTIONS.map((lang) => {
                    const active = languagePreference === lang.id;
                    return (
                      <button
                        type="button"
                        key={lang.id}
                        onClick={() => setLanguagePreference(lang.id)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          active
                            ? 'bg-primary/10 border-primary text-foreground shadow-xs'
                            : 'border-border bg-card hover:bg-muted/60 text-muted-foreground'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-foreground">{lang.label}</span>
                          {active && <CheckCircle2 size={13} className="text-primary shrink-0" />}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">{lang.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 5. Student Details (Minimal required data) */}
              <div className="pt-2 border-t border-border/70 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="ob-name" className="block text-xs font-bold text-foreground uppercase tracking-wider mb-1.5">
                    Full Name <span className="text-error">*</span>
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
                  {errors.fullName && <p className="text-xs text-error mt-1">{errors.fullName.message}</p>}
                </div>

                <div>
                  <label htmlFor="ob-phone" className="block text-xs font-bold text-foreground uppercase tracking-wider mb-1.5">
                    Phone / WhatsApp <span className="text-[10px] text-muted-foreground font-normal">(Optional)</span>
                  </label>
                  <div className="relative flex min-w-0">
                    <span className="flex items-center px-2.5 bg-muted border border-r-0 border-border rounded-l-[10px] text-xs font-semibold text-muted-foreground shrink-0 whitespace-nowrap">
                      +977
                    </span>
                    <input
                      id="ob-phone"
                      type="tel"
                      autoComplete="tel"
                      placeholder="98XXXXXXXX"
                      className={`input-field rounded-l-none border-l-0 min-w-0 flex-1 ${errors.phone ? 'border-error' : ''}`}
                      {...register('phone', {
                        pattern: { value: /^[9][6-9]\d{8}$/, message: 'Enter a valid 10-digit Nepal mobile number' },
                      })}
                    />
                  </div>
                  {errors.phone && <p className="text-xs text-error mt-1">{errors.phone.message}</p>}
                </div>

                <div>
                  <label htmlFor="ob-college" className="block text-xs font-bold text-foreground uppercase tracking-wider mb-1.5">
                    {selectedTrack === 'see_class_10' ? 'School Name' : 'College / Institution'}{' '}
                    <span className="text-[10px] text-muted-foreground font-normal">(Optional)</span>
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

                {selectedTrack === 'cee_medical' && (
                  <div>
                    <label htmlFor="ob-year" className="block text-xs font-bold text-foreground uppercase tracking-wider mb-1.5">
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
              </div>

              {/* 6. Action Buttons: Complete to Dashboard OR Optional Free Diagnostic */}
              <div className="pt-2 space-y-2.5">
                <button
                  type="submit"
                  disabled={saving}
                  onClick={() => setLaunchDiagnostic(false)}
                  className="btn-primary w-full justify-center py-3.5 text-sm sm:text-base font-extrabold shadow-md disabled:opacity-60 flex items-center gap-2"
                >
                  {saving && !launchDiagnostic ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Saving your study plan…
                    </>
                  ) : (
                    <>
                      <span>Complete Setup &amp; Open Dashboard</span>
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  onClick={() => setLaunchDiagnostic(true)}
                  className="w-full py-3 px-4 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {saving && launchDiagnostic ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Launching diagnostic…
                    </>
                  ) : (
                    <>
                      <Zap size={16} />
                      <span>Optional: Save &amp; Take Free 10-Min Baseline Diagnostic Test</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground text-center pt-1">
                <ShieldCheck size={13} className="text-emerald-500 shrink-0" />
                <span>
                  Protected by our{' '}
                  <Link href="/privacy" className="font-semibold text-foreground hover:text-primary underline">
                    Privacy Policy
                  </Link>{' '}
                  &amp;{' '}
                  <Link href="/terms" className="font-semibold text-foreground hover:text-primary underline">
                    Terms of Service
                  </Link>
                  .
                </span>
              </div>
            </form>
          </div>
        </div>
      </div>
    </PageTransitionWrapper>
  );
}

