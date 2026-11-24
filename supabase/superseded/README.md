# Superseded migrations: do not apply

These two files came from a parallel CEE Visual build pushed to the production
branch on 23–24 Nov 2026. On 24 Nov the owner chose the schema in
`supabase/proposed/20261124_cee_visual_foundation.sql` instead, so they were moved
out of `supabase/migrations/` to make sure nothing applies them.

They create tables with the same names as the chosen schema but different
columns, and their row-level policies would let students write their own progress
rows (completion included) and let anyone insert audit entries.

If they were ever run on a database, check before applying the chosen schema:

```sql
-- Read-only. Any row returned means the parallel tables exist.
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name IN ('cee_exam_programs', 'cee_subjects', 'cee_asset_hotspots', 'cee_animation_sequences');
```

The chosen schema runs in one transaction and never uses `CREATE … IF NOT EXISTS`, so on a database
that already has these tables it stops at the first clash and changes nothing.
