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

CREATE POLICY "users_manage_own_user_profiles"
  ON public.user_profiles FOR ALL TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "admin_full_access_user_profiles"
  ON public.user_profiles FOR ALL TO authenticated
  USING (public.profile_owner_is_admin())
  WITH CHECK (public.profile_owner_is_admin());

CREATE POLICY "staff_read_all_user_profiles"
  ON public.user_profiles FOR SELECT TO authenticated
  USING (public.profile_owner_is_admin());

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
      AND (au.raw_user_meta_data->>'role' = 'admin'
           OR au.raw_app_meta_data->>'role' = 'admin')
  );
$$;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

-- is_staff(): this DB has no separate staff role, so staff == admin.
-- Recreated as SECURITY DEFINER so any policy referencing it never recurses.
-- Wrapped defensively: if is_staff() has an unexpected signature, skip it
-- rather than aborting the whole batch (the policy fix above is what matters).
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
