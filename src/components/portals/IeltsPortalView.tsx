'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import CoursePortalHeader from './CoursePortalHeader';
import { COURSE_PORTAL_CONFIGS } from '@/lib/config/courseFeatures';
import {
  Languages,
  Mic,
  Award,
  Sparkles,
  BookOpen,
  CheckCircle,
  ArrowRight,
  Headphones,
  FileEdit,
  Volume2,
  Trophy,
  BarChart2,
  Download,
  Flame,
  Globe,
  Play,
  Lightbulb,
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
    { id: 'im-3', title: 'IELTS Band 8.5 Speed Reading & Audio Drill 4', time: '60 min', badge: 'LISTENING+READING' },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Header Identity: SOUMYA GURU - IELTS & ENGLISH Dashboard */}
      <CoursePortalHeader
        displayName={displayName}
        isEnrolled={isEnrolled}
        isPro={isPro}
        onOpenCourseSelector={onOpenCourseSelector}
      />

      {/* 2. Band Score Tracker Hero Card */}
      <div className="p-6 rounded-3xl bg-card border border-amber-500/30 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">
              Band Score Tracker
            </span>
            <span className="text-xs text-muted-foreground font-semibold">CEFR Level: C1 Advanced</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-foreground">
            Current Estimated Score: <span className="text-amber-600">Band 7.5</span> → Goal: <span className="text-emerald-600">Band 8.5</span>
          </h2>
          <p className="text-xs text-muted-foreground">
            Targeting Canadian &amp; Australian PR or UK university admission.
          </p>
        </div>

        <div className="grid grid-cols-4 gap-3 w-full lg:w-auto">
          <div className="text-center p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
            <p className="text-xs font-bold text-amber-700 dark:text-amber-300">Listening</p>
            <p className="text-lg font-black text-amber-600">8.5</p>
          </div>
          <div className="text-center p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20">
            <p className="text-xs font-bold text-blue-700 dark:text-blue-300">Reading</p>
            <p className="text-lg font-black text-blue-600">8.0</p>
          </div>
          <div className="text-center p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20">
            <p className="text-xs font-bold text-purple-700 dark:text-purple-300">Writing</p>
            <p className="text-lg font-black text-purple-600">7.0</p>
          </div>
          <div className="text-center p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
            <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">Speaking</p>
            <p className="text-lg font-black text-emerald-600">8.0</p>
          </div>
        </div>
      </div>

      {/* 3. STEP-BY-STEP IELTS ROADMAP */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20 font-mono">
              STEP-BY-STEP LEARNING ROADMAP
            </span>
            <h3 className="text-lg font-black text-foreground mt-1">
              YOUR STEP-BY-STEP BAND 8.5+ DRILL SEQUENCE
            </h3>
          </div>
          <span className="text-xs text-muted-foreground font-bold font-mono">5 STAGES</span>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* STEP 1: SPEAKING */}
          <div className="p-6 rounded-3xl bg-card border border-border hover:border-amber-500/40 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase px-3 py-1 rounded-xl bg-amber-500/10 text-amber-600 font-mono">
                  STEP 1
                </span>
                <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full font-mono">
                  AI VOICE SCORING
                </span>
              </div>
              <h4 className="text-base font-black text-foreground">Speaking Cue Card Simulator</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Record 2-minute Part 2 Cue Cards with live AI pronunciation, fluency, and pause filler analysis.
              </p>
            </div>
            <Link
              href="/english/speaking/simulator"
              className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black flex items-center justify-center gap-2 transition-colors shadow-md"
            >
              <Mic size={15} />
              <span>START STEP 1: SPEAKING</span>
            </Link>
          </div>

          {/* STEP 2: WRITING */}
          <div className="p-6 rounded-3xl bg-card border border-border hover:border-blue-500/40 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase px-3 py-1 rounded-xl bg-blue-500/10 text-blue-600 font-mono">
                  STEP 2
                </span>
                <span className="text-[10px] font-extrabold text-blue-600 bg-blue-500/10 px-2 py-0.5 rounded-full font-mono">
                  BAND 8.0+ RUBRIC
                </span>
              </div>
              <h4 className="text-base font-black text-foreground">Writing Task 1 &amp; 2 Evaluator</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Submit academic essays and get detailed rubric breakdowns on Task Response &amp; Lexical Resource.
              </p>
            </div>
            <Link
              href="/english/writing/rubric"
              className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black flex items-center justify-center gap-2 transition-colors shadow-md"
            >
              <FileEdit size={15} />
              <span>START STEP 2: WRITING</span>
            </Link>
          </div>

          {/* STEP 3: READING */}
          <div className="p-6 rounded-3xl bg-card border border-border hover:border-purple-500/40 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase px-3 py-1 rounded-xl bg-purple-500/10 text-purple-600 font-mono">
                  STEP 3
                </span>
                <span className="text-[10px] font-extrabold text-purple-600 bg-purple-500/10 px-2 py-0.5 rounded-full font-mono">
                  SPEED STRATEGIES
                </span>
              </div>
              <h4 className="text-base font-black text-foreground">Reading Passages &amp; Timed Drills</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Master skimming, scanning, and True/False/Not Given strategy templates under 60-min timing.
              </p>
            </div>
            <Link
              href="/english"
              className="w-full py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black flex items-center justify-center gap-2 transition-colors shadow-md"
            >
              <BookOpen size={15} />
              <span>START STEP 3: READING</span>
            </Link>
          </div>

          {/* STEP 4: LISTENING */}
          <div className="p-6 rounded-3xl bg-card border border-border hover:border-emerald-500/40 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 font-mono">
                  STEP 4
                </span>
                <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full font-mono">
                  40 QUESTIONS / TEST
                </span>
              </div>
              <h4 className="text-base font-black text-foreground">Listening Audio Passages</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Practice Cambridge-standard audio recordings with British, Australian, and American accents.
              </p>
            </div>
            <Link
              href="/english"
              className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center justify-center gap-2 transition-colors shadow-md"
            >
              <Headphones size={15} />
              <span>START STEP 4: LISTENING</span>
            </Link>
          </div>

          {/* STEP 5: FULL MOCKS */}
          <div className="p-6 rounded-3xl bg-card border border-border hover:border-red-500/40 shadow-sm space-y-4 flex flex-col justify-between col-span-1 md:col-span-2 lg:col-span-2">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase px-3 py-1 rounded-xl bg-red-500/10 text-red-600 font-mono">
                  STEP 5 (FINAL MASTERY)
                </span>
                <span className="text-[10px] font-extrabold text-red-600 bg-red-500/10 px-2 py-0.5 rounded-full font-mono">
                  FULL SIMULATION
                </span>
              </div>
              <h4 className="text-base font-black text-foreground">Full Cambridge Mock Exam Simulation</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Complete a 2 hour 45 minute full mock exam covering Listening, Reading, Writing, and Speaking under actual exam hall conditions.
              </p>
            </div>
            <Link
              href="/mock-tests"
              className="w-full py-3.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-xs font-black flex items-center justify-center gap-2 transition-colors shadow-lg"
            >
              <Trophy size={16} />
              <span>START STEP 5: FULL SIMULATION MOCK EXAM</span>
            </Link>
          </div>

        </div>
      </div>

      {/* 4. Interactive Live AI Speaking Voice Tester */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-600 via-orange-600 to-amber-700 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-[11px] font-bold">
            <Mic size={13} /> Real-Time AI Examiner
          </div>
          <h3 className="text-xl sm:text-2xl font-black">Practice Speaking Part 2 Cue Card</h3>
          <p className="text-xs sm:text-sm text-amber-100 leading-relaxed">
            Topic: &ldquo;Describe an unforgettable journey you took with friends or family. Mention where you went, what made it special, and why it influenced your perspective.&rdquo;
          </p>
          {speakingScore && (
            <div className="p-3.5 rounded-xl bg-white/20 border border-white/30 text-xs font-semibold mt-2 animate-fadeIn">
              ✨ {speakingScore}
            </div>
          )}
        </div>

        <button
          onClick={handleTestSimulator}
          disabled={isSimulating}
          className="px-6 py-3.5 rounded-2xl bg-white text-amber-900 font-black text-xs sm:text-sm hover:bg-amber-50 transition-all shadow-lg shrink-0 flex items-center gap-2 disabled:opacity-70"
        >
          <Mic size={16} />
          <span>{isSimulating ? 'Evaluating Fluency & Lexicon...' : 'Test Speaking AI Grader'}</span>
        </button>
      </div>

      {/* 5. Vocabulary & Grammar (Academic Word List - AWL) */}
      <div className="p-6 rounded-3xl bg-card border border-border space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-foreground flex items-center gap-2">
              <Lightbulb size={16} className="text-amber-500" /> Academic Word List (AWL) &amp; Collocations
            </h3>
            <p className="text-xs text-muted-foreground">High-frequency Band 8.0+ vocabulary flashcards for essay writing &amp; speaking.</p>
          </div>
          <Link href="/english" className="text-xs font-bold text-amber-600 hover:underline">
            All 500 Words →
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {vocabFlashcards.map((card) => (
            <div
              key={card.word}
              className="p-4 rounded-2xl bg-muted/40 border border-border hover:border-amber-500/30 flex flex-col justify-between space-y-2 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-foreground">{card.word}</span>
                <span className="text-[9px] font-mono text-muted-foreground">{card.pos}</span>
              </div>
              <p className="text-[11px] text-muted-foreground line-clamp-2">{card.meaning}</p>
              <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 w-fit">
                {card.band}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 6. Full Practice Tests */}
      <div className="p-6 rounded-3xl bg-card border border-border space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm sm:text-base font-extrabold text-foreground flex items-center gap-2">
            <Trophy size={16} className="text-amber-500" /> Full 4-Skill Cambridge Mock Exams
          </h3>
          <Link href="/english" className="text-xs font-bold text-amber-600 hover:underline">
            View All Mocks →
          </Link>
        </div>
        <div className="grid md:grid-cols-3 gap-3">
          {fullMocks.map((mock) => (
            <div
              key={mock.id}
              className="p-4 rounded-2xl bg-muted/40 border border-border hover:border-amber-500/30 flex flex-col justify-between space-y-3 transition-all"
            >
              <div>
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600">
                  {mock.badge}
                </span>
                <h5 className="text-xs font-bold text-foreground mt-2 leading-snug">{mock.title}</h5>
                <p className="text-[10px] text-muted-foreground mt-1">Duration: {mock.time}</p>
              </div>
              <Link
                href="/english"
                className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Take Timed Mock</span>
                <ArrowRight size={12} />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
