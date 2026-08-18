'use client';

import React from 'react';
import Link from 'next/link';
import { Radio, Download, ArrowRight, Smartphone } from 'lucide-react';

export default function UpcomingSchedule() {
  return (
    <div className="card-base h-full flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="font-semibold text-foreground">Live Classes</p>
          <p className="text-xs text-muted-foreground mt-0.5">Samyak Guru App</p>
        </div>
        <Link href="/app-feature?feature=live-classes" className="text-xs text-primary font-medium hover:underline flex items-center gap-0.5">
          Open App <ArrowRight size={11} />
        </Link>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 my-2">
        <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
          <Smartphone size={24} className="text-primary" />
        </div>
        <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
          Stream Live on Samyak Guru App
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 max-w-xs leading-relaxed">
          Interactive HD live classes, Q&A, and teacher chat are hosted on our official mobile app.
        </p>

        <Link
          href="/app-feature?feature=live-classes"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-xs hover:bg-primary/90 transition-all"
        >
          <Download size={13} /> Get Samyak Guru App
        </Link>
      </div>
    </div>
  );
}
