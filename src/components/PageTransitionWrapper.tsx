'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { pageVariants, reducedPageVariants } from '@/lib/animations/pageTransitions';

interface PageTransitionWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export default function PageTransitionWrapper({ children, className }: PageTransitionWrapperProps) {
  const shouldReduceMotion = useReducedMotion();
  const variants = shouldReduceMotion ? reducedPageVariants : pageVariants;

  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={className}
      style={{ willChange: 'opacity, transform' }}
      suppressHydrationWarning
    >
      {children}
    </motion.div>
  );
}
