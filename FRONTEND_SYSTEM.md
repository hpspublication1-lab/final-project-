# Samyak CEE — Frontend Architecture & Maintenance System

> **The definitive design system and engineering playbook for maintaining, scaling, and polishing the Samyak CEE frontend.**  
> Benchmarked against **Linear, Stripe, Apple, and Dub.co**.

---

## 1. Core Architecture & Folder Hierarchy

To prevent disorganized growth and monolithic spaghetti components, all frontend code strictly adheres to the following directory hierarchy:

```
src/
├── app/                        # Next.js App Router (File-based Routing)
│   ├── (auth)/                 # Route groups for auth pages
│   ├── admin/                  # Administrative management portals
│   ├── student-dashboard/      # Student academic dashboard & exam cockpit
│   ├── mock-tests/             # Computer-Based Testing (CBT) engine
│   └── layout.tsx              # Root HTML shell & metadata
│
├── components/                 # Reusable React Components
│   ├── ui/                     # 1. ATOMIC UI PRIMITIVES (Button, Badge, Card, MetricCard...)
│   │   ├── index.ts            # Master barrel export (import from '@/components/ui')
│   │   ├── Button.tsx
│   │   ├── Badge.tsx
│   │   ├── Card.tsx
│   │   ├── MetricCard.tsx      # Tremor-style KPI scorecards
│   │   ├── EmptyState.tsx      # Zero-data states with actions
│   │   ├── StatusDot.tsx       # Live pulsating status indicators
│   │   └── AppLogo.tsx         # Unified Brand Wordmark & Crest
│   │
│   ├── navigation/             # 2. SITE NAVIGATION & APP SHELLS
│   │   ├── PublicNav.tsx       # Top public navigation bar
│   │   └── MobileBottomNav.tsx # Responsive safe-area bottom dock
│   │
│   └── portals/                # 3. DOMAIN FEATURE SUITES
│       ├── CeePortalView.tsx   # CEE Medical Exam modules
│       └── AdminPanels/        # Back-office admin panels
│
├── lib/                        # Utilities, Clients & System Config
│   ├── theme/
│   │   └── tokens.ts           # MASTER DESIGN TOKENS (Colors, Spacing, Radii, Subjects)
│   ├── supabase/               # Client & Server Supabase adapters
│   └── config/                 # Platform constants & academic timetables
│
└── scripts/
    └── audit-frontend.js       # AUTOMATED HEALTH & GOVERNANCE LINTER (npm run ui:audit)
```

---

## 2. Master Design Tokens & Visual Hierarchy

All components must source styling values directly from `@/lib/theme/tokens.ts` or Tailwind utility classes. **Never write arbitrary inline pixel values or un-tokenized hex colors.**

### A. The 8-Point Spatial Grid
Spacing must always conform to the 8pt rhythm:
| Token | Pixels | Tailwind Class | Recommended Usage |
| :--- | :--- | :--- | :--- |
| `1` | `4px` | `p-1`, `gap-1` | Micro-badge padding, tight icon offsets |
| `2` | `8px` | `p-2`, `gap-2` | Icon-to-label spacing, compact lists |
| `3` | `12px` | `p-3`, `gap-3` | Mobile card padding, table cell gaps |
| `4` | `16px` | `p-4`, `gap-4` | Standard card internal padding, button gutters |
| `6` | `24px` | `p-6`, `gap-6` | Desktop card padding, section gap |
| `8` | `32px` | `p-8`, `gap-8` | Dashboard column gap, modal interiors |
| `12` | `48px` | `p-12`, `gap-12`| Hero section spacing |

### B. Color Disciplines
* **Brand Primary**: Electric Indigo (`#5243E0`) and Deep Violet (`#3726B0`).
* **Neutrals**: Light mode uses Slate (`#F8FAFC`, `#0F172A`); Dark mode uses Obsidian Ink (`#07090E`, `#0D111A`).
* **Medical Subject Accent Palette**:
  * **Biology (Zoology & Botany)**: Emerald (`#10B981`) · 80 Marks / 40% Weightage
  * **Chemistry**: Royal Blue (`#2563EB`) · 50 Marks / 25% Weightage
  * **Physics**: Warm Amber (`#F59E0B`) · 50 Marks / 25% Weightage
  * **Mental Agility Test (MAT)**: Violet (`#8B5CF6`) · 20 Marks / 10% Weightage

### C. Typographic Rules
* **Headings**: Always use tightened letter spacing (`tracking-tight`) with `text-foreground`.
* **Numbers, Scores & Percentiles**: **Must always use `tabular-nums font-mono`** to avoid layout shifts during real-time updates.

---

## 3. The 5 Golden Rules of Frontend Maintenance

### Rule 1: Zero Cartoon Emojis
**Never** use raw emojis (`🎯`, `🎬`, `📚`, `⚡`, `🪙`) inside UI headers, navigation, or data tables.
* **Why**: Raw emojis render inconsistently across Windows, iOS, and Android, and make a high-stakes medical examination platform look like a toy.
* **Fix**: Use vector Lucide icons inside micro-badge containers:
  ```tsx
  // ❌ Bad:
  <span>🎯 100 MCQs</span>

  // ✔ Good:
  <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
    <Target size={14} className="text-primary" />
    <span>100 MCQs</span>
  </div>
  ```

### Rule 2: Component Size Budget (< 450 Lines)
* Any `.tsx` file exceeding **450 lines** must be decomposed into modular sub-components.
* Extract dialogs, drawers, modals, and complex table rows into dedicated files in a `components/` subfolder adjacent to the page.

### Rule 3: Single Source of Truth for Brand Identity
* The brand name across all customer-facing surfaces is strictly **Samyak CEE**.
* Never use deprecated variants like `Samyak Tutor` or `Samyak Guru` in page titles, announcement banners, or footers.

### Rule 4: Clean UI Primitives First
* Always prefer importing from `@/components/ui`:
  ```tsx
  import { Button, Badge, Card, MetricCard, EmptyState, StatusDot } from '@/components/ui';
  ```
* Do not reinvent ad-hoc buttons or badges using custom `div` wrappers.

### Rule 5: Automated Pre-Flight Verification
Before pushing or deploying any changes, run the maintenance trinity:
```bash
npm run ui:audit     # Scans for raw emojis, giant monoliths, and legacy brands
npm run type-check   # Verifies 0 TypeScript errors (tsc --noEmit)
npm run test         # Verifies 100% test suite pass rate (vitest)
```

---

## 4. Maintenance Commands Quick-Reference

| Command | Purpose | When to Run |
| :--- | :--- | :--- |
| `npm run ui:audit` | Runs automated frontend health & design linter | After creating/modifying components |
| `npm run type-check` | Full strict TypeScript compilation (`tsc --noEmit`) | Before every git commit |
| `npm run test` | Executes all 542 unit & integration tests | Before deploying to Vercel |
| `npm run format` | Prettier code formatting pass | Pre-commit |
| `npx vercel deploy --prod` | Ships to live production (`samyakcee.com`) | After all checks pass |
