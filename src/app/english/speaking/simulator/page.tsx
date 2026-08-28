'use client';

import React, { useState, useEffect } from 'react';
import PublicNav from '@/components/PublicNav';
import {
  Mic, MicOff, Play, Pause, RefreshCw, Sparkles, Award, Clock, ArrowRight, CheckCircle2, Volume2
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function IELTSSpeakingSimulatorPage() {
  const [isDark, setIsDark] = useState(false);
  const [part, setPart] = useState<1 | 2 | 3>(1);
  const [isRecording, setIsRecording] = useState(false);
  const [timer, setTimer] = useState(60); // 60s cue card prep or response timer
  const [timerActive, setTimerActive] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (timerActive && timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    } else if (timer === 0) {
      setTimerActive(false);
      toast.success('Timer complete!');
    }
    return () => clearInterval(interval);
  }, [timerActive, timer]);

  const startTimer = (sec: number) => {
    setTimer(sec);
    setTimerActive(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <PublicNav isDark={isDark} onToggleDark={() => setIsDark(!isDark)} />

      {/* Hero */}
      <section className="pt-28 pb-8 bg-gradient-to-b from-emerald-500/10 via-card to-background border-b border-border">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-black border border-emerald-500/20">
            <Mic size={14} /> Full 3-Part Cambridge Speaking Simulator
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight leading-tight">
            IELTS Speaking <span className="text-emerald-600">Exam Simulator</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-xl mx-auto">
            Simulate Part 1 (Introduction), Part 2 (Cue Card 1-min timer), and Part 3 (Abstract Discussion) with live acoustic feedback.
          </p>
        </div>
      </section>

      {/* Main Workspace */}
      <section className="py-8 max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1 space-y-8">
        
        {/* Part Selector */}
        <div className="flex items-center justify-center gap-3">
          {[
            { id: 1, label: 'Part 1: Intro & Hobbies' },
            { id: 2, label: 'Part 2: Cue Card Topic (1-min prep)' },
            { id: 3, label: 'Part 3: Abstract Discussion' },
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => { setPart(p.id as any); setTimerActive(false); }}
              className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all border ${
                part === p.id
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                  : 'bg-card border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Task Box */}
        <div className="max-w-2xl mx-auto bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          
          {part === 1 && (
            <div className="space-y-4">
              <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                PART 1 QUESTION PROMPT
              </span>
              <h3 className="text-xl font-black text-foreground">
                &ldquo;Tell me about your hometown. What is the most interesting part of the place where you grew up?&rdquo;
              </h3>
              <p className="text-xs text-muted-foreground">
                Tip: Speak naturally for 15–20 seconds. Use complex sentences with connectors (e.g. &quot;Although it is small, it features...&quot;).
              </p>
            </div>
          )}

          {part === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                  PART 2 CUE CARD TOPIC
                </span>
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-600">
                  <Clock size={15} /> <span>Timer: {timer}s</span>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-muted/40 border border-border space-y-2">
                <h3 className="text-base font-black text-foreground">
                  Describe a book or article that had a major influence on your thinking.
                </h3>
                <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1">
                  <li>What the book or article was</li>
                  <li>When you read it and who recommended it</li>
                  <li>What key ideas were presented</li>
                  <li>And explain why it influenced your perspective</li>
                </ul>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => startTimer(60)}
                  className="px-4 py-2 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20 font-bold text-xs hover:bg-amber-500/20 transition-all"
                >
                  Start 1-Min Prep Timer
                </button>
                <button
                  onClick={() => startTimer(120)}
                  className="px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-bold text-xs hover:bg-emerald-500/20 transition-all"
                >
                  Start 2-Min Speech Timer
                </button>
              </div>
            </div>
          )}

          {part === 3 && (
            <div className="space-y-4">
              <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                PART 3 ABSTRACT DEEP DISCUSSION
              </span>
              <h3 className="text-xl font-black text-foreground">
                &ldquo;How has digital technology changed the reading habits of the younger generation compared to traditional printed media?&rdquo;
              </h3>
              <p className="text-xs text-muted-foreground">
                Tip: Provide a structured analytical response using comparative discourse markers (&quot;While physical books offer tactile engagement, digital formats provide unprecedented accessibility...&quot;).
              </p>
            </div>
          )}

          {/* Acoustic Audio Microphone Recorder */}
          <div className="pt-4 border-t border-border flex flex-col items-center gap-4">
            <button
              onClick={() => setIsRecording(!isRecording)}
              className={`w-20 h-20 rounded-full flex items-center justify-center shadow-xl transition-all ${
                isRecording
                  ? 'bg-red-600 text-white animate-pulse'
                  : 'bg-emerald-600 text-white hover:scale-105'
              }`}
            >
              {isRecording ? <MicOff size={32} /> : <Mic size={32} />}
            </button>
            <p className="text-xs font-extrabold text-foreground">
              {isRecording ? '🔴 Recording Speech... Click to Stop' : 'Click Mic to Record Answer'}
            </p>
          </div>

        </div>

      </section>
    </div>
  );
}
