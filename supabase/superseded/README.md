# Superseded migrations: do not apply

These two files came from a parallel CEE Visual build pushed to the production
branch on 23–24 Nov 2026. On 24 Nov the owner chose the schema in
`supabase/proposed/20261124_cee_visual_foundation.sql` instead, so they were moved
out of `supabase/migrations/` to make sure nothing applies them.

They create tables with the same names as the chosen schema but different
columns, and their row-level policies would let students write their own progress
rows (completion included) and let anyone insert audit entries.

`20261124000001_cee_audit_and_reviews.sql` cannot apply to this app's schema at all:
its policies filter on `user_profiles.user_id` (the table is keyed by `id`) and compare
`role` with `super_admin` and `content_manager`, which the `user_role` enum doesn't have.
Run as a file it fails and leaves nothing. So a database where someone tried them
most likely has the first file's tables only. CI checks exactly this state.

Before applying the chosen schema anywhere, find out what is installed:

```bash
psql "$DB_URL" -At -F'|' -f scripts/cee/staging/check_superseded.sql   # read-only; last row is the VERDICT
```

If it says SUPERSEDED INSTALLED, `scripts/cee/staging/remove_superseded.sql` drops those
tables in one transaction. It refuses if the chosen schema is present, or if any superseded
table holds rows other than its own seed data, so it can't destroy real content.

The chosen schema runs in one transaction and never uses `CREATE … IF NOT EXISTS`, so on a database
that already has these tables it stops at the first clash and changes nothing.
