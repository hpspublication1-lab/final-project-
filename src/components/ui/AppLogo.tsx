'use client';

import React, { memo, useMemo, useState } from 'react';
import Image from 'next/image';
import AppIcon from './AppIcon';

interface AppLogoProps {
  src?: string; // Image source (optional)
  iconName?: string; // Icon name when no image
  size?: number; // Size for icon/image
  className?: string; // Additional classes
  onClick?: () => void; // Click handler
  showText?: boolean; // Whether to display 'SAMYAK TUTOR' text alongside
  onDark?: boolean; // Fallback mark sits on a dark or brand-coloured background
}

const AppLogo = memo(function AppLogo({
  src = '/assets/images/app_logo.png',
  iconName = 'SparklesIcon',
  size = 40,
  className = '',
  onClick,
  showText = false,
  onDark = false,
}: AppLogoProps) {
  const [imageFailed, setImageFailed] = useState(false);

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
      {src && !imageFailed ? (
        <Image
          src={src}
          alt="Samyak Guru"
          width={size}
          height={size}
          className="flex-shrink-0 object-contain rounded-xl"
          priority
          unoptimized={src.endsWith('.svg')}
          onError={() => setImageFailed(true)}
        />
      ) : src ? (
        // The logo file is missing or failed to load: show a clean monogram
        // instead of the browser's broken-image icon and squashed alt text.
        <span
          aria-label="Samyak Guru"
          role="img"
          style={{ width: size, height: size, fontSize: Math.round(size * 0.5) }}
          className={`flex-shrink-0 inline-flex items-center justify-center rounded-xl font-extrabold leading-none select-none ${
            onDark ? 'bg-white text-[#3B2DB8]' : 'bg-primary text-primary-foreground'
          }`}
        >
          S
        </span>
      ) : (
        <AppIcon name={iconName} size={size} className="flex-shrink-0" />
      )}
      {showText && (
        <div className="flex flex-col leading-none">
          <span className="text-base sm:text-lg font-black tracking-tight text-foreground">
            SAMYAK <span className="text-primary font-black">CEE</span>
          </span>
          <span className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground">
            MEDICAL &amp; ENTRANCE ENGINE
          </span>
        </div>
      )}
    </div>
  );
});

export default AppLogo;
