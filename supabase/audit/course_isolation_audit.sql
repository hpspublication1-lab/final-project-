-- ═══════════════════════════════════════════════════════════════════════════
-- COURSE ISOLATION AUDIT — READ ONLY                       Samyak Guru, 23 Nov 2026
-- ═══════════════════════════════════════════════════════════════════════════
-- Paste the whole file into the Supabase SQL editor and run it. It changes
-- nothing: every statement is a SELECT, and the transaction is set read-only.
-- (If the editor warns "SET TRANSACTION can only be used in transaction blocks",
-- that is harmless: only the read-only guard didn't apply; the query still only
-- reads.) It returns one table — section, tbl, item, detail, n. Export it as CSV.
--
-- Works whether or not a table has a program_type column. (The live database
-- has none on subjects or batches: the migrations adding it were not applied.)
--
-- Sections
--   schema            subjects.name type; which content tables have program_type,
--                     with what default; CHECK constraints; the programs table.
--   stored            program_type values as stored ("(no column)" if none).
--   today             what each course shows now — the site's rules, reproduced
--                     from resolveRowCourse() in src/lib/courses/courseIds.ts.
--   strict            what each course would show with strict mode on.
--   unplaced          rows shown in no course, and why.
--   would_move        rows CEE by default whose own name or title says otherwise.
--   suspect           subjects in CEE that aren't one of CEE's four subjects.
--   subject_mismatch  rows placed in a different course from their own subject.
--   orphan            no subject, a missing subject, or no chapter.
--   review            up to 200 individual rows from the above, by id.
-- ═══════════════════════════════════════════════════════════════════════════
SET TRANSACTION READ ONLY;

WITH
content AS (
  SELECT t.table_name AS tbl,
         EXISTS (SELECT 1 FROM information_schema.columns c WHERE c.table_schema = 'public' AND c.table_name = t.table_name AND c.column_name = 'program_type') AS has_pt,
         EXISTS (SELECT 1 FROM information_schema.columns c WHERE c.table_schema = 'public' AND c.table_name = t.table_name AND c.column_name = 'name') AS has_name,
         EXISTS (SELECT 1 FROM information_schema.columns c WHERE c.table_schema = 'public' AND c.table_name = t.table_name AND c.column_name = 'subject_id') AS has_subject,
         EXISTS (SELECT 1 FROM information_schema.columns c WHERE c.table_schema = 'public' AND c.table_name = t.table_name AND c.column_name = 'chapter_id') AS has_chapter,
         EXISTS (SELECT 1 FROM information_schema.columns c WHERE c.table_schema = 'public' AND c.table_name = t.table_name AND c.column_name = 'id') AS has_id,
         coalesce((SELECT string_agg(format('%I::text', c.column_name), ', ' ORDER BY c.column_name)
                   FROM information_schema.columns c
                   WHERE c.table_schema = 'public' AND c.table_name = t.table_name
                     AND c.column_name IN ('slug', 'name', 'display_name', 'title')), '''''') AS txt_cols
  FROM information_schema.tables t
  WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE'
    AND t.table_name NOT LIKE '\_course\_isolation\_%'   -- the clean-up's own backup
    AND (t.table_name IN ('subjects', 'chapters', 'batches', 'questions', 'video_lectures', 'exams', 'notes',
                          'study_materials', 'flashcards', 'live_classes')
         OR EXISTS (SELECT 1 FROM information_schema.columns c WHERE c.table_schema = 'public'
                    AND c.table_name = t.table_name AND c.column_name = 'program_type'))
),
-- alias table, then one resolution chain. Slots: %1$s text columns · %2$I table ·
-- %3$s id · %4$s subject_id · %5$s chapter_id · %6$s stored value · %7$s name · %8$s CTE prefix
alias_sql(sql) AS (VALUES ($a$
  a(v, course) AS (VALUES
    ('cee_medical','cee_medical'),('cee','cee_medical'),
    ('see_class_10','see_class_10'),('see','see_class_10'),
    ('ielts','ielts'),('english','ielts'),
    ('digital_marketing','digital_marketing'),
    ('artificial_intelligence','artificial_intelligence'),('ai','artificial_intelligence'),
    ('ioe_engineering','ioe_engineering'),('ioe','ioe_engineering'),('engineering','ioe_engineering'),
    ('lok_sewa','lok_sewa'),('loksewa','lok_sewa'),
    ('neb_class_11','neb_class_11'),('class11','neb_class_11'),
    ('neb_class_12','neb_class_12'),('class12','neb_class_12'))
$a$)),
chain_sql(sql) AS (VALUES ($r$
  %8$sr AS (
    SELECT %3$s AS row_id, %4$s AS subject_id, %5$s AS chapter_id,
           lower(btrim(coalesce(%6$s, ''))) AS stored,
           lower(btrim(coalesce(%7$s, ''))) AS nm,
           lower(concat_ws(' ', %1$s)) AS txt,
           left(concat_ws(' / ', %1$s), 120) AS label
    FROM public.%2$I),
  %8$sh0 AS (
    SELECT r.*, a.course AS explicit,
      CASE nm WHEN 'biology' THEN 'cee_medical' WHEN 'chemistry' THEN 'cee_medical'
              WHEN 'physics' THEN 'cee_medical' WHEN 'mental_agility' THEN 'cee_medical'
              WHEN 'compulsory_science' THEN 'see_class_10' WHEN 'compulsory_math' THEN 'see_class_10'
              WHEN 'optional_math' THEN 'see_class_10' WHEN 'english' THEN 'see_class_10'
              WHEN 'social_studies' THEN 'see_class_10' END AS known,
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
      ]::text[], NULL) AS base_hits
    FROM %8$sr r LEFT JOIN a ON a.v = r.stored),
  %8$sh AS (
    SELECT h0.*,
      CASE WHEN txt ~ '(^|[^a-z0-9])(neb)([^a-z0-9]|$)'
                AND NOT ('neb_class_11' = ANY(base_hits) OR 'neb_class_12' = ANY(base_hits))
           THEN base_hits || ARRAY['neb_class_11', 'neb_class_12'] ELSE base_hits END AS hits
    FROM %8$sh0 h0),
  %8$sx AS (
    SELECT h.*,
      CASE
        WHEN stored = 'digital' THEN NULL                                   -- ambiguous alias
        WHEN explicit IS NOT NULL AND explicit <> 'cee_medical' THEN explicit
        WHEN known IS NOT NULL THEN known                                   -- repo's own subject list
        WHEN cardinality(hits) > 1 THEN NULL                                -- names several courses
        WHEN cardinality(hits) = 1 THEN hits[1]
        WHEN explicit IS NOT NULL THEN explicit                             -- 'cee' as stored
        WHEN stored = '' THEN 'cee_medical'                                 -- nothing stored: old default
        ELSE NULL                                                           -- unknown value
      END AS today
    FROM %8$sh h)
$r$)),
per_table AS (
  SELECT c.*,
         'WITH ' || (SELECT sql FROM alias_sql) || ', ' ||
         format((SELECT sql FROM chain_sql), c.txt_cols, c.tbl,
                CASE WHEN c.has_id THEN 'id::text' ELSE 'NULL::text' END,
                CASE WHEN c.has_subject THEN 'subject_id::text' ELSE 'NULL::text' END,
                CASE WHEN c.has_chapter THEN 'chapter_id::text' ELSE 'NULL::text' END,
                CASE WHEN c.has_pt THEN 'program_type::text' ELSE 'NULL::text' END,
                CASE WHEN c.has_name THEN 'name::text' ELSE 'NULL::text' END,
                '') ||
         CASE WHEN c.has_subject AND c.tbl <> 'subjects' AND s.tbl IS NOT NULL THEN
           ', ' || format((SELECT sql FROM chain_sql), s.txt_cols, 'subjects', 'id::text', 'NULL::text', 'NULL::text',
                          CASE WHEN s.has_pt THEN 'program_type::text' ELSE 'NULL::text' END,
                          CASE WHEN s.has_name THEN 'name::text' ELSE 'NULL::text' END, 's_')
         ELSE '' END AS q
  FROM content c LEFT JOIN content s ON s.tbl = 'subjects'
),
dyn(tbl, q) AS (
  SELECT tbl, q || format($q$ SELECT 'stored' AS section,
                 CASE WHEN %L THEN CASE WHEN stored = '' THEN '(empty)' ELSE stored END ELSE '(no column)' END AS item,
                 NULL::text AS detail, count(*) AS n FROM x GROUP BY 2 $q$, has_pt) FROM per_table
  UNION ALL
  SELECT tbl, q || $q$ SELECT 'today' AS section, coalesce(today, '(shown in no course)') AS item, NULL::text AS detail, count(*) AS n FROM x GROUP BY 2 $q$ FROM per_table
  UNION ALL
  SELECT tbl, q || $q$ SELECT 'strict' AS section, coalesce(explicit, '(shown in no course)') AS item, NULL::text AS detail, count(*) AS n FROM x GROUP BY 2 $q$ FROM per_table
  UNION ALL
  SELECT tbl, q || $q$ SELECT 'unplaced' AS section,
                 CASE WHEN stored = 'digital' THEN 'stored as ''digital'''
                      WHEN cardinality(hits) > 1 THEN 'name or title names several courses (or NEB without a class)'
                      ELSE 'unknown program_type value: ' || stored END AS item,
                 NULL::text AS detail, count(*) AS n FROM x WHERE today IS NULL GROUP BY 2 $q$ FROM per_table
  UNION ALL
  SELECT tbl, q || $q$ SELECT 'would_move' AS section,
                 CASE WHEN stored = '' THEN 'nothing stored' ELSE 'stored ' || stored END || ' → ' || today AS item,
                 NULL::text AS detail, count(*) AS n FROM x
                 WHERE (explicit = 'cee_medical' OR stored = '') AND today IS DISTINCT FROM 'cee_medical' AND today IS NOT NULL
                 GROUP BY 2 $q$ FROM per_table
  UNION ALL
  SELECT tbl, q || $q$ SELECT 'suspect' AS section, row_id AS item,
                 label || '  [stored: ' || CASE WHEN stored = '' THEN 'nothing' ELSE stored END || '] — in CEE but not one of its 4 subjects' AS detail,
                 NULL::bigint AS n FROM x
                 WHERE today = 'cee_medical' AND coalesce(known, '') <> 'cee_medical' $q$
  FROM per_table WHERE tbl = 'subjects'
  UNION ALL
  SELECT tbl, q || $q$ SELECT 'subject_mismatch' AS section,
                 CASE WHEN (x.explicit IS NOT NULL AND x.explicit <> 'cee_medical') OR cardinality(x.hits) > 0 OR x.stored = 'digital'
                      THEN 'row says ' || coalesce(x.today, 'no course') || ', its subject is in ' || coalesce(s_x.today, 'no course')
                      ELSE 'row has only the default; its subject is in ' || coalesce(s_x.today, 'no course') END AS item,
                 NULL::text AS detail, count(*) AS n
                 FROM x JOIN s_x ON s_x.row_id = x.subject_id
                 WHERE x.today IS DISTINCT FROM s_x.today
                 GROUP BY 2 $q$
  FROM per_table WHERE has_subject AND tbl <> 'subjects' AND EXISTS (SELECT 1 FROM content WHERE tbl = 'subjects')
  UNION ALL
  SELECT tbl, q || $q$ SELECT 'orphan' AS section, 'no subject' AS item, NULL::text AS detail, count(*) AS n
                 FROM x WHERE subject_id IS NULL HAVING count(*) > 0 $q$
  FROM per_table WHERE has_subject AND tbl <> 'subjects'
  UNION ALL
  SELECT tbl, q || $q$ SELECT 'orphan' AS section, 'subject_id points to a missing subject' AS item, NULL::text AS detail, count(*) AS n
                 FROM x WHERE subject_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM s_x WHERE s_x.row_id = x.subject_id) HAVING count(*) > 0 $q$
  FROM per_table WHERE has_subject AND tbl <> 'subjects' AND EXISTS (SELECT 1 FROM content WHERE tbl = 'subjects')
  UNION ALL
  SELECT tbl, q || $q$ SELECT 'orphan' AS section, 'no chapter' AS item, NULL::text AS detail, count(*) AS n
                 FROM x WHERE chapter_id IS NULL HAVING count(*) > 0 $q$
  FROM per_table WHERE has_chapter
  UNION ALL
  SELECT tbl, q || $q$ SELECT 'review' AS section, row_id AS item,
                 label || '  [stored: ' || CASE WHEN stored = '' THEN 'nothing' ELSE stored END || ', shown in: ' || coalesce(today, 'no course') || ']' AS detail,
                 NULL::bigint AS n FROM x
                 WHERE today IS NULL OR ((explicit = 'cee_medical' OR stored = '') AND today IS DISTINCT FROM 'cee_medical')
                 ORDER BY 2 LIMIT 200 $q$ FROM per_table
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
  SELECT 'schema'::text AS section, 'subjects'::text AS tbl, 'name column type'::text AS item,
         c.data_type || ' (' || c.udt_name || ')' ||
         coalesce(' values: ' || (SELECT string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder)
                                  FROM pg_type ty JOIN pg_enum e ON e.enumtypid = ty.oid WHERE ty.typname = c.udt_name), '') AS detail,
         NULL::bigint AS n
  FROM information_schema.columns c
  WHERE c.table_schema = 'public' AND c.table_name = 'subjects' AND c.column_name = 'name'
  UNION ALL
  SELECT 'schema', ct.tbl, 'program_type column',
         CASE WHEN NOT ct.has_pt THEN 'MISSING — rows carry no course; the site places them by name/title'
              ELSE (SELECT c.data_type || coalesce('(' || c.character_maximum_length || ')', '') ||
                           CASE WHEN c.is_nullable = 'NO' THEN ' NOT NULL' ELSE ' nullable' END ||
                           coalesce(' DEFAULT ' || c.column_default, ' no default')
                    FROM information_schema.columns c
                    WHERE c.table_schema = 'public' AND c.table_name = ct.tbl AND c.column_name = 'program_type') END,
         NULL
  FROM content ct
  UNION ALL
  SELECT 'schema', cl.relname, 'CHECK constraint ' || con.conname, pg_get_constraintdef(con.oid), NULL
  FROM pg_constraint con JOIN pg_class cl ON cl.oid = con.conrelid JOIN pg_namespace ns ON ns.oid = cl.relnamespace
  WHERE ns.nspname = 'public' AND con.contype = 'c' AND pg_get_constraintdef(con.oid) ILIKE '%program_type%'
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
FROM (SELECT * FROM schema_rows UNION ALL SELECT section, tbl, item, detail, n FROM dyn_rows) all_rows
ORDER BY
  array_position(ARRAY['schema','stored','today','strict','unplaced','would_move','suspect','subject_mismatch','orphan','review'], section),
  tbl, n DESC NULLS LAST, item;
