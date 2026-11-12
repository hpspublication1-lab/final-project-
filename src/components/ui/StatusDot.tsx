'use client';

import React from 'react';

export interface StatusDotProps {
  status?: 'online' | 'live' | 'idle' | 'offline' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  ping?: boolean;
  className?: string;
  label?: string;
}

export const StatusDot: React.FC<StatusDotProps> = ({
  status = 'online',
  size = 'md',
  ping = true,
  className = '',
  label,
}) => {
  const sizeMap = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
  };

  const colorMap = {
    online: 'bg-emerald-500',
    live: 'bg-red-500',
    idle: 'bg-amber-500',
    warning: 'bg-amber-500',
    offline: 'bg-muted-foreground',
    error: 'bg-rose-500',
  };

  const dotClass = `${sizeMap[size]} rounded-full ${colorMap[status]}`;

  return (
    <span className={`inline-flex items-center gap-1.5 leading-none ${className}`}>
      <span className="relative flex shrink-0">
        {ping && status !== 'offline' && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${colorMap[status]}`}
          />
        )}
        <span className={`relative inline-flex ${dotClass}`} />
      </span>
      {label && (
        <span className="text-[11px] font-medium text-muted-foreground select-none">
          {label}
        </span>
      )}
    </span>
  );
};

export default StatusDot;
