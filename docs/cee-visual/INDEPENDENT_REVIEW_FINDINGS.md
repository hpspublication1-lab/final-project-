# Independent track (Antigravity): findings reviewed, 27 Nov 2026

Antigravity works on `support/*` branches as the independent audit, test and
documentation track. Each finding below was checked against PR #6
(`feat/cee-visual-foundation`) as it stands, not taken on trust. Verified fixes
are integrated here, credited. Nothing was integrated that duplicates PR #6.

## Branches

| Branch | Content | Based on | Verdict |
|---|---|---|---|
| `support/cee-foundation-verification` | PR #6 verification and audit reports (10 docs) | `1a01ca7` (PR #6) | Read; findings below |
| `support/security-regression` | 18-test security suite against PR #6 | `f9fad54` (PR #6) | **Integrated** (17 tests, fixtures corrected) |
| `support/admin-trial-modal-fix` | FIX-001 | `f9fad54` | **Integrated** (cherry-picked) |
| `support/http-404-fix` | FIX-002 | `f9fad54` | **Not integrated** (see below) |
| `support/malware-scanner-d7` | D7 specification (Cloud Run ClamAV), docs only | `f9fad54` | Input to D7; not code, no duplication |
| `support/asset-provenance` | Heart asset sourcing analysis, docs only | `f9fad54` | Input to M9; licences to be re-checked at source |
| `support/security-and-qa`, `support/notification-dispatcher-fix` | Audit docs **plus new features**: in-app notification dispatcher, Firebase Cloud Messaging, service workers | `ba03495` (the superseded parallel build) | **Not integrated**: new product features, outside the independent track's remit and based on the superseded build. Owner decision |
| `support/regression-reproducibility` | No commits of its own | `f9fad54` | Nothing to review |

## Findings

| ID | Claim | Checked how | Verdict | Action |
|---|---|---|---|---|
| SEC-001…004 | Separation of duties, course isolation, CSP/Draco, idempotency hold | Already covered by PR #6 tests; Antigravity's suite re-tests them | Confirmed | None |
| VER-001 | Preview is behind Vercel login | — | True, and **intended**: previews of this project use production environment variables | Keep protection; share one preview at a time with a Vercel share link when external review is needed |
| VER-002 | `gltf-validator` missing | `package.json` and lockfile; CI on GitHub runs the validator tests | **Not reproducible**: it is a runtime dependency, pinned in the lockfile, and installed in CI. It was missing only on the auditor's machine | None |
| FIX-001 | Trial pop-up covers admin and staff pages | Seen in every browser run of the CMS | Confirmed | Integrated (`a636898` cherry-picked, 12 tests) |
| FIX-002 | Missing batches and chapters return 200; the fix makes them return 404 | Production build, real HTTP: an existing server-side `notFound()` (`/cee/visual/lab`) returns **200** with `noindex`; only unmatched paths return 404 | **Fix doesn't do what it says.** The root `src/app/loading.tsx` starts streaming before `notFound()` runs, so the status stays 200. Its own test checks only that `notFound()` throws. It also adds risk: signed-out visitors can only read active, non-premium batches (RLS), so premium batch pages whose slug lacks "see/cee/english/nepali" would 404 for them | **Not integrated.** A real 404 means moving the root loading screen into route groups. That changes every page, so it's the owner's call |
| VULN-002 / PATCH-001 | SEE video progress trusts the client's `isCompleted` (rated High) | Read the route and every caller | True, but **Low**: it writes only the signed-in student's own progress, and no client calls it today ("Mark Completed" in the SEE player is local only) | Integrated: completion only from ≥ 90 % watched, 3 tests |
| VULN-003 / PATCH-002 | Admin roles API reads `user_metadata` before `app_metadata` (rated Medium) | Read every use | True, but it only feeds the "already has this role" comparison and audit, not authorisation. **Low** | Integrated: server-written `app_metadata` checked first |
| VULN-004 / PATCH-003 | CEE content APIs lack rate limits | Looked for the target files | **Not applicable**: both routes belong to the superseded parallel build and aren't in PR #6. PR #6's student routes already rate-limit | None |
| VULN-001, VULN-005 | Route-level guards; build during dev | — | Design note / local operations | None |

## Recommendations in the handoff that must not be followed

- **"Apply `supabase/migrations/20261124000001_cee_audit_and_reviews.sql` to the live Supabase
  project."** This is the superseded migration. It cannot apply to this schema: it uses
  `user_profiles.user_id` (the table is keyed by `id`) and role values `super_admin` and
  `content_manager` that the `user_role` enum doesn't have (reproduced, and checked in CI on
  every run). It would also put back the parallel schema that PR #6 replaced. Migrations need
  the owner's explicit approval in any case.
- **The handoff marks the parallel build's pilot lessons (heart, nephron, gas exchange) VERIFIED.**
  These are unreviewed drafts with no academic sign-off. PR #6 keeps them out of the product,
  under `content/cee-visual-drafts/` and labelled unreviewed. "Verified" there meant the code
  renders them, not that the science was checked.
- "Netlify staging preview": the project deploys on Vercel.

## Adopted test suite: what changed

`src/lib/cee-visual/__tests__/advancedSecurityRegression.test.ts` passed in Vitest but not the
type check that CI runs. Its fixtures came from the parallel build: program codes `MBBS` and
`BDS`, sections with `title`/`bodyMarkdown`, a different manifest shape. They now use PR #6's
real types; manifests are built through the real schema parser, so a schema change fails the
test instead of passing silently. Every assertion is kept, except Threat Vector 10, which only
filtered an array defined inside the test. That case is covered end to end in
`api.integration.test.ts`.
