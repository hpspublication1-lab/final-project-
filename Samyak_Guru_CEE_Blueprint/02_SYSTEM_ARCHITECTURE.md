# System Architecture and Component Boundaries

## Logical layers
1. **Clients:** existing student web, Flutter/mobile app, teacher portal, admin portal.
2. **Edge:** CDN, API entry, authentication/session validation, request validation, rate limits.
3. **Core domain:** program/syllabus registry, curriculum, lessons/revisions, enrollment/access, student progress.
4. **Visual runtime:** manifest validation, asset loader, renderer registry (3D, SVG, animation, simulation, video), controls, accessibility, mobile bridge.
5. **Academic services:** content CMS, review, immutable publication, MCQ service, learning analytics; AI tutor behind a future feature flag.
6. **Asset pipeline:** upload quarantine, scanning, optimization, manifest builder, versioned storage, CDN.
7. **Persistence/operations:** PostgreSQL or existing database, queue, cache, monitoring, backups, feature flags.

Prefer **modular monolith** initially. Do not create microservices or a new auth system merely to follow the diagram. Each domain has explicit interfaces and ownership.

## Suggested repo structure (adapt, do not force)
```text
apps/student-web
apps/admin-web
apps/mobile
services/api/src/modules/{curriculum,lessons,assets,reviews,publishing,permissions,audit,progress}
packages/{visual-player,visual-schemas,mobile-bridge,ui-components}
workers/asset-processing
infrastructure/{migrations,monitoring,deployment}
tests/{unit,integration,e2e,performance}
```

## Dependencies
Curriculum and scoped auth → lesson revisions and mappings → asset manifests/upload → player/preview → academic review → immutable publication → student delivery → events/assessment → analytics.

## Data flow
Student → authenticated API → authorized published lesson revision → signed/approved asset manifest → CDN → renderer → validated player events → progress API → database/analytics.

Editor → scoped CMS → draft revision → quarantine upload → validation/optimization → preview → scientific/rights/accessibility review → approved revision → publication transaction → CDN availability.

## Failure modes
Unavailable model → accessible fallback. Worker fails → retries with limits/dead-letter, no publish. Invalid mapping → 422/409, audit. Reviewer rejects → changes requested. WebGL context loss → recovery or fallback. Deployment regression → feature flag disable/rollback.
