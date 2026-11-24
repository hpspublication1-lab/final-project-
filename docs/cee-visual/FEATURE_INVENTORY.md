# Feature Inventory — target requirements vs. the code

61 requirements taken from handoff files 02–10, grouped by the weighted domains in `12_CLAUDE_EXECUTION_PROMPT.md`.

## How to read the table

**Status** says what the code does against the target:

| Status | Meaning |
|---|---|
| COMPLETE | Meets the requirement |
| PARTIAL | Some of it exists |
| BROKEN | Exists but does the wrong thing |
| MISSING | Not there |
| BLOCKED | Can't be done or assessed without something outside the repo |
| UNVERIFIED | Can't tell from here |

**Code, Tests and Runtime** are kept separate, as the handoff asks:

| Column | Values |
|---|---|
| Code | ✓ present · ½ partial · — absent |
| Tests | ✓ an automated test covers it · — none |
| Runtime | ✓ seen working on the live site on 23 Nov 2026 · ✗ seen failing · ? not observed |

I had no login, so nothing behind one was observed.

## A. Architecture — 10%

| ID | Requirement | Status | Evidence | Code | Tests | Runtime |
|---|---|---|---|---|---|---|
| A1 | CEE visual domain as a module with explicit interfaces (02 §Suggested repo structure) | MISSING | No module, routes or types for visual lessons anywhere in `src/` | — | — | ? |
| A2 | Program isolation primitive used by reads (03) | PARTIAL | `src/lib/courses/courseIds.ts:155` places rows by stored value, the repo's subject names, then title; ownership is inferred, not stored | ✓ | ✓ `courseIds.test.ts` | ✓ live per-course responses |
| A3 | Feature flags for gradual rollout (02 §Failure modes, 10 §CI/CD) | PARTIAL | Build-time env flags only (`NEXT_PUBLIC_STRICT_COURSE_ISOLATION`, `NEXT_PUBLIC_PHONE_LOGIN`); changing one needs a redeploy; no per-user targeting | ½ | — | ✓ |
| A4 | Versioned request validation (05 §Contracts) | PARTIAL | `zod` in `src/lib/validation/schemas.ts:1` for a few routes; most parse JSON ad hoc, e.g. `src/app/api/learn/progress/route.ts:16-27` | ½ | ✓ some | ? |
| A5 | Standard envelope `{data, meta.requestId}` / `{error.code}` (05) | MISSING | Routes return ad-hoc `{success, error}` or `{error}` | — | — | — |
| A6 | Migrations reproduce the live schema (04 §Constraints and migrations) | BROKEN | Live lacks `program_type` that migrations add; `chapters` columns differ (`CURRENT_ARCHITECTURE.md` §5) | ½ | — | ✗ |

## B. Curriculum and data — 15%

| ID | Requirement | Status | Evidence | Code | Tests | Runtime |
|---|---|---|---|---|---|---|
| B1 | Program registry (03 §Canonical hierarchy) | UNVERIFIED | `programs` table defined in `supabase/migrations/20260811_core_programs_entitlements.sql`; no code reads it; whether it exists live is unknown | ½ | — | ? |
| B2 | Syllabus versions with source, hash and verifier (03 §Syllabus governance, 04 `cee_syllabus_versions`) | MISSING | No syllabus table or record | — | — | — |
| B3 | Subject → chapter tree for CEE | COMPLETE | Live: Biology (5 chapters incl. Human Physiology), Chemistry (4), Physics (4), Mental Agility (0) | ✓ | — | ✓ |
| B4 | Topic level under chapters (03) | MISSING | `chapters` has no parent or topic table; nothing below chapter | — | — | — |
| B5 | Learning objectives mapped to topics (04 `cee_learning_objectives`) | MISSING | None | — | — | — |
| B6 | Explicit mapping tables for intentionally shared content (03 §Isolation) | MISSING | None; sharing today happens only by inference | — | — | — |
| B7 | Server-side program scope on every read (03) | PARTIAL | Scoped since PR #4: `/api/curriculum`, `/api/resources`, practice, mock tests. Inferred, not stored; search is not scoped | ½ | ✓ | ✓ |
| B8 | Stable lesson identity + immutable revisions (04 `cee_lessons`, `cee_lesson_revisions`) | MISSING | Lessons are mutable `video_lectures`/`notes` rows | — | — | — |

## C. CMS and publishing — 15%

| ID | Requirement | Status | Evidence | Code | Tests | Runtime |
|---|---|---|---|---|---|---|
| C1 | Draft lesson editor (08 `LessonEditor`) | PARTIAL | Admin Curriculum and Uploads create notes and videos directly (`src/app/admin/curriculum/…`, `src/app/admin/uploads/…`); no draft-revision concept beyond `is_active` | ½ | — | ? |
| C2 | Revision history; edits create a new draft (08 §State machine) | MISSING | Rows are updated in place | — | — | — |
| C3 | Human academic review queue and append-only decisions (08 §Review gates) | MISSING | Only an AI scorer that labels content "Approved for Publishing" at score ≥ 70 (`src/app/admin/ai-review/components/AiContentReviewClient.tsx:132`), kept in page memory; conflicts with 09 ("AI cannot override") | — | — | — |
| C4 | Transactional, immutable publication (08 §Publication transaction) | MISSING | Publishing is a boolean flip, e.g. `is_published: form.status === 'published'` (`src/app/admin/questions/components/AdminQuestionsClient.tsx:435`) | — | — | — |
| C5 | Separation of duties (08) | MISSING | No creator/approver distinction | — | — | — |
| C6 | Append-only audit log (04 `cee_audit_logs`) | PARTIAL | `AuditService` with seal (`src/lib/services/auditService.ts:35, 134`); table in `20260911_normalized_lms_schema.sql:88`. Browser-side admin writes bypass it; live table unverified | ½ | — | ? |
| C7 | Admin selectors scoped to a program by default (03) | PARTIAL | Every admin screen asks for the course since PR #4; any admin can still choose any course | ½ | — | ? |

## D. Asset pipeline — 15%

| ID | Requirement | Status | Evidence | Code | Tests | Runtime |
|---|---|---|---|---|---|---|
| D1 | Asset identity and immutable versions (04 `cee_visual_assets`, `cee_asset_versions`) | MISSING | None | — | — | — |
| D2 | Private quarantine with expiring upload authorization (07 §File security) | MISSING | Browser uploads straight into mostly public buckets (`AdminUploadsClient.tsx:370, 572, 585, 792`; buckets `20260715050000_admin_uploads.sql:10-14`) | — | — | — |
| D3 | Type, size and magic-byte validation | PARTIAL | `validateUploadFile` (`src/lib/security/uploadValidation.ts:62`) and `validateMagicBytes` (`:152`) exist and are tested, but no upload path calls them | ½ | ✓ | — |
| D4 | Malware scanning (07) | MISSING | No scanner | — | — | — |
| D5 | GLB structure validation, external-reference checks, optimisation (07) | MISSING | No glTF tooling installed | — | — | — |
| D6 | SVG sanitisation (07) | MISSING | SVG accepted into the **public** `diagrams-images` bucket (`20260715050000_admin_uploads.sql:13`) | — | — | — |
| D7 | Checksums; immutable published bytes (04) | MISSING | `upsert: true` overwrites files in place | — | — | — |
| D8 | Signed, expiring delivery URLs (05 §Cross-cutting) | PARTIAL | Video only (`src/app/api/video/sign/route.ts:95-115`); without `BUNNY_TOKEN_KEY` it returns the unsigned URL (`:100`). No `BUNNY_*` variable is listed in the Vercel project settings | ½ | — | ? |
| D9 | Background processing with retries and dead-letter (02 §Failure modes) | MISSING | Only two daily crons (`vercel.json`); no job table or queue | — | — | — |

## E. Visual player — 15%

| ID | Requirement | Status | Evidence | Code | Tests | Runtime |
|---|---|---|---|---|---|---|
| E1 | 3D GLB renderer (06 `Model3DRenderer`) | MISSING | No three.js / WebGL dependency | — | — | — |
| E2 | 2D diagram renderer (06 `Diagram2DRenderer`) | PARTIAL | Lessons render markdown, KaTeX and images; no interactive SVG, layers or hotspots | ½ | — | ✓ |
| E3 | Versioned manifest schema + validator (06 §Manifest) | MISSING | None | — | — | — |
| E4 | Hotspots, layers, timeline, guided tour (06 §Interaction contract) | MISSING | None | — | — | — |
| E5 | Accessible fallback, reduced motion, WebGL context-loss recovery (06) | MISSING | None for lesson content | — | — | — |
| E6 | Player shell that hosts renderers (06 `VisualPlayerShell`) | PARTIAL | `src/app/learn/[lessonId]/components/LessonPlayerClient.tsx:34` (1,417 lines) handles video, PDF, text and quiz; no renderer registry | ½ | — | ✓ |
| E7 | Video renderer (06 `VideoRenderer`) | COMPLETE | `src/components/video/BunnyHlsPlayer.tsx` (hls.js), in production use | ✓ | — | ✓ |

## F. Assessment and progress — 10%

| ID | Requirement | Status | Evidence | Code | Tests | Runtime |
|---|---|---|---|---|---|---|
| F1 | Server-side scoring (09) | COMPLETE | `src/app/api/exams/submit/route.ts:185` grades from the database answer key | ✓ | ✓ `src/lib/scoring.test.ts` (library) | ? |
| F2 | Answers hidden until submission (09) | BROKEN | The home page reads `correct_answer` from the browser (`src/app/components/MCQPreviewSection.tsx:60`). The lockdown is commit `4c30093` on branch `ui/design-system-polish`, never merged | ✓ (unmerged fix) | — | ✗ |
| F3 | Frozen question revisions used by attempts (09) | MISSING | Questions are mutable rows | — | — | — |
| F4 | Question reviewer status (09) | PARTIAL | UI type has `'reviewed'` (`AdminQuestionsClient.tsx:71`) but only `is_published` is stored (`:435`) | ½ | — | ? |
| F5 | Idempotent progress events with a unique event id (04 `cee_player_events`) | MISSING | Progress upserts one row per user and lesson (`src/app/api/learn/progress/route.ts:87`); no event id | — | — | — |
| F6 | Server-computed completion; never trust `completed: true` (05, 09) | BROKEN | `const completed = isCompleted === true \|\| percentage >= 90` takes the client's flag (`route.ts:35`) | ✓ | — | ? |
| F7 | Questions linked to an asset version and visual state (04 `cee_question_asset_links`) | MISSING | None | — | — | — |

## G. Mobile — 5%

| ID | Requirement | Status | Evidence | Code | Tests | Runtime |
|---|---|---|---|---|---|---|
| G1 | Mobile client code available to integrate the player (06 §Mobile bridge) | BLOCKED | The app `com.samyakguru.learning` is not in this repository | — | — | — |
| G2 | Mobile auth to the same APIs | COMPLETE | Bearer token accepted (`src/lib/supabase/route-auth.ts:47`) | ✓ | ✓ `src/lib/mobile/__tests__/mobileAppReadiness.test.ts` | ? |
| G3 | Versioned WebView message bridge (06) | MISSING | None | — | — | — |
| G4 | Remote config / feature switch for the app | PARTIAL | `src/app/api/mobile/config/route.ts:10` returns hard-coded flags; no visual-lesson flag | ½ | — | ✓ |

## H. Security — 5%

| ID | Requirement | Status | Evidence | Code | Tests | Runtime |
|---|---|---|---|---|---|---|
| H1 | Server-side RBAC on every protected write (10) | PARTIAL | 25 route handlers call `verifyServerPermission` (`src/lib/auth/serverGuard.ts:65`); 13 admin screens write from the browser, relying on live row security that I can't inspect | ½ | ✓ `rlsPermissionMatrix.test.ts` (static) | ? |
| H2 | Program- and subject-scoped permissions (03, 08 §RBAC) | MISSING | Permissions are role-wide (`src/types/lms/index.ts:20`) | — | — | — |
| H3 | Persistent, correct permission overrides | BROKEN | Overrides live in process memory (`src/lib/auth/rbac.ts:132`). `k.split(':')` (`:153`) cuts `role:content:read` into three parts, so `perm` becomes `content` | ✓ | — | ✗ |
| H4 | Rate limits (10) | PARTIAL | `src/lib/security/rateLimiter.ts`, in memory per serverless instance | ½ | ✓ | ? |
| H5 | CSP and security headers | COMPLETE | Live responses carry CSP, HSTS, `X-Frame-Options: DENY`, `nosniff` (observed 23 Nov) | ✓ | — | ✓ |
| H6 | Untrusted GLB/SVG handling (10 §Threat model) | MISSING | See D5, D6 | — | — | — |

## I. Tests and deployment — 10%

| ID | Requirement | Status | Evidence | Code | Tests | Runtime |
|---|---|---|---|---|---|---|
| I1 | Unit tests in CI on every PR | COMPLETE | `.github/workflows/ci.yml:31-35`; 608 tests passed on PR #4 | ✓ | ✓ | ✓ |
| I2 | Integration tests against a real database | MISSING | CI has no database | — | — | — |
| I3 | End-to-end tests (10 §E2E) | MISSING | No Playwright or Cypress | — | — | — |
| I4 | Isolated staging (10 §CI/CD) | PARTIAL | Vercel previews exist but use the **production** database | ½ | — | ✓ |
| I5 | Rehearsed rollback (10 §Release gates) | PARTIAL | Vercel instant rollback is available (previous deployment `dpl_A8Rq7vfY…`); not rehearsed; no database rollback practice | ½ | — | ? |
| I6 | Migration dry-run before release (04) | MISSING | No database in CI; schema drift (A6) | — | — | — |
| I7 | Monitoring, alerts, correlation IDs (10 §Observability) | PARTIAL | Vercel runtime logs only; no metrics, alerts or request IDs | ½ | — | ✓ |

## Totals

| | Complete | Partial | Broken | Missing | Blocked | Unverified | Total |
|---|---|---|---|---|---|---|---|
| Requirements | 6 | 18 | 4 | 31 | 1 | 1 | 61 |

The weighted completion score and its method are in `PROJECT_AUDIT.md`.

## The handoff's critical test scenarios today

`14_ACCEPTANCE_CRITERIA_AND_STATUS.md` names twelve scenarios. Here is where each stands:

| ID | Scenario | Can it be tested today? |
|---|---|---|
| CEE-001 | Correct Biology mapping | Partly: Biology → Human Physiology exists; no topic or mapping records |
| CEE-002 | Reject an unapproved Physics→Biology mapping | No: no mapping model |
| CEE-003 | Reject a malicious upload | No: uploads aren't validated (D3, D6) |
| CEE-004 | Student denied a draft | No: no drafts (C2) |
| CEE-005 | Reviewer rejection blocks publish | No: no review (C3) |
| CEE-006 | Edit creates a new draft | No (C2) |
| CEE-007 | WebGL fallback | No (E1, E5) |
| CEE-008 | Valid progress | Partly: progress exists but trusts the client (F6) |
| CEE-009 | Duplicate event gives no double credit | No (F5) |
| CEE-010 | Immutable publication | No (C4) |
| CEE-011 | Truthful empty state | **Yes**: implemented in PR #4 for the existing course pages; needs the visual-lesson copy |
| CEE-012 | Rollback after regression | Partly: Vercel rollback exists, not rehearsed (I5) |
