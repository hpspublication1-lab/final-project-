'use client';

import React, { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { Smartphone, Download, ArrowLeft, Video, Radio, Sparkles, CheckCircle2, ShieldCheck, RefreshCw } from 'lucide-react';
import { SUPPORT_CONFIG } from '@/lib/config/support';

function AppFeatureContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const feature = searchParams.get('feature') || 'general';

  const isLiveClasses = feature === 'live-classes';
  const isVideoLectures = feature === 'video-lectures';

  const title = 'One Account. Seamless Web + Mobile Ecosystem.';

  const description = 'Start your lessons on Desktop Web, take interactive practice MCQs, and continue seamlessly on Mobile with instant account sync.';

  const features = [
    '100% instant account sync across Web & Mobile',
    'Start a video lecture or practice test on Web and resume on Mobile',
    'Interactive live chat & instant Q&A with top faculties',
    'Offline viewing mode & study notifications on Mobile',
  ];

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full bg-card rounded-3xl p-8 sm:p-12 shadow-xl border border-border text-center relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Icon Badge */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-amber-500/10 text-amber-600 mb-6 shadow-inner">
          <Smartphone className="w-10 h-10 animate-pulse text-amber-600" />
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-success/10 text-success text-xs font-black mb-4">
          <CheckCircle2 size={13} /> Unified Same-Account Architecture
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-black text-foreground mb-3 tracking-tight">
          {title}
        </h1>

        {/* Subtitle */}
        <p className="text-muted-foreground text-xs sm:text-sm max-w-lg mx-auto mb-8 leading-relaxed">
          {description}
        </p>

        {/* Features list */}
        <div className="bg-muted/40 rounded-2xl p-5 border border-border mb-8 text-left space-y-3">
          <p className="text-xs font-black text-foreground uppercase tracking-wider mb-2">
            Ecosystem Highlights:
          </p>
          {features.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2.5 text-xs text-foreground font-semibold">
              <CheckCircle2 size={15} className="text-success shrink-0" />
              <span>{item}</span>
            </div>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href={SUPPORT_CONFIG.appDownloadUrl || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-primary text-white font-extrabold text-xs shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all"
          >
            <Download size={16} />
            <span>Download Mobile App (Android / iOS)</span>
          </a>

          <button
            onClick={() => router.back()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-card border border-border text-foreground font-bold text-xs hover:bg-muted transition-all"
          >
            <ArrowLeft size={16} />
            <span>Return to Web Portal</span>
          </button>
        </div>

      </div>
    </div>
  );
}

export default function AppFeaturePage() {
  return (
    <DashboardLayout>
      <Suspense fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }>
        <AppFeatureContent />
      </Suspense>
    </DashboardLayout>
  );
}
