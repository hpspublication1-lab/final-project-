'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Sparkles, BookOpen, GraduationCap, ShieldCheck } from 'lucide-react';

export default function HeroSection() {
  return (
    <section aria-label="Hero — Nepal's Premier Learning Platform" className="relative pt-24 sm:pt-32 pb-16 sm:pb-20 overflow-hidden w-full max-w-full">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background pointer-events-none" />
      <div className="absolute top-[-80px] right-[-80px] w-[450px] h-[450px] bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-[200px] left-[-80px] w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        
        {/* Academic Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-bold tracking-wide shadow-xs">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span>NEPAL&apos;S PREMIER ACADEMIC &amp; ENTRANCE PLATFORM</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-foreground tracking-tight leading-[1.08]">
            Master Entrance &amp; Board Exams<br />
            <span className="text-gradient-primary">With Absolute Confidence.</span>
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto font-medium">
            Personalized learning built around Nepal&apos;s CDC and MEC curricula. 15,000+ verified MCQs, timed computer-based mock exams, and structured board revision sheets.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/cee-medical-entrance"
              className="px-6 py-3 rounded-full bg-primary hover:bg-primary-dark text-primary-foreground font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2"
            >
              <span>Explore CEE Medical</span>
              <ArrowRight size={14} />
            </Link>
            <Link
              href="/gate"
              className="px-6 py-3 rounded-full bg-card hover:bg-muted text-foreground border border-border font-bold text-xs sm:text-sm transition-all"
            >
              <span>Browse All 8 Programs</span>
            </Link>
          </div>
        </div>

        {/* 2 Flagship Academic Cards (CEE Medical vs SEE Class 10) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 pt-12 max-w-5xl mx-auto items-stretch">
          
          {/* CARD 1: CEE Medical Entrance (Flagship) */}
          <div className="bg-card border border-border/80 hover:border-primary/50 rounded-3xl p-6 sm:p-8 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group relative">
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <span className="px-3.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-wider border border-primary/20">
                  🩺 FLAGSHIP CEE 2026 ENTRANCE
                </span>
                <span className="text-xs font-bold text-muted-foreground">MECEE Pattern</span>
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground group-hover:text-primary transition-colors">
                  CEE Medical Entrance
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 font-medium">
                  MBBS / BDS / B.Sc Nursing · MEC High-Yield Question Bank
                </p>
              </div>

              <ul className="space-y-3 text-xs sm:text-sm text-foreground/85 pt-2 border-t border-border/60">
                <li className="flex items-start gap-2.5 font-medium">
                  <CheckCircle2 size={16} className="text-primary shrink-0 mt-0.5" />
                  <span><strong>15,000+ MCQs</strong> with detailed step-by-step rationales</span>
                </li>
                <li className="flex items-start gap-2.5 font-medium">
                  <CheckCircle2 size={16} className="text-primary shrink-0 mt-0.5" />
                  <span><strong>200-Question CBT Mocks</strong> with -0.25 negative marking</span>
                </li>
                <li className="flex items-start gap-2.5 font-medium">
                  <CheckCircle2 size={16} className="text-primary shrink-0 mt-0.5" />
                  <span>High-yield chapter notes &amp; formula cheat sheets</span>
                </li>
                <li className="flex items-start gap-2.5 font-medium">
                  <CheckCircle2 size={16} className="text-primary shrink-0 mt-0.5" />
                  <span>Live 1v1 Battle Arena &amp; 24/7 AI Medical Doubt Solver</span>
                </li>
              </ul>
            </div>

            <div className="pt-8 space-y-3 border-t border-border/60 mt-6">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-muted-foreground font-semibold">MBBS Target Batch:</span>
                <span className="text-lg font-black text-foreground">NPR 7,990 <span className="text-xs font-normal text-muted-foreground">/ 180 Days</span></span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/cee-medical-entrance"
                  className="w-full py-3 rounded-2xl bg-muted hover:bg-muted/80 text-foreground font-bold text-xs text-center border border-border transition-all flex items-center justify-center gap-1"
                >
                  <span>Explore CEE</span>
                  <ArrowRight size={13} />
                </Link>
                <Link
                  href="/checkout?plan=cee-mbbs-mastery-2026"
                  className="w-full py-3 rounded-2xl bg-primary hover:bg-primary-dark text-primary-foreground font-bold text-xs text-center shadow-xs transition-all"
                >
                  Join Batch
                </Link>
              </div>
            </div>
          </div>

          {/* CARD 2: SEE Class 10 (CDC Board Prep) */}
          <div className="bg-card border border-border/80 hover:border-emerald-500/50 rounded-3xl p-6 sm:p-8 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group relative">
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <span className="px-3.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase tracking-wider border border-emerald-500/20">
                  🎓 NEB CLASS 10 BOARD EXAM
                </span>
                <span className="text-xs font-bold text-muted-foreground">CDC Curriculum</span>
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground group-hover:text-emerald-600 transition-colors">
                  SEE Class 10 Board
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 font-medium">
                  CDC Nepal Syllabus · English &amp; Nepali Medium · Target GPA 4.0
                </p>
              </div>

              <ul className="space-y-3 text-xs sm:text-sm text-foreground/85 pt-2 border-t border-border/60">
                <li className="flex items-start gap-2.5 font-medium">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span>Science, Comp Math, Opt Math, English &amp; Social covered</span>
                </li>
                <li className="flex items-start gap-2.5 font-medium">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>10-Year Solved Board Papers</strong> (1, 2, 3, 4 mark rubrics)</span>
                </li>
                <li className="flex items-start gap-2.5 font-medium">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span>Daily interactive live batches &amp; 200+ HD video replays</span>
                </li>
                <li className="flex items-start gap-2.5 font-medium">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span>AI Handwritten Answer Evaluator &amp; rubric scoring</span>
                </li>
              </ul>
            </div>

            <div className="pt-8 space-y-3 border-t border-border/60 mt-6">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-muted-foreground font-semibold">Board Topper Batch:</span>
                <span className="text-lg font-black text-foreground">NPR 4,990 <span className="text-xs font-normal text-muted-foreground">/ Full Year</span></span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/see"
                  className="w-full py-3 rounded-2xl bg-muted hover:bg-muted/80 text-foreground font-bold text-xs text-center border border-border transition-all flex items-center justify-center gap-1"
                >
                  <span>Explore SEE</span>
                  <ArrowRight size={13} />
                </Link>
                <Link
                  href="/checkout?plan=see-class-10-board-topper-batch"
                  className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs text-center shadow-xs transition-all"
                >
                  Join Batch
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Academic Trust Metrics Bar */}
        <div aria-label="Platform deliverables" className="pt-12 max-w-4xl mx-auto flex flex-wrap items-center justify-around gap-6 border-t border-border/60 text-center">
          <div className="space-y-0.5">
            <div className="text-xl sm:text-2xl font-black text-foreground">15,000+</div>
            <div className="text-xs text-muted-foreground font-medium">Topicwise High-Yield MCQs</div>
          </div>
          <div className="space-y-0.5">
            <div className="text-xl sm:text-2xl font-black text-emerald-600">10-Year</div>
            <div className="text-xs text-muted-foreground font-medium">Solved Board Question Bank</div>
          </div>
          <div className="space-y-0.5">
            <div className="text-xl sm:text-2xl font-black text-indigo-600">200-Q Mocks</div>
            <div className="text-xs text-muted-foreground font-medium">MEC Blueprint (-0.25 Marking)</div>
          </div>
          <div className="space-y-0.5">
            <div className="text-xl sm:text-2xl font-black text-amber-500">24/7</div>
            <div className="text-xs text-muted-foreground font-medium">AI Step-by-Step Doubt Solver</div>
          </div>
        </div>

        {/* Academic Affiliation Disclaimer */}
        <p className="text-center text-[10px] text-muted-foreground/70 pt-6 max-w-2xl mx-auto leading-relaxed">
          SamyakCEE is an independent digital learning platform. All examination curricula, subject weightages, and marking schemes are based on official guidelines published by CDC Nepal and the Medical Education Commission (MEC) Nepal.
        </p>

      </div>
    </section>
  );
}
