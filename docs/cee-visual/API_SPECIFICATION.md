# API Specification (proposed)

Next.js route handlers under `src/app/api/v1/cee/…`. This adapts `05_API_CONTRACTS.md` to the existing app. **Nothing here is built yet.**

## 1. Conventions

**Auth.**

- The web app uses its existing Supabase cookie session.
- The mobile WebView sends `Authorization: Bearer <token>`.
- Both are resolved by the existing `getSessionUser` (`src/lib/supabase/route-auth.ts:5`).

**Authorisation.** Every route calls `verifyCeeScope(req, { permission, program, subjectNodeId?, entity? })`. It runs these checks in order:

1. Session.
2. The role permission, through the existing `verifyServerPermission` (`src/lib/auth/serverGuard.ts:65`).
3. An active `cee_role_assignments` row covering the program and subject.
4. Separation of duties, for review and publish routes.

**Responses.**

- Success: `{ "data": …, "meta": { "requestId": "req_…" } }`.
- Error: `{ "error": { "code": "…", "message": "…", "details": {} }, "meta": { "requestId": "req_…" } }`.
- The request id is also logged and written to `cee_audit_logs.request_id`.

**Validation.** Requests are checked with zod 4 schemas in `src/lib/cee-visual/schemas.ts`. Unknown keys are rejected (`strict()`).

**Concurrency.**

- Draft edits send `revision` (an ETag of the row's `updated_at`), and a mismatch returns `409 REVISION_CONFLICT`.
- Uploads, publication, attempts and events take an `Idempotency-Key` header, or a UUID in the body.

**Lists** use cursor pagination (`?cursor=…&limit≤100`) with stable sorting by `(sort_key, id)`.

**Time** is ISO-8601 in UTC.

**Hiding.** If a resource exists but the caller may not know that, the route returns `404`, not `403`.

## 2. Error codes

| HTTP | Code | When |
|---|---|---|
| 400 | `INVALID_REQUEST` | Schema validation failed |
| 401 | `UNAUTHENTICATED` | No valid session or bearer token |
| 403 | `FORBIDDEN` | Role or scope doesn't cover the program/subject |
| 403 | `SOD_VIOLATION` | Author reviewing or publishing their own work |
| 404 | `NOT_FOUND` | Missing, or hidden from this caller |
| 409 | `REVISION_CONFLICT` | Stale `revision` on a draft edit |
| 409 | `IDEMPOTENCY_CONFLICT` | An idempotency key reused with a different request body |
| 409 | `STATE_CONFLICT` | Illegal transition, e.g. editing a submitted revision (`IMMUTABLE_REVISION` from the database) |
| 409 | `CURRICULUM_FROZEN` | Changing a syllabus (or its tree) that is no longer `DRAFT` |
| 409 | `SOURCE_MISMATCH` | Verifying against a document whose SHA-256 differs from the one recorded while drafting |
| 409 | `IN_USE` | Replacing a draft tree whose entries lessons, objectives or role scopes already point at |
| 413 | `PAYLOAD_TOO_LARGE` | Over the per-kind size cap |
| 415 | `UNSUPPORTED_TYPE` | MIME type or magic bytes not allowed |
| 422 | `CURRICULUM_INVALID` | Shape, scope or cycle errors from the curriculum triggers |
| 422 | `IMPORT_INVALID` | A syllabus CSV with problems; `details.errors` lists them by line |
| 422 | `SYLLABUS_INCOMPLETE` | Verifying a syllabus with no subjects, or a subject without a chapter |
| 422 | `CROSS_PROGRAM_MAPPING` | Mapping into another program without the cross-program flow |
| 422 | `ACADEMIC_APPROVAL_REQUIRED` | A review gate isn't approved |
| 422 | `MAPPING_NOT_VERIFIED` | No approved mapping into a verified syllabus |
| 422 | `ASSET_NOT_READY` | Asset not validated, not scanned clean, or not promoted |
| 422 | `FALLBACK_REQUIRED` | 3D lesson without a fallback |
| 422 | `QUESTION_NOT_APPROVED` | Pinned question not approved |
| 422 | `ASSET_INVALID` | glTF/SVG validation failed (details carry the validator report) |
| 423 | `FEATURE_DISABLED` | `cee_visual_enabled` is off (student routes return 404 instead) |
| 429 | `RATE_LIMITED` | Per-user limit hit |
| 500 | `INTERNAL` | Unexpected failure; the database message is logged with the request id, never returned |
| 503 | `SCANNER_UNAVAILABLE` | Malware scanner not configured or unreachable; the asset stays `NOT_SCANNED` |

## 3. Student routes (published content only)

| Method and path | Purpose | Auth | Notes |
|---|---|---|---|
| `GET /api/v1/cee/programs/cee_medical/syllabi` | Verified syllabus versions | Signed in | Only `VERIFIED` |
| `GET /api/v1/cee/syllabi/:id/tree` | Subject/chapter/topic tree, with counts of **published** lessons | Signed in | Empty topics shown; nothing invented |
| `GET /api/v1/cee/topics/:id/lessons` | Published lessons mapped to a topic | Signed in + CEE access | Empty list → page shows "No visual lessons have been published for this topic yet." |
| `GET /api/v1/cee/lessons/:id` | Active published snapshot: content, objectives, question stems and options (**no answer keys**) | Signed in + CEE access (existing entitlement check) | 404 if nothing published |
| `GET /api/v1/cee/lessons/:id/manifest` | Manifests of the pinned asset versions, with signed URLs (expire ≤ 10 min) | Same | Only signed URLs; no key fields or unsigned bucket access |
| `GET /api/v1/cee/me/progress` | Own progress across published lessons | Signed in | |
| `GET /api/v1/cee/me/lessons/:id/progress` | Own progress for one lesson | Signed in | |
| `POST /api/v1/cee/me/lessons/:id/events` | Up to 50 events per call | Signed in | Each `{eventId: uuid, type, occurredAt, assetVersionId?, payload ≤ 8 KB}`; duplicates reported `{duplicate: true}`, no credit |
| `POST /api/v1/cee/me/lessons/:id/attempts` | Submit MCQ answers | Signed in | `Idempotency-Key` required. Graded on the server against the pinned revisions, reusing the grading in `src/app/api/exams/submit/route.ts:185`. Returns score, the correct option and the rationale **after** submission |
| `POST /api/v1/cee/me/lessons/:id/complete` | Ask the server to recompute completion | Signed in | Body ignored; the server decides from events, objectives and best attempt |

## 4. CMS routes (`/api/v1/cee/admin/…`)

| Method and path | Permission and scope | Notes |
|---|---|---|
| `POST /admin/syllabi` | `ACADEMIC_DIRECTOR` for the program | Creates `DRAFT` |
| `PATCH /admin/syllabi/:id` | `ACADEMIC_DIRECTOR` or `EDITOR`, program-wide | `DRAFT` only: label, source URL, **source SHA-256** (of the document it is entered from), effective date, notes |
| `POST /admin/syllabi/:id/import` | `ACADEMIC_DIRECTOR` or `EDITOR`, program-wide | Body `{csv, dryRun = true, replace = false}`. Dry run: line-numbered errors, warnings, counts, preview. Real run: `cee_import_curriculum()` replaces the draft's tree in one transaction. Format: `docs/cee-visual/SYLLABUS_WORKFLOW.md` |
| `GET /admin/syllabi/:id/export` | Any CEE role in the program | `text/csv` in the import format (re-importable); cells that a spreadsheet would run as formulas are prefixed with `'` |
| `POST /admin/syllabi/:id/verify` | Program-wide `ACADEMIC_DIRECTOR` who neither created nor entered any of it | Through `cee_verify_syllabus()`: SHA-256 must match the recorded one (if any); every subject needs a chapter; the syllabus and its tree are frozen afterwards (only retiring is allowed) |
| `POST /admin/curriculum/nodes` | `ACADEMIC_DIRECTOR` or `EDITOR` scoped to the subject | `DRAFT` syllabus only (409 `CURRICULUM_FROZEN`); optional `sourceRef`; 422 `CURRICULUM_INVALID` on shape, scope or cycle |
| `PATCH /admin/curriculum/nodes/:id` | `ACADEMIC_DIRECTOR` or `EDITOR` scoped to the subject | Chapters only: `{legacyChapterId}` links to an existing course chapter page. Allowed after verification (not syllabus content) |
| `PATCH /admin/curriculum/nodes/:id` | Same | `revision` required |
| `POST /admin/lessons` | `EDITOR` for the program | Creates the lesson and revision 1 (`DRAFT`) |
| `POST /admin/lessons/:id/revisions` | `EDITOR` | New `DRAFT`, copied from the latest revision |
| `PATCH /admin/lesson-revisions/:id` | `EDITOR`, revision must be `DRAFT` | 409 otherwise |
| `POST /admin/lesson-revisions/:id/mappings` | `EDITOR` proposes; `ACADEMIC_DIRECTOR` approves | Cross-program needs `cross_program: true` and its own review |
| `POST /admin/lesson-revisions/:id/submit` | `EDITOR` | `DRAFT → IN_REVIEW`; opens the six gate requests |
| `GET /admin/lessons/:id/history` | Any CEE CMS role for the program | Revisions, decisions, publications, audit |
| `POST /admin/assets` | `ANIMATOR` or `EDITOR` | Kind, title, licence, credit |
| `POST /admin/assets/:id/upload-init` | Same | Body `{mimeType, sizeBytes, sha256}`. Allowlist: `model/gltf-binary` ≤ 25 MB, `image/svg+xml` ≤ 2 MB, `image/png` and `image/webp` ≤ 5 MB, `video/mp4` → Bunny instead. Returns a signed upload URL for `cee-quarantine` (10 min) and `assetVersionId` |
| `POST /admin/uploads/:assetVersionId/complete` | Same | Recomputes sha256 and size, runs validators, requests a scan, promotes on success; returns the validation report |
| `POST /admin/asset-versions/:id/validate` | Same | Retries failed steps (≤ 3) |
| `GET /admin/asset-versions/:id/preview` | Any CEE CMS role | Signed URL to the **quarantine or published** object for authorised staff only |
| `PATCH /admin/asset-versions/:id/manifest` | `ANIMATOR` or `EDITOR` | Rejected once locked; node names checked against the GLB |
| `POST /admin/question-revisions` | `EDITOR` | Optional `sourceQuestionId` to import an existing question for review |
| `GET /admin/reviews?gate=&status=` | The reviewer role for that gate | Queue filtered by the caller's scope |
| `POST /admin/reviews/:id/assign` | `ACADEMIC_DIRECTOR` | |
| `POST /admin/reviews/:id/decision` | The gate's reviewer role; not the creator | Appends a decision; `REQUEST_CHANGES` moves the revision to `CHANGES_REQUESTED` |
| `POST /admin/publications` | `PUBLISHER`; not the author | `Idempotency-Key` required; calls `cee_publish_revision` |
| `POST /admin/publications/:id/archive` | `PUBLISHER` | Keeps history; student attempts untouched |
| `GET/POST /admin/roles` | Super admin only | Grants and revokes scoped CEE roles; audited |
| `GET /admin/audit` | `audit:view` + CEE scope | |
| `PUT /admin/settings/cee_visual_enabled` | Super admin | Feature flag |

## 5. Key schemas (zod 4 sketches)

```ts
const Uuid = z.string().uuid();

export const PlayerEvent = z.object({
  eventId: Uuid,
  type: z.enum(['LESSON_OPENED','PLAYER_READY','PLAYER_ERROR','FALLBACK_SHOWN',
                'STRUCTURE_SELECTED','SEQUENCE_STEP','SEQUENCE_COMPLETED','SECTION_READ']),
  occurredAt: z.iso.datetime(),
  assetVersionId: Uuid.optional(),
  payload: z.record(z.string(), z.unknown()).default({})
    .refine(p => JSON.stringify(p).length <= 8192, 'payload too large'),
}).strict();

export const VisualAssetManifest = z.object({
  schemaVersion: z.literal('1.0'),
  kind: z.enum(['MODEL_3D','DIAGRAM_2D','ANIMATION_2D','VIDEO','SIMULATION']),
  title: z.string().min(1).max(200),
  model: z.object({
    format: z.literal('glb'),
    initialCamera: z.object({ position: z.tuple([z.number(), z.number(), z.number()]),
                              target:   z.tuple([z.number(), z.number(), z.number()]) }).optional(),
    layers: z.array(z.object({ key: z.string(), label: z.string(), nodeNames: z.array(z.string()).min(1) })).max(64),
  }).optional(),
  hotspots: z.array(z.object({
    id: z.string().regex(/^[a-z0-9-]{1,64}$/), label: z.string().max(120),
    targetNode: z.string().optional(), position: z.tuple([z.number(), z.number(), z.number()]).optional(),
    explanation: z.string().max(2000).optional(),
  })).max(200),
  sequences: z.array(z.object({
    key: z.string(), title: z.string(),
    steps: z.array(z.object({ atMs: z.number().int().min(0), caption: z.string().max(500),
      camera: z.object({ position: z.tuple([z.number(), z.number(), z.number()]),
                         target: z.tuple([z.number(), z.number(), z.number()]) }).optional(),
      visibleLayers: z.array(z.string()).optional(), highlight: z.array(z.string()).optional() })).min(1).max(100),
  })).max(20),
  fallback: z.object({ assetVersionId: Uuid, kind: z.enum(['svg','png']) }),   // required for 3D
  accessibility: z.object({ description: z.string().min(20).max(4000),
                            reducedMotionSupported: z.boolean(), captionsUrl: z.string().url().optional() }),
}).strict()
  .refine(m => m.kind !== 'MODEL_3D' || !!m.model, 'model block required for 3D');
// Source URLs are never stored in the manifest; the server injects short-lived signed URLs at read time.

export const BridgeMessage = z.object({
  protocolVersion: z.literal(1),
  messageId: Uuid,
  type: z.enum(['PLAYER_READY','STRUCTURE_SELECTED','SEQUENCE_COMPLETED','PLAYER_ERROR',
                'APP_PAUSED','APP_RESUMED','NETWORK_CHANGED']),
  payload: z.record(z.string(), z.unknown()).default({})
    .refine(p => JSON.stringify(p).length <= 8192),
}).strict();
```

## 6. Rate limits (first values; to be measured)

| Route group | Limit |
|---|---|
| Events | 120 requests/min per user |
| Attempts | 10/min per user |
| Upload init | 30/hour per user |
| Everything else | 60/min per user |

The existing limiter is in-memory per instance (`src/lib/security/rateLimiter.ts`), so these limits are best-effort. Correctness never depends on them: idempotency is enforced by database keys.
