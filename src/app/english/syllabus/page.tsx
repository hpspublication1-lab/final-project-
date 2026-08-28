'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import PublicNav from '@/components/PublicNav';
import {
  Award, Sparkles, BookOpen, CheckCircle2, ArrowRight, ShieldCheck,
  Check, Star, FileText, Download, Mic, PenTool, Globe, Target, Flame, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { IeltsWritingEvaluation } from '@/app/api/english/writing/evaluate/route';
import StudentWeaknessEngineWidget from '@/components/english/StudentWeaknessEngineWidget';

const WEEKLY_CURRICULUM = [
  {
    week: 'Week 1',
    title: '🎯 Foundation, Phonetics & Diagnostic Benchmark',
    objective: 'Establish Band 6.5 baseline and master Cambridge Band 9 assessment criteria',
    topics: [
      'Diagnostic Mock Exam (4 Skills) & AI Baseline Band Score',
      'Grammar for IELTS: Complex Sentences, Passive Voice, Conditional Clauses',
      'Phonetics & Accent Foundation: Vowel sounds, Consonant clusters, Intonation',
      'Band 9 Assessment Rubric Decoding (TA, CC, LR, GRA & FC, LR, GRA, PR)',
    ],
  },
  {
    week: 'Week 2',
    title: '📖 Academic Reading Masterclass (14 Question Types)',
    objective: 'Master speed skimming, scanning, and the 100% Keyword Location Algorithm',
    topics: [
      'True / False / Not Given & Yes / No / Not Given traps & resolution rules',
      'Matching Headings & Paragraph Information Algorithm',
      'Summary Completion, Table Completion & Flowchart Diagrams',
      'Speed Skimming (400 WPM) & Time Management (20 mins/passage)',
    ],
  },
  {
    week: 'Week 3',
    title: '🎧 Listening Sections 1–4 & Distractor Shields',
    objective: 'Achieve 36+/40 raw score across British, Australian, and North American accents',
    topics: [
      'Section 1: Form, Note & Table Completion (Numbers, Dates, Names)',
      'Section 2: Multiple Choice & Map / Plan Diagram Labeling',
      'Section 3: Academic Discussion (3-4 speakers, opinion tracking)',
      'Section 4: Academic Monologue (Monologue speed note-taking)',
    ],
  },
  {
    week: 'Week 4',
    title: '✍️ Writing Task 1 Perfection (7 Chart Types)',
    objective: 'Master the 4-Paragraph Band 9 Structure for Line, Bar, Pie, Process & Maps',
    topics: [
      'Line Graphs & Bar Charts: Describing trends, peaks, fluctuations & stability',
      'Pie Charts & Data Tables: Grouping data, comparative ratios & proportions',
      'Process Diagrams & Life Cycles: Passive voice & sequential linkers',
      'Map Comparisons: Directional vocabulary, urban planning changes',
    ],
  },
  {
    week: 'Week 5',
    title: '✍️ Writing Task 2 Masterclass (5 Essay Types)',
    objective: 'Write 250+ word Band 9 essays with rock-solid thesis statements and cohesion',
    topics: [
      'Opinion (Agree/Disagree) & Discussion (Both Views + Opinion) Essays',
      'Advantages / Disadvantages & Problem / Solution Essays',
      'Band 9 Cohesive Devices: Cohesion beyond "firstly" and "moreover"',
      'Vocabulary Expansion: 500 High-Frequency Academic Words & Collocations',
    ],
  },
  {
    week: 'Week 6',
    title: '🗣️ Speaking Parts 1, 2, 3 Monologue & Fluency',
    objective: 'Speak fluently for 2 minutes with zero hesitation and Band 8.5 vocabulary',
    topics: [
      'Part 1: Personal Warm-up responses with extended 3-sentence structure',
      'Part 2: Cue Card 1-min prep strategy & 2-min monologue flow (120+ Cue Cards)',
      'Part 3: Two-way Abstract Discussion & Complex opinion formulation',
      'Nepali Speaker Accent Coaching: Fixing /v/ vs /w/, word stress & filler words',
    ],
  },
  {
    week: 'Week 7',
    title: '💻 Computer-Delivered IELTS Exam UI Simulator',
    objective: 'Replicate exact exam day conditions using computer-delivered IELTS interface',
    topics: [
      'Computer-Delivered IELTS Navigation, Highlighting & Notes features',
      'On-screen Typing Speed & Spellcheck elimination drills',
      'Time Management under strict exam conditions with live countdown',
      'Full 3-Hour Timed Mock Exam 1 with AI Assessor Feedback',
    ],
  },
  {
    week: 'Week 8',
    title: '🏆 Elite Band 8.5–9.0 Exam Strategy & Final Review',
    objective: 'Fine-tune weakest criteria, lock in target band score, and exam-day psychology',
    topics: [
      'Individual Weak Criteria Doctor Session with Senior Ex-Examiners',
      'Full 3-Hour Timed Mock Exam 2 & Verified Cambridge Certificate',
      'Exam Day Survival Blueprint: What to do 24 hours before test',
      'Post-Exam University & Visa Application Guidance (US, UK, Canada, Aus)',
    ],
  },
];

export default function WorldClassIeltsSyllabusPage() {
  const [isDark, setIsDark] = useState(false);
  const [activeWeekIndex, setActiveWeekIndex] = useState(0);

  // Live Writing Evaluator Widget State
  const [essayPrompt, setEssayPrompt] = useState('Some people believe that university education should be free for all students. To what extent do you agree or disagree?');
  const [essayText, setEssayText] = useState('');
  const [evaluating, setEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<IeltsWritingEvaluation | null>(null);

  useEffect(() => {
    if (isDark) {
      document.documentElement?.classList?.add('dark');
    } else {
      document.documentElement?.classList?.remove('dark');
    }
  }, [isDark]);

  const handleEvaluateEssay = async () => {
    if (!essayText.trim() || essayText.trim().split(/\s+/).filter(Boolean).length < 20) {
      toast.error('Please enter a complete essay response before evaluating.');
      return;
    }

    setEvaluating(true);
    try {
      const res = await fetch('/api/english/writing/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          essayType: 'task2',
          promptText: essayPrompt,
          essayText,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.details || data.error || 'Evaluation failed');

      setEvaluation(data);
      toast.success(`🎉 Evaluated! Band Score: ${data.overallBand}`);

      setTimeout(() => {
        document.getElementById('essay-evaluation-result')?.scrollIntoView({ behavior: 'smooth' });
      }, 200);
    } catch (err: any) {
      toast.error(err.message || 'Evaluation failed.');
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <PublicNav isDark={isDark} onToggleDark={() => setIsDark(!isDark)} />

      {/* Hero Section */}
      <section className="pt-28 pb-12 bg-gradient-to-b from-amber-500/10 via-card to-background border-b border-border">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 text-amber-600 text-xs font-black border border-amber-500/20">
              <Award size={16} /> World-Class Band 8.5 – 9.0 Curriculum Blueprint
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight leading-tight">
              The Ultimate IELTS Preparation <br />
              <span className="text-amber-600">Masterclass Syllabus</span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              Designed by ex-British Council and IDP Senior Examiners. Aligned with Cambridge Assessment English, CEFR C1/C2 benchmarks, and official Band 9.0 assessment descriptors.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <a
                href="#curriculum-roadmap"
                className="px-6 py-3.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-amber-600/20 transition-all"
              >
                <span>Explore 8-Week Roadmap</span>
                <ArrowRight size={16} />
              </a>
              <a
                href="#live-essay-evaluator"
                className="px-6 py-3.5 rounded-2xl bg-card border border-border font-bold text-xs text-foreground hover:bg-muted transition-all flex items-center gap-2"
              >
                <PenTool size={16} className="text-amber-600" />
                <span>Test Live Essay Evaluator</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Main Workspace */}
      <section className="py-12 max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1 space-y-12">

        {/* Dual Student Profile Skill Tree & Master Weakness Engine */}
        <StudentWeaknessEngineWidget />

        {/* 8-Week Master Curriculum Explorer */}
        <div id="curriculum-roadmap" className="space-y-8">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black text-foreground">8-Week Band 9.0 Curriculum Roadmap</h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Click any week to inspect detailed topics, learning goals, and official exam strategies
            </p>
          </div>

          {/* Week Selector Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none justify-start sm:justify-center">
            {WEEKLY_CURRICULUM.map((item, idx) => (
              <button
                key={item.week}
                onClick={() => setActiveWeekIndex(idx)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border ${
                  activeWeekIndex === idx
                    ? 'bg-amber-600 text-white border-amber-600 shadow-md'
                    : 'bg-card border-border text-muted-foreground hover:border-amber-500/40 hover:text-foreground'
                }`}
              >
                {item.week}
              </button>
            ))}
          </div>

          {/* Active Week Display Card */}
          <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-md space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
              <div>
                <span className="text-xs font-extrabold text-amber-600 uppercase tracking-wider">
                  {WEEKLY_CURRICULUM[activeWeekIndex].week} Focus
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-foreground mt-1">
                  {WEEKLY_CURRICULUM[activeWeekIndex].title}
                </h3>
              </div>
              <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20 shrink-0">
                {WEEKLY_CURRICULUM[activeWeekIndex].objective}
              </span>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {WEEKLY_CURRICULUM[activeWeekIndex].topics.map((topic, i) => (
                <div key={i} className="p-4 rounded-2xl bg-muted/40 border border-border/80 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-amber-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <p className="text-xs font-semibold text-foreground leading-relaxed">{topic}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Live Essay Evaluator Section */}
        <div id="live-essay-evaluator" className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">
                <Sparkles size={16} /> Ex-Examiner AI Assessment Engine
              </div>
              <h3 className="text-xl font-black text-foreground">Live IELTS Writing Task 2 Evaluator</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Paste your IELTS essay below to receive immediate Band Scores across TA, CC, LR, and GRA with an Examiner Band 9.0 rewrite.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground">Essay Prompt / Topic:</label>
              <input
                type="text"
                value={essayPrompt}
                onChange={(e) => setEssayPrompt(e.target.value)}
                className="w-full p-3 bg-muted/50 border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-bold text-foreground">
                <label>Your Essay Response:</label>
                <span className="text-muted-foreground font-semibold">
                  {essayText.trim().split(/\s+/).filter(Boolean).length} words (Min 250 words)
                </span>
              </div>
              <textarea
                rows={8}
                value={essayText}
                onChange={(e) => setEssayText(e.target.value)}
                placeholder="Write or paste your IELTS essay response here..."
                className="w-full p-4 bg-muted/50 border border-border rounded-2xl text-xs sm:text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500 leading-relaxed font-sans"
              />
            </div>

            <button
              onClick={handleEvaluateEssay}
              disabled={evaluating || !essayText.trim()}
              className="w-full py-4 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-600/25 transition-all disabled:opacity-50"
            >
              {evaluating ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  <span>Evaluating 4 Criteria against Cambridge Band Descriptors...</span>
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  <span>Evaluate Essay &amp; Get Band 9 Model Rewrite</span>
                </>
              )}
            </button>
          </div>

          {/* Evaluation Output Box */}
          {evaluation && (
            <div id="essay-evaluation-result" className="p-6 rounded-2xl bg-muted/40 border border-border space-y-6 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-amber-600 text-white flex flex-col items-center justify-center font-black">
                    <span className="text-2xl">{evaluation.overallBand.toFixed(1)}</span>
                    <span className="text-[8px] uppercase tracking-wider">BAND</span>
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-foreground">IELTS Assessor Report</h4>
                    <p className="text-xs text-muted-foreground">{evaluation.wordCount} words · {evaluation.wordCountStatus}</p>
                  </div>
                </div>
              </div>

              {/* 4 Criteria */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-card border border-border space-y-1">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">Task Response</span>
                  <p className="font-black text-amber-600 text-base">Band {evaluation.rubric?.taskAchievement?.band || 7.0}</p>
                </div>
                <div className="p-3 rounded-xl bg-card border border-border space-y-1">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">Coherence &amp; Cohesion</span>
                  <p className="font-black text-amber-600 text-base">Band {evaluation.rubric?.coherenceCohesion?.band || 7.0}</p>
                </div>
                <div className="p-3 rounded-xl bg-card border border-border space-y-1">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">Lexical Resource</span>
                  <p className="font-black text-amber-600 text-base">Band {evaluation.rubric?.lexicalResource?.band || 7.0}</p>
                </div>
                <div className="p-3 rounded-xl bg-card border border-border space-y-1">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">Grammatical Range</span>
                  <p className="font-black text-amber-600 text-base">Band {evaluation.rubric?.grammaticalRange?.band || 7.0}</p>
                </div>
              </div>

              {/* Model Essay */}
              {evaluation.band9ModelEssay && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                  <h5 className="text-xs font-bold text-amber-600 uppercase">Examiner Band 9.0 Model Rewrite:</h5>
                  <p className="text-xs font-serif italic text-foreground leading-relaxed">
                    &ldquo;{evaluation.band9ModelEssay}&rdquo;
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Global Comparison Table */}
        <div className="space-y-6">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-black text-foreground">Global Excellence Standard Comparison</h2>
            <p className="text-xs text-muted-foreground mt-1">See how Samyak Guru compares to international IELTS preparation institutions</p>
          </div>

          <div className="overflow-x-auto border border-border rounded-3xl bg-card">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-4">Feature / Capability</th>
                  <th className="p-4 text-amber-600">Samyak Guru Masterclass</th>
                  <th className="p-4">Standard Local Classes</th>
                  <th className="p-4">Traditional Online Apps</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-medium">
                <tr>
                  <td className="p-4 font-bold text-foreground">AI Speaking Examiner Voice (Speech-to-Text &amp; TTS)</td>
                  <td className="p-4 text-success font-bold">✓ Included 24/7</td>
                  <td className="p-4 text-muted-foreground">✗ Limited (Once/week)</td>
                  <td className="p-4 text-muted-foreground">✗ Text-only</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold text-foreground">Cambridge Books 1-19 Academic Passage Solvers</td>
                  <td className="p-4 text-success font-bold">✓ Full Interactive Vault</td>
                  <td className="p-4 text-muted-foreground">✓ Paper Photocopies</td>
                  <td className="p-4 text-muted-foreground">✗ Fragmented</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold text-foreground">Duolingo DET 10-160 Scale IT Engine</td>
                  <td className="p-4 text-success font-bold">✓ Included</td>
                  <td className="p-4 text-muted-foreground">✗ Not Offered</td>
                  <td className="p-4 text-muted-foreground">✗ Separate Fee</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold text-foreground">Nepali Speaker Accent &amp; Phonetic Coaching</td>
                  <td className="p-4 text-success font-bold">✓ Specialized Coach Aria</td>
                  <td className="p-4 text-muted-foreground">✗ Generic Advice</td>
                  <td className="p-4 text-muted-foreground">✗ Generic Advice</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </section>
    </div>
  );
}
