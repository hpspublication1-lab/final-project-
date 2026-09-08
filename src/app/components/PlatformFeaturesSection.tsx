'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Brain,
  Zap,
  Target,
  Swords,
  BookOpen,
  Video,
  Camera,
  ArrowRight,
  Sparkles,
  BarChart3,
} from 'lucide-react';

interface FeatureItem {
  id: string;
  category: 'practice' | 'mocks' | 'ai' | 'notes';
  title: string;
  subtitle: string;
  description: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  badge: string;
  highlights: string[];
  link: string;
  ctaText: string;
}

const ALL_FEATURES: FeatureItem[] = [
  {
    id: 'feat-mcq',
    category: 'practice',
    title: '15,000+ Topicwise MCQ Bank',
    subtitle: 'Adaptive Drill Engine',
    description: 'Filter questions by subject, chapter, and past entrance exam papers. Receive instant step-by-step verified explanations and bookmark tough problems for review.',
    icon: Zap,
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    badge: '15,000+ Questions',
    highlights: ['Instant step-by-step explanations', 'Past Year Questions (PYQs)', 'Custom 10/25/50 drill builder'],
    link: '/practice',
    ctaText: 'Practice MCQs',
  },
  {
    id: 'feat-mock',
    category: 'mocks',
    title: 'Computer-Based Mock Exams',
    subtitle: 'Real Exam Simulation',
    description: 'Experience real exam conditions with official 200-question timed MEC CEE and SEE board mocks. Includes negative marking, live timers, and percentile rankings.',
    icon: Target,
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-blue-600 dark:text-blue-400',
    badge: 'Exam-Ready Mocks',
    highlights: ['Official MEC 200-Q timed sets', 'Instant negative mark scorecards', 'National percentile ranking'],
    link: '/mock-tests',
    ctaText: 'Explore Mock Tests',
  },
  {
    id: 'feat-ai',
    category: 'ai',
    title: '24/7 AI Personal Tutor',
    subtitle: 'Instant Doubt Solver',
    description: 'Trained on official curriculum standards. Type questions or upload diagrams to get immediate, verified explanations in English and Nepali at any hour of the day.',
    icon: Brain,
    iconBg: 'bg-purple-500/10',
    iconColor: 'text-purple-600 dark:text-purple-400',
    badge: '24/7 Online',
    highlights: ['Multi-subject verified explanations', 'Voice & image doubt inputs', 'Available 24/7 on web & mobile'],
    link: '/ai-tutor',
    ctaText: 'Ask AI Tutor',
  },
  {
    id: 'feat-arena',
    category: 'practice',
    title: '1v1 Live Multiplayer Battle Arena',
    subtitle: 'Gamified Competitive Duels',
    description: 'Challenge your classmates and peers across Nepal in real-time 10-question MCQ duels. Win matches, climb the national leaderboard, and turn study time into fun.',
    icon: Swords,
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-600 dark:text-amber-400',
    badge: 'Live Multiplayer',
    highlights: ['Instant player matchmaking', 'Live accuracy & time battle', 'National leaderboard points'],
    link: '/battle-arena',
    ctaText: 'Enter Battle Arena',
  },
  {
    id: 'feat-notes',
    category: 'notes',
    title: 'High-Yield Chapter Notes',
    subtitle: 'Topper Revision Summaries',
    description: 'Carefully curated chapter notes, reaction charts, formula sheets, and cheat sheets designed for rapid last-minute revision before exam day.',
    icon: BookOpen,
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    badge: '1,200+ Summaries',
    highlights: ['Sub-chapter concept breakdowns', 'Formulas & reaction summaries', 'High-yield exam focus'],
    link: '/subjects',
    ctaText: 'Browse Notes',
  },
  {
    id: 'feat-video',
    category: 'notes',
    title: 'HD Video Masterclasses',
    subtitle: 'Structured Unit Playlists',
    description: '297+ high-definition concept lectures with adaptive HLS video streaming, interactive unit playlists, timestamped notes, and playback speed control.',
    icon: Video,
    iconBg: 'bg-indigo-500/10',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    badge: '297+ Lessons',
    highlights: ['Unit-wise video syllabus', 'Interactive notes drawer', 'Speed controls & HD streaming'],
    link: '/courses',
    ctaText: 'Watch Video Lessons',
  },
  {
    id: 'feat-checker',
    category: 'ai',
    title: 'AI Handwritten Answer Checker',
    subtitle: 'Vision OCR Evaluator',
    description: 'Take a photo of your handwritten Class 10 Science or Math answers. Our AI OCR scans your handwriting and marks it according to NEB board marking rubrics.',
    icon: Camera,
    iconBg: 'bg-rose-500/10',
    iconColor: 'text-rose-600 dark:text-rose-400',
    badge: 'Vision OCR AI',
    highlights: ['OCR handwritten recognition', 'Step-by-step rubric grading', 'Specific improvement suggestions'],
    link: '/practice/subjective',
    ctaText: 'Try Answer Checker',
  },
  {
    id: 'feat-mistakes',
    category: 'practice',
    title: 'Smart Mistake Analyzer & SRS',
    subtitle: 'Weakness Elimination',
    description: 'Every question you answer incorrectly is automatically logged. The system schedules targeted spaced-repetition drills until you achieve 100% mastery.',
    icon: BarChart3,
    iconBg: 'bg-teal-500/10',
    iconColor: 'text-teal-600 dark:text-teal-400',
    badge: 'Smart SRS Engine',
    highlights: ['Automated error log tracking', 'Weak topic identification', 'Spaced repetition flashcards'],
    link: '/student-dashboard',
    ctaText: 'View Your Dashboard',
  },
];

const TABS = [
  { id: 'all', label: 'All Features' },
  { id: 'practice', label: 'Practice & MCQs' },
  { id: 'mocks', label: 'Mock Exams' },
  { id: 'ai', label: 'AI Tutor Tools' },
  { id: 'notes', label: 'Notes & Videos' },
];

export default function PlatformFeaturesSection() {
  const [activeTab, setActiveTab] = useState<string>('all');

  const filteredFeatures = activeTab === 'all'
    ? ALL_FEATURES
    : ALL_FEATURES.filter((f) => f.category === activeTab);

  return (
    <section id="features" className="py-20 sm:py-24 bg-background relative overflow-hidden border-t border-border/60">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 space-y-12">
        
        {/* 1. Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-bold uppercase tracking-wider">
            <Sparkles size={14} />
            <span>PLATFORM CAPABILITIES</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-foreground tracking-tight leading-tight">
            Everything You Need to Excel.<br />
            <span className="text-gradient-primary">Built Into One Platform.</span>
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed font-medium max-w-2xl mx-auto">
            No more switching between 5 different portals, PDFs, and question banks. Samyak Tutor unifies your entire preparation journey from concept to exam day.
          </p>
        </div>

        {/* 2. The 5-Step Learning Cycle */}
        <div className="bg-card border border-border/80 rounded-3xl p-6 sm:p-8 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground text-center mb-6">
            The Proven Samyak Learning Loop
          </p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { step: '01', title: 'Choose Track', desc: 'Select CEE, SEE, IELTS, or Skills' },
              { step: '02', title: 'Learn Concepts', desc: 'Watch HD videos & read high-yield notes' },
              { step: '03', title: 'Practice MCQs', desc: 'Solve 15,000+ topicwise drills' },
              { step: '04', title: 'Take Mock Tests', desc: 'Timed 200-Q computer-based exams' },
              { step: '05', title: 'Remediate with AI', desc: 'Master weak topics with 24/7 AI tutor' },
            ].map((s) => (
              <div
                key={s.step}
                className="flex flex-col items-center text-center p-3 rounded-2xl bg-muted/40 border border-border/40 hover:border-primary/30 transition-colors"
              >
                <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-extrabold flex items-center justify-center mb-2">
                  {s.step}
                </span>
                <p className="text-xs sm:text-sm font-bold text-foreground">{s.title}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Filter Tabs */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === t.id
                  ? 'bg-primary text-white shadow-sm shadow-primary/20'
                  : 'bg-card text-muted-foreground hover:text-foreground border border-border hover:border-primary/30'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* 4. Feature Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredFeatures.map((f) => {
            const IconComponent = f.icon;

            return (
              <div
                key={f.id}
                className="bg-card border border-border/80 hover:border-primary/40 dark:border-white/10 dark:hover:border-primary/40 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  {/* Top Bar: Icon + Badge */}
                  <div className="flex items-center justify-between">
                    <div className={`w-12 h-12 rounded-2xl ${f.iconBg} ${f.iconColor} flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform`}>
                      <IconComponent size={22} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-muted border border-border/80 text-muted-foreground">
                      {f.badge}
                    </span>
                  </div>

                  {/* Title & Subtitle */}
                  <div>
                    <span className="text-[11px] font-bold text-primary uppercase tracking-wider">
                      {f.subtitle}
                    </span>
                    <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors mt-0.5 leading-snug">
                      {f.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                      {f.description}
                    </p>
                  </div>

                  {/* Check Highlights */}
                  <ul className="space-y-1.5 pt-2 border-t border-border/50">
                    {f.highlights.map((h, i) => (
                      <li key={i} className="flex items-center gap-2 text-[11px] font-medium text-foreground">
                        <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                        <span className="truncate">{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Footer Action Link */}
                <div className="pt-5 mt-4 border-t border-border/50">
                  <Link
                    href={f.link}
                    className="w-full py-2.5 px-3.5 rounded-xl bg-muted/60 hover:bg-primary hover:text-white text-foreground text-xs font-bold flex items-center justify-between transition-all group/btn"
                  >
                    <span>{f.ctaText}</span>
                    <ArrowRight size={14} className="transition-transform group-hover/btn:translate-x-1" />
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
