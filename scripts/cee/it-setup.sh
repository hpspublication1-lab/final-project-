#!/usr/bin/env bash
# Sets up a throwaway environment for the CEE visual API integration test:
#   local Postgres database + the proposed schema + PostgREST + a proxy that
#   looks like a Supabase project URL. Never point this at a real project.
#
# Needs: psql access to a scratch Postgres (PG_* env below), a postgrest
# binary (POSTGREST_BIN), node.
#
#   PG="psql -h /tmp -p 5440 -U postgres" POSTGREST_BIN=/path/to/postgrest scripts/cee/it-setup.sh
#   then run the printed `export …` lines and (one file at a time; both reset the same database):
#   npx vitest run --no-file-parallelism src/lib/cee-visual/__tests__/*.integration.test.ts
set -euo pipefail
cd "$(dirname "$0")/../.."

PG=${PG:-"psql -h /tmp -p 5440 -U postgres"}
DB=${IT_DB:-cee_it}
PGHOST_TCP=${PGHOST_TCP:-127.0.0.1}
PGPORT_TCP=${PGPORT_TCP:-5440}
POSTGREST_BIN=${POSTGREST_BIN:-postgrest}
SECRET=${IT_JWT_SECRET:-it-only-secret-not-for-any-real-project-0123456789}
WORK=${IT_WORK:-/tmp/cee-it}
mkdir -p "$WORK"
# Stop a previous run first: PostgREST holds a connection that would block DROP DATABASE.
pkill -f "postgrest $WORK/postgrest.conf" 2>/dev/null || true
pkill -f "scripts/cee/it-proxy.mjs" 2>/dev/null || true
sleep 1

$PG -q -d postgres -c "DROP DATABASE IF EXISTS $DB" -c "CREATE DATABASE $DB"
$PG -q -d postgres <<'SQL'
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='service_role') THEN CREATE ROLE service_role NOLOGIN BYPASSRLS; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='it_authenticator') THEN CREATE ROLE it_authenticator LOGIN NOINHERIT PASSWORD 'it-authenticator'; END IF;
END $$;
GRANT anon, authenticated, service_role TO it_authenticator;
SQL
$PG -q -d "$DB" -c "GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role"
# Same default privileges as a Supabase project, so missing REVOKEs show up here too.
$PG -q -d "$DB" -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role" \
  -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role" \
  -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role"
$PG -q -d "$DB" -v ON_ERROR_STOP=1 -f supabase/proposed/20261124_cee_visual_foundation.sql >/dev/null
$PG -q -d "$DB" -v ON_ERROR_STOP=1 -f scripts/cee/it-app-stubs.sql >/dev/null

cat > "$WORK/postgrest.conf" <<CONF
db-uri = "postgres://it_authenticator:it-authenticator@${PGHOST_TCP}:${PGPORT_TCP}/${DB}"
db-schemas = "public"
db-anon-role = "anon"
jwt-secret = "${SECRET}"
server-host = "127.0.0.1"
server-port = 54330
CONF

rm -rf "$WORK/storage" && mkdir -p "$WORK/storage"   # stored objects start empty on every run
nohup "$POSTGREST_BIN" "$WORK/postgrest.conf" > "$WORK/postgrest.log" 2>&1 &
IT_STORAGE_DIR="$WORK/storage" nohup node scripts/cee/it-proxy.mjs > "$WORK/proxy.log" 2>&1 &

# Wait until both answer (not a fixed sleep), and fail loudly with their logs if they don't.
ready() { [ "$(curl -s -o /dev/null -w '%{http_code}' "$1" || true)" = "200" ]; }
for i in $(seq 1 60); do
  if ready http://127.0.0.1:54330/ && ready http://127.0.0.1:54331/rest/v1/; then break; fi
  if [ "$i" = 60 ]; then
    echo "PostgREST or the proxy did not become ready in 30 s." >&2
    echo "--- postgrest.log" >&2; tail -20 "$WORK/postgrest.log" >&2
    echo "--- proxy.log" >&2; tail -20 "$WORK/proxy.log" >&2
    exit 1
  fi
  sleep 0.5
done

jwt() { SECRET="$SECRET" ROLE="$1" node -e '
const c=require("crypto"),b=(o)=>Buffer.from(JSON.stringify(o)).toString("base64url");
const h=b({alg:"HS256",typ:"JWT"}),p=b({role:process.env.ROLE,iss:"cee-it",exp:Math.floor(Date.now()/1000)+86400});
process.stdout.write(h+"."+p+"."+c.createHmac("sha256",process.env.SECRET).update(h+"."+p).digest("base64url"));'; }
KEY=$(jwt service_role)
ANON=$(jwt anon)

echo "export CEE_IT_URL=http://127.0.0.1:54331"
echo "export CEE_IT_SERVICE_KEY=$KEY"
echo "export CEE_IT_PSQL=\"$PG -d $DB\""
echo "export CEE_IT_ANON_KEY=$ANON"
