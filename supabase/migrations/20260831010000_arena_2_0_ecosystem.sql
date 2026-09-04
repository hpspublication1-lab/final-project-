-- ============================================================
-- SAMYAK CEE ARENA 2.0 — COMPETITIVE LEARNING NETWORK
-- Migration: 20260831010000
-- ============================================================

-- 1. EXTEND USER PROFILES WITH SUBJECT RATINGS, STREAK & XP
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS bio_rating INTEGER DEFAULT 1000,
  ADD COLUMN IF NOT EXISTS chem_rating INTEGER DEFAULT 1000,
  ADD COLUMN IF NOT EXISTS phy_rating INTEGER DEFAULT 1000,
  ADD COLUMN IF NOT EXISTS ma_rating INTEGER DEFAULT 1000,
  ADD COLUMN IF NOT EXISTS streak_days INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS last_activity_date DATE DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS xp_points INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;

-- 2. USER ACHIEVEMENTS TABLE
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_code TEXT NOT NULL,
  badge_title TEXT NOT NULL,
  badge_icon TEXT NOT NULL DEFAULT '🏆',
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT user_achievements_unique UNIQUE (user_id, badge_code)
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON public.user_achievements(user_id);

ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view achievements" ON public.user_achievements
  FOR SELECT USING (true);

-- 3. DAILY MISSIONS TABLE
CREATE TABLE IF NOT EXISTS public.user_daily_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mission_code TEXT NOT NULL,
  mission_title TEXT NOT NULL,
  subject_filter TEXT NOT NULL DEFAULT 'mixed',
  target_count INTEGER NOT NULL DEFAULT 2,
  current_count INTEGER NOT NULL DEFAULT 0,
  xp_reward INTEGER NOT NULL DEFAULT 50,
  completed BOOLEAN NOT NULL DEFAULT false,
  claimed BOOLEAN NOT NULL DEFAULT false,
  mission_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT user_daily_missions_unique UNIQUE (user_id, mission_code, mission_date)
);

CREATE INDEX IF NOT EXISTS idx_user_missions_user_date ON public.user_daily_missions(user_id, mission_date);

ALTER TABLE public.user_daily_missions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own daily missions" ON public.user_daily_missions
  FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- 4. BATTLE MATCH EXTENSIONS (FOR BEST OF 3 & DIFFICULTY)
ALTER TABLE public.battle_rooms
  ADD COLUMN IF NOT EXISTS match_mode TEXT DEFAULT 'standard' CHECK (match_mode IN ('standard', 'best_of_3')),
  ADD COLUMN IF NOT EXISTS difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard', 'extreme')),
  ADD COLUMN IF NOT EXISTS series_score_creator INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS series_score_opponent INTEGER DEFAULT 0;

-- 5. FUNCTION TO UPDATE SUBJECT RATINGS AFTER MATCH
CREATE OR REPLACE FUNCTION public.update_battle_subject_rating(
  p_user_id UUID,
  p_subject TEXT,
  p_rating_delta INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_user_id IS NULL THEN
    RETURN;
  END IF;

  IF p_subject = 'biology' THEN
    UPDATE public.user_profiles SET bio_rating = GREATEST(100, bio_rating + p_rating_delta) WHERE id = p_user_id;
  ELSIF p_subject = 'chemistry' THEN
    UPDATE public.user_profiles SET chem_rating = GREATEST(100, chem_rating + p_rating_delta) WHERE id = p_user_id;
  ELSIF p_subject = 'physics' THEN
    UPDATE public.user_profiles SET phy_rating = GREATEST(100, phy_rating + p_rating_delta) WHERE id = p_user_id;
  ELSIF p_subject = 'mental_agility' THEN
    UPDATE public.user_profiles SET ma_rating = GREATEST(100, ma_rating + p_rating_delta) WHERE id = p_user_id;
  END IF;

  -- Update overall rating
  UPDATE public.user_profiles
    SET battle_rating = GREATEST(100, (COALESCE(bio_rating, 1000) + COALESCE(chem_rating, 1000) + COALESCE(phy_rating, 1000) + COALESCE(ma_rating, 1000)) / 4)
    WHERE id = p_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_battle_subject_rating(UUID, TEXT, INTEGER) TO authenticated;
