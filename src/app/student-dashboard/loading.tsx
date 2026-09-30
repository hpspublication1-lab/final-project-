import React from 'react';

export default function Loading() {
  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden animate-pulse">
      {/* ── DESKTOP LEFT SIDEBAR SKELETON ─────────────────────────── */}
      <aside className="hidden lg:flex flex-col justify-between shrink-0 w-64 bg-card border-r border-border/80 p-4 space-y-6">
        {/* Top Header & Active Track */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border/60">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-primary/25" />
              <div className="space-y-1">
                <div className="h-4 w-24 rounded bg-muted" />
                <div className="h-2.5 w-14 rounded bg-muted/60" />
              </div>
            </div>
            <div className="w-7 h-7 rounded-lg bg-muted/50" />
          </div>

          {/* Active Track Selector Pill */}
          <div className="p-2.5 rounded-2xl bg-muted/60 border border-border/70 space-y-1.5">
            <div className="h-2.5 w-16 rounded bg-muted-foreground/30" />
            <div className="h-4 w-28 rounded bg-muted" />
          </div>

          {/* Nav Items (8 links) */}
          <div className="space-y-1 pt-2">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-muted/30"
              >
                <div className="w-4 h-4 rounded-md bg-muted/70 shrink-0" />
                <div className="h-3.5 rounded-md bg-muted/60 flex-1" style={{ width: `${60 + (i % 4) * 10}%` }} />
              </div>
            ))}
          </div>
        </div>

        {/* Bottom User Profile Section */}
        <div className="pt-3 border-t border-border/60 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-muted shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 w-24 rounded bg-muted" />
            <div className="h-2.5 w-16 rounded bg-muted/60" />
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT AREA ────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-16 bg-card/80 border-b border-border/70 px-4 sm:px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="lg:hidden w-8 h-8 rounded-lg bg-muted" />
            <div className="h-4 w-32 sm:w-44 rounded-lg bg-muted" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-8 w-24 rounded-full bg-amber-500/15 hidden sm:block" />
            <div className="w-8 h-8 rounded-xl bg-muted/60" />
            <div className="w-8 h-8 rounded-xl bg-muted/60" />
            <div className="w-8 h-8 rounded-full bg-primary/20" />
          </div>
        </header>

        {/* Scrollable Dashboard Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Welcome Banner Card */}
          <div className="bg-card border border-border/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="h-3 w-28 rounded-full bg-primary/20" />
                <div className="h-7 sm:h-8 w-60 sm:w-80 rounded-xl bg-muted" />
                <div className="h-4 w-72 sm:w-96 rounded-lg bg-muted/60" />
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-32 rounded-2xl bg-primary/25" />
                <div className="h-10 w-28 rounded-2xl bg-muted" />
              </div>
            </div>
          </div>

          {/* Quick Stat Cards (4 Grid) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-card border border-border/80 rounded-2xl p-4 sm:p-5 space-y-3 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-xl bg-muted" />
                  <div className="h-4 w-12 rounded-full bg-muted/60" />
                </div>
                <div className="space-y-1">
                  <div className="h-6 w-20 rounded-lg bg-muted" />
                  <div className="h-3 w-24 rounded bg-muted/60" />
                </div>
              </div>
            ))}
          </div>

          {/* Main Grid: 2 Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 8 Cols */}
            <div className="lg:col-span-8 space-y-6">
              {/* Today's Study Plan Tasks */}
              <div className="bg-card border border-border/80 rounded-3xl p-6 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="h-5 w-44 rounded-lg bg-muted" />
                    <div className="h-3 w-32 rounded bg-muted/60" />
                  </div>
                  <div className="h-7 w-20 rounded-full bg-muted/60" />
                </div>

                <div className="space-y-3 pt-2">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="p-3.5 rounded-2xl bg-muted/40 border border-border/60 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-5 h-5 rounded-full bg-muted shrink-0" />
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="h-4 w-3/4 rounded bg-muted" />
                          <div className="h-3 w-1/3 rounded bg-muted/60" />
                        </div>
                      </div>
                      <div className="h-8 w-20 rounded-xl bg-primary/20 shrink-0" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Subject Mastery Progress Card */}
              <div className="bg-card border border-border/80 rounded-3xl p-6 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="h-5 w-48 rounded-lg bg-muted" />
                  <div className="h-4 w-16 rounded bg-muted/60" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="p-4 rounded-2xl bg-muted/30 border border-border/50 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="h-4 w-24 rounded bg-muted" />
                        <div className="h-3.5 w-10 rounded bg-muted/70" />
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted/60" />
                      <div className="h-3 w-28 rounded bg-muted/50" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Test Performance */}
              <div className="bg-card border border-border/80 rounded-3xl p-6 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="h-5 w-40 rounded-lg bg-muted" />
                  <div className="h-4 w-20 rounded bg-muted/60" />
                </div>

                <div className="space-y-2.5 pt-1">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="p-3.5 rounded-2xl bg-muted/30 flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="h-4 w-40 rounded bg-muted" />
                        <div className="h-3 w-24 rounded bg-muted/60" />
                      </div>
                      <div className="h-6 w-16 rounded-lg bg-muted" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right 4 Cols */}
            <div className="lg:col-span-4 space-y-6">
              {/* Upcoming Live Class Widget */}
              <div className="bg-card border border-border/80 rounded-3xl p-5 space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="h-5 w-24 rounded bg-primary/20" />
                  <div className="h-4 w-12 rounded bg-muted/60" />
                </div>
                <div className="h-5 w-full rounded-lg bg-muted" />
                <div className="h-3.5 w-36 rounded bg-muted/60" />
                <div className="h-10 w-full rounded-xl bg-primary/25 pt-2" />
              </div>

              {/* High-Yield Weak Topics */}
              <div className="bg-card border border-border/80 rounded-3xl p-5 space-y-3 shadow-sm">
                <div className="h-5 w-36 rounded-lg bg-muted" />
                <div className="space-y-2 pt-1">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="p-2.5 rounded-xl bg-muted/40 space-y-1.5">
                      <div className="h-3.5 w-4/5 rounded bg-muted" />
                      <div className="h-3 w-1/2 rounded bg-rose-500/20" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Academic Hotline Banner */}
              <div className="bg-card border border-border/80 rounded-3xl p-5 space-y-3 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 shrink-0" />
                  <div className="space-y-1 flex-1">
                    <div className="h-3.5 w-32 rounded bg-muted" />
                    <div className="h-2.5 w-24 rounded bg-muted/60" />
                  </div>
                </div>
                <div className="h-9 w-full rounded-xl bg-emerald-500/15" />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
