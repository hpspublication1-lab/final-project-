'use client';

import React from 'react';
import {
  TrendingUp, Clock, PlayCircle, CheckCircle2, Award, Flame,
  Target, AlertTriangle, ShieldCheck, Trophy, Sparkles, BarChart2
} from 'lucide-react';

interface StudentAnalyticsProps {
  displayName?: string;
  totalStudyHours?: number;
  videosCompleted?: number;
  totalVideos?: number;
  questionsSolved?: number;
  testScoreAvg?: number;
  weakChapters?: string[];
  improvementPct?: number;
  streakDays?: number;
  accuracyPct?: number;
  rankTitle?: string;
  predictedReadinessPct?: number;
}

export default function StudentAnalyticsPanel({
  displayName = 'Suraj',
  totalStudyHours = 48.5,
  videosCompleted = 108,
  totalVideos = 147,
  questionsSolved = 1420,
  testScoreAvg = 78,
  weakChapters = ['Opt Math: Vector Proofs', 'Physics: Electric Circuits', 'Chemistry: Electrochemistry'],
  improvementPct = 14.2,
  streakDays = 12,
  accuracyPct = 72.4,
  rankTitle = 'Rank #42 in Nepal (Top 8%)',
  predictedReadinessPct = 84,
}: StudentAnalyticsProps) {
  return (
    <div className="bg-card border-2 border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-mono">
            SAMYAK LEARNING INTELLIGENCE &amp; ANALYTICS
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2">
            <BarChart2 size={24} className="text-emerald-600" />
            STUDENT PERFORMANCE ANALYTICS
          </h2>
        </div>

        {/* Predicted Readiness Gauge */}
        <div className="px-5 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center shrink-0">
          <span className="text-[9px] font-black uppercase text-emerald-600 block font-mono">PREDICTED READINESS</span>
          <span className="text-2xl font-black text-emerald-600 font-mono">🚀 {predictedReadinessPct}%</span>
        </div>
      </div>

      {/* 10 Core Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono">
        
        {/* 1. Total Study Hours */}
        <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-1">
          <span className="text-[9px] font-bold uppercase text-muted-foreground block font-sans">1. STUDY HOURS</span>
          <div className="text-xl font-black text-foreground flex items-center gap-1.5">
            <Clock size={16} className="text-emerald-600" />
            {totalStudyHours}h
          </div>
          <span className="text-[9px] text-emerald-600 font-semibold font-sans">Active Learning</span>
        </div>

        {/* 2. Videos Completed */}
        <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-1">
          <span className="text-[9px] font-bold uppercase text-muted-foreground block font-sans">2. VIDEOS DONE</span>
          <div className="text-xl font-black text-foreground flex items-center gap-1.5">
            <PlayCircle size={16} className="text-blue-600" />
            {videosCompleted}/{totalVideos}
          </div>
          <span className="text-[9px] text-muted-foreground font-semibold font-sans">{Math.round((videosCompleted/totalVideos)*100)}% Completed</span>
        </div>

        {/* 3. Questions Solved */}
        <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-1">
          <span className="text-[9px] font-bold uppercase text-muted-foreground block font-sans">3. QUESTIONS</span>
          <div className="text-xl font-black text-foreground flex items-center gap-1.5">
            <CheckCircle2 size={16} className="text-emerald-600" />
            {questionsSolved}
          </div>
          <span className="text-[9px] text-emerald-600 font-semibold font-sans">MCQs Solved</span>
        </div>

        {/* 4. Test Scores */}
        <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-1">
          <span className="text-[9px] font-bold uppercase text-muted-foreground block font-sans">4. TEST AVERAGE</span>
          <div className="text-xl font-black text-foreground flex items-center gap-1.5">
            <Award size={16} className="text-purple-600" />
            {testScoreAvg}%
          </div>
          <span className="text-[9px] text-purple-600 font-semibold font-sans">Mock Score</span>
        </div>

        {/* 5. Improvement % */}
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
          <span className="text-[9px] font-bold uppercase text-emerald-600 block font-sans">5. IMPROVEMENT</span>
          <div className="text-xl font-black text-emerald-600 flex items-center gap-1.5">
            <TrendingUp size={16} />
            +{improvementPct}%
          </div>
          <span className="text-[9px] text-emerald-600 font-semibold font-sans">This Month</span>
        </div>

        {/* 6. Streak */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1">
          <span className="text-[9px] font-bold uppercase text-amber-600 block font-sans">6. ACTIVE STREAK</span>
          <div className="text-xl font-black text-amber-600 flex items-center gap-1.5">
            <Flame size={16} />
            {streakDays} Days
          </div>
          <span className="text-[9px] text-amber-600 font-semibold font-sans">Daily Active</span>
        </div>

        {/* 7. Accuracy */}
        <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-1">
          <span className="text-[9px] font-bold uppercase text-muted-foreground block font-sans">7. ACCURACY</span>
          <div className="text-xl font-black text-foreground flex items-center gap-1.5">
            <Target size={16} className="text-emerald-600" />
            {accuracyPct}%
          </div>
          <span className="text-[9px] text-emerald-600 font-semibold font-sans">Correct Answers</span>
        </div>

        {/* 8. Rank */}
        <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 space-y-1 col-span-2">
          <span className="text-[9px] font-bold uppercase text-indigo-600 block font-sans">8. NEPAL ELO RANK</span>
          <div className="text-base font-black text-indigo-600 flex items-center gap-1.5">
            <Trophy size={16} />
            {rankTitle}
          </div>
          <span className="text-[9px] text-muted-foreground font-semibold font-sans">Among 14,200 Students</span>
        </div>

      </div>

      {/* 9. Weak Chapters & Recovery Breakdown */}
      <div className="p-5 rounded-2xl bg-red-500/10 border border-red-500/20 space-y-3 font-sans">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase text-red-600 tracking-wider flex items-center gap-1.5 font-mono">
            <AlertTriangle size={14} /> 9. DETECTED WEAK CHAPTERS
          </span>
          <span className="text-[10px] text-red-600 font-bold font-mono">High Priority</span>
        </div>

        <div className="grid sm:grid-cols-3 gap-3 text-xs">
          {weakChapters.map((chap, i) => (
            <div key={i} className="p-3 rounded-xl bg-card border border-red-500/20 flex items-center justify-between font-bold text-foreground">
              <span>{chap}</span>
              <span className="text-red-500 text-[10px] font-mono font-black">RECOVER</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
