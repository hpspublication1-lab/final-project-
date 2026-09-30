import React from 'react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-background text-foreground animate-pulse flex flex-col justify-between">
      {/* ── TOP NAV SKELETON ───────────────────────────────────────── */}
      <header className="sticky top-0 z-40 w-full border-b border-border/70 bg-card/80 backdrop-blur-md">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-primary/25" />
            <div className="h-4 w-28 rounded bg-muted hidden sm:block" />
          </div>
          <div className="hidden md:flex items-center gap-6">
            <div className="h-4 w-16 rounded bg-muted/60" />
            <div className="h-4 w-16 rounded bg-muted/60" />
            <div className="h-4 w-16 rounded bg-muted/60" />
            <div className="h-4 w-24 rounded bg-muted/60" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-9 w-24 rounded-2xl bg-muted" />
            <div className="h-9 w-28 rounded-2xl bg-primary/30" />
          </div>
        </div>
      </header>

      {/* ── MAIN COURSE CATALOGUE CONTENT ──────────────────────────── */}
      <main className="flex-1 max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 pt-10 sm:pt-14 pb-20 w-full space-y-12">
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="h-7 w-64 rounded-full bg-primary/15 border border-primary/20 mx-auto" />
          <div className="space-y-2">
            <div className="h-9 sm:h-12 w-4/5 max-w-xl rounded-2xl bg-muted mx-auto" />
            <div className="h-4 w-3/4 max-w-md rounded-lg bg-muted/60 mx-auto" />
            <div className="h-4 w-1/2 max-w-sm rounded-lg bg-muted/50 mx-auto" />
          </div>
        </div>

        {/* Filter Tabs & Search Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 max-w-4xl mx-auto">
          <div className="flex flex-wrap items-center justify-center p-1.5 bg-muted/60 border border-border rounded-2xl gap-1">
            <div className="h-9 w-28 rounded-xl bg-card shadow-xs" />
            <div className="h-9 w-28 rounded-xl bg-muted/50" />
            <div className="h-9 w-28 rounded-xl bg-muted/50" />
            <div className="h-9 w-28 rounded-xl bg-muted/50" />
          </div>

          <div className="h-11 w-full md:w-64 rounded-2xl bg-card border border-border" />
        </div>

        {/* Course Cards Grid (6 Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-card border border-border/80 rounded-3xl p-6 sm:p-7 flex flex-col justify-between space-y-6 shadow-sm"
            >
              {/* Card Upper Info */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-6 w-28 rounded-lg bg-primary/20" />
                  <div className="h-4 w-20 rounded bg-muted/60" />
                </div>

                <div className="space-y-2">
                  <div className="h-6 w-5/6 rounded-lg bg-muted" />
                  <div className="h-3.5 w-full rounded bg-muted/60" />
                  <div className="h-3.5 w-4/5 rounded bg-muted/60" />
                </div>

                {/* Target & Goal Box */}
                <div className="p-3 rounded-2xl bg-muted/40 border border-border/60 space-y-2">
                  <div className="h-3.5 w-3/4 rounded bg-muted" />
                  <div className="h-3.5 w-2/3 rounded bg-muted/60" />
                </div>

                {/* Included Subjects Chips */}
                <div className="space-y-2 pt-1">
                  <div className="h-3 w-28 rounded bg-muted/60" />
                  <div className="flex flex-wrap gap-1.5">
                    <div className="h-6 w-20 rounded-lg bg-muted/60" />
                    <div className="h-6 w-24 rounded-lg bg-muted/60" />
                    <div className="h-6 w-20 rounded-lg bg-muted/60" />
                  </div>
                </div>
              </div>

              {/* Pricing & CTA */}
              <div className="pt-6 border-t border-border/60 space-y-3">
                <div className="flex items-baseline justify-between">
                  <div className="h-3 w-24 rounded bg-muted/60" />
                  <div className="h-6 w-28 rounded-lg bg-muted" />
                </div>
                <div className="h-11 w-full rounded-2xl bg-primary/25" />
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer Placeholder */}
      <footer className="border-t border-border/70 bg-card/60 py-8">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="h-4 w-44 rounded bg-muted/60" />
          <div className="flex gap-4">
            <div className="h-4 w-16 rounded bg-muted/60" />
            <div className="h-4 w-16 rounded bg-muted/60" />
          </div>
        </div>
      </footer>
    </div>
  );
}
