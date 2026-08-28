'use client';

import React from 'react';
import Link from 'next/link';
import { Play, Smartphone, CheckCircle2, RefreshCw, ArrowRight, Sparkles } from 'lucide-react';

interface ContinueLearningProps {
  currentCourseTitle?: string;
  currentLessonTitle?: string;
  progressPercent?: number;
  lessonUrl?: string;
}

export default function ContinueLearningBar({
  currentCourseTitle = 'CEE Medical Entrance Master Batch',
  currentLessonTitle = 'Photosynthesis: Light & Dark Reactions',
  progressPercent = 65,
  lessonUrl = '/see/lessons/les_botany_01',
}: ContinueLearningProps) {
  return (
    <div className="bg-card border border-border rounded-3xl p-5 sm:p-6 shadow-md space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        
        {/* Left: Ecosystem Sync Status */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold shrink-0">
            <Smartphone size={22} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-success/10 text-success border border-success/20 flex items-center gap-1">
                <CheckCircle2 size={11} /> Web + Mobile Synced
              </span>
              <span className="text-[10px] text-muted-foreground font-semibold">Same Account Ecosystem</span>
            </div>
            <h3 className="text-base font-black text-foreground mt-1">{currentLessonTitle}</h3>
            <p className="text-xs text-muted-foreground font-medium">{currentCourseTitle}</p>
          </div>
        </div>

        {/* Right: Resume CTA Button */}
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href={lessonUrl}
            className="px-6 py-3.5 rounded-2xl bg-primary text-primary-foreground font-black text-xs flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all"
          >
            <Play size={16} className="fill-primary-foreground" />
            <span>Resume Lesson ({progressPercent}%)</span>
          </Link>
        </div>

      </div>

      {/* Progress Bar */}
      <div className="w-full bg-muted/60 rounded-full h-2 overflow-hidden border border-border/50">
        <div
          className="bg-gradient-to-r from-primary to-amber-500 h-full rounded-full transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}
