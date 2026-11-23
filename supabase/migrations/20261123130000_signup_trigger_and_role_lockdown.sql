-- =============================================================================
-- Signup trigger + role lockdown
-- Migration: 20261123130000_signup_trigger_and_role_lockdown.sql
--
-- 1. Phone-only accounts. user_profiles.email was NOT NULL and handle_new_user()
--    copied NEW.email into it, so the first SMS sign-in for any new number
--    would abort the auth.users insert ("Database error saving new user").
--    Email becomes nullable (UNIQUE still holds: Postgres allows many NULLs),
--    and the phone number is copied from auth.users.
--
-- 2. Role at signup. handle_new_user() set user_profiles.role from
--    raw_user_meta_data->>'role' — the metadata the person signing up chooses.
--    Anyone holding the public anon key could sign up with
--    { data: { role: 'admin' } }. Every new account is now 'student'; staff
--    are promoted through /api/admin/roles, which writes app_metadata.
--
-- 3. Self-promotion. prevent_profile_privilege_escalation() (20261013000001)
--    was meant to freeze is_admin and the subscription columns on self-updates.
--    It froze nothing: as a SECURITY DEFINER function its current_user is
--    always the owner, so its bypass check always passed. Reproduced on
--    Postgres 16 — a student's own `update user_profiles set is_admin = true,
--    role = 'admin'` went through. It never listed role at all, either,
--    though its header says it does. Now SECURITY INVOKER, and it also freezes
--    role, role_name and is_banned when those columns exist.
--
-- 4. A bad cee_year in signup metadata ('abc') threw in the ::INTEGER cast and
--    aborted the signup. It is now ignored unless it is a 4-digit year.
--
-- Safe to re-run. Changes no existing row.
-- =============================================================================

-- 1) Phone-only users have no email ------------------------------------------
ALTER TABLE public.user_profiles ALTER COLUMN email DROP NOT NULL;

-- 2) New-user trigger ---------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  meta jsonb := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, avatar_url, phone, college, cee_year, role)
  VALUES (
    NEW.id,
    NULLIF(NEW.email, ''),
    COALESCE(
      NULLIF(btrim(meta->>'full_name'), ''),
      NULLIF(split_part(COALESCE(NEW.email, ''), '@', 1), ''),
      ''
    ),
    COALESCE(meta->>'avatar_url', ''),
    COALESCE(NULLIF(meta->>'phone', ''), NULLIF(NEW.phone, '')),
    NULLIF(meta->>'college', ''),
    CASE WHEN (meta->>'cee_year') ~ '^[0-9]{4}$' THEN (meta->>'cee_year')::INTEGER END,
    -- Never from user-controlled metadata. Promotion happens server-side.
    'student'::public.user_role
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 3) Freeze privileged columns on self-updates -------------------------------
-- Built dynamically: role_name / is_banned / is_admin exist in some
-- environments and not others, and plpgsql fails at run time on a missing field.
DO $$
DECLARE
  col text;
  freeze_lines text := '';
BEGIN
  FOREACH col IN ARRAY ARRAY[
    'is_admin', 'role', 'role_name', 'is_banned',
    'subscription_plan', 'subscription_expires_at'
  ]
  LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = col
    ) THEN
      freeze_lines := freeze_lines || format('  NEW.%1$I := OLD.%1$I;', col) || E'\n';
    END IF;
  END LOOP;

  -- SECURITY INVOKER on purpose. The 20261013000001 version was SECURITY
  -- DEFINER, and inside a definer function current_user is the owner
  -- (postgres), so `current_user IN ('postgres', …)` was always true and the
  -- trigger let every self-update through — is_admin and subscription_plan
  -- included. As invoker, current_user is the caller's role: authenticated for
  -- students, service_role for the server. profile_owner_is_admin() is itself
  -- SECURITY DEFINER, so it still reads the caller's row past RLS.
  EXECUTE format($fn$
CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $body$
BEGIN
  IF current_user IN ('postgres', 'service_role', 'supabase_admin')
     OR COALESCE(
          NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role',
          current_setting('request.jwt.claim.role', true)
        ) = 'service_role'
     OR public.profile_owner_is_admin() THEN
    RETURN NEW;
  END IF;

  -- Users may edit their own profile, but not who they are allowed to be.
%s
  RETURN NEW;
END;
$body$;
$fn$, freeze_lines);
END $$;

DROP TRIGGER IF EXISTS trg_prevent_profile_privilege_escalation ON public.user_profiles;
CREATE TRIGGER trg_prevent_profile_privilege_escalation
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_profile_privilege_escalation();

-- =============================================================================
-- REVIEW, DON'T RUN BLINDLY. Accounts whose profile says staff but whose
-- server-set app_metadata doesn't. Some may be legitimate staff set up by hand;
-- some may have promoted themselves through the holes above. Check each one,
-- and re-promote the real ones through the admin Roles page.
--
-- select u.email, u.phone, p.role, p.is_admin,
--        u.raw_app_meta_data->>'role'  as app_role,
--        u.raw_user_meta_data->>'role' as self_set_role,
--        u.created_at
-- from auth.users u
-- join public.user_profiles p on p.id = u.id
-- where (p.role::text <> 'student' or coalesce(p.is_admin, false))
--   and coalesce(u.raw_app_meta_data->>'role', '') not in
--       ('admin', 'super_admin', 'teacher', 'content_reviewer', 'support_agent',
--        'support_staff', 'payment_staff', 'content_manager')
-- order by u.created_at desc;
-- =============================================================================
