'use client';

import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface Tilt3DCardProps {
  children: React.ReactNode;
  className?: string;
  maxRotation?: number; // degrees, default 10
  glowColor?: string; // e.g. "rgba(82, 67, 224, 0.15)"
}

/**
 * 3D Tilt Card with Framer Motion physics, dynamic lighting reflection, and perspective depth.
 */
export default function Tilt3DCard({
  children,
  className = '',
  maxRotation = 10,
  glowColor = 'rgba(82, 67, 224, 0.15)',
}: Tilt3DCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 280, damping: 22 });
  const mouseYSpring = useSpring(y, { stiffness: 280, damping: 22 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], [`${maxRotation}deg`, `-${maxRotation}deg`]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], [`-${maxRotation}deg`, `${maxRotation}deg`]);

  // Specular light reflection gradient
  const [lightPos, setLightPos] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    x.set(mouseX / rect.width - 0.5);
    y.set(mouseY / rect.height - 0.5);

    setLightPos({
      x: Math.round((mouseX / rect.width) * 100),
      y: Math.round((mouseY / rect.height) * 100),
    });
  };

  const handleMouseEnter = () => setIsHovered(true);

  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
    setLightPos({ x: 50, y: 50 });
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
      }}
      className={`relative will-change-transform transition-shadow duration-300 ${
        isHovered ? 'shadow-2xl' : 'shadow-md'
      } ${className}`}
    >
      {/* Dynamic Specular Glare Overlay */}
      {isHovered && (
        <div
          className="pointer-events-none absolute inset-0 z-10 rounded-[inherit] transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle at ${lightPos.x}% ${lightPos.y}%, ${glowColor} 0%, transparent 70%)`,
          }}
        />
      )}

      {/* 3D Depth Layer */}
      <div style={{ transform: 'translateZ(18px)' }}>
        {children}
      </div>
    </motion.div>
  );
}
