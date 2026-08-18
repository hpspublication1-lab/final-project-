-- ============================================================
-- Migration: real premium (Pro) enforcement at the RLS layer
-- Timestamp: 20260721060000
-- ============================================================
--
-- Before this migration, the premium-read policies on questions and
-- exams were:
--     FOR SELECT TO authenticated USING (is_active = true)
-- i.e. ANY signed-in user — including free-tier users — could read
-- 100% of premium questions and exams. The "Pro" paywall was purely
-- cosmetic on the client. This migration ties premium row access to
-- the user's actual subscription so free users genuinely cannot fetch
-- premium questions/exams (the core paid content, consumed in bulk by
-- the practice + mock-test flows).
--
-- Notes / video_lectures / study_materials intentionally keep their
-- rows readable so the "Upgrade to Unlock" upsell cards still render
-- with real titles/thumbnails; their heavy assets live in the private
-- `lecture-videos` storage bucket (storage RLS) and can be moved
-- behind signed URLs as a follow-up. Live classes stay browsable for
-- the same discovery/upsell reason (the join/recording button is
-- gated client-side for premium classes).
-- ============================================================

-- Paid-tier check: any non-free plan that hasn't expired, or an admin.
CREATE OR REPLACE FUNCTION public.is_pro_user()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.id = auth.uid()
      AND up.subscription_plan IN ('student', 'pro', 'institution')
      AND (up.subscription_expires_at IS NULL OR up.subscription_expires_at > now())
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_pro_user() TO authenticated;

-- ── Questions: premium rows now require a paid plan ──────────────────
DROP POLICY IF EXISTS "auth_read_premium_questions" ON public.questions;
CREATE POLICY "auth_read_premium_questions"
ON public.questions FOR SELECT TO authenticated
USING (is_active = true AND (is_premium = false OR public.is_pro_user()));

-- ── Exams: premium rows now require a paid plan ──────────────────────
DROP POLICY IF EXISTS "auth_read_premium_exams" ON public.exams;
CREATE POLICY "auth_read_premium_exams"
ON public.exams FOR SELECT TO authenticated
USING (is_active = true AND (is_premium = false OR public.is_pro_user()));
