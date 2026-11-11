'use client';

import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error' | 'outline' | 'neutral';
  size?: 'sm' | 'md';
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  dot = false,
  className = '',
  ...props
}) => {
  const variantStyles = {
    primary: 'bg-primary/10 text-primary border-primary/20',
    secondary: 'bg-secondary text-primary border-transparent dark:bg-primary/15 dark:text-primary',
    accent: 'bg-accent/10 text-accent border-accent/20',
    success: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400',
    warning: 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400',
    error: 'bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400',
    outline: 'bg-transparent text-foreground border-border',
    neutral: 'bg-muted text-muted-foreground border-border/60',
  };

  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5 font-bold tracking-wide',
    md: 'text-xs px-2.5 py-1 font-bold tracking-normal',
  };

  const dotColors = {
    primary: 'bg-primary',
    secondary: 'bg-primary',
    accent: 'bg-accent',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    error: 'bg-red-500',
    outline: 'bg-foreground',
    neutral: 'bg-muted-foreground',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border leading-none select-none font-sans uppercase ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors[variant]}`} />}
      {children}
    </span>
  );
};

export default Badge;
