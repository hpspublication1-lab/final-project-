'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import PublicNav from '@/components/PublicNav';
import HomepageFooter from '@/app/components/HomepageFooter';
import SeeFreeDiagnosticModal from '@/components/see/SeeFreeDiagnosticModal';
import {
  GraduationCap, BookOpen, Sparkles, CheckCircle2, ArrowRight, ShieldCheck,
  Zap, Play, FileText, Award, Users, Star, Lock, Check, HelpCircle, Target
} from 'lucide-react';

export default function DedicatedSeeLandingPage() {
  const [isDiagnosticOpen, setIsDiagnosticOpen] = useState(false);

  const seeSubjects = [
    { name: 'Compulsory Science', chapters: 24, icon: '🔬', desc: 'Physics, Chemistry, Biology & Astronomy', color: 'border-emerald-500/20 bg-emerald-500/5' },
    { name: 'Compulsory Mathematics', chapters: 20, icon: '📐', desc: 'Arithmetic, Algebra, Geometry & Mensuration', color: 'border-blue-500/20 bg-blue-500/5' },
    { name: 'Optional Mathematics', chapters: 16, icon: '📊', desc: 'Trigonometry, Coordinate Geometry & Vectors', color: 'border-purple-500/20 bg-purple-500/5' },
    { name: 'English Language', chapters: 15, icon: '📚', desc: 'Grammar, Reading Comprehension & Writing', color: 'border-amber-500/20 bg-amber-500/5' },
    { name: 'Nepali (व्याकरण र पाठ्यपुस्तक)', chapters: 16, icon: '🇳🇵', desc: 'नेपाली व्याकरण, उत्तर लेखन र मोडल प्रश्न समाधान', color: 'border-red-500/20 bg-red-500/5' },
    { name: 'Social Studies & Life Skills', chapters: 18, icon: '🌍', desc: 'History, Geography, Civics & Culture', color: 'border-orange-500/20 bg-orange-500/5' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <PublicNav />

      {/* Interactive Free Diagnostic Modal */}
      <SeeFreeDiagnosticModal
        isOpen={isDiagnosticOpen}
        onClose={() => setIsDiagnosticOpen(false)}
      />

      <main className="w-full space-y-16 pb-20">
        
        {/* STAGE 1: HERO SECTION */}
        <section className="pt-28 pb-16 bg-gradient-to-b from-emerald-900 via-emerald-950 to-background text-white relative overflow-hidden">
          <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 grid lg:grid-cols-12 gap-10 items-center">
            
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black border border-emerald-500/30">
                <GraduationCap size={16} /> FOR CLASS 10 NEB STUDENTS
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
                MASTER SEE WITH <span className="text-emerald-400">SAMYAK AI</span>
              </h1>

              <p className="text-base sm:text-lg text-emerald-100 leading-relaxed max-w-xl font-medium">
                AI-powered SEE preparation with live classes, mock tests, personalized performance tracking and doubt solving.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  onClick={() => setIsDiagnosticOpen(true)}
                  className="px-7 py-4 rounded-2xl bg-white text-emerald-950 hover:bg-emerald-50 font-black text-xs sm:text-sm flex items-center gap-2 shadow-xl transition-all"
                >
                  <Target size={16} className="text-emerald-600 animate-pulse" />
                  <span>🎯 TAKE FREE SEE DIAGNOSTIC</span>
                </button>

                <a
                  href="#curriculum"
                  className="px-7 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-xl transition-all"
                >
                  <span>EXPLORE SEE COURSE</span>
                  <ArrowRight size={16} />
                </a>
              </div>
            </div>

            {/* Quick Batch Overview Card */}
            <div className="lg:col-span-5 bg-card/95 backdrop-blur border border-emerald-500/30 rounded-3xl p-6 sm:p-8 text-foreground shadow-2xl space-y-6">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase text-emerald-600">OFFICIAL BATCH SPECS</span>
                <h3 className="text-xl font-black text-foreground">Samyak SEE 4.0 GPA Batch</h3>
              </div>

              <ul className="space-y-3 text-xs font-semibold text-muted-foreground">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                  <span>147 Chapter HD Video Lectures &amp; Notes</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                  <span>10-Year NEB Past Questions &amp; Model Solutions</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                  <span>AI Handwritten Subjective Answer Sheet Marking</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                  <span>Chapter-wise Model Test Sets &amp; Practice Drills</span>
                </li>
              </ul>

              <div className="pt-4 border-t border-border flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground block">ONE-TIME FEE</span>
                  <span className="text-2xl font-black text-foreground">NPR 2,990</span>
                </div>
                <Link
                  href="/see/checkout"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-black text-xs hover:bg-emerald-700 transition-colors"
                >
                  Get Instant Access
                </Link>
              </div>
            </div>

          </div>
        </section>


        {/* STAGE 2: FREE SAMPLE DIAGNOSTIC TEST */}
        <section id="free-test" className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-28">
          <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-card via-card to-emerald-500/5 border border-emerald-500/30 shadow-xl space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-black">
                  <Zap size={14} /> FREE DIAGNOSTIC DEMO
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-foreground">
                  Try Free SEE Sample Model Paper &amp; AI Marker
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Test your current SEE preparation. Solve sample Science &amp; Math model questions and upload your handwritten solution to evaluate step-by-step AI marking against NEB marking schemes.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                <button
                  onClick={() => setIsDiagnosticOpen(true)}
                  className="px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg"
                >
                  <Target size={16} />
                  <span>🎯 TAKE FREE SEE DIAGNOSTIC</span>
                </button>

                <Link
                  href="/practice/subjective"
                  className="px-6 py-3.5 rounded-2xl bg-card border border-emerald-500/40 text-foreground hover:bg-emerald-500/10 font-black text-xs sm:text-sm flex items-center justify-center gap-2"
                >
                  <Sparkles size={16} className="text-emerald-500" />
                  <span>Try AI Answer Sheet Marker</span>
                </Link>
              </div>
            </div>
          </div>
        </section>


        {/* STAGE 3: COURSE CURRICULUM & SUBJECT BREAKDOWN */}
        <section id="curriculum" className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 scroll-mt-28">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-[10px] font-black uppercase text-emerald-600">FULL GRADE 10 CURRICULUM</span>
            <h2 className="text-2xl sm:text-4xl font-black text-foreground">SEE Master Batch Curriculum</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Everything required to achieve a 4.0 GPA across all 6 core SEE compulsory &amp; optional subjects.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {seeSubjects.map((sub) => (
              <div key={sub.name} className={`p-6 rounded-3xl border ${sub.color} space-y-3 flex flex-col justify-between`}>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-3xl">{sub.icon}</span>
                    <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-lg bg-card text-emerald-600 border border-emerald-500/20">
                      {sub.chapters} CHAPTERS
                    </span>
                  </div>
                  <h3 className="text-base font-black text-foreground">{sub.name}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{sub.desc}</p>
                </div>

                <div className="pt-3 border-t border-border/40 text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 size={14} /> Video Notes + NEB Solutions Included
                </div>
              </div>
            ))}
          </div>
        </section>


        {/* STAGE 4: PROOF & PLATFORM VERIFICATION */}
        <section className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-8 sm:p-12 rounded-3xl bg-card border border-border space-y-8">
            <div className="text-center max-w-xl mx-auto space-y-2">
              <span className="text-[10px] font-black uppercase text-emerald-600">VERIFIABLE QUALITY</span>
              <h2 className="text-2xl sm:text-3xl font-black text-foreground">Platform Verification &amp; Standards</h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 text-center">
              <div className="p-5 rounded-2xl bg-muted/30 border border-border space-y-2">
                <ShieldCheck size={28} className="text-emerald-500 mx-auto" />
                <h4 className="text-sm font-black text-foreground">100% NEB Syllabus Alignment</h4>
                <p className="text-xs text-muted-foreground">Strictly mapped to Curriculum Development Centre (CDC) Nepal specifications.</p>
              </div>

              <div className="p-5 rounded-2xl bg-muted/30 border border-border space-y-2">
                <FileText size={28} className="text-blue-500 mx-auto" />
                <h4 className="text-sm font-black text-foreground">10-Year Solution Vault</h4>
                <p className="text-xs text-muted-foreground">Every past paper from 2072–2081 completely solved with step-by-step schemes.</p>
              </div>

              <div className="p-5 rounded-2xl bg-muted/30 border border-border space-y-2">
                <Sparkles size={28} className="text-amber-500 mx-auto" />
                <h4 className="text-sm font-black text-foreground">NEB Marking Rubric AI</h4>
                <p className="text-xs text-muted-foreground">Evaluates handwritten subjective paper uploads against official board answer keys.</p>
              </div>

              <div className="p-5 rounded-2xl bg-muted/30 border border-border space-y-2">
                <Award size={28} className="text-purple-500 mx-auto" />
                <h4 className="text-sm font-black text-foreground">Target GPA 4.0 Blueprint</h4>
                <p className="text-xs text-muted-foreground">Structured 12-week study plan with daily revision checkpoints.</p>
              </div>
            </div>
          </div>
        </section>


        {/* STAGE 5: PAYMENT & ENROLLMENT CTA */}
        <section id="payment" className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-28 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-[10px] font-black uppercase text-emerald-600">ONE CLEAR PRICING ARCHITECTURE</span>
            <h2 className="text-2xl sm:text-4xl font-black text-foreground">Choose Your SEE Learning Plan</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">Transparent pricing designed for every Grade 10 student in Nepal.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Free SEE Starter */}
            <div className="p-6 rounded-3xl bg-card border border-border space-y-5 flex flex-col justify-between shadow-sm">
              <div className="space-y-3">
                <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-lg bg-muted text-muted-foreground">FREE STARTER</span>
                <h3 className="text-lg font-black text-foreground">Free SEE Starter</h3>
                <div className="text-3xl font-black text-foreground">NPR 0</div>
                <p className="text-xs text-muted-foreground leading-relaxed">Sample model paper, diagnostic test, and basic study syllabus preview.</p>
              </div>

              <Link
                href="/practice"
                className="w-full py-3 rounded-xl bg-muted text-foreground hover:bg-muted/80 font-black text-xs text-center transition-colors block"
              >
                Start Free Trial
              </Link>
            </div>

            {/* SEE 7-Day Challenge */}
            <div className="p-6 rounded-3xl bg-card border border-emerald-500/30 space-y-5 flex flex-col justify-between shadow-md">
              <div className="space-y-3">
                <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">BOOTCAMP</span>
                <h3 className="text-lg font-black text-foreground">SEE 7-Day Challenge</h3>
                <div className="text-3xl font-black text-emerald-600">NPR 199</div>
                <p className="text-xs text-muted-foreground leading-relaxed">7-day high-yield revision bootcamp with 1 full mock test evaluation.</p>
              </div>

              <Link
                href="/see/checkout?plan=7day"
                className="w-full py-3 rounded-xl bg-card border border-emerald-500 text-emerald-600 hover:bg-emerald-500/10 font-black text-xs text-center transition-colors block"
              >
                Join 7-Day Challenge
              </Link>
            </div>

            {/* SEE Mission A+ */}
            <div className="p-6 rounded-3xl bg-gradient-to-b from-emerald-600 to-teal-700 text-white space-y-5 flex flex-col justify-between shadow-xl relative overflow-hidden">
              <div className="absolute top-3 right-3 text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-white text-emerald-950">POPULAR</div>
              <div className="space-y-3">
                <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-lg bg-white/20 text-white">COMPLETE BATCH</span>
                <h3 className="text-lg font-black text-white">SEE Mission A+</h3>
                <div className="text-3xl font-black text-white">NPR 2,490</div>
                <p className="text-xs text-emerald-100 leading-relaxed">Full 147 HD video chapters, 10-year question bank, and 24/7 AI Tutor access.</p>
              </div>

              <Link
                href="/see/checkout?plan=mission_a"
                className="w-full py-3 rounded-xl bg-white text-emerald-950 hover:bg-emerald-50 font-black text-xs text-center shadow-lg transition-colors block"
              >
                Enroll Mission A+
              </Link>
            </div>

            {/* SEE Mission A+ Pro */}
            <div className="p-6 rounded-3xl bg-card border border-amber-500/40 space-y-5 flex flex-col justify-between shadow-lg">
              <div className="space-y-3">
                <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 border border-amber-500/20">ALL-INCLUSIVE PRO</span>
                <h3 className="text-lg font-black text-foreground">SEE Mission A+ Pro</h3>
                <div className="text-3xl font-black text-amber-600">NPR 4,990</div>
                <p className="text-xs text-muted-foreground leading-relaxed">Everything in Mission A+ plus 1-on-1 AI Teacher Avatar stage and unlimited handwritten paper OCR evaluations.</p>
              </div>

              <Link
                href="/see/checkout?plan=mission_pro"
                className="w-full py-3 rounded-xl bg-amber-500 text-slate-950 hover:bg-amber-600 font-black text-xs text-center transition-colors block"
              >
                Enroll Mission A+ Pro
              </Link>
            </div>

          </div>
        </section>

      </main>

      <HomepageFooter />
    </div>
  );
}
