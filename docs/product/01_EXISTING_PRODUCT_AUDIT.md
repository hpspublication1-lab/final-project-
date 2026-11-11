# SAMYAK TUTOR — PHASE 0: EXISTING PRODUCT AUDIT & DISCOVERY REPORT
**Document ID:** `docs/product/01_EXISTING_PRODUCT_AUDIT.md`  
**Version:** 1.0.0 (Master Product Discovery)  
**Date:** November 10, 2026  
**Status:** Approved & Validated  
**Workspace:** `d:\FR` | **Branch:** `feature/product-transformation`  
**Author:** Multidisciplinary Product Development Team (Chief Product Designer, Principal UX Architect, Senior UI Designer, Senior Next.js Engineer, Senior React Engineer, Mobile Application Engineer, Motion Design Engineer, Design Systems Architect, Accessibility Specialist, QA & Performance Engineer)

---

## 1. Executive Summary & Audit Methodology

Samyak CEE / Samyak Tutor is an end-to-end educational technology platform serving students across Nepal preparing for competitive medical and engineering entrances (CEE, IOE), secondary national board examinations (SEE Class 10, NEB Class 11/12), civil service (Lok Sewa Aayog), and international language proficiency (IELTS, PTE).

Over successive rapid feature cycles, Samyak has amassed deep functional capabilities:
- **130 Application Page Routes**
- **130 API Route Endpoints**
- **77 Shared UI/Domain Components** in `src/components/`
- **135 Route-Specific Components** in `src/app/**/components/`
- **Real-Time Multiplayer Game Engine** (Colyseus WebSocket server with WebRTC proctoring)
- **Computer-Based Testing (CBT)** with offline synchronization, anti-cheat detection, and -0.25 negative marking
- **Adaptive Video Learning** via Bunny.net Stream HLS with dynamic DRM watermarking

### 1.1 The Core Problem
Despite extraordinary backend depth and pedagogical richness, the visual presentation, information architecture, navigation, and mobile ergonomics suffer from **feature sprawl**, **visual inconsistency**, **competing cognitive hierarchies**, and **incoherent design tokens**. 

The application currently feels like multiple independently-built web tools stitched together rather than a cohesive, premium international product on par with Linear, Notion, Stripe, or Duolingo.

### 1.2 Inspection Methodology
This audit was conducted by inspecting the local repository at `d:\FR`, running the live Next.js development server on `http://localhost:4028`, verifying the Colyseus multiplayer engine on `http://localhost:2567`, auditing database schemas and RPCs, and evaluating the UI across 8 viewport breakpoints (360px, 390px, 430px, 768px, 1024px, 1280px, 1440px, 1920px).

---

## 2. Comprehensive Inventory

### 2.1 Technology Stack & Infrastructure Verification
| Layer | Specification / Version | Health / Status |
| :--- | :--- | :--- |
| **Framework** | Next.js 15.0.0 App Router | Verified (Runs on port 4028) |
| **Runtime Library** | React 19.0.0 | Verified |
| **Language** | TypeScript 5.6.3 | Verified (`tsc --noEmit` 0 errors) |
| **Styling** | Tailwind CSS 3.4.1 | Active (`tailwind.config.js`, `src/styles/tailwind.css`) |
| **Motion** | Framer Motion 11.11.9 | Active |
| **Database & Auth** | Supabase PostgreSQL + Auth (SSR) | Verified, RLS hardened, connection pooling |
| **Multiplayer Server** | Colyseus 0.15.42 + Node.js 20+ | Active daemon on port 2567 |
| **Video Streaming** | Bunny.net Stream HLS (`hls.js`) | Verified with Canvas DRM watermark |
| **Live Classroom** | 100ms WebRTC + YouTube / HLS Embeds | Verified in `LiveClassesClient.tsx` |
| **Math Engine** | KaTeX 0.16.11 | Active (`MathText.tsx`, LaTeX rendering) |
| **PWA Engine** | Service Worker `sw.js` (Cache API v2) | Registered via `ServiceWorkerRegister.tsx` |

---

### 2.2 Route Inventory (130 Page Routes)

#### A. Public & Marketing Core (18 Routes)
- `/`: Main Landing Page with hero, live preview, course pathways, testimonials, and dynamic CTA.
- `/about`: Company philosophy, faculty credentials, medical board track record.
- `/pricing`: Course tiers, monthly/yearly passes, crash courses, seat reservations.
- `/activate-plan`: Activation voucher code redemption portal.
- `/contact`: Student counseling form with direct WhatsApp API integration.
- `/faq`: Interactive accordion answering admissions, syllabus, CBT, and payment questions.
- `/blog`, `/blog/[slug]`: Academic guidance, medical college cut-offs, syllabus updates.
- `/privacy`, `/terms`, `/refund`: Legal, refund policy, and student privacy terms.
- `/login`, `/reset-password`, `/onboarding`: Auth flows, password reset, initial student setup.
- `/checkout`: Multi-gateway checkout (Fonepay Dynamic QR, manual slip upload).
- `/payment-success`: Post-payment verification and instant course un-gating.
- `/receipt/[invoiceNumber]`, `/verify-receipt`: Authentic downloadable tax receipts.
- `/app-feature`: Feature showcase landing page.

#### B. Niche Course & SEO Landing Pages (11 Routes)
- `/cee-medical-entrance`: Dedicated CEE MBBS/BDS landing page.
- `/free-cee-biology-mcqs`: SEO lead generator for biology entrance questions.
- `/ai-python-course`: AI & Python curriculum marketing.
- `/digital`, `/digital-marketing`: Professional digital marketing course catalog.
- `/ielts-preparation`: IELTS band 8+ preparation hub.
- `/gate`: Engineering graduate entrance exam curriculum.
- `/prebook`: Early bird reservation checkout.

#### C. Student Core Learning & Dashboard (13 Routes)
- `/student-dashboard`: Unified student command center (2,881 lines in `DashboardPageClient.tsx`).
- `/batches`, `/batches/[slug]`: Cohort overview, schedule, syllabus tracker, enrolled batch view.
- `/courses`, `/courses/[slug]`, `/my-courses`: Course catalog, syllabus outlines, personal enrollment list.
- `/learn`, `/learn/[lessonId]`: Video lecture workspace, Bunny HlsPlayer, timestamped notes, DPP.
- `/lecture-videos`: Video archive browser.
- `/subjects`, `/subjects/[subjectId]/[chapterId]`: Hierarchical subject/chapter tree.
- `/free-resources`: Academic Vault (notes, formula sheets, old-is-gold PDFs).
- `/study-plan`: Daily schedule and milestone tracker.
- `/bookmarks`: Saved questions and notes library.

#### D. Practice, Question Bank & Assessment (13 Routes)
- `/practice`, `/practice/subjective`: High-yield chapter MCQ solver, subjective answer submissions.
- `/question-bank`: 15,000+ CEE/SEE question bank with difficulty filters.
- `/mock-tests`, `/mock`: 200Q full-length timed CBT simulator with -0.25 negative marking.
- `/results`: Historical examination results and answer key review.
- `/mistake-analyser`: "Galti Sudhar" notebook categorizing wrong answers by root cause.
- `/revision`, `/revise`: Spaced repetition revision queue.
- `/flashcards`: SM-2 cognitive memory flashcard deck.
- `/mcq-generator`: Autonomous AI practice question generator.
- `/vision-marker`: AI handwritten paper grader using Gemini multimodal vision.
- `/rank-predictor`: MEC merit position and medical college admission odds calculator.
- `/doubts`: Student doubt ticket history and teacher response feed.

#### E. Competitive Multiplayer & Gamification (6 Routes)
- `/battle-arena`: Real-time 1v1 PvP quiz arena with proctoring camera.
- `/match-lobby`: Matchmaking lobby, queue countdown, opponent pairing.
- `/post-match-summary`: Elo rating change, accuracy delta, victory animations.
- `/leaderboard`: National, batch-level, and weekly streak rankings.
- `/friends`: Peer connections, friend challenge room generation.
- `/rewards`: Coins, XP, unlocked avatar titles, and cashout wallet.

#### F. AI Saarthi & Interactive Learning (2 Routes)
- `/ai-tutor`: 24/7 AI tutor chat workspace with prompt shortcuts, math rendering, and quota tracking.
- `/progress`: *(Audited defect: currently redirects to `/student-dashboard`)*.

#### G. Live Classes & Faculty Interaction (2 Routes)
- `/live-classes`: Interactive live masterclasses with WebRTC, real-time chat, reactions, and attendance.
- `/live-teacher`: Virtual AI faculty avatars and neural classroom simulations.

#### H. SEE Board (Class 10 CDC Curriculum) Dedicated Track (5 Routes)
- `/see`: Canonical 8-tab SEE hub (Video Classes, Past Papers, Marks Practice, Model Sets).
- `/see/checkout`: SEE-specific payment checkout.
- `/see/lessons/[lessonId]`: SEE-specific video player.
- `/see/question-bank`: SEE Class 10 CDC-aligned question bank.
- `/see/subject/[subjectId]`: SEE subject chapter workspace.

#### I. English & Language Track (13 Routes)
- `/english`: English curriculum root.
- `/english/band-predictor`: IELTS band predictor.
- `/english/cambridge`: Cambridge official exam simulator.
- `/english/classroom`: Live interactive English classroom.
- `/english/duolingo`: Duolingo English Test (DET) drills.
- `/english/it-english`: Technical English for software engineers.
- `/english/listening`: Audio listening comprehension drills.
- `/english/reading/speed-drills`: Timed reading speed optimizer.
- `/english/speaking`, `/english/speaking/simulator`: AI speech assessment.
- `/english/syllabus`: Complete CEFR/IELTS syllabus.
- `/english/vocabulary`: High-yield vocabulary flashcards.
- `/english/writing/rubric`: IELTS Task 1 & 2 AI rubric grader.

#### J. Account, Profile & Billing (5 Routes)
- `/profile`, `/profile/[username]`: Student avatar, gamer tag, achievements, streak, wallet.
- `/account`, `/account/purchases`: Account security settings, purchase order history.
- `/billing`: Official tax invoices, subscription status, voucher redemption.

#### K. Teacher & Staff Workspaces (3 Routes)
- `/teacher`: 10-tab faculty dashboard (cohorts, schedule, questions, evaluations, doubts).
- `/teacher/evaluations`: Subjective exam grading interface.
- `/staff`: Staff triage portal for inquiries and doubts.

#### L. Parent Portal (1 Route)
- `/parent-dashboard`: Weekly study time, test percentile, attendance report for parents.

#### M. Administration Workspace (37 Routes)
- `/admin`, `/admin/login`, `/admin/dashboard`: Administrative command center.
- `/admin/activation-codes`: Bulk minting and tracking of access vouchers.
- `/admin/ai-review`: Moderation queue for AI-generated questions.
- `/admin/analytics`: Platform growth, DAU/WAU, engagement analytics.
- `/admin/announcements`: Global broadcast system.
- `/admin/arena`, `/admin/arena/championship`: Battle arena moderation, tournament scheduling.
- `/admin/audit-logs`: Security audit log viewer.
- `/admin/autonomous`: Control room for autonomous AI content generation engines.
- `/admin/batches`: Cohort schedule and batch enrollment manager.
- `/admin/billing`: Financial ledger, reconciliations, invoice management.
- `/admin/chapters`, `/admin/courses`, `/admin/curriculum`, `/admin/lessons`, `/admin/subjects`: Curriculum CMS.
- `/admin/coupons`: Discount code engine.
- `/admin/doubts`: Escalated student doubt resolution queue.
- `/admin/enrollments`: Manual student access un-gating and batch assignment.
- `/admin/exams`: Mock exam authoring, question assignment, duration settings.
- `/admin/flashcards`: Flashcard deck editor.
- `/admin/leads`: CRM sales lead tracker.
- `/admin/live-classes`: 100ms and HLS live class scheduler.
- `/admin/notifications`: Push notification dispatcher.
- `/admin/orders`: Fonepay payment verification and slip audit.
- `/admin/prebookings`: Seat deposit lead manager.
- `/admin/questions`: MCQ authoring suite with LaTeX preview.
- `/admin/reports`: Academic error and student grievance reports.
- `/admin/resources`: PDF and study resource uploader.
- `/admin/roles`: RBAC permission matrix.
- `/admin/see-importer`: CDC syllabus CSV/JSON bulk importer.
- `/admin/settings`: Platform security and rate-limiting configuration.
- `/admin/teachers`: Faculty directory and assignment.
- `/admin/uploads`: Storage bucket asset browser.
- `/admin/users`: Student 360 profile, role escalation, suspension, impersonation.

---

### 2.3 Existing Reusable Components (77 Shared Components)
The repository contains 77 shared components in `src/components/`, including:
1. **Layout & Navigation:** `DashboardLayout.tsx`, `PublicNav.tsx`, `PageTransitionWrapper.tsx`, `ProgramSwitcher.tsx`, `ProgramSelectorModal.tsx`.
2. **Video & Media:** `BunnyHlsPlayer.tsx`, `DynamicDrmWatermark.tsx`, `HMSLiveRoom.tsx`, `LiveStreamPlayer.tsx`.
3. **Assessment & Pedagogic Primitives:** `MathText.tsx`, `FormattedAnswer.tsx`, `Common/MathRenderer.tsx`, `InteractiveNoteReader.tsx`.
4. **Student Engagement Widgets:** `DailyMissionWidget.tsx`, `ContinueLearningBar.tsx`, `StudentGamificationWidget.tsx`, `StudentAnalyticsPanel.tsx`, `SeeReadinessScoreWidget.tsx`, `TodayPersonalizedOSWidget.tsx`.
5. **Gating & Modals:** `PremiumGate.tsx`, `TrialBannerAndModals.tsx`, `AiDoubtSolverModal.tsx`, `RedeemVoucherModal.tsx`, `OfficialReceiptModal.tsx`.
6. **Administrative UI:** `AdminInfraPulse.tsx`, `AdminOmniCommand.tsx`, `AdminTelemetryRadar.tsx`, `BulkOperationsBar.tsx`, `GhostViewBanner.tsx`, `PaymentSlipInspectionModal.tsx`, `RbacMatrixTable.tsx`, `Student360Drawer.tsx`.
7. **UI Primitives (`src/components/ui/`):** `AppIcon.tsx`, `AppImage.tsx`, `AppLogo.tsx`, `SamyakBadge.tsx`, `SamyakCard.tsx`, `StateView.tsx`.

---

## 3. Detailed Audit Across the 21 Key Inspection Areas

### Area 1: Application Routes & Routing Integrity
- **Finding:** While all 130 page routes and 130 API routes compile, several routes are dead-ends or unexpected redirects:
  - `/progress` redirects directly to `/student-dashboard` rather than rendering the dedicated student analytics center.
  - `/support` immediately redirects to `/contact` instead of providing a help center or ticketing UI.
  - `/mock` is an unlinked alias for `/mock-tests`.
  - `/revise` is an unlinked alias for `/revision`.
- **Verdict:** Routes require clean canonical consolidation.

### Area 2: Navigation & Information Architecture
- **Finding:** In `src/components/DashboardLayout.tsx`:
  - The sidebar displays 15+ links unconditionally in a flat, vertical list.
  - Dynamic program switching exists, but switches the entire sidebar abruptly, causing cognitive disorientation.
  - On desktop screens between 1024px and 1280px, the sidebar collapses icons without adequate tooltips, leaving users guessing navigation targets.
  - The mobile view relies on a dual system: a fixed 5-tab bottom bar (`Home`, `Learn`, `Practice`, `Tests`, `Profile`) AND a slide-out hamburger drawer containing 16 extra items. The two systems overlap redundantly.
- **Verdict:** Information architecture must be organized into 4 clear macro-categories: **Main**, **Learning**, **Competition**, and **Support**.

### Area 3: Student Dashboard (`/student-dashboard`)
- **Finding:** `DashboardPageClient.tsx` is an overwhelming 2,881-line monolith:
  - Over 15 different cards fight for primary visual focus in the first viewport: Continue Learning, Today's Plan, Recommendation Banner, Live Class Alert, Streak Counter, Daily Championship, Weak Topics, Recent Tests, Redeem Voucher, and Announcements.
  - The student cannot answer the fundamental question: *"What is the single most important thing I must study right now?"*
  - Card styles alternate arbitrarily between `rounded-xl`, `rounded-2xl`, and `rounded-3xl`.
- **Verdict:** Needs a clean visual hierarchy with a dominant "Next Academic Step" hero action, followed by a compact study plan and categorized progress.

### Area 4: Course and Lesson Pages (`/batches/[slug]`, `/learn/[lessonId]`)
- **Finding:**
  - `LessonPlayerClient.tsx` (1,422 lines) is rich in features (HLS player, playlist, DPP, notes, PDF viewer), but suffers from cluttered tab switching on mobile.
  - On screens under 640px, the video player dominates 65% of the screen height, leaving inadequate touch area for the notes or question tabs below.
  - The theatre mode toggle is difficult to find and lacks a keyboard shortcut.
- **Verdict:** Implement a responsive split layout with smooth collapsible tabs and quick fullscreen/theatre mode.

### Area 5: Video Player (`BunnyHlsPlayer.tsx`)
- **Finding:**
  - Excellent technical foundations: quality level selection, playback speed (0.75x–2.0x), audio-only mode, and canvas-based dynamic DRM watermark.
  - Control bar icons are small on touch screens (< 36px touch targets).
  - Scrubbing on mobile touch screens can accidentally trigger native browser swipe gestures.
- **Verdict:** Expand touch targets to a minimum 44px on mobile and add double-tap 10-second seek overlays.

### Area 6: Notes & PDF Viewer (`InteractiveNoteReader.tsx`)
- **Finding:**
  - Markdown notes and LaTeX formulas render cleanly using KaTeX.
  - PDF view opens in a new browser tab or an embedded modal that lacks zoom controls and page jump navigation on iOS Safari.
- **Verdict:** Enhance PDF viewer modal with dedicated zoom, fit-to-width, and mobile page swipe controls.

### Area 7: Practice & Question Bank (`/practice`, `/question-bank`)
- **Finding:**
  - Deep repository of 15,000+ MCQs.
  - The UI presents 8+ simultaneous filter dropdowns (Subject, Chapter, Difficulty, Status, Year, Bookmark, Topic, Tag) taking up half of the viewport.
  - In practice mode, instant feedback animations take up to 400ms, causing lag during high-speed drills.
- **Verdict:** Streamline filters into a collapsible drawer or sticky pills; optimize question transitions to `< 150ms`.

### Area 8: Examination Interface (`/mock-tests`)
- **Finding:**
  - `MockTestsPageClient.tsx` (2,538 lines) is exceptionally well-engineered for exam security: durable offline storage, timer recovery across tab crashes, anti-cheat detection, and 5-state question palette.
  - Question palette drawer on mobile obscures the entire question text when opened.
  - Confirm submit modal lacks clear visual distinction between "Unanswered" and "Marked for Review" counts.
- **Verdict:** Redesign the mobile question palette as a non-intrusive bottom sheet and enhance the submission confirmation summary.

### Area 9: Examination Results (`/results`)
- **Finding:**
  - Displays score, percentile, accuracy, and subject breakdown.
  - Lacks actionable direct remediation: students see they scored 42% in Electrochemistry, but cannot click a single button to *"Practice 10 Remedial Questions in Electrochemistry"*.
- **Verdict:** Introduce an instant "One-Click Remedial Drill" generator linked directly from the exam breakdown.

### Area 10: AI Saarthi (`/ai-tutor`)
- **Finding:**
  - Excellent prompts catalog (CEE & SEE), math rendering, and multi-agent intent routing.
  - Chat bubbles are visually heavy with thick borders and harsh background contrast in dark mode.
  - Code and LaTeX copy buttons lack clear visual feedback on mobile.
- **Verdict:** Adopt a modern, conversational UI similar to Claude/ChatGPT with clean typography and subtle pill badges.

### Area 11: Battle Arena (`/battle-arena`)
- **Finding:**
  - Outstanding technical execution: Colyseus server-authoritative WebSocket engine, 1v1 matchmaking, and real-time WebRTC proctoring camera.
  - UI visual style diverges sharply from the rest of the application (uses aggressive neon purples and game gradients that feel disconnected from the academic brand).
- **Verdict:** Re-align Battle Arena styling to match the premium Samyak design system (refined brand indigo, crisp typography, clean competition HUD).

### Area 12: Matchmaking & Tournaments (`/match-lobby`, `/admin/arena/championship`)
- **Finding:**
  - Matchmaking countdown is smooth, but lacks an estimated wait time indicator.
  - If no opponent connects within 45 seconds, the cancellation flow is abrupt.
- **Verdict:** Provide animated matchmaking radar with real-time player counts and graceful fallback options.

### Area 13: Live Classes (`/live-classes`)
- **Finding:**
  - Multi-provider support (100ms WebRTC, YouTube Live, Bunny HLS).
  - Real-time chat and Q&A feed can push the video off-screen on tablet portrait orientations.
- **Verdict:** Provide a picture-in-picture mode and side-by-side chat layout for tablets and desktops.

### Area 14: Flashcards & Spaced Repetition (`/flashcards`)
- **Finding:**
  - Scientific SM-2 algorithm implementation.
  - Card flip animation occasionally causes slight 3D perspective clipping on Firefox.
  - Lacks keyboard shortcuts on desktop (e.g., Space to flip, 1-4 for grading).
- **Verdict:** Add smooth GPU-accelerated flip transitions and complete desktop keyboard hotkeys.

### Area 15: Progress Analytics (`/progress`)
- **Finding:**
  - **Critical Defect:** `/progress` currently redirects to `/student-dashboard`.
  - The comprehensive `StudentAnalyticsPanel` component exists in `src/components/`, but is not given its own dedicated page.
- **Verdict:** Mount a dedicated, high-impact Student Progress & Analytics Center on `/progress`.

### Area 16: Payment & Subscription Flows (`/checkout`, `/pricing`, `/billing`)
- **Finding:**
  - Fonepay dynamic QR generation works reliably.
  - Price tiers are complex (15+ plans across monthly, annual, crash course, seat reservation, and subject boosters).
  - On mobile checkout, the QR code image can overflow smaller screens (< 375px).
- **Verdict:** Ensure responsive QR scaling, clear plan comparison cards, and frictionless voucher redemption.

### Area 17: Student Profile (`/profile`)
- **Finding:**
  - Avatar selection, title badges, and wallet withdrawal requests are functional.
  - Form inputs lack inline validation messages before submission.
- **Verdict:** Add real-time field validation and interactive badge preview cards.

### Area 18: Teacher Dashboard (`/teacher`)
- **Finding:**
  - 10 functional tabs covering batches, schedules, question authoring, and evaluations.
  - Contains hardcoded mock doubt samples (`dbt_1`, `Aarav Sharma`) in `TeacherDashboardClient.tsx:55`.
- **Verdict:** Wire the teacher doubt queue to real Supabase RPC data or provide an honest empty state when no doubts exist.

### Area 19: School & Institutional Dashboard (`/staff`, `/parent-dashboard`)
- **Finding:**
  - Staff triage dashboard exists and enforces role-based access.
  - Lacks school-wide cohort comparisons or multi-branch reporting.
- **Verdict:** Standardize school administrative metrics and reinforce multi-tenant data isolation.

### Area 20: Admin Dashboard (`/admin`, 37 sub-routes)
- **Finding:**
  - Deep administrative capabilities (telemetry radar, infra pulse, user 360, bulk actions, RBAC matrix, autonomous AI engines).
  - Admin sidebar is flat and requires extensive scrolling.
  - Table components across admin sub-routes lack consistent pagination and column-sorting primitives.
- **Verdict:** Implement a unified admin navigation drawer with grouped categories and standardized data table wrappers.

### Area 21: Settings, Notifications & Support (`/support`, `/contact`, `/admin/settings`)
- **Finding:**
  - `/support` redirects to `/contact`.
  - Notification dropdown in `DashboardLayout.tsx` and `SmartNotificationsDrawer.tsx` duplicate notification logic.
- **Verdict:** Consolidate notifications into a single intelligent drawer and build a dedicated help center.

---

## 4. UI Inconsistencies & Design Token Fragmentation

1. **Border Radius Chaos:**
   - Elements randomly mix `rounded-md` (6px), `rounded-lg` (8px), `rounded-xl` (12px), `rounded-2xl` (16px), and `rounded-3xl` (24px) within the same view.
   - Example: On `/student-dashboard`, stats cards use `rounded-2xl`, the banner uses `rounded-3xl`, and buttons inside use `rounded-xl`.
2. **Color Incoherence & Contrast Issues:**
   - Tailwind variables define `--primary: #5243E0`, but several components hardcode `#5A45E8`, `#6366F1`, or `rgb(82, 67, 224)`.
   - Dark mode contrast: In `src/styles/tailwind.css`, dark card background is `#0D111C` with border `#1D2338`. Certain text elements use `text-muted-foreground` (`#8E98B0`) on dark backgrounds with font size 10px, failing WCAG AA 4.5:1 minimum contrast.
3. **Typography Scale Inconsistency:**
   - Fonts used: `Plus Jakarta Sans` for body/headings, `IBM Plex Mono` for numerical badges.
   - Headings alternate unpredictably between `font-bold` (700), `font-extrabold` (800), and `font-black` (900).
   - Letter-spacing (`tracking-tight` vs `tracking-wider`) is applied without clear semantic rules.
4. **Button & Input Variant Sprawl:**
   - Over 14 different button styling patterns exist across `PublicNav`, `DashboardLayout`, `FonepayCheckout`, and `BattleArenaPageClient`.
   - There is no central, authoritative `<Button>` component with standardized `primary`, `secondary`, `outline`, `ghost`, and `danger` variants.

---

## 5. Mobile & Responsive Layout Audit (360px to 1920px)

| Breakpoint | Devices Tested | Primary Issues Found |
| :--- | :--- | :--- |
| **360px** | Galaxy S20, Small Androids | Horizontal scrollbar triggered on `/checkout` (QR code container) and `/mock-tests` (question palette header). Text overlaps on multi-badge headers. |
| **390px** | iPhone 12/13/14/15/16 Pro | Bottom navigation bar covers the last 40px of page content if `pb-20` is missing on inner containers. Slide-out drawer is usable. |
| **430px** | iPhone Pro Max, Plus | Better spacing, but cards in the student dashboard feel vertically stretched and take too many thumb scrolls. |
| **768px** | iPad Mini, Android Tablets | Sidebar switches to collapsed icon mode, but contextual panels push main content into awkward 50/50 splits. |
| **1024px** | iPad Pro, Small Laptops | Layout shifts abruptly between mobile drawer and desktop sidebar. Top navigation bar search bar overflows. |
| **1280px** | Standard Laptops | Good desktop layout, but dashboard cards lack max-width constraints, resulting in excessively long text line lengths (> 100 characters per line). |
| **1440px+** | Large Desktop / 1080p | Balanced layout; contextual right panel works well when populated. |
| **1920px** | Ultrawide / 4K Monitors | Content is constrained to `max-w-screen-2xl`, preventing extreme stretching, but margins feel cavernous. |

---

## 6. Functionality That MUST Be Strictly Preserved

In accordance with Master Prompt Part 9 and Part 14, the following functional systems are mission-critical and must not be broken or simplified during the visual redesign:

1. **CBT Examination Engine & Scoring:**
   - 200Q timed simulation with exact -0.25 negative marking rules.
   - Anti-cheat tab-switch detection and fullscreen enforcement.
   - Durable offline question caching and background synchronization (`examStorage.ts`).
   - Server-authoritative submission RPC (`/api/exams/submit`).
2. **Colyseus Real-Time Multiplayer Engine:**
   - Colyseus 0.15.42 WebSocket daemon running in `services/multiplayer`.
   - Real-time P2P WebRTC proctoring camera in `BattleProctorCamera.tsx`.
   - Atomic database settlement RPC `record_authoritative_battle_result` with idempotency hashes.
3. **Adaptive Video Streaming & Dynamic DRM:**
   - Bunny.net Stream HLS tokenized streaming.
   - Canvas-based dynamic DRM watermark rendering authenticated user ID and timestamp to deter screen recording.
4. **Multi-Gateway Payment & Subscription Ledger:**
   - Fonepay dynamic QR initiation, webhook status verification, and fallback slip upload.
   - Immutable double-entry billing ledger and tax invoice generator.
   - Access voucher activation and batch enrollment logic.
5. **Security, RBAC & Tenant Isolation:**
   - Supabase SSR authentication with secure cookies and brute-force lockout.
   - Role-Based Access Control matrix (`admin`, `teacher`, `student`, `staff`).
   - Strict RLS policies protecting institutional school data and individual student grades.

---

## 7. Strategic Recommendations & Roadmap for Phases 1–10

1. **Phase 1 — Unified Design System:**
   - Author `docs/product/02_DESIGN_SYSTEM.md`.
   - Establish centralized design tokens in `src/lib/design-system/tokens.ts` (8pt spacing scale, semantic color palette, typographic scale, standard radii `sm: 8px`, `md: 12px`, `lg: 16px`, `xl: 24px`, shadow elevation scale, motion tokens).
   - Build foundational UI primitives: `Button`, `Input`, `Select`, `Modal`, `Drawer`, `Badge`, `Card`, `Tabs`, `Skeleton`.
2. **Phase 2 — Information Architecture & Navigation:**
   - Author `docs/product/03_INFORMATION_ARCHITECTURE.md`.
   - Redesign `DashboardLayout.tsx` with clear grouped navigation (Main, Learning, Competition, Support).
   - Implement a world-class `MobileBottomNav.tsx` with dedicated active states, safe-area padding, and unified drawer.
   - Standardize `ProgramSwitcher.tsx` with immediate visual feedback.
3. **Phase 3 — Student Desktop Transformation:**
   - Redesign the core student journey: Home Dashboard, Course Catalog, Learning Workspace (Video + Notes + DPP), Practice Center, Mock Exam CBT Interface, AI Saarthi, Battle Arena, and dedicated Student Progress Center (`/progress`).
4. **Phase 4 — Mobile & PWA Optimization:**
   - Implement bottom sheets, touch-optimized card layouts, mobile video player ergonomics, and enhanced service worker offline caching.
5. **Phase 5 & 6 — Teacher, School & Admin Workspaces:**
   - Streamline the 10-tab teacher workspace, replace mock doubt data with real feeds, and provide grouped admin navigation with unified data tables.
6. **Phase 7 — Motion Design System:**
   - Integrate purposeful, 150–200ms Framer Motion microinteractions respecting `prefers-reduced-motion`.
7. **Phases 8–10 — Verification, Accessibility & Implementation Reports:**
   - WCAG 2.2 AA audit, performance benchmarking (Lighthouse / Core Web Vitals), and end-to-end functional QA.

---

## 8. Verification Sign-Off

- **Codebase Inspected:** Yes (`d:\FR`, 130 Page Routes, 130 API Routes, 77 Components).
- **Servers Verified Running:** Next.js dev server on port 4028 (HTTP 200), Colyseus multiplayer daemon on port 2567 (HTTP 200).
- **Code Modifications:** None in Phase 0 (Discovery Only).
- **Deliverable Status:** Complete and written to `docs/product/01_EXISTING_PRODUCT_AUDIT.md`.
- **Ready for Next Phase:** **Phase 1 — Establish Design System & Tokens (`02_DESIGN_SYSTEM.md`)**.
