'use client';

import React from 'react';

export interface SamyakBadgeProps {
  children: React.ReactNode;
  variant?: 'see' | 'cee' | 'primary' | 'success' | 'warning' | 'neutral';
  size?: 'sm' | 'md';
  className?: string;
}

export default function SamyakBadge({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
}: SamyakBadgeProps) {
  const variantStyles = {
    see: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    cee: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
    primary: 'bg-primary/10 text-primary border-primary/20',
    success: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    neutral: 'bg-muted text-muted-foreground border-border/60',
  };

  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 font-bold uppercase tracking-wider rounded-lg border ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {children}
    </span>
  );
}
