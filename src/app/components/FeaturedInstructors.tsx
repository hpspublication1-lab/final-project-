'use client';

import React from 'react';
import Link from 'next/link';
import { Award, GraduationCap, ArrowRight, ShieldCheck, Stethoscope, BookOpen, Atom, Sparkles } from 'lucide-react';

interface FacultyMember {
  name: string;
  role: string;
  discipline: string;
  affiliationBadge: string;
  monogram: string;
  crestBg: string;
  crestBorder: string;
  crestText: string;
  icon: React.ElementType;
  experience: string;
  qualification: string;
  bio: string;
}

const FACULTY: FacultyMember[] = [
  {
    name: 'Dr. Samyak Shrestha',
    role: 'Chief Medical Entrance Faculty',
    discipline: 'Zoology & Human Physiology',
    affiliationBadge: 'MBBS (IOM Maharajgunj)',
    monogram: 'IOM',
    crestBg: 'bg-indigo-500/10',
    crestBorder: 'border-indigo-500/30',
    crestText: 'text-indigo-600 dark:text-indigo-400',
    icon: Stethoscope,
    experience: '8+ Years Medical Prep',
    qualification: 'IOM Rank Merit Holder',
    bio: 'Specializing in CEE 200Q blueprint mastery, clinical histology mnemonics, and high-frequency cardiovascular and nervous system question breakdowns.',
  },
  {
    name: 'Prof. Pradeep Poudel',
    role: 'Lead Physics & Mechanics Faculty',
    discipline: 'Mechanics, Optics & Modern Physics',
    affiliationBadge: 'M.Sc. Physics (TU Kirtipur)',
    monogram: 'TU',
    crestBg: 'bg-emerald-500/10',
    crestBorder: 'border-emerald-500/30',
    crestText: 'text-emerald-600 dark:text-emerald-400',
    icon: Atom,
    experience: '12+ Years Board & Entrance',
    qualification: 'Top Physics Gold Medalist',
    bio: 'Mentoring thousands of top rankers across NEB Class 12 Boards and CEE/IOE entrances with simplified derivation maps and 30-second numerical shortcuts.',
  },
  {
    name: 'Dr. Aarati Sharma',
    role: 'Senior Medical Chemistry Specialist',
    discipline: 'Organic Mechanisms & Physical Chem',
    affiliationBadge: 'Ph.D. Chemistry (KU)',
    monogram: 'KU',
    crestBg: 'bg-purple-500/10',
    crestBorder: 'border-purple-500/30',
    crestText: 'text-purple-600 dark:text-purple-400',
    icon: BookOpen,
    experience: '9+ Years Entrance Coaching',
    qualification: 'Senior Curriculum Evaluator',
    bio: 'Specializing in high-yield reaction series, stereochemistry, coordination compounds, and negative-mark trap avoidance across medical entrance exams.',
  },
  {
    name: 'Er. Laxman KC',
    role: 'Lead Engineering & Mathematics Lead',
    discipline: 'Calculus, Vectors & Analytical Math',
    affiliationBadge: 'M.Sc. Engineering (TU Pulchowk)',
    monogram: 'IOE',
    crestBg: 'bg-blue-500/10',
    crestBorder: 'border-blue-500/30',
    crestText: 'text-blue-600 dark:text-blue-400',
    icon: GraduationCap,
    experience: '10+ Years IOE / BE Faculty',
    qualification: 'Pulchowk Campus Alumnus',
    bio: 'Expert in higher mathematics for IOE BE entrance and Grade 10 Opt Math, focusing on conceptual clarity, graph transformations, and speed drills.',
  },
];

export default function FeaturedInstructors() {
  return (
    <section id="faculty" aria-label="Academic Faculty" className="py-20 sm:py-28 bg-muted/20 border-t border-border/60">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-14">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck size={14} />
              <span>Accredited Faculty &amp; Examiners</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
              Learn from Nepal&apos;s Foremost Subject Specialists
            </h2>
            <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed font-medium">
              Our faculty includes medical doctors from IOM Maharajgunj, university toppers, and board examiners dedicated to your top rank.
            </p>
          </div>

          <Link
            href="/courses"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-card border border-border text-xs font-bold text-foreground hover:bg-muted transition-all shrink-0 shadow-xs"
          >
            <span>Explore All Faculty Batches</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {/* Instructor Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {FACULTY.map((inst, idx) => {
            const Icon = inst.icon;
            return (
              <div
                key={`faculty-${idx}`}
                className="bg-card border border-border/80 rounded-3xl p-6 shadow-xs hover:shadow-lg hover:border-primary/40 transition-all flex flex-col justify-between space-y-5 group"
              >
                <div className="space-y-4">
                  {/* Top Monogram Crest */}
                  <div className="flex items-center justify-between">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${inst.crestBg} ${inst.crestBorder} ${inst.crestText} font-black text-sm tracking-wider shadow-xs group-hover:scale-105 transition-transform`}>
                      {inst.monogram}
                    </div>
                    <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-full bg-muted text-muted-foreground border border-border/60">
                      {inst.discipline}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                      {inst.name}
                    </h3>
                    <p className="text-xs font-semibold text-primary mt-0.5">{inst.role}</p>
                    <p className="text-[11px] font-medium text-muted-foreground mt-0.5">{inst.affiliationBadge}</p>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {inst.bio}
                  </p>
                </div>

                {/* Footer Credential Tag */}
                <div className="pt-3 border-t border-border/60 flex items-center justify-between text-[11px] font-medium text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Icon size={13} className="text-primary shrink-0" />
                    <span>{inst.experience}</span>
                  </span>
                  <span className="font-semibold text-foreground flex items-center gap-1">
                    <Award size={13} className="text-amber-500 shrink-0" />
                    <span>{inst.qualification}</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
