import React from 'react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-background text-foreground animate-pulse flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl space-y-6">
        {/* Back Link Placeholder */}
        <div className="h-4 w-28 rounded-lg bg-muted" />

        {/* 2-Column Checkout Form Skeleton */}
        <div className="grid md:grid-cols-12 gap-6 items-start">
          {/* Left: Order Summary & Trust Badges (5 cols) */}
          <div className="md:col-span-5 bg-card border border-border/80 rounded-3xl p-6 space-y-5 shadow-sm">
            <div className="border-b border-border/60 pb-3 space-y-1.5">
              <div className="h-3 w-24 rounded bg-muted/60" />
              <div className="h-5 w-40 rounded-lg bg-muted" />
              <div className="h-3 w-48 rounded bg-muted/60" />
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center py-1">
                <div className="h-3.5 w-24 rounded bg-muted/60" />
                <div className="h-3.5 w-16 rounded bg-muted" />
              </div>
              <div className="flex justify-between items-center py-1">
                <div className="h-3.5 w-24 rounded bg-muted/60" />
                <div className="h-3.5 w-20 rounded bg-emerald-500/20" />
              </div>
              <div className="flex justify-between items-center py-1">
                <div className="h-3.5 w-24 rounded bg-muted/60" />
                <div className="h-3.5 w-24 rounded bg-muted" />
              </div>

              <div className="pt-3 border-t border-border/60 flex justify-between items-center">
                <div className="h-4 w-20 rounded bg-muted" />
                <div className="h-6 w-24 rounded-lg bg-primary/25" />
              </div>
            </div>

            {/* Supported Payment Apps Banner */}
            <div className="bg-muted/40 border border-border/60 rounded-2xl p-3.5 space-y-2">
              <div className="h-3 w-36 rounded bg-muted" />
              <div className="flex flex-wrap gap-1.5">
                <div className="h-5 w-14 rounded-full bg-emerald-500/20" />
                <div className="h-5 w-14 rounded-full bg-purple-500/20" />
                <div className="h-5 w-14 rounded-full bg-red-500/20" />
                <div className="h-5 w-20 rounded-full bg-blue-500/20" />
              </div>
            </div>

            {/* Security Badges */}
            <div className="space-y-2 pt-1">
              <div className="h-3 w-48 rounded bg-muted/50" />
              <div className="h-3 w-44 rounded bg-muted/50" />
            </div>
          </div>

          {/* Right: Payment QR & Form (7 cols) */}
          <div className="md:col-span-7 bg-card border border-border/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
            {/* Header */}
            <div className="space-y-1.5 text-center">
              <div className="h-5 w-36 rounded-lg bg-muted mx-auto" />
              <div className="h-3.5 w-56 rounded bg-muted/60 mx-auto" />
            </div>

            {/* QR Code Placeholder Box */}
            <div className="w-48 h-48 sm:w-56 sm:h-56 mx-auto rounded-3xl border-2 border-dashed border-border/80 bg-muted/30 flex items-center justify-center p-6">
              <div className="w-full h-full rounded-2xl bg-muted/50 flex items-center justify-center">
                <div className="w-16 h-16 rounded-xl bg-primary/15" />
              </div>
            </div>

            {/* Timer Countdown Badge */}
            <div className="h-8 w-36 rounded-xl bg-muted/60 mx-auto" />

            {/* Action CTA Button */}
            <div className="space-y-3">
              <div className="h-12 w-full rounded-2xl bg-primary/30" />
              <div className="h-3 w-48 rounded bg-muted/50 mx-auto" />
            </div>

            {/* WhatsApp Counselor Hotline */}
            <div className="pt-3 border-t border-border/60 flex items-center justify-between">
              <div className="h-3.5 w-36 rounded bg-muted/60" />
              <div className="h-3.5 w-24 rounded bg-emerald-500/20" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
