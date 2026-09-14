'use client';

import React from 'react';
import Link from 'next/link';
import PublicNav from '@/components/PublicNav';
import HomepageFooter from '@/app/components/HomepageFooter';
import { getAllCourses } from '@/lib/courses/catalog';
import { CheckCircle2, X, ArrowRight, ShieldCheck, MessageCircle, HelpCircle } from 'lucide-react';
import { SUPPORT_CONFIG } from '@/lib/config/support';

export default function DedicatedPricingPage() {
  const courses = getAllCourses();
  const seeCourse = courses.find((c) => c.slug === 'see-class-10-board-topper-batch') || courses[0];
  const ceeCourse = courses.find((c) => c.slug === 'cee-mbbs-mastery-2026') || courses[1];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <PublicNav />

      <main className="flex-1 pt-28 sm:pt-36 pb-20">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 space-y-14">
          
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-bold uppercase tracking-wider">
              <span>Transparent &amp; Honest Pricing</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-foreground tracking-tight">
              Invest in Your Academic Future
            </h1>
            <p className="text-base text-muted-foreground leading-relaxed">
              No hidden fees, no auto-renewing surprises. Every paid enrollment includes full curriculum access and our 7-day money-back guarantee.
            </p>
          </div>

          {/* Pricing Grid */}
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto items-stretch">
            
            {/* Free Starter */}
            <div className="bg-card border border-border/80 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">STARTER</span>
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
                    <span>Free Diagnostic Entrance Exam</span>
                  </li>
                  <li className="flex items-center gap-2 font-medium text-foreground">
                    <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                    <span>Community Doubts Forum Access</span>
                  </li>
                  <li className="flex items-center gap-2 opacity-50">
                    <X size={15} className="text-muted-foreground shrink-0" />
                    <span>Full 200-Question Timed Mocks</span>
                  </li>
                  <li className="flex items-center gap-2 opacity-50">
                    <X size={15} className="text-muted-foreground shrink-0" />
                    <span>Daily Interactive Live Classes</span>
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

            {/* SEE Class 10 Topper Batch */}
            <div className="bg-card border-2 border-emerald-500 rounded-3xl p-6 sm:p-8 shadow-lg flex flex-col justify-between space-y-6 relative">
              <span className="absolute -top-3 right-6 text-[10px] font-black uppercase px-3 py-0.5 rounded-full bg-emerald-500 text-white shadow-xs">
                CLASS 10 TOPPER BATCH
              </span>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-600">SEE BOARD EXAM</span>
                </div>

                <div>
                  <div className="text-3xl font-black text-foreground">
                    NPR {seeCourse.priceNpr.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{seeCourse.validityText}</p>
                </div>

                <ul className="space-y-2.5 text-xs text-muted-foreground pt-4 border-t border-border/60">
                  <li className="flex items-center gap-2 font-medium text-foreground">
                    <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                    <span>All 5 Board Subjects Covered</span>
                  </li>
                  <li className="flex items-center gap-2 font-medium text-foreground">
                    <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                    <span>Daily Interactive Live Classes &amp; Replays</span>
                  </li>
                  <li className="flex items-center gap-2 font-medium text-foreground">
                    <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                    <span>10-Year Solved Board Exam Question Bank</span>
                  </li>
                  <li className="flex items-center gap-2 font-medium text-foreground">
                    <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                    <span>AI Handwritten Answer Sheet Marker</span>
                  </li>
                  <li className="flex items-center gap-2 font-medium text-emerald-600">
                    <ShieldCheck size={15} className="shrink-0" />
                    <span>7-Day Full Money-Back Guarantee</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <Link
                  href={seeCourse.enrollPath}
                  className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs text-center shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <span>Enroll in SEE Batch (NPR {seeCourse.priceNpr.toLocaleString()})</span>
                  <ArrowRight size={14} />
                </Link>
                <p className="text-[10px] text-muted-foreground text-center">
                  💳 Fonepay Dynamic QR · ⚡ Instant Activation
                </p>
              </div>
            </div>

            {/* CEE Medical Super Target Batch */}
            <div className="bg-card border-2 border-indigo-500 rounded-3xl p-6 sm:p-8 shadow-lg flex flex-col justify-between space-y-6 relative">
              <span className="absolute -top-3 right-6 text-[10px] font-black uppercase px-3 py-0.5 rounded-full bg-indigo-600 text-white shadow-xs">
                MECEE 2026 TARGET
              </span>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-indigo-600">CEE ENTRANCE PRO</span>
                </div>

                <div>
                  <div className="text-3xl font-black text-foreground">
                    NPR {ceeCourse.priceNpr.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{ceeCourse.validityText}</p>
                </div>

                <ul className="space-y-2.5 text-xs text-muted-foreground pt-4 border-t border-border/60">
                  <li className="flex items-center gap-2 font-medium text-foreground">
                    <CheckCircle2 size={15} className="text-indigo-500 shrink-0" />
                    <span>15,000+ Topicwise High-Yield MCQs &amp; Rationales</span>
                  </li>
                  <li className="flex items-center gap-2 font-medium text-foreground">
                    <CheckCircle2 size={15} className="text-indigo-500 shrink-0" />
                    <span>200-Question Timed Mocks (-0.25 Negative Marking)</span>
                  </li>
                  <li className="flex items-center gap-2 font-medium text-foreground">
                    <CheckCircle2 size={15} className="text-indigo-500 shrink-0" />
                    <span>Sub-Chapter Revision Notes (PCB &amp; MAT)</span>
                  </li>
                  <li className="flex items-center gap-2 font-medium text-foreground">
                    <CheckCircle2 size={15} className="text-indigo-500 shrink-0" />
                    <span>24/7 AI Medical Doubt Solver Assistant</span>
                  </li>
                  <li className="flex items-center gap-2 font-medium text-emerald-600">
                    <ShieldCheck size={15} className="shrink-0" />
                    <span>7-Day Full Money-Back Guarantee</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <Link
                  href={ceeCourse.enrollPath}
                  className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs text-center shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <span>Enroll in CEE Pro (NPR {ceeCourse.priceNpr.toLocaleString()})</span>
                  <ArrowRight size={14} />
                </Link>
                <p className="text-[10px] text-muted-foreground text-center">
                  💳 Fonepay Dynamic QR · ⚡ Instant Activation
                </p>
              </div>
            </div>

          </div>

          {/* Academic Counselor Assistance Strip */}
          <div className="p-6 rounded-3xl bg-muted/30 border border-border/60 max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div>
              <h3 className="text-sm font-bold text-foreground">Need Guidance or Bank Transfer Assistance?</h3>
              <p className="text-xs text-muted-foreground">Our academic counselors are available on WhatsApp to assist with course selection.</p>
            </div>
            <a
              href={`https://wa.me/${SUPPORT_CONFIG.whatsappNumber}?text=Hello! I need guidance regarding Samyak course enrollments.`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary text-xs py-2.5 px-5 rounded-xl font-bold flex items-center gap-2 shrink-0"
            >
              <MessageCircle size={15} className="text-emerald-500" />
              <span>WhatsApp Counselor</span>
            </a>
          </div>

        </div>
      </main>

      <HomepageFooter />
    </div>
  );
}
