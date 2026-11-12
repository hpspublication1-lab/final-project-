'use client';

import React from 'react';
import Link from 'next/link';
import { LucideIcon, ArrowRight } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  secondaryActionHref?: string;
  onSecondaryAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  secondaryActionLabel,
  secondaryActionHref,
  onSecondaryAction,
  className = '',
}) => {
  return (
    <div
      className={`p-8 sm:p-12 text-center bg-card border border-border/80 rounded-2xl sm:rounded-3xl flex flex-col items-center justify-center space-y-3.5 shadow-xs ${className}`}
    >
      <div className="w-12 h-12 rounded-2xl bg-muted/60 text-muted-foreground flex items-center justify-center border border-border/60">
        <Icon size={24} />
      </div>

      <div className="space-y-1 max-w-sm">
        <h4 className="text-sm sm:text-base font-bold text-foreground">
          {title}
        </h4>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>

      {(actionLabel || secondaryActionLabel) && (
        <div className="flex items-center gap-2.5 pt-2 flex-wrap justify-center">
          {actionLabel && (
            actionHref ? (
              <Link href={actionHref}>
                <Button size="sm" variant="primary">
                  <span>{actionLabel}</span>
                  <ArrowRight size={13} />
                </Button>
              </Link>
            ) : (
              <Button size="sm" variant="primary" onClick={onAction}>
                <span>{actionLabel}</span>
                <ArrowRight size={13} />
              </Button>
            )
          )}

          {secondaryActionLabel && (
            secondaryActionHref ? (
              <Link href={secondaryActionHref}>
                <Button size="sm" variant="outline">
                  <span>{secondaryActionLabel}</span>
                </Button>
              </Link>
            ) : (
              <Button size="sm" variant="outline" onClick={onSecondaryAction}>
                <span>{secondaryActionLabel}</span>
              </Button>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
