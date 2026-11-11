'use client';

import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'accent';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      iconPosition = 'left',
      fullWidth = false,
      disabled,
      className = '',
      ...props
    },
    ref
  ) => {
    // Base styles: 44px min tap target on mobile, smooth transitions, focus-visible ring
    const baseStyles =
      'relative inline-flex items-center justify-center font-bold tracking-tight rounded-xl transition-all duration-150 select-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2';

    // Variant styles
    const variantStyles = {
      primary:
        'bg-primary text-white hover:bg-primary-dark active:bg-primary-dark/90 shadow-sm hover:shadow-primary/20',
      secondary:
        'bg-secondary text-primary hover:bg-secondary/80 active:bg-secondary/90 dark:bg-primary/10 dark:text-primary dark:hover:bg-primary/20',
      outline:
        'bg-transparent border border-border text-foreground hover:bg-muted/80 active:bg-muted',
      ghost:
        'bg-transparent text-foreground hover:bg-muted/70 active:bg-muted',
      danger:
        'bg-error text-white hover:bg-red-600 active:bg-red-700 shadow-sm',
      accent:
        'bg-accent text-white hover:bg-accent/90 active:bg-accent/95 shadow-sm',
    };

    // Size styles
    const sizeStyles = {
      sm: 'text-xs px-3 py-1.5 h-8 min-h-[32px] gap-1.5',
      md: 'text-sm px-4 py-2.5 h-11 min-h-[44px] gap-2',
      lg: 'text-base px-6 py-3 h-12 min-h-[48px] gap-2.5',
      icon: 'w-11 h-11 min-w-[44px] min-h-[44px] p-2.5 justify-center',
    };

    const widthStyles = fullWidth ? 'w-full' : '';

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyles} ${className}`}
        {...props}
      >
        {loading ? (
          <Loader2 className="animate-spin shrink-0" size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} />
        ) : (
          <>
            {icon && iconPosition === 'left' && <span className="shrink-0">{icon}</span>}
            {children && <span>{children}</span>}
            {icon && iconPosition === 'right' && <span className="shrink-0">{icon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
