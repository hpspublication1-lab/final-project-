# Samyak Guru — CEE Visual Intelligence: Gap Analysis (AUD-002)

**Evaluation Date**: November 23, 2026  
**Methodology**: Evidence-backed comparative analysis between `Samyak_Guru_CEE_Blueprint` specifications and the inspected `d:\FR` repository.

---

## 1. Domain-by-Domain Weighted Completion Matrix

Per `12_CLAUDE_EXECUTION_PROMPT.md`, completion is computed across 10 strictly weighted domains grounded in verifiable code and test evidence:

| Domain | Weight | Existing Implementation Evidence | Identified Gaps | Domain Completion | Weighted Contribution |
|---|---|---|---|---|---|
| **1. Architecture & Boundaries** | **10%** | Next.js 15 App Router, Edge Middleware, modular `src/lib/`, clean separation of concerns. (545 passing tests). | Needs unified visual intelligence domain namespace (`src/lib/cee/visual/...`). | **75%** | **7.5%** |
| **2. Curriculum & Data Isolation** | **15%** | Programs, subjects, chapters, lessons tables exist; program configs isolate feature sets (`courseFeatures.ts`). | Missing immutable syllabus snapshots (`cee_syllabus_versions`), revision tracking (`cee_lesson_revisions`), and strict isolation foreign keys. | **40%** | **6.0%** |
| **3. CMS & Publishing Workflow** | **15%** | 33 Admin sections exist including curriculum, lessons, and audit logs. | Missing multi-gate academic review pipeline (Director, Expert, Visual, Rights), version diffing, and transactional publication snapshot engine. | **30%** | **4.5%** |
| **4. Asset Pipeline & Security** | **15%** | Storage upload endpoints, rate limiting, and basic file validation exist. | Missing quarantine worker, 3D GLB/glTF parser/validator, SVG sanitization filter, and automated manifest compiler. | **20%** | **3.0%** |
| **5. Universal Visual Player** | **15%** | Complete 2D simulation drift engine & hotspot logic in prototype (`FOR BIOLOGY ANIMATION`); 26 anatomical diagrams in `public/`. | Missing Three.js/WebGL 3D orbit viewer, universal manifest shell, and WebGL context loss recovery. | **45%** | **6.75%** |
| **6. Assessment & Progress Engine** | **10%** | Robust 200-question CBT engine, mistake analyzer, practice API, and user progress endpoints. | Missing visual hotspot question links (`cee_question_asset_links`) and idempotent player events (`cee_player_events`). | **55%** | **5.5%** |
| **7. Mobile Bridge & Experience** | **5%** | Responsive mobile layouts, PWA service worker, mobile bottom navigation. | Missing versioned JSON RPC bridge protocol (`PLAYER_READY`, `STRUCTURE_SELECTED`) for WebView/Flutter integration. | **35%** | **1.75%** |
| **8. Security & RBAC Enforcement** | **5%** | 11-tier RBAC hierarchy, super admin whitelist, brute force lockout, IP rate limiting. | Needs upload manifest schema validation and GLB external URI blocklists. | **80%** | **4.0%** |
| **9. Testing, DevOps & Operations** | **10%** | Vitest with 545 passing tests, TypeScript clean (0 errors), Next.js build clean, GitHub Actions CI. | Visual intelligence unit and integration test suite needs to be written. | **65%** | **6.5%** |
| **TOTALS** | **100%** | **Robust Platform Foundation Verified** | **Visual Intelligence Layer To Be Added** | — | **45.5%** |

---

## 2. Summary of Strategic Gaps & Next Moves

1. **Database Schema**: Additive migration (`supabase/migrations/20261124000000_cee_visual_intelligence_core.sql`) to introduce the canonical `cee_*` tables without altering or dropping any pre-existing tables.
2. **Universal Visual Player**: Implement `VisualPlayerShell.tsx` supporting dual runtimes:
   - **Mode A (3D WebGL Engine)**: Three.js orbit/pan/zoom, layer isolation, explode views, and coordinate hotspots.
   - **Mode B (2D Biological Simulation Engine)**: Integrate the existing drift/stage animation engine from `FOR BIOLOGY ANIMATION`.
   - **Mode C (Accessible Fallback)**: 100% accessible SVG/PNG diagram with step-by-step explanatory text.
3. **Pilot Vertical Slice**: Construct the full end-to-end Human Heart lesson (External view → 4 Chambers → Valves & Flow → Cardiac cycle → Hotspots → MCQs → Progress).
