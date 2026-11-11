'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface DynamicDrmWatermarkProps {
  customText?: string;
  className?: string;
}

export default function DynamicDrmWatermark({
  customText,
  className = '',
}: DynamicDrmWatermarkProps) {
  const [identityText, setIdentityText] = useState<string>('SAMYAK-CEE • PROTECTED');
  const [timestamp, setTimestamp] = useState<string>('');
  const [position, setPosition] = useState<{ top: string; left: string; opacity: number }>({
    top: '15%',
    left: '20%',
    opacity: 0.22,
  });

  // 1. Fetch user identity for watermark
  useEffect(() => {
    let isMounted = true;
    async function loadIdentity() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!isMounted) return;

        if (user) {
          const phone = user.user_metadata?.phone || user.phone;
          const email = user.email;
          const shortId = user.id.slice(0, 8);

          if (phone) {
            // Obfuscate phone: e.g. +977-9841***99
            const cleanPhone = phone.replace(/\s+/g, '');
            const visibleStart = cleanPhone.slice(0, 7);
            const visibleEnd = cleanPhone.slice(-2);
            setIdentityText(`SAMYAK-CEE • ${visibleStart}***${visibleEnd} • ${shortId}`);
          } else if (email) {
            // Obfuscate email: e.g. sam***@gmail.com
            const [name, domain] = email.split('@');
            const masked = (name && name.length > 2) ? `${name.slice(0, 3)}***@${domain}` : email;
            setIdentityText(`SAMYAK-CEE • ${masked} • ${shortId}`);
          } else {
            setIdentityText(`SAMYAK-CEE • UID:${shortId}`);
          }
        } else if (customText) {
          setIdentityText(customText);
        } else {
          setIdentityText('SAMYAK EDUCATION • WATERMARKED STREAM');
        }
      } catch {
        if (isMounted) setIdentityText('SAMYAK-CEE • PROTECTED STREAM');
      }
    }

    loadIdentity();
    return () => {
      isMounted = false;
    };
  }, [customText]);

  // 2. Real-time live timestamp clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimestamp(
        now.toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // 3. Dynamic position drifting to neutralize screen recorders & OCR/blur strippers
  useEffect(() => {
    const moveWatermark = () => {
      // Pick random coordinates within safe boundaries (10% to 75%)
      const randomTop = Math.floor(10 + Math.random() * 65);
      const randomLeft = Math.floor(10 + Math.random() * 65);
      // Subtle opacity shifts (0.16 to 0.28)
      const randomOpacity = parseFloat((0.16 + Math.random() * 0.12).toFixed(2));

      setPosition({
        top: `${randomTop}%`,
        left: `${randomLeft}%`,
        opacity: randomOpacity,
      });
    };

    // Move every 12 seconds
    const driftInterval = setInterval(moveWatermark, 12000);
    return () => clearInterval(driftInterval);
  }, []);

  return (
    <div
      className={`absolute z-25 pointer-events-none select-none transition-all duration-1000 ease-in-out ${className}`}
      style={{
        top: position.top,
        left: position.left,
        opacity: position.opacity,
      }}
      aria-hidden="true"
    >
      <div className="flex flex-col items-center justify-center p-1.5 rounded-lg bg-black/25 backdrop-blur-[1px] border border-white/10 shadow-xs">
        <span className="font-mono text-[10px] sm:text-xs font-bold tracking-widest text-white/90 drop-shadow-md whitespace-nowrap">
          {identityText}
        </span>
        <span className="font-mono text-[9px] sm:text-[10px] tracking-wider text-white/70 drop-shadow-xs">
          REC-BAN: {timestamp}
        </span>
      </div>
    </div>
  );
}
