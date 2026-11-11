/**
 * Samyak Motion Design System — Framer Motion Presets
 * Consistent, hardware-accelerated motion tokens adhering to WCAG 2.2 AA reduced-motion.
 */

import type { Variants, Transition } from 'framer-motion';

// ── 1. Standard Transitions ──────────────────────────────────────────────────
export const TRANSITIONS = {
  instant: { duration: 0.08, ease: 'easeOut' } as Transition,
  fast: { duration: 0.15, ease: [0.16, 1, 0.3, 1] } as Transition,
  normal: { duration: 0.22, ease: [0.2, 0, 0, 1] } as Transition,
  smooth: { duration: 0.32, ease: [0.16, 1, 0.3, 1] } as Transition,
  spring: { type: 'spring', stiffness: 380, damping: 28 } as Transition,
  bouncySpring: { type: 'spring', stiffness: 480, damping: 18 } as Transition,
};

// ── 2. Modal & Dialog Transitions ────────────────────────────────────────────
export const modalVariants: Variants = {
  initial: { opacity: 0, scale: 0.95, y: 8 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: TRANSITIONS.normal,
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    y: 4,
    transition: TRANSITIONS.fast,
  },
};

export const modalBackdropVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: TRANSITIONS.fast },
  exit: { opacity: 0, transition: TRANSITIONS.fast },
};

// ── 3. Drawer & Slide-Out Transitions ────────────────────────────────────────
export const drawerVariants: Variants = {
  initial: { x: '-100%' },
  animate: {
    x: 0,
    transition: { type: 'spring', stiffness: 350, damping: 32 },
  },
  exit: {
    x: '-100%',
    transition: { duration: 0.2, ease: 'easeInOut' },
  },
};

export const bottomSheetVariants: Variants = {
  initial: { y: '100%' },
  animate: {
    y: 0,
    transition: { type: 'spring', stiffness: 360, damping: 30 },
  },
  exit: {
    y: '100%',
    transition: { duration: 0.22, ease: 'easeIn' },
  },
};

// ── 4. Card & Item Microinteractions ─────────────────────────────────────────
export const cardHoverVariants: Variants = {
  initial: { y: 0, scale: 1 },
  hover: {
    y: -3,
    transition: TRANSITIONS.fast,
  },
  tap: {
    scale: 0.98,
    transition: TRANSITIONS.instant,
  },
};

export const fadeScaleVariants: Variants = {
  initial: { opacity: 0, scale: 0.92 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: TRANSITIONS.fast,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: TRANSITIONS.instant,
  },
};

// ── 5. Assessment & CBT Transitions ──────────────────────────────────────────
// CBT questions transition swiftly without distracting motion or timer interference
export const cbtQuestionVariants: Variants = {
  initial: { opacity: 0, x: 8 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.12, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    x: -8,
    transition: { duration: 0.08, ease: 'easeIn' },
  },
};

// ── 6. Battle Arena PvP Animations ───────────────────────────────────────────
export const countdownVariants: Variants = {
  initial: { scale: 0.5, opacity: 0 },
  animate: {
    scale: [0.5, 1.2, 1],
    opacity: 1,
    transition: { duration: 0.6, ease: 'easeInOut' },
  },
  exit: {
    scale: 1.4,
    opacity: 0,
    transition: { duration: 0.2 },
  },
};

export const scorePulseVariants: Variants = {
  initial: { scale: 1 },
  pulse: {
    scale: [1, 1.15, 1],
    transition: { duration: 0.3, ease: 'easeOut' },
  },
};
