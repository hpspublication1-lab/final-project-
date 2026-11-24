# Academic CMS, Permissions and Publishing

## Admin navigation
Program Manager → CEE Curriculum → Subject Dashboard → Chapters/Topics → Lesson Editor → Asset Library → Model Preview → Hotspot/Timeline Editor → MCQ Bank → Review Queue → Publication Manager → Student Analytics → Permissions → Audit Logs → Processing Status.

## Components
`CurriculumManager`, `ProgramMappingEditor`, `LessonEditor`, `LessonRevisionHistory`, `AssetLibrary`, `AssetUploader`, `AssetPreview`, `HotspotEditor`, `AnimationSequenceEditor`, `AcademicReviewQueue`, `PublicationManager`, `AuditLogViewer`, `AccessControlManager`.

## State machine
`DRAFT → IN_REVIEW → APPROVED → PUBLISHED → SUPERSEDED/ARCHIVED`; `IN_REVIEW → CHANGES_REQUESTED → DRAFT`. New edit of approved/published revision creates new draft; does not modify immutable old snapshot.

## Review gates
Syllabus/academic director verifies topic mapping; subject expert scientific accuracy; visual reviewer geometry/animation/labels; assessment reviewer answer keys; accessibility reviewer text/captions/controls; rights reviewer licensing; authorized publisher verifies all gates. Require reviewer identity/time, decision, comments and exact revision. Configure separation of duties (creator cannot self-approve when policy requires).

## RBAC
Super Admin: platform settings; Academic Director: syllabus and publication approval; Subject Expert: scientific review; Animator: scoped assets; Editor: draft lessons; Question Reviewer: assessments; Teacher: assignments and authorized progress; Student: published/enrolled content. Enforce server-side scopes, not UI-only.

## Publication transaction
Lock revision, verify current state and all approvals; verify assets and mappings; write immutable publication snapshot and audit log atomically; emit outbox event for CDN/index/cache updates; expose published content only after required media is available. Handle retries idempotently and rollback failures without half-published lessons.

## Empty states and data integrity
Do not insert fake content for UI demos. Preserve all existing course and student data. Cross-program remapping requires review and audit. Archival does not erase historical student attempts.
