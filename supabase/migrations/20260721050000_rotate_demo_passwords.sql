-- ============================================================
-- Migration: rotate seeded demo-account passwords (security)
-- Timestamp: 20260721050000
-- ============================================================
--
-- The initial schema seeded three login-able accounts with passwords
-- written in plain text in the repo — including an ADMIN account
-- (admin@samyakcee.edu.np). Anyone who can read the repository could
-- therefore log in as admin on any database where that migration ran.
--
-- This migration rotates those three passwords to cryptographically
-- random values, so the repo-known passwords no longer work anywhere.
-- It is idempotent and safe to run repeatedly.
--
-- IMPORTANT (one-time manual step): to regain admin access, set your
-- own password for admin@samyakcee.edu.np via the Supabase Dashboard
-- → Authentication → Users → (admin) → "Reset password" / "Send magic
-- link". For LOCAL development, supabase/seed.sql assigns known dev
-- passwords automatically on `supabase db reset` (that file never runs
-- on `supabase db push` to a remote project).
-- ============================================================

DO $$
DECLARE
  demo_emails TEXT[] := ARRAY[
    'priya.thapa@samyakcee.edu.np',
    'aarav.sharma@samyakcee.edu.np',
    'admin@samyakcee.edu.np'
  ];
  e TEXT;
BEGIN
  -- pgcrypto provides crypt() / gen_salt(); it is already enabled by the
  -- initial schema, but guard just in case this runs standalone.
  PERFORM 1 FROM pg_extension WHERE extname = 'pgcrypto';
  IF NOT FOUND THEN
    CREATE EXTENSION IF NOT EXISTS pgcrypto;
  END IF;

  FOREACH e IN ARRAY demo_emails LOOP
    UPDATE auth.users
    SET encrypted_password = crypt(gen_random_uuid()::text || gen_random_uuid()::text, gen_salt('bf', 10))
    WHERE email = e;
  END LOOP;

  RAISE NOTICE 'Demo account passwords rotated to random values. Set a real admin password via the Supabase Dashboard (Auth > Users > admin@samyakcee.edu.np > Reset password).';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Demo password rotation skipped: %', SQLERRM;
END $$;
