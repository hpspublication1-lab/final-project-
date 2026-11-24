# Database Schema — Canonical Domain Design

**Adapt to existing schema.** UUID primary keys below are proposals. Use existing user/auth/course entities when compatible; do not duplicate them.

| Table | Important columns | Rules |
|---|---|---|
| `cee_exam_programs` | id, code, name, active | unique code |
| `cee_syllabus_versions` | id, program_id, label, source_url, source_hash, effective_date, verified_at, verified_by | immutable verified snapshot |
| `cee_subjects` | id, code, name | unique code |
| `cee_curriculum_nodes` | id, syllabus_version_id, subject_id, parent_id, node_type, title, sort_order | no cycles, compatible parent scope |
| `cee_learning_objectives` | id, node_id, text, sort_order | mapped to verified topic |
| `cee_lessons` | id, title, slug, created_by, created_at | stable identity |
| `cee_lesson_revisions` | id, lesson_id, revision_number, content_json, status, created_by | unique lesson/revision; immutable approved/published |
| `cee_lesson_mappings` | id, lesson_id, curriculum_node_id, approved_by | unique mapping; cross-scope checks |
| `cee_visual_assets` | id, title, kind, created_by | stable asset identity |
| `cee_asset_versions` | id, asset_id, version_number, storage_key, sha256, manifest_json, status | immutable published bytes, unique asset/version |
| `cee_lesson_assets` | id, lesson_revision_id, asset_version_id, sort_order | pin exact revisions |
| `cee_asset_hotspots` | id, asset_version_id, hotspot_key, target_node, position_json, label | target validated |
| `cee_animation_sequences` | id, asset_version_id, sequence_key, timeline_json | clips validated |
| `cee_review_requests` | id, entity_type, revision_id, reviewer_id, status, requested_at | scope and separation of duties |
| `cee_review_decisions` | id, request_id, decision, comments, reviewed_at | append-only history |
| `cee_publications` | id, lesson_id, lesson_revision_id, published_by, published_at, superseded_at | immutable snapshot; one active publication per scope |
| `cee_permissions` | id, role_key, permission_key, scope_json | integrate existing RBAC |
| `cee_audit_logs` | id, actor_id, action, entity_type, entity_id, before_json, after_json, created_at | append-only, PII minimization |
| `cee_student_progress` | id, student_id, lesson_id, publication_id, completion_state, updated_at | unique student/publication |
| `cee_player_events` | id, event_id, student_id, publication_id, asset_version_id, type, occurred_at | unique event_id, deduplication |
| `cee_questions` (future/integrate) | id, question_revision, type, stem, options, answer_key, status | immutable approved question version |
| `cee_attempts` (future/integrate) | id, student_id, assessment_version_id, started_at, submitted_at, score | immutable submitted attempt |
| `cee_question_asset_links` (future) | id, question_revision_id, asset_version_id, visual_state_json | version pinned |

## Constraints and migrations
- Foreign keys with `ON DELETE RESTRICT` for published/referenced content.
- Unique `(asset_id, version_number)` and `(lesson_id, revision_number)`.
- Avoid nullable-parent unique traps: use explicit partial indexes or stable sibling order keys where appropriate.
- Unique `(student_id, publication_id)` progress and unique `event_id` for idempotency.
- Validate curriculum tree cycles in transaction or service; enforce program/syllabus compatibility.
- Publication transaction verifies approved lesson revision, all referenced asset versions, syllabus mapping, accessibility, licensing and review gates; writes immutable publication and audit event atomically.
- New edits create new revisions; never mutate approved/published revisions.
- Migrations: inspect baseline → additive schema → dry run on sanitized copy → integrity checks → staged rollout → reversible app release. Destructive migrations need explicit approval.

## SQL example
```sql
CREATE TABLE cee_visual_assets (
 id UUID PRIMARY KEY,
 title TEXT NOT NULL,
 kind TEXT NOT NULL CHECK (kind IN ('MODEL_3D','DIAGRAM_2D','ANIMATION_2D','VIDEO','SIMULATION')),
 created_by UUID NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE cee_asset_versions (
 id UUID PRIMARY KEY,
 asset_id UUID NOT NULL REFERENCES cee_visual_assets(id) ON DELETE RESTRICT,
 version_number INT NOT NULL CHECK (version_number > 0),
 storage_key TEXT NOT NULL UNIQUE,
 checksum_sha256 CHAR(64) NOT NULL,
 manifest_json JSONB NOT NULL,
 status TEXT NOT NULL,
 UNIQUE(asset_id, version_number)
);
```
Generate actual migrations only after examining existing ORM and database conventions.
