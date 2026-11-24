# Security, QA, Operations and Release

## Security
Threat model: cross-program IDOR, unauthorized drafts, malicious GLB/SVG, external resource injection, oversized files/decompression bombs, CDN URL leakage, CSRF/session issues, XSS in notes, privilege escalation, duplicate events, race-condition publishing, stale CDN content, unauthorized AI retrieval. Controls: scoped authorization, input validation, file scanning, allowlisted origins, CSP, rate limits, signed private URLs, secrets manager, audit logs, transaction locks, outbox/idempotency, minimal PII.

## Test matrix
**Unit:** invalid curriculum parent/cycles, duplicate version, invalid manifest, missing hotspot node, nonexistent clip, illegal state transition, edited approved revision, missing fallback, duplicate event, cross-program mapping.
**Integration:** valid GLB upload, malicious SVG rejection, quota enforcement, worker failure/retry, review approval/audit, unauthorized publish denied, student draft access denied, published snapshot immutable, CDN fallback, idempotent publication.
**E2E:** student CEE navigation, approved visual player, full editor-review-publish flow, revision protection, mobile pause/resume, WebGL failure, Biology editor cannot change IELTS/IOE, truthful empty states, visual MCQ and progress.
**Nonfunctional:** midrange Android FPS/load benchmarks, slow/offline networks, browser compatibility, accessibility, context loss, load testing, backup restoration, security scans.

## CI/CD
PR → lint/types/unit → integration → E2E/security → staging → academic pilot → manual production approval → feature-flag rollout → monitoring. Do not auto-run destructive production migrations. Version builds and migrations, expand/contract schema changes, maintain rollback plans.

## Observability
Metrics: API p95, error rate, worker queue depth, upload/scan failures, asset processing time, player startup latency, WebGL context loss, fallback rate, publication failures. Correlation IDs; redact student-sensitive data. Alerts with runbooks.

## Release gates
Critical E2E pass; zero unresolved critical/high security issues; verified syllabus/academic review for real published content; all published 3D lessons have fallback; role isolation tested; migration dry run; rollback rehearsed; reference device benchmarks recorded. No claims without actual evidence.
