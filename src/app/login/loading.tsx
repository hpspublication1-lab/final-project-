import React from 'react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-background text-foreground animate-pulse flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Bar Header */}
        <div className="flex items-center justify-between">
          <div className="w-10 h-10 rounded-xl border border-border bg-card" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/25" />
            <div className="h-5 w-28 rounded-lg bg-muted" />
          </div>
          <div className="w-10" />
        </div>

        {/* Auth Form Card */}
        <div className="bg-card border border-border/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          {/* Header Texts */}
          <div className="space-y-2">
            <div className="h-3.5 w-32 rounded-full bg-primary/20" />
            <div className="h-7 w-48 rounded-xl bg-muted" />
            <div className="h-3.5 w-64 rounded bg-muted/60" />
          </div>

          {/* Social / Google Button Placeholder */}
          <div className="h-12 w-full rounded-2xl border border-border/80 bg-muted/40 flex items-center justify-center gap-3">
            <div className="w-5 h-5 rounded-full bg-muted" />
            <div className="h-4 w-36 rounded bg-muted/70" />
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="h-px bg-border/80 flex-1" />
            <div className="h-3 w-16 rounded bg-muted/60" />
            <div className="h-px bg-border/80 flex-1" />
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <div className="h-3.5 w-20 rounded bg-muted" />
              <div className="h-12 w-full rounded-2xl border border-border/80 bg-muted/30" />
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <div className="h-3.5 w-16 rounded bg-muted" />
                <div className="h-3 w-24 rounded bg-muted/60" />
              </div>
              <div className="h-12 w-full rounded-2xl border border-border/80 bg-muted/30" />
            </div>
          </div>

          {/* Primary Submit CTA */}
          <div className="h-12 w-full rounded-2xl bg-primary/30" />

          {/* Footer Subtext */}
          <div className="pt-2 border-t border-border/60 text-center space-y-2">
            <div className="h-3 w-48 rounded bg-muted/60 mx-auto" />
            <div className="h-3 w-36 rounded bg-muted/50 mx-auto" />
          </div>
        </div>
      </div>
    </div>
  );
}
