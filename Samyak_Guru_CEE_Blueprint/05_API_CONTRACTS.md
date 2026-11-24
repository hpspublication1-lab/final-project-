# API Contracts, Authentication and Errors

Proposed prefix: `/api/v1/cee` (adapt to existing routing). Every admin endpoint requires authenticated, server-verified scoped permission. Student routes return **only authorized published resources**.

## Curriculum
- `GET /programs` — available programs.
- `GET /programs/:id/syllabi` — verified syllabi.
- `GET /syllabi/:id/tree` — published subject/chapter/topic tree.
- `GET /topics/:id/lessons` — published lessons in scope.
- `POST /admin/curriculum/nodes` — create node, validate parent and scope.
- `PATCH /admin/curriculum/nodes/:id` — draft edit with optimistic concurrency.
- `POST /admin/syllabi/:id/verify` — director-only verification with evidence.

## Lessons
- `GET /lessons/:id` — active published snapshot; check enrollment.
- `POST /admin/lessons` — draft lesson identity.
- `POST /admin/lessons/:id/revisions` — new draft revision.
- `PATCH /admin/lesson-revisions/:id` — edit draft only.
- `POST /admin/lesson-revisions/:id/submit` — request review.
- `POST /admin/lesson-revisions/:id/publish` — authorized publication transaction.
- `GET /admin/lessons/:id/history` — scoped revision audit.

## Assets
- `POST /admin/assets` — register asset.
- `POST /admin/assets/:id/upload-init` — enforce scope, size, quota, file allowlist; return expiring upload credentials.
- `POST /admin/uploads/:id/complete` — verify object/checksum, enqueue scan.
- `GET /admin/assets/:id/versions` — revisions.
- `GET /admin/asset-versions/:id/preview` — signed private preview.
- `PATCH /admin/asset-versions/:id/manifest` — edit draft metadata.
- `POST /admin/asset-versions/:id/validate` — queue validation.
- `GET /assets/:id/manifest` — authorized published manifest only.

## Reviews and publication
- `GET /admin/reviews` — filtered queue.
- `POST /admin/reviews/:id/assign` — reviewer assignment.
- `POST /admin/reviews/:id/decision` — append immutable decision.
- `POST /admin/publications` — publish approved snapshot, idempotency key.
- `POST /admin/publications/:id/archive` — archive, audit and preserve history.

## Progress
- `GET /me/progress`
- `GET /me/lessons/:id/progress`
- `POST /me/lessons/:id/events` — typed, validated, idempotent events.
- `POST /me/lessons/:id/complete` — server computes completion; never trust `completed:true`.

## Contracts
Use versioned Zod/JSON Schema or existing validators. Standard success `{ "data": ..., "meta": { "requestId": "..." } }`; error `{ "error": { "code": "ACADEMIC_APPROVAL_REQUIRED", "message": "...", "details": {} }, "meta": { "requestId": "..." } }`.

HTTP: 400 invalid, 401 unauthenticated, 403 forbidden, 404 hidden/nonexistent, 409 revision/state conflict, 413 too large, 422 semantic invalid, 429 rate limited, 5xx transient failure. Never reveal private resource existence to unauthorized users.

## Important cross-cutting details
Pagination/filtering, stable sorting, ETags or `revision` for concurrency, request IDs, rate limits, idempotency keys for uploads/publication/progress, consistent timestamps UTC, signed asset origins, schema-version compatibility, and no internal storage keys exposed to students.
