-- ═══════════════════════════════════════════════════════════════════════════
-- COURSE ISOLATION AUDIT — READ ONLY                       Samyak Guru, 23 Nov 2026
-- ═══════════════════════════════════════════════════════════════════════════
-- Paste the whole file into the Supabase SQL editor and run it. It changes
-- nothing: the transaction is read-only, and every statement is a SELECT. (If the
-- editor warns "SET TRANSACTION can only be used in transaction blocks", that is
-- harmless: it only means the read-only guard didn't apply; the query still only reads.)
-- It returns one table (section, tbl, item, detail, n). Export it as CSV and send
-- it back; the next step (the data clean-up) is written from what it shows.
--
-- What it answers
--   schema      Is subjects.name still the 4-value CEE enum? Which tables have a
--               program_type column, with what default; any CHECK constraints.
--   stored      Every program_type value per table, as stored.
--   strict      What each course would show with STRICT_COURSE_ISOLATION=on
--               (program_type only).
--   today       What each course shows now: the site's transitional rules,
--               reproduced here (same as resolveRowCourse() in courseIds.ts).
--   unplaced    Rows shown in no course (ambiguous value or title).
--   would_move  Rows stored as CEE whose own title/slug/name names another course.
--   suspect     Subjects filed under CEE that aren't one of CEE's four subjects.
--   subject_mismatch  Rows whose program_type disagrees with their subject's.
--   orphan      Rows with no subject, a missing subject, or no chapter.
--   review      Up to 200 individual rows from would_move / unplaced, by id.
-- ═══════════════════════════════════════════════════════════════════════════
SET TRANSACTION READ ONLY;

WITH
-- every public table with a program_type column, and the text columns that can name a course
owned AS (
  SELECT c.table_name AS tbl,
         coalesce((
           SELECT string_agg(format('%I::text', t.column_name), ', ' ORDER BY t.column_name)
           FROM information_schema.columns t
           WHERE t.table_schema = 'public' AND t.table_name = c.table_name
             AND t.column_name IN ('slug', 'name', 'display_name', 'title')
         ), '''''') AS txt_cols,
         EXISTS (SELECT 1 FROM information_schema.columns t WHERE t.table_schema = 'public'
                 AND t.table_name = c.table_name AND t.column_name = 'subject_id') AS has_subject,
         EXISTS (SELECT 1 FROM information_schema.columns t WHERE t.table_schema = 'public'
                 AND t.table_name = c.table_name AND t.column_name = 'chapter_id') AS has_chapter,
         EXISTS (SELECT 1 FROM information_schema.columns t WHERE t.table_schema = 'public'
                 AND t.table_name = c.table_name AND t.column_name = 'id') AS has_id
  FROM information_schema.columns c
  JOIN information_schema.tables tt ON tt.table_schema = c.table_schema AND tt.table_name = c.table_name AND tt.table_type = 'BASE TABLE'
  WHERE c.table_schema = 'public' AND c.column_name = 'program_type'
),
-- the per-row course resolution, as SQL text with two slots: %1$s text columns, %2$I table
resolver(sql) AS (VALUES ($r$
  WITH a(v, course) AS (VALUES
    ('cee_medical','cee_medical'),('cee','cee_medical'),
    ('see_class_10','see_class_10'),('see','see_class_10'),
    ('ielts','ielts'),('english','ielts'),
    ('digital_marketing','digital_marketing'),
    ('artificial_intelligence','artificial_intelligence'),('ai','artificial_intelligence'),
    ('ioe_engineering','ioe_engineering'),('ioe','ioe_engineering'),('engineering','ioe_engineering'),
    ('lok_sewa','lok_sewa'),('loksewa','lok_sewa'),
    ('neb_class_11','neb_class_11'),('class11','neb_class_11'),
    ('neb_class_12','neb_class_12'),('class12','neb_class_12')),
  r AS (
    SELECT %3$s AS row_id, %4$s AS subject_id, %5$s AS chapter_id,
           lower(btrim(coalesce(program_type::text, ''))) AS stored,
           lower(concat_ws(' ', %1$s)) AS txt,
           left(concat_ws(' / ', %1$s), 120) AS label
    FROM public.%2$I),
  h AS (
    SELECT r.*, a.course AS explicit,
      array_remove(ARRAY[
        CASE WHEN txt ~ '(^|[^a-z0-9])(see|class[ _-]?10)([^a-z0-9]|$)' THEN 'see_class_10' END,
        CASE WHEN txt ~ '(^|[^a-z0-9])(class[ _-]?11|grade[ _-]?11)([^a-z0-9]|$)' THEN 'neb_class_11' END,
        CASE WHEN txt ~ '(^|[^a-z0-9])(class[ _-]?12|grade[ _-]?12)([^a-z0-9]|$)' THEN 'neb_class_12' END,
        CASE WHEN txt ~ '(^|[^a-z0-9])(ielts)([^a-z0-9]|$)' THEN 'ielts' END,
        CASE WHEN txt ~ '(^|[^a-z0-9])(marketing)([^a-z0-9]|$)' THEN 'digital_marketing' END,
        CASE WHEN txt ~ '(^|[^a-z0-9])(ai|artificial[ _-]intelligence|python|prompt[ _-]engineering)([^a-z0-9]|$)' THEN 'artificial_intelligence' END,
        CASE WHEN txt ~ '(^|[^a-z0-9])(ioe|engineering)([^a-z0-9]|$)'
              AND txt !~ '(^|[^a-z0-9])(prompt[ _-]engineering)([^a-z0-9]|$)' THEN 'ioe_engineering' END,
        CASE WHEN txt ~ '(^|[^a-z0-9])(lok[ _-]?sewa|loksewa)([^a-z0-9]|$)' THEN 'lok_sewa' END
      ]::text[], NULL) AS hits
    FROM r LEFT JOIN a ON a.v = r.stored),
  x AS (
    SELECT h.*,
      CASE
        WHEN stored = 'digital' THEN NULL                                  -- ambiguous alias
        WHEN explicit IS NOT NULL AND explicit <> 'cee_medical' THEN explicit
        WHEN cardinality(hits) > 1 THEN NULL                               -- names several courses
        WHEN cardinality(hits) = 1 THEN hits[1]
        ELSE explicit                                                      -- 'cee' as stored, or nothing
      END AS today
    FROM h)
$r$)),
per_table(tbl, q) AS (
  SELECT o.tbl, format((SELECT sql FROM resolver), o.txt_cols, o.tbl,
                       CASE WHEN o.has_id THEN 'id::text' ELSE 'NULL::text' END,
                       CASE WHEN o.has_subject THEN 'subject_id::text' ELSE 'NULL::text' END,
                       CASE WHEN o.has_chapter THEN 'chapter_id::text' ELSE 'NULL::text' END)
  FROM owned o
),
dyn(tbl, q) AS (
  -- stored values
  SELECT tbl, q || $q$ SELECT 'stored' AS section, CASE WHEN stored = '' THEN '(empty)' ELSE stored END AS item,
                              NULL::text AS detail, count(*) AS n FROM x GROUP BY 2 $q$ FROM per_table
  UNION ALL
  -- strict mode: program_type only
  SELECT tbl, q || $q$ SELECT 'strict' AS section, coalesce(explicit, '(not shown)') AS item, NULL::text AS detail, count(*) AS n FROM x GROUP BY 2 $q$ FROM per_table
  UNION ALL
  -- today's transitional rules
  SELECT tbl, q || $q$ SELECT 'today' AS section, coalesce(today, '(not shown)') AS item, NULL::text AS detail, count(*) AS n FROM x GROUP BY 2 $q$ FROM per_table
  UNION ALL
  SELECT tbl, q || $q$ SELECT 'unplaced' AS section, CASE WHEN stored = 'digital' THEN 'stored as ''digital''' WHEN cardinality(hits) > 1 THEN 'title names several courses' ELSE 'unknown program_type value: ' || stored END AS item,
                              NULL::text AS detail, count(*) AS n FROM x WHERE today IS NULL GROUP BY 2 $q$ FROM per_table
  UNION ALL
  SELECT tbl, q || $q$ SELECT 'would_move' AS section, 'stored ' || stored || ' → ' || today AS item, NULL::text AS detail, count(*) AS n FROM x
                       WHERE explicit = 'cee_medical' AND today IS DISTINCT FROM 'cee_medical' AND today IS NOT NULL GROUP BY 2 $q$ FROM per_table
  UNION ALL
  SELECT tbl, q || $q$ SELECT 'review' AS section, row_id AS item, label || '  [stored: ' || stored || ', shown in: ' || coalesce(today, 'no course') || ']' AS detail,
                              NULL::bigint AS n FROM x WHERE (explicit = 'cee_medical' AND today IS DISTINCT FROM 'cee_medical') OR today IS NULL
                       ORDER BY 2 LIMIT 200 $q$ FROM per_table
  UNION ALL
  -- CEE has exactly four subjects. Any other subject filed under CEE is probably
  -- another course's, left on the column default (title words can't catch these).
  SELECT tbl, q || $q$ SELECT 'suspect' AS section, row_id AS item,
                              label || '  [stored: ' || stored || '] — not one of the 4 CEE subjects' AS detail, NULL::bigint AS n
                       FROM x WHERE today = 'cee_medical'
                         AND lower(txt) !~ '(^|[^a-z0-9])(biology|botany|zoology|chemistry|physics|mental[ _-]agility|mat)([^a-z0-9]|$)' $q$
  FROM per_table WHERE tbl = 'subjects'
  UNION ALL
  -- orphans (tables with subject_id / chapter_id only)
  SELECT p.tbl, p.q || $q$ SELECT 'orphan' AS section, 'no subject' AS item, NULL::text AS detail, count(*) AS n FROM x WHERE subject_id IS NULL HAVING count(*) > 0 $q$
  FROM per_table p JOIN owned o USING (tbl) WHERE o.has_subject AND p.tbl <> 'subjects'
  UNION ALL
  SELECT p.tbl, p.q || $q$ SELECT 'orphan' AS section, 'subject_id points to a missing subject' AS item, NULL::text AS detail, count(*) AS n FROM x
                       WHERE subject_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.subjects s WHERE s.id::text = x.subject_id) HAVING count(*) > 0 $q$
  FROM per_table p JOIN owned o USING (tbl) WHERE o.has_subject AND p.tbl <> 'subjects' AND EXISTS (SELECT 1 FROM owned WHERE tbl = 'subjects')
  UNION ALL
  SELECT p.tbl, p.q || $q$ SELECT 'orphan' AS section, 'no chapter' AS item, NULL::text AS detail, count(*) AS n FROM x WHERE chapter_id IS NULL HAVING count(*) > 0 $q$
  FROM per_table p JOIN owned o USING (tbl) WHERE o.has_chapter
  UNION ALL
  -- disagreement with the parent subject (both read strictly)
  SELECT p.tbl, p.q || $q$ , sub AS (SELECT s.id::text AS id, lower(btrim(coalesce(s.program_type::text, ''))) AS stored FROM public.subjects s)
                       SELECT 'subject_mismatch' AS section, 'row ' || coalesce(nullif(x.stored, ''), '(empty)') || ' vs subject ' || coalesce(nullif(sub.stored, ''), '(empty)') AS item,
                              NULL::text AS detail, count(*) AS n FROM x JOIN sub ON sub.id = x.subject_id
                       WHERE x.explicit IS DISTINCT FROM (SELECT course FROM a WHERE a.v = sub.stored) GROUP BY 2 $q$
  FROM per_table p JOIN owned o USING (tbl) WHERE o.has_subject AND p.tbl <> 'subjects' AND EXISTS (SELECT 1 FROM owned WHERE tbl = 'subjects')
),
dyn_rows AS (
  SELECT d.tbl,
         replace(replace(replace(replace((xpath('/row/section/text()', rw))[1]::text, '&amp;', '&'), '&lt;', '<'), '&gt;', '>'), '&quot;', '"') AS section,
         replace(replace(replace(replace((xpath('/row/item/text()', rw))[1]::text, '&amp;', '&'), '&lt;', '<'), '&gt;', '>'), '&quot;', '"') AS item,
         replace(replace(replace(replace((xpath('/row/detail/text()', rw))[1]::text, '&amp;', '&'), '&lt;', '<'), '&gt;', '>'), '&quot;', '"') AS detail,
         ((xpath('/row/n/text()', rw))[1]::text)::bigint AS n
  FROM dyn d, unnest(xpath('/table/row', query_to_xml(d.q, false, false, ''))) AS rw
),
schema_rows AS (
  -- is subjects.name still the CEE-only enum?
  SELECT 'schema'::text AS section, 'subjects'::text AS tbl, 'name column type'::text AS item,
         c.data_type || ' (' || c.udt_name || ')' ||
         coalesce(' values: ' || (SELECT string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder)
                                  FROM pg_type ty JOIN pg_enum e ON e.enumtypid = ty.oid WHERE ty.typname = c.udt_name), '') AS detail,
         NULL::bigint AS n
  FROM information_schema.columns c
  WHERE c.table_schema = 'public' AND c.table_name = 'subjects' AND c.column_name = 'name'
  UNION ALL
  SELECT 'schema', c.table_name, 'program_type column',
         c.data_type || coalesce('(' || c.character_maximum_length || ')', '') ||
         CASE WHEN c.is_nullable = 'NO' THEN ' NOT NULL' ELSE ' nullable' END ||
         coalesce(' DEFAULT ' || c.column_default, ' no default'), NULL
  FROM information_schema.columns c
  WHERE c.table_schema = 'public' AND c.column_name = 'program_type'
  UNION ALL
  SELECT 'schema', cl.relname, 'CHECK constraint ' || con.conname, pg_get_constraintdef(con.oid), NULL
  FROM pg_constraint con JOIN pg_class cl ON cl.oid = con.conrelid JOIN pg_namespace ns ON ns.oid = cl.relnamespace
  WHERE ns.nspname = 'public' AND con.contype = 'c' AND pg_get_constraintdef(con.oid) ILIKE '%program_type%'
  UNION ALL
  SELECT 'schema', t.table_name, 'content table WITHOUT program_type', 'its rows cannot be tied to a course', NULL
  FROM information_schema.tables t
  WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE'
    AND t.table_name IN ('study_materials', 'flashcards', 'flashcard_decks', 'live_classes', 'courses', 'see_lessons', 'lessons')
    AND NOT EXISTS (SELECT 1 FROM information_schema.columns c WHERE c.table_schema = 'public'
                    AND c.table_name = t.table_name AND c.column_name = 'program_type')
  UNION ALL
  SELECT 'schema', 'programs', 'rows in programs table',
         (SELECT string_agg(x, ', ') FROM (
            SELECT (xpath('/row/v/text()', rw))[1]::text AS x
            FROM unnest(xpath('/table/row', query_to_xml(
              'SELECT to_jsonb(p)::text AS v FROM public.programs p ORDER BY 1 LIMIT 30', false, false, ''))) rw) z),
         NULL
  WHERE to_regclass('public.programs') IS NOT NULL
)
SELECT section, tbl, item, detail, n
FROM (
  SELECT * FROM schema_rows
  UNION ALL
  SELECT section, tbl, item, detail, n FROM dyn_rows
) all_rows
ORDER BY
  array_position(ARRAY['schema','stored','strict','today','unplaced','would_move','suspect','subject_mismatch','orphan','review'], section),
  tbl, n DESC NULLS LAST, item;
