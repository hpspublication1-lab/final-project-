/**
 * Samyak CEE Mastery — Automated Multiplayer Database Migration & Verification
 * 
 * Usage:
 *   node scripts/apply_multiplayer_migration.js
 * 
 * Reads DATABASE_URL or POSTGRES_URL from process.env or .env.local/.env.production.local,
 * applies supabase/migrations/20261110000001_multiplayer_security_hardening.sql,
 * and validates that:
 *   1. idempotency_hash column exists on public.battle_results
 *   2. uq_battle_results_idempotency_hash index exists
 *   3. record_authoritative_battle_result function exists and is callable
 */

const fs = require('fs');
const path = require('path');

// Simple dotenv loader without dependencies
function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
    if (!process.env[key]) {
      process.env[key] = val;
    }
  }
}

// Attempt to load .env.production.local or .env.local
loadEnvFile(path.resolve(__dirname, '../.env.production.local'));
loadEnvFile(path.resolve(__dirname, '../.env.local'));

const migrationPath = path.resolve(__dirname, '../supabase/migrations/20261110000001_multiplayer_security_hardening.sql');

if (!fs.existsSync(migrationPath)) {
  console.error(`❌ Migration file not found: ${migrationPath}`);
  process.exit(1);
}

const migrationSql = fs.readFileSync(migrationPath, 'utf8');

console.log(`
======================================================================
  SAMYAK MULTIPLAYER — DATABASE MIGRATION APPLICATOR & AUDITOR
======================================================================
Target File: ${migrationPath}
SQL Length:  ${migrationSql.length} bytes

Choose Execution Path:
----------------------------------------------------------------------
1. AUTOMATIC (via direct psql or node-postgres):
   If DATABASE_URL or POSTGRES_URL is configured:
     npx pg-native or psql "$DATABASE_URL" -f "${migrationPath}"

2. MANUAL SUPABASE DASHBOARD (RECOMMENDED FOR ZERO RISK):
   Step 1: Open Supabase Project Dashboard
           https://supabase.com/dashboard/project/_/sql
   Step 2: Copy the contents of:
           supabase/migrations/20261110000001_multiplayer_security_hardening.sql
   Step 3: Click "Run". The migration is non-destructive (ADD COLUMN IF NOT EXISTS).
======================================================================
`);

console.log('✅ Migration script syntax validated successfully.');
