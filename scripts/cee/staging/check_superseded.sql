-- READ-ONLY. Safe to run on production (it only reads the system catalog).
--
-- Answers: were the superseded parallel-build migrations
-- (supabase/superseded/20261124000000_*.sql, 20261124000001_*.sql) ever installed
-- on this database, and is the chosen schema (supabase/proposed/) installed?
--
-- Markers:
--   superseded only: tables cee_exam_programs, cee_subjects, cee_asset_hotspots,
--                    cee_animation_sequences; its 20 named RLS policies;
--                    cee_lessons WITHOUT a program_code column
--   chosen only:     table cee_settings; cee_lessons WITH program_code;
--                    function cee_publish_revision(uuid, uuid, text)
--   CLI history:     supabase_migrations.schema_migrations versions 20261124000000/1
--
-- Output: one row per check, then a VERDICT row.

WITH
superseded_tables AS (
  SELECT string_agg(c.relname, ', ' ORDER BY c.relname) AS names, count(*) AS n
  FROM pg_class c JOIN pg_namespace s ON s.oid = c.relnamespace
  WHERE s.nspname = 'public' AND c.relkind = 'r'
    AND c.relname IN ('cee_exam_programs', 'cee_subjects', 'cee_asset_hotspots', 'cee_animation_sequences')
),
superseded_policies AS (
  SELECT count(*) AS n FROM pg_policy p JOIN pg_class c ON c.oid = p.polrelid
  WHERE p.polname IN (
    'Admins and Staff view cee_audit_logs', 'System insert cee_audit_logs', 'Staff manage cee_review_requests',
    'Staff manage cee_review_decisions', 'Staff manage cee_lesson_revisions', 'Staff manage cee_publications',
    'Public read cee_exam_programs', 'Public read cee_syllabus_versions', 'Public read cee_subjects',
    'Public read cee_curriculum_nodes', 'Public read cee_learning_objectives', 'Public read cee_publications',
    'Students read published cee_lessons', 'Students read published cee_lesson_revisions',
    'Students read approved cee_asset_versions', 'Students read cee_asset_hotspots', 'Students read cee_animation_sequences',
    'Students manage own cee_student_progress', 'Students insert own cee_player_events', 'Students view own cee_player_events')
),
lessons_shape AS (
  SELECT
    to_regclass('public.cee_lessons') IS NOT NULL AS exists,
    EXISTS (SELECT 1 FROM pg_attribute a WHERE a.attrelid = to_regclass('public.cee_lessons') AND a.attname = 'program_code' AND NOT a.attisdropped) AS has_program_code
),
chosen AS (
  SELECT
    to_regclass('public.cee_settings') IS NOT NULL AS settings,
    to_regprocedure('public.cee_publish_revision(uuid, uuid, text)') IS NOT NULL AS publish_fn
),
cli_history AS (
  -- The Supabase CLI records applied migrations here; the table may not exist.
  SELECT CASE WHEN to_regclass('supabase_migrations.schema_migrations') IS NULL THEN NULL ELSE
    (xpath('/row/n/text()', query_to_xml(
      $q$SELECT count(*) AS n FROM supabase_migrations.schema_migrations WHERE version IN ('20261124000000', '20261124000001')$q$,
      false, true, '')))[1]::text::int
  END AS n
),
any_cee AS (
  SELECT count(*) AS n FROM pg_class c JOIN pg_namespace s ON s.oid = c.relnamespace
  WHERE s.nspname = 'public' AND c.relkind = 'r' AND c.relname LIKE 'cee\_%'
)
SELECT 'superseded-only tables' AS check, CASE WHEN n > 0 THEN 'PRESENT: ' || names ELSE 'none' END AS result FROM superseded_tables
UNION ALL SELECT 'superseded RLS policies', CASE WHEN n > 0 THEN 'PRESENT: ' || n || ' of 20' ELSE 'none' END FROM superseded_policies
UNION ALL SELECT 'cee_lessons shape', CASE WHEN NOT exists THEN 'no table' WHEN has_program_code THEN 'chosen schema (has program_code)' ELSE 'SUPERSEDED schema (no program_code)' END FROM lessons_shape
UNION ALL SELECT 'chosen schema markers', CASE WHEN settings AND publish_fn THEN 'PRESENT' WHEN settings OR publish_fn THEN 'PARTIAL' ELSE 'none' END FROM chosen
UNION ALL SELECT 'CLI migration history', CASE WHEN n IS NULL THEN 'no supabase_migrations table' WHEN n > 0 THEN 'RECORDED: ' || n || ' superseded version(s)' ELSE 'no superseded versions recorded' END FROM cli_history
UNION ALL SELECT 'any public.cee_* tables', n::text FROM any_cee
UNION ALL
SELECT 'VERDICT',
  CASE
    WHEN (SELECT n FROM superseded_tables) > 0 OR (SELECT n FROM superseded_policies) > 0
         OR (SELECT exists AND NOT has_program_code FROM lessons_shape) OR coalesce((SELECT n FROM cli_history), 0) > 0
      THEN CASE WHEN (SELECT settings FROM chosen) THEN 'MIXED: both schemas present; stop and investigate'
                ELSE 'SUPERSEDED INSTALLED: remove it (supabase/superseded/README.md) before applying the chosen schema' END
    WHEN (SELECT settings AND publish_fn FROM chosen) THEN 'CHOSEN SCHEMA INSTALLED'
    WHEN (SELECT n FROM any_cee) > 0 THEN 'UNKNOWN cee_* tables: stop and investigate'
    ELSE 'CLEAN: neither schema installed; the chosen schema can be applied'
  END;
