'use client';

import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';

export default function DashboardSkeleton() {
  return (
    <DashboardLayout>
      <div className="space-y-6 animate-pulse">
        {/* Top Hero Banner Skeleton */}
        <div className="bg-card border border-border/80 rounded-2xl sm:rounded-3xl p-5 sm:p-6 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-2.5 max-w-xl">
              <div className="flex items-center gap-2">
                <div className="h-5 w-24 bg-muted rounded-full" />
                <div className="h-5 w-20 bg-muted rounded-full" />
              </div>
              <div className="h-8 w-72 sm:w-96 bg-muted rounded-xl" />
              <div className="h-4 w-60 sm:w-80 bg-muted/70 rounded-md" />
            </div>
            <div className="flex gap-2">
              <div className="h-9 w-28 bg-muted rounded-xl" />
              <div className="h-9 w-24 bg-muted rounded-xl" />
            </div>
          </div>

          <div className="pt-2 border-t border-border/60 space-y-2">
            <div className="flex justify-between">
              <div className="h-3 w-32 bg-muted rounded" />
              <div className="h-3 w-16 bg-muted rounded" />
            </div>
            <div className="h-2.5 w-full bg-muted rounded-full" />
          </div>

          <div className="h-14 w-full bg-muted/40 rounded-xl" />
        </div>

        {/* Tab Pills Bar Skeleton */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-border/70">
          <div className="h-9 w-32 bg-primary/20 rounded-xl" />
          <div className="h-9 w-32 bg-muted rounded-xl" />
          <div className="h-9 w-28 bg-muted rounded-xl" />
          <div className="h-9 w-32 bg-muted rounded-xl" />
          <div className="h-9 w-40 bg-muted rounded-xl" />
          <div className="h-9 w-28 bg-muted rounded-xl" />
        </div>

        {/* Schedule & Tasks Cards Skeleton */}
        <div className="bg-card border border-border/80 rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-muted" />
              <div className="space-y-1">
                <div className="h-4 w-40 bg-muted rounded" />
                <div className="h-3 w-56 bg-muted/70 rounded" />
              </div>
            </div>
            <div className="h-4 w-24 bg-muted rounded" />
          </div>

          <div className="grid sm:grid-cols-3 gap-3.5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-3 h-32 flex flex-col justify-between"
              >
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-md bg-muted shrink-0" />
                  <div className="space-y-1.5 w-full">
                    <div className="h-3 w-16 bg-muted rounded" />
                    <div className="h-4 w-full bg-muted rounded" />
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-border/40">
                  <div className="h-3 w-16 bg-muted rounded" />
                  <div className="h-3 w-12 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 6-Pillar Grid Skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-card border border-border/80 rounded-2xl p-3.5 space-y-3 h-24 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-muted" />
                <div className="h-3 w-8 bg-muted rounded" />
              </div>
              <div className="space-y-1">
                <div className="h-3.5 w-16 bg-muted rounded" />
                <div className="h-2.5 w-20 bg-muted/60 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
