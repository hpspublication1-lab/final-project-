'use client';

import React from 'react';
import Link from 'next/link';
import PublicNav from '@/components/PublicNav';
import HomepageFooter from '@/app/components/HomepageFooter';
import { BookOpen, FileText, Download, CheckCircle2, ArrowRight, Zap, GraduationCap, Stethoscope } from 'lucide-react';

const FREE_RESOURCES = [
  {
    title: 'Grade 10 Science: Force & Gravitation Revision PDF',
    track: 'SEE Class 10',
    icon: GraduationCap,
    badgeBg: 'bg-emerald-500/10 text-emerald-600',
    type: 'Subchapter Notes',
    description: 'Concise summary of Newton\'s Gravitation Law, acceleration due to gravity (g), free fall formulas, and 4-mark derivation steps.',
    actionText: 'View Free Note',
    actionHref: '/see',
  },
  {
    title: 'Grade 10 Opt Math: Vector Geometry Theorem Compendium',
    track: 'SEE Class 10',
    icon: GraduationCap,
    badgeBg: 'bg-emerald-500/10 text-emerald-600',
    type: 'Theorem Guide',
    description: 'Step-by-step vector proofs for midpoint theorem, Apollonius theorem, and parallelogram diagonals with examiner rubrics.',
    actionText: 'Explore Questions',
    actionHref: '/see',
  },
  {
    title: 'CEE Biology: High-Yield C4 Photosynthesis Cheat Sheet',
    track: 'CEE Medical',
    icon: Stethoscope,
    badgeBg: 'bg-indigo-500/10 text-indigo-600',
    type: 'High-Yield Sheet',
    description: 'Kranz anatomy, mesophyll vs bundle sheath reactions, PEPcase mechanics, and 25 most repeated MEC entrance questions.',
    actionText: 'Practice Sample MCQs',
    actionHref: '/cee-medical-entrance',
  },
  {
    title: 'CEE 50-Question Diagnostic Entrance Mock Exam',
    track: 'CEE Medical',
    icon: Stethoscope,
    badgeBg: 'bg-indigo-500/10 text-indigo-600',
    type: 'Diagnostic Test',
    description: 'Evaluate your baseline preparation level across Zoology, Botany, Chemistry, and Physics with instant accuracy reports.',
    actionText: 'Take Free Diagnostic',
    actionHref: '/cee-medical-entrance',
  },
];

export default function FreeResourcesPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <PublicNav />

      <main className="flex-1 pt-28 sm:pt-36 pb-20">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 space-y-12">
          
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-bold uppercase tracking-wider">
              <BookOpen size={14} />
              <span>Free Academic Resources</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-foreground tracking-tight">
              Free Revision Notes &amp; Diagnostic Sets
            </h1>
            <p className="text-base text-muted-foreground leading-relaxed">
              Sample our high-yield chapter notes, past year model question breakdowns, and diagnostic tests with no credit card required.
            </p>
          </div>

          {/* Resources Grid */}
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {FREE_RESOURCES.map((res, idx) => {
              const Icon = res.icon;
              return (
                <div
                  key={idx}
                  className="bg-card border border-border/80 rounded-3xl p-6 sm:p-7 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-5"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${res.badgeBg}`}>
                        {res.track}
                      </span>
                      <span className="text-[11px] font-mono text-muted-foreground">{res.type}</span>
                    </div>

                    <h2 className="text-lg font-bold text-foreground leading-snug">{res.title}</h2>
                    <p className="text-xs text-muted-foreground leading-relaxed">{res.description}</p>
                  </div>

                  <Link
                    href={res.actionHref}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline pt-2"
                  >
                    <span>{res.actionText}</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              );
            })}
          </div>

        </div>
      </main>

      <HomepageFooter />
    </div>
  );
}
