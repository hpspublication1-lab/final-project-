-- ============================================================
-- Migration: unify the two admin-check helper functions
-- Timestamp: 20260721040000
-- ============================================================
--
-- The project accumulated TWO admin-check functions that read from
-- DIFFERENT sources of truth:
--
--   * public.is_admin()       -> checked auth.users JWT metadata
--                                (raw_user_meta_data / raw_app_meta_data 'role')
--       Used by RLS on: user_profiles, subjects, chapters, questions,
--       exams, activation_codes, batches, billing_history.
--
--   * public.is_admin_user()  -> checked public.user_profiles.role = 'admin'
--       Used by RLS on: notes, video_lectures, study_materials,
--       live_classes (+ their storage buckets).
--
-- Result: an admin whose role is set in ONE place but not the other
-- could manage some tables but silently get "permission denied" on
-- others. This migration redefines BOTH functions with identical
-- logic that returns true if the user is flagged as admin in EITHER
-- source, so admin access is consistent everywhere regardless of how
-- the role was assigned. Both keep SECURITY DEFINER + STABLE so they
-- can be used inside RLS policies without recursion issues.
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    -- Source 1: profile role column
    SELECT 1 FROM public.user_profiles up
    WHERE up.id = auth.uid() AND up.role = 'admin'
  )
  OR EXISTS (
    -- Source 2: auth JWT metadata (user or app metadata)
    SELECT 1 FROM auth.users au
    WHERE au.id = auth.uid()
      AND (au.raw_user_meta_data->>'role' = 'admin'
           OR au.raw_app_meta_data->>'role' = 'admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_admin();
$$;

GRANT EXECUTE ON FUNCTION public.is_admin()      TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_user() TO authenticated;
