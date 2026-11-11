---
name: motion-animation-engineering
description: >-
  Advanced motion design, fluid interaction architecture, and 60fps animation
  engineering using Framer Motion, CSS transitions, and spring physics.
  Use when creating micro-interactions, choreographed page entrances, 3D card tilt,
  gesture-based drawer physics, animated numbers/counters, or accessible reduced-motion
  fallbacks across React and Next.js applications.
---

# Motion Animation Engineering: Fluid Interactions & Micro-Physics

This skill provides comprehensive instructions for designing and executing fluid, tactile animations that elevate digital platforms to the tier of Apple, Linear, and Stripe.

---

## 1. Physics-Based Spring Constants

Avoid linear or generic `ease-in-out` transitions for interactive elements. Always favor natural mass and damping:

| Interaction Type | Stiffness | Damping | Mass | Visual Feel |
| :--- | :--- | :--- | :--- | :--- |
| **Snappy Button / Tap** | `400` | `25` | `0.8` | Crisp, instant tactile response |
| **Modal / Dialog Entrance** | `300` | `28` | `1.0` | Natural momentum with zero jitter |
| **Drawer / Mobile Sheet** | `260` | `30` | `1.1` | Heavy, grounded slide |
| **Floating Hover Badge** | `180` | `12` | `0.6` | Playful, soft organic oscillation |

### Standard Framer Motion Presets
```typescript
import { Variants, Transition } from 'framer-motion';

export const springSnappy: Transition = {
  type: 'spring',
  stiffness: 400,
  damping: 25,
  mass: 0.8,
};

export const springSmooth: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 28,
  mass: 1.0,
};

export const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 12 },
  visible: { opacity: 1, scale: 1, y: 0, transition: springSmooth },
  exit: { opacity: 0, scale: 0.97, y: 8, transition: { duration: 0.16, ease: 'easeOut' } },
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.04,
    },
  },
};
```

---

## 2. Interactive 3D Card Tilt & Specular Reflection

For high-value cards (e.g. Course packages, Achievement badges, Rank cards), implement interactive 3D perspective mouse-tracking:

```typescript
'use client';

import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

export function Tilt3DCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 25 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 25 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['10deg', '-10deg']);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-10deg', '10deg']);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    x.set(mouseX / width - 0.5);
    y.set(mouseY / height - 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
      }}
      className={`relative will-change-transform ${className}`}
    >
      <div style={{ transform: 'translateZ(20px)' }}>{children}</div>
    </motion.div>
  );
}
```

---

## 3. Hardware Acceleration & 60 FPS Discipline

1. **Animate Composited Properties Only**: Never animate `width`, `height`, `top`, `left`, `margin`, or `padding` during continuous animations. Animate only `transform` (`scale`, `translate3d`, `rotate`) and `opacity`.
2. **Promote to GPU Layer**: Use `will-change-transform` or `translateZ(0)` on actively animating layers.
3. **Reduced Motion Compliance**: Always wrap dynamic animations with `useReducedMotion()` from Framer Motion. When the student has requested reduced motion, transition opacity only without spatial translation.
