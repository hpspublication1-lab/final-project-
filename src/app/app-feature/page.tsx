'use client';

import React, { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { Smartphone, Download, ArrowLeft, Video, Radio, Sparkles, CheckCircle2, ShieldCheck } from 'lucide-react';
import { SUPPORT_CONFIG } from '@/lib/config/support';

function AppFeatureContent() {
  const searchParams = useSearchParams();
  const router = Router();
  const feature = searchParams.get('feature') || 'general';

  const isLiveClasses = feature === 'live-classes';
  const isVideoLectures = feature === 'video-lectures';

  const title = isLiveClasses
    ? 'Live Classes are available in Samyak Guru App'
    : isVideoLectures
    ? 'Recorded Video Lectures are available in Samyak Guru App'
    : 'Available Exclusively on Samyak Guru App';

  const description = isLiveClasses
    ? 'Join interactive live streams, real-time Q&A sessions, and instructor chat directly on your mobile device.'
    : isVideoLectures
    ? 'Stream high-definition recorded video lectures, track your playback progress, and download study notes on the go.'
    : 'Experience low-latency streaming, offline downloads, push notifications, and exclusive mobile prep features.';

  const features = isLiveClasses
    ? [
        'Interactive live chat & instant Q&A with top faculties',
        'HD low-latency live streaming with auto-bitrate adaptation',
        'Class reminders & schedule push notifications',
        'Direct access to downloadable PDF lecture notes',
      ]
    : [
        '300+ HD video lectures covering full CEE syllabus',
        'Playback speed controls & auto-resume watching position',
        'Timestamped personal note taking during videos',
        'Offline viewing & bandwidth saving mode',
      ];

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-12 shadow-xl border border-slate-100 dark:border-slate-800 text-center relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Icon Badge */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-tr from-primary/10 to-secondary/10 text-primary mb-6 shadow-inner">
          {isLiveClasses ? (
            <Radio className="w-10 h-10 animate-pulse text-error" />
          ) : isVideoLectures ? (
            <Video className="w-10 h-10 text-physics" />
          ) : (
            <Smartphone className="w-10 h-10 text-primary" />
          )}
        </div>

        {/* Title & Description */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-4">
          <Sparkles className="w-3.5 h-3.5" /> Mobile Exclusive Feature
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight mb-4">
          {title}
        </h1>

        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 mb-8 max-w-xl mx-auto leading-relaxed">
          {description}
        </p>

        {/* Feature Highlights */}
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 text-left mb-8 border border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" /> Key Mobile App Features
          </h3>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {features.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* App Download CTA Card */}
        <div className="bg-gradient-to-r from-primary to-secondary text-white rounded-2xl p-6 mb-8 shadow-lg">
          <h3 className="text-xl font-bold mb-2">Get Samyak Guru App Now</h3>
          <p className="text-white/80 text-sm mb-6">
            Install the official application on your phone for full access to live classes, recorded lectures, and offline study materials.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={SUPPORT_CONFIG.whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-6 py-3.5 bg-white text-slate-900 hover:bg-slate-100 font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2.5 text-sm"
            >
              <Download className="w-4 h-4 text-primary" />
              Download APK / App Link
            </a>
            <a
              href={SUPPORT_CONFIG.whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2 text-sm border border-white/20"
            >
              Ask Support on WhatsApp
            </a>
          </div>
        </div>

        {/* Navigation Actions */}
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/student-dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

function Router() {
  const router = useRouter();
  return router;
}

export default function AppFeaturePage() {
  return (
    <DashboardLayout>
      <Suspense fallback={<div className="p-8 text-center">Loading feature details...</div>}>
        <AppFeatureContent />
      </Suspense>
    </DashboardLayout>
  );
}
