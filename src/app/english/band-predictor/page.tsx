'use client';

import React, { useState } from 'react';
import PublicNav from '@/components/PublicNav';
import {
  Award, Sparkles, CheckCircle2, ArrowRight, RefreshCw, BarChart2, Globe, Shield
} from 'lucide-react';

function rawMarksToBand(marks: number): number {
  if (marks >= 39) return 9.0;
  if (marks >= 37) return 8.5;
  if (marks >= 35) return 8.0;
  if (marks >= 33) return 7.5;
  if (marks >= 30) return 7.0;
  if (marks >= 27) return 6.5;
  if (marks >= 23) return 6.0;
  if (marks >= 19) return 5.5;
  if (marks >= 15) return 5.0;
  return 4.5;
}

function calibrateOverall(s: number, w: number, r: number, l: number): { rawAvg: number; finalBand: number } {
  const rawAvg = (s + w + r + l) / 4;
  const decimal = rawAvg % 1;
  const whole = Math.floor(rawAvg);
  let finalBand = whole;
  if (decimal < 0.25) finalBand = whole;
  else if (decimal < 0.75) finalBand = whole + 0.5;
  else finalBand = whole + 1;
  return { rawAvg: Math.round(rawAvg * 100) / 100, finalBand };
}

export default function IELTSBandPredictorPage() {
  const [isDark, setIsDark] = useState(false);
  const [speaking, setSpeaking] = useState<number>(6.5);
  const [writing, setWriting] = useState<number>(6.5);
  const [readingMarks, setReadingMarks] = useState<number>(32);
  const [listeningMarks, setListeningMarks] = useState<number>(34);

  const readingBand = rawMarksToBand(readingMarks);
  const listeningBand = rawMarksToBand(listeningMarks);

  const { rawAvg, finalBand } = calibrateOverall(speaking, writing, readingBand, listeningBand);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <PublicNav isDark={isDark} onToggleDark={() => setIsDark(!isDark)} />

      {/* Hero Section */}
      <section className="pt-28 pb-8 bg-gradient-to-b from-amber-500/10 via-card to-background border-b border-border">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 text-amber-600 text-xs font-black border border-amber-500/20">
            <BarChart2 size={14} /> Official Cambridge IELTS 4-Skill Band Predictor
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight leading-tight">
            IELTS Overall <span className="text-amber-600">Band Predictor</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-xl mx-auto">
            Calculate your calibrated IELTS overall band score across Speaking, Writing, Reading, and Listening using official half-band rounding formulas.
          </p>
        </div>
      </section>

      {/* Main Workspace */}
      <section className="py-8 max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1 space-y-8">
        
        <div className="max-w-3xl mx-auto bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-xl space-y-8">
          
          {/* Main Score Result Display */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-6 rounded-3xl bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-white text-amber-900 flex flex-col items-center justify-center font-black shadow-md">
                <span className="text-3xl">{finalBand.toFixed(1)}</span>
                <span className="text-[9px] uppercase tracking-wider text-amber-900/80">OVERALL BAND</span>
              </div>
              <div>
                <h3 className="text-xl font-black">Official Calibrated IELTS Score</h3>
                <p className="text-xs text-amber-100 mt-0.5">
                  Raw Average: <span className="font-bold">{rawAvg}</span> → Half-Band Calibrated: <span className="font-black text-white">Band {finalBand.toFixed(1)}</span>
                </p>
              </div>
            </div>
          </div>

          {/* 4 Skill Inputs */}
          <div className="grid sm:grid-cols-2 gap-6">
            
            {/* Speaking */}
            <div className="p-4 rounded-2xl bg-muted/30 border border-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">🎤 Speaking Band:</span>
                <span className="text-xs font-black text-amber-600">Band {speaking}</span>
              </div>
              <input
                type="range"
                min={4.0}
                max={9.0}
                step={0.5}
                value={speaking}
                onChange={(e) => setSpeaking(parseFloat(e.target.value))}
                className="w-full accent-amber-600"
              />
            </div>

            {/* Writing */}
            <div className="p-4 rounded-2xl bg-muted/30 border border-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">✍️ Writing Band:</span>
                <span className="text-xs font-black text-amber-600">Band {writing}</span>
              </div>
              <input
                type="range"
                min={4.0}
                max={9.0}
                step={0.5}
                value={writing}
                onChange={(e) => setWriting(parseFloat(e.target.value))}
                className="w-full accent-amber-600"
              />
            </div>

            {/* Reading */}
            <div className="p-4 rounded-2xl bg-muted/30 border border-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">📖 Reading Raw Marks:</span>
                <span className="text-xs font-black text-blue-600">{readingMarks}/40 (Band {readingBand})</span>
              </div>
              <input
                type="range"
                min={10}
                max={40}
                step={1}
                value={readingMarks}
                onChange={(e) => setReadingMarks(parseInt(e.target.value, 10))}
                className="w-full accent-blue-600"
              />
            </div>

            {/* Listening */}
            <div className="p-4 rounded-2xl bg-muted/30 border border-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">🎧 Listening Raw Marks:</span>
                <span className="text-xs font-black text-purple-600">{listeningMarks}/40 (Band {listeningBand})</span>
              </div>
              <input
                type="range"
                min={10}
                max={40}
                step={1}
                value={listeningMarks}
                onChange={(e) => setListeningMarks(parseInt(e.target.value, 10))}
                className="w-full accent-purple-600"
              />
            </div>

          </div>

          {/* Admission & Visa Eligibility Breakdown */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-black uppercase text-foreground flex items-center gap-1.5">
              <Globe size={14} className="text-amber-600" /> University &amp; Visa Admission Eligibility:
            </h4>

            <div className="grid sm:grid-cols-3 gap-3 text-xs">
              <div className={`p-3.5 rounded-2xl border ${finalBand >= 6.5 ? 'bg-success/10 border-success/20 text-foreground' : 'bg-muted/40 border-border text-muted-foreground'}`}>
                <span className="font-bold">UK University MS</span>
                <p className="text-[11px] mt-0.5 font-mono">{finalBand >= 6.5 ? '✓ ELIGIBLE (Band 6.5+)' : '❌ Requires Band 6.5'}</p>
              </div>

              <div className={`p-3.5 rounded-2xl border ${finalBand >= 7.0 ? 'bg-success/10 border-success/20 text-foreground' : 'bg-muted/40 border-border text-muted-foreground'}`}>
                <span className="font-bold">US Graduate School</span>
                <p className="text-[11px] mt-0.5 font-mono">{finalBand >= 7.0 ? '✓ ELIGIBLE (Band 7.0+)' : '❌ Requires Band 7.0'}</p>
              </div>

              <div className={`p-3.5 rounded-2xl border ${finalBand >= 8.0 ? 'bg-success/10 border-success/20 text-foreground' : 'bg-muted/40 border-border text-muted-foreground'}`}>
                <span className="font-bold">Canada PR (CLB 9)</span>
                <p className="text-[11px] mt-0.5 font-mono">{finalBand >= 8.0 ? '✓ ELIGIBLE (CLB 9 Master)' : '❌ Target L8.0 R7.0 W7.0 S7.0'}</p>
              </div>
            </div>
          </div>

        </div>

      </section>
    </div>
  );
}
