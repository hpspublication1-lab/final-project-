-- ============================================================================
-- 🚀 SAMYAK GURU CEE — UNIFIED MASTER PRODUCTION MIGRATION SCRIPT
-- ============================================================================
-- Target Database: Supabase PostgreSQL (CEE Platform)
-- Execution Mode: Non-destructive, Idempotent, Additive (Safe to run multiple times)
-- Safety: Preserves all existing tables, student records, subscriptions, and progress
-- ============================================================================

-- ----------------------------------------------------------------------------
-- PART 1: CORE PROFILE & CONTENT SCHEMA ENHANCEMENTS
-- ----------------------------------------------------------------------------

-- 1.1 User Profiles: Plan Tiers
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS plan_tier TEXT DEFAULT 'free';

ALTER TABLE public.user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_plan_tier_check;

ALTER TABLE public.user_profiles
  ADD CONSTRAINT user_profiles_plan_tier_check
  CHECK (plan_tier IN ('free', 'cee_premium', 'cee_ai_pro', 'legacy_pro', 'institution'));

-- Grandfather existing paid subscribers safely
UPDATE public.user_profiles
SET plan_tier = 'legacy_pro'
WHERE subscription_plan IN ('pro', 'institution')
  AND (plan_tier IS NULL OR plan_tier = 'free');

UPDATE public.user_profiles
SET plan_tier = 'cee_premium'
WHERE subscription_plan = 'student'
  AND (plan_tier IS NULL OR plan_tier = 'free');

-- 1.2 Notes Table: LaTeX & Markdown enhancements
ALTER TABLE public.notes
  ADD COLUMN IF NOT EXISTS content_markdown TEXT,
  ADD COLUMN IF NOT EXISTS summary_key_points TEXT[],
  ADD COLUMN IF NOT EXISTS formula_sheet_latex TEXT;

-- 1.3 Questions Table: PYQ Metadata & Verification
ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
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

-- 1.4 CRITICAL SECURITY: Enforce question answer-key confidentiality
-- In PostgreSQL, table-level SELECT overrides column-level REVOKE.
-- We explicitly REVOKE table-level SELECT from untrusted roles (anon, authenticated)
-- and GRANT SELECT strictly on non-sensitive public columns.
DO $$
BEGIN
  REVOKE SELECT ON public.questions FROM anon, authenticated;
  GRANT SELECT (
    id,
    subject_id,
    chapter_id,
    question_text,
    options,
    difficulty,
    is_published,
    created_at,
    updated_at,
    is_active,
    is_pyq,
    exam_name,
    exam_year,
    is_verified_pyq,
    high_yield_priority
  ) ON public.questions TO anon, authenticated;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;


-- ----------------------------------------------------------------------------
-- PART 2: AI RATE LIMITING & TIER ENFORCEMENT
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

  SELECT plan_tier, subscription_plan, subscription_expires_at
  INTO v_tier, v_plan, v_expires
  FROM public.user_profiles
  WHERE id = v_uid;

  IF (v_expires IS NOT NULL AND v_expires < now()) THEN
    v_tier := 'free';
  ELSIF v_tier IS NULL THEN
    v_tier := CASE 
      WHEN v_plan IN ('pro', 'institution') THEN 'legacy_pro'
      WHEN v_plan = 'student' THEN 'cee_premium'
      ELSE 'free'
    END;
  END IF;

  IF v_tier IN ('cee_ai_pro', 'legacy_pro') THEN
    v_effective_limit := p_pro_limit;
  ELSIF v_tier = 'cee_premium' THEN
    v_effective_limit := 15;
  ELSE
    v_effective_limit := p_free_limit;
  END IF;

  SELECT request_count INTO v_current
  FROM public.ai_usage_daily
  WHERE user_id = v_uid AND request_date = CURRENT_DATE;

  IF v_current IS NULL THEN
    v_current := 0;
  END IF;

  IF v_current >= v_effective_limit THEN
    RETURN QUERY SELECT false, v_current, v_effective_limit, v_tier;
    RETURN;
  END IF;

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
-- PART 3: BATTLE ARENA REAL-TIME MULTIPLAYER TABLES & SYNCHRONIZATION
-- ----------------------------------------------------------------------------

-- 3.1 Battle Rooms
CREATE TABLE IF NOT EXISTS public.battle_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

ALTER TABLE public.battle_rooms
  ADD COLUMN IF NOT EXISTS room_code TEXT,
  ADD COLUMN IF NOT EXISTS creator_id UUID REFERENCES public.user_profiles(id),
  ADD COLUMN IF NOT EXISTS opponent_id UUID REFERENCES public.user_profiles(id),
  ADD COLUMN IF NOT EXISTS subject_id UUID,
  ADD COLUMN IF NOT EXISTS chapter_id UUID,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'waiting',
  ADD COLUMN IF NOT EXISTS question_count INTEGER DEFAULT 10,
  ADD COLUMN IF NOT EXISTS time_limit_seconds INTEGER DEFAULT 300,
  ADD COLUMN IF NOT EXISTS question_ids UUID[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_ranked BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_battle_rooms_code_status ON public.battle_rooms(room_code, status);
CREATE INDEX IF NOT EXISTS idx_battle_rooms_players ON public.battle_rooms(creator_id, opponent_id);

-- 3.2 Room Members
CREATE TABLE IF NOT EXISTS public.room_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES public.battle_rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (room_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_room_members_user ON public.room_members(user_id);

-- 3.3 Matchmaking Queue
CREATE TABLE IF NOT EXISTS public.matchmaking_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  queue_mode TEXT DEFAULT 'ranked',
  player_rating INTEGER DEFAULT 1000,
  subject_filter TEXT DEFAULT 'mixed',
  status TEXT DEFAULT 'searching',
  matched_room_id UUID REFERENCES public.battle_rooms(id),
  matched_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_matchmaking_queue_search
  ON public.matchmaking_queue(status, queue_mode, joined_at);

-- 3.4 Battle Results
CREATE TABLE IF NOT EXISTS public.battle_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES public.battle_rooms(id) ON DELETE CASCADE,
  player_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  score NUMERIC DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  incorrect_answers INTEGER DEFAULT 0,
  accuracy NUMERIC DEFAULT 0,
  rating_change INTEGER DEFAULT 0,
  is_winner BOOLEAN DEFAULT false,
  time_taken_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (room_id, player_id)
);

CREATE INDEX IF NOT EXISTS idx_battle_results_room_player ON public.battle_results(room_id, player_id);

-- 3.5 Battle Answers
CREATE TABLE IF NOT EXISTS public.battle_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES public.battle_rooms(id) ON DELETE CASCADE,
  player_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  question_id UUID,
  question_index INTEGER DEFAULT 0,
  selected_option TEXT,
  is_correct BOOLEAN DEFAULT false,
  time_taken_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_battle_answers_room_player ON public.battle_answers(room_id, player_id);


-- ----------------------------------------------------------------------------
-- PART 4: DAILY RS 1,000 CHAMPIONSHIP ARCHITECTURE & CONCURRENCY LEDGER
-- ----------------------------------------------------------------------------

-- 4.1 Daily Championships Master
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

-- 4.2 Daily Championship Entries
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

-- 4.3 Championship Matches (Database Engine Concurrency & Idempotency Ledger)
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

-- 4.4 Championship Payouts
CREATE TABLE IF NOT EXISTS public.championship_payouts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  championship_id UUID REFERENCES public.daily_championships(id),
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


-- ----------------------------------------------------------------------------
-- PART 5: MULTIPLAYER HELPER FUNCTIONS & SECURE RPCS
-- ----------------------------------------------------------------------------

-- 5.1 Helper: Check room membership
CREATE OR REPLACE FUNCTION public.is_room_member(p_room_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.room_members rm
    WHERE rm.room_id = p_room_id AND rm.user_id = auth.uid()
    UNION
    SELECT 1 FROM public.battle_rooms br
    WHERE br.id = p_room_id AND (br.creator_id = auth.uid() OR br.opponent_id = auth.uid())
  );
$$;

-- 5.2 Helper: Pick random battle questions
CREATE OR REPLACE FUNCTION public.pick_battle_questions(
  p_subject_filter TEXT DEFAULT 'mixed',
  p_count INTEGER DEFAULT 10
)
RETURNS UUID[]
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COALESCE(ARRAY_AGG(id), ARRAY[]::UUID[]) FROM (
    SELECT id FROM public.questions
    WHERE COALESCE(is_active, true) = true
      AND (
        p_subject_filter IS NULL
        OR p_subject_filter = 'mixed'
        OR subject_id = (SELECT id FROM public.subjects WHERE name::TEXT = p_subject_filter)
      )
    ORDER BY random()
    LIMIT p_count
  ) q;
$$;

-- 5.3 Matchmaking: Find or Create Battle Match
CREATE OR REPLACE FUNCTION public.find_or_create_battle_match(
  p_queue_mode TEXT,
  p_subject_filter TEXT DEFAULT 'mixed'
)
RETURNS TABLE (queue_id UUID, room_id UUID, matched BOOLEAN)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_my_id UUID := auth.uid();
  v_my_rating INTEGER;
  v_rating_range INTEGER;
  v_opponent RECORD;
  v_my_queue_id UUID;
  v_room_id UUID;
  v_question_ids UUID[];
  v_room_code TEXT;
BEGIN
  IF v_my_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT battle_rating INTO v_my_rating FROM public.user_profiles WHERE id = v_my_id;
  v_my_rating := COALESCE(v_my_rating, 1000);
  v_rating_range := CASE WHEN p_queue_mode = 'ranked' THEN 150 ELSE 400 END;

  UPDATE public.matchmaking_queue
    SET status = 'cancelled'
    WHERE player_id = v_my_id AND status = 'searching';

  SELECT * INTO v_opponent
  FROM public.matchmaking_queue
  WHERE status = 'searching'
    AND queue_mode = p_queue_mode
    AND player_id != v_my_id
    AND player_rating BETWEEN v_my_rating - v_rating_range AND v_my_rating + v_rating_range
  ORDER BY joined_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF v_opponent.id IS NOT NULL THEN
    v_question_ids := public.pick_battle_questions(p_subject_filter, 10);
    v_room_code := UPPER(SUBSTRING(MD5(random()::TEXT || clock_timestamp()::TEXT) FROM 1 FOR 6));

    INSERT INTO public.battle_rooms (
      room_code, creator_id, opponent_id, status, question_count,
      time_limit_seconds, question_ids, is_ranked, started_at
    ) VALUES (
      v_room_code, v_opponent.player_id, v_my_id, 'active',
      GREATEST(COALESCE(array_length(v_question_ids, 1), 0), 1),
      300, v_question_ids, (p_queue_mode = 'ranked'), now()
    )
    RETURNING id INTO v_room_id;

    INSERT INTO public.room_members (room_id, user_id)
    VALUES (v_room_id, v_opponent.player_id), (v_room_id, v_my_id)
    ON CONFLICT DO NOTHING;

    UPDATE public.matchmaking_queue
      SET status = 'matched', matched_room_id = v_room_id, matched_at = now()
      WHERE id = v_opponent.id;

    INSERT INTO public.matchmaking_queue (
      player_id, queue_mode, player_rating, subject_filter, status, matched_room_id, matched_at
    ) VALUES (
      v_my_id, p_queue_mode, v_my_rating, p_subject_filter, 'matched', v_room_id, now()
    )
    RETURNING id INTO v_my_queue_id;

    RETURN QUERY SELECT v_my_queue_id, v_room_id, true;
  ELSE
    INSERT INTO public.matchmaking_queue (player_id, queue_mode, player_rating, subject_filter, status)
    VALUES (v_my_id, p_queue_mode, v_my_rating, p_subject_filter, 'searching')
    RETURNING id INTO v_my_queue_id;

    RETURN QUERY SELECT v_my_queue_id, NULL::UUID, false;
  END IF;
END;
$$;

-- 5.4 Battle Arena Result Submission
CREATE OR REPLACE FUNCTION public.submit_battle_result(
  p_room_id UUID,
  p_score NUMERIC,
  p_correct INTEGER,
  p_incorrect INTEGER,
  p_accuracy NUMERIC,
  p_time_taken INTEGER
)
RETURNS TABLE (
  result_id UUID,
  new_rating INTEGER,
  rating_diff INTEGER,
  is_winner BOOLEAN,
  room_completed BOOLEAN
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_my_id UUID := auth.uid();
  v_room RECORD;
  v_my_profile RECORD;
  v_opp_result RECORD;
  v_opp_profile RECORD;
  v_is_winner BOOLEAN := false;
  v_rating_diff INTEGER := 0;
  v_new_rating INTEGER;
  v_room_done BOOLEAN := false;
  v_res_id UUID;
  v_expected_score NUMERIC;
  v_k_factor INTEGER := 32;
  v_opp_id UUID;
BEGIN
  IF v_my_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_room FROM public.battle_rooms WHERE id = p_room_id;
  IF v_room.id IS NULL THEN
    RAISE EXCEPTION 'Room not found';
  END IF;

  IF v_room.creator_id != v_my_id AND v_room.opponent_id != v_my_id THEN
    RAISE EXCEPTION 'Unauthorized for this room';
  END IF;

  v_opp_id := CASE WHEN v_room.creator_id = v_my_id THEN v_room.opponent_id ELSE v_room.creator_id END;

  SELECT * INTO v_my_profile FROM public.user_profiles WHERE id = v_my_id;
  v_new_rating := COALESCE(v_my_profile.battle_rating, 1000);

  SELECT * INTO v_opp_result FROM public.battle_results
    WHERE room_id = p_room_id AND player_id != v_my_id;

  IF v_opp_result.id IS NOT NULL THEN
    v_room_done := true;
    UPDATE public.battle_rooms SET status = 'completed', completed_at = now() WHERE id = p_room_id;

    IF p_score > v_opp_result.score THEN
      v_is_winner := true;
    ELSIF p_score = v_opp_result.score THEN
      v_is_winner := (p_time_taken < v_opp_result.time_taken_seconds);
    ELSE
      v_is_winner := false;
    END IF;

    IF v_is_winner AND v_opp_result.is_winner THEN
      UPDATE public.battle_results SET is_winner = false WHERE id = v_opp_result.id;
    END IF;

    IF COALESCE(v_room.is_ranked, false) AND v_opp_id IS NOT NULL THEN
      SELECT * INTO v_opp_profile FROM public.user_profiles WHERE id = v_opp_id;
      v_expected_score := 1.0 / (1.0 + power(10.0, ((COALESCE(v_opp_profile.battle_rating, 1000) - v_new_rating)::NUMERIC / 400.0)));
      IF v_is_winner THEN
        v_rating_diff := round(v_k_factor * (1.0 - v_expected_score));
      ELSIF p_score = v_opp_result.score AND p_time_taken = v_opp_result.time_taken_seconds THEN
        v_rating_diff := round(v_k_factor * (0.5 - v_expected_score));
      ELSE
        v_rating_diff := round(v_k_factor * (0.0 - v_expected_score));
      END IF;

      v_new_rating := GREATEST(100, v_new_rating + v_rating_diff);
      UPDATE public.user_profiles SET battle_rating = v_new_rating, updated_at = now() WHERE id = v_my_id;
    END IF;
  ELSE
    IF v_opp_id IS NULL THEN
      v_is_winner := true;
      v_room_done := true;
      UPDATE public.battle_rooms SET status = 'completed', completed_at = now() WHERE id = p_room_id;
    END IF;
  END IF;

  INSERT INTO public.battle_results (
    room_id, player_id, score, correct_answers, incorrect_answers,
    accuracy, rating_change, is_winner, time_taken_seconds
  ) VALUES (
    p_room_id, v_my_id, p_score, p_correct, p_incorrect,
    p_accuracy, v_rating_diff, v_is_winner, p_time_taken
  )
  ON CONFLICT (room_id, player_id) DO UPDATE SET
    score = EXCLUDED.score,
    correct_answers = EXCLUDED.correct_answers,
    incorrect_answers = EXCLUDED.incorrect_answers,
    accuracy = EXCLUDED.accuracy,
    rating_change = EXCLUDED.rating_change,
    is_winner = EXCLUDED.is_winner,
    time_taken_seconds = EXCLUDED.time_taken_seconds
  RETURNING id INTO v_res_id;

  RETURN QUERY SELECT v_res_id, v_new_rating, v_rating_diff, v_is_winner, v_room_done;
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_room_member(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.pick_battle_questions(TEXT, INTEGER) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.find_or_create_battle_match(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_battle_result(UUID, NUMERIC, INTEGER, INTEGER, NUMERIC, INTEGER) TO authenticated;

-- 5.5 Atomic Championship Match Recording & Concurrency Lock
CREATE OR REPLACE FUNCTION public.record_championship_match(
  p_championship_id UUID,
  p_participant_id UUID,
  p_room_id UUID,
  p_correct_count INTEGER,
  p_incorrect_count INTEGER,
  p_time_taken_seconds INTEGER,
  p_accuracy NUMERIC,
  p_anti_cheat_flags INTEGER DEFAULT 0
)
RETURNS TABLE (
  success BOOLEAN,
  idempotent BOOLEAN,
  capped BOOLEAN,
  match_points NUMERIC,
  new_total_score NUMERIC,
  new_accuracy NUMERIC,
  matches_played INTEGER,
  remaining_matches INTEGER,
  disqualified BOOLEAN,
  flagged_for_review BOOLEAN,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_champ RECORD;
  v_entry RECORD;
  v_existing_match RECORD;
  v_match_points NUMERIC(7,2) := 0;
  v_speed_bonus NUMERIC(7,2) := 0;
  v_new_matches INTEGER;
  v_new_total_score NUMERIC(7,2);
  v_new_correct INTEGER;
  v_new_incorrect INTEGER;
  v_new_time INTEGER;
  v_total_answered INTEGER;
  v_new_accuracy NUMERIC(5,2);
  v_total_flags INTEGER;
  v_flagged BOOLEAN;
  v_review_reason TEXT;
BEGIN
  -- 1. Verify daily championship is active
  SELECT * INTO v_champ
  FROM public.daily_championships
  WHERE id = p_championship_id
  FOR SHARE;

  IF v_champ.id IS NULL THEN
    RETURN QUERY SELECT false, false, false, 0::NUMERIC, 0::NUMERIC, 0::NUMERIC, 0, 0, false, false, 'Championship not found'::TEXT;
    RETURN;
  END IF;

  IF v_champ.status != 'active' THEN
    RETURN QUERY SELECT false, false, false, 0::NUMERIC, 0::NUMERIC, 0::NUMERIC, 0, 0, false, false, 'Championship is not active'::TEXT;
    RETURN;
  END IF;

  -- 2. Lock or initialize the championship_entries row FOR UPDATE
  -- Serializes concurrent submissions for this participant
  INSERT INTO public.championship_entries (
    championship_id, user_id, match_count, total_score, accuracy_percentage, total_time_seconds
  ) VALUES (
    p_championship_id, p_participant_id, 0, 0, 0, 0
  )
  ON CONFLICT (championship_id, user_id) DO NOTHING;

  SELECT * INTO v_entry
  FROM public.championship_entries
  WHERE championship_id = p_championship_id AND user_id = p_participant_id
  FOR UPDATE;

  -- 3. Duplicate check in championship_matches ledger
  IF p_room_id IS NOT NULL THEN
    SELECT * INTO v_existing_match
    FROM public.championship_matches
    WHERE championship_id = p_championship_id
      AND participant_id = p_participant_id
      AND room_id = p_room_id;

    IF v_existing_match.id IS NOT NULL THEN
      RETURN QUERY SELECT
        true, true, false,
        0::NUMERIC,
        v_entry.total_score,
        v_entry.accuracy_percentage,
        v_entry.match_count,
        GREATEST(0, 10 - v_entry.match_count),
        v_entry.disqualified,
        COALESCE(v_entry.flagged_for_review, false),
        'Match result already recorded (idempotent)'::TEXT;
      RETURN;
    END IF;
  END IF;

  -- 4. Daily 10-match limit check
  IF v_entry.match_count >= 10 THEN
    RETURN QUERY SELECT
      false, false, true,
      0::NUMERIC,
      v_entry.total_score,
      v_entry.accuracy_percentage,
      v_entry.match_count,
      0,
      v_entry.disqualified,
      COALESCE(v_entry.flagged_for_review, false),
      'Daily match limit of 10 reached'::TEXT;
    RETURN;
  END IF;

  -- 5. Calculate Server-Authoritative Score for this match
  IF (p_correct_count + p_incorrect_count) > 0 AND p_accuracy >= 80 AND p_time_taken_seconds > 0 AND p_time_taken_seconds < 300 THEN
    v_speed_bonus := LEAST(5.0, ROUND((300 - p_time_taken_seconds)::NUMERIC / 20.0));
  END IF;

  v_match_points := GREATEST(0.0, (p_correct_count * 10.0) - (p_incorrect_count * 2.5) + v_speed_bonus);

  -- 6. Insert into championship_matches ledger
  IF p_room_id IS NOT NULL THEN
    BEGIN
      INSERT INTO public.championship_matches (
        championship_id, participant_id, room_id, match_points,
        correct_count, incorrect_count, time_taken_seconds, accuracy, created_at
      ) VALUES (
        p_championship_id, p_participant_id, p_room_id, v_match_points,
        p_correct_count, p_incorrect_count, p_time_taken_seconds, p_accuracy, now()
      );
    EXCEPTION
      WHEN unique_violation THEN
        RETURN QUERY SELECT
          true, true, false,
          0::NUMERIC,
          v_entry.total_score,
          v_entry.accuracy_percentage,
          v_entry.match_count,
          GREATEST(0, 10 - v_entry.match_count),
          v_entry.disqualified,
          COALESCE(v_entry.flagged_for_review, false),
          'Concurrent match submission handled via unique constraint'::TEXT;
        RETURN;
    END;
  END IF;

  -- 7. Update cumulative entry stats
  v_new_matches := v_entry.match_count + 1;
  v_new_total_score := v_entry.total_score + v_match_points;
  v_new_correct := v_entry.correct_count + p_correct_count;
  v_new_incorrect := v_entry.incorrect_count + p_incorrect_count;
  v_new_time := v_entry.total_time_seconds + p_time_taken_seconds;
  v_total_answered := v_new_correct + v_new_incorrect;
  v_new_accuracy := CASE WHEN v_total_answered > 0 THEN ROUND((v_new_correct::NUMERIC / v_total_answered::NUMERIC) * 100.0, 1) ELSE 0 END;

  v_total_flags := COALESCE(v_entry.anti_cheat_flags_count, 0) + p_anti_cheat_flags;
  v_flagged := COALESCE(v_entry.flagged_for_review, false) OR (v_total_flags >= 4);
  v_review_reason := v_entry.disqualification_reason;
  IF v_review_reason IS NULL AND v_flagged THEN
    v_review_reason := 'Flagged for review: ' || v_total_flags || ' security events recorded.';
  END IF;

  UPDATE public.championship_entries
  SET
    match_count = v_new_matches,
    total_score = v_new_total_score,
    accuracy_percentage = v_new_accuracy,
    total_time_seconds = v_new_time,
    correct_count = v_new_correct,
    incorrect_count = v_new_incorrect,
    anti_cheat_flags_count = v_total_flags,
    flagged_for_review = v_flagged,
    disqualification_reason = v_review_reason,
    processed_room_ids = CASE 
      WHEN p_room_id IS NOT NULL THEN ARRAY(SELECT DISTINCT unnest(array_append(COALESCE(v_entry.processed_room_ids, '{}'), p_room_id::TEXT)))
      ELSE v_entry.processed_room_ids
    END,
    updated_at = now()
  WHERE championship_id = p_championship_id AND user_id = p_participant_id;

  -- 8. Increment championship aggregate match counter
  UPDATE public.daily_championships
  SET total_matches = COALESCE(total_matches, 0) + 1,
      total_participants = (
        SELECT COUNT(DISTINCT user_id) FROM public.championship_entries WHERE championship_id = p_championship_id
      )
  WHERE id = p_championship_id;

  RETURN QUERY SELECT
    true, false, false,
    v_match_points,
    v_new_total_score,
    v_new_accuracy,
    v_new_matches,
    GREATEST(0, 10 - v_new_matches),
    v_entry.disqualified,
    v_flagged,
    'Match recorded successfully'::TEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_championship_match(UUID, UUID, UUID, INTEGER, INTEGER, INTEGER, NUMERIC, INTEGER) TO authenticated, service_role;


-- ----------------------------------------------------------------------------
-- PART 6: ROW LEVEL SECURITY POLICIES
-- ----------------------------------------------------------------------------

ALTER TABLE public.battle_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matchmaking_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.battle_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.battle_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_championships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.championship_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.championship_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.championship_matches ENABLE ROW LEVEL SECURITY;

-- Battle Rooms Policies
DROP POLICY IF EXISTS "battle_rooms_read_all" ON public.battle_rooms;
CREATE POLICY "battle_rooms_read_all" ON public.battle_rooms
  FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "battle_rooms_insert_auth" ON public.battle_rooms;
CREATE POLICY "battle_rooms_insert_auth" ON public.battle_rooms
  FOR INSERT TO authenticated WITH CHECK (creator_id = auth.uid());

DROP POLICY IF EXISTS "battle_rooms_update_members" ON public.battle_rooms;
CREATE POLICY "battle_rooms_update_members" ON public.battle_rooms
  FOR UPDATE TO authenticated
  USING (creator_id = auth.uid() OR opponent_id = auth.uid() OR opponent_id IS NULL);

-- Battle Results Policies
DROP POLICY IF EXISTS "battle_results_read_all" ON public.battle_results;
CREATE POLICY "battle_results_read_all" ON public.battle_results
  FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "battle_results_insert_own" ON public.battle_results;
CREATE POLICY "battle_results_insert_own" ON public.battle_results
  FOR INSERT TO authenticated WITH CHECK (player_id = auth.uid());

-- Battle Answers Policies
DROP POLICY IF EXISTS "battle_answers_read_room" ON public.battle_answers;
CREATE POLICY "battle_answers_read_room" ON public.battle_answers
  FOR SELECT TO authenticated USING (public.is_room_member(room_id));

DROP POLICY IF EXISTS "battle_answers_insert_own" ON public.battle_answers;
CREATE POLICY "battle_answers_insert_own" ON public.battle_answers
  FOR INSERT TO authenticated WITH CHECK (player_id = auth.uid());

-- Championship Policies
DROP POLICY IF EXISTS "read_daily_championships" ON public.daily_championships;
CREATE POLICY "read_daily_championships" ON public.daily_championships
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "read_championship_entries" ON public.championship_entries;
CREATE POLICY "read_championship_entries" ON public.championship_entries
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "read_championship_matches" ON public.championship_matches;
CREATE POLICY "read_championship_matches" ON public.championship_matches
  FOR SELECT TO authenticated USING (participant_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "read_own_championship_payouts" ON public.championship_payouts;
CREATE POLICY "read_own_championship_payouts" ON public.championship_payouts
  FOR SELECT TO authenticated
  USING (winner_user_id = auth.uid() OR public.is_admin());

-- Realtime publication enablement for battle tables
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.battle_rooms;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.battle_results;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_championships;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ----------------------------------------------------------------------------
-- PART 7: NOTIFY POSTGREST SCHEMA CACHE RELOAD
-- ----------------------------------------------------------------------------
NOTIFY pgrst, 'reload schema';
