'use client';

import React from 'react';
import { Loader2, AlertCircle, Inbox, RefreshCw } from 'lucide-react';

export type StateViewStatus = 'loading' | 'empty' | 'error' | 'success';

export interface StateViewProps {
  status: StateViewStatus;
  loadingMessage?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  errorMessage?: string;
  onRetry?: () => void;
  children?: React.ReactNode;
  className?: string;
}

export default function StateView({
  status,
  loadingMessage = 'Loading educational content...',
  emptyTitle = 'No content found',
  emptyDescription = 'There are currently no items available in this section.',
  emptyAction,
  errorMessage = 'Failed to load content. Please try again.',
  onRetry,
  children,
  className = '',
}: StateViewProps) {
  if (status === 'loading') {
    return (
      <div className={`flex flex-col items-center justify-center p-12 text-center min-h-[220px] ${className}`}>
        <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
        <p className="text-xs sm:text-sm text-muted-foreground font-medium">{loadingMessage}</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className={`p-6 rounded-3xl bg-rose-500/5 border border-rose-500/20 text-center flex flex-col items-center justify-center min-h-[220px] ${className}`}>
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center mb-3">
          <AlertCircle size={24} />
        </div>
        <h4 className="text-sm font-bold text-foreground mb-1">Something went wrong</h4>
        <p className="text-xs text-muted-foreground max-w-sm mb-4 leading-relaxed">{errorMessage}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-card border border-border hover:bg-muted text-xs font-bold text-foreground transition-all shadow-xs"
          >
            <RefreshCw size={13} />
            <span>Try Again</span>
          </button>
        )}
      </div>
    );
  }

  if (status === 'empty') {
    return (
      <div className={`p-8 rounded-3xl bg-muted/20 border border-border/60 text-center flex flex-col items-center justify-center min-h-[220px] ${className}`}>
        <div className="w-12 h-12 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center mb-3">
          <Inbox size={24} />
        </div>
        <h4 className="text-sm font-bold text-foreground mb-1">{emptyTitle}</h4>
        <p className="text-xs text-muted-foreground max-w-sm mb-4 leading-relaxed">{emptyDescription}</p>
        {emptyAction}
      </div>
    );
  }

  return <>{children}</>;
}
