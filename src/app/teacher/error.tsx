'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, RotateCcw, ArrowLeft } from 'lucide-react';

export default function TeacherErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Teacher Panel Error Boundary caught exception:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card border border-border rounded-3xl p-6 sm:p-8 text-center shadow-xl">
        <div className="w-16 h-16 bg-error/10 text-error rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">Teacher Panel Error</h2>
        <p className="text-xs text-muted-foreground mb-6 font-mono break-all bg-muted/40 p-3 rounded-xl">
          {error?.message || 'An unexpected error occurred in the teacher portal.'}
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={() => reset()}
            className="w-full btn-primary text-xs py-2.5 flex items-center justify-center gap-2"
          >
            <RotateCcw size={14} /> Try Again
          </button>
          <Link
            href="/teacher"
            className="w-full btn-secondary text-xs py-2.5 flex items-center justify-center gap-2"
          >
            <ArrowLeft size={14} /> Back to Teacher Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
