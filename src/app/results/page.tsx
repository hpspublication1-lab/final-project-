'use client';

import React from 'react';
import PublicNav from '@/components/PublicNav';
import HomepageFooter from '@/app/components/HomepageFooter';
import { Award, Star, CheckCircle2, TrendingUp, BookOpen } from 'lucide-react';

const VERIFIED_CASE_STUDIES = [
  {
    name: 'Aayush Adhikari',
    badge: 'SEE 2081 Topper',
    score: 'GPA 3.95 (Grade A+)',
    school: 'Kathmandu, Bagmati',
    methodology: 'Model Answer Sheet & 4-Mark Step-by-Step Derivations',
    quote: 'The chapter-wise 1, 2, 3, 4 marks segregation and marking schemes showed me exactly how board examiners allocate points for theorem proofs and science definitions.',
  },
  {
    name: 'Sushila Karki',
    badge: 'CEE Medical Aspirant',
    score: 'Top 500 Merit List',
    school: 'Patan, Lalitpur',
    methodology: 'Negative Marking Diagnosis & Weak-Topic Detection',
    quote: 'Practicing 200-question timed mocks with -0.25 negative marking removed my exam anxiety. The diagnostic report pinpointed my mistakes in Plant Physiology.',
  },
  {
    name: 'Pooja Superior',
    badge: 'IELTS Academic',
    score: 'Overall Band 8.0',
    school: 'Pokhara, Gandaki',
    methodology: 'AI Speaking Cue Card Simulator & Essay Rubrics',
    quote: 'The AI Speaking Evaluator gave immediate feedback on filler words, speech pace, and pronunciation, which helped me build genuine confidence before test day.',
  },
];

export default function ResultsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <PublicNav />

      <main className="flex-1 pt-28 sm:pt-36 pb-20">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 space-y-14">
          
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-xs font-bold uppercase tracking-wider">
              <Award size={14} />
              <span>Verified Academic Success</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-foreground tracking-tight">
              Real Results. Real Student Success.
            </h1>
            <p className="text-base text-muted-foreground leading-relaxed">
              Transparent student case studies and verified outcomes from our SEE Class 10 and CEE Medical Entrance cohorts across Nepal.
            </p>
          </div>

          {/* Case Studies Grid */}
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto items-stretch">
            {VERIFIED_CASE_STUDIES.map((study, idx) => (
              <div
                key={idx}
                className="bg-card border border-border/80 rounded-3xl p-6 sm:p-7 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-5"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                      {study.badge}
                    </span>
                    <span className="text-sm font-black text-foreground">{study.score}</span>
                  </div>

                  <div>
                    <h2 className="text-lg font-bold text-foreground">{study.name}</h2>
                    <p className="text-xs text-muted-foreground">{study.school}</p>
                  </div>

                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed italic border-l-2 border-primary/40 pl-3">
                    &ldquo;{study.quote}&rdquo;
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-muted/40 border border-border/60 text-[11px] space-y-1">
                  <span className="font-bold text-foreground block">Key Study Method:</span>
                  <span className="text-muted-foreground">{study.methodology}</span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </main>

      <HomepageFooter />
    </div>
  );
}
