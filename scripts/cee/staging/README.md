# CEE visual: staging database

Goal: prove the chosen migration (`supabase/proposed/20261124_cee_visual_foundation.sql`)
against a database shaped like production, without copying any student data, and
without touching production.

Nothing here writes to production. Every script that writes refuses the production
project and refuses a database that contains user rows.

## Files

| File | Writes? | What it does |
|---|---|---|
| `schema_snapshot.sql` | no | Prints a schema-only SQL script of `public` (plus bucket settings and `storage.objects` policies) from the system catalog. Reads no table rows. |
| `check_superseded.sql` | no | Reports which CEE schema is installed. Last row is the VERDICT: CLEAN, CHOSEN SCHEMA INSTALLED, SUPERSEDED INSTALLED, MIXED or UNKNOWN. |
| `remove_superseded.sql` | yes | Drops the superseded tables in one transaction. Refuses if the chosen schema is there or if any superseded table holds non-seed rows. |
| `validate_migration.sh` | yes (staging only) | Applies the migration, runs the 86 schema checks in a rolled-back transaction, rehearses the rollback, re-applies, and writes an evidence log. |
| `tests/` | — | Local and CI fixtures: `snapshot_roundtrip.sh` proves the snapshot reproduces a schema exactly and carries no rows. |

## Steps (owner or someone with production read access)

1. **Snapshot production's schema (read-only).**
   `psql "$PROD_DB_URL" -At -f scripts/cee/staging/schema_snapshot.sql > prod_schema.sql`
   Or run the same file through the Supabase connector's read-only SQL. Check that
   `prod_schema.sql` contains only DDL. It never contains `INSERT` except for bucket settings.
2. **Check what CEE schema production has (read-only).**
   `psql "$PROD_DB_URL" -At -F'|' -f scripts/cee/staging/check_superseded.sql`
   Record the VERDICT in `docs/cee-visual/FOUNDATION_BASELINE.md`. This answers whether the
   superseded migrations were ever installed. Don't remove anything from production
   without the owner's approval.
3. **Create a separate Supabase project for staging** (free tier is enough). Never reuse production.
4. **Apply the snapshot to staging.**
   `psql "$STAGING_DB_URL" -v ON_ERROR_STOP=1 -f prod_schema.sql`
5. **Validate.**
   `STAGING_DB_URL=… CEE_STAGING_CONFIRM=staging scripts/cee/staging/validate_migration.sh`
   The log lands in `docs/cee-visual/evidence/`. Commit it as milestone evidence.
6. **Point a Vercel preview at staging** (preview environment variables only, never Production)
   and run the browser walkthrough: editor → reviewers → publisher → student.

## What the snapshot covers

Extensions, enums, domains, sequences, functions, tables (defaults, identity, generated
columns), keys, checks, foreign keys, indexes, views, triggers (including public functions
fired from `auth.users`), RLS, policies, and grants for `anon`, `authenticated` and
`service_role`. It doesn't copy auth settings, storage objects, cron jobs, webhooks or
secrets. Configure those in the staging project's dashboard if a test needs them.

## Verified locally (25 Nov 2026)

- Snapshot round trip: a production-like schema plus the chosen schema (24 tables, 14
  triggers, policies on `public` and `storage.objects`) → snapshot → apply to an empty
  database → snapshot again → identical. The chosen schema’s checks (86 as of M6) pass on the copy.
  Rows planted in the source don't appear in the snapshot.
- `validate_migration.sh` refused when confirmation was missing, when the URL was the
  production project, and when the database had user rows. On a schema-only copy it
  passed all four steps. On a second run it stopped, because the schema was already installed.
