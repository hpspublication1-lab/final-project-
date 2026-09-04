-- ============================================================
-- SAMYAK CEE ARENA 3.0 — IDENTITY, REWARDS & SEASONS
-- Migration: 20260831020000
-- ============================================================

-- 1. EXTEND USER PROFILES WITH IDENTITY & STATS
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS username VARCHAR(30) UNIQUE,
  ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT 'CEE Entrance Aspirant 🎓',
  ADD COLUMN IF NOT EXISTS selected_title TEXT DEFAULT 'CEE Challenger',
  ADD COLUMN IF NOT EXISTS featured_achievements TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS wins_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS losses_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS win_streak INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_matches INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS anti_cheat_status TEXT DEFAULT 'normal' CHECK (anti_cheat_status IN ('normal', 'watch', 'review', 'suspended')),
  ADD COLUMN IF NOT EXISTS country_rank INTEGER DEFAULT 127;

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_username ON public.user_profiles(LOWER(username)) WHERE username IS NOT NULL;

-- 2. RECENT OPPONENTS TABLE
CREATE TABLE IF NOT EXISTS public.arena_recent_opponents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  opponent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_battled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  outcome TEXT NOT NULL CHECK (outcome IN ('win', 'loss', 'draw')),
  rating_delta INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT arena_recent_opponents_unique UNIQUE (user_id, opponent_id)
);

CREATE INDEX IF NOT EXISTS idx_arena_recent_opponents_user ON public.arena_recent_opponents(user_id, last_battled_at DESC);

ALTER TABLE public.arena_recent_opponents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own recent opponents" ON public.arena_recent_opponents
  FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- 3. CEE SEASONS TABLE
CREATE TABLE IF NOT EXISTS public.arena_seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  prize_pool_npr NUMERIC NOT NULL DEFAULT 10000,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.arena_seasons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active seasons" ON public.arena_seasons
  FOR SELECT USING (true);

-- Insert Default Season 01
INSERT INTO public.arena_seasons (season_code, title, starts_at, ends_at, is_active, prize_pool_npr)
VALUES ('SEASON_01', 'CEE Season 01 — Medical Entrance Cup', now(), now() + INTERVAL '30 days', true, 25000)
ON CONFLICT (season_code) DO NOTHING;

-- 4. USER REWARD WALLET
CREATE TABLE IF NOT EXISTS public.user_reward_wallet (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  available_npr NUMERIC NOT NULL DEFAULT 0,
  pending_npr NUMERIC NOT NULL DEFAULT 0,
  total_earned_npr NUMERIC NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_reward_wallet ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reward wallet" ON public.user_reward_wallet
  FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- 5. REWARD TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.reward_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_npr NUMERIC NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'approved', 'payment_processing', 'paid', 'rejected')),
  season_id UUID REFERENCES public.arena_seasons(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reward_tx_user ON public.reward_transactions(user_id);

ALTER TABLE public.reward_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reward transactions" ON public.reward_transactions
  FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- 6. ARENA NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.arena_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'general',
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_arena_notif_user ON public.arena_notifications(user_id, is_read);

ALTER TABLE public.arena_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own arena notifications" ON public.arena_notifications
  FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'service_role');

ALTER PUBLICATION supabase_realtime ADD TABLE public.arena_notifications;
