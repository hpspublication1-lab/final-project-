# Foundation Baseline (25 Nov 2026)

The record of where the CEE Visual Intelligence Foundation stands. It is measured against `Samyak_Guru_CEE_Blueprint/14_ACCEPTANCE_CRITERIA_AND_STATUS.md` and the release gates in file 10.

**Authoritative implementation:** PR #6, branch `feat/cee-visual-foundation`, baseline commit `1a01ca7` (24 Nov). It includes the Phase 0 documents from PR #5.

**Live state:**
- Production is still `a16e0bd` (deployment `dpl_C4dMcPdZYSizaoaUqwtGfNh1GCZi`).
- Nothing from PR #6 is merged or deployed to production.
- No migration has been applied to any Supabase project.
- The feature flag does not exist yet on any real database.

**Preview:** `dpl_BChpq6v4Kwsp25oyXzEyPGpLXHr8`, a preview build of `1a01ca7`. It runs against the production database, where the `cee_*` tables don't exist, so every new route correctly answers 404.

## How evidence is graded

| Grade | Meaning |
|---|---|
| **VERIFIED (local)** | Code exists and passed automated tests against real Postgres 16, a real PostgREST 12 and real Chrome in the development workspace. Not yet run on staging. |
| **PARTIAL** | Some of the criterion is built and tested; the rest is named. |
| **NOT STARTED** | No code yet. |
| **BLOCKED** | Can't progress without the named owner input. |

The handoff's rule applies: nothing counts as complete on the strength of mockups, screenshots or documents alone. Every VERIFIED line names the test that proves it.

## Test evidence at the baseline

| Suite | Runs against | Result |
|---|---|---|
| `supabase/proposed/tests/cee_visual_foundation_test.sql` | Fresh Postgres 16 | **61/61** |
| Rollback, with a publication present | Postgres 16 | Refuses (as designed) |
| Rollback, clean | Postgres 16 | Leaves 0 tables and 0 functions; re-apply OK |
| Chosen schema over the superseded tables | Postgres 16 | Stops at the first clash; creates nothing |
| Unit tests: `schemas`, `authz`, `grading-completion`, `player-bridge-http`, `eventQueue`, `validators` (attack files generated per case) | Node | 714 for the whole site, all passing |
| `api.integration.test.ts` (student API) | PostgREST 12 → Postgres 16 | **12/12** |
| `admin.integration.test.ts` (editorial flow) | PostgREST 12 → Postgres 16 | **9/9** |
| Player scenarios: 3D, fallback, context loss ×2, no WebGL, keyboard, reduced motion, mobile | Chrome (SwiftShader) | All behaved as designed |
| Student lesson page: access gating, progress, quiz, reload persistence | Chrome, dev and production builds | Pass |
| Full flow: editor → 3 reviewers → publisher → student | Chrome, dev and production builds | Pass |
| Answer keys absent from the student page HTML | Production build | Absent (dev mode serialises them; production doesn't) |
| Security policy: `blob:` textures blocked before, allowed after | Chrome, production build | Confirmed |
| `scripts/cee/staging/tests/snapshot_roundtrip.sh`: schema-only snapshot → empty DB → snapshot again | Postgres 16 | **Identical** (24 tables, 14 triggers, `public` and `storage.objects` policies); planted rows absent; 61/61 on the copy |
| `check_superseded.sql` on clean / chosen / superseded / history-only / first-file-only databases | Postgres 16 | Correct verdict in all five |
| `remove_superseded.sql`: seed rows only / chosen schema present / one non-seed row | Postgres 16 | Removes / refuses / refuses |
| `validate_migration.sh`: no confirmation / production URL / user rows / schema-only copy / second run | Postgres 16 | Refuses / refuses / refuses / **PASS all 4 steps** / stops (already installed) |
| `.github/workflows/cee-visual-db.yml`, every step run locally under `bash -eo pipefail` | Postgres 16, PostgREST 12.0.2 | All pass (integration 12/12 and 9/9). Not yet run on GitHub |

## Foundation acceptance criteria

Format: `Requirement | status | code path | commit/PR | tests executed | result | reviewer | date | remaining risk`.

| # | Requirement | Status | Code path | Commit/PR | Tests executed | Result | Reviewer | Date | Remaining risk |
|---|---|---|---|---|---|---|---|---|---|
| F1 | Repository and data model audited; reuse plan approved | VERIFIED | `docs/cee-visual/*` | PR #5 (in #6) | Reference check (50 refs, 35 cited lines); Mermaid parse 16/16 | Pass | Owner approved D1–D6 (23 Nov) and the base build (24 Nov) | 24 Nov | D7 open |
| F2 | Syllabus version, program scope and curriculum mappings validated | PARTIAL | `cee_syllabus_versions`, `cee_curriculum_nodes`, `cee_check_node`, `cee_check_mapping`; admin syllabus screen | `1f5a961` | SQL (shape, scope, cycle, depth, cross-program); admin test (syllabus verify, separation of duties) | Pass | — | 24 Nov | **No official MEC syllabus loaded or verified**; import workflow being built (M6) |
| F3 | Additive migrations: dry-run and rollback documented | PARTIAL | `supabase/proposed/*`, `DATABASE_DESIGN.md` §6 | `1a01ca7` | Apply / rollback / re-apply on scratch Postgres | Pass | — | 24 Nov | **Not dry-run on a production-shaped schema yet** (needs staging, M2–M4) |
| F4 | Secure asset upload, quarantine, scanning and processing operational | PARTIAL | `validators/glb.ts`, `validators/svg.ts`, `validators/manifest.ts` | `b98f1a9` | 43 validator tests incl. 27 malicious SVGs and bad GLBs; Khronos validator | Pass | — | 24 Nov | **Upload pipeline, storage buckets and scanner not built** (M7); scanner needs D7 |
| F5 | Versioned manifest validation; immutable published asset storage | PARTIAL | `schemas.ts`, `cee_guard_asset_version`, `cee_lock_on_review` | `b98f1a9` | Manifest schema and cross-check tests; SQL immutability checks | Pass | — | 24 Nov | Content-addressed promotion to a published bucket not built (M7) |
| F6 | Universal player renders approved 3D and 2D, with accessible fallback | VERIFIED (local) | `src/components/visual-player/*` | `b75b0d1` | Chrome scenarios (see above) | Pass | — | 24 Nov | Only a geometric test model so far; no real anatomy model; no reference-device benchmark |
| F7 | Draft/review/approval/publish tested with scoped RBAC | VERIFIED (local) | `admin.server.ts`, `cee_submit_revision`, `cee_decide_review`, `cee_publish_revision` | `1f5a961` | `admin.integration` 9/9; SQL 61/61; Chrome full flow | Pass | — | 24 Nov | Asset review gates go through the same requests, but the decision API covers lesson revisions only (M7) |
| F8 | No cross-program leakage in queries, search or CMS | VERIFIED (local) | `authz.ts`, `service.server.ts`, course isolation (PR #4, live) | `1f5a961`, `a16e0bd` | `authz` tests (IELTS/IOE/Physics denied); admin test (IELTS editor denied); course isolation verified live 23 Nov | Pass | — | 24 Nov | Search isn't part of the CEE visual API yet |
| F9 | Mobile bridge validated on reference devices, including resume and errors | PARTIAL | `bridge.ts` | `b98f1a9` | 4 protocol tests | Pass | — | 24 Nov | **BLOCKED: mobile app code (G1)**; no device harness |
| F10 | Server-validated, deduplicated progress events | VERIFIED (local) | `completion.ts`, `recordEvents`, `cee_player_events` PK | `b98f1a9` | `api.integration` (duplicates earn nothing, foreign events rejected, other students isolated) | Pass | — | 24 Nov | Section reads still come from the browser (documented limit) |
| F11 | Critical E2E, security and accessibility tests pass with recorded evidence | PARTIAL | `__tests__/*.integration.test.ts`; browser scripts kept outside the repo | `1f5a961` | Local only | Pass locally | — | 24 Nov | **No staging E2E** (M5). The CI job for the DB and integration tests is written and passes locally, but hasn't run on GitHub yet; browser checks aren't yet in the repo's test runner |
| F12 | Staging rollout and rollback tested; academic pilot sign-off | BLOCKED | — | — | — | — | — | — | **Needs a staging project (M2), real content (M9) and academic reviewers** |

## Critical scenarios

| ID | Scenario | Status | Evidence |
|---|---|---|---|
| CEE-001 | Correct Biology mapping | VERIFIED (local) | SQL mapping checks; admin test maps a lesson to Human Heart |
| CEE-002 | Reject unapproved Physics→Biology mapping | VERIFIED (local) | SQL `CROSS_PROGRAM_MAPPING`; subject-scope checks in `authz.test.ts` |
| CEE-003 | Reject malicious upload | PARTIAL | Validators reject 27 malicious SVGs and bad GLBs; **no upload route yet** (M7) |
| CEE-004 | Student denied draft | VERIFIED (local) | Students only ever read active publications; drafts 404 (`api.integration`) |
| CEE-005 | Reviewer rejection blocks publishing | VERIFIED (local) | SQL "requesting changes sends the revision back"; the publish function refuses unapproved gates |
| CEE-006 | Edit creates a new draft | VERIFIED (local) | SQL immutability; admin test "revision 2 from the published one" |
| CEE-007 | WebGL fallback | VERIFIED (local) | Chrome: no-WebGL and double context-loss paths |
| CEE-008 | Valid progress | VERIFIED (local) | `api.integration` completes the lesson only when the server's rules are met |
| CEE-009 | Duplicate event earns no double credit | VERIFIED (local) | `api.integration` resends a batch: all duplicates, nothing accepted |
| CEE-010 | Immutable publication | VERIFIED (local) | SQL: published revision frozen; one active publication; supersede |
| CEE-011 | Truthful empty state | VERIFIED (local) | "No visual lessons have been published for this topic yet." (`api.integration`); course pages show nothing until published |
| CEE-012 | Rollback after a regression | PARTIAL | Schema rollback tested locally; previous production deployment kept as a rollback target; **no staging rehearsal** |

## Human Heart pilot acceptance (file 14)

| Step | Status | Blocker |
|---|---|---|
| Editor creates a verified CEE topic and draft | Built | Official syllabus not loaded (M6) |
| Uploads an approved heart model, captions and fallback | Not possible yet | Upload pipeline (M7); a licensed model (M9); scanner (D7) |
| Author configures chambers, valves, vessels, hotspots and flow animation | Player supports it; no authoring screen | Manifest editor (M11); real model (M9) |
| Expert and publisher approve | Built for lessons | Asset decisions (M7); named reviewers |
| Student loads the published revision on web and mobile | Web built | Mobile app code (G1) |
| Labels, timeline and MCQs work; score and progress saved | Built and tested with the test model | Real content |
| Unrelated programs unaffected | Verified | — |
| Errors and offline fallback tested | Errors and 2D fallback tested | Offline packs are a later phase |

## Release gates (file 10)

None is met yet. Critical E2E on staging, zero open critical/high security issues (the security audit is assigned to Antigravity), a verified syllabus with academically reviewed content, every published 3D lesson having a fallback (enforced by the database), role isolation (tested locally), a migration dry-run on staging, a rollback rehearsal, and reference-device benchmarks.

## Were the superseded migrations ever installed? (objective 3)

**Not yet answerable for production**: it needs read access (the Supabase connector sign-in, or
someone running `check_superseded.sql`). What the code shows:

- `20261124000001_cee_audit_and_reviews.sql` **cannot apply** to this app's schema as defined in
  `supabase/migrations/20260715003118_initial_schema.sql`. Its policies use `user_profiles.user_id`
  (the table is keyed by `id`), and once that is corrected they fail again on `role IN ('super_admin', 'content_manager')`,
  values the `user_role` enum doesn't have. Run as a file, it fails and leaves nothing.
- So if anyone ran `supabase db push` with both files, the likely state is the first file's tables
  only, plus `20261124000000` in the CLI history. `check_superseded.sql` reports that as
  SUPERSEDED INSTALLED, and CI reproduces exactly that state on every run.
- The commits were pushed to the production branch but not deployed, and nothing in the repo applies
  migrations on deploy. That makes an install less likely, but it doesn't prove one never happened.

## Remaining criteria, in dependency order

1. **Staging project** (owner: finish the Supabase connector sign-in, or create a separate staging project) → F3, F11, F12, CEE-012. Everything else for M2–M5 is built and tested: once access exists it's one snapshot command and one validation command (`scripts/cee/staging/README.md`).
2. **Upload pipeline** (M7, in progress) → F4, F5, CEE-003; then **D7 scanner choice** (owner) to make it operational.
3. **Official MEC syllabus document plus an academic director** → F2 and every publication.
4. **A licensed heart model and named reviewers** (owner and academic staff) → the pilot and F12.
5. **Mobile app code** (owner) → F9.
