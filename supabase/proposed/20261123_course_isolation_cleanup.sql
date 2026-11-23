-- ═══════════════════════════════════════════════════════════════════════════
-- PROPOSED — NOT APPLIED. Course isolation data clean-up.     Samyak Guru, 23 Nov 2026
-- ═══════════════════════════════════════════════════════════════════════════
-- Kept outside supabase/migrations on purpose, so `supabase db push` never runs it.
-- Run supabase/audit/course_isolation_audit.sql first and review its output; this
-- file may need changes after that.
--
-- WHAT IT DOES
--  1. Backs up every program_type value to public._course_isolation_backup_20261123
--     (RLS on, no policies, no API access). The rollback file restores from it.
--  2. Removes the DEFAULT 'cee' from program_type everywhere. From then on, an
--     insert that doesn't say which course it belongs to is refused instead of
--     being filed under CEE. (Every admin screen on branch fix/course-isolation
--     now says. Ship that branch first.)
--  3. Adds a nullable program_type to study_materials, flashcards and live_classes,
--     if they exist and lack one. Existing rows stay NULL until an admin files them.
--  4. Records what the site already shows today, so strict mode can be turned on
--     without anything moving. It touches only rows stored as exactly 'cee' (the
--     old default, which proves nothing):
--       a. a chapter, note, video, question or exam whose subject is explicitly in
--          another course takes its subject's value, unless its own title names a
--          different course;
--       b. a row whose own title/slug/name names exactly one other course takes
--          that course.
--     It does NOT decide anything a person should: values stored as 'digital',
--     titles that name several courses, and subjects filed under CEE that aren't
--     CEE subjects are left as they are. The audit lists them by id.
--
-- TO RUN (after approval):  SET samyak.approve_course_cleanup = 'yes';  then this file.
-- TO UNDO:                  20261123_course_isolation_cleanup_ROLLBACK.sql
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

DO $latch$
BEGIN
  IF coalesce(current_setting('samyak.approve_course_cleanup', true), '') <> 'yes' THEN
    RAISE EXCEPTION 'Not approved. Run  SET samyak.approve_course_cleanup = ''yes'';  first.';
  END IF;
END
$latch$;

-- Same rules as resolveRowCourse() in src/lib/courses/courseIds.ts. Session-only.
CREATE FUNCTION pg_temp.course_of(stored text) RETURNS text LANGUAGE sql IMMUTABLE AS $f$
  SELECT CASE lower(btrim(coalesce(stored, '')))
    WHEN 'cee_medical' THEN 'cee_medical' WHEN 'cee' THEN 'cee_medical'
    WHEN 'see_class_10' THEN 'see_class_10' WHEN 'see' THEN 'see_class_10'
    WHEN 'ielts' THEN 'ielts' WHEN 'english' THEN 'ielts'
    WHEN 'digital_marketing' THEN 'digital_marketing'
    WHEN 'artificial_intelligence' THEN 'artificial_intelligence' WHEN 'ai' THEN 'artificial_intelligence'
    WHEN 'ioe_engineering' THEN 'ioe_engineering' WHEN 'ioe' THEN 'ioe_engineering' WHEN 'engineering' THEN 'ioe_engineering'
    WHEN 'lok_sewa' THEN 'lok_sewa' WHEN 'loksewa' THEN 'lok_sewa'
    WHEN 'neb_class_11' THEN 'neb_class_11' WHEN 'class11' THEN 'neb_class_11'
    WHEN 'neb_class_12' THEN 'neb_class_12' WHEN 'class12' THEN 'neb_class_12'
    ELSE NULL END
$f$;

CREATE FUNCTION pg_temp.course_hits(raw text) RETURNS text[] LANGUAGE sql IMMUTABLE AS $f$
  WITH t(txt) AS (SELECT lower(coalesce(raw, '')))
  SELECT array_remove(ARRAY[
    CASE WHEN txt ~ '(^|[^a-z0-9])(see|class[ _-]?10)([^a-z0-9]|$)' THEN 'see_class_10' END,
    CASE WHEN txt ~ '(^|[^a-z0-9])(class[ _-]?11|grade[ _-]?11)([^a-z0-9]|$)' THEN 'neb_class_11' END,
    CASE WHEN txt ~ '(^|[^a-z0-9])(class[ _-]?12|grade[ _-]?12)([^a-z0-9]|$)' THEN 'neb_class_12' END,
    CASE WHEN txt ~ '(^|[^a-z0-9])(ielts)([^a-z0-9]|$)' THEN 'ielts' END,
    CASE WHEN txt ~ '(^|[^a-z0-9])(marketing)([^a-z0-9]|$)' THEN 'digital_marketing' END,
    CASE WHEN txt ~ '(^|[^a-z0-9])(ai|artificial[ _-]intelligence|python|prompt[ _-]engineering)([^a-z0-9]|$)' THEN 'artificial_intelligence' END,
    CASE WHEN txt ~ '(^|[^a-z0-9])(ioe|engineering)([^a-z0-9]|$)'
          AND txt !~ '(^|[^a-z0-9])(prompt[ _-]engineering)([^a-z0-9]|$)' THEN 'ioe_engineering' END,
    CASE WHEN txt ~ '(^|[^a-z0-9])(lok[ _-]?sewa|loksewa)([^a-z0-9]|$)' THEN 'lok_sewa' END
  ]::text[], NULL) FROM t
$f$;

-- The value stored for a course (VARCHAR(20): "artificial_intelligence" doesn't fit).
CREATE FUNCTION pg_temp.stored_value(course text) RETURNS text LANGUAGE sql IMMUTABLE AS $f$
  SELECT CASE course WHEN 'artificial_intelligence' THEN 'ai' ELSE course END
$f$;

-- ── 1. Backup ──────────────────────────────────────────────────────────────
CREATE TABLE public._course_isolation_backup_20261123 (
  tbl          text NOT NULL,
  row_id       text NOT NULL,
  program_type text,
  captured_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tbl, row_id)
);
ALTER TABLE public._course_isolation_backup_20261123 ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public._course_isolation_backup_20261123 FROM PUBLIC;
DO $grants$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON public._course_isolation_backup_20261123 FROM anon; END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON public._course_isolation_backup_20261123 FROM authenticated; END IF;
END $grants$;

CREATE TEMP TABLE _owned ON COMMIT DROP AS
SELECT c.table_name AS tbl,
       coalesce((SELECT string_agg(format('%I::text', t.column_name), ', ' ORDER BY t.column_name)
                 FROM information_schema.columns t
                 WHERE t.table_schema = 'public' AND t.table_name = c.table_name
                   AND t.column_name IN ('slug', 'name', 'display_name', 'title')), '''''') AS txt_cols,
       EXISTS (SELECT 1 FROM information_schema.columns t WHERE t.table_schema = 'public'
               AND t.table_name = c.table_name AND t.column_name = 'subject_id') AS has_subject
FROM information_schema.columns c
JOIN information_schema.tables tt ON tt.table_schema = 'public' AND tt.table_name = c.table_name AND tt.table_type = 'BASE TABLE'
WHERE c.table_schema = 'public' AND c.column_name = 'program_type'
  AND c.table_name <> '_course_isolation_backup_20261123'
  AND EXISTS (SELECT 1 FROM information_schema.columns t WHERE t.table_schema = 'public'
              AND t.table_name = c.table_name AND t.column_name = 'id');

DO $backup$
DECLARE r record; n bigint;
BEGIN
  FOR r IN SELECT * FROM _owned ORDER BY tbl LOOP
    EXECUTE format('INSERT INTO public._course_isolation_backup_20261123 (tbl, row_id, program_type)
                    SELECT %L, id::text, program_type::text FROM public.%I', r.tbl, r.tbl);
    GET DIAGNOSTICS n = ROW_COUNT;
    RAISE NOTICE 'backup  %: % rows', r.tbl, n;
  END LOOP;
END
$backup$;

-- ── 2. No more silent CEE default ──────────────────────────────────────────
DO $nodefault$
DECLARE r record;
BEGIN
  FOR r IN SELECT * FROM _owned ORDER BY tbl LOOP
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN program_type DROP DEFAULT', r.tbl);
    RAISE NOTICE 'default dropped  %', r.tbl;
  END LOOP;
END
$nodefault$;

-- ── 3. A course column where there was none ────────────────────────────────
DO $addcol$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['study_materials', 'flashcards', 'live_classes'] LOOP
    IF to_regclass('public.' || t) IS NOT NULL AND NOT EXISTS (
         SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t AND column_name = 'program_type') THEN
      EXECUTE format('ALTER TABLE public.%I ADD COLUMN program_type VARCHAR(20)', t);
      EXECUTE format('COMMENT ON COLUMN public.%I.program_type IS %L', t,
                     'Course this row belongs to. Added 2026-11-23 by course_isolation_cleanup; NULL = not filed yet.');
      RAISE NOTICE 'column added  %.program_type', t;
    END IF;
  END LOOP;
END
$addcol$;

-- ── 4a. Children follow an explicitly non-CEE subject ──────────────────────
DO $children$
DECLARE r record; n bigint;
BEGIN
  IF to_regclass('public.subjects') IS NULL THEN RETURN; END IF;
  FOR r IN SELECT * FROM _owned WHERE has_subject AND tbl <> 'subjects' ORDER BY tbl LOOP
    EXECUTE format($u$
      UPDATE public.%1$I t SET program_type = s.program_type
      FROM public.subjects s
      WHERE t.subject_id = s.id
        AND lower(btrim(t.program_type::text)) = 'cee'
        AND pg_temp.course_of(s.program_type::text) IS NOT NULL
        AND pg_temp.course_of(s.program_type::text) <> 'cee_medical'
        AND (cardinality(pg_temp.course_hits(concat_ws(' ', %2$s))) = 0
             OR pg_temp.course_hits(concat_ws(' ', %2$s)) = ARRAY[pg_temp.course_of(s.program_type::text)])
    $u$, r.tbl, regexp_replace(r.txt_cols, '"?([a-z_]+)"?::text', 't.\1::text', 'g'));
    GET DIAGNOSTICS n = ROW_COUNT;
    RAISE NOTICE 'follow subject  %: % rows', r.tbl, n;
  END LOOP;
END
$children$;

-- ── 4b. Rows whose own title names exactly one other course ───────────────
DO $titles$
DECLARE r record; n bigint;
BEGIN
  FOR r IN SELECT * FROM _owned ORDER BY tbl LOOP
    EXECUTE format($u$
      UPDATE public.%1$I t SET program_type = pg_temp.stored_value(z.h[1])
      FROM (SELECT id, pg_temp.course_hits(concat_ws(' ', %2$s)) AS h FROM public.%1$I) z
      WHERE z.id = t.id
        AND lower(btrim(t.program_type::text)) = 'cee'
        AND cardinality(z.h) = 1
    $u$, r.tbl, r.txt_cols);
    GET DIAGNOSTICS n = ROW_COUNT;
    RAISE NOTICE 'title names course  %: % rows', r.tbl, n;
  END LOOP;
END
$titles$;

-- ── Summary: what changed, per table ───────────────────────────────────────
DO $summary$
DECLARE r record; n bigint;
BEGIN
  FOR r IN SELECT * FROM _owned ORDER BY tbl LOOP
    EXECUTE format('SELECT count(*) FROM public.%I t JOIN public._course_isolation_backup_20261123 b
                    ON b.tbl = %L AND b.row_id = t.id::text
                    WHERE b.program_type IS DISTINCT FROM t.program_type::text', r.tbl, r.tbl) INTO n;
    RAISE NOTICE 'changed  %: % rows', r.tbl, n;
  END LOOP;
END
$summary$;

COMMIT;
