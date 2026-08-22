'use client';

import React from 'react';
import Link from 'next/link';
import { useProgram, CanonicalCourseId } from '@/contexts/ProgramContext';
import { useEntitlements } from '@/lib/hooks/useEntitlements';
import { Stethoscope, GraduationCap, Languages, Cpu, TrendingUp, ArrowRight, Sparkles, CheckCircle2, Users, BookOpen, Lock, Play } from 'lucide-react';

interface SectorCard {
  id: CanonicalCourseId;
  title: string;
  badge: string;
  badgeColor: string;
  icon: any;
  gradient: string;
  btnBg: string;
  students: string;
  courses: string;
  price: string;
  description: string;
  features: string[];
  link: string;
  sku: string;
}

const SECTOR_CARDS: SectorCard[] = [
  {
    id: 'see_class_10',
    title: 'SEE — Class 10 Board Exam',
    badge: 'Grade 10 NEB',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    icon: GraduationCap,
    gradient: 'from-emerald-500/10 via-card to-background hover:border-emerald-500/50',
    btnBg: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/20',
    students: '18,500+',
    courses: '8 Batches',
    price: 'Rs 2,990',
    description: 'Compulsory Science, Math, Opt Math, Social & English solutions with 10-year question bank and AI subjective grading.',
    features: ['NEB 10-Year Question Bank', 'AI Handwritten Answer Checker', 'Class 10 Video Classes'],
    link: '/student-dashboard',
    sku: 'see-class-10-board-topper-batch',
  },
  {
    id: 'cee_medical',
    title: 'CEE — Medical Entrance',
    badge: 'MBBS / BDS Target',
    badgeColor: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
    icon: Stethoscope,
    gradient: 'from-indigo-500/10 via-card to-background hover:border-indigo-500/50',
    btnBg: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-600/20',
    students: '40,000+',
    courses: '12 Batches',
    price: 'Rs 2,299',
    description: '15,000+ MCQs, sub-chapter high-yield notes, 200-Q timed MEC mock tests, and real-time 2-player battle arena.',
    features: ['15,000+ Topicwise MCQs', 'Real-Time 2-Player Battle Arena', 'MEC 200-Q Full Mock Exams'],
    link: '/student-dashboard',
    sku: 'cee-mbbs-mastery-2026',
  },
  {
    id: 'ielts',
    title: 'IELTS & English Language',
    badge: 'Target Band 8.0+',
    badgeColor: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    icon: Languages,
    gradient: 'from-amber-500/10 via-card to-background hover:border-amber-500/50',
    btnBg: 'bg-amber-600 text-white hover:bg-amber-700 shadow-amber-600/20',
    students: '12,200+',
    courses: '6 Batches',
    price: 'Rs 1,490',
    description: 'IELTS Academic & GT Band 8.0+ mastery, interactive AI speaking simulator, writing essay correction, and listening drills.',
    features: ['AI Speaking Cue Card Evaluator', 'IELTS Writing Task 1 & 2 Scoring', 'PTE & CEFR Fluency Drills'],
    link: '/student-dashboard',
    sku: 'english-ielts-target-8-mastery',
  },
  {
    id: 'digital_marketing',
    title: 'Digital Marketing Skills',
    badge: 'Meta Ads & SEO',
    badgeColor: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
    icon: TrendingUp,
    gradient: 'from-rose-500/10 via-card to-background hover:border-rose-500/50',
    btnBg: 'bg-rose-600 text-white hover:bg-rose-700 shadow-rose-600/20',
    students: '14,600+',
    courses: '7 Batches',
    price: 'Rs 1,990',
    description: 'Master Facebook/Instagram Ads, TikTok viral short-form growth, SEO optimization, copy funnels, and freelancing.',
    features: ['Meta Ads High-ROAS Playbook', 'TikTok Viral Short Hooks', '100+ Ad Swipe File Templates'],
    link: '/student-dashboard',
    sku: 'digital-marketing-canva-freelancing',
  },
  {
    id: 'artificial_intelligence',
    title: 'Artificial Intelligence (AI)',
    badge: 'AI & Automation',
    badgeColor: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
    icon: Cpu,
    gradient: 'from-purple-500/10 via-card to-background hover:border-purple-500/50',
    btnBg: 'bg-purple-600 text-white hover:bg-purple-700 shadow-purple-600/20',
    students: '16,800+',
    courses: '9 Batches',
    price: 'Rs 1,490',
    description: 'Master ChatGPT Prompt Engineering, Python coding from scratch, No-Code AI automations, and build real-world AI applications.',
    features: ['Interactive Prompt Studio Sandbox', '5 Real-World Python Projects', 'No-Code AI Automation Agents'],
    link: '/student-dashboard',
    sku: 'digital-ai-prompt-engineering',
  },
];

export default function SectorsShowcase() {
  const { setProgram } = useProgram();
  const { isEnrolledIn, loading: enrollLoading } = useEntitlements();

  return (
    <section className="py-20 bg-muted/20 border-y border-border/60">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider bg-primary/10 text-primary px-4 py-1.5 rounded-full border border-primary/20 shadow-xs">
            <Sparkles size={14} /> SOUMYA GURU PLATFORM
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-foreground tracking-tight">
            Choose Your Learning Path
          </h2>
          <p className="text-muted-foreground text-xs sm:text-base font-medium">
            Select your dedicated portal. Each course provides an independent, specialized learning experience tailored to your target goal.
          </p>
        </div>

        {/* 5 Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4.5">
          {SECTOR_CARDS.map((sec) => {
            const Icon = sec.icon;
            const enrolled = isEnrolledIn(sec.id);

            return (
              <div
                key={sec.id}
                className={`relative bg-gradient-to-b ${sec.gradient} border border-border rounded-3xl p-5 sm:p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group`}
              >
                <div className="space-y-3.5">
                  {/* Badge & Icon */}
                  <div className="flex items-center justify-between">
                    <div className="w-11 h-11 rounded-2xl bg-card border border-border flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
                      <Icon size={20} className="text-foreground" />
                    </div>
                    <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${sec.badgeColor}`}>
                      {sec.badge}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-base font-black text-foreground group-hover:text-primary transition-colors leading-snug">
                      {sec.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed line-clamp-3">
                      {sec.description}
                    </p>
                  </div>

                  {/* Access Status Banner */}
                  <div className="py-2 px-3 rounded-xl bg-card/70 border border-border/50 text-[11px] font-bold flex items-center justify-between">
                    <span className="text-muted-foreground">Access Status:</span>
                    {enrolled ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center gap-1">
                        <CheckCircle2 size={12} /> Active Access
                      </span>
                    ) : (
                      <span className="text-muted-foreground font-semibold flex items-center gap-1">
                        Available
                      </span>
                    )}
                  </div>

                  {/* Key Features */}
                  <ul className="space-y-1 pt-1">
                    {sec.features.map((f, idx) => (
                      <li key={idx} className="flex items-center gap-1.5 text-[11px] font-medium text-foreground">
                        <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                        <span className="truncate">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Footer / CTA */}
                <div className="pt-4 mt-5 border-t border-border/50 flex flex-col gap-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Price</span>
                    <span className="text-sm font-black text-foreground">{sec.price}</span>
                  </div>

                  <Link
                    href={sec.link}
                    onClick={() => setProgram(sec.id)}
                    className={`w-full py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-sm transition-all ${sec.btnBg}`}
                  >
                    {enrolled ? (
                      <>
                        <Play size={13} className="fill-current" />
                        <span>Continue Learning</span>
                      </>
                    ) : (
                      <>
                        <span>Enter {sec.title.split('—')?.[0]?.trim() || 'Portal'}</span>
                        <ArrowRight size={13} />
                      </>
                    )}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

