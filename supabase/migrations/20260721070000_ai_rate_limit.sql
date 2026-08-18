-- ============================================================
-- Migration: per-user daily AI usage rate limiting
-- Timestamp: 20260721070000
-- ============================================================
--
-- The AI features (AI Tutor, MCQ Generator, Mistake Analyser, admin
-- AI Review) call the server /api/ai/chat-completion route, which
-- forwards to a paid LLM provider. There was no per-user cap, so a
-- single user could run up unbounded cost. This adds a simple daily
-- counter + an atomic check-and-increment RPC the API route calls
-- before spending money on a completion.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.ai_usage (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  usage_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  request_count INTEGER NOT NULL DEFAULT 0,
  updated_at    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, usage_date)
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_user_date ON public.ai_usage(user_id, usage_date);

ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

-- Users may read their own usage (e.g. to show "X / Y left today").
DROP POLICY IF EXISTS "users_read_own_ai_usage" ON public.ai_usage;
CREATE POLICY "users_read_own_ai_usage"
ON public.ai_usage FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- All writes go through the SECURITY DEFINER RPC below; no direct
-- INSERT/UPDATE policy is granted, so clients cannot tamper with counts.

-- Atomic check-and-increment. Returns the row AFTER incrementing when
-- allowed; returns allowed=false WITHOUT incrementing when the cap is
-- already reached. Pro/admin users get a higher default limit.
CREATE OR REPLACE FUNCTION public.check_and_increment_ai_usage(
  p_free_limit INTEGER DEFAULT 25,
  p_pro_limit  INTEGER DEFAULT 200
)
RETURNS TABLE (allowed BOOLEAN, used INTEGER, daily_limit INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid   UUID := auth.uid();
  v_limit INTEGER;
  v_count INTEGER;
BEGIN
  IF v_uid IS NULL THEN
    RETURN QUERY SELECT false, 0, 0;
    RETURN;
  END IF;

  v_limit := CASE WHEN public.is_pro_user() THEN p_pro_limit ELSE p_free_limit END;

  -- Lock (or create) today's row for this user.
  INSERT INTO public.ai_usage (user_id, usage_date, request_count)
  VALUES (v_uid, CURRENT_DATE, 0)
  ON CONFLICT (user_id, usage_date) DO NOTHING;

  SELECT request_count INTO v_count
  FROM public.ai_usage
  WHERE user_id = v_uid AND usage_date = CURRENT_DATE
  FOR UPDATE;

  IF v_count >= v_limit THEN
    RETURN QUERY SELECT false, v_count, v_limit;
    RETURN;
  END IF;

  UPDATE public.ai_usage
  SET request_count = request_count + 1, updated_at = now()
  WHERE user_id = v_uid AND usage_date = CURRENT_DATE
  RETURNING request_count INTO v_count;

  RETURN QUERY SELECT true, v_count, v_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_and_increment_ai_usage(INTEGER, INTEGER) TO authenticated;
