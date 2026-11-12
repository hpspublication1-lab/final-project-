import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import AiStudioClient from './components/AiStudioClient';

export const metadata: Metadata = {
  title: 'AI Learning Studio & Research Workstation — Samyak CEE',
  description:
    'Three-panel multi-modal research workstation for CEE Medical, IOE Engineering, and NEB. Grounded RAG synthesis, verified OCR excerpts, and synchronized audio deep-dive podcasts.',
  robots: { index: false, follow: false },
};

function AiStudioSkeleton() {
  return (
    <div className="min-h-screen bg-[#060913] text-slate-100 flex flex-col animate-pulse">
      {/* Top Bar Skeleton */}
      <div className="h-14 border-b border-white/5 bg-[#0A0D14]/80 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/5" />
          <div className="w-48 h-5 rounded bg-white/5" />
        </div>
        <div className="w-32 h-7 rounded-full bg-white/5" />
      </div>

      {/* Three Panel Skeleton Grid */}
      <div className="flex-1 grid grid-cols-12 gap-0 overflow-hidden">
        {/* Left Panel */}
        <div className="col-span-3 border-r border-white/5 p-4 space-y-4 hidden lg:block bg-[#0A0D14]/40">
          <div className="h-4 w-24 bg-white/5 rounded" />
          <div className="h-10 w-full bg-white/5 rounded-xl" />
          <div className="space-y-2 pt-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 w-full rounded-xl bg-white/5" />
            ))}
          </div>
        </div>

        {/* Center Panel */}
        <div className="col-span-12 lg:col-span-5 flex flex-col p-4 space-y-4">
          <div className="flex-1 space-y-4">
            <div className="h-24 w-3/4 bg-white/5 rounded-2xl ml-auto" />
            <div className="h-44 w-5/6 bg-white/5 rounded-2xl" />
            <div className="h-32 w-2/3 bg-white/5 rounded-2xl" />
          </div>
          <div className="h-14 w-full bg-white/5 rounded-2xl" />
        </div>

        {/* Right Panel */}
        <div className="col-span-4 border-l border-white/5 p-4 space-y-4 hidden lg:block bg-[#0A0D14]/40">
          <div className="h-8 w-48 bg-white/5 rounded-lg" />
          <div className="h-64 w-full bg-white/5 rounded-xl" />
          <div className="h-32 w-full bg-white/5 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export default function AiStudioPage() {
  return (
    <Suspense fallback={<AiStudioSkeleton />}>
      <AiStudioClient />
    </Suspense>
  );
}
