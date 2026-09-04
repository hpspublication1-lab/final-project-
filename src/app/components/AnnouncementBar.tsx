'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { X, Smartphone } from 'lucide-react';

export default function AnnouncementBar({ onDismiss }: { onDismiss?: () => void }) {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;

  const dismiss = () => {
    setVisible(false);
    onDismiss?.();
  };

  return (
    <div className="bg-slate-900 text-white relative z-50 border-b border-white/10">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 h-10 flex items-center justify-center gap-3">
        <div className="flex items-center justify-center gap-2 font-bold text-[11px] sm:text-xs">
          <Smartphone size={14} className="animate-pulse shrink-0 text-amber-400" />
          <span className="hidden sm:inline">Unified Ecosystem:</span>
          <span>Start lessons on Web, continue on Mobile with 100% instant account sync.</span>
          <Link
            href="/app-feature"
            className="ml-2 bg-primary hover:bg-primary/90 text-white text-xs font-bold px-3 py-1 rounded-full transition-colors whitespace-nowrap inline-flex items-center shadow-xs"
          >
            Learn More →
          </Link>
        </div>
        <button
          onClick={dismiss}
          className="absolute right-3 p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg hover:bg-white/20 text-white transition-colors"
          aria-label="Dismiss announcement bar"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}