'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight } from 'lucide-react';

export default function AuxiliaryProgramsBanner() {
  return (
    <section className="py-12 bg-background border-t border-border/60">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="p-6 sm:p-8 rounded-3xl bg-card border border-border/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-bold uppercase tracking-wider">
              <Sparkles size={13} className="text-amber-500" />
              <span>Career Skills &amp; Language Certifications</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-foreground">
              Looking for IELTS, Digital Marketing, or AI?
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Alongside our primary SEE and CEE entrance programs, explore our specialized masterclasses in{' '}
              <strong className="text-foreground">IELTS Band 8.0</strong>,{' '}
              <strong className="text-foreground">Performance Digital Marketing</strong>, and{' '}
              <strong className="text-foreground">AI &amp; Python Programming</strong>.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/courses"
              className="btn-secondary text-xs sm:text-sm py-3 px-6 rounded-2xl font-bold border-border/80 hover:border-primary/40 flex items-center gap-2 transition-all"
            >
              <span>Explore Skill Programs</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
