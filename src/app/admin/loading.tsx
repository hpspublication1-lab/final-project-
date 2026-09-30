import React from 'react';

export default function Loading() {
  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden animate-pulse">
      {/* ── ADMIN LEFT SIDEBAR ─────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-64 bg-card border-r border-border h-full shrink-0">
        {/* Brand Header */}
        <div className="flex items-center gap-3 h-16 px-4 border-b border-border shrink-0">
          <div className="w-8 h-8 rounded-xl bg-primary/25 shrink-0" />
          <div className="space-y-1">
            <div className="h-4 w-28 rounded bg-muted" />
            <div className="h-2.5 w-16 rounded bg-primary/30" />
          </div>
        </div>

        {/* Navigation Categories */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-4">
          {/* Overview link */}
          <div className="h-9 rounded-xl bg-primary/20" />

          {/* Group 1: Academic */}
          <div className="space-y-2">
            <div className="h-3 w-28 rounded bg-muted/60 px-1" />
            <div className="space-y-1">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-8 rounded-lg bg-muted/30 flex items-center px-2.5 gap-2.5">
                  <div className="w-3.5 h-3.5 rounded bg-muted/60 shrink-0" />
                  <div className="h-3 w-3/4 rounded bg-muted/50" />
                </div>
              ))}
            </div>
          </div>

          {/* Group 2: Assessments */}
          <div className="space-y-2">
            <div className="h-3 w-32 rounded bg-muted/60 px-1" />
            <div className="space-y-1">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-8 rounded-lg bg-muted/30 flex items-center px-2.5 gap-2.5">
                  <div className="w-3.5 h-3.5 rounded bg-muted/60 shrink-0" />
                  <div className="h-3 w-3/4 rounded bg-muted/50" />
                </div>
              ))}
            </div>
          </div>

          {/* Group 3: Users */}
          <div className="space-y-2">
            <div className="h-3 w-24 rounded bg-muted/60 px-1" />
            <div className="space-y-1">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-8 rounded-lg bg-muted/30 flex items-center px-2.5 gap-2.5">
                  <div className="w-3.5 h-3.5 rounded bg-muted/60 shrink-0" />
                  <div className="h-3 w-3/4 rounded bg-muted/50" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Profile / Portal */}
        <div className="border-t border-border p-3 shrink-0 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-muted shrink-0" />
          <div className="space-y-1 flex-1">
            <div className="h-3 w-20 rounded bg-muted" />
            <div className="h-2.5 w-14 rounded bg-muted/60" />
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT AREA ────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 sm:px-6 shrink-0">
          <div className="flex items-center gap-3">
            <div className="lg:hidden w-8 h-8 rounded-lg bg-muted" />
            <div className="space-y-1">
              <div className="h-4 w-44 rounded bg-muted" />
              <div className="h-2.5 w-60 rounded bg-muted/60 hidden sm:block" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-8 w-28 rounded-xl bg-muted hidden sm:block" />
            <div className="w-8 h-8 rounded-lg bg-muted/60" />
            <div className="w-8 h-8 rounded-lg bg-muted/60" />
          </div>
        </header>

        {/* Scrollable Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          <div className="max-w-screen-2xl mx-auto space-y-6">
            {/* Header with Title and Quick Action Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="h-6 w-60 rounded-xl bg-muted" />
                <div className="h-3.5 w-80 rounded bg-muted/60" />
              </div>
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-32 rounded-xl bg-primary/25" />
                <div className="h-9 w-32 rounded-xl bg-muted" />
              </div>
            </div>

            {/* 4 Stat Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="bg-card border border-border rounded-2xl p-5 space-y-3 shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="h-3.5 w-24 rounded bg-muted/60" />
                    <div className="w-8 h-8 rounded-xl bg-muted" />
                  </div>
                  <div className="space-y-1">
                    <div className="h-7 w-28 rounded-lg bg-muted" />
                    <div className="h-3 w-32 rounded bg-muted/60" />
                  </div>
                </div>
              ))}
            </div>

            {/* 2-Column Operational Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left: Orders & Enrollments Table (8 cols) */}
              <div className="lg:col-span-8 bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-2">
                  <div className="space-y-1">
                    <div className="h-5 w-44 rounded-lg bg-muted" />
                    <div className="h-3 w-32 rounded bg-muted/60" />
                  </div>
                  <div className="h-8 w-24 rounded-xl bg-muted/60" />
                </div>

                {/* Table Placeholder */}
                <div className="border border-border/80 rounded-2xl overflow-hidden">
                  <div className="h-10 bg-muted/40 border-b border-border/80 flex items-center px-4 gap-4">
                    <div className="h-3 w-20 rounded bg-muted" />
                    <div className="h-3 w-32 rounded bg-muted flex-1" />
                    <div className="h-3 w-20 rounded bg-muted" />
                    <div className="h-3 w-16 rounded bg-muted" />
                  </div>
                  <div className="divide-y divide-border/60">
                    {[...Array(5)].map((_, r) => (
                      <div key={r} className="h-14 flex items-center px-4 gap-4">
                        <div className="h-3.5 w-20 rounded bg-muted/70" />
                        <div className="space-y-1 flex-1">
                          <div className="h-3.5 w-3/4 rounded bg-muted" />
                          <div className="h-2.5 w-1/2 rounded bg-muted/50" />
                        </div>
                        <div className="h-5 w-16 rounded-full bg-emerald-500/20" />
                        <div className="h-7 w-16 rounded-lg bg-muted" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right: Operational Activity Feed (4 cols) */}
              <div className="lg:col-span-4 bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
                <div className="space-y-1">
                  <div className="h-5 w-36 rounded-lg bg-muted" />
                  <div className="h-3 w-24 rounded bg-muted/60" />
                </div>

                <div className="space-y-3 pt-1">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="p-3 rounded-2xl bg-muted/30 border border-border/50 flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary/40 mt-1.5 shrink-0" />
                      <div className="space-y-1 flex-1">
                        <div className="h-3.5 w-full rounded bg-muted" />
                        <div className="h-2.5 w-20 rounded bg-muted/60" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
