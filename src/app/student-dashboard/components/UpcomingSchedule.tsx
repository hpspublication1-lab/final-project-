'use client';

import React from 'react';
import Link from 'next/link';
import { Radio, Download, ArrowRight, Smartphone } from 'lucide-react';

export default function UpcomingSchedule() {
  return (
    <div className="card-luxury p-5 sm:p-6 shadow-luxury h-full flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-extrabold text-foreground">Interactive Live Classes</p>
          <p className="text-xs text-muted-foreground mt-0.5 font-medium">Samyak Guru Mobile App</p>
        </div>
        <Link href="/app-feature?feature=live-classes" className="text-xs text-primary font-bold hover:underline flex items-center gap-0.5">
          Open App <ArrowRight size={11} />
        </Link>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center p-5 bg-muted/30 rounded-2xl border border-border/80 my-2">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3 border border-primary/20 shadow-xs">
          <Smartphone size={22} className="text-primary" />
        </div>
        <h4 className="text-sm font-extrabold text-foreground mb-1">
          Stream Live on Samyak Guru App
        </h4>
        <p className="text-xs text-muted-foreground mb-4 max-w-xs leading-relaxed font-medium">
          Interactive HD live classes, real-time polling, Q&amp;A, and mentor chat on Android &amp; iOS.
        </p>

        <Link
          href="/app-feature?feature=live-classes"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-dark text-white text-xs font-extrabold rounded-xl shadow-md shadow-primary/25 transition-all active:scale-95"
        >
          <Download size={13} /> Get Samyak Guru App
        </Link>
      </div>
    </div>
  );
}
