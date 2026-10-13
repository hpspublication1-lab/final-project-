-- =============================================================================
-- Samyak Tutor LMS — Database Authentication & Row-Level Security Hardening
-- Migration: 20261013000001_harden_auth_and_rls_security.sql
--
-- 1. Eliminates recursive RLS policies on public.user_profiles.
-- 2. Enforces column-level privilege escalation protection via BEFORE UPDATE
--    trigger (prevents regular users from setting is_admin=true, role='admin',
--    or upgrading their own subscription_plan via direct REST calls).
-- 3. Locks down public.enrollments and public.batch_enrollments so students can
--    only SELECT their own enrollments; all writes must come from service_role
--    (verified payment webhooks / server actions) or verified admins.
-- =============================================================================

-- 1) Non-recursive SECURITY DEFINER admin check
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

-- 2) Replace user_profiles policies with least-privilege policies
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

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_user_profiles"
  ON public.user_profiles FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "users_insert_own_user_profiles"
  ON public.user_profiles FOR INSERT TO authenticated
  WITH CHECK (
    id = auth.uid()
    AND COALESCE(is_admin, false) = false
    AND COALESCE(subscription_plan, 'free') = 'free'
  );

CREATE POLICY "users_update_own_user_profiles"
  ON public.user_profiles FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "admin_full_access_user_profiles"
  ON public.user_profiles FOR ALL TO authenticated
  USING (public.profile_owner_is_admin())
  WITH CHECK (public.profile_owner_is_admin());

-- 3) Column-level privilege escalation trigger on user_profiles
CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_setting('request.jwt.claim.role', true) = 'service_role'
     OR current_user IN ('postgres', 'service_role', 'supabase_admin')
     OR public.profile_owner_is_admin() THEN
    RETURN NEW;
  END IF;

  -- Preserve privileged security & billing columns against client tampering
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

-- 4) Lock down enrollments & batch_enrollments against client-side self-enrollment
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'enrollments') THEN
    ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "students_insert_own_enrollments" ON public.enrollments;
    DROP POLICY IF EXISTS "users_insert_own_enrollments" ON public.enrollments;
    DROP POLICY IF EXISTS "students_read_own_enrollments" ON public.enrollments;

    CREATE POLICY "students_read_own_enrollments"
      ON public.enrollments FOR SELECT TO authenticated
      USING (student_id = auth.uid() OR public.profile_owner_is_admin());

    CREATE POLICY "admins_manage_enrollments"
      ON public.enrollments FOR ALL TO authenticated
      USING (public.profile_owner_is_admin())
      WITH CHECK (public.profile_owner_is_admin());
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'batch_enrollments') THEN
    ALTER TABLE public.batch_enrollments ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "students_insert_own_batch_enrollments" ON public.batch_enrollments;
    DROP POLICY IF EXISTS "users_insert_own_batch_enrollments" ON public.batch_enrollments;
    DROP POLICY IF EXISTS "students_read_own_batch_enrollments" ON public.batch_enrollments;

    CREATE POLICY "students_read_own_batch_enrollments"
      ON public.batch_enrollments FOR SELECT TO authenticated
      USING (user_id = auth.uid() OR public.profile_owner_is_admin());

    CREATE POLICY "admins_manage_batch_enrollments"
      ON public.batch_enrollments FOR ALL TO authenticated
      USING (public.profile_owner_is_admin())
      WITH CHECK (public.profile_owner_is_admin());
  END IF;
END $$;
