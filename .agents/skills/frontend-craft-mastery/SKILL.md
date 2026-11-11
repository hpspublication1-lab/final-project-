---
name: frontend-craft-mastery
description: >-
  Mastery instructions and best practices for world-class frontend engineering,
  high-end UI/UX architecture, design systems, and responsive web development.
  Use when designing or building React 19 and Next.js interfaces, refining design
  tokens, upgrading typography and color contrast, ensuring WCAG 2.2 AA accessibility,
  or implementing luxury layouts benchmarked against Linear, Stripe, Apple, and Notion.
---

# Frontend Craft Mastery: World-Class UI/UX & Web Architecture

This skill equips the agent with elite frontend engineering and product design standards, benchmarked against premier digital products (Linear, Stripe, Apple, Notion, Duolingo, and Khan Academy).

---

## 1. Visual Hierarchy & Optical Craft

### The 8-Point Spatial Grid
* Use strict 8pt rhythm for margins, padding, and gap spacing: `4px` (0.5), `8px` (1), `12px` (1.5), `16px` (2), `24px` (3), `32px` (4), `48px` (6), `64px` (8).
* Never use arbitrary padding like `p-[17px]` or `gap-[13px]`.

### Typographic Polish
* Primary headings must feature tightened letter-spacing (`tracking-tight` or `-0.02em`) and optimized legibility (`text-rendering: optimizeLegibility`).
* Numbers, marks, percentiles, timers, and timestamps must always use `tabular-nums font-mono` to prevent horizontal layout jiggle during live updates.
* Line heights:
  * Display headers: `leading-[1.05]` to `leading-[1.15]`
  * Body copy: `leading-relaxed` (`1.6` to `1.7`) for effortless readability.

### Color Restraint & Luxury Glassmorphism
* **Never create "rainbow UI"**: Avoid placing 5 different saturated colored badges in the same viewport.
* Use a disciplined palette:
  * Brand Base: Deep Slate / Obsidian Ink (`#07090E` dark, `#F8FAFC` light).
  * Brand Accent: Royal Indigo / Electric Violet (`#5243E0` light, `#8176FF` dark).
  * Semantic Accents: Emerald for success/verified, Amber for cautions/streaks, Rose for errors/penalties.
* Glassmorphism recipe:
  ```css
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(226, 230, 240, 0.8);
  box-shadow: 0 4px 20px -2px rgba(9, 13, 26, 0.05);
  ```

---

## 2. React 19 & Next.js App Router Architecture

### Server vs. Client Boundary Doctrine
* Keep pages and layouts as **Server Components** by default for maximum SEO and sub-100ms TTFB.
* Extract interactivity into tightly scoped Client Components (`'use client'`).
* Pass server data down via typed props; never duplicate remote fetches unnecessarily on the client.

### Zero Hydration Error Protocols
* Never render client-varying state (such as timestamps, `Date.now()`, `Math.random()`, or `localStorage` reads) directly during initial SSR.
* Use `useEffect` or SWR hydration guards to initialize client-only values safely.

### Skeleton States & Optimistic UI
* Replace raw spinning wheels with high-fidelity skeleton screens mirroring the exact layout geometry.
* For interactive student actions (completing a daily task, bookmarking a question, arming streak freeze), update local state immediately (optimistic UI) before awaiting server confirmation.

---

## 3. Accessibility & Mobile Ergonomics (WCAG 2.2 AA)

1. **Contrast Ratio**: Normal body text must achieve $\ge 4.5:1$ contrast against its background; large headings must achieve $\ge 3.0:1$.
2. **Interactive Touch Targets**: Every button, link, and interactive icon must have a minimum hit target of $44 \times 44\text{px}$.
3. **Safe-Area Inset Handling**: All fixed bottom navigations and toolbars must respect device notches and home indicators:
   ```css
   padding-bottom: max(16px, env(safe-area-inset-bottom));
   ```
4. **Keyboard Traversal**: Visible, high-contrast focus rings (`focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2`).
