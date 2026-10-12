'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import PublicNav from '@/components/PublicNav';
import HomepageFooter from '@/app/components/HomepageFooter';
import SeeFreeDiagnosticModal from '@/components/see/SeeFreeDiagnosticModal';
import {
  GraduationCap, BookOpen, Sparkles, CheckCircle2, ArrowRight, ShieldCheck,
  Zap, Play, FileText, Award, Users, Star, Lock, Check, HelpCircle, Target, Download,
  Radio, Flame, Printer, TrendingUp
} from 'lucide-react';

import SeeLiveClassesTab from '@/components/see/SeeLiveClassesTab';
import SeeRecordedClassesTab from '@/components/see/SeeRecordedClassesTab';
import SeeQuestionFeedTab from '@/components/see/SeeQuestionFeedTab';
import SeeTopicMcqTab from '@/components/see/SeeTopicMcqTab';
import SeePastPapersTab from '@/components/see/SeePastPapersTab';
import SeeMarksPracticeTab from '@/components/see/SeeMarksPracticeTab';
import SeeManualsAndPrintablesTab from '@/components/see/SeeManualsAndPrintablesTab';
import SeeProgressTrackerTab from '@/components/see/SeeProgressTrackerTab';

import { getSeeFAQSchema } from '@/lib/seo/structuredData';

type HubTabId = 'live' | 'recorded' | 'feed' | 'mcqs' | 'past_papers' | 'marks_practice' | 'printables' | 'tracker';

const HUB_TABS = [
  { id: 'live', label: '1. Live Classes', icon: Radio, badge: 'LIVE' },
  { id: 'recorded', label: '2. Recorded Classes', icon: Play, badge: '200+ HD' },
  { id: 'feed', label: '3. Daily Question Feed', icon: Flame, badge: 'DAILY' },
  { id: 'mcqs', label: '4. Topicwise MCQs', icon: Zap, badge: '10K+' },
  { id: 'past_papers', label: '5. Past Year Papers', icon: FileText, badge: '10 YRS' },
  { id: 'marks_practice', label: '6. 1-4 Marks Practice', icon: Award, badge: 'RUBRICS' },
  { id: 'printables', label: '7. Manuals & Printables', icon: Printer, badge: 'A4 PRINT' },
  { id: 'tracker', label: '8. Progress Tracker', icon: TrendingUp, badge: 'GPA 4.0' },
] as const;

export default function DedicatedSeeLandingPage() {
  const [isDiagnosticOpen, setIsDiagnosticOpen] = useState(false);
  const [activeHubTab, setActiveHubTab] = useState<HubTabId>('feed');

  const seeCourseSchema = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    '@id': 'https://samyakcee.com/see#course',
    name: 'SEE Class 10 Board Exam Master Course 2082',
    description:
      'Complete SEE Class 10 preparation covering Compulsory Science, Compulsory Math, Optional Math, English, Nepali, and Social Studies with 10,000+ model questions, video lectures, and AI subjective evaluations.',
    provider: {
      '@type': 'EducationalOrganization',
      name: 'Samyak Guru',
      url: 'https://samyakcee.com',
    },
    educationalCredentialAwarded: 'SEE Grade A+ Completion Certificate',
    inLanguage: ['ne', 'en'],
    offers: {
      '@type': 'Offer',
      price: '4990',
      priceCurrency: 'NPR',
      availability: 'https://schema.org/InStock',
      url: 'https://samyakcee.com/checkout?plan=see-class-10-board-topper-batch',
      validFrom: '2026-01-01',
    },
  };

  const seeSubjects = [
    { name: 'Compulsory Science', href: '/see/subject/science', chapters: 24, icon: '🔬', desc: 'Physics, Chemistry, Biology & Astronomy', color: 'border-emerald-500/20 bg-emerald-500/5' },
    { name: 'Compulsory Mathematics', href: '/see/subject/mathematics', chapters: 20, icon: '📐', desc: 'Arithmetic, Algebra, Geometry & Mensuration', color: 'border-blue-500/20 bg-blue-500/5' },
    { name: 'Optional Mathematics', href: '/see/subject/opt_math', chapters: 16, icon: '📊', desc: 'Trigonometry, Coordinate Geometry & Vectors', color: 'border-purple-500/20 bg-purple-500/5' },
    { name: 'English Language', href: '/see/subject/english', chapters: 15, icon: '📚', desc: 'Grammar, Reading Comprehension & Writing', color: 'border-amber-500/20 bg-amber-500/5' },
    { name: 'Nepali (व्याकरण र पाठ्यपुस्तक)', href: '/see/subject/nepali', chapters: 16, icon: '🇳🇵', desc: 'नेपाली व्याकरण, उत्तर लेखन र मोडल प्रश्न समाधान', color: 'border-red-500/20 bg-red-500/5' },
    { name: 'Social Studies & Life Skills', href: '/see/subject/social', chapters: 18, icon: '🌍', desc: 'History, Geography, Civics & Culture', color: 'border-orange-500/20 bg-orange-500/5' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([seeCourseSchema, getSeeFAQSchema()]),
        }}
      />
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
                <GraduationCap size={16} /> FOR CLASS 10 NEB STUDENTS (MISSION GPA 4.0)
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
                SEE CLASS 10 BOARD <span className="text-emerald-400">MASTER SUITE</span>
              </h1>

              <p className="text-base sm:text-lg text-emerald-100 leading-relaxed max-w-xl font-medium">
                Everything required to achieve a 4.0 GPA: Live interactive batches, 200+ HD recorded lectures, daily question feeds, chapter-wise 1-4 marks practice, 10-year solved board papers, and printable practice sets.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <a
                  href="#learning-suite"
                  className="px-7 py-4 rounded-2xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-xl transition-all"
                >
                  <Sparkles size={16} className="fill-slate-950" />
                  <span>EXPLORE 8-PILLAR LEARNING SUITE</span>
                </a>

                <button
                  onClick={() => setIsDiagnosticOpen(true)}
                  className="px-6 py-4 rounded-2xl bg-white text-emerald-950 hover:bg-emerald-50 font-black text-xs sm:text-sm flex items-center gap-2 shadow-xl transition-all"
                >
                  <Target size={16} className="text-emerald-600 animate-pulse" />
                  <span>🎯 FREE DIAGNOSTIC TEST</span>
                </button>
              </div>
            </div>

            {/* 2 Official Batches: English & Nepali Medium */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-card/95 backdrop-blur border border-blue-500/30 rounded-3xl p-5 text-foreground shadow-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 border border-blue-500/30 text-[10px] font-black">
                    🇬🇧 ENGLISH MEDIUM (ID: 379737)
                  </span>
                  <span className="text-xs font-bold text-muted-foreground">In Topper Batch · NPR 4,990</span>
                </div>
                <div>
                  <h3 className="text-sm font-black text-foreground">SEE 2026 — English Medium Mastery</h3>
                  <p className="text-[11px] text-muted-foreground">Complete English Medium lectures, derivations &amp; formulas.</p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <Link href="/batches/see-2026-english-medium" className="text-xs font-bold text-blue-600 hover:underline">
                    View Curriculum →
                  </Link>
                  <Link href="/checkout?plan=see-class-10-board-topper-batch" className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-sm">
                    Enroll Full Batch (NPR 4,990)
                  </Link>
                </div>
              </div>

              <div className="bg-card/95 backdrop-blur border border-red-500/30 rounded-3xl p-5 text-foreground shadow-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-600 border border-red-500/30 text-[10px] font-black">
                    🇳🇵 NEPALI MEDIUM (ID: 367785)
                  </span>
                  <span className="text-xs font-bold text-muted-foreground">In Topper Batch · NPR 4,990</span>
                </div>
                <div>
                  <h3 className="text-sm font-black text-foreground">SEE 2026 — Nepali Medium (नेपाली माध्यम)</h3>
                  <p className="text-[11px] text-muted-foreground">नेपाली माध्यमका सम्पूर्ण भिडियो कक्षाहरू, नोट तथा मोडल समाधान।</p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <Link href="/batches/see-2026-nepali-medium" className="text-xs font-bold text-red-600 hover:underline">
                    पाठ्यक्रम हेर्नुहोस् →
                  </Link>
                  <Link href="/checkout?plan=see-class-10-board-topper-batch" className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black shadow-sm">
                    Enroll Full Batch (NPR 4,990)
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* STAGE 2: THE 8-PILLAR SEE MASTER LEARNING SUITE (THE CORE SUITE) */}
        <section id="learning-suite" className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24 space-y-6">
          <div className="space-y-3 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-black">
              <ShieldCheck size={14} /> THE COMPLETE CLASS 10 BOARD EXAM PREPARATION ENGINE
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-foreground">
              Samyak SEE 8-Pillar Learning Suite
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-3xl">
              Modeled after the world&apos;s leading learning systems (PhysicsWallah, Khan Academy &amp; Allen), every tool required to secure an A+ is fully accessible right here.
            </p>
          </div>

          {/* Institutional Grade Tab Selector Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 p-2 rounded-3xl bg-muted/50 border border-border">
            {HUB_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeHubTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveHubTab(tab.id as HubTabId)}
                  className={`p-3 rounded-2xl flex flex-col items-center justify-center text-center transition-all gap-1.5 ${
                    isActive
                      ? 'bg-card text-foreground shadow-md ring-2 ring-primary scale-[1.02]'
                      : 'hover:bg-card/60 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <div className="relative">
                    <Icon size={18} className={isActive ? 'text-primary' : 'text-muted-foreground'} />
                    {tab.badge && (
                      <span className="absolute -top-2 -right-3 px-1.5 py-0.2 rounded-full text-[8px] font-black uppercase bg-primary text-primary-foreground font-mono">
                        {tab.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-black leading-tight line-clamp-1">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Interactive Tab Viewport */}
          <div className="pt-4">
            {activeHubTab === 'live' && <SeeLiveClassesTab />}
            {activeHubTab === 'recorded' && <SeeRecordedClassesTab />}
            {activeHubTab === 'feed' && <SeeQuestionFeedTab />}
            {activeHubTab === 'mcqs' && <SeeTopicMcqTab />}
            {activeHubTab === 'past_papers' && <SeePastPapersTab />}
            {activeHubTab === 'marks_practice' && <SeeMarksPracticeTab />}
            {activeHubTab === 'printables' && <SeeManualsAndPrintablesTab />}
            {activeHubTab === 'tracker' && <SeeProgressTrackerTab />}
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
              <Link
                key={sub.name}
                href={sub.href}
                className={`p-6 rounded-3xl border ${sub.color} space-y-3 flex flex-col justify-between hover:scale-[1.02] hover:shadow-xl transition-all group`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-3xl">{sub.icon}</span>
                    <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-lg bg-card text-emerald-600 border border-emerald-500/20 font-mono">
                      {sub.chapters} CHAPTERS
                    </span>
                  </div>
                  <h3 className="text-base font-black text-foreground group-hover:text-emerald-600 transition-colors flex items-center justify-between">
                    <span>{sub.name}</span>
                    <ArrowRight size={16} className="text-emerald-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{sub.desc}</p>
                </div>

                <div className="pt-3 border-t border-border/40 text-[11px] font-bold text-emerald-600 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 size={14} /> Video Notes + Solved Past Papers
                  </span>
                  <span className="text-[10px] font-mono uppercase bg-emerald-500/10 px-2 py-0.5 rounded-md">
                    Explore →
                  </span>
                </div>
              </Link>
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

          <div className="grid sm:grid-cols-3 gap-6 max-w-5xl mx-auto">
            
            {/* Free SEE Starter */}
            <div className="p-6 rounded-3xl bg-card border border-border space-y-5 flex flex-col justify-between shadow-sm">
              <div className="space-y-3">
                <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-lg bg-muted text-muted-foreground">FREE STARTER</span>
                <h3 className="text-lg font-black text-foreground">Free SEE Starter</h3>
                <div className="text-3xl font-black text-foreground">NPR 0</div>
                <p className="text-xs text-muted-foreground leading-relaxed">Sample model paper, diagnostic test, and basic study syllabus preview.</p>
              </div>

              <Link
                href="/free-resources"
                className="w-full py-3 rounded-xl bg-muted text-foreground hover:bg-muted/80 font-black text-xs text-center transition-colors block"
              >
                Explore Free Notes
              </Link>
            </div>

            {/* SEE Score Booster (Math + Science) */}
            <div className="p-6 rounded-3xl bg-card border border-emerald-500/30 space-y-5 flex flex-col justify-between shadow-md">
              <div className="space-y-3">
                <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">SUBJECT COURSE · 120 DAYS</span>
                <h3 className="text-lg font-black text-foreground">Opt Math &amp; Science Booster</h3>
                <div className="text-3xl font-black text-emerald-600">NPR 2,990</div>
                <p className="text-xs text-muted-foreground leading-relaxed">120 days access to intensive derivations, numerical drills, and board model sets.</p>
              </div>

              <div className="space-y-2">
                <Link
                  href="/checkout?plan=see-opt-math-science-mastery"
                  className="w-full py-3 rounded-xl bg-card border border-emerald-500 text-emerald-600 hover:bg-emerald-500/10 font-black text-xs text-center transition-colors block"
                >
                  Enroll in Booster (NPR 2,990)
                </Link>
                <Link
                  href="/courses/see-opt-math-science-mastery"
                  className="w-full py-2 text-[11px] font-bold text-muted-foreground hover:text-foreground text-center block underline"
                >
                  View Syllabus, Faculty &amp; Refund Terms
                </Link>
              </div>
            </div>

            {/* SEE Board Topper Batch */}
            <div className="p-6 rounded-3xl bg-gradient-to-b from-emerald-600 to-teal-700 text-white space-y-5 flex flex-col justify-between shadow-xl relative overflow-hidden">
              <div className="absolute top-3 right-3 text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-white text-emerald-950">RECOMMENDED</div>
              <div className="space-y-3">
                <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-lg bg-white/20 text-white">LIVE BATCH · 365 DAYS</span>
                <h3 className="text-lg font-black text-white">SEE Board Topper Batch</h3>
                <div className="text-3xl font-black text-white">NPR 4,990</div>
                <p className="text-xs text-emerald-100 leading-relaxed">Full 80+ chapter coverage, 10-year question bank, and 24/7 AI Tutor access across core subjects.</p>
              </div>

              <div className="space-y-2">
                <Link
                  href="/checkout?plan=see-class-10-board-topper-batch"
                  className="w-full py-3 rounded-xl bg-white text-emerald-950 hover:bg-emerald-50 font-black text-xs text-center shadow-lg transition-colors block"
                >
                  Enroll Full Batch (NPR 4,990)
                </Link>
                <Link
                  href="/courses/see-class-10-board-topper-batch"
                  className="w-full py-2 text-[11px] font-bold text-emerald-100 hover:text-white text-center block underline"
                >
                  View Syllabus, Faculty &amp; Refund Terms
                </Link>
              </div>
            </div>

          </div>
        </section>

      </main>

      <HomepageFooter />
    </div>
  );
}
