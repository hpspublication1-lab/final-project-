'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Stethoscope,
  GraduationCap,
  Cog,
  Landmark,
  BookOpen,
  Globe,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Clock,
  Layers
} from 'lucide-react';

interface AcademicProgram {
  id: string;
  category: 'medical' | 'board' | 'engineering' | 'civil_service' | 'skills';
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  badge: string;
  badgeStyle: string;
  title: string;
  subtitle: string;
  description: string;
  highlights: string[];
  duration: string;
  priceNpr: number;
  exploreHref: string;
  checkoutHref: string;
  isPopular?: boolean;
}

const PROGRAMS: AcademicProgram[] = [
  {
    id: 'cee-medical',
    category: 'medical',
    icon: Stethoscope,
    iconBg: 'bg-primary/10 border-primary/20',
    iconColor: 'text-primary',
    badge: 'FLAGSHIP · MECEE 2026',
    badgeStyle: 'bg-primary/10 text-primary border-primary/20',
    title: 'CEE Medical Entrance',
    subtitle: 'MBBS / BDS / B.Sc Nursing / B.Pharm',
    description: 'Authentic 200-question timed CBT exam simulation with -0.25 negative marking, 15,000+ topicwise MCQs, and high-yield clinical mnemonics.',
    highlights: [
      '200Q Timed CBT with exact MEC blueprint',
      '15,000+ MCQs with step-by-step rationales',
      'Daily live batches & recorded HD lecture vault',
      '24/7 AI Medical Doubt Saarthi & Mistake Log'
    ],
    duration: '180 Days Full Batch',
    priceNpr: 7990,
    exploreHref: '/cee-medical-entrance',
    checkoutHref: '/checkout?plan=cee-mbbs-mastery-2026',
    isPopular: true,
  },
  {
    id: 'see-class-10',
    category: 'board',
    icon: GraduationCap,
    iconBg: 'bg-emerald-500/10 border-emerald-500/20',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    badge: 'CDC BOARD EXAM · GPA 4.0',
    badgeStyle: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    title: 'SEE Class 10 Board Topper',
    subtitle: 'Science, Comp Math, Opt Math, English & Social',
    description: 'Comprehensive board preparation based on official CDC Nepal rubrics. Includes 10-year past solved papers with 1, 2, 3, and 4 mark scoring steps.',
    highlights: [
      '10-Year Solved Board Papers with marking rubrics',
      'Daily live interactive batches with senior teachers',
      'AI Handwritten Answer Evaluator for math & science',
      'Chapter revision sheets & formula summary cards'
    ],
    duration: '365 Days Academic Year',
    priceNpr: 4990,
    exploreHref: '/see',
    checkoutHref: '/checkout?plan=see-class-10-board-topper-batch',
    isPopular: true,
  },
  {
    id: 'ioe-engineering',
    category: 'engineering',
    icon: Cog,
    iconBg: 'bg-blue-500/10 border-blue-500/20',
    iconColor: 'text-blue-600 dark:text-blue-400',
    badge: 'TU PULCHOWK & KU · 140M CBT',
    badgeStyle: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    title: 'IOE / BE Engineering',
    subtitle: 'TU Pulchowk, KU, PoU & PU Entrance',
    description: 'Master higher-level Math, Physics, Chemistry, and English under strict 140-mark computer-based exam conditions.',
    highlights: [
      '140-Mark timed CBT entrance simulations',
      'Comprehensive calculus, mechanics & algebra modules',
      'Previous 15-year IOE questions solved with tricks',
      'Weekly national rank & percentile benchmarking'
    ],
    duration: '120 Days Intensive',
    priceNpr: 6990,
    exploreHref: '/courses?track=ioe_engineering',
    checkoutHref: '/checkout?plan=ioe-engineering-entrance-2026',
  },
  {
    id: 'lok-sewa',
    category: 'civil_service',
    icon: Landmark,
    iconBg: 'bg-amber-500/10 border-amber-500/20',
    iconColor: 'text-amber-600 dark:text-amber-400',
    badge: 'PUBLIC SERVICE COMMISSION',
    badgeStyle: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    title: 'Lok Sewa Aayog (PSC)',
    subtitle: 'Kharidar, Nayab Subba & Section Officer',
    description: 'Comprehensive first-paper General Knowledge (GK) and Intelligence Quotient (IQ) preparation with continuous daily current affairs updates.',
    highlights: [
      '5,000+ GK & IQ questions with nepali translations',
      'Daily current affairs bulletins & monthly digests',
      'Timed First Paper mock tests with instant negative scoring',
      'Constitution & administrative law summary capsules'
    ],
    duration: '180 Days Access',
    priceNpr: 4490,
    exploreHref: '/courses?track=lok_sewa',
    checkoutHref: '/checkout?plan=lok-sewa-aayog-preparation-2082',
  },
  {
    id: 'neb-class-11-12',
    category: 'board',
    icon: BookOpen,
    iconBg: 'bg-indigo-500/10 border-indigo-500/20',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    badge: 'NEB SCIENCE FOUNDATION',
    badgeStyle: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
    title: 'NEB Class 11 & 12 Science',
    subtitle: 'Physics, Chemistry, Biology & Mathematics',
    description: 'Dual-target preparation aligning NEB board exam theoretical derivations with early entrance MCQ foundations for medical and engineering.',
    highlights: [
      'Complete chapter derivations & numerical mastery',
      'Dual-mode practice: Board subjective + Entrance MCQs',
      'Step-by-step NCERT & NEB textbook solutions',
      'Concept booster videos and chapter test series'
    ],
    duration: 'Full Academic Year',
    priceNpr: 5490,
    exploreHref: '/courses?track=neb_11_12',
    checkoutHref: '/checkout?plan=neb-class-12-board-topper-batch',
  },
  {
    id: 'ielts-skills',
    category: 'skills',
    icon: Globe,
    iconBg: 'bg-purple-500/10 border-purple-500/20',
    iconColor: 'text-purple-600 dark:text-purple-400',
    badge: 'LANGUAGE & CAREER MASTERY',
    badgeStyle: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    title: 'IELTS Academic & AI Tech',
    subtitle: 'Target Band 8.0+ & Python Coding',
    description: 'Specialized masterclasses in IELTS Speaking & Writing with AI band descriptors, alongside modern Python programming and digital skills.',
    highlights: [
      'AI Speaking simulator modeled on Cambridge descriptors',
      'Real-time automated writing grammar & vocabulary grading',
      'Python coding for absolute beginners to automation',
      'International certificate upon verified completion'
    ],
    duration: '90 Days Fast-Track',
    priceNpr: 3990,
    exploreHref: '/english',
    checkoutHref: '/checkout?plan=english-ielts-target-8-mastery',
  },
];

export default function AcademicProgramsSection() {
  const [activeFilter, setActiveFilter] = useState<'all' | 'medical' | 'board' | 'engineering' | 'civil_service' | 'skills'>('all');

  const filteredPrograms = PROGRAMS.filter(
    (p) => activeFilter === 'all' || p.category === activeFilter
  );

  return (
    <section id="programs" aria-label="Academic Programs" className="py-20 sm:py-28 bg-muted/20 border-t border-border/60 relative overflow-hidden">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-bold tracking-wide">
            <Sparkles size={14} />
            <span>STRUCTURED ACADEMIC PROGRAMS · 2082 / 2026</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight">
            Curriculum Engineered for Top Results
          </h2>

          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed font-medium">
            Choose your learning track below. Every program is strictly mapped to official syllabus guidelines, packed with verified questions, live faculty support, and timed exam environments.
          </p>

          {/* Filter Pills */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-2">
            {[
              { id: 'all', label: 'All Programs' },
              { id: 'medical', label: 'Medical (CEE)' },
              { id: 'board', label: 'Board Exams (SEE & NEB)' },
              { id: 'engineering', label: 'Engineering (IOE)' },
              { id: 'civil_service', label: 'Civil Service (Lok Sewa)' },
              { id: 'skills', label: 'Career & Skills' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeFilter === tab.id
                    ? 'bg-primary text-white shadow-xs'
                    : 'bg-card border border-border/80 text-muted-foreground hover:text-foreground hover:border-primary/40'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 2-Column or 3-Column Responsive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto items-stretch">
          {filteredPrograms.map((program) => {
            const Icon = program.icon;
            return (
              <div
                key={program.id}
                className={`bg-card rounded-3xl p-6 sm:p-7 border transition-all duration-300 flex flex-col justify-between group relative ${
                  program.isPopular
                    ? 'border-primary/50 shadow-md hover:shadow-xl'
                    : 'border-border/80 hover:border-primary/40 shadow-xs hover:shadow-md'
                }`}
              >
                {/* Popular Pill */}
                {program.isPopular && (
                  <span className="absolute -top-3 right-6 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-primary text-white shadow-xs">
                    Most Popular
                  </span>
                )}

                <div className="space-y-4">
                  {/* Category Badge & Icon */}
                  <div className="flex items-center justify-between">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${program.iconBg}`}>
                      <Icon className={`w-6 h-6 ${program.iconColor}`} />
                    </div>
                    <span className={`text-[10px] font-mono font-bold uppercase px-3 py-1 rounded-full border ${program.badgeStyle}`}>
                      {program.badge}
                    </span>
                  </div>

                  {/* Title & Subtitle */}
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black text-foreground group-hover:text-primary transition-colors">
                      {program.title}
                    </h3>
                    <p className="text-xs font-semibold text-muted-foreground mt-0.5">
                      {program.subtitle}
                    </p>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                    {program.description}
                  </p>

                  {/* Highlights */}
                  <ul className="space-y-2.5 pt-3 border-t border-border/60">
                    {program.highlights.map((item, idx) => (
                      <li key={idx} className="text-xs text-foreground/85 flex items-start gap-2.5 font-medium">
                        <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Footer Pricing & CTA */}
                <div className="pt-6 mt-6 border-t border-border/60 space-y-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-muted-foreground font-semibold">
                      Full Enrollment ({program.duration}):
                    </span>
                    <span className="text-lg font-black text-foreground font-mono">
                      NPR {program.priceNpr.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <Link
                      href={program.exploreHref}
                      className="py-2.5 px-3 rounded-xl bg-muted/60 hover:bg-muted text-foreground font-bold text-xs text-center border border-border/80 transition-all flex items-center justify-center gap-1"
                    >
                      <span>Explore</span>
                      <ArrowRight size={12} />
                    </Link>
                    <Link
                      href={program.checkoutHref}
                      className="py-2.5 px-3 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs text-center shadow-xs transition-all flex items-center justify-center gap-1"
                    >
                      <span>Enroll Now</span>
                    </Link>
                  </div>
                </div>

              </div>
            );
          })}
        </div>

        {/* Bottom Catalog Link */}
        <div className="pt-10 text-center">
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-primary hover:underline"
          >
            <span>Compare detailed batch schedules, syllabus rubrics &amp; faculty profiles in the Master Course Catalog</span>
            <ArrowRight size={14} />
          </Link>
        </div>

      </div>
    </section>
  );
}
