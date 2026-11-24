# Samyak Guru — CEE Visual Intelligence: Sprint Backlog (AUD-006)

**Format**: `Task ID | Requirement | Existing Code | Status | Owner | Priority | Dependencies | Acceptance Criteria | Tests`

---

## 1. Foundation Sprint Backlog Matrix

| Task ID | Requirement | Existing Code Reference | Status | Owner | Priority | Dependencies | Acceptance Criteria | Tests |
|---|---|---|---|---|---|---|---|---|
| **FND-001** | Additive Database Migration for `cee_*` entities | `supabase/migrations/` | READY | Backend Lead | P0 | None | Tables created with strict foreign keys and check constraints; zero impact on existing tables. | DB dry-run test |
| **FND-002** | Scoped RBAC Permissions for Academic CMS | `src/lib/auth/rbac.ts` | READY | Security Lead | P0 | FND-001 | `visual:author`, `visual:review`, `visual:publish` added; unauthorized users denied. | `rbac.test.ts` |
| **FND-003** | Scoped Curriculum Hierarchy API | `src/app/api/` | READY | Backend Lead | P0 | FND-001, FND-002 | Returns verified syllabus tree; enforces program scope; rejects cross-program queries. | `CEE-001`, `CEE-002` |
| **FND-004** | Quarantine Upload Endpoint & Quota Check | `src/lib/storage/supabaseStorage.ts` | READY | Backend Lead | P1 | FND-001 | Validates MIME type, file size limit (50MB), issues short-lived upload URL. | `CEE-003` |
| **FND-005** | Zod Manifest Schema & Integrity Validator | None | READY | Full-Stack Lead | P0 | None | Strict JSON schema validation for 3D/2D visual manifests; rejects unlisted URLs. | `manifest.test.ts` |
| **FND-006** | Universal Visual Player Shell (`VisualPlayerShell.tsx`) | `src/components/` | READY | Frontend Lead | P0 | FND-005 | Manages player state machine (`LOADING`, `READY`, `INTERACTING`, `FALLBACK`); renders active mode. | `player.test.tsx` |
| **FND-007** | 2D Biological Simulation Renderer Integration | `FOR BIOLOGY ANIMATION/src/data/lessons.ts` | READY | Graphics Lead | P0 | FND-006 | Integrates drift and stage animation engine for 13 biology lessons with responsive canvas. | `simulation.test.tsx` |
| **FND-008** | 3D WebGL Mesh & Hotspot Orbit Renderer | `src/components/3d/` | READY | Graphics Lead | P1 | FND-006 | Three.js orbit/pan/zoom, layer isolation, raycasted hotspot click, dynamic camera positions. | `CEE-007` |
| **FND-009** | 100% Accessible High-Resolution Fallback Mode | `public/art/`, `public/images/studio/` | READY | Frontend Lead | P0 | FND-006 | Guaranteed static diagram with text explanation rendered on WebGL failure or reduced motion. | `CEE-007` |
| **FND-010** | Mobile Bridge Protocol Adapter (JSON RPC) | `src/lib/mobile/` | READY | Mobile Lead | P1 | FND-006 | Dispatches versioned JSON messages (`PLAYER_READY`, `STRUCTURE_SELECTED`); zero arbitrary JS execution. | `bridge.test.ts` |
| **FND-011** | Visual Lesson Editor & Asset Mapping | `src/app/admin/lessons/` | READY | Frontend Lead | P1 | FND-001, FND-003 | Allows content author to draft lesson, attach asset versions, and submit for review. | CMS UI tests |
| **FND-012** | Multi-Gate Academic Review Interface | `src/app/admin/ai-review/` | READY | Full-Stack Lead | P0 | FND-002, FND-011 | Dedicated queue for Subject Expert, Visual, and Rights reviews; records immutable decisions. | `CEE-005` |
| **FND-013** | Transactional Publication Engine | None | READY | Backend Lead | P0 | FND-012 | Atomically creates publication snapshot; supersedes older versions; invalidates caches. | `CEE-006`, `CEE-010` |
| **FND-014** | Student Lesson Delivery Route (`/learn/visual/[slug]`) | `src/app/learn/` | READY | Full-Stack Lead | P0 | FND-006, FND-013 | Serves active published lesson; blocks unreviewed/draft lessons with 404. | `CEE-004` |
| **FND-015** | Visual Practice & Hotspot MCQ Integration | `src/lib/exams/cbtEngine.ts` | READY | Assessment Lead | P1 | FND-014 | Links quiz prompts to visual states; server scores answers; displays rationale. | `CEE-008` |
| **FND-016** | Idempotent Telemetry & Progress Recording | `src/app/api/learn/progress/` | READY | Backend Lead | P0 | FND-014 | Records student interaction events using deduplicating `event_id`; calculates verified completion. | `CEE-009` |
| **FND-017** | Human Heart Pilot Vertical Slice | `FOR BIOLOGY ANIMATION/` | READY | Lead Architect | P0 | FND-001..FND-016 | Complete end-to-end Heart lesson: 4 chambers, flow drift, valves, hotspots, MCQs, progress. | Full E2E suite |
| **FND-018** | End-to-End Regression & Acceptance Verification | Tests | READY | QA Lead | P0 | FND-017 | Validates all 12 critical acceptance criteria (`CEE-001` through `CEE-012`). | CI build output |

---

## 2. Release Acceptance Test Scenarios

- **`CEE-001`**: Correct CEE Biology mapping loads lesson under verified syllabus.
- **`CEE-002`**: Cross-program query isolation: IELTS or IOE query cannot access or mutate CEE visual nodes.
- **`CEE-003`**: Malicious upload rejection (oversized file, invalid MIME, script tag injection).
- **`CEE-004`**: Student denied access to draft/unapproved lesson revision (HTTP 404).
- **`CEE-005`**: Reviewer rejection blocks publication; returns revision to `CHANGES_REQUESTED`.
- **`CEE-006`**: Editing an approved/published revision creates a new draft revision number.
- **`CEE-007`**: WebGL context loss triggers automatic graceful switch to 100% accessible 2D fallback.
- **`CEE-008`**: Student completes visual practice; server grades MCQs and awards verified progress.
- **`CEE-009`**: Duplicate progress event submission rejected idempotently without double-counting.
- **`CEE-010`**: Published lesson snapshot is immutable; subsequent syllabus edits do not alter attempt history.
- **`CEE-011`**: Empty state rendered truthfully when no visual lessons have been published for a topic.
- **`CEE-012`**: Staging rollback rehearsal verifies zero data corruption.
