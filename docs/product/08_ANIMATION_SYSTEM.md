# SAMYAK TUTOR — PHASE 7: MASTER MOTION DESIGN & ANIMATION SYSTEM
**Document ID:** `docs/product/08_ANIMATION_SYSTEM.md`  
**Version:** 1.0.0 (Master Motion Architecture)  
**Date:** November 10, 2026  
**Status:** Approved & Verified (`npx tsc --noEmit` 0 errors)  
**Workspace:** `d:\FR` | **Branch:** `feature/product-transformation`  
**Author:** Multidisciplinary Product Development Team (Motion Design Engineer, Senior UI Designer, Accessibility Specialist)

---

## 1. Motion Design Philosophy: Purposeful, High-Performance Feedback

In educational technology, motion must serve cognition. Unnecessary bouncing, sluggish parallax effects, or intrusive full-screen wipes distract students during intensive problem-solving and degrade performance on low-tier mobile devices.

Samyak Tutor adheres to the **Functional Motion Doctrine**:
1. **Direct Manipulation:** Interactive elements respond immediately to touch or click (`75ms–150ms`).
2. **Contextual Continuity:** Smooth transitions clarify where elements came from (e.g., drawers slide in from their originating screen edge; modals scale out from their parent triggers).
3. **Hardware Acceleration:** All animations are constrained to GPU-friendly `transform` and `opacity` properties. No layout-triggering properties (`width`, `height`, `top`, `margin`) are animated.
4. **Distraction-Free Assessment:** During timed CBT examinations, animations are minimized to prevent timer interference or visual fatigue.

---

## 2. Motion Rules & Timing Standards

Defined in [`src/lib/animations/motionPresets.ts`](file:///d:/FR/src/lib/animations/motionPresets.ts):

| Motion Category | Duration | Easing Curve | Use Case |
| :--- | :---: | :---: | :--- |
| **Instant / Tap** | `75ms` | `easeOut` | Button active press (`active:scale-[0.98]`), checkbox tick |
| **Microinteraction**| `150ms` | `cubic-bezier(0.16, 1, 0.3, 1)` | Card hover lift, icon color transitions, tooltip reveal |
| **Contextual Surface**| `220ms` | `cubic-bezier(0.2, 0, 0, 1)` | Modal entrance, dropdown unfold, tab-switch indicator |
| **Spatial Navigation**| `320ms` | Spring (`stiffness: 350, damping: 32`) | Mobile bottom drawer, desktop sidebar collapse |
| **CBT Question** | `120ms` | `easeOut` | Rapid next-question slide during timed exams |
| **Arena Countdown** | `600ms` | `easeInOut` | 3... 2... 1... Battle match start sequence |

---

## 3. Accessibility & Reduced-Motion Mandate

In compliance with **WCAG 2.2 Criterion 2.3.3 (Animation from Interactions)**:
- Every animated component queries Framer Motion's `useReducedMotion()`.
- When the user's operating system requests reduced motion (`prefers-reduced-motion: reduce`), all spatial motion (`x`, `y`, `scale`) is suppressed.
- The interface gracefully defaults to a subtle, non-disruptive cross-fade (`opacity: 0 -> 1` over `150ms`), preventing motion sickness, vestibular triggers, or cognitive disorientation.

---

## 4. Key Subsystem Animation Specifications

### 4.1 Page Transitions ([`PageTransitionWrapper.tsx`](file:///d:/FR/src/components/PageTransitionWrapper.tsx))
- **Entry:** Subtle 12px vertical slide with opacity fade (`y: 12 -> 0, opacity: 0 -> 1`) over 280ms.
- **Exit:** Fast upward fade (`y: -8, opacity: 0`) over 180ms.
- Prevents white-flash layout shifts during Next.js App Router route transitions.

### 4.2 Interactive Cards ([`src/components/ui/Card.tsx`](file:///d:/FR/src/components/ui/Card.tsx))
- **Hover:** Gentle 3px vertical lift with layered elevation (`shadow-md`) and primary border glow (`border-primary/40`).
- **Tap/Click:** Instant spring scale (`scale: 0.98`) providing immediate tactile feedback.

### 4.3 Computer-Based Testing (CBT) Interface
- Answer option selection responds within **0ms** (zero perceptible delay).
- Question transitions use a tight 120ms horizontal slide (`x: 8 -> 0`), preserving high reading velocity during 200-question timed speed runs.

### 4.4 Battle Arena PvP Animations
- **Matchmaking Radar:** Concentric pulsating rings indicating active opponent search.
- **PvP Intro:** Competitor avatars slide in from left and right with high-stiffness spring physics (`stiffness: 450`).
- **Live Scoreboard:** Animated score bars smoothly interpolate points using spring physics as correct answers are submitted.
- **Victory Splash:** Confetti burst and trophy scale-up with celebratory sound cues.

---

## 5. Verification & Sign-Off

- **Presets Library Created:** [`src/lib/animations/motionPresets.ts`](file:///d:/FR/src/lib/animations/motionPresets.ts).
- **Reduced Motion Tested:** Verified fallback variants.
- **TypeScript Check:** `npx tsc --noEmit` exits with **0 errors**.
- **Deliverable Status:** Complete and written to `docs/product/08_ANIMATION_SYSTEM.md`.
- **Ready for Next Phase:** **Phase 8 & 9 — Accessibility, Performance & QA (`09_ACCESSIBILITY_AUDIT.md`, `10_PERFORMANCE_AUDIT.md`, `11_FUNCTIONAL_QA_REPORT.md`)**.
