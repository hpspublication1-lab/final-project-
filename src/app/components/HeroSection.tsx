'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Star, CheckCircle2, ShieldCheck, Zap, Sparkles } from 'lucide-react';

export default function HeroSection() {
  return (
    <section aria-label="Hero — Nepal's Premier Learning Platform" className="relative pt-28 sm:pt-36 pb-16 sm:pb-24 overflow-hidden w-full max-w-full">
      {/* Background Gradient */}
      <div className="absolute inset-0 gradient-hero pointer-events-none" />
      <div className="absolute top-[-100px] right-[-100px] w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-100px] left-[-100px] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        
        {/* Top Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-bold uppercase tracking-wider shadow-xs">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span>NEPAL\'S PREMIER LEARNING PLATFORM · 2026 ADMISSIONS OPEN</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-foreground tracking-tight leading-[1.08]">
            Learn Smarter.<br />
            <span className="text-gradient-primary">Score Higher.</span>
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto font-medium">
            Nepal\'s focused LMS built for academic board and entrance exam success. Master Class 10 board exams with GPA 4.0 curriculum or crack the Medical Education Commission (MECEE) entrance with 15,000+ high-yield questions.
          </p>
        </div>

        {/* 2 Flagship Commercial Gateways (SEE vs CEE) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-10 max-w-5xl mx-auto items-stretch">
          
          {/* FLAGSHIP 1: SEE Class 10 */}
          <div className="bg-card border-2 border-emerald-500/30 hover:border-emerald-500/60 rounded-3xl p-6 sm:p-8 shadow-md hover:shadow-xl transition-all flex flex-col justify-between group relative overflow-hidden">
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase tracking-wider border border-emerald-500/20">
                  NEB CLASS 10 BOARD EXAM
                </span>
                <span className="text-2xl">🎓</span>
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground group-hover:text-emerald-600 transition-colors">
                  SEE Class 10 Preparation
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 font-medium">
                  CDC Nepal Curriculum · English &amp; Nepali Medium · Target 4.0 GPA
                </p>
              </div>

              <ul className="space-y-2.5 text-xs sm:text-sm text-foreground/85 pt-2 border-t border-border/60">
                <li className="flex items-start gap-2 font-medium">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span>Science, Comp Math, Opt Math, English &amp; Social covered</span>
                </li>
                <li className="flex items-start gap-2 font-medium">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span>10-Year Solved Past Board Questions (1, 2, 3, 4 marks)</span>
                </li>
                <li className="flex items-start gap-2 font-medium">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span>Daily interactive live batches &amp; 200+ HD video replays</span>
                </li>
                <li className="flex items-start gap-2 font-medium">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span>AI Handwritten Answer Sheet marker &amp; rubrics</span>
                </li>
              </ul>
            </div>

            <div className="pt-8 space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-muted-foreground font-semibold">Board Topper Batch:</span>
                <span className="text-lg font-black text-foreground">NPR 4,990 <span className="text-xs font-normal text-muted-foreground">/ Full Year</span></span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/see"
                  className="w-full py-3 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold text-xs text-center border border-emerald-500/30 transition-all flex items-center justify-center gap-1"
                >
                  <span>Explore SEE</span>
                  <ArrowRight size={13} />
                </Link>
                <Link
                  href="/checkout?plan=see-class-10-board-topper-batch"
                  className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs text-center shadow-sm transition-all"
                >
                  Join Batch
                </Link>
              </div>
            </div>
          </div>

          {/* FLAGSHIP 2: CEE Medical Entrance */}
          <div className="bg-card border-2 border-indigo-500/30 hover:border-indigo-500/60 rounded-3xl p-6 sm:p-8 shadow-md hover:shadow-xl transition-all flex flex-col justify-between group relative overflow-hidden">
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-black uppercase tracking-wider border border-indigo-500/20">
                  MECEE 2026 ENTRANCE
                </span>
                <span className="text-2xl">🩺</span>
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground group-hover:text-indigo-600 transition-colors">
                  CEE Medical Entrance
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 font-medium">
                  MBBS / BDS / B.Sc Nursing · MEC Syllabus · Target Scholarship
                </p>
              </div>

              <ul className="space-y-2.5 text-xs sm:text-sm text-foreground/85 pt-2 border-t border-border/60">
                <li className="flex items-start gap-2 font-medium">
                  <CheckCircle2 size={16} className="text-indigo-500 shrink-0 mt-0.5" />
                  <span>15,000+ Topicwise High-Yield MCQs with step-by-step rationales</span>
                </li>
                <li className="flex items-start gap-2 font-medium">
                  <CheckCircle2 size={16} className="text-indigo-500 shrink-0 mt-0.5" />
                  <span>200-Question Timed Mock Exams with -0.25 negative marking</span>
                </li>
                <li className="flex items-start gap-2 font-medium">
                  <CheckCircle2 size={16} className="text-indigo-500 shrink-0 mt-0.5" />
                  <span>High-yield subchapter notes &amp; formula sheets (Bio, Chem, Phys)</span>
                </li>
                <li className="flex items-start gap-2 font-medium">
                  <CheckCircle2 size={16} className="text-indigo-500 shrink-0 mt-0.5" />
                  <span>Real-time 1v1 Battle Arena &amp; 24/7 AI Medical Doubt Solver</span>
                </li>
              </ul>
            </div>

            <div className="pt-8 space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-muted-foreground font-semibold">MBBS Target Batch:</span>
                <span className="text-lg font-black text-foreground">NPR 7,990 <span className="text-xs font-normal text-muted-foreground">/ 180 Days</span></span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/cee-medical-entrance"
                  className="w-full py-3 rounded-2xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-bold text-xs text-center border border-indigo-500/30 transition-all flex items-center justify-center gap-1"
                >
                  <span>Explore CEE</span>
                  <ArrowRight size={13} />
                </Link>
                <Link
                  href="/checkout?plan=cee-mbbs-mastery-2026"
                  className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs text-center shadow-sm transition-all"
                >
                  Join Batch
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Verified Academic Platform Features Bar */}
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
        <p className="text-center text-[10px] text-muted-foreground/60 pt-3 max-w-2xl mx-auto leading-relaxed">
          Samyak Guru is an independent digital learning platform. All examination curricula, subject weightages, and marking schemes are based on official guidelines published by CDC Nepal and the Medical Education Commission (MEC) Nepal. Samyak Guru is not affiliated with or endorsed by MEC Nepal or NEB.
        </p>

      </div>
    </section>
  );
}
