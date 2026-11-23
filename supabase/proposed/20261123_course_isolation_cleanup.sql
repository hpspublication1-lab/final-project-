-- ═══════════════════════════════════════════════════════════════════════════
-- PROPOSED — NOT APPLIED. Course isolation data clean-up.     Samyak Guru, 23 Nov 2026
-- ═══════════════════════════════════════════════════════════════════════════
-- Kept outside supabase/migrations on purpose, so `supabase db push` never runs it.
-- Run supabase/audit/course_isolation_audit.sql first and review its output; this
-- file may change after that. Ship branch fix/course-isolation before running it.
--
-- The live database has no program_type on subjects or batches (confirmed from
-- the preview's logs), so this file works on either shape of table.
--
-- WHAT IT DOES, in one transaction
--  1. Records which content tables already have program_type (and its default),
--     and copies every existing value, into two backup tables (RLS on, no
--     policies, no API access). The rollback file restores from them.
--  2. Adds program_type VARCHAR(20), nullable, no default, to every content table
--     that lacks it: subjects, chapters, batches, questions, video_lectures,
--     exams, notes, study_materials, flashcards, live_classes.
--  3. Removes DEFAULT 'cee' where it exists. From then on, a save that doesn't
--     name a course is refused instead of being filed under CEE.
--  4. Writes down what students already see, so strict mode can be turned on
--     without anything moving. Only rows with no course, or exactly 'cee' (the
--     old default), are touched:
--       a. subjects: the course the site places them in today — except a
--          subject in CEE that isn't one of CEE's four, which is left for you;
--       b. rows with a subject: their subject's course, unless their own name or
--          title names a different course (left for you);
--       c. rows without a subject: the course the site places them in today.
--     Values stored as 'digital', and names or titles that name several courses
--     (or "NEB" without a class), are left as they are. No row is deleted and no
--     id changes. The rules are those of resolveRowCourse() in courseIds.ts.
--
-- One visible effect: a note or exam filed under a SEE (or other) subject but
-- carrying no course of its own currently appears in CEE's free-resource and
-- mock-test lists; afterwards it appears in its subject's course instead.
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

-- ── The site's rules (resolveRowCourse), session-only ──────────────────────
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

CREATE FUNCTION pg_temp.known_subject(nm text) RETURNS text LANGUAGE sql IMMUTABLE AS $f$
  SELECT CASE lower(btrim(coalesce(nm, '')))
    WHEN 'biology' THEN 'cee_medical' WHEN 'chemistry' THEN 'cee_medical'
    WHEN 'physics' THEN 'cee_medical' WHEN 'mental_agility' THEN 'cee_medical'
    WHEN 'compulsory_science' THEN 'see_class_10' WHEN 'compulsory_math' THEN 'see_class_10'
    WHEN 'optional_math' THEN 'see_class_10' WHEN 'english' THEN 'see_class_10'
    WHEN 'social_studies' THEN 'see_class_10' ELSE NULL END
$f$;

CREATE FUNCTION pg_temp.course_hits(raw text) RETURNS text[] LANGUAGE sql IMMUTABLE AS $f$
  WITH t(txt) AS (SELECT lower(coalesce(raw, ''))),
  b(txt, h) AS (SELECT txt, array_remove(ARRAY[
    CASE WHEN txt ~ '(^|[^a-z0-9])(see|class[ _-]?10)([^a-z0-9]|$)' THEN 'see_class_10' END,
    CASE WHEN txt ~ '(^|[^a-z0-9])(class[ _-]?11|grade[ _-]?11)([^a-z0-9]|$)' THEN 'neb_class_11' END,
    CASE WHEN txt ~ '(^|[^a-z0-9])(class[ _-]?12|grade[ _-]?12)([^a-z0-9]|$)' THEN 'neb_class_12' END,
    CASE WHEN txt ~ '(^|[^a-z0-9])(ielts)([^a-z0-9]|$)' THEN 'ielts' END,
    CASE WHEN txt ~ '(^|[^a-z0-9])(marketing)([^a-z0-9]|$)' THEN 'digital_marketing' END,
    CASE WHEN txt ~ '(^|[^a-z0-9])(ai|artificial[ _-]intelligence|python|prompt[ _-]engineering)([^a-z0-9]|$)' THEN 'artificial_intelligence' END,
    CASE WHEN txt ~ '(^|[^a-z0-9])(ioe|engineering)([^a-z0-9]|$)'
          AND txt !~ '(^|[^a-z0-9])(prompt[ _-]engineering)([^a-z0-9]|$)' THEN 'ioe_engineering' END,
    CASE WHEN txt ~ '(^|[^a-z0-9])(lok[ _-]?sewa|loksewa)([^a-z0-9]|$)' THEN 'lok_sewa' END
  ]::text[], NULL) FROM t)
  SELECT CASE WHEN txt ~ '(^|[^a-z0-9])(neb)([^a-z0-9]|$)'
               AND NOT ('neb_class_11' = ANY(h) OR 'neb_class_12' = ANY(h))
              THEN h || ARRAY['neb_class_11', 'neb_class_12'] ELSE h END FROM b
$f$;

-- The row's own say: a course, '?' if it names several (or 'digital'), NULL if nothing.
CREATE FUNCTION pg_temp.own_course(stored text, nm text, txt text) RETURNS text LANGUAGE sql IMMUTABLE AS $f$
  SELECT CASE
    WHEN lower(btrim(coalesce(stored, ''))) = 'digital' THEN '?'
    WHEN pg_temp.course_of(stored) IS NOT NULL AND pg_temp.course_of(stored) <> 'cee_medical' THEN pg_temp.course_of(stored)
    WHEN pg_temp.known_subject(nm) IS NOT NULL THEN pg_temp.known_subject(nm)
    WHEN cardinality(pg_temp.course_hits(txt)) > 1 THEN '?'
    WHEN cardinality(pg_temp.course_hits(txt)) = 1 THEN (pg_temp.course_hits(txt))[1]
    ELSE NULL END
$f$;

-- Where the site shows the row today (resolveRowCourse, transitional mode).
CREATE FUNCTION pg_temp.today(stored text, nm text, txt text) RETURNS text LANGUAGE sql IMMUTABLE AS $f$
  SELECT CASE pg_temp.own_course(stored, nm, txt)
    WHEN '?' THEN NULL
    ELSE coalesce(pg_temp.own_course(stored, nm, txt),
                  CASE WHEN pg_temp.course_of(stored) = 'cee_medical' THEN 'cee_medical'
                       WHEN btrim(coalesce(stored, '')) = '' THEN 'cee_medical'
                       ELSE NULL END) END
$f$;

-- The value stored for a course (VARCHAR(20): "artificial_intelligence" doesn't fit).
CREATE FUNCTION pg_temp.stored_value(course text) RETURNS text LANGUAGE sql IMMUTABLE AS $f$
  SELECT CASE course WHEN 'artificial_intelligence' THEN 'ai' ELSE course END
$f$;

-- ── Which tables ───────────────────────────────────────────────────────────
CREATE TEMP TABLE _content ON COMMIT DROP AS
SELECT t.table_name AS tbl,
       EXISTS (SELECT 1 FROM information_schema.columns c WHERE c.table_schema = 'public' AND c.table_name = t.table_name AND c.column_name = 'program_type') AS has_pt,
       EXISTS (SELECT 1 FROM information_schema.columns c WHERE c.table_schema = 'public' AND c.table_name = t.table_name AND c.column_name = 'name') AS has_name,
       EXISTS (SELECT 1 FROM information_schema.columns c WHERE c.table_schema = 'public' AND c.table_name = t.table_name AND c.column_name = 'subject_id') AS has_subject,
       (SELECT c.column_default FROM information_schema.columns c WHERE c.table_schema = 'public' AND c.table_name = t.table_name AND c.column_name = 'program_type') AS old_default,
       coalesce((SELECT string_agg(format('t.%I::text', c.column_name), ', ' ORDER BY c.column_name)
                 FROM information_schema.columns c
                 WHERE c.table_schema = 'public' AND c.table_name = t.table_name
                   AND c.column_name IN ('slug', 'name', 'display_name', 'title')), '''''') AS txt_cols
FROM information_schema.tables t
WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE'
  AND t.table_name NOT LIKE '\_course\_isolation\_%'
  AND EXISTS (SELECT 1 FROM information_schema.columns c WHERE c.table_schema = 'public' AND c.table_name = t.table_name AND c.column_name = 'id')
  AND (t.table_name IN ('subjects', 'chapters', 'batches', 'questions', 'video_lectures', 'exams', 'notes',
                        'study_materials', 'flashcards', 'live_classes')
       OR EXISTS (SELECT 1 FROM information_schema.columns c WHERE c.table_schema = 'public'
                  AND c.table_name = t.table_name AND c.column_name = 'program_type'));

-- ── 1. Backup ──────────────────────────────────────────────────────────────
CREATE TABLE public._course_isolation_columns_20261123 (
  tbl text PRIMARY KEY, had_column boolean NOT NULL, old_default text, captured_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public._course_isolation_backup_20261123 (
  tbl text NOT NULL, row_id text NOT NULL, program_type text, captured_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tbl, row_id));
ALTER TABLE public._course_isolation_columns_20261123 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public._course_isolation_backup_20261123 ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public._course_isolation_columns_20261123, public._course_isolation_backup_20261123 FROM PUBLIC;
DO $grants$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON public._course_isolation_columns_20261123, public._course_isolation_backup_20261123 FROM anon; END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON public._course_isolation_columns_20261123, public._course_isolation_backup_20261123 FROM authenticated; END IF;
END $grants$;

INSERT INTO public._course_isolation_columns_20261123 (tbl, had_column, old_default)
SELECT tbl, has_pt, old_default FROM _content;

DO $backup$
DECLARE r record; n bigint;
BEGIN
  FOR r IN SELECT * FROM _content WHERE has_pt ORDER BY tbl LOOP
    EXECUTE format('INSERT INTO public._course_isolation_backup_20261123 (tbl, row_id, program_type)
                    SELECT %L, id::text, program_type::text FROM public.%I', r.tbl, r.tbl);
    GET DIAGNOSTICS n = ROW_COUNT;
    RAISE NOTICE 'backup  %: % rows', r.tbl, n;
  END LOOP;
END
$backup$;

-- ── 2. A course column everywhere ──────────────────────────────────────────
DO $addcol$
DECLARE r record;
BEGIN
  FOR r IN SELECT * FROM _content WHERE NOT has_pt ORDER BY tbl LOOP
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN program_type VARCHAR(20)', r.tbl);
    EXECUTE format('COMMENT ON COLUMN public.%I.program_type IS %L', r.tbl,
                   'Course this row belongs to. Added 2026-11-23 by course_isolation_cleanup; NULL = not filed yet.');
    RAISE NOTICE 'column added  %.program_type', r.tbl;
  END LOOP;
END
$addcol$;

-- ── 3. No more silent CEE default ──────────────────────────────────────────
DO $nodefault$
DECLARE r record;
BEGIN
  FOR r IN SELECT * FROM _content WHERE has_pt AND old_default IS NOT NULL ORDER BY tbl LOOP
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN program_type DROP DEFAULT', r.tbl);
    RAISE NOTICE 'default dropped  % (was %)', r.tbl, r.old_default;
  END LOOP;
END
$nodefault$;

-- ── 4a. Subjects ───────────────────────────────────────────────────────────
DO $subjects$
DECLARE r record; n bigint;
BEGIN
  SELECT * INTO r FROM _content WHERE tbl = 'subjects';
  IF NOT FOUND THEN RETURN; END IF;
  EXECUTE format($u$
    UPDATE public.subjects t
       SET program_type = pg_temp.stored_value(pg_temp.today(t.program_type::text, %1$s, concat_ws(' ', %2$s)))
     WHERE (t.program_type IS NULL OR btrim(t.program_type::text) = '' OR lower(btrim(t.program_type::text)) = 'cee')
       AND pg_temp.today(t.program_type::text, %1$s, concat_ws(' ', %2$s)) IS NOT NULL
       -- a subject in CEE that isn't one of CEE's four: a person decides
       AND NOT (pg_temp.today(t.program_type::text, %1$s, concat_ws(' ', %2$s)) = 'cee_medical'
                AND pg_temp.known_subject(%1$s) IS DISTINCT FROM 'cee_medical')
  $u$, CASE WHEN r.has_name THEN 't.name::text' ELSE 'NULL::text' END, r.txt_cols);
  GET DIAGNOSTICS n = ROW_COUNT;
  RAISE NOTICE 'subjects filed: % rows', n;
END
$subjects$;

-- ── 4b/4c. Everything else ─────────────────────────────────────────────────
DO $rows$
DECLARE r record; n bigint; nm text;
BEGIN
  FOR r IN SELECT * FROM _content WHERE tbl <> 'subjects' ORDER BY tbl LOOP
    nm := CASE WHEN r.has_name THEN 't.name::text' ELSE 'NULL::text' END;
    IF r.has_subject AND to_regclass('public.subjects') IS NOT NULL THEN
      -- b. follow the subject, unless the row names a different course of its own
      EXECUTE format($u$
        UPDATE public.%1$I t SET program_type = s.program_type
          FROM public.subjects s
         WHERE t.subject_id = s.id
           AND (t.program_type IS NULL OR btrim(t.program_type::text) = '' OR lower(btrim(t.program_type::text)) = 'cee')
           AND pg_temp.course_of(s.program_type::text) IS NOT NULL
           AND (pg_temp.own_course(t.program_type::text, %2$s, concat_ws(' ', %3$s)) IS NULL
                OR pg_temp.own_course(t.program_type::text, %2$s, concat_ws(' ', %3$s)) = pg_temp.course_of(s.program_type::text))
      $u$, r.tbl, nm, r.txt_cols);
      GET DIAGNOSTICS n = ROW_COUNT;
      RAISE NOTICE '% follow their subject: % rows', r.tbl, n;
      -- c. rows with no subject: where the site shows them today
      EXECUTE format($u$
        UPDATE public.%1$I t SET program_type = pg_temp.stored_value(pg_temp.today(t.program_type::text, %2$s, concat_ws(' ', %3$s)))
         WHERE t.subject_id IS NULL
           AND (t.program_type IS NULL OR btrim(t.program_type::text) = '' OR lower(btrim(t.program_type::text)) = 'cee')
           AND pg_temp.today(t.program_type::text, %2$s, concat_ws(' ', %3$s)) IS NOT NULL
      $u$, r.tbl, nm, r.txt_cols);
      GET DIAGNOSTICS n = ROW_COUNT;
      RAISE NOTICE '% with no subject filed: % rows', r.tbl, n;
    ELSE
      EXECUTE format($u$
        UPDATE public.%1$I t SET program_type = pg_temp.stored_value(pg_temp.today(t.program_type::text, %2$s, concat_ws(' ', %3$s)))
         WHERE (t.program_type IS NULL OR btrim(t.program_type::text) = '' OR lower(btrim(t.program_type::text)) = 'cee')
           AND pg_temp.today(t.program_type::text, %2$s, concat_ws(' ', %3$s)) IS NOT NULL
      $u$, r.tbl, nm, r.txt_cols);
      GET DIAGNOSTICS n = ROW_COUNT;
      RAISE NOTICE '% filed: % rows', r.tbl, n;
    END IF;
  END LOOP;
END
$rows$;

-- ── Summary ────────────────────────────────────────────────────────────────
DO $summary$
DECLARE r record; n bigint; left_open bigint;
BEGIN
  FOR r IN SELECT * FROM _content ORDER BY tbl LOOP
    IF r.has_pt THEN
      EXECUTE format('SELECT count(*) FROM public.%I t JOIN public._course_isolation_backup_20261123 b
                      ON b.tbl = %L AND b.row_id = t.id::text
                      WHERE b.program_type IS DISTINCT FROM t.program_type::text', r.tbl, r.tbl) INTO n;
    ELSE
      EXECUTE format('SELECT count(*) FROM public.%I WHERE program_type IS NOT NULL', r.tbl) INTO n;
    END IF;
    EXECUTE format('SELECT count(*) FROM public.%I WHERE program_type IS NULL OR btrim(program_type::text) = %L', r.tbl, '') INTO left_open;
    RAISE NOTICE 'summary  %: % rows given a course; % still without one', r.tbl, n, left_open;
  END LOOP;
END
$summary$;

COMMIT;
