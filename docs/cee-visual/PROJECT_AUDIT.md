# CEE Visual Intelligence — Project Audit

**Phase 0 (discovery). No platform code was changed for this audit.**
Audited: repository `hpspublication1-lab/final-project-`, branch `recovery/production-nov12` at `a16e0bd` (the code live on samyakcee.com since 23 Nov 2026), plus the live site's own API responses and server logs.
Date: 23 Nov 2026. Author: Claude (AI), for review by the platform owner.

The handoff package (`00_START_HERE.md` … `14_ACCEPTANCE_CRITERIA_AND_STATUS.md`) is treated as the **target**, not as evidence. Every status below is backed by a file and line, or by a measured response from the live site.

## Documents in this folder

| File | What it answers |
|---|---|
| `PROJECT_AUDIT.md` | This summary: findings, completion estimate, decisions needed |
| `CURRENT_ARCHITECTURE.md` | How the platform is built today, with diagrams |
| `FEATURE_INVENTORY.md` | Every target requirement, its status, the evidence, and whether it is tested and runtime-verified |
| `GAP_ANALYSIS.md` | What to reuse, what to fix, what to add, in dependency order |
| `RISK_REGISTER.md` | Risks and blockers, with owners and mitigations |
| `TARGET_ARCHITECTURE.md` | The proposed design, adapted to Next.js + Supabase + Vercel |
| `DATABASE_DESIGN.md` | Proposed additive tables, constraints, ERD (not applied) |
| `API_SPECIFICATION.md` | Proposed routes, permissions, schemas and errors |
| `IMPLEMENTATION_ROADMAP.md` | Phases, critical path, exit criteria |
| `SPRINT_BACKLOG.md` | The backlog in the handoff's record format |

## Headline findings

1. **Nothing of the visual subsystem exists yet.** There is no 3D renderer, no asset manifest, no hotspot/timeline model, no asset versioning, no quarantine or scanning, and no human academic review or immutable publication. The only 3D code is a decorative particle canvas on the home page (`src/components/3d/InteractiveParticleConstellation.tsx:23`).
2. **A solid general LMS exists and much of it is reusable:**
   - Next.js 15.5 / React 19 app with Supabase auth and Postgres;
   - a CEE subject → chapter structure with real content;
   - server-side exam scoring (`src/app/api/exams/submit/route.ts:185`);
   - signed video delivery through Bunny CDN (`src/app/api/video/sign/route.ts:95`);
   - a role/permission engine (`src/lib/auth/rbac.ts`, `src/lib/auth/serverGuard.ts:65`);
   - an audit log service (`src/lib/services/auditService.ts:35`);
   - zod validation;
   - a CI gate that runs 608 unit tests.
3. **The vertical slice has a real anchor.** The live database has CEE → Biology → chapter "Human Physiology" with published questions. That was measured on 23 Nov from `/api/curriculum?course=cee_medical`. There is no topic level below chapters, so "Circulatory System → Human Heart" does not exist yet.
4. **The live database does not match the repository's migrations.** `program_type` is missing on `subjects`, `batches`, `notes` and `video_lectures` live, although migrations `20260809000000` and `20261112000000` add it; this was confirmed from preview server logs on 23 Nov. `chapters` uses `sort_order` live (`src/app/api/curriculum/route.ts:116`), while the migration defines `chapter_number` (`supabase/migrations/20260715003118_initial_schema.sql:62`). Until a schema baseline is taken from live, no new migration can be safely dry-run.
5. **Security gaps that the visual subsystem would inherit unless addressed first:**
   - Most admin screens write to the database directly from the browser, so server-side RBAC is bypassed and only row-level security applies. The live row-security policies are not visible from here.
   - Permissions are role-wide, with no program or subject scope (`src/types/lms/index.ts:20`). Runtime permission overrides live in process memory (`src/lib/auth/rbac.ts:132`) and are parsed incorrectly (`:153`, which splits `role:content:read` on every colon).
   - Uploads go from the browser straight into mostly public buckets with `upsert: true` (`src/app/admin/uploads/components/AdminUploadsClient.tsx:370, 572, 585, 792`).
   - SVG is accepted into the public `diagrams-images` bucket (`supabase/migrations/20260715050000_admin_uploads.sql:13`).
   - The upload validators exist but aren't called on any upload path (`src/lib/security/uploadValidation.ts:62, 152`).
   - Students can read exam answer keys from the browser (`src/app/components/MCQPreviewSection.tsx:60`). The fix, commit `4c30093`, was never merged to production.
   - Lesson progress trusts the client's `isCompleted: true` (`src/app/api/learn/progress/route.ts:35`).
6. **The mobile app is not in this repository.** Only its server side is: bearer-token auth (`src/lib/supabase/route-auth.ts:47`) and a remote config (`src/app/api/mobile/config/route.ts:10`). The WebView bridge cannot be designed against real code until the app's code, or its technology, is shared.
7. **There is no isolated staging.** Vercel previews use the production database, and CI has no database, integration or end-to-end stage (`.github/workflows/ci.yml:31-35`).

## Completion estimate

The estimate is a **rubric score**, not a time-to-finish estimate. Each of 61 target requirements (listed with evidence in `FEATURE_INVENTORY.md`) is scored:

- COMPLETE = 1;
- PARTIAL = ½;
- BROKEN, MISSING or BLOCKED = 0;
- UNVERIFIED is scored both ways, which gives the range.

The domain scores are weighted as the handoff specifies.

| Domain | Weight | Reqs | Complete | Partial | Broken | Missing | Blocked | Unverified | Domain score | Weighted |
|---|---|---|---|---|---|---|---|---|---|---|
| Architecture | 10% | 6 | 0 | 3 | 1 | 2 | 0 | 0 | 25% | 2.5 |
| Curriculum and data | 15% | 8 | 1 | 1 | 0 | 5 | 0 | 1 | 19%–31% | 2.8–4.7 |
| CMS and publishing | 15% | 7 | 0 | 3 | 0 | 4 | 0 | 0 | 21% | 3.2 |
| Asset pipeline | 15% | 9 | 0 | 2 | 0 | 7 | 0 | 0 | 11% | 1.7 |
| Visual player | 15% | 7 | 1 | 2 | 0 | 4 | 0 | 0 | 29% | 4.3 |
| Assessment and progress | 10% | 7 | 1 | 1 | 2 | 3 | 0 | 0 | 21% | 2.1 |
| Mobile | 5% | 4 | 1 | 1 | 0 | 1 | 1 | 0 | 38% | 1.9 |
| Security | 5% | 6 | 1 | 2 | 1 | 2 | 0 | 0 | 33% | 1.7 |
| Tests and deployment | 10% | 7 | 1 | 3 | 0 | 3 | 0 | 0 | 36% | 3.6 |
| **Total** | | **61** | **6** | **18** | **4** | **31** | **1** | **1** | | **23.7%–25.6%** |

How to read the score:

- **What earns the credit.** The score comes almost entirely from general platform pieces: auth, exam scoring, video, CI and the course resolver. The visual-specific requirements score close to zero: no 3D renderer, manifest, review workflow, publication, quarantine or versioning.
- **How the score was measured.** Every COMPLETE item has code. Each item's test coverage and whether I saw it working on the live site are recorded separately in `FEATURE_INVENTORY.md`.
- **What I couldn't check.** I could not sign in, so nothing behind a login was clicked through.
- **The PARTIAL weighting.** Scoring PARTIAL as ½ is a convention. Scoring it as 0 gives 9.0%–10.8%.

## What the plan needs that only you can provide

These are blockers outside the code:

1. **A schema baseline from live.** Run the read-only `supabase/audit/course_isolation_audit.sql`, or a `supabase db dump --schema-only`, and share it. Without it no migration can be dry-run, and the handoff's migration rule cannot be met.
2. **A staging database.** A second Supabase project, so previews and tests stop touching production data.
3. **The mobile app's code**, or confirmation of its technology (the handoff assumes Flutter).
4. **People for the review roles.** An academic director (syllabus and publication), a subject expert (cardiovascular anatomy), and someone to clear rights.
5. **The official CEE syllabus document** (MEC), to record as the verified syllabus version.
6. **A heart model** with clear rights: licensed, commissioned, or made in Blender. Until one is approved, the pilot can be built only with a clearly labelled development fixture, which never reaches production.
7. **A malware-scanning service** for uploads (see `TARGET_ARCHITECTURE.md` §6). Until one is chosen, publication is blocked by design.

## Decisions I'm asking you to approve before any code is written

| # | Decision | Recommendation | Why |
|---|---|---|---|
| D1 | Where the new tables live | Same Supabase Postgres, new `cee_*` tables only; existing tables untouched | Additive; reuses auth and users; no data migration |
| D2 | 3D renderer | three.js via `@react-three/fiber` + `drei`, loaded only on visual lesson routes | Layer isolation, clipping and hotspots need scene-graph access; `<model-viewer>` can't toggle meshes |
| D3 | Asset storage | Two private Supabase Storage buckets (quarantine, published) with short signed URLs; Bunny CDN later | Same auth as today; nothing public until publication |
| D4 | Processing | Postgres job table + bounded processing in Vercel functions; heavy optimisation done by the animator before upload, validated on the server | No new infrastructure; Vercel cron is daily-only |
| D5 | Permissions | New scoped role assignments (program/subject) checked by the existing `verifyServerPermission`; all CEE CMS writes through server routes, never from the browser | Meets "server-side scoped RBAC" without replacing auth |
| D6 | Scope of the first build | Foundation slice only (the handoff's Weeks 1–4), behind a feature flag, on a staging database | As the handoff specifies |

Nothing will be deployed to production, and no migration will be applied, without separate approval.

## Pre-existing problems to fix first

These are independent of the visual work, but the visual work depends on them:

| # | Problem | Evidence | Fix available |
|---|---|---|---|
| P1 | Students can read answer keys | `src/app/components/MCQPreviewSection.tsx:60` | Commit `4c30093` (branch `ui/design-system-polish`), not merged |
| P2 | Any signed-in user may be able to raise their own role | Migration `20261123130000` (written, not applied) | Apply after review |
| P3 | Lesson completion trusts the client | `src/app/api/learn/progress/route.ts:35` | Server-computed completion (backlog FND-020) |
| P4 | Role overrides lost on every instance restart and mis-parsed | `src/lib/auth/rbac.ts:132, 153` | Persist in DB; split on the first colon |
| P5 | Public SVG uploads | `supabase/migrations/20260715050000_admin_uploads.sql:13` | Stop accepting SVG into public buckets |
| P6 | Repo migrations ≠ live schema | finding 4 | Baseline from live, then rebase migrations |
