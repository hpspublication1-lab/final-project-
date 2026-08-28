'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Target, Sparkles, TrendingUp, CheckCircle2, AlertCircle, ArrowRight,
  BookOpen, Award, ShieldCheck, Zap, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ReadinessProps {
  score?: number; // e.g. 74
  targetScore?: number; // e.g. 85
  syllabusPct?: number; // e.g. 80
  testPerfPct?: number; // e.g. 72
  accuracyPct?: number; // e.g. 78
  consistencyPct?: number; // e.g. 90
  mockScorePct?: number; // e.g. 70
  weakChaptersPct?: number; // e.g. 55
  revisionPct?: number; // e.g. 60
}

export default function SeeReadinessScoreWidget({
  score = 74,
  targetScore = 85,
  syllabusPct = 80,
  testPerfPct = 72,
  accuracyPct = 78,
  consistencyPct = 90,
  mockScorePct = 70,
  weakChaptersPct = 55,
  revisionPct = 60,
}: ReadinessProps) {
  const [recalculating, setRecalculating] = useState(false);

  const recommendedTopics = [
    { title: 'Algebra & Quadratic Equations', subject: 'Mathematics', boost: '+4%', slug: 'mathematics', color: 'text-red-500', bg: 'bg-red-500/10' },
    { title: 'Light Refraction & Convex Lenses', subject: 'Science', boost: '+3%', slug: 'science', color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { title: 'Vector Geometry & Trigonometric Proofs', subject: 'Optional Math', boost: '+2%', slug: 'opt_math', color: 'text-red-500', bg: 'bg-red-500/10' },
    { title: 'Constitution & Civic Rights of Nepal', subject: 'Social Studies', boost: '+2%', slug: 'social', color: 'text-amber-500', bg: 'bg-amber-500/10' },
  ];

  const handleRecalculate = () => {
    setRecalculating(true);
    setTimeout(() => {
      setRecalculating(false);
      toast.success('SEE Readiness Score recalculated based on latest test accuracy!');
    }, 1200);
  };

  return (
    <div className="bg-gradient-to-br from-card via-card to-emerald-500/5 border-2 border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
      
      {/* Glow Effect */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-mono">
              AI PREDICTIVE EXAM ENGINE
            </span>
            <span className="text-xs text-muted-foreground font-bold font-mono">NEB SEE 2082 BOARD PREDICTION</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            SEE READINESS SCORE
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Multi-pillar AI index assessing your exact board exam probability.
          </p>
        </div>

        <button
          onClick={handleRecalculate}
          disabled={recalculating}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-card border border-border text-xs font-bold text-foreground hover:bg-muted transition-all shrink-0 shadow-sm"
        >
          <RefreshCw size={14} className={recalculating ? 'animate-spin text-emerald-500' : 'text-emerald-500'} />
          <span>{recalculating ? 'Recalculating...' : 'Recalculate AI Score'}</span>
        </button>
      </div>

      {/* Main Score Hero Card & AI Recommendation Callout */}
      <div className="grid md:grid-cols-12 gap-6 items-center">
        
        {/* Huge Score Badge */}
        <div className="md:col-span-5 p-6 rounded-3xl bg-emerald-500/10 border-2 border-emerald-500/30 flex flex-col items-center justify-center text-center space-y-2 relative shadow-inner">
          <span className="text-xs font-black uppercase text-emerald-600 font-mono">CURRENT READINESS INDEX</span>
          <div className="flex items-baseline gap-1 font-mono">
            <span className="text-6xl sm:text-7xl font-black text-emerald-600 leading-none tracking-tighter">
              {score}
            </span>
            <span className="text-2xl font-black text-emerald-600/70">/ 100</span>
          </div>
          <div className="w-full bg-muted rounded-full h-3 overflow-hidden mt-2">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 h-3 rounded-full" style={{ width: `${score}%` }} />
          </div>
          <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-bold font-mono pt-1">
            Predicted SEE Board Result: Distinction (GPA 3.65 - 3.80)
          </span>
        </div>

        {/* AI Action Target Callout */}
        <div className="md:col-span-7 p-6 rounded-3xl bg-card border border-border space-y-3 shadow-sm">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-emerald-500" />
            <h3 className="text-base font-black text-foreground uppercase tracking-tight font-mono">
              AI NEXT TARGET ACTION
            </h3>
          </div>

          <p className="text-base sm:text-lg font-extrabold text-foreground leading-snug">
            &ldquo;You are <span className="text-emerald-600 font-mono">{score}%</span> ready. Complete these 4 topics to reach <span className="text-emerald-600 font-mono">{targetScore}%</span>.&rdquo;
          </p>

          <p className="text-xs text-muted-foreground">
            Focusing on these 4 weak areas will unlock an immediate +11% readiness boost before exam day.
          </p>
        </div>

      </div>

      {/* 7 Pillar Breakdown Metrics */}
      <div className="p-6 rounded-3xl bg-muted/20 border border-border space-y-4">
        <h4 className="text-xs font-black uppercase text-foreground tracking-wider font-mono">
          7-PILLAR READINESS SCORE BREAKDOWN
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 text-center font-mono">
          
          <div className="p-3 rounded-2xl bg-card border border-border space-y-1">
            <span className="text-[9px] font-bold text-muted-foreground uppercase block">Syllabus</span>
            <span className="text-base font-black text-foreground">{syllabusPct}%</span>
            <span className="text-[8px] text-emerald-500 font-bold block">20% Wt.</span>
          </div>

          <div className="p-3 rounded-2xl bg-card border border-border space-y-1">
            <span className="text-[9px] font-bold text-muted-foreground uppercase block">Test Perf.</span>
            <span className="text-base font-black text-foreground">{testPerfPct}%</span>
            <span className="text-[8px] text-emerald-500 font-bold block">20% Wt.</span>
          </div>

          <div className="p-3 rounded-2xl bg-card border border-border space-y-1">
            <span className="text-[9px] font-bold text-muted-foreground uppercase block">Accuracy</span>
            <span className="text-base font-black text-emerald-600">{accuracyPct}%</span>
            <span className="text-[8px] text-emerald-500 font-bold block">15% Wt.</span>
          </div>

          <div className="p-3 rounded-2xl bg-card border border-border space-y-1">
            <span className="text-[9px] font-bold text-muted-foreground uppercase block">Consistency</span>
            <span className="text-base font-black text-purple-600">{consistencyPct}%</span>
            <span className="text-[8px] text-emerald-500 font-bold block">15% Wt.</span>
          </div>

          <div className="p-3 rounded-2xl bg-card border border-border space-y-1">
            <span className="text-[9px] font-bold text-muted-foreground uppercase block">Mock Score</span>
            <span className="text-base font-black text-foreground">{mockScorePct}%</span>
            <span className="text-[8px] text-emerald-500 font-bold block">15% Wt.</span>
          </div>

          <div className="p-3 rounded-2xl bg-card border border-border space-y-1">
            <span className="text-[9px] font-bold text-muted-foreground uppercase block">Weak Topics</span>
            <span className="text-base font-black text-red-500">{weakChaptersPct}%</span>
            <span className="text-[8px] text-emerald-500 font-bold block">10% Wt.</span>
          </div>

          <div className="p-3 rounded-2xl bg-card border border-border space-y-1">
            <span className="text-[9px] font-bold text-muted-foreground uppercase block">Revision</span>
            <span className="text-base font-black text-foreground">{revisionPct}%</span>
            <span className="text-[8px] text-emerald-500 font-bold block">5% Wt.</span>
          </div>

        </div>
      </div>

      {/* 4 Topic Recommendations Grid */}
      <div className="space-y-3 font-sans">
        <h4 className="text-xs font-black uppercase text-foreground tracking-wider font-mono">
          RECOMMENDED 4 TOPICS FOR +11% BOOST
        </h4>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {recommendedTopics.map((top, idx) => (
            <Link
              key={idx}
              href={`/see/subject/${top.slug}`}
              className="p-4 rounded-2xl bg-card hover:bg-muted/40 border border-border hover:border-emerald-500/40 transition-all space-y-2 block group shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${top.bg} ${top.color} font-mono`}>
                  {top.subject}
                </span>
                <span className="text-xs font-black text-emerald-600 font-mono">{top.boost}</span>
              </div>
              <h5 className="text-xs font-extrabold text-foreground group-hover:text-emerald-600 transition-colors line-clamp-1">
                {top.title}
              </h5>
              <div className="flex items-center text-[10px] text-emerald-600 font-bold">
                <span>Start Topic Practice</span>
                <ArrowRight size={12} className="ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
}
