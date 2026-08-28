'use client';

import React from 'react';
import { Star, TrendingUp, Sparkles, CheckCircle2 } from 'lucide-react';

const WORKFLOW_CASE_STUDIES = [
  {
    key: 'test-1',
    name: 'Sushila Karki',
    college: 'CEE Medical Aspirant',
    subject: 'Biology & Physics Practice',
    sectorBadge: 'CEE Medical',
    initial: 'S',
    color: 'bg-primary/20 text-primary',
    quote: 'The weak-topic detection feature pinpointed the exact sub-chapters of Cell Biology where I was making mistakes. Focusing practice on those targeted topics systematically improved my accuracy.',
    workflowTag: 'Targeted Topic Practice',
  },
  {
    key: 'test-2',
    name: 'Aayush Adhikari',
    college: 'SEE Class 10 Student',
    subject: 'Grade 10 Science & Opt Math',
    sectorBadge: 'SEE Class 10',
    initial: 'A',
    color: 'bg-bio/20 text-bio',
    quote: 'Pradeep Sir\'s video lectures coupled with step-by-step model answer sheets helped me structure my handwritten derivations clearly for board examiners.',
    workflowTag: 'Model Answer Sheet Derivations',
  },
  {
    key: 'test-3',
    name: 'Pooja Superior',
    college: 'IELTS Academic Aspirant',
    subject: 'IELTS Speaking & Writing',
    sectorBadge: 'English & IELTS',
    initial: 'P',
    color: 'bg-amber-500/20 text-amber-600',
    quote: 'The 10-stage AI Speaking Evaluator gave instant feedback on filler words, WPM speech rate, and pronunciation tips. Daily 15-minute drills significantly built my confidence.',
    workflowTag: 'AI 10-Stage Acoustic Feedback',
  },
  {
    key: 'test-4',
    name: 'Rohan Gurung',
    college: 'Tech & Freelance Aspirant',
    subject: 'Python & AI Prompts',
    sectorBadge: 'Digital & AI',
    initial: 'R',
    color: 'bg-purple-500/20 text-purple-600',
    quote: 'The structured Python project labs and ChatGPT prompt engineering playbooks gave me practical, real-world skills to build small automation scripts from scratch.',
    workflowTag: 'Project-Based Coding Labs',
  },
];

export default function TestimonialsSection() {
  return (
    <section id="success" className="py-16 bg-background">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-black">
            <Sparkles size={14} /> Student Workflow Experiences
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-foreground">How Students Learn on Samyak Guru</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Authentic feedback on weak-topic analysis, AI evaluations, and course structure.
          </p>
        </div>

        {/* Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {WORKFLOW_CASE_STUDIES.map((t) => (
            <div
              key={t.key}
              className="bg-card border border-border rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-4 hover:border-primary/40 hover:shadow-lg transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-border bg-muted/40 text-foreground`}>
                    {t.sectorBadge}
                  </span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-success/10 text-success flex items-center gap-1">
                    <CheckCircle2 size={12} /> {t.workflowTag}
                  </span>
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
                  <h4 className="text-xs font-bold text-foreground">{t.name}</h4>
                  <p className="text-[10px] text-muted-foreground">{t.subject}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}