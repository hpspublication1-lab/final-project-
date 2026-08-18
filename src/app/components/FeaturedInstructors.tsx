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
    students: '25,000+',
    bio: 'Guided over 2,000 students into top medical colleges across Nepal including IOM Maharajgunj & BPKIHS Dharan.',
  },
  {
    name: 'Pradeep Poudel Sir',
    role: 'NEB Science & Math Lead',
    sector: 'SEE Class 10',
    sectorBadge: 'bg-bio/10 text-bio border-bio/20',
    avatar: '🎓',
    experience: '12+ Years Teaching',
    rating: 4.95,
    students: '32,000+',
    bio: 'Former NEB board paper examiner & author of bestselling Class 10 Science question bank books.',
  },
  {
    name: 'Sarah Jenkins',
    role: 'Senior ESL & IELTS Coach',
    sector: 'English Learning',
    sectorBadge: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    avatar: '🗣️',
    experience: '10+ Years Teaching',
    rating: 4.92,
    students: '14,000+',
    bio: 'Certified CELTA trainer who has helped over 1,500 Nepalese students achieve Band 7.5+ in IELTS.',
  },
  {
    name: 'Nabin KC',
    role: 'AI Developer & Tech Educator',
    sector: 'Digital Skills & AI',
    sectorBadge: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
    avatar: '🤖',
    experience: '6+ Years Tech Industry',
    rating: 4.96,
    students: '18,000+',
    bio: 'Ex-Silicon Valley startup developer training students on AI workflows, Python, and digital freelancing.',
  },
];

export default function FeaturedInstructors() {
  return (
    <section className="py-20 bg-background border-b border-border/60">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <div>
            <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider bg-primary/10 text-primary px-3.5 py-1 rounded-full border border-primary/20 mb-3 shadow-xs">
              <Award size={14} /> Expert Faculties
            </span>
            <h2 className="text-hero-md text-foreground font-black tracking-tight">
              Learn from Nepal&apos;s Star Educators
            </h2>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base max-w-lg">
              Top doctors, board examiners, certified language coaches, and AI engineers guiding your success.
            </p>
          </div>

          <Link
            href="/courses"
            className="inline-flex items-center gap-2 text-xs font-extrabold text-primary hover:text-primary-dark transition-colors shrink-0"
          >
            <span>Browse All Faculty Courses</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {/* Instructor Cards Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {INSTRUCTORS.map((inst, idx) => (
            <div
              key={idx}
              className="bg-card border border-border rounded-3xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group"
            >
              <div className="space-y-4">
                {/* Header Avatar & Sector */}
                <div className="flex items-start justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-muted border border-border flex items-center justify-center text-2xl shadow-xs group-hover:scale-105 transition-transform">
                    {inst.avatar}
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${inst.sectorBadge}`}>
                    {inst.sector}
                  </span>
                </div>

                {/* Name & Role */}
                <div>
                  <h3 className="text-base font-extrabold text-foreground group-hover:text-primary transition-colors">
                    {inst.name}
                  </h3>
                  <p className="text-xs text-muted-foreground font-medium">{inst.role}</p>
                </div>

                {/* Rating & Students */}
                <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-muted/40 text-[11px] font-bold text-muted-foreground border border-border/40">
                  <div className="flex items-center gap-1 text-amber-500">
                    <Star size={13} className="fill-amber-500" />
                    <span className="text-foreground font-black">{inst.rating}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <GraduationCap size={13} className="text-primary" />
                    <span>{inst.students} Students</span>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                  {inst.bio}
                </p>
              </div>

              {/* Card Footer */}
              <div className="pt-4 mt-4 border-t border-border/50 flex items-center justify-between">
                <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                  {inst.experience}
                </span>
                <Link
                  href="/courses"
                  className="text-xs font-extrabold text-foreground group-hover:text-primary flex items-center gap-1 transition-colors"
                >
                  <span>Courses</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
