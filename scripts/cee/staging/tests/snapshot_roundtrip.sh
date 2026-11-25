#!/usr/bin/env bash
# Round-trip test for schema_snapshot.sql:
#   source DB (Supabase-like base + production-like fixture + chosen schema)
#   → snapshot → apply to an empty Supabase-like DB → snapshot again → must match.
# Also proves the snapshot contains no row data.
#
#   PG="psql -h /tmp -p 5440 -U postgres" scripts/cee/staging/tests/snapshot_roundtrip.sh
set -euo pipefail
cd "$(dirname "$0")/../../../.."
PG=${PG:-"psql -h /tmp -p 5440 -U postgres"}
OUT=${OUT:-/tmp/cee-snapshot}
mkdir -p "$OUT"
SRC=snap_src_$$; DST=snap_dst_$$
trap '$PG -q -d postgres -c "DROP DATABASE IF EXISTS $SRC" -c "DROP DATABASE IF EXISTS $DST" >/dev/null 2>&1 || true' EXIT

$PG -q -d postgres -c "CREATE DATABASE $SRC" -c "CREATE DATABASE $DST"
for db in $SRC $DST; do $PG -q -d $db -v ON_ERROR_STOP=1 -f scripts/cee/staging/tests/supabase_base.sql >/dev/null; done
$PG -q -d $SRC -v ON_ERROR_STOP=1 -f scripts/cee/staging/tests/production_like_fixture.sql >/dev/null
$PG -q -d $SRC -v ON_ERROR_STOP=1 -f supabase/proposed/20261124_cee_visual_foundation.sql >/dev/null

$PG -q -d $SRC -At -f scripts/cee/staging/schema_snapshot.sql > "$OUT/source.sql"
if grep -q "SECRET-ROW-MARKER\|synthetic-student@example.invalid" "$OUT/source.sql"; then echo "FAIL: snapshot contains row data"; exit 1; fi
echo "snapshot: $(wc -l < "$OUT/source.sql") lines, no row data"

$PG -q -d $DST -v ON_ERROR_STOP=1 -f "$OUT/source.sql" > "$OUT/apply.log" 2>&1 || { echo "FAIL: snapshot did not apply"; tail -5 "$OUT/apply.log"; exit 1; }
$PG -q -d $DST -At -f scripts/cee/staging/schema_snapshot.sql > "$OUT/copy.sql"

if diff -u "$OUT/source.sql" "$OUT/copy.sql" > "$OUT/diff.txt"; then
  echo "PASS: the copy's snapshot is identical to the source's ($(grep -c '^CREATE TABLE' "$OUT/source.sql") tables, $(grep -c '^CREATE POLICY' "$OUT/source.sql") policies, $(grep -c '^CREATE TRIGGER' "$OUT/source.sql") triggers)"
else
  echo "FAIL: snapshots differ:"; head -40 "$OUT/diff.txt"; exit 1
fi

# The copy must behave like the source: the chosen schema's own tests pass on it.
$PG -q -d $DST -f supabase/proposed/tests/cee_visual_foundation_test.sql > "$OUT/tests.txt" 2>&1 || true
pass=$(grep -cE '\| PASS +\|' "$OUT/tests.txt" || true); fail=$(grep -cE '\| FAIL +\|' "$OUT/tests.txt" || true)
echo "chosen-schema tests on the copy: $pass passed, $fail failed"
[ "$fail" = "0" ] && [ "$pass" -gt 0 ]
