'use client';

import React, { use, useState } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import PublicNav from '@/components/PublicNav';
import HomepageFooter from '@/app/components/HomepageFooter';
import { getCourseBySlug } from '@/lib/courses/catalog';
import {
  CheckCircle2,
  Clock,
  BookOpen,
  ShieldCheck,
  ArrowRight,
  AlertTriangle,
  Sparkles,
  Check,
  XCircle,
  Layers,
  Lock,
  Info,
} from 'lucide-react';
import { SubjectIcon } from '@/components/ui';

export default function CourseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const course = getCourseBySlug(resolvedParams.slug);

  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  if (!course) {
    notFound();
  }

  const isSee = course.track === 'see_class_10';
  const isCee = course.track === 'cee_medical';
  const totalChapters = course.subjects.reduce((sum, s) => sum + s.chaptersCount, 0);
  const sampleQ = course.demoLesson.sampleQuestion;

  const formatBadgeStyle =
    course.courseFormat === 'live_batch'
      ? 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20'
      : course.courseFormat === 'crash_course'
      ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
      : course.courseFormat === 'subject_course'
      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
      : 'bg-sky-500/10 text-sky-600 border-sky-500/20';

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <PublicNav />

      <main className="flex-1 pt-28 sm:pt-36 pb-20">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 space-y-14">

          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
            <Link href="/courses" className="hover:text-foreground transition-colors">
              Course Catalogue
            </Link>
            <span>/</span>
            <span className="text-foreground font-bold truncate">{course.title}</span>
          </nav>

          {/* 1. Header Hero Card */}
          <div className="bg-card border border-border/80 rounded-3xl p-6 sm:p-10 shadow-sm relative overflow-hidden">
            <div className="max-w-4xl space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`text-xs font-mono font-black uppercase px-3 py-1 rounded-lg border ${
                    isSee
                      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                      : isCee
                      ? 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20'
                      : 'bg-primary/10 text-primary border-primary/20'
                  }`}
                >
                  {course.badge}
                </span>
                <span className={`text-xs font-bold px-3 py-1 rounded-lg border ${formatBadgeStyle}`}>
                  {course.formatLabel}
                </span>
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1 px-2.5 py-1 rounded-lg bg-muted/60">
                  <Clock size={13} />
                  <span>{course.validityText} ({course.validityDays} Days)</span>
                </span>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-muted text-foreground">
                  Medium: {course.languageMedium}
                </span>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-muted text-foreground">
                  {totalChapters} Chapters / Units
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold text-foreground tracking-tight leading-tight">
                {course.title}
              </h1>

              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-3xl">
                {course.description}
              </p>

              {/* Target & Exam Outcome */}
              <div className="grid sm:grid-cols-2 gap-4 pt-2 max-w-3xl">
                <div className="p-4 rounded-2xl bg-muted/30 border border-border/60">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                    🎯 Student Target
                  </span>
                  <p className="text-xs sm:text-sm font-semibold text-foreground">
                    {course.targetStudent}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-muted/30 border border-border/60">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                    🏆 Exam &amp; Outcome Goal
                  </span>
                  <p className="text-xs sm:text-sm font-semibold text-foreground">
                    {course.examOutcome}
                  </p>
                </div>
              </div>

              {/* Pricing, Payable Breakdown & Primary Action */}
              <div className="pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-t border-border/60">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground block font-medium">
                    Full Program Tuition (Payable Now: NPR {course.priceNpr.toLocaleString()} · Balance Later: NPR 0)
                  </span>
                  <div className="flex items-baseline gap-2.5">
                    <span className="text-3xl font-black text-foreground">
                      NPR {course.priceNpr.toLocaleString()}
                    </span>
                    {course.originalPriceNpr && (
                      <span className="text-sm text-muted-foreground line-through">
                        NPR {course.originalPriceNpr.toLocaleString()}
                      </span>
                    )}
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                      One-Time Payment
                    </span>
                  </div>
                  {course.depositNpr && (
                    <p className="text-xs text-amber-600 font-semibold pt-1">
                      Optional Seat Deposit Available: Pay NPR {course.depositNpr.toLocaleString()} now + NPR{' '}
                      {(course.priceNpr - course.depositNpr).toLocaleString()} within 7 days of batch launch.
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href={course.enrollPath}
                    className="btn-primary text-sm sm:text-base font-bold py-4 px-7 rounded-2xl shadow-lg flex items-center gap-2"
                  >
                    <span>{course.primaryCtaText}</span>
                    <ArrowRight size={16} />
                  </Link>

                  {course.depositNpr && (
                    <Link
                      href="/checkout?plan=cee-crash-course-deposit"
                      className="btn-secondary text-xs sm:text-sm font-bold py-4 px-5 rounded-2xl border border-amber-500/40 text-amber-600 hover:bg-amber-500/10 transition-all"
                    >
                      Pre-book Seat (NPR {course.depositNpr})
                    </Link>
                  )}
                </div>
              </div>

              {/* Refund Terms Banner */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5 font-medium">
                  <ShieldCheck size={16} className="text-emerald-500 shrink-0" />
                  <span>{course.refundRules}</span>
                </div>
                <Link href="/refund" className="text-primary font-bold hover:underline">
                  Read Full Refund &amp; Cancellation Policy →
                </Link>
              </div>
            </div>
          </div>

          {/* 2-Column Details: Left Content, Right Sticky Schedule & Highlights */}
          <div className="grid lg:grid-cols-12 gap-10">

            {/* Left 8 Cols: Subjects, Interactive Sample Preview, Curriculum, Prerequisites, Limits, Faculty & FAQs */}
            <div className="lg:col-span-8 space-y-10">

              {/* Teaching Asset & Delivery Readiness Status */}
              <section
                aria-label="Teaching Asset Readiness"
                className={`rounded-2xl p-5 border flex items-start gap-3.5 ${
                  course.teachingAssetStatus.status === 'ready'
                    ? 'bg-emerald-500/5 border-emerald-500/20'
                    : 'bg-amber-500/5 border-amber-500/30'
                }`}
              >
                {course.teachingAssetStatus.status === 'ready' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1 text-xs sm:text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-foreground">
                      Delivery &amp; Teaching Asset Status:
                    </span>
                    <span
                      className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded-md ${
                        course.teachingAssetStatus.status === 'ready'
                          ? 'bg-emerald-500/10 text-emerald-600'
                          : 'bg-amber-500/15 text-amber-600'
                      }`}
                    >
                      {course.teachingAssetStatus.status === 'ready'
                        ? 'All Assets Ready'
                        : 'Active LMS + Scheduled Live/VOD Provisioning'}
                    </span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    {course.teachingAssetStatus.summary}
                  </p>
                  {course.teachingAssetStatus.blockerNote && (
                    <p className="text-xs text-amber-700 dark:text-amber-400 font-medium pt-1">
                      Note: {course.teachingAssetStatus.blockerNote}
                    </p>
                  )}
                </div>
              </section>

              {/* Subjects & Chapter Coverage */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-foreground">
                    Subjects &amp; Chapter Coverage
                  </h2>
                  <span className="text-xs font-bold text-muted-foreground bg-muted px-3 py-1 rounded-lg">
                    {course.subjects.length} Subjects · {totalChapters} Total Chapters
                  </span>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  {course.subjects.map((sub, sIdx) => (
                    <div
                      key={sIdx}
                      className="p-4 rounded-2xl bg-card border border-border/80 flex items-center gap-3"
                    >
                      <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
                        <SubjectIcon name={sub.icon} size={20} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-foreground">{sub.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {sub.chaptersCount} Chapters / Units Included
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Interactive Sample Lesson & Question Preview */}
              <section className="space-y-4">
                <h2 className="text-2xl font-bold text-foreground">
                  Sample Lesson &amp; Interactive Question Preview
                </h2>
                <div className="bg-card border-2 border-primary/20 rounded-3xl p-6 sm:p-7 space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold px-3 py-1 rounded-lg bg-primary/10 text-primary">
                      FREE SAMPLE LESSON · {course.demoLesson.subject}
                    </span>
                    <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                      <Sparkles size={13} />
                      <span>Unlocked Preview</span>
                    </span>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-foreground">
                      {course.demoLesson.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {course.demoLesson.summary}
                    </p>
                  </div>

                  {sampleQ && (
                    <div className="p-5 rounded-2xl bg-muted/40 border border-border/80 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono font-bold uppercase text-primary">
                          Try Sample Practice Question
                        </span>
                        {selectedOption !== null && (
                          <button
                            type="button"
                            onClick={() => setSelectedOption(null)}
                            className="text-xs font-semibold text-muted-foreground hover:text-foreground underline"
                          >
                            Reset Question
                          </button>
                        )}
                      </div>

                      <p className="text-sm font-bold text-foreground leading-snug">
                        {sampleQ.stem}
                      </p>

                      <div className="grid sm:grid-cols-2 gap-2.5">
                        {sampleQ.options.map((opt, idx) => {
                          const isSelected = selectedOption === idx;
                          const isCorrect = idx === sampleQ.answerIndex;
                          const showFeedback = selectedOption !== null;

                          let btnClass =
                            'bg-card border-border/80 text-foreground hover:border-primary/60';
                          if (showFeedback) {
                            if (isCorrect) {
                              btnClass =
                                'bg-emerald-500/10 border-emerald-500/50 text-emerald-700 dark:text-emerald-300 font-bold';
                            } else if (isSelected && !isCorrect) {
                              btnClass =
                                'bg-rose-500/10 border-rose-500/50 text-rose-700 dark:text-rose-300';
                            } else {
                              btnClass = 'bg-card/50 border-border/40 text-muted-foreground opacity-70';
                            }
                          }

                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setSelectedOption(idx)}
                              className={`text-left text-xs sm:text-sm p-3.5 rounded-xl border transition-all flex items-center justify-between gap-2 ${btnClass}`}
                            >
                              <span>
                                <strong className="mr-1.5">
                                  {String.fromCharCode(65 + idx)}.
                                </strong>
                                {opt}
                              </span>
                              {showFeedback && isCorrect && (
                                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                              )}
                              {showFeedback && isSelected && !isCorrect && (
                                <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {selectedOption !== null && (
                        <div
                          className={`p-4 rounded-xl text-xs leading-relaxed border ${
                            selectedOption === sampleQ.answerIndex
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-foreground'
                              : 'bg-amber-500/10 border-amber-500/30 text-foreground'
                          }`}
                        >
                          <p className="font-bold mb-1">
                            {selectedOption === sampleQ.answerIndex
                              ? '✓ Correct Answer!'
                              : `✗ Not quite — Correct Answer is ${String.fromCharCode(
                                  65 + sampleQ.answerIndex
                                )}.`}
                          </p>
                          <p className="text-muted-foreground">{sampleQ.explanation}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </section>

              {/* Detailed Curriculum */}
              <section className="space-y-4">
                <h2 className="text-2xl font-bold text-foreground">Curriculum Outline</h2>
                <div className="space-y-3">
                  {course.curriculum.map((mod, mIdx) => (
                    <div
                      key={mIdx}
                      className="bg-card border border-border/80 rounded-2xl p-5 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm sm:text-base font-bold text-foreground">
                          {mod.moduleTitle}
                        </h3>
                        <span className="text-xs font-medium text-muted-foreground">
                          {mod.topicsCount} Key Topics
                        </span>
                      </div>
                      <ul className="grid sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
                        {mod.topics.map((t, tIdx) => (
                          <li key={tIdx} className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                            <span>{t}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>

              {/* Prerequisites & Feature Limits */}
              <section className="grid sm:grid-cols-2 gap-6">
                <div className="bg-card border border-border/80 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-primary" />
                    <h2 className="text-base font-bold text-foreground">
                      Prerequisites &amp; Requirements
                    </h2>
                  </div>
                  <ul className="space-y-2 text-xs text-muted-foreground">
                    {course.prerequisites.map((req, rIdx) => (
                      <li key={rIdx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-card border border-border/80 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-amber-500" />
                    <h2 className="text-base font-bold text-foreground">
                      Plan Scope &amp; Feature Limits
                    </h2>
                  </div>
                  <ul className="space-y-2 text-xs text-muted-foreground">
                    {course.featureLimits.map((lim, lIdx) => (
                      <li key={lIdx} className="flex items-start gap-2">
                        <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <span>{lim}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>

              {/* Verified Faculty */}
              <section className="space-y-4">
                <h2 className="text-2xl font-bold text-foreground">
                  Academic Faculty &amp; Mentors
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {course.faculty.map((f, fIdx) => (
                    <div
                      key={fIdx}
                      className="p-5 rounded-2xl bg-card border border-border/80 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-base font-bold text-foreground">{f.name}</h3>
                        {f.verified ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                            Verified Faculty
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-500/10 text-sky-600 border border-sky-500/20">
                            AI Coaching Engine
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-primary">{f.role}</p>
                      <p className="text-xs text-muted-foreground">{f.qualification}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* FAQs */}
              <section className="space-y-4">
                <h2 className="text-2xl font-bold text-foreground">
                  Frequently Asked Questions
                </h2>
                <div className="space-y-3">
                  {course.faqs.map((faq, qIdx) => (
                    <div
                      key={qIdx}
                      className="bg-card border border-border/80 rounded-2xl p-5 space-y-2"
                    >
                      <h3 className="text-sm sm:text-base font-bold text-foreground">{faq.q}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        {faq.a}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Right 4 Cols: Sticky Batch Schedule & Features Card */}
            <div className="lg:col-span-4 space-y-6">
              <div className="sticky top-28 bg-card border border-border/80 rounded-3xl p-6 sm:p-7 shadow-sm space-y-6">
                <div className="space-y-1">
                  <span className={`inline-block text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-md border ${formatBadgeStyle}`}>
                    {course.formatLabel}
                  </span>
                  <h3 className="text-lg font-bold text-foreground pt-1">
                    Delivery &amp; Schedule
                  </h3>
                  <p className="text-xs text-muted-foreground">{course.batchSchedule.batchName}</p>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/60 space-y-1">
                    <span className="font-bold text-foreground block">📅 Start Date / Activation:</span>
                    <span className="text-muted-foreground">{course.batchSchedule.startDate}</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/60 space-y-1">
                    <span className="font-bold text-foreground block">🕒 Delivery Schedule:</span>
                    <span className="text-muted-foreground">{course.batchSchedule.liveSchedule}</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/60 space-y-1">
                    <span className="font-bold text-foreground block">⏳ Access Validity:</span>
                    <span className="text-emerald-600 font-semibold">
                      {course.validityText} ({course.validityDays} Days from enrollment)
                    </span>
                  </div>
                </div>

                {/* Features Included */}
                <div className="space-y-2.5 pt-2 border-t border-border/60">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                    What&apos;s Included:
                  </span>
                  <ul className="space-y-2">
                    {course.includedFeatures.map((feat, ftIdx) => (
                      <li
                        key={ftIdx}
                        className="text-xs text-foreground flex items-start gap-2 font-medium"
                      >
                        <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-4 border-t border-border/60 space-y-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">Payable Now:</span>
                    <span className="text-lg font-black text-foreground">
                      NPR {course.priceNpr.toLocaleString()}
                    </span>
                  </div>

                  <Link
                    href={course.enrollPath}
                    className="w-full btn-primary text-sm font-bold py-3.5 rounded-2xl text-center flex items-center justify-center gap-2 shadow-md"
                  >
                    <span>{course.primaryCtaText}</span>
                    <ArrowRight size={15} />
                  </Link>

                  {course.depositNpr && (
                    <Link
                      href="/checkout?plan=cee-crash-course-deposit"
                      className="w-full py-2.5 rounded-xl border border-amber-500/40 text-amber-600 hover:bg-amber-500/10 text-xs font-bold text-center block transition-all"
                    >
                      Or Pre-book Seat for NPR {course.depositNpr}
                    </Link>
                  )}

                  <p className="text-[11px] text-muted-foreground text-center">
                    💳 Fonepay Dynamic QR / Bank Transfer ·{' '}
                    <Link href="/refund" className="underline hover:text-foreground">
                      Refund Policy
                    </Link>
                  </p>
                </div>
              </div>
            </div>

          </div>

        </div>
      </main>

      <HomepageFooter />
    </div>
  );
}
