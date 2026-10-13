'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  useProgram,
  CanonicalCourseId,
  COURSES_MAP,
} from '@/contexts/ProgramContext';
import { CourseTrack, getCourseBySlug } from '@/lib/courses/catalog';
import {
  Compass,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  X,
  BookOpen,
  Layers,
  ShieldCheck,
} from 'lucide-react';

interface GateOption {
  programId: CanonicalCourseId;
  catalogTrack: CourseTrack;
  courseSlug: string;
  icon: string;
  title: string;
  subtitle: string;
  badge: string;
  isNew?: boolean;
  accentBg: string;
  accentBorder: string;
  accentText: string;
}

export const COURSE_GATE_OPTIONS: GateOption[] = [
  {
    programId: 'cee_medical',
    catalogTrack: 'cee_medical',
    courseSlug: 'cee-mbbs-mastery-2026',
    icon: '🩺',
    title: 'CEE Medical Entrance',
    subtitle: 'MBBS, BDS & B.Sc Nursing (MECEE 2026)',
    badge: 'Flagship Medical',
    accentBg: 'bg-indigo-500/10',
    accentBorder: 'border-indigo-500/40',
    accentText: 'text-indigo-600 dark:text-indigo-400',
  },
  {
    programId: 'ioe_engineering',
    catalogTrack: 'ioe_engineering',
    courseSlug: 'ioe-engineering-entrance-2026',
    icon: '⚙️',
    title: 'IOE / BE Engineering',
    subtitle: 'TU Pulchowk, KU & PU 140-Mark CBT Prep',
    badge: 'NEW · Engineering',
    isNew: true,
    accentBg: 'bg-blue-500/10',
    accentBorder: 'border-blue-500/40',
    accentText: 'text-blue-600 dark:text-blue-400',
  },
  {
    programId: 'lok_sewa',
    catalogTrack: 'lok_sewa',
    courseSlug: 'lok-sewa-aayog-preparation-2082',
    icon: '🏛️',
    title: 'Lok Sewa Aayog (PSC)',
    subtitle: 'Kharidar, Nayab Subba & Officer (GK + IQ)',
    badge: 'NEW · Civil Service',
    isNew: true,
    accentBg: 'bg-orange-500/10',
    accentBorder: 'border-orange-500/40',
    accentText: 'text-orange-600 dark:text-orange-400',
  },
  {
    programId: 'neb_class_12',
    catalogTrack: 'neb_11_12',
    courseSlug: 'neb-class-12-board-topper-batch',
    icon: '📘',
    title: 'NEB Class 12 Science',
    subtitle: 'Grade 12 Board Topper + Entrance Bridge',
    badge: 'NEW · Grade 12',
    isNew: true,
    accentBg: 'bg-cyan-500/10',
    accentBorder: 'border-cyan-500/40',
    accentText: 'text-cyan-600 dark:text-cyan-400',
  },
  {
    programId: 'neb_class_11',
    catalogTrack: 'neb_11_12',
    courseSlug: 'neb-class-11-science-mastery',
    icon: '📗',
    title: 'NEB Class 11 Science',
    subtitle: 'Grade 11 Physics, Chem, Math & Bio Foundation',
    badge: 'NEW · Grade 11',
    isNew: true,
    accentBg: 'bg-teal-500/10',
    accentBorder: 'border-teal-500/40',
    accentText: 'text-teal-600 dark:text-teal-400',
  },
  {
    programId: 'see_class_10',
    catalogTrack: 'see_class_10',
    courseSlug: 'see-class-10-board-topper-batch',
    icon: '🎓',
    title: 'SEE Class 10 Board',
    subtitle: 'Target 4.0 GPA Complete NEB Grade 10 Batch',
    badge: 'Grade 10 Board',
    accentBg: 'bg-emerald-500/10',
    accentBorder: 'border-emerald-500/40',
    accentText: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    programId: 'ielts',
    catalogTrack: 'skills_languages',
    courseSlug: 'english-ielts-target-8-mastery',
    icon: '🌐',
    title: 'IELTS & Spoken English',
    subtitle: 'Target Band 8.0+ Academic & General Pass',
    badge: 'Language Mastery',
    accentBg: 'bg-amber-500/10',
    accentBorder: 'border-amber-500/40',
    accentText: 'text-amber-600 dark:text-amber-400',
  },
  {
    programId: 'artificial_intelligence',
    catalogTrack: 'skills_languages',
    courseSlug: 'digital-python-programming-zero-to-hero',
    icon: '💻',
    title: 'AI, Python & Digital Skills',
    subtitle: 'Prompt Engineering, Coding & Freelancing',
    badge: 'Career & Tech',
    accentBg: 'bg-purple-500/10',
    accentBorder: 'border-purple-500/40',
    accentText: 'text-purple-600 dark:text-purple-400',
  },
];

interface CourseSelectionGateProps {
  /** Optional callback fired when a user picks a course track in the gate */
  onSelectTrack?: (track: 'all' | CourseTrack, courseSlug?: string) => void;
  /** Whether to auto-prompt on first visit if no course has been selected yet */
  autoOpenOnFirstVisit?: boolean;
}

export default function CourseSelectionGate({
  onSelectTrack,
  autoOpenOnFirstVisit = true,
}: CourseSelectionGateProps) {
  const { program, setProgram } = useProgram();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeOption, setActiveOption] = useState<GateOption>(
    () =>
      COURSE_GATE_OPTIONS.find((o) => o.programId === program) ||
      COURSE_GATE_OPTIONS[0]
  );

  useEffect(() => {
    const matched = COURSE_GATE_OPTIONS.find((o) => o.programId === program);
    if (matched) {
      setActiveOption(matched);
    }
  }, [program]);

  useEffect(() => {
    if (!autoOpenOnFirstVisit || typeof window === 'undefined') return;
    const completed = localStorage.getItem('samyak_course_gate_completed');
    if (!completed) {
      setIsModalOpen(true);
    }
  }, [autoOpenOnFirstVisit]);

  const handleConfirmSelection = (opt: GateOption, filterCatalog = true) => {
    setActiveOption(opt);
    setProgram(opt.programId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('samyak_course_gate_completed', 'true');
    }
    if (filterCatalog && onSelectTrack) {
      onSelectTrack(opt.catalogTrack, opt.courseSlug);
    }
    setIsModalOpen(false);
  };

  const handleBrowseAll = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('samyak_course_gate_completed', 'true');
    }
    if (onSelectTrack) {
      onSelectTrack('all');
    }
    setIsModalOpen(false);
  };

  const selectedCourseRecord = getCourseBySlug(activeOption.courseSlug);
  const selectedProgramDetails = COURSES_MAP[activeOption.programId];

  return (
    <>
      {/* Inline Interactive Course Gate Banner */}
      <section
        aria-label="Course Selection Gate"
        className="bg-card border-2 border-primary/25 rounded-3xl p-5 sm:p-7 shadow-sm space-y-5"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border/60 pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-xs font-mono font-black uppercase text-primary">
              <Compass size={15} />
              <span>STEP 1 · CHOOSE YOUR LEARNING GATE</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-foreground">
              What course do you want to continue learning first?
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Select your target exam or grade stream below to personalize your curriculum, sample questions, and study batches.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 text-xs font-black flex items-center gap-1.5 transition-all"
            >
              <Sparkles size={14} />
              <span>Open Full Course Gate</span>
            </button>
            {onSelectTrack && (
              <button
                type="button"
                onClick={handleBrowseAll}
                className="px-4 py-2.5 rounded-2xl bg-muted hover:bg-muted/80 text-foreground text-xs font-bold transition-all"
              >
                Show All 12 Courses
              </button>
            )}
          </div>
        </div>

        {/* 8 Stream Quick-Gate Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {COURSE_GATE_OPTIONS.map((opt) => {
            const isSelected = activeOption.programId === opt.programId;
            return (
              <button
                key={opt.programId}
                type="button"
                onClick={() => handleConfirmSelection(opt, true)}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between gap-2 relative ${
                  isSelected
                    ? `${opt.accentBg} ${opt.accentBorder} ring-2 ring-primary shadow-sm`
                    : 'bg-muted/30 border-border/70 hover:bg-muted/60 hover:border-border'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-2xl">{opt.icon}</span>
                  {opt.isNew && (
                    <span className="text-[9px] font-mono font-black uppercase px-1.5 py-0.5 rounded bg-emerald-500 text-white">
                      NEW
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-xs font-extrabold text-foreground block leading-tight">
                    {opt.title}
                  </span>
                  <span className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5 block">
                    {opt.subtitle}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Selected Course Spotlight Bar */}
        {selectedCourseRecord && (
          <div className="p-4 sm:p-5 rounded-2xl bg-muted/40 border border-border/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-mono font-black uppercase px-2.5 py-0.5 rounded-md bg-primary text-white">
                  ACTIVE GOAL: {activeOption.title}
                </span>
                <span className="text-xs font-bold text-foreground">
                  {selectedCourseRecord.title}
                </span>
                <span className="text-xs font-mono font-bold text-emerald-600">
                  NPR {selectedCourseRecord.priceNpr.toLocaleString()} ({selectedCourseRecord.validityText})
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Covers{' '}
                <strong className="text-foreground">
                  {selectedCourseRecord.subjects.map((s) => s.name).join(', ')}
                </strong>{' '}
                · Lead Faculty:{' '}
                <strong className="text-foreground">
                  {selectedCourseRecord.faculty.map((f) => f.name).join(', ')}
                </strong>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <Link
                href={`/courses/${selectedCourseRecord.slug}`}
                className="px-4 py-2.5 rounded-xl bg-card hover:bg-muted border border-border text-foreground font-bold text-xs flex items-center gap-1.5 transition-all"
              >
                <BookOpen size={13} />
                <span>Continue to Course &amp; Sample</span>
              </Link>
              <Link
                href={selectedCourseRecord.enrollPath}
                className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-black text-xs flex items-center gap-1.5 shadow-sm transition-all"
              >
                <span>Enroll Now</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* Full-Screen / Modal Course Selection Gate */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Choose Your Course Gate"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto"
        >
          <div className="bg-card border border-border rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-8 relative">
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  localStorage.setItem('samyak_course_gate_completed', 'true');
                }
                setIsModalOpen(false);
              }}
              aria-label="Close course selection gate"
              className="absolute top-5 right-5 p-2 rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={18} />
            </button>

            <div className="space-y-2 pr-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-wider">
                <Compass size={14} />
                <span>Welcome to Samyak Guru · Learning Gate</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                Which course do you want to continue learning first?
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Pick your primary academic board, entrance exam, or civil service track. You can switch your active learning goal anytime with one click.
              </p>
            </div>

            {/* Grid of 8 Course Streams */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {COURSE_GATE_OPTIONS.map((opt) => {
                const isSelected = activeOption.programId === opt.programId;
                const cRecord = getCourseBySlug(opt.courseSlug);
                return (
                  <button
                    key={opt.programId}
                    type="button"
                    onClick={() => setActiveOption(opt)}
                    className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between gap-3 ${
                      isSelected
                        ? `${opt.accentBg} ${opt.accentBorder} ring-2 ring-primary shadow-md`
                        : 'bg-muted/20 border-border hover:bg-muted/50'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl">{opt.icon}</span>
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${
                            opt.isNew
                              ? 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {opt.badge}
                        </span>
                      </div>
                      <h3 className="text-sm font-black text-foreground">{opt.title}</h3>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        {opt.subtitle}
                      </p>
                    </div>

                    {cRecord && (
                      <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px]">
                        <span className="font-bold text-foreground">
                          NPR {cRecord.priceNpr.toLocaleString()}
                        </span>
                        <span className="text-muted-foreground">{cRecord.validityDays} Days</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Selected Option Preview Footer inside Modal */}
            {selectedCourseRecord && selectedProgramDetails && (
              <div className="p-5 rounded-2xl bg-muted/40 border border-border space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase text-primary">
                      SELECTED STREAM PREVIEW
                    </span>
                    <h4 className="text-base font-black text-foreground">
                      {selectedCourseRecord.title}
                    </h4>
                  </div>
                  <span className="text-sm font-black text-foreground font-mono">
                    NPR {selectedCourseRecord.priceNpr.toLocaleString()} ·{' '}
                    {selectedCourseRecord.validityText}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {selectedCourseRecord.subjects.map((sub, i) => (
                    <span
                      key={i}
                      className="text-xs px-2.5 py-1 rounded-lg bg-card border border-border/80 text-foreground font-medium"
                    >
                      {sub.icon} {sub.name} ({sub.chaptersCount} Chapters)
                    </span>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-border/60">
                  <button
                    type="button"
                    onClick={handleBrowseAll}
                    className="text-xs font-bold text-muted-foreground hover:text-foreground underline"
                  >
                    Browse All 12 Courses Without Filtering
                  </button>

                  <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
                    <button
                      type="button"
                      onClick={() => handleConfirmSelection(activeOption, true)}
                      className="px-5 py-3 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-bold text-xs transition-all"
                    >
                      Filter Catalogue to {activeOption.title}
                    </button>

                    <Link
                      href={`/courses/${selectedCourseRecord.slug}`}
                      onClick={() => handleConfirmSelection(activeOption, false)}
                      className="px-6 py-3 rounded-xl bg-primary hover:bg-primary-dark text-white font-black text-xs flex items-center gap-1.5 shadow-md transition-all"
                    >
                      <span>Start / Preview {activeOption.title}</span>
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
