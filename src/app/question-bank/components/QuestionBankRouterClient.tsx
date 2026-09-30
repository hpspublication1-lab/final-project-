'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useProgram, normalizeCourseId } from '@/contexts/ProgramContext';
import SeeQuestionBankClient from '@/app/see/question-bank/components/SeeQuestionBankClient';
import CeeQuestionBankClient from './CeeQuestionBankClient';
import { GraduationCap, Stethoscope, ArrowRight, BookOpen, Zap, Layers, Sparkles } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';

export default function QuestionBankRouterClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { program, setProgram } = useProgram();

  const programParam = searchParams.get('program');
  const [resolvedMode, setResolvedMode] = useState<'see' | 'cee' | 'chooser' | 'loading'>('loading');

  useEffect(() => {
    // 1. Explicit query param priority
    if (programParam === 'see' || programParam === 'see_class_10') {
      setResolvedMode('see');
      return;
    }
    if (programParam === 'cee' || programParam === 'cee_medical') {
      setResolvedMode('cee');
      return;
    }

    // 2. Stored program priority
    if (program) {
      const canonical = normalizeCourseId(program);
      if (canonical === 'see_class_10') {
        setResolvedMode('see');
        return;
      }
      if (canonical === 'cee_medical') {
        setResolvedMode('cee');
        return;
      }
    }

    // 3. Fallback: prompt user to choose their target examination
    setResolvedMode('chooser');
  }, [programParam, program]);

  if (resolvedMode === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (resolvedMode === 'see') {
    return <SeeQuestionBankClient />;
  }

  if (resolvedMode === 'cee') {
    return <CeeQuestionBankClient />;
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8 animate-fadeIn">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-black tracking-wider uppercase">
            <Sparkles size={13} /> Select Question Bank
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-foreground tracking-tight">
            Choose Your Preparation Track
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Access curated, syllabus-aligned questions with step-by-step verified solutions and marking schemes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Samyak SEE */}
          <div className="card-luxury p-6 sm:p-8 rounded-3xl border border-border/80 shadow-md hover:border-emerald-500/50 hover:shadow-xl transition-all flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <GraduationCap size={26} />
              </div>
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Class 10 Board Exam
                </span>
                <h2 className="text-xl font-black text-foreground mt-0.5">
                  Samyak SEE Question Bank
                </h2>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                1, 2, 3 &amp; 4 marks written questions, numericals with step formulas, and 10-year NEB past papers for Science, Math, Opt Math, and English.
              </p>
              <ul className="space-y-2 text-xs text-muted-foreground font-medium pt-2 border-t border-border/60">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>CDC Rubric step-by-step marking</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Downloadable Chapter Formula Digests</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Interactive chapter drill sessions</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => {
                setProgram('see_class_10');
                setResolvedMode('see');
              }}
              className="mt-6 w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <span>Open SEE Question Bank</span>
              <ArrowRight size={15} />
            </button>
          </div>

          {/* Card 2: Samyak CEE */}
          <div className="card-luxury p-6 sm:p-8 rounded-3xl border border-border/80 shadow-md hover:border-primary/50 hover:shadow-xl transition-all flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                <Stethoscope size={26} />
              </div>
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-primary">
                  Medical Entrance Examination
                </span>
                <h2 className="text-xl font-black text-foreground mt-0.5">
                  Samyak CEE Practice Bank
                </h2>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                15,000+ topic-wise MCQs with negative marking simulations, MEC past question archives, and AI-driven weak area recommendations.
              </p>
              <ul className="space-y-2 text-xs text-muted-foreground font-medium pt-2 border-t border-border/60">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span>Biology (Botany &amp; Zoology), Chemistry, Physics, MAT</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span>Instant answer explanations &amp; difficulty tiers</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span>Quick presets (10, 25, 50 questions)</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => {
                setProgram('cee_medical');
                setResolvedMode('cee');
              }}
              className="mt-6 w-full py-3.5 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <span>Open CEE Question Bank &amp; PYQs</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
