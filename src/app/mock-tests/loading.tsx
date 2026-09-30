import React from 'react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-background text-foreground animate-pulse p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* ── HEADER & SEARCH BAR ──────────────────────────────────── */}
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="h-3.5 w-32 rounded-full bg-primary/20" />
              <div className="h-8 sm:h-9 w-64 sm:w-80 rounded-xl bg-muted" />
              <div className="h-4 w-96 max-w-full rounded-lg bg-muted/60" />
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-36 rounded-2xl bg-muted" />
              <div className="h-10 w-32 rounded-2xl bg-primary/25" />
            </div>
          </div>

          {/* Exam Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <div className="h-10 w-28 rounded-2xl bg-primary/30 shrink-0" />
            <div className="h-10 w-36 rounded-2xl bg-muted/60 shrink-0" />
            <div className="h-10 w-44 rounded-2xl bg-muted/60 shrink-0" />
            <div className="h-10 w-32 rounded-2xl bg-muted/60 shrink-0" />
            <div className="h-10 w-36 rounded-2xl bg-muted/60 shrink-0" />
          </div>

          {/* Search & Sort Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <div className="h-11 w-full sm:w-80 rounded-2xl bg-card border border-border/80" />
            <div className="flex items-center gap-2.5 self-end sm:self-auto">
              <div className="h-9 w-28 rounded-xl bg-muted/50" />
              <div className="h-9 w-28 rounded-xl bg-muted/50" />
            </div>
          </div>
        </div>

        {/* ── MOCK TEST CARDS GRID ─────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-card border border-border/80 rounded-3xl p-6 sm:p-7 flex flex-col justify-between space-y-6 shadow-sm"
            >
              {/* Card Header & Badges */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-6 w-28 rounded-lg bg-primary/15" />
                  <div className="h-5 w-16 rounded-md bg-muted/70" />
                </div>

                <div className="space-y-2">
                  <div className="h-6 w-4/5 rounded-lg bg-muted" />
                  <div className="h-3.5 w-full rounded bg-muted/60" />
                  <div className="h-3.5 w-3/4 rounded bg-muted/60" />
                </div>

                {/* Exam Attributes Chips */}
                <div className="grid grid-cols-3 gap-2 pt-2">
                  <div className="p-2.5 rounded-xl bg-muted/40 border border-border/60 text-center space-y-1">
                    <div className="h-4 w-10 rounded bg-muted mx-auto" />
                    <div className="h-2.5 w-14 rounded bg-muted/60 mx-auto" />
                  </div>
                  <div className="p-2.5 rounded-xl bg-muted/40 border border-border/60 text-center space-y-1">
                    <div className="h-4 w-10 rounded bg-muted mx-auto" />
                    <div className="h-2.5 w-14 rounded bg-muted/60 mx-auto" />
                  </div>
                  <div className="p-2.5 rounded-xl bg-muted/40 border border-border/60 text-center space-y-1">
                    <div className="h-4 w-10 rounded bg-muted mx-auto" />
                    <div className="h-2.5 w-14 rounded bg-muted/60 mx-auto" />
                  </div>
                </div>
              </div>

              {/* Card Footer & CTA */}
              <div className="pt-4 border-t border-border/60 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="h-3.5 w-24 rounded bg-muted/60" />
                  <div className="h-3.5 w-16 rounded bg-emerald-500/20" />
                </div>
                <div className="h-11 w-full rounded-2xl bg-primary/25" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
