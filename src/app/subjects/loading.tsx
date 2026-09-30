import React from 'react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-background text-foreground animate-pulse p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* ── HEADER & TRACK INFO ──────────────────────────────────── */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="h-3.5 w-36 rounded-full bg-primary/20" />
              <div className="h-8 sm:h-9 w-64 sm:w-72 rounded-xl bg-muted" />
              <div className="h-4 w-96 max-w-full rounded-lg bg-muted/60" />
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-36 rounded-2xl bg-muted" />
              <div className="h-10 w-32 rounded-2xl bg-primary/25" />
            </div>
          </div>
        </div>

        {/* ── OVERALL PROGRESS BANNER ──────────────────────────────── */}
        <div className="bg-card border border-border/80 rounded-3xl p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left w-full md:w-auto">
              <div className="h-6 w-48 rounded-lg bg-muted mx-auto md:mx-0" />
              <div className="h-4 w-72 rounded bg-muted/60 mx-auto md:mx-0" />
              <div className="h-2.5 w-full md:w-80 rounded-full bg-muted pt-1" />
            </div>

            <div className="grid grid-cols-3 gap-4 w-full md:w-auto">
              <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/60 text-center space-y-1">
                <div className="h-5 w-12 rounded bg-muted mx-auto" />
                <div className="h-3 w-16 rounded bg-muted/60 mx-auto" />
              </div>
              <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/60 text-center space-y-1">
                <div className="h-5 w-12 rounded bg-muted mx-auto" />
                <div className="h-3 w-16 rounded bg-muted/60 mx-auto" />
              </div>
              <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/60 text-center space-y-1">
                <div className="h-5 w-12 rounded bg-muted mx-auto" />
                <div className="h-3 w-16 rounded bg-muted/60 mx-auto" />
              </div>
            </div>
          </div>
        </div>

        {/* ── SUBJECT CARDS LIST ───────────────────────────────────── */}
        <div className="space-y-6">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-card border border-border/80 rounded-3xl p-6 sm:p-7 shadow-sm space-y-5"
            >
              {/* Subject Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-muted shrink-0" />
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-3">
                      <div className="h-6 w-36 sm:w-48 rounded-lg bg-muted" />
                      <div className="h-5 w-20 rounded-full bg-muted/60" />
                    </div>
                    <div className="h-3.5 w-44 rounded bg-muted/60" />
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <div className="h-9 w-24 rounded-xl bg-muted/60" />
                  <div className="h-9 w-28 rounded-2xl bg-primary/25" />
                </div>
              </div>

              {/* Subject Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <div className="h-3 w-28 rounded bg-muted/60" />
                  <div className="h-3 w-12 rounded bg-muted/60" />
                </div>
                <div className="h-2 w-full rounded-full bg-muted" />
              </div>

              {/* Chapters Preview Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                {[...Array(3)].map((_, cIdx) => (
                  <div
                    key={cIdx}
                    className="p-3.5 rounded-2xl bg-muted/40 border border-border/60 flex items-center justify-between gap-2"
                  >
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="h-4 w-3/4 rounded bg-muted" />
                      <div className="h-3 w-1/2 rounded bg-muted/60" />
                    </div>
                    <div className="w-6 h-6 rounded-lg bg-muted shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
