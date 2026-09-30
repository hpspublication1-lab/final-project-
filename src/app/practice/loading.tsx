import React from 'react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-background text-foreground animate-pulse p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* ── TOP HEADER & FILTER BAR ──────────────────────────────── */}
        <div className="bg-card border border-border/80 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5">
          {/* Title Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="h-4 w-32 rounded-full bg-primary/20" />
              <div className="h-7 w-64 rounded-xl bg-muted" />
              <div className="h-3.5 w-80 max-w-full rounded bg-muted/60" />
            </div>
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-28 rounded-2xl bg-muted" />
              <div className="h-9 w-24 rounded-2xl bg-primary/25" />
            </div>
          </div>

          {/* Subject Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1">
            <div className="h-9 w-24 rounded-2xl bg-primary/30 shrink-0" />
            <div className="h-9 w-28 rounded-2xl bg-muted/70 shrink-0" />
            <div className="h-9 w-28 rounded-2xl bg-muted/70 shrink-0" />
            <div className="h-9 w-28 rounded-2xl bg-muted/70 shrink-0" />
            <div className="h-9 w-32 rounded-2xl bg-muted/70 shrink-0" />
          </div>

          {/* Secondary Filters: Chapter, Difficulty, Mode */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-border/60">
            <div className="h-10 rounded-2xl bg-muted/50 border border-border/60" />
            <div className="h-10 rounded-2xl bg-muted/50 border border-border/60" />
            <div className="h-10 rounded-2xl bg-muted/50 border border-border/60" />
          </div>
        </div>

        {/* ── QUESTION CARD SKELETON ───────────────────────────────── */}
        <div className="bg-card border border-border/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-7">
          {/* Question Metadata Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border/60">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-28 rounded-xl bg-primary/20" />
              <div className="h-7 w-20 rounded-xl bg-emerald-500/20" />
              <div className="h-7 w-16 rounded-xl bg-muted/60 hidden sm:block" />
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-muted/60" />
              <div className="w-8 h-8 rounded-xl bg-muted/60" />
              <div className="h-8 w-24 rounded-xl bg-muted/60" />
            </div>
          </div>

          {/* Question Prompt */}
          <div className="space-y-3 pt-1">
            <div className="h-5 w-full rounded-lg bg-muted" />
            <div className="h-5 w-11/12 rounded-lg bg-muted" />
            <div className="h-5 w-3/4 rounded-lg bg-muted/70" />
          </div>

          {/* 4 MCQ Option Cards */}
          <div className="space-y-3 pt-2">
            {['A', 'B', 'C', 'D'].map((letter) => (
              <div
                key={letter}
                className="h-14 sm:h-16 rounded-2xl border border-border/80 bg-muted/30 flex items-center px-4 sm:px-5 gap-4"
              >
                <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
                  {letter}
                </div>
                <div className="h-4 rounded-lg bg-muted/70 flex-1 max-w-lg" />
              </div>
            ))}
          </div>

          {/* AI Hint / Formula Box Placeholder */}
          <div className="p-4 rounded-2xl bg-muted/25 border border-dashed border-border/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-lg bg-primary/20" />
              <div className="h-3.5 w-44 rounded bg-muted/60" />
            </div>
            <div className="h-7 w-20 rounded-xl bg-muted/50" />
          </div>

          {/* Bottom Navigation Toolbar */}
          <div className="flex items-center justify-between pt-4 border-t border-border/60">
            <div className="h-11 w-28 rounded-2xl bg-muted" />
            <div className="flex items-center gap-3">
              <div className="h-11 w-28 rounded-2xl bg-muted hidden sm:block" />
              <div className="h-11 w-32 rounded-2xl bg-primary/30" />
            </div>
          </div>
        </div>

        {/* ── QUESTION NAV PALETTE STRIP ────────────────────────────── */}
        <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between pb-3">
            <div className="h-4 w-36 rounded bg-muted" />
            <div className="h-3 w-24 rounded bg-muted/60" />
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {[...Array(15)].map((_, i) => (
              <div
                key={i}
                className="w-9 h-9 rounded-xl bg-muted/50 border border-border/60"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
