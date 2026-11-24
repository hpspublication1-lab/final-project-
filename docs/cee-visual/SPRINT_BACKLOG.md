# Sprint Backlog

The record format is from `11_SPRINTS_AND_BACKLOG.md`:

`ID | requirement | existing code reference | status | owner | priority | dependencies | acceptance criteria | tests | effort | blocker | PR/commit evidence`

How to read the columns:

- **Status** describes the item today: TODO; DONE (proposal) where only the design or proposed SQL exists; BUILT (local) where code exists and passed tests locally but has not run on staging.
- **Priority:** P0 blocks the Foundation; P1 is needed for the Foundation exit; P2 can follow.
- **Effort** is illustrative engineer-days.
- **Owner:** ENG = engineering; OWNER = you; ACAD = academic staff.

| ID | Requirement | Existing code reference | Status | Owner | Priority | Dependencies | Acceptance criteria | Tests | Effort | Blocker | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|---|
| AUD-001 | Repository audit | — | DONE | ENG | P0 | — | Audit docs with file/line evidence | Doc check (refs resolve) | — | — | This PR |
| AUD-006 | Evidence-backed completion baseline | — | DONE | ENG | P0 | AUD-001 | Rubric and per-requirement evidence | — | — | — | `PROJECT_AUDIT.md` |
| FND-000 | Live schema baseline | `CURRENT_ARCHITECTURE.md` §5 | TODO | OWNER + ENG | P0 | — | Schema dump committed; diff vs migrations documented | — | 1 | DB access | — |
| FND-001 | Approve reuse plan and decisions D1–D7 | `TARGET_ARCHITECTURE.md` §13 | TODO | OWNER | P0 | AUD-001 | Decisions recorded | — | — | Owner decision | — |
| FND-002 | Architecture decision records | `TARGET_ARCHITECTURE.md` | DONE (proposal) | ENG | P0 | FND-001 | ADRs updated with approved choices | — | 0.5 | FND-001 | This PR |
| FND-003 | Additive curriculum, lesson, asset, review and publication schema | none (no `cee_*` tables) | DONE (proposal) | ENG | P0 | FND-000, FND-006a | Applied, tested, rolled back and re-applied on staging; no existing table changed | `tests/cee_visual_foundation_test.sql` (51/51 on scratch DB) | 1 (staging) | FND-000 | This PR |
| FND-004 | Scoped curriculum read APIs | `src/app/api/curriculum/route.ts` (pattern) | BUILT (local) | ENG | P0 | FND-003, FND-005 | Tree, topics and lessons return published-only, program-scoped data; empty-state copy | Route integration tests | 2 | — | `src/app/api/v1/cee/*`; integration test 12/12 vs PostgREST |
| FND-005 | Scoped RBAC, enforced on the server | `src/lib/auth/serverGuard.ts:65`, `rbac.ts:132,153` | PARTIAL | ENG | P0 | FND-003 | `verifyCeeScope` denies out-of-scope program/subject; SoD on review and publish; overrides persisted | Unit + integration (Biology editor vs IELTS/IOE) | 2 | — | Rules + tests in `src/lib/cee-visual/authz.ts`; CMS routes pending |
| FND-006 | CI with a test database and migration dry-run | `.github/workflows/ci.yml:31-35` | TODO | ENG | P0 | FND-000 | CI job runs Postgres, applies baseline + proposed migration + tests + rollback | CI run | 1.5 | — | — |
| FND-006a | Staging Supabase project; previews pointed at it | — | TODO | OWNER | P0 | — | Preview deployments use staging env vars | Manual check | 0.5 | Owner | — |
| FND-007 | Asset identity and version records | none | DONE (proposal) | ENG | P0 | FND-003 | Covered by schema; service layer CRUD | Unit | 1 | — | Schema in this PR |
| FND-008 | Quarantine upload, validation, scan, promotion | `src/lib/security/uploadValidation.ts:62,152` (reuse) | PARTIAL | ENG | P0 | FND-007 | Signed upload; checksum recomputed; GLB external URIs and bad SVGs rejected; scan status recorded; promote to content-addressed key | Integration: valid GLB, malicious SVG, oversize, wrong magic bytes, retry/dead | 3 | Scanner choice (D7) | Validators + attack tests in `src/lib/cee-visual/validators/`; upload pipeline and scanner pending |
| FND-009 | Manifest schema and validator | `src/lib/validation/schemas.ts` (zod pattern) | BUILT (local) | ENG | P0 | FND-007 | zod schema; node names checked against GLB; fallback required for 3D | Unit: missing hotspot node, nonexistent clip, missing fallback | 1 | — | `schemas.ts`, `validators/manifest.ts`, tests |
| FND-010 | Visual player shell and GLB renderer | `LessonPlayerClient.tsx:34` (host) | BUILT (local) | ENG | P0 | FND-009 | R3F renderer lazy-loaded; orbit/zoom/pan; layers; hotspots; guided sequence | Component tests; Playwright | 4 | D2 | `src/components/visual-player/`; checked in Chrome |
| FND-011 | Error states and accessible fallback | — | BUILT (local) | ENG | P0 | FND-010 | WebGL missing or context lost → fallback; reduced motion; keyboard; screen-reader notes | Playwright with WebGL disabled; axe | 2 | — | No-WebGL, context-loss, keyboard and reduced-motion paths checked in Chrome |
| FND-012 | Admin asset library and preview | `src/app/admin/uploads/…` (UI patterns) | TODO | ENG | P1 | FND-008 | Upload, status, validation report, preview by signed URL, manifest editor | Playwright | 3 | — | — |
| FND-013 | Draft lesson editor | `src/app/admin/curriculum/…` (patterns) | TODO | ENG | P0 | FND-004 | Create lesson, edit draft, pin asset and question revisions | Playwright | 3 | — | — |
| FND-014 | Revision history and immutability | none | DONE (proposal, DB level) | ENG | P0 | FND-013 | Edit after submit creates a new revision; history view | DB tests (CEE-006, CEE-010) + API tests | 1.5 | — | Schema tests |
| FND-015 | Review queue and decisions | `AiContentReviewClient.tsx:132` (AI only; not reused for approval) | TODO | ENG | P0 | FND-005, FND-014 | Six gates; assignment; append-only decisions; SoD | DB tests + API + Playwright | 3 | Reviewers named | — |
| FND-016 | Transactional publication | none | DONE (proposal, DB level) | ENG | P0 | FND-015 | `cee_publish_revision` via API with idempotency key; errors mapped | DB tests (CEE-005, CEE-010) + API | 1 | — | Schema tests |
| FND-017 | Scoped audit logs and authorisation tests | `src/lib/services/auditService.ts:35` | TODO | ENG | P1 | FND-005 | Every CMS action audited with request id; audit viewer scoped | Integration | 1.5 | — | — |
| FND-018 | Curriculum-to-lesson mapping validation | none | DONE (proposal, DB level) | ENG | P0 | FND-004 | Cross-program blocked; verified syllabus required to publish | DB tests (CEE-002) + API | 1 | Syllabus document | Schema tests |
| FND-019 | Mobile WebView bridge | `src/lib/supabase/route-auth.ts:47` (bearer) | PARTIAL | ENG | P1 | FND-011 | Versioned messages validated both sides; pause/resume; no privileged commands | Harness tests | 3 | Mobile code (G1) | Protocol in `src/lib/cee-visual/bridge.ts`, unit-tested; harness pending mobile code |
| FND-020 | Validated progress and server completion; MCQ attempts | `src/app/api/learn/progress/route.ts:35` (anti-pattern); `src/app/api/exams/submit/route.ts:185` (reuse grading) | BUILT (local) | ENG | P0 | FND-016 | Duplicate events no credit; completion computed on the server; answers revealed after submit | Integration (CEE-008, CEE-009) | 3 | Answer-key lockdown merged | Server completion, grading, idempotent attempts; integration-tested |
| FND-021 | Integration and E2E suite | none (no Playwright) | PARTIAL | ENG | P0 | FND-006, FND-020 | Full editor → review → publish → student flow on staging | Playwright on staging | 3 | Staging | Local PostgREST integration test + Chrome end-to-end; staging E2E pending |
| FND-022 | Reference Android benchmarks | none | TODO | ENG | P1 | FND-011 | FPS, first render and memory recorded on a named device | Recorded runs | 1 | Device | — |
| FND-023 | Security and accessibility QA | `rlsPermissionMatrix.test.ts` (static) | TODO | ENG | P0 | FND-021 | Authz matrix, upload fuzz, IDOR, XSS checks; axe clean | Recorded runs | 2 | — | — |
| FND-024 | Staging pilot, monitoring, rollback rehearsal | Vercel rollback (`dpl_A8Rq7vfY…` precedent) | TODO | ENG + OWNER | P0 | FND-021–023 | Flag-gated rollout plan; rollback and down-migration rehearsed | Recorded rehearsal | 1.5 | — | — |
| PRE-01 | Merge the answer-key lockdown | `MCQPreviewSection.tsx:60`; commit `4c30093` | TODO | OWNER + ENG | P0 | FND-000 | Students can't select `correct_answer` | Re-run the commit's tests | 1 | Approval | — |
| PRE-02 | Apply the role lockdown migration | `20261123130000_signup_trigger_and_role_lockdown.sql` | TODO | OWNER | P0 | FND-000 | Review query clean | Migration review query | 0.5 | Approval | — |
| PRE-03 | Close public SVG uploads | `20260715050000_admin_uploads.sql:13` | TODO | ENG | P1 | FND-000 | SVG no longer accepted in public buckets | Integration | 0.5 | — | — |
| CONT-01 | Approved heart model, fallback and captions | — | TODO | OWNER + ACAD | P0 (pilot) | — | Rights recorded; expert-reviewed version | Review decisions | — | Content source | — |
| CONT-02 | Official syllabus recorded and verified | — | TODO | ACAD | P0 (pilot) | FND-003 | Source URL, hash and verifier stored | DB check | — | Document | — |

**Total engineering estimate for the Foundation:** ≈ 46 engineer-days (illustrative), excluding content and review time. Recalibrate after Week 1.
