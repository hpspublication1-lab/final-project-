-- ═══════════════════════════════════════════════════════════════════════════
-- ROLLBACK for 20261124_cee_visual_foundation.sql — drops ONLY what it created.
-- Refuses to run if any lesson has been published, so no student-facing
-- history can be lost by accident. Export the cee_* tables first if needed.
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;
DO $guard$ BEGIN
  IF to_regclass('public.cee_publications') IS NOT NULL AND EXISTS (SELECT 1 FROM public.cee_publications) THEN
    RAISE EXCEPTION 'Refusing: lessons have been published. Export cee_* data and remove this guard deliberately.';
  END IF;
END $guard$;
DROP FUNCTION IF EXISTS public.cee_publish_revision(uuid, uuid, text);
DROP FUNCTION IF EXISTS public.cee_latest_decision(text, uuid, text);
DROP TABLE IF EXISTS public.cee_attempts, public.cee_player_events, public.cee_student_progress,
  public.cee_audit_logs, public.cee_role_assignments, public.cee_publications, public.cee_review_decisions,
  public.cee_review_requests, public.cee_lesson_questions, public.cee_question_revisions, public.cee_lesson_assets,
  public.cee_asset_jobs, public.cee_asset_versions, public.cee_visual_assets, public.cee_lesson_mappings,
  public.cee_lesson_revisions, public.cee_lessons, public.cee_learning_objectives, public.cee_curriculum_nodes,
  public.cee_syllabus_versions, public.cee_settings;
DROP FUNCTION IF EXISTS public.cee_check_node(), public.cee_check_mapping(), public.cee_guard_lesson_revision(),
  public.cee_guard_asset_version(), public.cee_guard_question_revision(), public.cee_guard_revision_pins(), public.cee_append_only(),
  public.cee_check_decision(), public.cee_lock_on_review();
DROP DOMAIN IF EXISTS cee_program_code;
COMMIT;
