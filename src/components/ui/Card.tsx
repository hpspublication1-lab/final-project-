'use client';

import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'interactive' | 'outline' | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  className = '',
  ...props
}) => {
  const variantStyles = {
    default: 'bg-card border border-border/80 shadow-xs',
    elevated: 'bg-card border border-border/70 shadow-md',
    interactive:
      'bg-card border border-border/80 shadow-xs hover:shadow-card-hover hover:border-primary/40 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer',
    outline: 'bg-transparent border border-border',
    glass: 'bg-card/85 backdrop-blur-xl border border-border/60 shadow-xs',
  };

  const paddingStyles = {
    none: 'p-0',
    sm: 'p-3 sm:p-4',
    md: 'p-5 sm:p-6',
    lg: 'p-6 sm:p-8',
  };

  return (
    <div
      className={`rounded-2xl text-card-foreground overflow-hidden ${variantStyles[variant]} ${paddingStyles[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
