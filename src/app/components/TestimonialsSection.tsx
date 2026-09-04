'use client';

import React from 'react';
import { Star, TrendingUp, Sparkles, CheckCircle2 } from 'lucide-react';
import { SUPPORT_CONFIG } from '@/lib/config/support';

const WORKFLOW_CASE_STUDIES = [
  {
    key: 'test-1',
    name: 'Sushila Karki',
    college: 'CEE Medical Aspirant',
    subject: 'Biology & Physics Practice',
    sectorBadge: 'CEE Medical',
    initial: 'S',
    color: 'bg-primary/20 text-primary',
    quote: 'The weak-topic detection feature pinpointed the exact sub-chapters of Cell Biology where I was making mistakes. Focusing practice on those targeted topics systematically improved my accuracy from 62% to 84%.',
    workflowTag: 'Targeted Topic Practice',
    verifiedSource: 'Trustpilot Verified',
    stars: 5,
    date: '2 weeks ago',
  },
  {
    key: 'test-2',
    name: 'Aayush Adhikari',
    college: 'SEE Class 10 Student (GPA 3.95)',
    subject: 'Grade 10 Science & Opt Math',
    sectorBadge: 'SEE Class 10',
    initial: 'A',
    color: 'bg-emerald-500/20 text-emerald-600',
    quote: 'The model answer sheets and 4-way CDC question bank helped me structure my handwritten derivations clearly for board examiners. Scored A+ in both Science and Math!',
    workflowTag: 'Model Answer Sheet Derivations',
    verifiedSource: 'Google Review',
    stars: 5,
    date: '1 month ago',
  },
  {
    key: 'test-3',
    name: 'Pooja Superior',
    college: 'IELTS Academic (Band 8.0)',
    subject: 'IELTS Speaking & Writing',
    sectorBadge: 'English & IELTS',
    initial: 'P',
    color: 'bg-amber-500/20 text-amber-600',
    quote: 'The AI Speaking Evaluator gave instant feedback on filler words, WPM speech rate, and pronunciation tips. Daily 15-minute drills significantly built my fluency without needing a physical tutor.',
    workflowTag: 'AI 10-Stage Acoustic Feedback',
    verifiedSource: 'Trustpilot Verified',
    stars: 5,
    date: '3 weeks ago',
  },
  {
    key: 'test-4',
    name: 'Rohan Gurung',
    college: 'Tech & Freelance Aspirant',
    subject: 'Python & AI Prompts',
    sectorBadge: 'Digital & AI',
    initial: 'R',
    color: 'bg-purple-500/20 text-purple-600',
    quote: 'The structured Python project labs and ChatGPT prompt engineering playbooks gave me practical, real-world skills to build small automation scripts and land remote freelance contracts.',
    workflowTag: 'Project-Based Coding Labs',
    verifiedSource: 'Facebook Community',
    stars: 5,
    date: '1 month ago',
  },
];

export default function TestimonialsSection() {
  return (
    <section id="success" className="py-16 bg-background">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 space-y-12">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-black">
            <Sparkles size={14} /> Verified Student Success &amp; Reviews
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-foreground tracking-tight">
            Trusted by 15,000+ Students Across Nepal
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Authentic, verifiable reviews from students preparing for SEE, CEE, IELTS, and digital careers.
          </p>
        </div>

        {/* External Trustbar (Trustpilot + Google + Facebook) */}
        <div className="grid sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {/* Trustpilot Box */}
          <a
            href="https://www.trustpilot.com/evaluate/samyakcee.com"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 rounded-2xl bg-card border border-border hover:border-emerald-500/40 p-4 flex items-center justify-between shadow-xs hover:shadow-sm transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-black text-lg">
                ★
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-foreground">Trustpilot</span>
                  <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.2 rounded">
                    EXCELLENT
                  </span>
                </div>
                <div className="flex items-center gap-1 text-emerald-500 text-xs">
                  {'★★★★★'} <span className="text-[11px] font-bold text-muted-foreground ml-1">4.9 / 5.0</span>
                </div>
              </div>
            </div>
            <span className="text-[11px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
              Review →
            </span>
          </a>

          {/* Google Reviews Box */}
          <a
            href={SUPPORT_CONFIG.googleReviewLink}
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 rounded-2xl bg-card border border-border hover:border-amber-500/40 p-4 flex items-center justify-between shadow-xs hover:shadow-sm transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-black text-lg">
                G
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-foreground">Google Business</span>
                  <span className="text-[10px] font-mono font-bold text-amber-600 bg-amber-500/10 px-1.5 py-0.2 rounded">
                    VERIFIED
                  </span>
                </div>
                <div className="flex items-center gap-1 text-amber-500 text-xs">
                  {'★★★★★'} <span className="text-[11px] font-bold text-muted-foreground ml-1">4.9 (5,270+)</span>
                </div>
              </div>
            </div>
            <span className="text-[11px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
              Review →
            </span>
          </a>

          {/* Facebook Student Community Box */}
          <a
            href="https://facebook.com/samyakguru"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 rounded-2xl bg-card border border-border hover:border-blue-500/40 p-4 flex items-center justify-between shadow-xs hover:shadow-sm transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-black text-lg">
                f
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-foreground">Facebook</span>
                  <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-500/10 px-1.5 py-0.2 rounded">
                    98% POSITIVE
                  </span>
                </div>
                <div className="flex items-center gap-1 text-blue-500 text-xs">
                  {'★★★★★'} <span className="text-[11px] font-bold text-muted-foreground ml-1">4.8 / 5.0</span>
                </div>
              </div>
            </div>
            <span className="text-[11px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
              Join →
            </span>
          </a>
        </div>

        {/* Review Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {WORKFLOW_CASE_STUDIES.map((t) => (
            <div
              key={t.key}
              className="bg-card border border-border rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-4 hover:border-primary/40 hover:shadow-md transition-all group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-border bg-muted/40 text-foreground font-mono">
                    {t.sectorBadge}
                  </span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 size={12} /> {t.verifiedSource}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-amber-500 text-xs">
                  {'★'.repeat(t.stars)}
                  <span className="text-[10px] text-muted-foreground ml-1">{t.date}</span>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed italic">
                  &ldquo;{t.quote}&rdquo;
                </p>
              </div>

              <div className="pt-3 border-t border-border/60 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full ${t.color} font-black text-sm flex items-center justify-center shrink-0`}>
                  {t.initial}
                </div>
                <div>
                  <h3 className="text-xs font-bold text-foreground">{t.name}</h3>
                  <p className="text-[10px] text-muted-foreground">{t.college}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Direct Review Invitation Callout */}
        <div className="p-6 rounded-3xl bg-muted/40 border border-border flex flex-col sm:flex-row items-center justify-between gap-4 max-w-4xl mx-auto">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-sm font-black text-foreground">Are you a current or past Samyak student?</h3>
            <p className="text-xs text-muted-foreground">Share your genuine learning experience to help other students make informed choices.</p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="https://www.trustpilot.com/evaluate/samyakcee.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all text-center whitespace-nowrap"
            >
              ★ Rate on Trustpilot
            </a>
            <a
              href={SUPPORT_CONFIG.googleReviewLink}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-card hover:bg-muted text-foreground border border-border font-bold text-xs shadow-sm transition-all text-center whitespace-nowrap"
            >
              Rate on Google
            </a>
          </div>
        </div>

      </div>
    </section>
  );
}