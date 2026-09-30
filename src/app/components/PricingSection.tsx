'use client';

import React from 'react';
import Link from 'next/link';
import { CheckCircle2, X, Star, ArrowRight, ShieldCheck, Flame, MessageCircle } from 'lucide-react';
import { SUPPORT_CONFIG } from '@/lib/config/support';

const WHATSAPP_NUMBER = SUPPORT_CONFIG.whatsappNumber;

export default function PricingSection() {
  const buildWhatsAppUrl = (planName: string, priceStr: string) => {
    const message = `Hi! I need guidance with enrollment for *\${planName}* (\${priceStr}) on Samyak Tutor. Please help me get started.`;
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  };

  return (
    <section id="pricing" aria-label="Pricing plans" className="py-20 bg-background border-t border-border/60 relative overflow-hidden">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-bold uppercase tracking-wider">
            <span>Transparent Pricing</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            Simple, Accessible Pricing for Every Student
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed">
            Select your target exam batch or try out the free starter pass. Every paid plan includes our 7-day money-back guarantee.
          </p>
        </div>

        {/* 3 Tier Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto items-stretch">
          
          {/* Plan 1: Free Starter */}
          <div className="bg-card border border-border rounded-3xl p-6 sm:p-7 shadow-sm flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">SAMYAK STARTER</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-muted text-muted-foreground">FREE</span>
              </div>
              <div>
                <div className="text-3xl font-black text-foreground">FREE</div>
                <p className="text-xs text-muted-foreground mt-1">Explore sample notes &amp; diagnostic questions</p>
              </div>

              <ul className="space-y-2.5 text-xs text-muted-foreground pt-4 border-t border-border/60">
                <li className="flex items-center gap-2 font-medium text-foreground">
                  <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                  <span>20 Free Chapter Revision Notes</span>
                </li>
                <li className="flex items-center gap-2 font-medium text-foreground">
                  <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                  <span>Daily Question Feeds &amp; Polls</span>
                </li>
                <li className="flex items-center gap-2 font-medium text-foreground">
                  <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                  <span>Free Diagnostic Entrance Exam</span>
                </li>
                <li className="flex items-center gap-2 font-medium text-foreground">
                  <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                  <span>Community Doubts Forum Access</span>
                </li>
                <li className="flex items-center gap-2 opacity-50">
                  <X size={15} className="text-muted-foreground shrink-0" />
                  <span>Full 200-Q Mock Tests</span>
                </li>
                <li className="flex items-center gap-2 opacity-50">
                  <X size={15} className="text-muted-foreground shrink-0" />
                  <span>Daily Live Evening Classes</span>
                </li>
              </ul>
            </div>

            <Link
              href="/login?mode=signup"
              className="w-full py-3 rounded-2xl bg-muted/60 hover:bg-muted border border-border text-foreground font-bold text-xs text-center transition-all"
            >
              Get Started Free
            </Link>
          </div>

          {/* Plan 2: SEE Class 10 Topper Batch */}
          <div className="bg-card border-2 border-emerald-500 rounded-3xl p-6 sm:p-7 shadow-lg flex flex-col justify-between space-y-6 relative">
            <span className="absolute -top-3 right-6 text-[10px] font-black uppercase px-3 py-0.5 rounded-full bg-emerald-500 text-white shadow-xs">
              RECOMMENDED FOR CLASS 10
            </span>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-600">SEE BOARD BATCH</span>
              </div>

              <div>
                <div className="text-3xl font-black text-foreground">NPR 4,990</div>
                <p className="text-xs text-muted-foreground mt-1">Full Academic Year (365 Days Access)</p>
              </div>

              <ul className="space-y-2.5 text-xs text-muted-foreground pt-4 border-t border-border/60">
                <li className="flex items-center gap-2 font-medium text-foreground">
                  <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                  <span>All 5 Board Subjects (Science, Math, Opt Math...)</span>
                </li>
                <li className="flex items-center gap-2 font-medium text-foreground">
                  <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                  <span>10-Year Solved Board Exam Bank (1-4 Marks)</span>
                </li>
                <li className="flex items-center gap-2 font-medium text-foreground">
                  <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                  <span>Daily Interactive Live Classes &amp; 200+ HD Replays</span>
                </li>
                <li className="flex items-center gap-2 font-medium text-foreground">
                  <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                  <span>AI Handwritten Answer Sheet Marker</span>
                </li>
                <li className="flex items-center gap-2 font-medium text-foreground">
                  <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                  <span>Printable A4 Practice Model Sets</span>
                </li>
                <li className="flex items-center gap-2 font-medium text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck size={15} className="shrink-0" />
                  <span>7-Day Money-Back Guarantee</span>
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <Link
                href="/checkout?plan=see-class-10-board-topper-batch"
                className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs text-center shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span>Enroll in SEE Batch (NPR 4,990)</span>
                <ArrowRight size={14} />
              </Link>
              <p className="text-[10px] text-muted-foreground text-center">
                💳 Fonepay Dynamic QR · ⚡ Instant Activation
              </p>
            </div>
          </div>

          {/* Plan 3: CEE Medical Target Batch */}
          <div className="bg-card border-2 border-indigo-500 rounded-3xl p-6 sm:p-7 shadow-lg flex flex-col justify-between space-y-6 relative">
            <span className="absolute -top-3 right-6 text-[10px] font-black uppercase px-3 py-0.5 rounded-full bg-indigo-600 text-white shadow-xs">
              RECOMMENDED FOR MEDICAL
            </span>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-indigo-600">CEE TARGET BATCH</span>
              </div>

              <div>
                <div className="text-3xl font-black text-foreground">NPR 7,990</div>
                <p className="text-xs text-muted-foreground mt-1">Full MECEE Cycle (180 Days Access)</p>
              </div>

              <ul className="space-y-2.5 text-xs text-muted-foreground pt-4 border-t border-border/60">
                <li className="flex items-center gap-2 font-medium text-foreground">
                  <CheckCircle2 size={15} className="text-indigo-500 shrink-0" />
                  <span>15,000+ Topicwise High-Yield MCQs &amp; Solutions</span>
                </li>
                <li className="flex items-center gap-2 font-medium text-foreground">
                  <CheckCircle2 size={15} className="text-indigo-500 shrink-0" />
                  <span>200-Question Timed Mocks (-0.25 Negative Marking)</span>
                </li>
                <li className="flex items-center gap-2 font-medium text-foreground">
                  <CheckCircle2 size={15} className="text-indigo-500 shrink-0" />
                  <span>Sub-chapter Notes (Bio, Chem, Physics, MAT)</span>
                </li>
                <li className="flex items-center gap-2 font-medium text-foreground">
                  <CheckCircle2 size={15} className="text-indigo-500 shrink-0" />
                  <span>24/7 AI Medical Doubt Solver Assistant</span>
                </li>
                <li className="flex items-center gap-2 font-medium text-foreground">
                  <CheckCircle2 size={15} className="text-indigo-500 shrink-0" />
                  <span>Real-time 1v1 Battle Arena Duels</span>
                </li>
                <li className="flex items-center gap-2 font-medium text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck size={15} className="shrink-0" />
                  <span>7-Day Money-Back Guarantee</span>
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <Link
                href="/checkout?plan=cee-ai-pro-monthly"
                className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs text-center shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span>Subscribe CEE AI Pro (NPR 600 / Mo)</span>
                <ArrowRight size={14} />
              </Link>
              <Link
                href="/checkout?plan=cee-premium-monthly"
                className="w-full py-2.5 rounded-2xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-bold text-xs text-center border border-indigo-500/30 transition-all flex items-center justify-center gap-2"
              >
                <span>CEE Premium (NPR 350 / Mo)</span>
              </Link>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1 pt-1">
                <span>Full 180-day Target Batch?</span>
                <Link href="/checkout?plan=cee-mbbs-mastery-2026" className="text-primary font-bold hover:underline">
                  NPR 7,990 &rarr;
                </Link>
              </div>
              <p className="text-[10px] text-muted-foreground text-center">
                💳 Fonepay Dynamic QR · eSewa · ⚡ Instant Activation
              </p>
            </div>
          </div>
        </div>

        {/* WhatsApp Assistance Footer */}
        <div className="pt-10 max-w-xl mx-auto text-center space-y-2">
          <p className="text-xs text-muted-foreground font-medium">
            Need help choosing a plan or want to pay via direct bank deposit?
          </p>
          <a
            href={buildWhatsAppUrl('Enrollment Inquiry', 'General')}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs font-bold text-emerald-600 hover:underline"
          >
            <MessageCircle size={15} />
            <span>Chat with an Academic Counselor on WhatsApp: {SUPPORT_CONFIG.phoneDisplay}</span>
          </a>
        </div>

      </div>
    </section>
  );
}
