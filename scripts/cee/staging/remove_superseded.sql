-- Removes the superseded parallel-build schema (supabase/superseded/*.sql).
-- WRITES. Run only where check_superseded.sql says "SUPERSEDED INSTALLED",
-- and on production only with the owner's explicit approval.
--
-- Refuses, changing nothing, unless all of these hold:
--   * the chosen schema is NOT installed (no public.cee_settings), and
--     public.cee_lessons, if present, has no program_code column (theirs, not ours);
--   * every one of the 19 superseded tables that exists is EMPTY, apart from the
--     seed rows that migration inserted itself (exam program CEE_ME_NEPAL and
--     subjects BIO_ZOO, BIO_BOT, CHEM, PHYS, MAT): those are its configuration,
--     not anyone's data.
-- Those migrations created only tables, indexes and RLS policies, so dropping the
-- tables removes everything they added.
BEGIN;

DO $guard$
DECLARE
  t text;
  n bigint;
  tables text[] := ARRAY[
    'cee_exam_programs', 'cee_subjects', 'cee_syllabus_versions', 'cee_curriculum_nodes', 'cee_learning_objectives',
    'cee_lessons', 'cee_lesson_revisions', 'cee_lesson_mappings', 'cee_visual_assets', 'cee_asset_versions',
    'cee_asset_hotspots', 'cee_animation_sequences', 'cee_lesson_assets', 'cee_publications', 'cee_student_progress',
    'cee_player_events', 'cee_audit_logs', 'cee_review_requests', 'cee_review_decisions'];
BEGIN
  IF to_regclass('public.cee_settings') IS NOT NULL THEN
    RAISE EXCEPTION 'Refusing: the chosen schema is installed here (public.cee_settings exists). These tables are not the superseded ones.';
  END IF;
  IF to_regclass('public.cee_lessons') IS NOT NULL AND EXISTS (
       SELECT 1 FROM pg_attribute WHERE attrelid = to_regclass('public.cee_lessons') AND attname = 'program_code' AND NOT attisdropped) THEN
    RAISE EXCEPTION 'Refusing: public.cee_lessons has program_code, so it is not the superseded table.';
  END IF;
  FOREACH t IN ARRAY tables LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      IF t = 'cee_exam_programs' THEN
        EXECUTE 'SELECT count(*) FROM public.cee_exam_programs WHERE code IS DISTINCT FROM ''CEE_ME_NEPAL''' INTO n;
      ELSIF t = 'cee_subjects' THEN
        EXECUTE 'SELECT count(*) FROM public.cee_subjects WHERE code NOT IN (''BIO_ZOO'', ''BIO_BOT'', ''CHEM'', ''PHYS'', ''MAT'') OR code IS NULL' INTO n;
      ELSE
        EXECUTE format('SELECT count(*) FROM public.%I', t) INTO n;
      END IF;
      IF n > 0 THEN
        RAISE EXCEPTION 'Refusing: public.% has % row(s) beyond its own seed data. Export and review them before removing anything.', t, n;
      END IF;
    END IF;
  END LOOP;
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('DROP TABLE IF EXISTS public.%I CASCADE', t);
  END LOOP;
  -- Forget the CLI history entries too, so `supabase db push` doesn't think they're applied.
  IF to_regclass('supabase_migrations.schema_migrations') IS NOT NULL THEN
    DELETE FROM supabase_migrations.schema_migrations WHERE version IN ('20261124000000', '20261124000001');
  END IF;
  RAISE NOTICE 'Superseded schema removed (19 tables checked: no rows beyond its own seed data).';
END $guard$;

COMMIT;
