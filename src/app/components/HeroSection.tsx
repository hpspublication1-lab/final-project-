'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  Sparkles,
  BookOpen,
  GraduationCap,
  ShieldCheck,
  Clock,
  Stethoscope,
  Swords,
  Brain,
  BarChart2,
  Check,
  X,
  RotateCcw,
  Trophy,
  Zap,
  Building2,
  Activity,
  Flame,
  Award,
} from 'lucide-react';
import InteractiveParticleConstellation from '@/components/3d/InteractiveParticleConstellation';

export default function HeroSection() {
  // Interactive Product Showcase State
  const [activeTab, setActiveTab] = useState<'cbt' | 'arena' | 'saarthi' | 'radar'>('cbt');
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(10785); // 02:59:45

  // Tick the mock CBT timer down smoothly
  useEffect(() => {
    const interval = setInterval(() => {
      setTimerSeconds((prev) => (prev > 0 ? prev - 1 : 10800));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTimer = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSelectOption = (idx: number) => {
    if (selectedOption !== null) return;
    setSelectedOption(idx);
    setShowExplanation(true);
  };

  const handleResetCbt = () => {
    setSelectedOption(null);
    setShowExplanation(false);
  };

  return (
    <section aria-label="Hero — Nepal's Premier Medical & Entrance Platform" className="relative pt-24 sm:pt-32 pb-16 sm:pb-24 overflow-hidden w-full max-w-full">
      {/* Subtle Ambient Lighting */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background pointer-events-none" />
      <div className="absolute top-[-100px] right-[-100px] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[250px] left-[-120px] w-[450px] h-[450px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <InteractiveParticleConstellation particleCount={48} maxDistance={115} color="82, 67, 224" />

      <div className="relative max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        
        {/* Main Hero Header */}
        <div className="text-center max-w-4xl mx-auto space-y-6">
          
          {/* Status Chip */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-bold tracking-wide shadow-xs">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span>NEPAL&apos;S PREMIER MEDICAL &amp; ENTRANCE EXAMINATION PLATFORM · 2026 SESSION</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-foreground tracking-tight leading-[1.08]">
            Master Nepal&apos;s Toughest Exams.<br />
            <span className="bg-gradient-to-r from-primary via-indigo-500 to-purple-600 bg-clip-text text-transparent">
              Engineered for Top Ranks.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto font-medium">
            The authentic examination engine built strictly around Nepal&apos;s <strong>Medical Education Commission (MEC)</strong> and <strong>CDC rubrics</strong>. 15,000+ verified MCQs, full 200-question timed CBT simulation with -0.25 negative marking, and 24/7 AI-guided mastery.
          </p>

          {/* Primary & Secondary CTA Buttons */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3.5">
            <Link
              href="/mock-tests"
              className="px-7 py-3.5 rounded-2xl bg-primary hover:bg-primary-dark text-white font-bold text-sm shadow-md hover:shadow-primary/25 hover:shadow-lg transition-all flex items-center gap-2.5 active:scale-[0.98]"
            >
              <span>Launch 200Q Mock Exam</span>
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/practice"
              className="px-7 py-3.5 rounded-2xl bg-card hover:bg-muted text-foreground border border-border/90 font-bold text-sm shadow-xs hover:border-primary/40 transition-all flex items-center gap-2 active:scale-[0.98]"
            >
              <Zap size={16} className="text-primary" />
              <span>Explore Question Bank</span>
            </Link>
          </div>

          {/* Verified Institutional Deliverables Strip */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground font-semibold">
            <div className="flex items-center gap-1.5 text-foreground">
              <ShieldCheck size={14} className="text-primary" />
              <span>Exact 200-Question MEC Blueprint</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1.5 text-foreground">
              <Clock size={14} className="text-amber-500" />
              <span>-0.25 Server Negative Marking</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1.5 text-foreground">
              <Activity size={14} className="text-emerald-500" />
              <span>Instant National Merit Percentile</span>
            </div>
          </div>
        </div>

        {/* ── THE CENTERPIECE: INTERACTIVE PRODUCT SHOWCASE ── */}
        <div className="pt-12 max-w-5xl mx-auto">
          <div className="bg-card/90 backdrop-blur-xl border border-border/90 rounded-3xl shadow-xl overflow-hidden transition-all duration-300">
            
            {/* Terminal Header with Segmented Tabs */}
            <div className="bg-muted/40 border-b border-border/70 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
              {/* Exam Terminal Status */}
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-mono font-semibold text-foreground">
                  MEC CBT TERMINAL · EXAM MODE
                </span>
              </div>

              {/* Segmented Interactive Switcher */}
              <div className="flex items-center gap-1 bg-background/80 p-1 rounded-xl border border-border/80 text-xs font-bold overflow-x-auto max-w-full">
                <button
                  type="button"
                  onClick={() => setActiveTab('cbt')}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    activeTab === 'cbt'
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Stethoscope size={13} />
                  <span>200Q CBT Exam</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('arena')}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    activeTab === 'arena'
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Swords size={13} />
                  <span>1v1 Battle Arena</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('saarthi')}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    activeTab === 'saarthi'
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Brain size={13} />
                  <span>AI Tutor Saarthi</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('radar')}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    activeTab === 'radar'
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <BarChart2 size={13} />
                  <span>Mastery Radar</span>
                </button>
              </div>

              {/* Live Status Tag */}
              <div className="hidden md:flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Interactive Simulator
                </span>
              </div>
            </div>

            {/* Showcase Viewport */}
            <div className="p-6 sm:p-8 min-h-[380px] flex flex-col justify-between">
              
              {/* TAB 1: 200Q CBT Exam Hall */}
              {activeTab === 'cbt' && (
                <div className="space-y-6 animate-fade-in">
                  {/* Exam Question Meta Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border/70">
                    <div className="flex items-center gap-2.5">
                      <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-bold text-xs">
                        Question 1 of 200
                      </span>
                      <span className="text-xs font-semibold text-muted-foreground">
                        ZOOLOGY · Cardiovascular Physiology
                      </span>
                      <span className="text-[11px] font-mono text-amber-600 dark:text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        -0.25 Marking
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-foreground bg-muted px-3 py-1 rounded-lg border border-border/70">
                        <Clock size={13} className="text-primary" />
                        <span>{formatTimer(timerSeconds)}</span>
                      </div>
                      <div className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        Score: {selectedOption === 1 ? '+1.00' : selectedOption !== null ? '-0.25' : '0.00'}
                      </div>
                    </div>
                  </div>

                  {/* Question Stem */}
                  <div className="space-y-2">
                    <h3 className="text-base sm:text-lg font-bold text-foreground leading-snug">
                      In the human cardiac cycle, what is the approximate duration of ventricular systole under normal resting heart rate (72 beats/min)?
                    </h3>
                    <p className="text-xs text-muted-foreground font-medium">
                      Select an option below to test instant server-side evaluation and clinical rationale.
                    </p>
                  </div>

                  {/* Options Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {[
                      { letter: 'A', text: '0.1 seconds (Auricular systole)' },
                      { letter: 'B', text: '0.3 seconds (Ventricular systole)' },
                      { letter: 'C', text: '0.4 seconds (Complete cardiac diastole)' },
                      { letter: 'D', text: '0.8 seconds (Total cardiac cycle duration)' },
                    ].map((opt, idx) => {
                      const isCorrect = idx === 1;
                      const isSelected = selectedOption === idx;
                      let btnStyle = 'bg-card border-border/80 hover:border-primary/50 text-foreground';

                      if (selectedOption !== null) {
                        if (isCorrect) {
                          btnStyle = 'bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold';
                        } else if (isSelected && !isCorrect) {
                          btnStyle = 'bg-red-500/10 border-red-500 text-red-700 dark:text-red-300 line-through';
                        } else {
                          btnStyle = 'opacity-50 border-border/40';
                        }
                      }

                      return (
                        <button
                          key={opt.letter}
                          type="button"
                          onClick={() => handleSelectOption(idx)}
                          className={`p-3.5 rounded-2xl border text-left text-xs sm:text-sm transition-all flex items-center justify-between group ${btnStyle}`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-lg bg-muted text-foreground font-mono font-bold text-xs flex items-center justify-center shrink-0">
                              {opt.letter}
                            </span>
                            <span>{opt.text}</span>
                          </div>
                          {selectedOption !== null && isCorrect && (
                            <Check size={16} className="text-emerald-600 shrink-0" />
                          )}
                          {selectedOption !== null && isSelected && !isCorrect && (
                            <X size={16} className="text-red-500 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Instant Explanation Drawer */}
                  {showExplanation && (
                    <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-2 animate-scale-in">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                          <CheckCircle2 size={14} />
                          <span>{selectedOption === 1 ? 'Correct! (+1.00 Marks Awarded)' : 'Incorrect! (-0.25 Negative Marking Applied)'}</span>
                        </span>
                        <button
                          type="button"
                          onClick={handleResetCbt}
                          className="text-[11px] font-bold text-muted-foreground hover:text-foreground flex items-center gap-1"
                        >
                          <RotateCcw size={12} />
                          <span>Try Again</span>
                        </button>
                      </div>
                      <p className="text-xs text-foreground/85 leading-relaxed">
                        <strong>MEC High-Yield Rationale:</strong> The total resting cardiac cycle takes <strong>0.8 seconds</strong>. It divides into: (1) Auricular systole = <strong>0.1s</strong>, (2) Ventricular systole = <strong>0.3s</strong>, and (3) Complete cardiac joint diastole = <strong>0.4s</strong>. During ventricular systole, the AV valves close producing the <em>LUBB</em> (first heart sound).
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: 1v1 Battle Arena */}
              {activeTab === 'arena' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex items-center justify-between pb-4 border-b border-border/70">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                      <span className="text-xs font-bold text-foreground">LIVE 1V1 MULTIPLAYER DUEL</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-mono font-bold">
                      Rs. 1,000 Daily Bounty
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Player 1: You */}
                    <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="w-9 h-9 rounded-xl bg-primary text-white font-black text-xs flex items-center justify-center">
                            YOU
                          </span>
                          <div>
                            <p className="text-xs font-bold text-foreground">Prashant K.</p>
                            <p className="text-[10px] text-muted-foreground font-mono">Rating: 1,480 ELO</p>
                          </div>
                        </div>
                        <span className="text-xs font-mono font-black text-primary">850 Pts</span>
                      </div>
                      <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                        <div className="bg-primary h-full rounded-full w-[85%]" />
                      </div>
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        Answered in 2.1s (Streak: 4)
                      </p>
                    </div>

                    {/* Player 2: Opponent */}
                    <div className="p-4 rounded-2xl bg-card border border-border/80 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="w-9 h-9 rounded-xl bg-rose-500 text-white font-black text-xs flex items-center justify-center">
                            AK
                          </span>
                          <div>
                            <p className="text-xs font-bold text-foreground">Aayushma K. (Dharan)</p>
                            <p className="text-[10px] text-muted-foreground font-mono">Rating: 1,510 ELO</p>
                          </div>
                        </div>
                        <span className="text-xs font-mono font-black text-foreground">720 Pts</span>
                      </div>
                      <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                        <div className="bg-rose-500 h-full rounded-full w-[72%]" />
                      </div>
                      <p className="text-[11px] text-muted-foreground font-semibold">
                        Deciding question 5 of 7...
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-muted/40 border border-border/70 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Flame size={16} className="text-amber-500" />
                      <span className="text-xs font-bold text-foreground">Continuous Matchmaking Active</span>
                    </div>
                    <Link
                      href="/battle-arena"
                      className="px-4 py-2 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary-dark transition-colors flex items-center gap-1.5"
                    >
                      <span>Enter Arena</span>
                      <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              )}

              {/* TAB 3: AI Tutor Saarthi */}
              {activeTab === 'saarthi' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between pb-3 border-b border-border/70">
                    <div className="flex items-center gap-2">
                      <Sparkles size={15} className="text-primary" />
                      <span className="text-xs font-bold text-foreground">24/7 AI MEDICAL &amp; SCIENCE SAARTHI</span>
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground">MEC Syllabus Engine v2.6</span>
                  </div>

                  {/* Student Question Bubble */}
                  <div className="flex items-start gap-2.5 max-w-[85%]">
                    <span className="w-7 h-7 rounded-lg bg-muted text-foreground font-bold text-[10px] flex items-center justify-center shrink-0">
                      You
                    </span>
                    <div className="p-3.5 rounded-2xl bg-muted/60 text-xs font-medium text-foreground leading-relaxed">
                      &quot;Why does fetal hemoglobin (HbF) have a higher affinity for oxygen than adult hemoglobin (HbA)?&quot;
                    </div>
                  </div>

                  {/* AI Tutor Bubble */}
                  <div className="flex items-start gap-2.5 max-w-[95%] ml-auto">
                    <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 text-xs text-foreground space-y-2 leading-relaxed">
                      <div className="flex items-center gap-1.5 font-bold text-primary">
                        <Brain size={14} />
                        <span>AI Saarthi Medical Rationale:</span>
                      </div>
                      <p>
                        HbF consists of <strong>α₂γ₂</strong> chains, whereas adult HbA consists of <strong>α₂β₂</strong> chains. The γ-chain lacks certain positively charged amino acids found in the β-chain (specifically His143 substituted by Serine).
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        <strong>High-Yield Takeaway:</strong> Because of this substitution, HbF binds <strong>2,3-BPG (2,3-bisphosphoglycerate)</strong> much less strongly. Less 2,3-BPG binding keeps HbF in the relaxed (R) high-affinity state, shifting its dissociation curve to the <strong>left</strong> and ensuring efficient oxygen transfer across the maternal placenta.
                      </p>
                    </div>
                    <span className="w-7 h-7 rounded-lg bg-primary text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                      AI
                    </span>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Link
                      href="/ai-tutor"
                      className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                    >
                      <span>Ask AI Tutor Any Concept</span>
                      <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              )}

              {/* TAB 4: Mastery Radar */}
              {activeTab === 'radar' && (
                <div className="space-y-5 animate-fade-in">
                  <div className="flex items-center justify-between pb-3 border-b border-border/70">
                    <div className="flex items-center gap-2">
                      <BarChart2 size={15} className="text-primary" />
                      <span className="text-xs font-bold text-foreground">DIAGNOSTIC MASTERY &amp; PREDICTED MERIT</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      Predicted Rank: #142 (Govt. Seat: 94.2%)
                    </span>
                  </div>

                  <div className="space-y-3">
                    {[
                      { subject: 'Zoology', pct: 91, questions: '40/40 MCQs', color: 'bg-emerald-500' },
                      { subject: 'Botany', pct: 84, questions: '34/40 MCQs', color: 'bg-teal-500' },
                      { subject: 'Chemistry (Organic & Physical)', pct: 78, questions: '39/50 MCQs', color: 'bg-indigo-500' },
                      { subject: 'Physics (Mechanics & Modern)', pct: 72, questions: '36/50 MCQs', color: 'bg-blue-500' },
                      { subject: 'Mental Agility Test (MAT)', pct: 95, questions: '19/20 MCQs', color: 'bg-amber-500' },
                    ].map((s) => (
                      <div key={s.subject} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-foreground">{s.subject}</span>
                          <span className="text-muted-foreground font-mono">{s.questions} · <strong>{s.pct}%</strong></span>
                        </div>
                        <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${s.color}`} style={{ width: `${s.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      Based on last 4 Mock Tests &amp; 1,200 practiced items.
                    </span>
                    <Link
                      href="/progress"
                      className="font-bold text-primary hover:underline flex items-center gap-1"
                    >
                      <span>Full Analytics Report</span>
                      <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>

        {/* ── INSTITUTIONAL ACCREDITATION & SYLLABUS ALIGNMENT ── */}
        <div className="pt-14 max-w-4xl mx-auto text-center space-y-4">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
            Examination Blueprint &amp; Syllabus Strictly Formatted According To
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs sm:text-sm font-semibold text-muted-foreground">
            <span className="hover:text-foreground transition-colors flex items-center gap-1.5">
              <Stethoscope size={15} className="text-primary" />
              <span>MEC Nepal (MECEE-BL)</span>
            </span>
            <span className="text-border">•</span>
            <span className="hover:text-foreground transition-colors flex items-center gap-1.5">
              <Building2 size={15} className="text-primary" />
              <span>TU Institute of Medicine (IOM)</span>
            </span>
            <span className="text-border">•</span>
            <span className="hover:text-foreground transition-colors flex items-center gap-1.5">
              <Activity size={15} className="text-primary" />
              <span>BPKIHS Dharan Pattern</span>
            </span>
            <span className="text-border">•</span>
            <span className="hover:text-foreground transition-colors flex items-center gap-1.5">
              <GraduationCap size={15} className="text-primary" />
              <span>CDC Nepal Board Rubrics</span>
            </span>
          </div>
        </div>

        {/* ── 4 STAT HIGHLIGHT COUNTERS ── */}
        <div aria-label="Platform deliverables" className="pt-12 max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 text-center">
          <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs">
            <div className="text-2xl sm:text-3xl font-black text-foreground">15,000+</div>
            <div className="text-xs text-muted-foreground font-medium mt-1">Verified MCQs</div>
          </div>
          <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs">
            <div className="text-2xl sm:text-3xl font-black text-primary">200-Q</div>
            <div className="text-xs text-muted-foreground font-medium mt-1">Timed CBT Hall</div>
          </div>
          <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs">
            <div className="text-2xl sm:text-3xl font-black text-amber-500">-0.25</div>
            <div className="text-xs text-muted-foreground font-medium mt-1">Negative Marking</div>
          </div>
          <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs">
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">24/7</div>
            <div className="text-xs text-muted-foreground font-medium mt-1">AI Doubt Saarthi</div>
          </div>
        </div>

      </div>
    </section>
  );
}
