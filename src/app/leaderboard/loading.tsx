import React from 'react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-background text-foreground animate-pulse p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* ── HEADER & SCOPE FILTERS ───────────────────────────────── */}
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="h-3.5 w-36 rounded-full bg-primary/20" />
            <div className="h-8 sm:h-9 w-64 sm:w-80 rounded-xl bg-muted" />
            <div className="h-4 w-96 max-w-full rounded-lg bg-muted/60" />
          </div>

          {/* Scope Selector Chips (Nepal, Province, District, School, Friends) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-2">
            <div className="h-10 w-32 rounded-2xl bg-primary/30 shrink-0" />
            <div className="h-10 w-36 rounded-2xl bg-muted/60 shrink-0" />
            <div className="h-10 w-32 rounded-2xl bg-muted/60 shrink-0" />
            <div className="h-10 w-32 rounded-2xl bg-muted/60 shrink-0" />
            <div className="h-10 w-32 rounded-2xl bg-muted/60 shrink-0" />
          </div>

          {/* Time & Subject Secondary Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
            <div className="flex items-center gap-1.5 p-1 bg-muted/50 rounded-xl border border-border/60 self-start">
              <div className="h-8 w-20 rounded-lg bg-card shadow-xs" />
              <div className="h-8 w-24 rounded-lg bg-transparent" />
              <div className="h-8 w-20 rounded-lg bg-transparent" />
            </div>

            <div className="h-10 w-48 rounded-xl bg-card border border-border/80" />
          </div>
        </div>

        {/* ── TOP 3 PODIUM SKELETON ─────────────────────────────────── */}
        <div className="bg-card border border-border/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
          <div className="h-3.5 w-56 rounded bg-amber-500/20 mx-auto" />

          <div className="grid grid-cols-3 gap-3 sm:gap-6 items-end max-w-lg mx-auto pt-4 text-center">
            {/* 🥈 #2 Silver */}
            <div className="space-y-3 p-3 sm:p-4 rounded-2xl bg-muted/30 border border-border/70">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-slate-300/40 dark:bg-slate-700/40 mx-auto" />
              <div className="space-y-1.5">
                <div className="h-3.5 w-3/4 rounded bg-muted mx-auto" />
                <div className="h-2.5 w-1/2 rounded bg-muted/60 mx-auto" />
              </div>
            </div>

            {/* 🥇 #1 Gold (Elevated) */}
            <div className="space-y-3 p-4 sm:p-5 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 transform -translate-y-2 sm:-translate-y-4 shadow-md">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-amber-500/25 mx-auto" />
              <div className="space-y-1.5">
                <div className="h-4 w-4/5 rounded bg-muted mx-auto" />
                <div className="h-3 w-3/5 rounded bg-amber-500/30 mx-auto" />
              </div>
            </div>

            {/* 🥉 #3 Bronze */}
            <div className="space-y-3 p-3 sm:p-4 rounded-2xl bg-muted/30 border border-border/70">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-amber-700/20 mx-auto" />
              <div className="space-y-1.5">
                <div className="h-3.5 w-3/4 rounded bg-muted mx-auto" />
                <div className="h-2.5 w-1/2 rounded bg-muted/60 mx-auto" />
              </div>
            </div>
          </div>
        </div>

        {/* ── FULL RANKINGS TABLE ───────────────────────────────────── */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          {/* Table Header Row */}
          <div className="hidden sm:grid grid-cols-[3rem_1fr_7rem_7rem_7rem_6rem_5rem] gap-2 px-4 py-3 border-b border-border bg-muted/40 text-xs">
            <div className="h-3 w-6 rounded bg-muted" />
            <div className="h-3 w-20 rounded bg-muted" />
            <div className="h-3 w-16 rounded bg-muted" />
            <div className="h-3 w-16 rounded bg-muted" />
            <div className="h-3 w-16 rounded bg-muted" />
            <div className="h-3 w-14 rounded bg-muted" />
            <div className="h-3 w-14 rounded bg-muted" />
          </div>

          {/* Table Row Placeholders */}
          <div className="divide-y divide-border/60">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="grid grid-cols-[3rem_1fr] sm:grid-cols-[3rem_1fr_7rem_7rem_7rem_6rem_5rem] gap-2 px-4 py-3.5 items-center"
              >
                {/* Rank # */}
                <div className="flex items-center justify-center">
                  <div className="w-6 h-6 rounded-lg bg-muted/60" />
                </div>

                {/* Student Info */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted shrink-0" />
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="h-3.5 w-28 sm:w-36 rounded bg-muted" />
                    <div className="h-2.5 w-20 rounded bg-muted/60" />
                  </div>
                </div>

                {/* Rating ELO */}
                <div className="hidden sm:block">
                  <div className="h-6 w-16 rounded-lg bg-primary/20" />
                </div>

                {/* Accuracy */}
                <div className="hidden sm:block space-y-1">
                  <div className="h-3 w-10 rounded bg-muted" />
                  <div className="h-1.5 w-16 rounded-full bg-muted/60" />
                </div>

                {/* Mock Avg */}
                <div className="hidden sm:block">
                  <div className="h-4 w-12 rounded bg-muted" />
                </div>

                {/* Battles */}
                <div className="hidden sm:block">
                  <div className="h-4 w-10 rounded bg-muted" />
                </div>

                {/* Progress */}
                <div className="hidden sm:block">
                  <div className="h-5 w-12 rounded-full bg-emerald-500/20" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
