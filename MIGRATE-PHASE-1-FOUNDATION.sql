-- ============================================================================
-- 🚀 SAMYAK GURU CEE — PHASE 1 FOUNDATION MIGRATION SCRIPT
-- ============================================================================
-- Description: Additive, idempotent schema migration. Preserves all existing
-- data, tables, relationships, subscriptions, and progress records.
-- Run in: Supabase Dashboard → SQL Editor → Run (Safe to run multiple times)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. EXTEND USER_PROFILES WITH PLAN TIERS & LEGACY SAFEGUARD
-- ----------------------------------------------------------------------------
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS plan_tier TEXT DEFAULT 'free';

-- Ensure constraint is clean and allows legacy + new monthly tiers
ALTER TABLE public.user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_plan_tier_check;

ALTER TABLE public.user_profiles
  ADD CONSTRAINT user_profiles_plan_tier_check
  CHECK (plan_tier IN ('free', 'cee_premium', 'cee_ai_pro', 'legacy_pro', 'institution'));

-- Safeguard existing paid subscribers: auto-grant grandfathered tier
UPDATE public.user_profiles
SET plan_tier = 'legacy_pro'
WHERE subscription_plan IN ('pro', 'institution')
  AND (plan_tier IS NULL OR plan_tier = 'free');

UPDATE public.user_profiles
SET plan_tier = 'cee_premium'
WHERE subscription_plan = 'student'
  AND (plan_tier IS NULL OR plan_tier = 'free');

-- ----------------------------------------------------------------------------
-- 2. DAILY AI USAGE TRACKING & TIER-BASED RPC
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_usage_daily (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  request_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  request_count INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, request_date)
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_user_date ON public.ai_usage_daily(user_id, request_date);

ALTER TABLE public.ai_usage_daily ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_usage_read_own" ON public.ai_usage_daily;
CREATE POLICY "ai_usage_read_own" ON public.ai_usage_daily
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Rate-limiter RPC function with tier awareness (Free: 5, Premium: 15, AI Pro: 75)
CREATE OR REPLACE FUNCTION public.check_and_increment_ai_usage(
  p_free_limit INT DEFAULT 5,
  p_pro_limit INT DEFAULT 75
)
RETURNS TABLE (
  allowed BOOLEAN,
  current_count INT,
  daily_limit INT,
  tier TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID;
  v_tier TEXT;
  v_plan TEXT;
  v_expires TIMESTAMPTZ;
  v_effective_limit INT;
  v_current INT;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RETURN QUERY SELECT false, 0, 0, 'anonymous'::TEXT;
    RETURN;
  END IF;

  -- Read user profile entitlements
  SELECT plan_tier, subscription_plan, subscription_expires_at
  INTO v_tier, v_plan, v_expires
  FROM public.user_profiles
  WHERE id = v_uid;

  -- Determine effective tier with expiration check
  IF (v_expires IS NOT NULL AND v_expires < now()) THEN
    v_tier := 'free';
  ELSIF v_tier IS NULL THEN
    v_tier := CASE 
      WHEN v_plan IN ('pro', 'institution') THEN 'legacy_pro'
      WHEN v_plan = 'student' THEN 'cee_premium'
      ELSE 'free'
    END;
  END IF;

  -- Resolve daily allowance based on tier
  IF v_tier IN ('cee_ai_pro', 'legacy_pro') THEN
    v_effective_limit := p_pro_limit; -- default 75/day
  ELSIF v_tier = 'cee_premium' THEN
    v_effective_limit := 15;          -- CEE Premium: 15/day
  ELSE
    v_effective_limit := p_free_limit; -- Free: 5/day
  END IF;

  -- Fetch today's count
  SELECT request_count INTO v_current
  FROM public.ai_usage_daily
  WHERE user_id = v_uid AND request_date = CURRENT_DATE;

  IF v_current IS NULL THEN
    v_current := 0;
  END IF;

  -- Quota exceeded check
  IF v_current >= v_effective_limit THEN
    RETURN QUERY SELECT false, v_current, v_effective_limit, v_tier;
    RETURN;
  END IF;

  -- Increment or insert
  INSERT INTO public.ai_usage_daily (user_id, request_date, request_count, updated_at)
  VALUES (v_uid, CURRENT_DATE, 1, now())
  ON CONFLICT (user_id, request_date)
  DO UPDATE SET
    request_count = public.ai_usage_daily.request_count + 1,
    updated_at = now()
  RETURNING request_count INTO v_current;

  RETURN QUERY SELECT true, v_current, v_effective_limit, v_tier;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_and_increment_ai_usage(INT, INT) TO authenticated, anon;

-- ----------------------------------------------------------------------------
-- 3. ENHANCE NOTES FOR IN-APP LATEX & SCIENTIFIC CONTENT
-- ----------------------------------------------------------------------------
ALTER TABLE public.notes
  ADD COLUMN IF NOT EXISTS content_markdown TEXT,
  ADD COLUMN IF NOT EXISTS summary_key_points TEXT[],
  ADD COLUMN IF NOT EXISTS formula_sheet_latex TEXT;

-- ----------------------------------------------------------------------------
-- 4. STRUCTURED PREVIOUS YEAR QUESTIONS (PYQ) & HIGH-YIELD ATTRIBUTES
-- ----------------------------------------------------------------------------
ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS is_pyq BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS exam_name TEXT,
  ADD COLUMN IF NOT EXISTS exam_year INTEGER,
  ADD COLUMN IF NOT EXISTS is_verified_pyq BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS high_yield_priority TEXT DEFAULT 'medium';

ALTER TABLE public.questions
  DROP CONSTRAINT IF EXISTS questions_high_yield_priority_check;

ALTER TABLE public.questions
  ADD CONSTRAINT questions_high_yield_priority_check
  CHECK (high_yield_priority IN ('low', 'medium', 'high', 'must_know'));

CREATE INDEX IF NOT EXISTS idx_questions_pyq_search
  ON public.questions(is_pyq, exam_year, subject_id)
  WHERE is_pyq = true;

-- ----------------------------------------------------------------------------
-- 5. DAILY RS 1,000 BATTLE ARENA CHAMPIONSHIP ARCHITECTURE
-- ----------------------------------------------------------------------------
-- 5.1 Daily Championship Master Record
CREATE TABLE IF NOT EXISTS public.daily_championships (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_date   DATE NOT NULL UNIQUE,
  status             TEXT NOT NULL DEFAULT 'active'
                       CHECK (status IN ('active', 'evaluating', 'finalized')),
  prize_amount_npr   INTEGER NOT NULL DEFAULT 1000,
  winner_user_id     UUID REFERENCES public.user_profiles(id),
  total_participants INTEGER DEFAULT 0,
  total_matches      INTEGER DEFAULT 0,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  finalized_at       TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_daily_championships_date
  ON public.daily_championships(competition_date);

-- 5.2 Daily Championship Student Participation Entries
CREATE TABLE IF NOT EXISTS public.championship_entries (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  championship_id        UUID NOT NULL REFERENCES public.daily_championships(id) ON DELETE CASCADE,
  user_id                UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  match_count            INTEGER NOT NULL DEFAULT 0,
  total_score            NUMERIC(7,2) NOT NULL DEFAULT 0,
  accuracy_percentage    NUMERIC(5,2) NOT NULL DEFAULT 0,
  total_time_seconds     INTEGER NOT NULL DEFAULT 0,
  correct_count          INTEGER NOT NULL DEFAULT 0,
  incorrect_count        INTEGER NOT NULL DEFAULT 0,
  anti_cheat_flags_count INTEGER NOT NULL DEFAULT 0,
  flagged_for_review     BOOLEAN NOT NULL DEFAULT false,
  processed_room_ids     TEXT[] DEFAULT '{}',
  disqualified           BOOLEAN NOT NULL DEFAULT false,
  disqualification_reason TEXT,
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (championship_id, user_id)
);

ALTER TABLE public.championship_entries
  ADD COLUMN IF NOT EXISTS flagged_for_review BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS processed_room_ids TEXT[] DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_champ_entries_rank
  ON public.championship_entries(championship_id, disqualified, total_score DESC, accuracy_percentage DESC, total_time_seconds ASC);

-- 5.3 Daily Championship Payout & Audit Records
CREATE TABLE IF NOT EXISTS public.championship_payouts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  championship_id UUID NOT NULL REFERENCES public.daily_championships(id),
  winner_user_id  UUID NOT NULL REFERENCES public.user_profiles(id),
  amount_npr      INTEGER NOT NULL DEFAULT 1000,
  payout_method   TEXT NOT NULL DEFAULT 'esewa',
  esewa_id        TEXT,
  payout_status   TEXT NOT NULL DEFAULT 'pending_verification'
                    CHECK (payout_status IN ('pending_verification', 'approved', 'processing', 'completed', 'rejected')),
  transaction_ref TEXT,
  approved_by     UUID REFERENCES public.user_profiles(id),
  admin_notes     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_champ_payouts_status
  ON public.championship_payouts(payout_status);

-- 5.4 Dedicated Processed Championship Match Ledger for Strict Concurrency & Idempotency
CREATE TABLE IF NOT EXISTS public.championship_matches (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  championship_id    UUID NOT NULL REFERENCES public.daily_championships(id) ON DELETE CASCADE,
  participant_id     UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  room_id            UUID NOT NULL REFERENCES public.battle_rooms(id) ON DELETE CASCADE,
  match_points       NUMERIC(7,2) NOT NULL DEFAULT 0,
  correct_count      INTEGER NOT NULL DEFAULT 0,
  incorrect_count    INTEGER NOT NULL DEFAULT 0,
  time_taken_seconds INTEGER NOT NULL DEFAULT 0,
  accuracy           NUMERIC(5,2) NOT NULL DEFAULT 0,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_champ_match_participant_room UNIQUE (championship_id, participant_id, room_id)
);

CREATE INDEX IF NOT EXISTS idx_champ_matches_user_champ
  ON public.championship_matches(championship_id, participant_id);

-- 5.5 Row Level Security for Championship Tables
ALTER TABLE public.daily_championships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.championship_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.championship_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.championship_matches ENABLE ROW LEVEL SECURITY;

-- 5.6 Question Answer Key Confidentiality
-- Ensure unprivileged anon/authenticated clients cannot select correct_answer or explanation directly
DO $$
BEGIN
  REVOKE SELECT (correct_answer, explanation) ON public.questions FROM anon, authenticated;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- Championships: Public read for active/finalized
DROP POLICY IF EXISTS "read_daily_championships" ON public.daily_championships;
CREATE POLICY "read_daily_championships" ON public.daily_championships
  FOR SELECT TO anon, authenticated
  USING (true);

-- Entries: Public read for leaderboards; authenticated can see own
DROP POLICY IF EXISTS "read_championship_entries" ON public.championship_entries;
CREATE POLICY "read_championship_entries" ON public.championship_entries
  FOR SELECT TO anon, authenticated
  USING (true);

-- Payouts: Authenticated users can view their own payout row; Admins view all
DROP POLICY IF EXISTS "read_own_championship_payouts" ON public.championship_payouts;
CREATE POLICY "read_own_championship_payouts" ON public.championship_payouts
  FOR SELECT TO authenticated
  USING (winner_user_id = auth.uid() OR public.is_admin());

-- Notification to schema cache
NOTIFY pgrst, 'reload schema';
