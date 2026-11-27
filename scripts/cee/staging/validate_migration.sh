#!/usr/bin/env bash
# Validates the chosen CEE visual migration against a STAGING database that holds
# a schema-only copy of production (see README.md). Writes an evidence log.
#
#   STAGING_DB_URL='postgresql://…' CEE_STAGING_CONFIRM=staging scripts/cee/staging/validate_migration.sh
#
# Refuses, before writing anything, if:
#   * CEE_STAGING_CONFIRM isn't exactly "staging";
#   * the URL points at the production Supabase project;
#   * the database contains any user rows (auth.users or public.user_profiles);
#   * check_superseded.sql doesn't report CLEAN.
# Then: apply → run the schema checks inside a transaction that is rolled back →
# rehearse the real rollback → verify nothing is left → re-apply → verify.
set -euo pipefail
cd "$(dirname "$0")/../../.."

PRODUCTION_REF="zqkmrrckuvabtdfyrymw"   # live project (from the site's CSP); never a target
URL=${STAGING_DB_URL:?Set STAGING_DB_URL to the staging database connection string}
LOG_DIR=${LOG_DIR:-docs/cee-visual/evidence}
mkdir -p "$LOG_DIR"
LOG="$LOG_DIR/staging-validation-$(date -u +%Y%m%dT%H%M%SZ).log"
q() { psql "$URL" -X -q -v ON_ERROR_STOP=1 "$@"; }
say() { echo "$*" | tee -a "$LOG"; }

[ "${CEE_STAGING_CONFIRM:-}" = "staging" ] || { echo "Refusing: set CEE_STAGING_CONFIRM=staging to confirm this is not production."; exit 2; }
case "$URL" in *"$PRODUCTION_REF"*) echo "Refusing: that URL is the production project."; exit 2;; esac

say "CEE visual migration validation, $(date -u +%FT%TZ)"
say "target: $(echo "$URL" | sed -E 's#://[^@]*@#://***@#')"
say "commit: $(git rev-parse --short HEAD) ($(git rev-parse --abbrev-ref HEAD))"

users=$(q -At -c "SELECT (SELECT CASE WHEN to_regclass('auth.users') IS NULL THEN 0 ELSE (xpath('/row/n/text()', query_to_xml('SELECT count(*) AS n FROM auth.users', false, true, '')))[1]::text::int END)
                     + (SELECT CASE WHEN to_regclass('public.user_profiles') IS NULL THEN 0 ELSE (xpath('/row/n/text()', query_to_xml('SELECT count(*) AS n FROM public.user_profiles', false, true, '')))[1]::text::int END)")
if [ "$users" != "0" ]; then say "Refusing: this database has $users user row(s). Staging must be schema-only."; exit 2; fi
say "interlocks: confirmed staging, not production, 0 user rows"

verdict=$(q -At -F '|' -f scripts/cee/staging/check_superseded.sql | awk -F'|' '$1=="VERDICT"{print $2}')
say "superseded check: $verdict"
case "$verdict" in CLEAN*) ;; *) say "Stopping: the database must be CLEAN first."; exit 3;; esac

say "1. apply supabase/proposed/20261124_cee_visual_foundation.sql"
q -f supabase/proposed/20261124_cee_visual_foundation.sql >>"$LOG" 2>&1
tables=$(q -At -c "SELECT count(*) FROM pg_tables WHERE schemaname='public' AND tablename LIKE 'cee\_%'")
say "   applied: $tables cee_* tables"

say "2. schema checks (inside a transaction, rolled back afterwards)"
{ echo 'BEGIN;'; cat supabase/proposed/tests/cee_visual_foundation_test.sql; echo 'ROLLBACK;'; } | psql "$URL" -X -q > "$LOG.tests" 2>&1 || true
pass=$(grep -cE '\| PASS +\|' "$LOG.tests" || true); fail=$(grep -cE '\| FAIL +\|' "$LOG.tests" || true)
cat "$LOG.tests" >> "$LOG"; rm -f "$LOG.tests"
say "   $pass passed, $fail failed"
rows=$(q -At -c "SELECT count(*) FROM public.cee_lessons")
say "   rows left behind by the tests: $rows"
[ "$fail" = "0" ] && [ "$pass" -gt 0 ] && [ "$rows" = "0" ] || { say "FAILED at step 2"; exit 4; }

say "3. rollback rehearsal"
q -f supabase/proposed/20261124_cee_visual_foundation_ROLLBACK.sql >>"$LOG" 2>&1
left=$(q -At -c "SELECT (SELECT count(*) FROM pg_tables WHERE schemaname='public' AND tablename LIKE 'cee\_%') || ' tables, ' || (SELECT count(*) FROM pg_proc WHERE proname LIKE 'cee\_%') || ' functions'")
say "   after rollback: $left"
[ "$left" = "0 tables, 0 functions" ] || { say "FAILED at step 3"; exit 5; }

say "4. re-apply"
q -f supabase/proposed/20261124_cee_visual_foundation.sql >>"$LOG" 2>&1
verdict=$(q -At -F '|' -f scripts/cee/staging/check_superseded.sql | awk -F'|' '$1=="VERDICT"{print $2}')
say "   superseded check now: $verdict"
[ "$verdict" = "CHOSEN SCHEMA INSTALLED" ] || { say "FAILED at step 4"; exit 6; }
flag=$(q -At -c "SELECT value FROM public.cee_settings WHERE key = 'cee_visual_enabled'")
say "   feature flag: $flag (off)"
say "PASS: the migration applies, passes its checks, rolls back cleanly and re-applies on this staging database."
say "log: $LOG"
