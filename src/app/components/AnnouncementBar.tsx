'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { X, Sparkles, ArrowRight } from 'lucide-react';

export default function AnnouncementBar({ onDismiss }: { onDismiss?: () => void }) {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;

  const dismiss = () => {
    setVisible(false);
    onDismiss?.();
  };

  return (
    <div className="bg-slate-950 text-slate-200 relative z-50 border-b border-slate-800/80 text-xs">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 min-h-[38px] py-1.5 pr-10 sm:pr-8 flex items-center justify-center">
        <div className="flex items-center gap-2 font-medium text-[11px] sm:text-xs">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/20 text-primary-light font-semibold text-[10px] tracking-wide uppercase border border-primary/30">
            <Sparkles size={11} className="text-primary-light" />
            <span>2026 Session</span>
          </span>
          <span className="text-slate-300 hidden sm:inline">
            Official CEE &amp; SEE Academic Portals Open · Full-Length 200Q Timed CBT with -0.25 Marking
          </span>
          <span className="text-slate-300 sm:hidden truncate max-w-[220px]">
            CEE 200Q Timed CBT with -0.25 Marking
          </span>
          <Link
            href="/mock-tests"
            className="text-white hover:text-primary-light font-semibold inline-flex items-center gap-1 transition-colors underline-offset-4 hover:underline ml-1"
          >
            <span>Launch Mock Exam</span>
            <ArrowRight size={12} />
          </Link>
        </div>
        <button
          onClick={dismiss}
          className="absolute right-2 sm:right-4 p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          aria-label="Dismiss announcement bar"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}