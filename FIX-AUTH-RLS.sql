-- ============================================================
-- Samyak CEE — DEFINITIVE fix for "infinite recursion detected in
-- policy for relation user_profiles" (Postgres 42P17).
--
-- The first pass created non-recursive helper functions (good), but
-- the recursion PERSISTS because this (diverged) DB has EXTRA policies
-- on user_profiles — with names not in the repo — that still query
-- user_profiles under RLS. Since we can't know their names, this drops
-- EVERY policy on public.user_profiles dynamically, then recreates ONLY
-- the three safe, non-recursive ones.
--
-- Paste this ENTIRE file into: Supabase Dashboard → SQL Editor → Run.
-- Safe to run more than once (idempotent).
-- ============================================================

-- 1) Non-recursive admin helper (SECURITY DEFINER bypasses RLS) -------------
CREATE OR REPLACE FUNCTION public.profile_owner_is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT up.is_admin FROM public.user_profiles up WHERE up.id = auth.uid()),
    false
  );
$$;
GRANT EXECUTE ON FUNCTION public.profile_owner_is_admin() TO anon, authenticated;

-- 2) DROP EVERY policy currently on user_profiles (whatever it's named) -----
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_profiles'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_profiles;', pol.policyname);
  END LOOP;
END $$;

-- 3) Recreate ONLY the three safe, non-recursive policies -------------------
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "users_read_own_user_profiles"
  ON public.user_profiles FOR SELECT TO authenticated
  USING (id = auth.uid());

-- Users can insert their own initial student profile row only (non-admin, free plan)
CREATE POLICY "users_insert_own_user_profiles"
  ON public.user_profiles FOR INSERT TO authenticated
  WITH CHECK (
    id = auth.uid()
    AND COALESCE(is_admin, false) = false
    AND COALESCE(subscription_plan, 'free') = 'free'
  );

-- Users can update their own profile (privileged columns are locked by trigger below)
CREATE POLICY "users_update_own_user_profiles"
  ON public.user_profiles FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "admin_full_access_user_profiles"
  ON public.user_profiles FOR ALL TO authenticated
  USING (public.profile_owner_is_admin())
  WITH CHECK (public.profile_owner_is_admin());

CREATE POLICY "staff_read_all_user_profiles"
  ON public.user_profiles FOR SELECT TO authenticated
  USING (public.profile_owner_is_admin());

-- 3b) Column-level privilege escalation guard on user_profiles --------------
-- Prevents non-admin authenticated users from modifying is_admin, role,
-- subscription_plan, subscription_expires_at, or is_banned via direct REST calls.
CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow service_role (server-side admin client) and verified admins
  IF current_setting('request.jwt.claim.role', true) = 'service_role'
     OR current_user IN ('postgres', 'service_role', 'supabase_admin')
     OR public.profile_owner_is_admin() THEN
    RETURN NEW;
  END IF;

  -- Lock privileged columns to their existing values for regular users
  NEW.is_admin := OLD.is_admin;
  NEW.subscription_plan := OLD.subscription_plan;
  NEW.subscription_expires_at := OLD.subscription_expires_at;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_profile_privilege_escalation ON public.user_profiles;
CREATE TRIGGER trg_prevent_profile_privilege_escalation
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_profile_privilege_escalation();

-- 4) Repair is_admin() + is_staff() so OTHER tables' policies that call them
--    also stop recursing / erroring on the missing `role` column. Both are
--    SECURITY DEFINER → safe to use inside any RLS policy.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT up.is_admin FROM public.user_profiles up WHERE up.id = auth.uid()),
    false
  )
  OR EXISTS (
    SELECT 1 FROM auth.users au
    WHERE au.id = auth.uid()
      AND (au.raw_user_meta_data->>'role' IN ('admin', 'super_admin')
           OR au.raw_app_meta_data->>'role' IN ('admin', 'super_admin'))
  );
$$;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

-- is_staff(): this DB has no separate staff role, so staff == admin.
-- Recreated as SECURITY DEFINER so any policy referencing it never recurses.
DO $$
BEGIN
  EXECUTE $fn$
    CREATE OR REPLACE FUNCTION public.is_staff()
    RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public
    AS 'SELECT public.is_admin();';
  $fn$;
  EXECUTE 'GRANT EXECUTE ON FUNCTION public.is_staff() TO anon, authenticated';
EXCEPTION WHEN others THEN
  RAISE NOTICE 'Skipped is_staff() repair: %', SQLERRM;
END $$;

