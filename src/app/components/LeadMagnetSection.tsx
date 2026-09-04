'use client';

import React, { useState } from 'react';
import { Sparkles, Download, BookOpen, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
import LeadCaptureModal from './LeadCaptureModal';
import { trackEvent } from '@/lib/tracking/tracker';

interface LeadMagnetSectionProps {
  variant?: 'full' | 'compact' | 'course_cta';
  courseContext?: string;
}

export default function LeadMagnetSection({
  variant = 'full',
  courseContext = 'general_homepage',
}: LeadMagnetSectionProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const handleOpen = () => {
    trackEvent('lead_form_open', { sourceContext: courseContext });
    setModalOpen(true);
  };

  if (variant === 'course_cta') {
    return (
      <>
        <div className="bg-gradient-to-r from-primary/10 via-card to-indigo-500/10 border border-primary/20 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 my-10 shadow-sm">
          <div className="space-y-2 max-w-xl text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-black">
              <Sparkles size={13} /> Free CEE Study Pack
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-foreground">
              Not ready to enroll yet? Start with 500 Free MCQs.
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Test yourself before you spend a single rupee on your preparation. Download the 500 CEE Biology High-Yield
              Questions with complete explanations.
            </p>
          </div>

          <button
            onClick={handleOpen}
            className="btn-primary shrink-0 px-6 py-3.5 text-xs font-black shadow-lg shadow-primary/25 w-full sm:w-auto justify-center"
          >
            <Download size={16} /> GET THE FREE PDF →
          </button>
        </div>

        <LeadCaptureModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          sourceContext={courseContext}
        />
      </>
    );
  }

  return (
    <>
      <section className="py-16 bg-muted/20 border-y border-border/40">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
          <div className="bg-gradient-to-br from-card via-card to-primary/10 border border-border rounded-3xl p-8 sm:p-12 shadow-md relative overflow-hidden">
            {/* Background glow decoration */}
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/15 rounded-full blur-3xl pointer-events-none" />

            <div className="grid lg:grid-cols-12 gap-8 items-center relative z-10">
              <div className="lg:col-span-7 space-y-4 text-left">
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-black border border-primary/20">
                  <Sparkles size={14} /> FREE LEAD MAGNET RESOURCE
                </div>

                <h2 className="text-2xl sm:text-4xl font-black text-foreground tracking-tight leading-tight">
                  FREE CEE BIOLOGY POWER PACK
                </h2>

                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">500 High-Yield CEE Biology MCQs + Detailed Explanations.</strong>{' '}
                  Test yourself before you spend a single rupee on your preparation. Mapped 100% to the Medical Education
                  Commission (MEC) 2026 syllabus.
                </p>

                <div className="grid sm:grid-cols-2 gap-3 pt-2">
                  <div className="flex items-center gap-2.5 text-xs text-foreground font-semibold">
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                    <span>250 Botany &amp; 250 Zoology MCQs</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-foreground font-semibold">
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                    <span>High-Yield Trap Option Warnings</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-foreground font-semibold">
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                    <span>Step-by-step Conceptual Explanations</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-foreground font-semibold">
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                    <span>Instant Digital PDF Access</span>
                  </div>
                </div>

                <div className="pt-4 flex flex-col sm:flex-row items-center gap-4">
                  <button
                    onClick={handleOpen}
                    className="btn-primary w-full sm:w-auto px-8 py-4 text-xs font-black shadow-xl shadow-primary/30 justify-center"
                  >
                    <Download size={17} /> GET THE FREE PDF (500 MCQs) →
                  </button>
                  <span className="text-xs text-muted-foreground">100% Free • No credit card required</span>
                </div>
              </div>

              <div className="lg:col-span-5 flex justify-center">
                <div className="w-full max-w-sm bg-background border border-border/80 rounded-2xl p-6 shadow-xl space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-border">
                    <span className="text-[11px] font-black uppercase text-primary tracking-wider">CEE 2026 Edition</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 font-bold">
                      Verified
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="text-base font-black text-foreground">500 High-Yield Biology MCQs</div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Includes Plant Anatomy, Genetics, Human Physiology, Ecology &amp; Molecular Biology with trap analysis.
                    </p>
                  </div>
                  <div className="p-3.5 bg-muted/40 rounded-xl space-y-1.5 border border-border/50 text-xs">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Total Marks in CEE:</span>
                      <strong className="text-foreground">80 Marks (40%)</strong>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Format:</span>
                      <strong className="text-foreground">PDF + Online Diagnostic</strong>
                    </div>
                  </div>
                  <button
                    onClick={handleOpen}
                    className="btn-primary w-full justify-center py-3 text-xs font-black"
                  >
                    Send Me The Free MCQs →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <LeadCaptureModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        sourceContext={courseContext}
      />
    </>
  );
}
