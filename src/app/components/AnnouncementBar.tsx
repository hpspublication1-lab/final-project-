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
    <div className="bg-primary text-primary-foreground relative z-50">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 h-10 flex items-center justify-center gap-3">
        <span className="flex items-center gap-1.5 text-xs sm:text-sm font-medium">
          <Smartphone size={14} className="animate-pulse shrink-0 text-amber-300" />
          <span className="hidden sm:inline">Soumya Guru App:</span>
          <span>Live classes &amp; video lectures are available in the Soumya Guru App</span>
          <Link
            href="/app-feature"
            className="ml-2 bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-2.5 py-0.5 rounded-full transition-colors whitespace-nowrap"
          >
            Get App →
          </Link>
        </span>
        <button
          onClick={dismiss}
          className="absolute right-3 p-1 rounded hover:bg-white/20 transition-colors"
          aria-label="Dismiss"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}