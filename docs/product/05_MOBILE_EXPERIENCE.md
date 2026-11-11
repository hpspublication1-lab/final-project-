# SAMYAK TUTOR — PHASE 4: MOBILE & PWA ARCHITECTURE REPORT
**Document ID:** `docs/product/05_MOBILE_EXPERIENCE.md`  
**Version:** 1.0.0 (Master Mobile & PWA Strategy)  
**Date:** November 10, 2026  
**Status:** Approved & Validated  
**Workspace:** `d:\FR` | **Branch:** `feature/product-transformation`  
**Author:** Multidisciplinary Product Development Team (Mobile Application Engineer, Senior React Engineer, QA & Performance Engineer)

---

## 1. Mobile-First Philosophy: Beyond Compressed Desktop

A common failure in educational platforms is compressing desktop web pages down to mobile widths, resulting in tiny tap targets, awkward horizontal tables, and illegible video controls.

Samyak Tutor treats mobile not as a viewport breakpoint, but as a **dedicated primary product surface**:
1. **Thumb-Driven Zone Design:** All primary navigation and frequent actions are located within the lower third of the screen.
2. **Accessible Tap Targets:** Every interactive button, pill, checkbox, and menu item complies with the **WCAG 2.2 AA minimum of 44x44 CSS pixels**.
3. **Safe-Area Insets:** Dynamic handling of modern device notches, dynamic islands, and home-indicator swipe bars via CSS environment variables:
   ```css
   padding-bottom: max(0.5rem, env(safe-area-inset-bottom));
   padding-top: max(0.5rem, env(safe-area-inset-top));
   ```
4. **Zero Accidental Navigation:** Disabled pull-to-refresh on exam and video interfaces to prevent accidental test submission or lecture disruption.

---

## 2. Mobile Navigational Architecture

### 2.1 5-Tab Bottom Navigation Bar
Implemented in [`src/components/navigation/MobileBottomNav.tsx`](file:///d:/FR/src/components/navigation/MobileBottomNav.tsx):
```
┌───────────────────────────────────────────────────────────┐
│   [Home]     [Learn]    [Practice]    [Exams]   [Compete] │
│     🏠          📖          ⚡           📝         ⚔️    │
└───────────────────────────────────────────────────────────┘
```
- **Height:** 68px (inclusive of safe-area inset).
- **Z-Index:** 40 (floats above content, rests below modal dialogs).
- **Active Visual Treatment:** Solid Royal Indigo icon with a subtle `bg-primary/10` rounded background and bold primary label.
- **Micro-Haptic Feedback:** CSS active scaling `active:scale-95` on tap.

### 2.2 Slide-Out Mobile Navigation Drawer
For non-daily destinations, the top app bar provides a hamburger toggle revealing a modern drawer:
- Active Course Switcher with instant track switching.
- Dedicated link to the **My Progress & Analytics Center** (`/progress`).
- Spaced Repetition Flashcard deck (`/flashcards`).
- Mistake Book ("Galti Sudhar") (`/mistake-analyser`).
- Official Tax Invoices & Receipt Verification (`/billing`).
- User Profile & Gamer Tag Settings (`/profile`).

---

## 3. Key Mobile Screen Optimizations

### 3.1 Mobile Video Player Ergonomics ([`BunnyHlsPlayer.tsx`](file:///d:/FR/src/components/video/BunnyHlsPlayer.tsx))
- **16:9 Aspect Ratio Lock:** Player scales cleanly across 360px to 430px viewports without horizontal overflow.
- **Double-Tap Seeking:** Invisible left and right touch zones allow double-tapping to jump 10 seconds backward or forward.
- **Touch-Friendly Controls:** Expanded control buttons to 44px with a minimum 8px margin between icons.
- **Orientation Adaptation:** Automatically expands to full-screen landscape upon device rotation.
- **Audio-Only Mode:** One-tap toggle disables video rendering and streams audio-only HLS to conserve student mobile data plans in rural Nepal.

### 3.2 Mobile CBT Examination UI ([`MockTestsPageClient.tsx`](file:///d:/FR/src/app/mock-tests/components/MockTestsPageClient.tsx))
- **Persistent Sticky Exam Bar:** Shows current question number (e.g. `Q 42 / 200`), remaining time with color-coded warning (< 10 mins turn amber; < 2 mins pulse red), and direct submit button.
- **Bottom Sheet Question Palette:** On mobile, the 200-question grid is housed in an expandable bottom sheet rather than an intrusive side panel. Swiping up reveals question status dots (`Answered`, `Marked`, `Unvisited`); tapping any dot jumps to that question and automatically collapses the sheet.
- **Full-Width Tap Options:** Answer options (A, B, C, D) are rendered as full-width cards with a minimum height of 52px, preventing mis-taps.

### 3.3 Mobile 1v1 Battle Arena ([`BattleArenaPageClient.tsx`](file:///d:/FR/src/app/battle-arena/components/BattleArenaPageClient.tsx))
- **Split Competition HUD:** Top HUD features competitor avatars and live animated score bars.
- **Floating Proctor Camera:** The WebRTC proctoring camera collapses into a compact 72x96px picture-in-picture tile in the top-right corner, ensuring the quiz question remains completely unobstructed.
- **Rapid Answer Buttons:** 4 prominent quadrant buttons allow instant reflex-speed answering within the 15-second countdown.

---

## 4. Progressive Web Application (PWA) Implementation

Samyak Tutor is an installable, standards-compliant Progressive Web Application.

### 4.1 Manifest Specification (`public/manifest.json`)
```json
{
  "name": "Samyak Tutor — Learn Smarter. Score Higher.",
  "short_name": "Samyak Tutor",
  "description": "Nepal's premier education platform for SEE Class 10 and CEE Medical entrance preparation.",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#07090E",
  "theme_color": "#5243E0",
  "orientation": "portrait-primary",
  "scope": "/",
  "lang": "en",
  "categories": ["education"],
  "icons": [
    {
      "src": "/assets/images/app_logo.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/assets/images/app_logo.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

### 4.2 Service Worker Caching Strategy (`public/sw.js`)
1. **Static Core Assets (Cache First):** App logo, manifest, fonts (`Plus Jakarta Sans`, `IBM Plex Mono`), and essential CSS stylesheets are stored in cache `samyak-cee-v2` for immediate first-paint on slow 3G connections.
2. **Navigation Fallback:** If a student navigates while completely offline, the service worker catches the navigation failure and renders the cached application shell with an informative offline status indicator.
3. **Data Safety Exception:** API requests (`/api/*`) are never cached stale to prevent serving outdated test scores, exam questions, or security tokens.

---

## 5. Native Application Roadmap (Honest Assessment)

In strict accordance with Master Prompt Part 3.2 and Part 12:
> *"Inspect whether native Android/iOS application projects already exist. If the existing project only contains a PWA, fully optimize the PWA and establish reusable design tokens and API contracts for future native applications. Do not falsely label a PWA as a native application."*

### 5.1 Repository Audit Finding
Inspection of `d:\FR` confirms **no native Android (Java/Kotlin), iOS (Swift/Obj-C), React Native, or Flutter projects currently exist** within this repository. The platform is currently a high-performance Next.js 15 PWA.

### 5.2 Native Transition Roadmap (Phase 2 Future Horizon)
To ensure future mobile development can proceed with zero backend re-architecting, the following contracts and tokens have been established:
1. **Design Token Parity:** The token structure in [`src/lib/design-system/tokens.ts`](file:///d:/FR/src/lib/design-system/tokens.ts) is 100% JSON-serializable and can be directly imported into React Native StyleSheet or Flutter theme extensions.
2. **Stateless REST & WebSocket Contracts:**
   - Auth: Supabase Auth JWT tokens via `/api/auth/*`.
   - Practice & Exams: Clean JSON payload schemas in `/api/exams/sync` and `/api/curriculum`.
   - Colyseus Multiplayer: Native Colyseus client SDKs (`colyseus.js` / `colyseus-unity`) are fully compatible with the existing Node.js daemon running on port 2567.

---

## 6. Verification & Sign-Off

- **Responsive Viewports Tested:** 360px, 390px, 430px, 768px.
- **PWA Status:** Valid `manifest.json`, active `sw.js` registered via `ServiceWorkerRegister.tsx`.
- **Navigation Implemented:** [`src/components/navigation/MobileBottomNav.tsx`](file:///d:/FR/src/components/navigation/MobileBottomNav.tsx).
- **TypeScript Check:** `npx tsc --noEmit` exits with **0 errors**.
- **Deliverable Status:** Complete and written to `docs/product/05_MOBILE_EXPERIENCE.md`.
- **Ready for Next Phase:** **Phase 5 — Teacher & Institutional Experience (`06_TEACHER_INSTITUTION_EXPERIENCE.md`)**.
