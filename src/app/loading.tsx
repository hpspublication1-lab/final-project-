import React from 'react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-background text-foreground animate-pulse flex flex-col justify-between">
      {/* Navbar Placeholder */}
      <header className="sticky top-0 z-40 w-full border-b border-border/70 bg-card/80 backdrop-blur-md">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 h-16 sm:h-20 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-primary/25" />
            <div className="space-y-1.5 hidden sm:block">
              <div className="h-4 w-28 rounded-lg bg-muted" />
              <div className="h-2.5 w-16 rounded-md bg-muted/60" />
            </div>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-6">
            <div className="h-4 w-16 rounded-md bg-muted/70" />
            <div className="h-4 w-14 rounded-md bg-muted/70" />
            <div className="h-4 w-14 rounded-md bg-muted/70" />
            <div className="h-4 w-24 rounded-md bg-muted/70" />
            <div className="h-4 w-16 rounded-md bg-muted/70" />
          </div>

          {/* Actions / Auth */}
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-muted/60" />
            <div className="h-9 sm:h-10 w-20 sm:w-28 rounded-2xl bg-muted/80" />
            <div className="h-9 sm:h-10 w-24 sm:w-32 rounded-2xl bg-primary/30" />
          </div>
        </div>
      </header>

      {/* Hero Section Placeholder */}
      <main className="flex-1 max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 pt-12 sm:pt-20 pb-20 w-full space-y-12">
        {/* Top Eyebrow & Main Headings */}
        <div className="text-center max-w-3xl mx-auto space-y-5">
          {/* Eyebrow Badge */}
          <div className="h-7 w-64 sm:w-80 rounded-full bg-primary/15 border border-primary/20 mx-auto" />

          {/* Title Lines */}
          <div className="space-y-3 pt-2">
            <div className="h-10 sm:h-14 w-4/5 sm:w-3/4 max-w-xl rounded-2xl bg-muted mx-auto" />
            <div className="h-10 sm:h-14 w-3/5 sm:w-1/2 max-w-md rounded-2xl bg-primary/20 mx-auto" />
          </div>

          {/* Subtitle Lines */}
          <div className="space-y-2 pt-2 max-w-xl mx-auto">
            <div className="h-4 w-full rounded-lg bg-muted/70" />
            <div className="h-4 w-5/6 rounded-lg bg-muted/60 mx-auto" />
            <div className="h-4 w-3/5 rounded-lg bg-muted/50 mx-auto" />
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3.5 pt-4">
            <div className="h-12 w-44 rounded-2xl bg-primary/30 shadow-xs" />
            <div className="h-12 w-36 rounded-2xl bg-muted border border-border" />
          </div>
        </div>

        {/* 2 Flagship Track Preview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto pt-6 items-stretch">
          {/* Card 1: SEE Class 10 */}
          <div className="bg-card border border-border/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="h-6 w-36 rounded-full bg-emerald-500/15" />
              <div className="w-8 h-8 rounded-xl bg-muted/70" />
            </div>

            <div className="space-y-2">
              <div className="h-7 w-3/4 rounded-xl bg-muted" />
              <div className="h-4 w-5/6 rounded-lg bg-muted/60" />
            </div>

            <div className="space-y-2.5 pt-4 border-t border-border/60">
              <div className="h-4 w-full rounded-lg bg-muted/50" />
              <div className="h-4 w-4/5 rounded-lg bg-muted/50" />
              <div className="h-4 w-3/4 rounded-lg bg-muted/50" />
            </div>

            <div className="pt-4 border-t border-border/60 flex items-center justify-between">
              <div className="space-y-1">
                <div className="h-3 w-16 rounded bg-muted/60" />
                <div className="h-6 w-24 rounded-lg bg-muted" />
              </div>
              <div className="h-11 w-32 rounded-2xl bg-emerald-500/20" />
            </div>
          </div>

          {/* Card 2: CEE Medical */}
          <div className="bg-card border border-border/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="h-6 w-40 rounded-full bg-primary/15" />
              <div className="w-8 h-8 rounded-xl bg-muted/70" />
            </div>

            <div className="space-y-2">
              <div className="h-7 w-3/4 rounded-xl bg-muted" />
              <div className="h-4 w-5/6 rounded-lg bg-muted/60" />
            </div>

            <div className="space-y-2.5 pt-4 border-t border-border/60">
              <div className="h-4 w-full rounded-lg bg-muted/50" />
              <div className="h-4 w-4/5 rounded-lg bg-muted/50" />
              <div className="h-4 w-3/4 rounded-lg bg-muted/50" />
            </div>

            <div className="pt-4 border-t border-border/60 flex items-center justify-between">
              <div className="space-y-1">
                <div className="h-3 w-16 rounded bg-muted/60" />
                <div className="h-6 w-24 rounded-lg bg-muted" />
              </div>
              <div className="h-11 w-32 rounded-2xl bg-primary/25" />
            </div>
          </div>
        </div>

        {/* Value Props Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto pt-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-card border border-border/60 rounded-2xl p-4 space-y-2 shadow-xs">
              <div className="w-8 h-8 rounded-xl bg-muted" />
              <div className="h-4 w-24 rounded bg-muted" />
              <div className="h-3 w-32 rounded bg-muted/60" />
            </div>
          ))}
        </div>
      </main>

      {/* Footer Placeholder */}
      <footer className="border-t border-border/70 bg-card/60 py-8">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="h-4 w-48 rounded bg-muted/60" />
          <div className="flex gap-4">
            <div className="h-4 w-16 rounded bg-muted/60" />
            <div className="h-4 w-16 rounded bg-muted/60" />
            <div className="h-4 w-16 rounded bg-muted/60" />
          </div>
        </div>
      </footer>
    </div>
  );
}
