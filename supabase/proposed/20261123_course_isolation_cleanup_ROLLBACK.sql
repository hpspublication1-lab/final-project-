-- ═══════════════════════════════════════════════════════════════════════════
-- ROLLBACK for 20261123_course_isolation_cleanup.sql
-- ═══════════════════════════════════════════════════════════════════════════
-- Puts every program_type back to its backed-up value, restores DEFAULT 'cee', and
-- drops the program_type columns that the clean-up added (only those: it checks
-- the column comment it wrote). Rows created after the clean-up are not in the
-- backup and are left as they are. The backup table is kept; drop it yourself
-- once you're sure:  DROP TABLE public._course_isolation_backup_20261123;
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

DO $restore$
DECLARE r record; n bigint;
BEGIN
  IF to_regclass('public._course_isolation_backup_20261123') IS NULL THEN
    RAISE EXCEPTION 'No backup table: the clean-up was never applied here.';
  END IF;
  FOR r IN SELECT DISTINCT tbl FROM public._course_isolation_backup_20261123 ORDER BY tbl LOOP
    EXECUTE format('UPDATE public.%I t SET program_type = b.program_type
                    FROM public._course_isolation_backup_20261123 b
                    WHERE b.tbl = %L AND b.row_id = t.id::text
                      AND t.program_type::text IS DISTINCT FROM b.program_type', r.tbl, r.tbl);
    GET DIAGNOSTICS n = ROW_COUNT;
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN program_type SET DEFAULT %L', r.tbl, 'cee');
    RAISE NOTICE 'restored  %: % rows, default back to cee', r.tbl, n;
  END LOOP;
END
$restore$;

DO $dropcols$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['study_materials', 'flashcards', 'live_classes'] LOOP
    IF col_description(to_regclass('public.' || t),
         (SELECT attnum FROM pg_attribute WHERE attrelid = to_regclass('public.' || t) AND attname = 'program_type'))
       LIKE 'Course this row belongs to. Added 2026-11-23 by course_isolation_cleanup%' THEN
      EXECUTE format('ALTER TABLE public.%I DROP COLUMN program_type', t);
      RAISE NOTICE 'dropped  %.program_type', t;
    END IF;
  END LOOP;
END
$dropcols$;

COMMIT;
