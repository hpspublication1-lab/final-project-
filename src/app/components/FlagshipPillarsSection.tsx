'use client';

import React from 'react';
import Link from 'next/link';
import { Video, BookOpen, Clock, Brain, ArrowRight, CheckCircle2 } from 'lucide-react';

const PILLARS = [
  {
    icon: Video,
    iconColor: 'text-rose-500',
    iconBg: 'bg-rose-500/10 border-rose-500/20',
    title: 'Interactive Live Classes & HD Archives',
    tag: '100ms LIVE VIDEO',
    description: 'Learn directly from top board examiners and senior medical faculties with live chat, doubt asking, screen sharing, and instant HD video replays.',
    bullets: ['Daily interactive evening batches', 'High-speed Bunny.net video playback', 'Never miss a class with recordings'],
    linkText: 'View Class Schedule',
    linkHref: '/live-classes',
  },
  {
    icon: BookOpen,
    iconColor: 'text-emerald-500',
    iconBg: 'bg-emerald-500/10 border-emerald-500/20',
    title: '15,000+ Question & Past Paper Bank',
    tag: 'VERIFIED CURRICULUM',
    description: 'Master every chapter with authentic NEB 10-year board questions (1, 2, 3, 4 marks) and MECEE entrance-standard high-yield MCQs.',
    bullets: ['Chapter-wise question segregation', 'Step-by-step marking rubrics', 'Printable A4 question sets'],
    linkText: 'Explore Question Bank',
    linkHref: '/practice',
  },
  {
    icon: Clock,
    iconColor: 'text-blue-500',
    iconBg: 'bg-blue-500/10 border-blue-500/20',
    title: 'Realistic Exam-Simulated Mock Tests',
    tag: 'EXAM CONDITIONS',
    description: 'Prepare under authentic conditions with 200-question timed mocks, -0.25 negative marking, percentile ranking, and weak-topic diagnostics.',
    bullets: ['Server-authoritative timers', 'Negative marking calculation', 'National percentile ranking'],
    linkText: 'Take a Mock Test',
    linkHref: '/mock-tests',
  },
  {
    icon: Brain,
    iconColor: 'text-purple-500',
    iconBg: 'bg-purple-500/10 border-purple-500/20',
    title: '24/7 AI Tutor & Handwritten Marker',
    tag: 'AI-POWERED',
    description: 'Never get stuck on a problem. Get step-by-step derivations anytime from our AI Tutor, or upload photos of handwritten answers for automated marking.',
    bullets: ['Instant doubt resolution 24/7', 'Handwritten math/science checker', 'Personalized mistake analysis'],
    linkText: 'Ask AI Tutor',
    linkHref: '/ai-tutor',
  },
];

export default function FlagshipPillarsSection() {
  return (
    <section className="py-20 bg-muted/20 border-t border-border/60 relative overflow-hidden">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-bold uppercase tracking-wider">
            <span>The Samyak Advantage</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            Built for Academic Board &amp; Entrance Excellence
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed">
            Every feature on Samyak Guru is engineered to help students build rock-solid concepts, retain high-yield formulas, and maximize exam scores.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PILLARS.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div
                key={`pillar-${idx}`}
                className="bg-card/90 backdrop-blur-sm border border-border/80 rounded-3xl p-6 hover:shadow-lg hover:border-primary/40 transition-all flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${pillar.iconBg}`}>
                      <Icon className={`w-6 h-6 ${pillar.iconColor}`} />
                    </div>
                    <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-lg bg-muted text-muted-foreground border border-border/60">
                      {pillar.tag}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
                    {pillar.title}
                  </h3>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {pillar.description}
                  </p>

                  <ul className="space-y-2 pt-2 border-t border-border/60">
                    {pillar.bullets.map((bullet, bIdx) => (
                      <li key={`bullet-${idx}-${bIdx}`} className="text-xs text-foreground/80 flex items-center gap-2 font-medium">
                        <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-6">
                  <Link
                    href={pillar.linkHref}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary-dark group/link"
                  >
                    <span>{pillar.linkText}</span>
                    <ArrowRight size={13} className="transition-transform group-hover/link:translate-x-1" />
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
