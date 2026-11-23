-- ═══════════════════════════════════════════════════════════════════════════
-- ROLLBACK for 20261123_course_isolation_cleanup.sql
-- ═══════════════════════════════════════════════════════════════════════════
-- For each table the clean-up touched:
--   · it had program_type before → every backed-up value is put back, and its old
--     default restored;
--   · the clean-up added the column → the column is dropped (only if it still
--     carries the clean-up's comment).
-- Rows created after the clean-up are not in the backup and keep their value
-- where the column stays. The backup tables are kept; drop them once you're sure:
--   DROP TABLE public._course_isolation_backup_20261123, public._course_isolation_columns_20261123;
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

DO $rollback$
DECLARE r record; n bigint;
BEGIN
  IF to_regclass('public._course_isolation_columns_20261123') IS NULL THEN
    RAISE EXCEPTION 'No record of the clean-up here: nothing to undo.';
  END IF;
  FOR r IN SELECT * FROM public._course_isolation_columns_20261123 ORDER BY tbl LOOP
    IF to_regclass('public.' || r.tbl) IS NULL THEN CONTINUE; END IF;
    IF r.had_column THEN
      EXECUTE format('UPDATE public.%I t SET program_type = b.program_type
                      FROM public._course_isolation_backup_20261123 b
                      WHERE b.tbl = %L AND b.row_id = t.id::text
                        AND t.program_type::text IS DISTINCT FROM b.program_type', r.tbl, r.tbl);
      GET DIAGNOSTICS n = ROW_COUNT;
      IF r.old_default IS NOT NULL THEN
        EXECUTE format('ALTER TABLE public.%I ALTER COLUMN program_type SET DEFAULT %s', r.tbl, r.old_default);
      END IF;
      RAISE NOTICE 'restored  %: % rows; default %', r.tbl, n, coalesce(r.old_default, 'none');
    ELSIF col_description(to_regclass('public.' || r.tbl),
            (SELECT attnum FROM pg_attribute WHERE attrelid = to_regclass('public.' || r.tbl) AND attname = 'program_type'))
          LIKE 'Course this row belongs to. Added 2026-11-23 by course_isolation_cleanup%' THEN
      EXECUTE format('ALTER TABLE public.%I DROP COLUMN program_type', r.tbl);
      RAISE NOTICE 'dropped  %.program_type (added by the clean-up)', r.tbl;
    END IF;
  END LOOP;
END
$rollback$;

COMMIT;
