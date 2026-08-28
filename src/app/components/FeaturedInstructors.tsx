'use client';

import React from 'react';
import Link from 'next/link';
import { Star, Award, GraduationCap, ArrowRight, Sparkles } from 'lucide-react';

const INSTRUCTORS = [
  {
    name: 'Dr. Samyak Shrestha',
    role: 'Chief Medical Educator',
    sector: 'CEE Medical',
    sectorBadge: 'bg-primary/10 text-primary border-primary/20',
    avatar: '🩺',
    experience: '8+ Years Teaching',
    rating: 4.9,
    bio: 'Medical Educator specializing in CEE entrance strategy, high-yield biology sub-chapter notes, and high-frequency MCQ explanation breakdowns.',
  },
  {
    name: 'Pradeep Poudel Sir',
    role: 'NEB Science & Math Lead',
    sector: 'SEE Class 10',
    sectorBadge: 'bg-bio/10 text-bio border-bio/20',
    avatar: '🎓',
    experience: '12+ Years Teaching',
    rating: 4.95,
    bio: 'Secondary Education Educator specializing in Grade 10 Science & Opt Math problem-solving and step-by-step model exam derivations.',
  },
  {
    name: 'Coach Aria (AI Persona)',
    role: 'Senior IELTS Speech Assessor',
    sector: 'English Learning',
    sectorBadge: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    avatar: '🗣️',
    experience: 'Cambridge Rubric Model',
    rating: 4.92,
    bio: 'AI Speech Assessor persona modeled after official Cambridge IELTS Band Descriptors (FC, LR, GRA, PR) with ElevenLabs studio audio.',
  },
  {
    name: 'Nabin KC',
    role: 'AI & Full-Stack Tech Educator',
    sector: 'Digital Skills & AI',
    sectorBadge: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
    avatar: '🤖',
    experience: '6+ Years Tech Industry',
    rating: 4.96,
    bio: 'Software Engineer & Instructor guiding students on Python programming, ChatGPT prompt engineering, and digital skill building.',
  },
];

export default function FeaturedInstructors() {
  return (
    <section className="py-20 bg-background border-b border-border/60">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-black mb-3">
              <Sparkles size={14} /> Academic Faculty &amp; AI Personas
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
              Subject Specialists &amp; Curriculum Leads
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-xl">
              Learn with experienced Nepalese subject educators and specialized AI assessment personas.
            </p>
          </div>
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-card border border-border text-xs font-bold text-foreground hover:bg-muted transition-all shrink-0"
          >
            <span>Explore All Faculty Courses</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {/* Instructor Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {INSTRUCTORS.map((inst, idx) => (
            <div
              key={idx}
              className="bg-card border border-border rounded-3xl p-6 shadow-sm hover:shadow-xl hover:border-primary/40 transition-all flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-muted/50 border border-border flex items-center justify-center text-2xl shadow-xs group-hover:scale-105 transition-transform">
                    {inst.avatar}
                  </div>
                  <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${inst.sectorBadge}`}>
                    {inst.sector}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-black text-foreground group-hover:text-primary transition-colors">
                    {inst.name}
                  </h3>
                  <p className="text-xs font-bold text-muted-foreground mt-0.5">{inst.role}</p>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  {inst.bio}
                </p>
              </div>

              <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs font-bold">
                <span className="text-muted-foreground flex items-center gap-1">
                  <GraduationCap size={14} className="text-primary" /> {inst.experience}
                </span>
                <span className="flex items-center gap-1 text-amber-600">
                  <Star size={13} className="fill-amber-500 text-amber-500" /> {inst.rating}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
