# SAMYAK TUTOR — PHASE 1: UNIFIED DESIGN SYSTEM & TOKEN SPECIFICATION
**Document ID:** `docs/product/02_DESIGN_SYSTEM.md`  
**Version:** 1.0.0 (Master Design Language)  
**Date:** November 10, 2026  
**Status:** Approved & Verified (`npx tsc --noEmit` 0 errors)  
**Workspace:** `d:\FR` | **Branch:** `feature/product-transformation`  
**Author:** Multidisciplinary Product Development Team (Chief Product Designer, Senior UI Designer, Design Systems Architect, Accessibility Specialist, Motion Design Engineer)

---

## 1. Visual Direction & Design Philosophy

Samyak Tutor represents a premier standard for educational software in South Asia. The visual direction balances the scholarly authority of prestigious academic institutions with the crisp speed, tactile precision, and clean negative space characteristic of modern products like Linear, Stripe, and Notion.

### 1.1 Brand Attributes
1. **Academic Excellence & Clarity:** The interface minimizes visual noise, cognitive clutter, and gratuitous embellishments so that questions, derivations, and lectures remain paramount.
2. **Intelligence & Innovation:** AI Saarthi and adaptive diagnostic engines feel fluid and modern, using subtle glowing borders and clean typography rather than heavy sci-fi gimmicks.
3. **Trust & Reliability:** In high-stakes national exams (CEE, SEE, IOE), students and parents must feel complete confidence in the timer, answer synchronization, and payment systems.
4. **Competitive Drive:** The Battle Arena and Leaderboards inject gamification and motivation through clean, punchy badges and smooth score counters without degrading into a cheap arcade game.

---

## 2. Brand Identity & Semantic Color Architecture

Samyak's established identity centers on **Royal Indigo (`#5243E0`)**, conveying intelligence, focus, and depth. The palette is carefully refined into high-contrast tokens with full light and dark mode implementations complying with **WCAG 2.2 AA (minimum 4.5:1 text contrast)**.

### 2.1 Brand & Neutral Palettes
All tokens are defined programmatically in [`src/lib/design-system/tokens.ts`](file:///d:/FR/src/lib/design-system/tokens.ts) and synchronized with `src/styles/tailwind.css`.

| Token Name | Light Mode Value | Dark Mode Value | Semantic Role |
| :--- | :--- | :--- | :--- |
| `colors.brand.primary` | `#5243E0` | `#8176FF` | Primary action buttons, active navigation, key highlights |
| `colors.brand.primaryLight` | `#EEEDFE` | `#181C30` | Subtle badge backgrounds, hovered active items |
| `colors.accent.teal` | `#00BFA5` | `#00E5CC` | AI features, conceptual hints, breakthroughs |
| `colors.accent.gold` | `#F59E0B` | `#FBBF24` | Streak flames, gold badges, tournament cashouts |
| `colors.neutral.background` | `#F8FAFC` (Slate 50) | `#07090E` (Obsidian) | Full page background |
| `colors.neutral.surface` | `#FFFFFF` (White) | `#0D111C` (Dark Card) | Card, modal, and drawer surfaces |
| `colors.neutral.surfaceMuted` | `#F1F4F9` | `#131828` | Input backgrounds, nested tables, code blocks |
| `colors.neutral.border` | `#E2E6F0` | `#1D2438` | Dividers, card borders, table lines |
| `colors.neutral.textPrimary` | `#090D1A` | `#F1F4FA` | Main headings, primary content (95% black / white) |
| `colors.neutral.textSecondary`| `#4A5568` | `#A0AEC0` | Subtitles, descriptions, metadata |
| `colors.neutral.textMuted` | `#718096` | `#718096` | Timestamps, question IDs, disabled text |

### 2.2 Subject Color System (Academic Discipline Theming)
For consistent recognition across video lessons, question bank filters, and test analysis:
- **Biology:** Primary `#10B981` (Emerald), Light Surface `#ECFDF5`, Dark Surface `#032A18`.
- **Chemistry:** Primary `#8B5CF6` (Violet), Light Surface `#F5F3FF`, Dark Surface `#1A0B33`.
- **Physics:** Primary `#3B82F6` (Electric Blue), Light Surface `#EFF6FF`, Dark Surface `#08162E`.
- **Mental Agility (MAT):** Primary `#F59E0B` (Amber), Light Surface `#FFFBEB`, Dark Surface `#261A02`.
- **Mathematics:** Primary `#EC4899` (Rose), Light Surface `#FDF2F8`, Dark Surface `#2C0617`.
- **English & Communication:** Primary `#14B8A6` (Teal), Light Surface `#F0FDFA`, Dark Surface `#042F2E`.

---

## 3. Typographic Hierarchy

Typography is set in **Plus Jakarta Sans** for body and headings, paired with **IBM Plex Mono** for numerical scores, timers, and formula indices. Both fonts load via `next/font/google` with zero layout shift (`display: swap`).

### 3.1 Type Scale
| Level | Font Size | Line Height | Weight | Tracking | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Hero Display** | 3rem (48px) | 1.15 | 800 (Extrabold) | `-0.04em` | Landing page hero statements |
| **Heading 1** | 2.25rem (36px) | 2.5rem | 800 (Extrabold) | `-0.035em`| Major workspace titles (Dashboard, Arena) |
| **Heading 2** | 1.5rem (24px) | 2rem | 700 (Bold) | `-0.025em`| Section headers, module cards |
| **Heading 3** | 1.25rem (20px) | 1.75rem | 700 (Bold) | `-0.02em` | Card titles, modal headers |
| **Body Large** | 1.125rem (18px)| 1.75rem | 500 (Medium) | `-0.015em`| Question text, exam prompts |
| **Body Base** | 1rem (16px) | 1.5rem | 400 (Regular) | `-0.01em` | Standard reading text, descriptions |
| **Body Small** | 0.875rem (14px)| 1.25rem | 500 (Medium) | `0em` | Form labels, table cells, buttons |
| **Caption / Badge** | 0.75rem (12px)| 1rem | 700 (Bold) | `+0.02em` | Badges, tags, countdown timers |

### 3.2 Nepali & Devanagari Typography Fallback
For questions or board notifications in Nepali:
```css
font-family: var(--font-plus-jakarta-sans), "Mukta", "Kalimati", "Preeti", sans-serif;
```
Ensures correct rendering of conjunct consonants (ह्र, श्र, द्व) and vowel diacritics.

---

## 4. Spacing System (8-Point Spatial Grid)

All layout paddings, margins, gaps, and structural containers conform to an 8-point mathematical grid:
- `space-1` (4px): Micro icon spacing, dot badge margins.
- `space-2` (8px): Form input inner gap, small card padding.
- `space-3` (12px): Standard button padding, list item gaps.
- `space-4` (16px): Standard container padding, card gap on mobile.
- `space-5` (20px): Grid gap on tablet screens.
- `space-6` (24px): Desktop card inner padding, section gap.
- `space-8` (32px): Workspace column separation.
- `space-12` (48px): Major section breaks on desktop.

---

## 5. Border Radii & Elevation System

Replaces chaotic haphazard border radii with a disciplined 5-step scale:
- `radii.sm` (8px): Inputs, tooltips, segmented control tabs.
- `radii.md` (12px): Standard buttons, compact cards, table rows.
- `radii.lg` (16px): Content cards, test question cards, video wrapper.
- `radii.xl` (20px): Hero banners, desktop modals, mobile bottom sheets.
- `radii.2xl` (24px): Primary dashboard layout cards.
- `radii.full` (9999px): Avatar circles, status pills, count badges.

### 5.1 Layered Elevation & Shadows
- **Card Shadow (`shadow-xs`):** `0 1px 2px rgba(9, 13, 26, 0.04)`
- **Hover Elevation (`shadow-md`):** `0 4px 8px rgba(9, 13, 26, 0.04), 0 12px 28px rgba(9, 13, 26, 0.08)`
- **Luxury Floating (`shadow-luxury`):** Subtle 1px ring + dual ambient diffuse shadow.
- **Dark Mode Elevation:** Translucent white ring (`rgba(255, 255, 255, 0.08)`) with deep ambient drop shadow to provide clear surface separation without muddiness.

---

## 6. Motion & Animation Principles

All animations adhere to the "functional motion" doctrine: **motion must clarify state changes, never delay the user**.
1. **Durations:**
   - 150ms: Ordinary microinteractions (button hover, click scale `0.98`, focus ring expansion).
   - 220ms: Dropdown reveal, tab indicator sliding, toast alerts.
   - 300ms: Modal scale-in, slide-out drawer entrance.
2. **Reduced Motion:** Every animated component strictly queries `prefers-reduced-motion` and falls back to an instantaneous opacity fade (`transition: opacity 100ms`).
3. **Exam Exemption:** Exam timers and answer selection MUST have 0ms delay. Answer radio buttons update immediately on tap.

---

## 7. Component Library Specifications

Standardized UI primitives implemented in the codebase:

### 7.1 `<Button>` ([`src/components/ui/Button.tsx`](file:///d:/FR/src/components/ui/Button.tsx))
- **Variants:** `primary`, `secondary`, `outline`, `ghost`, `danger`, `accent`.
- **Sizes:** `sm` (32px), `md` (44px min tap target), `lg` (48px), `icon` (44x44px).
- **Features:** Integrated loading spinner (`Loader2`), active spring press (`active:scale-[0.98]`), focus-visible ring, disabled states.

### 7.2 `<Input>` ([`src/components/ui/Input.tsx`](file:///d:/FR/src/components/ui/Input.tsx))
- **Features:** 44px height, left/right icon slots, automatic label-id linking, error state text with red border, helper captions.

### 7.3 `<Badge>` ([`src/components/ui/Badge.tsx`](file:///d:/FR/src/components/ui/Badge.tsx))
- **Variants:** `primary`, `secondary`, `accent`, `success`, `warning`, `error`, `outline`, `neutral`.
- **Features:** Optional pulsating live dot (`dot={true}`), uppercase font, rounded-full pill.

### 7.4 `<Card>` ([`src/components/ui/Card.tsx`](file:///d:/FR/src/components/ui/Card.tsx))
- **Variants:** `default`, `elevated`, `interactive` (hover lift + border glow), `outline`, `glass`.
- **Padding:** `none`, `sm`, `md`, `lg`.

### 7.5 `<Modal>` ([`src/components/ui/Modal.tsx`](file:///d:/FR/src/components/ui/Modal.tsx))
- **Features:** Trapped focus, Esc key dismiss, background scroll lock, backdrop blur, responsive widths (`sm` to `2xl`).

---

## 8. Verification & Delivery Sign-Off

- **Tokens Source:** [`src/lib/design-system/tokens.ts`](file:///d:/FR/src/lib/design-system/tokens.ts)
- **Primitives Implemented:** `Button`, `Input`, `Badge`, `Card`, `Modal`
- **TypeScript Check:** `npx tsc --noEmit` exited with **0 errors**.
- **Deliverable Status:** Complete and written to `docs/product/02_DESIGN_SYSTEM.md`.
- **Ready for Next Phase:** **Phase 2 — Information Architecture & Navigation (`03_INFORMATION_ARCHITECTURE.md`)**.
