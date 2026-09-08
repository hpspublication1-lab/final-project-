'use client';

import React from 'react';
import Link from 'next/link';
import { useProgram, CanonicalCourseId } from '@/contexts/ProgramContext';
import { useEntitlements } from '@/lib/hooks/useEntitlements';
import { Stethoscope, GraduationCap, Languages, Cpu, TrendingUp, ArrowRight, Sparkles, CheckCircle2, Play } from 'lucide-react';

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
    id: 'cee_medical',
    title: 'CEE — Medical Entrance (MBBS / BDS)',
    badge: 'MEC Entrance 2026',
    badgeColor: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
    icon: Stethoscope,
    gradient: 'from-indigo-500/10 via-card to-background hover:border-indigo-500/50',
    btnBg: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-600/20',
    students: '40,000+',
    courses: '12 Batches',
    price: 'Rs 2,299',
    description: '15,000+ high-yield MCQs, 200-Q timed MEC mock tests with -0.25 negative marking, real-time 1v1 Battle Arena, and 24/7 AI Medical Doubt Solver.',
    features: ['15,000+ Topicwise MCQs & Solutions', '200-Q Timed Mocks (-0.25 Negative Marking)', '1v1 Battle Arena & 24/7 AI Medical Tutor'],
    link: '/cee-medical-entrance',
    sku: 'student-yearly',
  },
  {
    id: 'see_class_10',
    title: 'SEE — Class 10 Board Exam (GPA 4.0)',
    badge: 'Target 4.0 GPA',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    icon: GraduationCap,
    gradient: 'from-emerald-500/10 via-card to-background hover:border-emerald-500/50',
    btnBg: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/20',
    students: '18,500+',
    courses: '8 Batches',
    price: 'Rs 2,490',
    description: 'Live interactive classes, 200+ HD recorded lectures, daily question feeds, chapter-wise 1-4 marks practice, 10-year past papers & printable practice sets.',
    features: ['Live Classes & 200+ HD Recorded Lectures', '1, 2, 3, 4 Marks Chapter-Wise Solutions', '10-Year Solved Papers & Printable A4 Sets'],
    link: '/see',
    sku: 'student-yearly',
  },
  {
    id: 'ielts',
    title: 'IELTS & English Language',
    badge: 'Target Band 7.5+',
    badgeColor: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    icon: Languages,
    gradient: 'from-amber-500/10 via-card to-background hover:border-amber-500/50',
    btnBg: 'bg-amber-600 text-white hover:bg-amber-700 shadow-amber-600/20',
    students: '12,200+',
    courses: '6 Batches',
    price: 'Rs 1,490',
    description: 'IELTS Academic & GT Band 7.5+ mastery, interactive AI speaking simulator, writing essay correction, and listening drills.',
    features: ['AI Speaking Cue Card Evaluator', 'IELTS Writing Task 1 & 2 Scoring', 'Speed Reading & Audio Drills'],
    link: '/ielts-preparation',
    sku: 'crash-course',
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
    description: 'Master Facebook/Instagram Ads, Google Ads, SEO optimization, copy funnels, and portfolio project freelancing.',
    features: ['Meta Ads High-ROAS Playbook', 'SEO Keyword & Audit Framework', '5 Live Hands-On Projects'],
    link: '/digital-marketing',
    sku: 'crash-course',
  },
  {
    id: 'artificial_intelligence',
    title: 'Artificial Intelligence (AI)',
    badge: 'AI & Python',
    badgeColor: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
    icon: Cpu,
    gradient: 'from-purple-500/10 via-card to-background hover:border-purple-500/50',
    btnBg: 'bg-purple-600 text-white hover:bg-purple-700 shadow-purple-600/20',
    students: '16,800+',
    courses: '9 Batches',
    price: 'Rs 1,490',
    description: 'Master Python coding fundamentals, LLM API integrations (OpenAI & Gemini), automation scripts, and build real-world AI tools.',
    features: ['Python Core Syntax Mastery', 'OpenAI & Gemini API Integrations', '6 Practical Hands-On AI Projects'],
    link: '/ai-python-course',
    sku: 'crash-course',
  },
];

export default function SectorsShowcase() {
  const { setProgram } = useProgram();
  const { isEnrolledIn } = useEntitlements();

  return (
    <section id="courses" className="py-20 bg-muted/20 border-y border-border/60">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 px-3.5 py-1 rounded-full border border-primary/20">
            PROGRAMS IN SAMYAK TUTOR
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            Choose Your Learning Track
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base font-medium max-w-2xl mx-auto">
            Everything you need — structured syllabus, practice drills, mock exams, and AI tutoring — seamlessly unified in one place.
          </p>
        </div>

        {/* 5 Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
          {SECTOR_CARDS.map((sec) => {
            const Icon = sec.icon;
            const enrolled = isEnrolledIn(sec.id);

            return (
              <div
                key={sec.id}
                className={`relative bg-card border border-border/80 hover:border-primary/40 dark:border-white/10 dark:hover:border-primary/40 rounded-3xl p-5 sm:p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group`}
              >
                <div className="space-y-4">
                  {/* Badge & Icon */}
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-muted/60 border border-border/60 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                      <Icon size={22} className="text-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${sec.badgeColor}`}>
                      {sec.badge}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
                      {sec.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed line-clamp-3">
                      {sec.description}
                    </p>
                  </div>

                  {/* Access Status Banner */}
                  <div className="py-2 px-3 rounded-xl bg-muted/40 border border-border/50 text-[11px] font-semibold flex items-center justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    {enrolled ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 size={12} /> Enrolled
                      </span>
                    ) : (
                      <span className="text-muted-foreground font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Available
                      </span>
                    )}
                  </div>

                  {/* Key Features */}
                  <ul className="space-y-1.5 pt-1">
                    {sec.features.map((f, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-[11px] font-medium text-foreground">
                        <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                        <span className="truncate">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Footer / CTA */}
                <div className="pt-4 mt-5 border-t border-border/60 flex flex-col gap-2.5">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Full Course</span>
                    <span className="text-base font-extrabold text-foreground">{sec.price}</span>
                  </div>

                  <Link
                    href={sec.link}
                    onClick={() => setProgram(sec.id)}
                    className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99] ${sec.btnBg}`}
                  >
                    {enrolled ? (
                      <>
                        <Play size={13} className="fill-current" />
                        <span>Continue Learning</span>
                      </>
                    ) : (
                      <>
                        <span>Explore Course</span>
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
