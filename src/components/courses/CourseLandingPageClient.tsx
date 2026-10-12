'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Lock,
  CreditCard,
  Zap,
  Clock,
  ChevronDown,
  ChevronUp,
  Sparkles,
  BookOpen,
  AlertTriangle,
  FileText,
  Target,
  Mic,
  Camera,
  Code,
  Bot,
  BarChart,
  Search,
  Layers,
  Info,
} from 'lucide-react';
import PublicNav from '@/components/PublicNav';
import HomepageFooter from '@/app/components/HomepageFooter';
import PageTransitionWrapper from '@/components/PageTransitionWrapper';
import { useAuth } from '@/contexts/AuthContext';
import { CourseLandingConfig } from '@/lib/courses/landingData';
import { getCourseBySlug } from '@/lib/courses/catalog';
import { SUPPORT_CONFIG } from '@/lib/config/support';

const WHATSAPP_NUMBER = SUPPORT_CONFIG.whatsappNumber;

const ICON_MAP: Record<string, React.ReactNode> = {
  BookOpen: <BookOpen size={20} className="text-primary" />,
  Zap: <Zap size={20} className="text-amber-500" />,
  Bot: <Bot size={20} className="text-indigo-500" />,
  Target: <Target size={20} className="text-emerald-500" />,
  Camera: <Camera size={20} className="text-emerald-500" />,
  FileText: <FileText size={20} className="text-blue-500" />,
  TrendingUp: <Sparkles size={20} className="text-amber-500" />,
  Edit: <FileText size={20} className="text-purple-500" />,
  Mic: <Mic size={20} className="text-pink-500" />,
  Headphones: <Sparkles size={20} className="text-indigo-500" />,
  Search: <Search size={20} className="text-amber-500" />,
  DollarSign: <CreditCard size={20} className="text-emerald-500" />,
  BarChart: <BarChart size={20} className="text-blue-500" />,
  Code: <Code size={20} className="text-indigo-500" />,
  Cpu: <Zap size={20} className="text-purple-500" />,
  Sparkles: <Sparkles size={20} className="text-amber-500" />,
};

export default function CourseLandingPageClient({ course }: { course: CourseLandingConfig }) {
  const { profile } = useAuth();
  const [openModuleIndex, setOpenModuleIndex] = useState<number | null>(0);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const canonicalCourse = getCourseBySlug(course.sku) || getCourseBySlug(course.id);
  const isEnrolledInThisCourse = Boolean(
    profile?.subscription_plan &&
      (profile.subscription_plan === course.sku ||
        (canonicalCourse && profile.subscription_plan === canonicalCourse.slug))
  );

  const checkoutUrl = canonicalCourse?.enrollPath || `/checkout?plan=${course.sku}`;
  const detailUrl = `/courses/${canonicalCourse?.slug || course.sku}`;

  const toggleModule = (idx: number) => {
    setOpenModuleIndex(openModuleIndex === idx ? null : idx);
  };

  const toggleFaq = (idx: number) => {
    setOpenFaqIndex(openFaqIndex === idx ? null : idx);
  };

  return (
    <PageTransitionWrapper>
      <div className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-primary/20">
        <PublicNav />

        <main className="w-full">
          {/* 1. HERO SECTION */}
          <section className="relative pt-12 pb-20 overflow-hidden border-b border-border/60">
            <div
              className={`absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-r ${course.gradientBg} opacity-10 blur-3xl pointer-events-none rounded-full`}
            />

            <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-8 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-black border ${course.themeBorder}`}
                  >
                    <Sparkles size={14} /> {course.brandBadge}
                  </span>
                  {canonicalCourse && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-foreground text-xs font-bold border border-border">
                      <Layers size={13} className="text-primary" />
                      {canonicalCourse.formatLabel}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                    <CheckCircle2 size={14} /> 2082 / 2026 Verified Syllabus
                  </span>
                  <span>•</span>
                  <Link href={detailUrl} className="text-primary font-bold hover:underline">
                    View Canonical Syllabus Record →
                  </Link>
                </div>
              </div>

              <div className="grid lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-7 space-y-5">
                  <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-foreground tracking-tight leading-[1.1]">
                    {course.heroHeadline}{' '}
                    <span
                      className={`bg-gradient-to-r ${course.gradientBg} bg-clip-text text-transparent`}
                    >
                      {course.heroHighlight}
                    </span>
                  </h1>

                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl">
                    {course.heroSubtitle}
                  </p>

                  {/* Target Audience & Outcome Cards */}
                  <div className="grid sm:grid-cols-2 gap-3 text-xs pt-2">
                    <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/80 space-y-1">
                      <span className="font-bold text-foreground block">🎯 Who This Is For:</span>
                      <p className="text-muted-foreground text-[11px] leading-relaxed">
                        {course.targetAudience}
                      </p>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/80 space-y-1">
                      <span className="font-bold text-foreground block">🏆 Expected Outcome:</span>
                      <p className="text-muted-foreground text-[11px] leading-relaxed">
                        {course.targetOutcome}
                      </p>
                    </div>
                  </div>

                  {/* CTAs */}
                  <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                    {isEnrolledInThisCourse ? (
                      <Link
                        href="/student-dashboard"
                        className="btn-primary w-full sm:w-auto px-8 py-4 text-sm font-black shadow-lg justify-center gap-2"
                      >
                        <span>Continue Learning in Dashboard</span>
                        <ArrowRight size={16} />
                      </Link>
                    ) : (
                      <Link
                        href={checkoutUrl}
                        className="btn-primary w-full sm:w-auto px-8 py-4 text-sm font-black shadow-lg justify-center gap-2"
                      >
                        <span>
                          {course.primaryCtaText} (NPR {course.price.toLocaleString()})
                        </span>
                        <ArrowRight size={16} />
                      </Link>
                    )}

                    <Link
                      href={detailUrl}
                      className="btn-secondary w-full sm:w-auto px-6 py-4 text-xs font-bold justify-center"
                    >
                      Preview Sample Question &amp; Details
                    </Link>
                  </div>

                  <p className="text-[11px] text-muted-foreground flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <ShieldCheck size={13} className="text-emerald-500" />
                    <span>
                      {canonicalCourse?.refundRules ||
                        '7-Day Refund Policy'} · {course.validityLabel} ·{' '}
                      <Link href="/refund" className="underline hover:text-foreground">
                        Refund Terms
                      </Link>
                    </span>
                  </p>
                </div>

                {/* Right: Stats Grid */}
                <div className="lg:col-span-5 bg-card border border-border/80 rounded-3xl p-6 shadow-xl space-y-6">
                  <div className="flex items-center justify-between border-b border-border/60 pb-3">
                    <span className="text-xs font-black uppercase text-foreground font-mono">
                      PROGRAM SPECIFICATIONS
                    </span>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                      NPR {course.price.toLocaleString()} One-Time
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {course.stats.map((st, i) => (
                      <div
                        key={i}
                        className="p-4 rounded-2xl bg-muted/40 border border-border/60 text-center space-y-1"
                      >
                        <span className="text-2xl sm:text-3xl font-black text-foreground block font-mono">
                          {st.value}
                        </span>
                        <span className="text-[11px] font-medium text-muted-foreground block">
                          {st.label}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 space-y-2 text-xs">
                    <div className="flex items-center justify-between font-bold text-foreground">
                      <span>Access Duration:</span>
                      <span className="text-primary">{course.validityLabel}</span>
                    </div>
                    {canonicalCourse && (
                      <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                        <span>Schedule:</span>
                        <span className="font-semibold text-foreground text-right">
                          {canonicalCourse.batchSchedule.startDate}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 2. SUBSTANTIATED TRUST BAR */}
          <section className="py-6 bg-muted/30 border-b border-border/60">
            <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-card border border-border/60">
                <CreditCard size={18} className="text-primary shrink-0" />
                <div>
                  <span className="font-bold text-foreground block">Fonepay &amp; Bank QR</span>
                  <span className="text-[10px] text-muted-foreground">Nepali Mobile Banking</span>
                </div>
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-card border border-border/60">
                <Lock size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div>
                  <span className="font-bold text-foreground block">256-Bit TLS Security</span>
                  <span className="text-[10px] text-muted-foreground">HTTPS Encrypted Checkout</span>
                </div>
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-card border border-border/60">
                <Zap size={18} className="text-amber-500 shrink-0" />
                <div>
                  <span className="font-bold text-foreground block">
                    {canonicalCourse?.formatLabel || 'Structured Delivery'}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Verified LMS Modules
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-card border border-border/60">
                <Clock size={18} className="text-indigo-500 shrink-0" />
                <div>
                  <span className="font-bold text-foreground block">
                    {course.validityDays} Days Validity
                  </span>
                  <span className="text-[10px] text-muted-foreground">{course.validityLabel}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Teaching Asset Status & Prerequisites (from canonical catalog) */}
          {canonicalCourse && (
            <section className="pt-12 max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
              <div
                className={`rounded-2xl p-5 border flex items-start gap-3.5 ${
                  canonicalCourse.teachingAssetStatus.status === 'ready'
                    ? 'bg-emerald-500/5 border-emerald-500/20'
                    : 'bg-amber-500/5 border-amber-500/30'
                }`}
              >
                {canonicalCourse.teachingAssetStatus.status === 'ready' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1 text-xs sm:text-sm">
                  <span className="font-bold text-foreground block">
                    Teaching Asset &amp; Delivery Status
                  </span>
                  <p className="text-muted-foreground">
                    {canonicalCourse.teachingAssetStatus.summary}
                  </p>
                  {canonicalCourse.teachingAssetStatus.blockerNote && (
                    <p className="text-xs text-amber-700 dark:text-amber-400 font-medium pt-0.5">
                      {canonicalCourse.teachingAssetStatus.blockerNote}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-card border border-border/80 rounded-2xl p-5 space-y-2.5">
                  <div className="flex items-center gap-2 font-bold text-sm text-foreground">
                    <Layers size={16} className="text-primary" />
                    <span>Prerequisites &amp; Readiness</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-muted-foreground">
                    {canonicalCourse.prerequisites.map((req, rIdx) => (
                      <li key={rIdx} className="flex items-start gap-2">
                        <CheckCircle2 size={14} className="text-primary shrink-0 mt-0.5" />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-card border border-border/80 rounded-2xl p-5 space-y-2.5">
                  <div className="flex items-center gap-2 font-bold text-sm text-foreground">
                    <Info size={16} className="text-amber-500" />
                    <span>Feature Limits &amp; Scope</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-muted-foreground">
                    {canonicalCourse.featureLimits.map((lim, lIdx) => (
                      <li key={lIdx} className="flex items-start gap-2">
                        <Lock size={14} className="text-amber-500 shrink-0 mt-0.5" />
                        <span>{lim}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          )}

          {/* 3. PROBLEM & SOLUTION SECTION */}
          <section className="py-16 max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="grid md:grid-cols-2 gap-8 items-stretch">
              {/* Problem */}
              <div className="p-8 rounded-3xl bg-error-light/40 border border-error/20 space-y-5">
                <div className="flex items-center gap-2 text-error font-extrabold text-xs uppercase tracking-wider">
                  <AlertTriangle size={16} /> The Student Struggle
                </div>
                <h2 className="text-2xl font-black text-foreground">
                  {course.problemStatement.title}
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {course.problemStatement.description}
                </p>

                <ul className="space-y-3 pt-2 text-xs">
                  {course.problemStatement.painPoints.map((pt, i) => (
                    <li key={i} className="flex items-start gap-2 text-muted-foreground">
                      <span className="text-error font-bold shrink-0 mt-0.5">✕</span>
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Solution */}
              <div className="p-8 rounded-3xl bg-card border-2 border-primary/30 space-y-5 shadow-lg">
                <div className="flex items-center gap-2 text-primary font-extrabold text-xs uppercase tracking-wider">
                  <Sparkles size={16} /> The Samyak Solution
                </div>
                <h2 className="text-2xl font-black text-foreground">
                  {course.solutionOverview.title}
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {course.solutionOverview.description}
                </p>

                <div className="grid sm:grid-cols-2 gap-3 pt-2">
                  {course.solutionOverview.keyFeatures.map((feat, i) => (
                    <div
                      key={i}
                      className="p-3.5 rounded-2xl bg-muted/40 border border-border/60 space-y-1"
                    >
                      <div className="flex items-center gap-2 font-bold text-foreground text-xs">
                        {ICON_MAP[feat.icon] || <Zap size={16} className="text-primary" />}
                        <span>{feat.title}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        {feat.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* 4. CURRICULUM SECTION */}
          <section
            id="curriculum"
            className="py-16 bg-muted/20 border-t border-b border-border/60"
          >
            <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
              <div className="text-center max-w-2xl mx-auto space-y-2">
                <span className="text-xs font-black uppercase tracking-wider text-primary font-mono">
                  STEP-BY-STEP SYLLABUS
                </span>
                <h2 className="text-3xl font-black text-foreground">
                  Course Curriculum &amp; Modules
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Structured chapter breakdown designed for clear learning progression and exam mastery.
                </p>
              </div>

              <div className="space-y-4 max-w-3xl mx-auto">
                {course.curriculum.map((mod, i) => {
                  const isOpen = openModuleIndex === i;
                  return (
                    <div
                      key={i}
                      className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs"
                    >
                      <button
                        onClick={() => toggleModule(i)}
                        className="w-full p-5 text-left flex items-center justify-between gap-4 hover:bg-muted/30 transition-colors"
                      >
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-primary font-mono">
                            MODULE {i + 1} · {mod.lessonsCount} LESSONS
                          </span>
                          <h3 className="text-base font-bold text-foreground">{mod.title}</h3>
                          <p className="text-xs text-muted-foreground">{mod.desc}</p>
                        </div>
                        {isOpen ? (
                          <ChevronUp size={20} className="text-primary shrink-0" />
                        ) : (
                          <ChevronDown size={20} className="text-muted-foreground shrink-0" />
                        )}
                      </button>

                      {isOpen && (
                        <div className="px-5 pb-5 pt-2 border-t border-border/60 bg-muted/10 space-y-3">
                          <span className="text-xs font-bold text-foreground block">
                            Key Chapter Topics Covered:
                          </span>
                          <div className="grid sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
                            {mod.topics.map((tp, j) => (
                              <div key={j} className="flex items-center gap-2">
                                <CheckCircle2 size={14} className="text-success shrink-0" />
                                <span>{tp}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* 5. INSTRUCTORS SECTION */}
          <section className="py-16 max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-xs font-black uppercase tracking-wider text-primary font-mono">
                VERIFIED FACULTY &amp; MENTORS
              </span>
              <h2 className="text-3xl font-black text-foreground">
                Academic Faculty &amp; AI Coaching Engines
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Verified subject specialists and syllabus-calibrated AI engines supporting your learning track.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {course.instructors.map((ins, i) => (
                <div
                  key={i}
                  className="bg-card border border-border rounded-3xl p-6 shadow-sm flex items-start gap-4"
                >
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-xl font-bold text-primary shrink-0">
                    {ins.name[0]}
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <h3 className="text-base font-black text-foreground">{ins.name}</h3>
                    <p className="text-primary font-bold">{ins.title}</p>
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-muted text-[10px] font-mono text-muted-foreground border border-border">
                      {ins.credentials}
                    </span>
                    <p className="text-muted-foreground text-[11px] leading-relaxed pt-1">
                      {ins.bio}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 6. VERIFIED DELIVERABLES & WALKTHROUGHS */}
          <section className="py-16 bg-muted/20 border-t border-b border-border/60">
            <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
              <div className="text-center max-w-2xl mx-auto space-y-2">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-mono">
                  VERIFIED PLATFORM DELIVERABLES
                </span>
                <h2 className="text-3xl font-black text-foreground">
                  Inside the Learning Environment
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Concrete practice engines, grading rubrics, and learning workflows included in{' '}
                  {course.seoTitle.split('|')[0]}.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                {course.testimonials.map((t, i) => (
                  <div
                    key={i}
                    className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{t.avatar}</span>
                        <div>
                          <h4 className="text-sm font-bold text-foreground">{t.name}</h4>
                          <span className="text-[11px] text-muted-foreground">{t.role}</span>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono font-bold text-xs border border-emerald-500/20">
                        {t.score}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {t.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 7. PRICING & CHECKOUT SECTION */}
          <section className="py-16 max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 font-mono">
                TRANSPARENT PRICING &amp; REFUND TERMS
              </span>
              <h2 className="text-3xl font-black text-foreground">
                Enroll in {course.seoTitle.split('|')[0]}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Get {course.validityLabel} with Fonepay QR or Manual Bank Transfer verification.
              </p>
            </div>

            <div className="max-w-md mx-auto bg-card border-2 border-primary/40 rounded-3xl p-8 shadow-xl space-y-6 relative overflow-hidden">
              <div className="text-center space-y-2">
                <span className="text-[10px] font-black uppercase px-3 py-1 rounded-full bg-primary text-white font-mono">
                  {canonicalCourse?.formatLabel || course.brandBadge}
                </span>
                <div className="text-4xl font-black text-foreground pt-2 font-mono">
                  NPR {course.price.toLocaleString()}
                  <span className="text-xs font-normal text-muted-foreground"> / one-time</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Payable Now: NPR {course.price.toLocaleString()} · Balance Later: NPR 0 (
                  {course.validityLabel})
                </p>
              </div>

              <ul className="space-y-2.5 text-xs text-muted-foreground border-t border-b border-border py-4">
                {(
                  canonicalCourse?.includedFeatures || [
                    'Full Course Lessons & Structured Study Notes',
                    'Question Banks, Timed Mock Tests & Analytics',
                    '24/7 AI Tutor & Doubt Solver Access',
                    'Instant Server Activation upon Payment Verification',
                  ]
                ).map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-2 font-medium text-foreground">
                    <CheckCircle2 size={15} className="text-success shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>

              <div className="space-y-3">
                {isEnrolledInThisCourse ? (
                  <Link
                    href="/student-dashboard"
                    className="btn-primary w-full py-4 text-sm font-black justify-center gap-2"
                  >
                    <span>Already Enrolled — Go to Dashboard</span>
                    <ArrowRight size={16} />
                  </Link>
                ) : (
                  <Link
                    href={checkoutUrl}
                    className="btn-primary w-full py-4 text-sm font-black justify-center gap-2 shadow-lg"
                  >
                    <span>
                      {course.primaryCtaText} (NPR {course.price.toLocaleString()})
                    </span>
                    <ArrowRight size={16} />
                  </Link>
                )}

                <div className="text-center space-y-1.5">
                  <p className="text-[11px] text-muted-foreground flex items-center justify-center gap-1 font-medium">
                    <ShieldCheck size={13} className="text-emerald-500 shrink-0" />
                    <span>
                      {canonicalCourse?.refundRules || '7-Day Refund Policy'} ·{' '}
                      <Link href="/refund" className="underline hover:text-foreground">
                        View Policy
                      </Link>
                    </span>
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Need help?{' '}
                    <a
                      href={`https://wa.me/${WHATSAPP_NUMBER}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold underline text-foreground"
                    >
                      WhatsApp Academic Counseling: {SUPPORT_CONFIG.phoneDisplay}
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* 8. FAQ SECTION */}
          <section className="py-16 bg-muted/20 border-t border-border/60">
            <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
              <div className="text-center max-w-2xl mx-auto space-y-2">
                <span className="text-xs font-black uppercase tracking-wider text-primary font-mono">
                  QUESTIONS &amp; ANSWERS
                </span>
                <h2 className="text-3xl font-black text-foreground">Frequently Asked Questions</h2>
              </div>

              <div className="space-y-3 max-w-3xl mx-auto">
                {course.faqs.map((faq, i) => {
                  const isOpen = openFaqIndex === i;
                  return (
                    <div
                      key={i}
                      className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs"
                    >
                      <button
                        onClick={() => toggleFaq(i)}
                        className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm text-foreground hover:bg-muted/30 transition-colors"
                      >
                        <span>{faq.question}</span>
                        {isOpen ? (
                          <ChevronUp size={18} className="text-primary shrink-0" />
                        ) : (
                          <ChevronDown size={18} className="text-muted-foreground shrink-0" />
                        )}
                      </button>

                      {isOpen && (
                        <div className="px-5 pb-5 text-xs text-muted-foreground leading-relaxed border-t border-border/60 pt-3">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </main>

        <HomepageFooter />
      </div>
    </PageTransitionWrapper>
  );
}
