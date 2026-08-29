'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import CoursePortalHeader from './CoursePortalHeader';
import { COURSE_PORTAL_CONFIGS } from '@/lib/config/courseFeatures';
import {
  Mic,
  ArrowRight,
  Headphones,
  FileEdit,
  Trophy,
  Lightbulb,
  Zap,
  BookOpen,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface PortalViewProps {
  displayName: string;
  isEnrolled?: boolean;
  isPro?: boolean;
  profile?: any;
  onOpenCourseSelector?: () => void;
}

export default function IeltsPortalView({
  displayName,
  isEnrolled = true,
  isPro = false,
  onOpenCourseSelector,
}: PortalViewProps) {
  const config = COURSE_PORTAL_CONFIGS.ielts;
  const [speakingScore, setSpeakingScore] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const handleTestSimulator = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setIsSimulating(false);
      setSpeakingScore('Overall Speaking Score: Band 8.0 (Fluency: 8.5, Lexical Resource: 8.0, Grammatical Range: 7.5, Pronunciation: 8.0)');
    }, 1800);
  };

  const vocabFlashcards = [
    { word: 'Ubiquitous', pos: 'adj.', meaning: 'Present, appearing, or found everywhere', band: 'Band 8.5' },
    { word: 'Mitigate', pos: 'verb', meaning: 'Make less severe, serious, or painful', band: 'Band 8.0' },
    { word: 'Plausible', pos: 'adj.', meaning: 'Seeming reasonable or probable', band: 'Band 8.0' },
    { word: 'Exemplify', pos: 'verb', meaning: 'Be a typical example of', band: 'Band 8.5' },
  ];

  const fullMocks = [
    { id: 'im-1', title: 'Cambridge IELTS 19 Academic Full Test 1 (All 4 Skills)', time: '2h 45m', badge: 'NEW 2026' },
    { id: 'im-2', title: 'Official British Council General Training Mock Set 3', time: '2h 45m', badge: 'GT EXAM' },
    { id: 'im-3', title: 'IELTS Band 8.5 Speed Reading & Audio Drill 4', time: '60 min', badge: 'L+R' },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Header Identity */}
      <CoursePortalHeader
        displayName={displayName}
        isEnrolled={isEnrolled}
        isPro={isPro}
        onOpenCourseSelector={onOpenCourseSelector}
      />

      {/* 2. Band Score Tracker Hero Card */}
      <div className="p-5 rounded-3xl card-luxury shadow-luxury flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20 font-mono">
              Band Score Tracker
            </span>
            <span className="text-xs text-muted-foreground font-semibold">CEFR Level: C1 Advanced</span>
          </div>
          <h2 className="text-base sm:text-lg font-black text-foreground">
            Current Score: <span className="text-amber-600 font-mono">Band 7.5</span> → Goal: <span className="text-emerald-600 font-mono">Band 8.5</span>
          </h2>
          <p className="text-xs text-muted-foreground font-medium">
            Targeting Canadian &amp; Australian PR or UK university direct entry.
          </p>
        </div>

        <div className="grid grid-cols-4 gap-2.5 w-full lg:w-auto">
          <div className="text-center p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25">
            <p className="text-[10px] font-extrabold uppercase text-amber-700 dark:text-amber-300">Listening</p>
            <p className="text-lg font-black text-amber-600 font-mono">8.5</p>
          </div>
          <div className="text-center p-3 rounded-2xl bg-blue-500/10 border border-blue-500/25">
            <p className="text-[10px] font-extrabold uppercase text-blue-700 dark:text-blue-300">Reading</p>
            <p className="text-lg font-black text-blue-600 font-mono">8.0</p>
          </div>
          <div className="text-center p-3 rounded-2xl bg-purple-500/10 border border-purple-500/25">
            <p className="text-[10px] font-extrabold uppercase text-purple-700 dark:text-purple-300">Writing</p>
            <p className="text-lg font-black text-purple-600 font-mono">7.0</p>
          </div>
          <div className="text-center p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25">
            <p className="text-[10px] font-extrabold uppercase text-emerald-700 dark:text-emerald-300">Speaking</p>
            <p className="text-lg font-black text-emerald-600 font-mono">8.0</p>
          </div>
        </div>
      </div>

      {/* 3. Main 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: 4-Skill Practice & Mock Exams (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* 4 Core Skills Launchpad */}
          <div>
            <h3 className="text-sm font-extrabold text-foreground mb-3 flex items-center gap-2">
              <Sparkles size={16} className="text-amber-500" /> IELTS 4-Skill High-Yield Launchpad
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Link
                href="/english/speaking"
                className="card-luxury p-4 shadow-xs hover:border-amber-500/50 hover:shadow-luxury transition-all flex flex-col justify-between space-y-3 group"
              >
                <div className="flex items-center justify-between">
                  <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600 group-hover:scale-110 transition-transform">
                    <Mic size={16} />
                  </span>
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300">
                    VOICE AI
                  </span>
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground group-hover:text-amber-600 transition-colors">Speaking Lab</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Part 1, 2, 3 Simulator</p>
                </div>
              </Link>

              <Link
                href="/english/writing/rubric"
                className="p-3.5 rounded-2xl bg-card border border-border hover:border-purple-500/40 hover:shadow-md transition-all flex flex-col justify-between space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <span className="p-2 rounded-xl bg-purple-500/10 text-purple-600 group-hover:scale-110 transition-transform">
                    <FileEdit size={16} />
                  </span>
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-700 dark:text-purple-300">
                    RUBRIC
                  </span>
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground group-hover:text-purple-600 transition-colors">Writing Grader</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Task 1 &amp; 2 Evaluator</p>
                </div>
              </Link>

              <Link
                href="/english/listening"
                className="p-3.5 rounded-2xl bg-card border border-border hover:border-blue-500/40 hover:shadow-md transition-all flex flex-col justify-between space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <span className="p-2 rounded-xl bg-blue-500/10 text-blue-600 group-hover:scale-110 transition-transform">
                    <Headphones size={16} />
                  </span>
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300">
                    AUDIO
                  </span>
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground group-hover:text-blue-600 transition-colors">Listening Drills</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Sections 1-4 Drills</p>
                </div>
              </Link>

              <Link
                href="/english/reading/speed-drills"
                className="p-3.5 rounded-2xl bg-card border border-border hover:border-emerald-500/40 hover:shadow-md transition-all flex flex-col justify-between space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 group-hover:scale-110 transition-transform">
                    <BookOpen size={16} />
                  </span>
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                    TIMED
                  </span>
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground group-hover:text-emerald-600 transition-colors">Speed Reading</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Skimming &amp; Scanning</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Interactive Live Speaking Examiner Preview */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-600 via-orange-600 to-amber-700 text-white shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold">
                <Mic size={12} /> Real-Time AI Examiner
              </div>
              <h3 className="text-base sm:text-lg font-black">Practice Speaking Part 2 Cue Card</h3>
              <p className="text-xs text-amber-100 leading-relaxed">
                Topic: &ldquo;Describe an unforgettable journey you took. Mention where you went, what made it special, and why it influenced your perspective.&rdquo;
              </p>
              {speakingScore && (
                <div className="p-2.5 rounded-xl bg-white/20 border border-white/30 text-xs font-semibold mt-2">
                  ✨ {speakingScore}
                </div>
              )}
            </div>

            <button
              onClick={handleTestSimulator}
              disabled={isSimulating}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white text-amber-900 font-black text-xs hover:bg-amber-50 transition-all shadow-sm shrink-0 flex items-center justify-center gap-2 disabled:opacity-70"
            >
              <Mic size={15} />
              <span>{isSimulating ? 'Evaluating Fluency...' : 'Test Speaking AI'}</span>
            </button>
          </div>

          {/* Academic Word List (AWL) Vocabulary */}
          <div className="p-5 rounded-2xl bg-card border border-border space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-foreground flex items-center gap-2">
                  <Lightbulb size={16} className="text-amber-500" /> Academic Word List (AWL) Flashcards
                </h3>
                <p className="text-[11px] text-muted-foreground">High-frequency Band 8.0+ vocabulary for essay writing and speaking.</p>
              </div>
              <Link href="/english/vocabulary" className="text-xs font-bold text-amber-600 hover:underline">
                All 500 Words →
              </Link>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {vocabFlashcards.map((card) => (
                <div
                  key={card.word}
                  className="p-3.5 rounded-xl bg-muted/40 border border-border hover:border-amber-500/30 flex flex-col justify-between space-y-2 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-foreground">{card.word}</span>
                    <span className="text-[9px] font-mono text-muted-foreground">{card.pos}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground line-clamp-2">{card.meaning}</p>
                  <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 w-fit">
                    {card.band}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Full 4-Skill Mock Exams */}
          <div className="p-5 rounded-2xl bg-card border border-border space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-foreground flex items-center gap-2">
                <Trophy size={16} className="text-amber-500" /> Full 4-Skill Cambridge Mock Exams
              </h3>
              <Link href="/mock-tests" className="text-xs font-bold text-amber-600 hover:underline">
                View All Mocks →
              </Link>
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              {fullMocks.map((mock) => (
                <div
                  key={mock.id}
                  className="p-3.5 rounded-xl bg-muted/40 border border-border hover:border-amber-500/30 flex flex-col justify-between space-y-2.5 transition-all"
                >
                  <div>
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600">
                      {mock.badge}
                    </span>
                    <h5 className="text-xs font-bold text-foreground mt-1.5 leading-snug">{mock.title}</h5>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{mock.time}</p>
                  </div>
                  <Link
                    href="/mock-tests"
                    className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] flex items-center justify-center gap-1 transition-colors"
                  >
                    <span>Take Timed Mock</span>
                    <ArrowRight size={11} />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Action Plan, Weakness & Targets (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Today's Daily Practice Plan */}
          <div className="p-5 rounded-2xl bg-card border border-border space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-foreground flex items-center gap-2">
                <Zap size={15} className="text-amber-500" /> Today&apos;s IELTS Daily Plan
              </h3>
              <span className="text-[10px] font-bold text-emerald-600">1 of 3 Done</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                  <span className="font-semibold text-foreground line-through text-muted-foreground">Listening Section 3 Audio Drill</span>
                </div>
                <span className="text-[10px] text-muted-foreground">Done</span>
              </div>

              <div className="p-2.5 rounded-xl bg-muted/40 border border-border flex items-center justify-between hover:border-amber-500/30 transition-colors">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded border border-border shrink-0" />
                  <span className="font-semibold text-foreground">Task 2 Essay Writing Rubric</span>
                </div>
                <Link href="/english/writing/rubric" className="text-[10px] font-bold text-amber-600 hover:underline">
                  Start →
                </Link>
              </div>

              <div className="p-2.5 rounded-xl bg-muted/40 border border-border flex items-center justify-between hover:border-amber-500/30 transition-colors">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded border border-border shrink-0" />
                  <span className="font-semibold text-foreground">Speaking Part 2 Cue Card Drill</span>
                </div>
                <Link href="/english/speaking" className="text-[10px] font-bold text-amber-600 hover:underline">
                  Start →
                </Link>
              </div>
            </div>
          </div>

          {/* AI Weakness Diagnostic */}
          <div className="p-5 rounded-2xl bg-card border border-border space-y-3">
            <h3 className="text-sm font-extrabold text-foreground flex items-center gap-2">
              <AlertTriangle size={15} className="text-rose-500" /> AI Detected Weakness
            </h3>
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-rose-600">Grammatical Range &amp; Accuracy</span>
                <span className="text-xs font-extrabold text-rose-600">Band 6.5</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Complex sentence subordinate clauses &amp; passive voice usage needed for Band 8.0+.
              </p>
            </div>
            <Link
              href="/ai-tutor"
              className="w-full py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Fix Weakness with AI Tutor</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          {/* Global Band Score Targets */}
          <div className="p-5 rounded-2xl bg-card border border-border space-y-3">
            <h3 className="text-sm font-extrabold text-foreground">Global Target Benchmarks</h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                <span className="text-muted-foreground">Canada Express Entry (CLB 9)</span>
                <span className="font-bold text-foreground">L8.0 R7.0 W7.0 S7.0</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                <span className="text-muted-foreground">Australia PR / Nursing</span>
                <span className="font-bold text-foreground">All Bands 7.0+</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                <span className="text-muted-foreground">UK Top Universities</span>
                <span className="font-bold text-foreground">Overall 7.5 (No Band &lt; 7.0)</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
