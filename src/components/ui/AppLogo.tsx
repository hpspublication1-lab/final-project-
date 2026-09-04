'use client';

import React, { memo, useMemo } from 'react';
import AppIcon from './AppIcon';
import AppImage from './AppImage';

interface AppLogoProps {
  src?: string; // Image source (optional)
  iconName?: string; // Icon name when no image
  size?: number; // Size for icon/image
  className?: string; // Additional classes
  onClick?: () => void; // Click handler
  showText?: boolean; // Whether to display 'SAMYAK TUTOR' text alongside
}

const AppLogo = memo(function AppLogo({
  src = '/assets/images/app_logo.png',
  iconName = 'SparklesIcon',
  size = 40,
  className = '',
  onClick,
  showText = false,
}: AppLogoProps) {
  // Memoize className calculation
  const containerClassName = useMemo(() => {
    const classes = ['flex items-center gap-2.5'];
    if (onClick) classes.push('cursor-pointer hover:opacity-80 transition-opacity');
    if (className) classes.push(className);
    return classes.join(' ');
  }, [onClick, className]);

  return (
    <div className={containerClassName} onClick={onClick}>
      {/* Show image if src provided, otherwise show icon */}
      {src ? (
        <AppImage
          src={src}
          alt="Samyak Tutor Logo" 
          width={size}
          height={size}
          className="flex-shrink-0 object-contain rounded-xl"
          priority={true}
          unoptimized={src.endsWith('.svg')}
        />
      ) : (
        <AppIcon name={iconName} size={size} className="flex-shrink-0" />
      )}
      {showText && (
        <div className="flex flex-col leading-none">
          <span className="text-base sm:text-lg font-black tracking-tight text-foreground">
            SAMYAK <span className="text-primary font-black">TUTOR</span>
          </span>
          <span className="text-[9px] uppercase tracking-widest font-semibold text-muted-foreground">
            EDUCATION PLATFORM
          </span>
        </div>
      )}
    </div>
  );
});

export default AppLogo;
