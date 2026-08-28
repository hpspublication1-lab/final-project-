'use client';

import React, { useState, useEffect } from 'react';
import PublicNav from '@/components/PublicNav';
import {
  BookOpen, Clock, Zap, Award, Sparkles, CheckCircle2, ArrowRight, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function IELTSReadingSpeedDrillsPage() {
  const [isDark, setIsDark] = useState(false);
  const [targetWpm, setTargetWpm] = useState<200 | 350 | 500>(350);
  const [readingTime, setReadingTime] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const samplePassage = `The advent of quantum computing represents a paradigm shift in processing capabilities. Traditional silicon microprocessors rely on binary bits, which exist strictly as zeros or ones. In stark contrast, quantum processors harness quantum bits, or qubits, that exploit the principles of superposition and quantum entanglement. Superposition allows qubits to exist in multiple states simultaneously, exponentially expanding computational throughput. Consequently, complex cryptographic algorithms and molecular simulations that would take classical supercomputers millennia to resolve can be executed in seconds. However, fault-tolerant error correction remains a formidable engineering hurdle before commercial deployment becomes ubiquitous.`;

  const wordCount = samplePassage.split(/\s+/).length;

  useEffect(() => {
    let interval: any = null;
    if (timerActive) {
      interval = setInterval(() => setReadingTime((t) => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive]);

  const handleStartPassage = () => {
    setReadingTime(0);
    setTimerActive(true);
    setSubmitted(false);
    setUserAnswers({});
  };

  const handleFinishReading = () => {
    setTimerActive(false);
    const calculatedWpm = Math.round((wordCount / Math.max(1, readingTime)) * 60);
    toast.success(`Passage Finished! Your Reading Speed: ${calculatedWpm} WPM`);
  };

  const calculatedWpm = readingTime > 0 ? Math.round((wordCount / readingTime) * 60) : 0;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <PublicNav isDark={isDark} onToggleDark={() => setIsDark(!isDark)} />

      {/* Hero */}
      <section className="pt-28 pb-8 bg-gradient-to-b from-blue-500/10 via-card to-background border-b border-border">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 text-blue-600 text-xs font-black border border-blue-500/20">
            <Zap size={14} /> Cambridge IELTS Speed Reading &amp; Skimming Drills
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight leading-tight">
            IELTS Academic <span className="text-blue-600">Speed Reading Drills</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-xl mx-auto">
            Train your reading speed from 200 WPM to 350+ WPM while preserving 90%+ comprehension accuracy under strict timed conditions.
          </p>
        </div>
      </section>

      {/* Main Workspace */}
      <section className="py-8 max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1 space-y-8">
        
        {/* Speed Target Selector */}
        <div className="flex items-center justify-center gap-3">
          {[
            { id: 200, label: '200 WPM (Standard Target)' },
            { id: 350, label: '350 WPM (Band 8.0 Target)' },
            { id: 500, label: '500 WPM (Speed Master)' },
          ].map((w) => (
            <button
              key={w.id}
              onClick={() => setTargetWpm(w.id as any)}
              className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all border ${
                targetWpm === w.id
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                  : 'bg-card border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {w.label}
            </button>
          ))}
        </div>

        {/* Reading Passage & Stopwatch Box */}
        <div className="max-w-3xl mx-auto bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <div>
              <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-500/10 px-2.5 py-0.5 rounded-full">
                CAMBRIDGE PASSAGE 01 · {wordCount} WORDS
              </span>
              <h3 className="text-lg font-black text-foreground mt-1">Quantum Computing &amp; Superposition</h3>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] text-muted-foreground block font-semibold">Reading Time:</span>
                <span className="text-xs font-mono font-black text-blue-600">{readingTime}s ({calculatedWpm} WPM)</span>
              </div>

              {!timerActive ? (
                <button
                  onClick={handleStartPassage}
                  className="px-5 py-2.5 rounded-2xl bg-blue-600 text-white font-black text-xs hover:bg-blue-700 transition-all shadow-md"
                >
                  Start Reading Timer
                </button>
              ) : (
                <button
                  onClick={handleFinishReading}
                  className="px-5 py-2.5 rounded-2xl bg-emerald-600 text-white font-black text-xs hover:bg-emerald-700 transition-all shadow-md"
                >
                  I Finished Reading
                </button>
              )}
            </div>
          </div>

          {/* Passage Text */}
          <div className="p-6 rounded-2xl bg-muted/30 border border-border font-serif leading-relaxed text-sm text-foreground">
            {samplePassage}
          </div>

          {/* Comprehension Quiz */}
          <div className="space-y-4 pt-2">
            <h4 className="text-xs font-black uppercase text-foreground">Comprehension Check:</h4>
            <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-3">
              <p className="text-xs font-bold text-foreground">
                Question 1: What principle allows qubits to exist in multiple states simultaneously?
              </p>
              <div className="grid sm:grid-cols-2 gap-2 text-xs">
                {['Binary Bit Encryption', 'Superposition', 'Silicon Conduction', 'Binary State Zero'].map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => setUserAnswers({ 1: opt })}
                    className={`p-3 rounded-xl text-left border font-medium transition-all ${
                      userAnswers[1] === opt
                        ? 'bg-blue-600 text-white border-blue-600 font-bold'
                        : 'bg-card border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>

        </div>

      </section>
    </div>
  );
}
