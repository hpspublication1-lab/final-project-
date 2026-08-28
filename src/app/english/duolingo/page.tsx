'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import PublicNav from '@/components/PublicNav';
import {
  Sparkles, CheckCircle2, Award, Zap, Code, Terminal, Laptop, Globe,
  ArrowRight, RefreshCw, Clock, Check, AlertTriangle, BookOpen, Mic
} from 'lucide-react';
import toast from 'react-hot-toast';
import { DetEvaluationResult } from '@/app/api/english/duolingo/evaluate/route';

interface WordItem {
  word: string;
  isReal: boolean;
}

const IT_WORD_MATRIX: WordItem[] = [
  { word: 'algorithm', isReal: true },
  { word: 'progrify', isReal: false },
  { word: 'architecture', isReal: true },
  { word: 'compilate', isReal: false },
  { word: 'optimization', isReal: true },
  { word: 'synchronic', isReal: true },
  { word: 'database', isReal: true },
  { word: 'deprecate', isReal: true },
  { word: 'recursify', isReal: false },
  { word: 'refactor', isReal: true },
  { word: 'scalability', isReal: true },
  { word: 'executable', isReal: true },
  { word: 'virtualize', isReal: true },
  { word: 'instantiable', isReal: true },
  { word: 'computational', isReal: true },
  { word: 'syntactify', isReal: false },
  { word: 'polymorphism', isReal: true },
  { word: 'concurrency', isReal: true },
];

const IT_PROMPTS = [
  {
    title: '💻 IT Infrastructure & Cloud Computing',
    prompt: 'Respond to this prompt in at least 50 words: "How has the rise of cloud computing and remote development teams transformed modern software development processes?"',
  },
  {
    title: '🤖 AI & Automation Ethics in IT',
    prompt: 'Respond to this prompt in at least 50 words: "What are the key ethical considerations software engineers must address when building autonomous AI algorithms for healthcare and finance?"',
  },
  {
    title: '🚀 Startup vs Enterprise Software Engineering',
    prompt: 'Respond to this prompt in at least 50 words: "Compare the trade-offs between rapid prototyping in a tech startup versus building resilient infrastructure in an enterprise corporation."',
  },
];

export default function DuolingoItEnglishPage() {
  const [isDark, setIsDark] = useState(false);
  const [activeModule, setActiveModule] = useState<'word-select' | 'writing' | 'c-test'>('writing');
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [wordScore, setWordScore] = useState<number | null>(null);

  // Writing Prompt State
  const [activePromptIndex, setActivePromptIndex] = useState(0);
  const [userWriting, setUserWriting] = useState('');
  const [evaluating, setEvaluating] = useState(false);
  const [detResult, setDetResult] = useState<DetEvaluationResult | null>(null);

  useEffect(() => {
    if (isDark) {
      document.documentElement?.classList?.add('dark');
    } else {
      document.documentElement?.classList?.remove('dark');
    }
  }, [isDark]);

  const toggleWord = (word: string) => {
    setSelectedWords((prev) =>
      prev.includes(word) ? prev.filter((w) => w !== word) : [...prev, word]
    );
  };

  const handleScoreWords = () => {
    let correct = 0;
    let wrong = 0;
    IT_WORD_MATRIX.forEach((item) => {
      const isSelected = selectedWords.includes(item.word);
      if (item.isReal && isSelected) correct++;
      if (!item.isReal && isSelected) wrong++;
    });

    const score = Math.max(0, Math.round(((correct - wrong) / IT_WORD_MATRIX.filter(w => w.isReal).length) * 160));
    setWordScore(score);
    toast.success(`DET Vocabulary Score: ${score}/160`);
  };

  const handleEvaluateWriting = async () => {
    if (!userWriting.trim() || userWriting.trim().split(/\s+/).length < 20) {
      toast.error('Please write at least 20-30 words before submitting for DET scoring.');
      return;
    }

    setEvaluating(true);
    try {
      const res = await fetch('/api/english/duolingo/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskType: 'interactive-writing',
          promptText: IT_PROMPTS[activePromptIndex].prompt,
          userResponse: userWriting,
          targetItSector: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.details || data.error || 'Evaluation failed');

      setDetResult(data);
      toast.success(`🎉 DET Overall Score: ${data.overallScore}/160 (${data.cefrLevel})`);

      setTimeout(() => {
        document.getElementById('det-results')?.scrollIntoView({ behavior: 'smooth' });
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

      {/* Hero Banner */}
      <section className="pt-28 pb-10 bg-gradient-to-b from-cyan-500/10 via-card to-background border-b border-border">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 text-cyan-600 text-xs font-bold border border-cyan-500/20 mb-3">
                <Laptop size={14} /> Duolingo English Test (DET) — IT &amp; Tech Sector Edition
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-foreground tracking-tight flex items-center gap-3">
                Duolingo English Engine (Target DET 120-160)
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 font-extrabold">C1/C2 LEVEL</span>
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-2 max-w-2xl">
                Master the Duolingo English Test for US/UK/Canada Master&apos;s in CS/IT and remote global software engineering jobs. Interactive Read &amp; Select, C-Test Fillers, and IT Open Essay Scoring.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-card p-1.5 border border-border rounded-2xl shadow-sm shrink-0">
              <button
                onClick={() => setActiveModule('writing')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeModule === 'writing' ? 'bg-cyan-600 text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                ✍️ IT Interactive Writing
              </button>
              <button
                onClick={() => setActiveModule('word-select')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeModule === 'word-select' ? 'bg-cyan-600 text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                🔤 Read &amp; Select Matrix
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Workspace */}
      <section className="py-8 max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1 space-y-8">

        {activeModule === 'writing' ? (
          /* IT INTERACTIVE WRITING MODULE */
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            {/* Left Prompt Selector & Essay Box */}
            <div className="lg:col-span-7 space-y-6">

              {/* Prompt Card */}
              <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase text-cyan-600 tracking-wider">
                    DET Interactive Writing Task ({activePromptIndex + 1}/{IT_PROMPTS.length})
                  </span>
                  <div className="flex items-center gap-1">
                    {IT_PROMPTS.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActivePromptIndex(idx)}
                        className={`w-6 h-6 rounded-lg text-xs font-bold transition-all ${
                          activePromptIndex === idx ? 'bg-cyan-600 text-white' : 'bg-muted text-muted-foreground hover:bg-card'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 space-y-1.5">
                  <h3 className="text-sm font-bold text-foreground">{IT_PROMPTS[activePromptIndex].title}</h3>
                  <p className="text-xs font-serif text-cyan-950 dark:text-cyan-200 leading-relaxed">
                    {IT_PROMPTS[activePromptIndex].prompt}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-foreground">
                    <span>Your Response:</span>
                    <span className="text-muted-foreground font-semibold">
                      {userWriting.trim().split(/\s+/).filter(Boolean).length} words (Target: 50+ words)
                    </span>
                  </div>

                  <textarea
                    rows={8}
                    value={userWriting}
                    onChange={(e) => setUserWriting(e.target.value)}
                    placeholder="Type your DET essay response here incorporating IT/tech concepts..."
                    className="w-full p-4 bg-muted/50 border border-border rounded-2xl text-xs sm:text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-cyan-500 leading-relaxed font-sans"
                  />
                </div>

                <button
                  onClick={handleEvaluateWriting}
                  disabled={evaluating || !userWriting.trim()}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-600 to-cyan-700 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/25 hover:from-cyan-700 hover:to-cyan-800 transition-all disabled:opacity-50"
                >
                  {evaluating ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" />
                      <span>Evaluating DET 10-160 Score &amp; IT Subscores...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      <span>Evaluate DET Score &amp; Get IT Career Feedback</span>
                    </>
                  )}
                </button>
              </div>

            </div>

            {/* Right Side: DET Scoring Framework Explanation */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-border">
                  <Award size={18} className="text-cyan-600" />
                  <h3 className="text-sm font-bold text-foreground">DET 10-160 Scoring Scale</h3>
                </div>

                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-muted/40 border border-border/80 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-foreground">120 – 160 Scale (C1/C2 Expert)</p>
                      <p className="text-[10px] text-muted-foreground">Target for Top US CS Master&apos;s &amp; Remote Senior Devs</p>
                    </div>
                    <span className="text-xs font-black text-cyan-600">Target</span>
                  </div>

                  <div className="p-3 rounded-xl bg-muted/40 border border-border/80 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-foreground">90 – 115 Scale (B2 Upper-Inter)</p>
                      <p className="text-[10px] text-muted-foreground">Standard US/UK Master&apos;s Admission Threshold</p>
                    </div>
                    <span className="text-xs font-bold text-muted-foreground">Pass</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-foreground space-y-2">
                  <p className="font-bold text-cyan-600">💡 IT Sector Scoring Boost Tips:</p>
                  <ul className="space-y-1.5 text-muted-foreground text-[11px]">
                    <li>• Use precise technical terms: <em>architecture, scalability, asynchronous, refactoring</em>.</li>
                    <li>• Structure compound-complex sentences with relative clauses (<em>which, where, resulting in</em>).</li>
                    <li>• Maintain formal academic tone without informal contractions.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* READ & SELECT REAL VS FAKE WORD MATRIX MODULE */
          <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-black text-foreground flex items-center gap-2">
                <Code size={20} className="text-cyan-600" />
                Read &amp; Select — IT &amp; Computer Science Vocabulary Matrix
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Select the real English words in the grid below. Pseudo-words are injected to test exact vocabulary recognition on the DET exam.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {IT_WORD_MATRIX.map((item) => {
                const isSelected = selectedWords.includes(item.word);
                return (
                  <button
                    key={item.word}
                    onClick={() => toggleWord(item.word)}
                    className={`p-3.5 rounded-2xl font-mono text-xs font-bold transition-all border text-center ${
                      isSelected
                        ? 'bg-cyan-600 text-white border-cyan-600 shadow-sm scale-[1.02]'
                        : 'bg-muted/40 border-border text-foreground hover:border-cyan-500/40'
                    }`}
                  >
                    {item.word}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border">
              <span className="text-xs text-muted-foreground font-semibold">
                {selectedWords.length} words selected
              </span>

              <button
                onClick={handleScoreWords}
                className="px-6 py-3 rounded-2xl bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-xs shadow-md shadow-cyan-600/20 transition-all flex items-center gap-2"
              >
                <CheckCircle2 size={16} />
                <span>Calculate DET Vocabulary Score</span>
              </button>
            </div>

            {wordScore !== null && (
              <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-center animate-fadeIn space-y-1">
                <p className="text-2xl font-black text-cyan-600">{wordScore} / 160 DET Score</p>
                <p className="text-xs text-muted-foreground">
                  {wordScore >= 120 ? '🌟 Excellent C1/C2 Technical Vocabulary Mastery!' : '💡 Practice more technical terms to reach 125+ for top US CS Master\'s programs.'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* DET Evaluation Results Card */}
        {detResult && (
          <div id="det-results" className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-lg space-y-8 animate-fadeIn">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-border">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-cyan-600 to-cyan-700 text-white flex flex-col items-center justify-center shadow-lg shadow-cyan-600/30">
                  <span className="text-3xl font-black">{detResult.overallScore}</span>
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-white/90">DET SCORE</span>
                </div>
                <div>
                  <h2 className="text-xl font-black text-foreground flex items-center gap-2">
                    Official DET AI Score Card ({detResult.cefrLevel} Level)
                    <CheckCircle2 size={18} className="text-success" />
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Evaluated on official Duolingo 10-160 scale with IT Industry career readiness benchmarks.
                  </p>
                </div>
              </div>
            </div>

            {/* Subscore Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 text-center space-y-1">
                <span className="text-[10px] font-extrabold uppercase text-muted-foreground">Literacy</span>
                <p className="text-xl font-black text-cyan-600">{detResult.subscores?.literacy || 120}</p>
                <p className="text-[10px] text-muted-foreground">Read &amp; Write</p>
              </div>

              <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 text-center space-y-1">
                <span className="text-[10px] font-extrabold uppercase text-muted-foreground">Comprehension</span>
                <p className="text-xl font-black text-cyan-600">{detResult.subscores?.comprehension || 115}</p>
                <p className="text-[10px] text-muted-foreground">Read &amp; Listen</p>
              </div>

              <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 text-center space-y-1">
                <span className="text-[10px] font-extrabold uppercase text-muted-foreground">Conversation</span>
                <p className="text-xl font-black text-cyan-600">{detResult.subscores?.conversation || 110}</p>
                <p className="text-[10px] text-muted-foreground">Listen &amp; Speak</p>
              </div>

              <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 text-center space-y-1">
                <span className="text-[10px] font-extrabold uppercase text-muted-foreground">Production</span>
                <p className="text-xl font-black text-cyan-600">{detResult.subscores?.production || 115}</p>
                <p className="text-[10px] text-muted-foreground">Write &amp; Speak</p>
              </div>
            </div>

            {/* IT Sector Career Advice & Model Answer */}
            <div className="p-5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 space-y-2">
              <h4 className="text-xs font-extrabold uppercase text-cyan-600 flex items-center gap-1.5">
                <Laptop size={14} /> IT Sector Career &amp; US/UK MS Admission Advice:
              </h4>
              <p className="text-xs font-medium text-foreground leading-relaxed">
                {detResult.itContextAdvice}
              </p>
            </div>

            {detResult.modelResponse && (
              <div className="p-5 rounded-2xl bg-muted/50 border border-border space-y-2">
                <h4 className="text-xs font-extrabold uppercase text-muted-foreground">DET 140+ Score Model Essay Response:</h4>
                <p className="text-xs font-serif italic text-foreground leading-relaxed">
                  &ldquo;{detResult.modelResponse}&rdquo;
                </p>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
