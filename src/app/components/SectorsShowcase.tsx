'use client';

import React from 'react';
import Link from 'next/link';
import { useProgram, ProgramType } from '@/contexts/ProgramContext';
import { Stethoscope, GraduationCap, Languages, Cpu, ArrowRight, Sparkles, CheckCircle2, Users, BookOpen } from 'lucide-react';

const SECTOR_CARDS = [
  {
    id: 'cee' as ProgramType,
    title: 'CEE Medical Entrance',
    badge: 'MBBS / BDS Target',
    badgeColor: 'bg-primary/10 text-primary border-primary/20',
    icon: Stethoscope,
    gradient: 'from-primary/10 via-card to-background hover:border-primary/50',
    btnBg: 'bg-primary text-primary-foreground hover:bg-primary/90',
    students: '40,000+',
    courses: '12 Batches',
    price: 'Rs 2,299',
    description: '15,000+ MCQs, sub-chapter notes, MEC mock tests, and live doubt solving for CEE aspirants.',
    features: ['Chapter-wise MCQ Bank', '2-Player Battle Arena', 'AI Weakness Analyser'],
    link: '/courses?sector=cee',
  },
  {
    id: 'see' as ProgramType,
    title: 'SEE Class 10 Board',
    badge: 'Grade 10 NEB',
    badgeColor: 'bg-bio/10 text-bio border-bio/20',
    icon: GraduationCap,
    gradient: 'from-emerald-500/10 via-card to-background hover:border-bio/50',
    btnBg: 'bg-bio text-white hover:bg-bio/90',
    students: '18,500+',
    courses: '8 Batches',
    price: 'Rs 2,990',
    description: 'Compulsory Science, Mathematics & Optional Math solutions with model papers & top faculty.',
    features: ['Model Question Papers', 'Physics & Chem Diagrams', 'Opt Math Trigonometry Solved'],
    link: '/courses?sector=see',
  },
  {
    id: 'english' as ProgramType,
    title: 'English & IELTS Learning',
    badge: 'Fluency & Test Prep',
    badgeColor: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    icon: Languages,
    gradient: 'from-amber-500/10 via-card to-background hover:border-amber-500/50',
    btnBg: 'bg-amber-600 text-white hover:bg-amber-700',
    students: '12,200+',
    courses: '6 Batches',
    price: 'Rs 1,490',
    description: 'Spoken English drills, IELTS Band 8.0+ mock practice, PTE 79+ templates, and grammar mastery.',
    features: ['AI Speech Evaluation', 'IELTS Writing Correction', 'PTE Speaking Templates'],
    link: '/english',
  },
  {
    id: 'digital' as ProgramType,
    title: 'Digital Skills & AI',
    badge: 'Beginner Academy',
    badgeColor: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
    icon: Cpu,
    gradient: 'from-purple-500/10 via-card to-background hover:border-purple-500/50',
    btnBg: 'bg-purple-600 text-white hover:bg-purple-700',
    students: '15,800+',
    courses: '9 Batches',
    price: 'Rs 1,490',
    description: 'ChatGPT Prompt Engineering, Python programming from scratch, Canva design, and digital marketing.',
    features: ['Practical Hands-On Code', 'ChatGPT Prompt Sheets', 'Freelance Gig Setup Guide'],
    link: '/digital',
  },
];

export default function SectorsShowcase() {
  const { setProgram } = useProgram();

  return (
    <section className="py-20 bg-muted/20 border-y border-border/60">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider bg-primary/10 text-primary px-4 py-1.5 rounded-full border border-primary/20 shadow-xs">
            <Sparkles size={14} /> Multi-Sector Learning Hub
          </span>
          <h2 className="text-hero-md text-foreground font-black tracking-tight">
            Choose Your Goal &amp; Start Learning
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base font-medium">
            PhysicsWallah-grade structured learning for competitive medical entrance, SEE board exams, global English tests, and high-income AI skills.
          </p>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
          {SECTOR_CARDS.map((sec) => {
            const Icon = sec.icon;
            return (
              <div
                key={sec.id}
                className={`relative bg-gradient-to-b ${sec.gradient} border border-border rounded-3xl p-6 sm:p-7 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group`}
              >
                <div className="space-y-4">
                  {/* Badge & Icon */}
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-card border border-border flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
                      <Icon size={22} className="text-foreground" />
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${sec.badgeColor}`}>
                      {sec.badge}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-lg font-black text-foreground group-hover:text-primary transition-colors">
                      {sec.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                      {sec.description}
                    </p>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-2 py-2.5 px-3 rounded-2xl bg-card/60 border border-border/40 text-[11px] font-bold text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Users size={13} className="text-primary" />
                      <span>{sec.students}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <BookOpen size={13} className="text-primary" />
                      <span>{sec.courses}</span>
                    </div>
                  </div>

                  {/* Key Features */}
                  <ul className="space-y-1.5">
                    {sec.features.map((f, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-xs font-semibold text-foreground">
                        <CheckCircle2 size={13} className="text-success shrink-0" />
                        <span className="truncate">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Footer / CTA */}
                <div className="pt-6 mt-6 border-t border-border/50 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Starting From</span>
                    <span className="text-base font-black text-foreground">{sec.price}</span>
                  </div>

                  <Link
                    href={sec.link}
                    onClick={() => setProgram(sec.id)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition-all ${sec.btnBg}`}
                  >
                    <span>View Batches</span>
                    <ArrowRight size={14} />
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
