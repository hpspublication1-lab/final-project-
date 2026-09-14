'use client';

import React from 'react';

export interface SamyakCardProps {
  children: React.ReactNode;
  variant?: 'default' | 'see' | 'cee' | 'elevated';
  className?: string;
  onClick?: () => void;
}

export default function SamyakCard({
  children,
  variant = 'default',
  className = '',
  onClick,
}: SamyakCardProps) {
  const variantStyles = {
    default: 'bg-card border-border/80 hover:border-primary/40',
    see: 'bg-card border-emerald-500/30 hover:border-emerald-500/60',
    cee: 'bg-card border-indigo-500/30 hover:border-indigo-500/60',
    elevated: 'bg-card/95 backdrop-blur-xl border-border/80 shadow-lg',
  };

  return (
    <div
      onClick={onClick}
      className={`rounded-3xl border p-6 transition-all ${variantStyles[variant]} ${onClick ? 'cursor-pointer hover:shadow-md' : ''} ${className}`}
    >
      {children}
    </div>
  );
}
