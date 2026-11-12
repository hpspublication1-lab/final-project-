'use client';

import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

export interface MetricCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  delta?: string | number;
  deltaLabel?: string;
  deltaType?: 'positive' | 'negative' | 'neutral';
  icon?: React.ReactNode;
  iconBg?: string;
  targetProgress?: number;
  targetLabel?: string;
  footer?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subValue,
  delta,
  deltaLabel = 'vs last period',
  deltaType = 'positive',
  icon,
  iconBg = 'bg-primary/10 text-primary border-primary/20',
  targetProgress,
  targetLabel,
  footer,
  className = '',
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`group relative bg-card border border-border/80 hover:border-primary/50 rounded-2xl p-5 shadow-xs transition-all hover:shadow-md flex flex-col justify-between ${
        onClick ? 'cursor-pointer active:scale-[0.99]' : ''
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
            {title}
          </span>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-3xl font-black font-mono tracking-tight text-foreground tabular-nums">
              {value}
            </span>
            {subValue && (
              <span className="text-xs font-mono font-medium text-muted-foreground">
                {subValue}
              </span>
            )}
          </div>
        </div>

        {icon && (
          <div
            className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform ${iconBg}`}
          >
            {icon}
          </div>
        )}
      </div>

      {(delta !== undefined || targetProgress !== undefined || footer) && (
        <div className="pt-3.5 border-t border-border/60 mt-3.5 space-y-2">
          {delta !== undefined && (
            <div className="flex items-center justify-between text-xs">
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-bold font-mono px-2 py-0.5 rounded-md border ${
                  deltaType === 'positive'
                    ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border-emerald-500/20'
                    : deltaType === 'negative'
                    ? 'text-rose-700 dark:text-rose-300 bg-rose-500/10 border-rose-500/20'
                    : 'text-muted-foreground bg-muted border-border'
                }`}
              >
                {deltaType === 'positive' ? (
                  <ArrowUpRight size={13} />
                ) : deltaType === 'negative' ? (
                  <ArrowDownRight size={13} />
                ) : (
                  <Minus size={13} />
                )}
                <span>{delta}</span>
              </span>
              <span className="text-[11px] text-muted-foreground">{deltaLabel}</span>
            </div>
          )}

          {targetProgress !== undefined && (
            <div className="space-y-1">
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(100, Math.max(0, targetProgress))}%` }}
                />
              </div>
              {targetLabel && (
                <p className="text-[10px] text-muted-foreground flex justify-between">
                  <span>{targetLabel}</span>
                  <span className="font-mono">{Math.round(targetProgress)}%</span>
                </p>
              )}
            </div>
          )}

          {footer && <div className="pt-1">{footer}</div>}
        </div>
      )}
    </div>
  );
};

export default MetricCard;
