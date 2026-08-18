-- ============================================================
-- LOCAL DEVELOPMENT SEED — NOT for production
-- ============================================================
-- This file runs ONLY on `supabase db reset` / `supabase start`
-- against your LOCAL database. It is NEVER executed by
-- `supabase db push` to a remote project, so the dev passwords
-- below can never reach production.
--
-- It assigns known, easy-to-type passwords to the demo accounts so
-- you can log in locally. On production those same accounts have
-- random passwords (see migration 20260721050000) — set a real admin
-- password there via the Supabase Dashboard.
--
-- Demo logins (LOCAL ONLY):
--   Student (Pro):  priya.thapa@samyakcee.edu.np   / devpass123
--   Student (Free): aarav.sharma@samyakcee.edu.np  / devpass123
--   Admin:          admin@samyakcee.edu.np          / devadmin123
-- ============================================================

DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS pgcrypto;

  UPDATE auth.users SET encrypted_password = crypt('devpass123', gen_salt('bf', 10))
  WHERE email IN ('priya.thapa@samyakcee.edu.np', 'aarav.sharma@samyakcee.edu.np');

  UPDATE auth.users SET encrypted_password = crypt('devadmin123', gen_salt('bf', 10))
  WHERE email = 'admin@samyakcee.edu.np';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Local seed password assignment skipped: %', SQLERRM;
END $$;
