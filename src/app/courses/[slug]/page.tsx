'use client';

import React, { use } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import PublicNav from '@/components/PublicNav';
import HomepageFooter from '@/app/components/HomepageFooter';
import { getCourseBySlug, getAllCourses } from '@/lib/courses/catalog';
import {
  CheckCircle2,
  Clock,
  BookOpen,
  Users,
  ShieldCheck,
  ArrowRight,
  HelpCircle,
  Play,
  FileText,
  Calendar,
  Sparkles,
  ChevronDown
} from 'lucide-react';

export default function CourseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const course = getCourseBySlug(resolvedParams.slug);

  if (!course) {
    notFound();
  }

  const isSee = course.track === 'see_class_10';
  const isCee = course.track === 'cee_medical';

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <PublicNav />

      <main className="flex-1 pt-28 sm:pt-36 pb-20">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 space-y-14">

          {/* 1. Header Hero Card */}
          <div className="bg-card border border-border/80 rounded-3xl p-6 sm:p-10 shadow-sm relative overflow-hidden">
            <div className="max-w-4xl space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-xs font-mono font-black uppercase px-3 py-1 rounded-lg ${
                  isSee ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : isCee ? 'bg-indigo-500/10 text-indigo-600 border border-indigo-500/20' : 'bg-primary/10 text-primary border border-primary/20'
                }`}>
                  {course.badge}
                </span>
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Clock size={13} />
                  <span>{course.validityText}</span>
                </span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-lg bg-muted text-foreground">
                  Medium: {course.languageMedium}
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold text-foreground tracking-tight leading-tight">
                {course.title}
              </h1>

              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-3xl">
                {course.description}
              </p>

              {/* Target & Exam Outcome */}
              <div className="grid sm:grid-cols-2 gap-4 pt-2 max-w-2xl">
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

              {/* Pricing & Primary Action */}
              <div className="pt-6 flex flex-wrap items-center gap-6 border-t border-border/60">
                <div>
                  <span className="text-xs text-muted-foreground block font-medium">Exact Batch Enrollment Fee</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-foreground">
                      NPR {course.priceNpr.toLocaleString()}
                    </span>
                    {course.originalPriceNpr && (
                      <span className="text-sm text-muted-foreground line-through">
                        NPR {course.originalPriceNpr.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                <Link
                  href={course.enrollPath}
                  className="btn-primary text-sm sm:text-base font-bold py-4 px-8 rounded-2xl shadow-lg flex items-center gap-2"
                >
                  <span>{course.primaryCtaText}</span>
                  <ArrowRight size={16} />
                </Link>

                <div className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                  <ShieldCheck size={16} className="text-emerald-500 shrink-0" />
                  <span>{course.refundRules}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2-Column Details: Left Content, Right Sticky Schedule & Highlights */}
          <div className="grid lg:grid-cols-12 gap-10">
            
            {/* Left 8 Cols: Curriculum, Subjects, Demo & Faculty */}
            <div className="lg:col-span-8 space-y-10">
              
              {/* Subjects Covered */}
              <section className="space-y-4">
                <h2 className="text-2xl font-bold text-foreground">Subjects Covered</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {course.subjects.map((sub, sIdx) => (
                    <div key={sIdx} className="p-4 rounded-2xl bg-card border border-border/80 flex items-center gap-3">
                      <span className="text-2xl p-2.5 rounded-xl bg-muted/60">{sub.icon}</span>
                      <div>
                        <h3 className="text-sm font-bold text-foreground">{sub.name}</h3>
                        <p className="text-xs text-muted-foreground">{sub.chaptersCount} Chapters / Units Included</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Demo Lesson Preview */}
              <section className="space-y-4">
                <h2 className="text-2xl font-bold text-foreground">Demo Lesson &amp; Rubric Preview</h2>
                <div className="bg-card border-2 border-primary/20 rounded-3xl p-6 sm:p-7 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold px-3 py-1 rounded-lg bg-primary/10 text-primary">
                      FREE DEMO ITEM · {course.demoLesson.subject}
                    </span>
                    <span className="text-xs font-semibold text-muted-foreground">Open Preview</span>
                  </div>

                  <h3 className="text-lg font-bold text-foreground">
                    {course.demoLesson.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {course.demoLesson.summary}
                  </p>

                  <div className="pt-2">
                    <Link
                      href={isSee ? '/see' : isCee ? '/cee-medical-entrance' : '/courses'}
                      className="inline-flex items-center gap-2 text-xs font-bold text-primary hover:underline"
                    >
                      <span>Try Interactive Problem on LMS Hub</span>
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </section>

              {/* Detailed Curriculum */}
              <section className="space-y-4">
                <h2 className="text-2xl font-bold text-foreground">Curriculum Outline</h2>
                <div className="space-y-3">
                  {course.curriculum.map((mod, mIdx) => (
                    <div key={mIdx} className="bg-card border border-border/80 rounded-2xl p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm sm:text-base font-bold text-foreground">{mod.moduleTitle}</h3>
                        <span className="text-xs font-medium text-muted-foreground">{mod.topicsCount} Key Topics</span>
                      </div>
                      <ul className="grid sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
                        {mod.topics.map((t, tIdx) => (
                          <li key={tIdx} className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                            <span>{t}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>

              {/* Verified Faculty */}
              <section className="space-y-4">
                <h2 className="text-2xl font-bold text-foreground">Verified Academic Faculty</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {course.faculty.map((f, fIdx) => (
                    <div key={fIdx} className="p-5 rounded-2xl bg-card border border-border/80 space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-foreground">{f.name}</h3>
                        {f.verified && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                            Verified
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
                <h2 className="text-2xl font-bold text-foreground">Frequently Asked Questions</h2>
                <div className="space-y-3">
                  {course.faqs.map((faq, qIdx) => (
                    <div key={qIdx} className="bg-card border border-border/80 rounded-2xl p-5 space-y-2">
                      <h3 className="text-sm sm:text-base font-bold text-foreground">{faq.q}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                    </div>
                  ))}
                </div>
              </section>

            </div>

            {/* Right 4 Cols: Sticky Batch Schedule & Features Card */}
            <div className="lg:col-span-4 space-y-6">
              <div className="sticky top-28 bg-card border border-border/80 rounded-3xl p-6 sm:p-7 shadow-sm space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-foreground">Batch Information</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{course.batchSchedule.batchName}</p>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/60 space-y-1">
                    <span className="font-bold text-foreground block">📅 Start Date:</span>
                    <span className="text-muted-foreground">{course.batchSchedule.startDate}</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/60 space-y-1">
                    <span className="font-bold text-foreground block">🕒 Live Class Schedule:</span>
                    <span className="text-muted-foreground">{course.batchSchedule.liveSchedule}</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/60 space-y-1">
                    <span className="font-bold text-foreground block">⚡ Video Replays:</span>
                    <span className="text-emerald-600 font-semibold">Available instantly after each live class</span>
                  </div>
                </div>

                {/* Features Included */}
                <div className="space-y-2.5 pt-2 border-t border-border/60">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                    What\'s Included:
                  </span>
                  <ul className="space-y-2">
                    {course.includedFeatures.map((feat, ftIdx) => (
                      <li key={ftIdx} className="text-xs text-foreground flex items-start gap-2 font-medium">
                        <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-4 border-t border-border/60 space-y-3">
                  <Link
                    href={course.enrollPath}
                    className="w-full btn-primary text-sm font-bold py-3.5 rounded-2xl text-center flex items-center justify-center gap-2 shadow-md"
                  >
                    <span>{course.primaryCtaText}</span>
                    <ArrowRight size={15} />
                  </Link>

                  <p className="text-[11px] text-muted-foreground text-center">
                    💳 Fonepay Dynamic QR · ⚡ Instant LMS Access
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
