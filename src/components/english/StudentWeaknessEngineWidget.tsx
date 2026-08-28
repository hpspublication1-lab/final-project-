'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Brain, Target, AlertTriangle, ArrowRight, Play, CheckCircle2,
  Sparkles, Award, Zap, BookOpen, Mic, PenTool, Flame, RefreshCw
} from 'lucide-react';
import { StudentDualProfileResult } from '@/lib/ai/agents/weaknessEngine';

export default function StudentWeaknessEngineWidget() {
  const [profileData, setProfileData] = useState<StudentDualProfileResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/english/weakness-engine');
      if (res.ok) {
        const data = await res.json();
        setProfileData(data);
      }
    } catch {
      // Non-critical widget
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-3xl p-6 animate-pulse space-y-4">
        <div className="h-6 w-56 bg-muted rounded" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="h-20 bg-muted rounded-2xl" />
          <div className="h-20 bg-muted rounded-2xl" />
          <div className="h-20 bg-muted rounded-2xl" />
          <div className="h-20 bg-muted rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!profileData) return null;

  const { ieltsProfile, englishProfile, weakestSubskill, nextBestExercise } = profileData;

  return (
    <div className="bg-gradient-to-br from-amber-500/5 via-card to-cyan-500/5 border border-amber-500/20 rounded-3xl p-6 sm:p-8 shadow-lg space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 text-xs font-black border border-amber-500/20 mb-1">
            <Brain size={14} /> Student Dual Profile &amp; Master Weakness Engine
          </div>
          <h3 className="text-xl font-black text-foreground">AI Skill Tree &amp; Next Best Exercise</h3>
        </div>
        <button
          onClick={fetchProfile}
          className="p-2 rounded-xl bg-card border border-border hover:border-amber-500/40 text-muted-foreground hover:text-foreground transition-all shrink-0 self-start sm:self-auto"
          title="Recalculate Weakness Engine"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Dual Profile Matrix Grid */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* IELTS Profile (4 Skills) */}
        <div className="bg-card/70 border border-border rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase text-amber-600 tracking-wider flex items-center gap-1.5">
              <Award size={14} /> IELTS Profile (4 Skills)
            </h4>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-amber-500/10 text-amber-600">BAND MATRIX</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            {/* Speaking */}
            <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground">Speaking</span>
                <span className="font-black text-amber-600">Band {ieltsProfile.speaking.overall}</span>
              </div>
              <div className="text-[10px] text-muted-foreground space-y-0.5 font-mono">
                <p>FC: Band {ieltsProfile.speaking.fc} | LR: Band {ieltsProfile.speaking.lr}</p>
                <p>GRA: Band {ieltsProfile.speaking.gra} | PR: Band {ieltsProfile.speaking.pr}</p>
              </div>
            </div>

            {/* Writing */}
            <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground">Writing</span>
                <span className="font-black text-amber-600">Band {ieltsProfile.writing.overall}</span>
              </div>
              <div className="text-[10px] text-muted-foreground space-y-0.5 font-mono">
                <p>TA: Band {ieltsProfile.writing.ta} | CC: Band {ieltsProfile.writing.cc}</p>
                <p>LR: Band {ieltsProfile.writing.lr} | GRA: Band {ieltsProfile.writing.gra}</p>
              </div>
            </div>

            {/* Reading */}
            <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground">Reading</span>
                <span className="font-black text-blue-600">Band {ieltsProfile.reading.overall}</span>
              </div>
              <div className="text-[10px] text-muted-foreground space-y-0.5 font-mono">
                <p>Speed: {ieltsProfile.reading.speedWpm} WPM</p>
                <p>Accuracy: {ieltsProfile.reading.accuracyPercentage}%</p>
              </div>
            </div>

            {/* Listening */}
            <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground">Listening</span>
                <span className="font-black text-purple-600">Band {ieltsProfile.listening.overall}</span>
              </div>
              <div className="text-[10px] text-muted-foreground space-y-0.5 font-mono">
                <p>Accents: {ieltsProfile.listening.accentAdaptability}%</p>
                <p>Distractors: {ieltsProfile.listening.distractorResistance}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* General English Profile (3 Pillars) */}
        <div className="bg-card/70 border border-border rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase text-cyan-600 tracking-wider flex items-center gap-1.5">
              <Sparkles size={14} /> General English Profile (3 Pillars)
            </h4>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-600">CEFR {englishProfile.vocabulary.cefrLevel}</span>
          </div>

          <div className="grid grid-cols-3 gap-3 text-xs">
            {/* Vocabulary */}
            <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-1">
              <span className="font-bold text-foreground">Vocabulary</span>
              <p className="text-xs font-black text-cyan-600">{englishProfile.vocabulary.cefrLevel} CEFR</p>
              <p className="text-[10px] text-muted-foreground">AWL: {englishProfile.vocabulary.awlCoverage}%</p>
            </div>

            {/* Grammar */}
            <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-1">
              <span className="font-bold text-foreground">Grammar</span>
              <p className="text-xs font-black text-cyan-600">{englishProfile.grammar.complexSentenceRatio}% Complex</p>
              <p className="text-[10px] text-muted-foreground">Tense: {englishProfile.grammar.tenseConsistency}%</p>
            </div>

            {/* Fluency */}
            <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-1">
              <span className="font-bold text-foreground">Fluency</span>
              <p className="text-xs font-black text-cyan-600">{englishProfile.fluency.speakingRateWpm} WPM</p>
              <p className="text-[10px] text-muted-foreground">Hesitation: {englishProfile.fluency.hesitationIndex}</p>
            </div>
          </div>
        </div>

      </div>

      {/* Weakness Engine Alert Banner */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold uppercase text-amber-600 flex items-center gap-1.5">
            <AlertTriangle size={15} /> Master Weakness Engine Output
          </span>
          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300">
            SEVERITY {weakestSubskill.impactScore}/100
          </span>
        </div>
        <p className="text-xs font-bold text-foreground">
          Active Bottleneck: <span className="text-amber-600">{weakestSubskill.category} — {weakestSubskill.subskillName}</span> ({weakestSubskill.currentLevel} → Target: {weakestSubskill.targetLevel})
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed">{weakestSubskill.description}</p>
      </div>

      {/* Personalized Next Best Exercise Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-white/20 text-white flex items-center gap-1">
            <Flame size={12} /> Personalized Next Best Exercise
          </span>
          <span className="text-xs font-bold text-white/90">⏱️ {nextBestExercise.estimatedDurationMinutes} mins</span>
        </div>

        <div>
          <h4 className="text-xl font-black">{nextBestExercise.title}</h4>
          <p className="text-xs text-amber-100 mt-1 leading-relaxed">{nextBestExercise.instructions}</p>
        </div>

        <div className="p-3.5 rounded-xl bg-white/10 text-xs font-serif italic border border-white/20">
          &ldquo;{nextBestExercise.promptText}&rdquo;
        </div>

        <Link
          href={nextBestExercise.routePath}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white text-amber-900 font-extrabold text-xs hover:bg-amber-50 transition-all shadow-md"
        >
          <Play size={14} />
          <span>Launch Next Best Exercise ({nextBestExercise.skillTarget})</span>
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
