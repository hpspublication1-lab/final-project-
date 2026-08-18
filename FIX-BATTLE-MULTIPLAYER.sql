-- ============================================================
-- 🚀 MASTER BATTLE ARENA MULTIPLAYER SETUP FOR SUPABASE
-- Run this complete script in Supabase Dashboard -> SQL Editor
-- ============================================================

-- ------------------------------------------------------------
-- STEP 1: FORCE ALL COLUMNS TO EXIST ON EXISTING TABLES
-- ------------------------------------------------------------

-- 1.1 Ensure questions columns
ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 1.2 Create battle_rooms table if missing
CREATE TABLE IF NOT EXISTS public.battle_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

-- 1.3 Add ALL required columns to battle_rooms (safe for existing tables)
ALTER TABLE public.battle_rooms
  ADD COLUMN IF NOT EXISTS room_code TEXT,
  ADD COLUMN IF NOT EXISTS creator_id UUID,
  ADD COLUMN IF NOT EXISTS opponent_id UUID,
  ADD COLUMN IF NOT EXISTS subject_id UUID,
  ADD COLUMN IF NOT EXISTS chapter_id UUID,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'waiting',
  ADD COLUMN IF NOT EXISTS question_count INTEGER DEFAULT 10,
  ADD COLUMN IF NOT EXISTS time_limit_seconds INTEGER DEFAULT 300,
  ADD COLUMN IF NOT EXISTS question_ids UUID[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

-- 1.4 Create room_members table & columns
CREATE TABLE IF NOT EXISTS public.room_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);
ALTER TABLE public.room_members
  ADD COLUMN IF NOT EXISTS room_id UUID,
  ADD COLUMN IF NOT EXISTS user_id UUID,
  ADD COLUMN IF NOT EXISTS joined_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

-- 1.5 Create matchmaking_queue table & columns
CREATE TABLE IF NOT EXISTS public.matchmaking_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);
ALTER TABLE public.matchmaking_queue
  ADD COLUMN IF NOT EXISTS player_id UUID,
  ADD COLUMN IF NOT EXISTS queue_mode TEXT DEFAULT 'ranked',
  ADD COLUMN IF NOT EXISTS player_rating INTEGER DEFAULT 1000,
  ADD COLUMN IF NOT EXISTS subject_filter TEXT DEFAULT 'mixed',
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'searching',
  ADD COLUMN IF NOT EXISTS matched_room_id UUID,
  ADD COLUMN IF NOT EXISTS matched_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS joined_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

-- 1.6 Create battle_results table & columns
CREATE TABLE IF NOT EXISTS public.battle_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);
ALTER TABLE public.battle_results
  ADD COLUMN IF NOT EXISTS room_id UUID,
  ADD COLUMN IF NOT EXISTS player_id UUID,
  ADD COLUMN IF NOT EXISTS score NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS correct_answers INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS incorrect_answers INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS accuracy NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rating_change INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_winner BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS time_taken_seconds INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

-- 1.7 Create battle_answers table & columns
CREATE TABLE IF NOT EXISTS public.battle_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);
ALTER TABLE public.battle_answers
  ADD COLUMN IF NOT EXISTS room_id UUID,
  ADD COLUMN IF NOT EXISTS player_id UUID,
  ADD COLUMN IF NOT EXISTS question_id UUID,
  ADD COLUMN IF NOT EXISTS question_index INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS selected_option TEXT,
  ADD COLUMN IF NOT EXISTS is_correct BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS time_taken_seconds INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

-- ------------------------------------------------------------
-- STEP 2: HELPER FUNCTIONS & RPC CREATION
-- ------------------------------------------------------------

-- Helper: Check room membership for Realtime RLS
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

-- Helper: Pick random active questions
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

-- Function: Atomic matchmaking
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
      time_limit_seconds, question_ids, started_at
    ) VALUES (
      v_room_code, v_opponent.player_id, v_my_id, 'active',
      GREATEST(COALESCE(array_length(v_question_ids, 1), 0), 1),
      300, v_question_ids, now()
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

-- Function: Create Private Battle Room
CREATE OR REPLACE FUNCTION public.create_private_battle_room(
  p_subject_filter TEXT DEFAULT 'mixed',
  p_count INTEGER DEFAULT 10
)
RETURNS TABLE (room_id UUID, room_code TEXT)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_my_id UUID := auth.uid();
  v_room_id UUID;
  v_room_code TEXT;
  v_question_ids UUID[];
  v_subject_id UUID;
  v_count INTEGER := GREATEST(1, LEAST(COALESCE(p_count, 10), 50));
BEGIN
  IF v_my_id IS NULL THEN
    v_my_id := '00000000-0000-0000-0000-000000000000'::UUID;
  END IF;

  IF p_subject_filter IS NOT NULL AND p_subject_filter != 'mixed' THEN
    SELECT id INTO v_subject_id FROM public.subjects WHERE name::TEXT = p_subject_filter;
  END IF;

  v_question_ids := public.pick_battle_questions(p_subject_filter, v_count);
  v_room_code := UPPER(SUBSTRING(MD5(random()::TEXT || clock_timestamp()::TEXT) FROM 1 FOR 6));

  INSERT INTO public.battle_rooms (
    room_code, subject_id, creator_id, status, question_count, time_limit_seconds, question_ids
  ) VALUES (
    v_room_code, v_subject_id, v_my_id, 'waiting',
    GREATEST(COALESCE(array_length(v_question_ids, 1), 0), 1), 300, v_question_ids
  )
  RETURNING id INTO v_room_id;

  IF v_my_id != '00000000-0000-0000-0000-000000000000'::UUID THEN
    INSERT INTO public.room_members (room_id, user_id) VALUES (v_room_id, v_my_id)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN QUERY SELECT v_room_id, v_room_code;
END;
$$;

-- Function: Join Private Battle Room
CREATE OR REPLACE FUNCTION public.join_private_battle_room(p_room_code TEXT)
RETURNS TABLE (room_id UUID, success BOOLEAN, error_message TEXT)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_my_id UUID := auth.uid();
  v_room RECORD;
BEGIN
  IF v_my_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_room FROM public.battle_rooms
  WHERE room_code = UPPER(p_room_code)
  FOR UPDATE;

  IF v_room.id IS NULL THEN
    RETURN QUERY SELECT NULL::UUID, false, 'Room not found. Check the code and try again.';
    RETURN;
  END IF;

  IF v_room.creator_id = v_my_id THEN
    RETURN QUERY SELECT NULL::UUID, false, 'You can''t join your own room.';
    RETURN;
  END IF;

  IF v_room.status != 'waiting' OR v_room.opponent_id IS NOT NULL THEN
    RETURN QUERY SELECT NULL::UUID, false, 'This room is no longer accepting players.';
    RETURN;
  END IF;

  UPDATE public.battle_rooms
    SET opponent_id = v_my_id, status = 'active', started_at = now()
    WHERE id = v_room.id;

  INSERT INTO public.room_members (room_id, user_id) VALUES (v_room.id, v_my_id)
  ON CONFLICT DO NOTHING;

  RETURN QUERY SELECT v_room.id, true, NULL::TEXT;
END;
$$;

-- Function: Submit Battle Result
CREATE OR REPLACE FUNCTION public.submit_battle_result(
  p_room_id UUID,
  p_score NUMERIC,
  p_correct_answers INTEGER,
  p_incorrect_answers INTEGER,
  p_accuracy NUMERIC,
  p_time_taken_seconds INTEGER
)
RETURNS TABLE (rating_change INTEGER, new_rating INTEGER, opponent_submitted BOOLEAN)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_my_id UUID := auth.uid();
  v_room RECORD;
  v_other_id UUID;
  v_my_result RECORD;
  v_other_result RECORD;
  v_my_rating INTEGER;
  v_other_rating INTEGER;
  v_expected_my NUMERIC;
  v_expected_other NUMERIC;
  v_my_outcome NUMERIC;
  v_other_outcome NUMERIC;
  v_my_delta INTEGER;
  v_other_delta INTEGER;
  K CONSTANT INTEGER := 32;
BEGIN
  IF v_my_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_room FROM public.battle_rooms WHERE id = p_room_id FOR UPDATE;

  IF v_room.id IS NULL THEN
    RAISE EXCEPTION 'Room not found';
  END IF;
  IF v_my_id NOT IN (v_room.creator_id, v_room.opponent_id) THEN
    RAISE EXCEPTION 'Not a participant in this room';
  END IF;

  v_other_id := CASE WHEN v_room.creator_id = v_my_id THEN v_room.opponent_id ELSE v_room.creator_id END;

  INSERT INTO public.battle_results (
    room_id, player_id, score, correct_answers, incorrect_answers, accuracy, time_taken_seconds
  ) VALUES (
    p_room_id, v_my_id, p_score, p_correct_answers, p_incorrect_answers, p_accuracy, p_time_taken_seconds
  )
  ON CONFLICT (room_id, player_id) DO UPDATE SET
    score = EXCLUDED.score,
    correct_answers = EXCLUDED.correct_answers,
    incorrect_answers = EXCLUDED.incorrect_answers,
    accuracy = EXCLUDED.accuracy,
    time_taken_seconds = EXCLUDED.time_taken_seconds
  RETURNING * INTO v_my_result;

  IF v_other_id IS NULL THEN
    RETURN QUERY SELECT 0, (SELECT COALESCE(battle_rating, 1000) FROM public.user_profiles WHERE id = v_my_id), false;
    RETURN;
  END IF;

  SELECT * INTO v_other_result FROM public.battle_results
    WHERE room_id = p_room_id AND player_id = v_other_id;

  IF v_other_result.id IS NULL THEN
    RETURN QUERY SELECT 0, (SELECT COALESCE(battle_rating, 1000) FROM public.user_profiles WHERE id = v_my_id), false;
    RETURN;
  END IF;

  IF v_room.status = 'completed' THEN
    SELECT rating_change INTO v_my_delta FROM public.battle_results
      WHERE room_id = p_room_id AND player_id = v_my_id;
    RETURN QUERY SELECT v_my_delta, (SELECT COALESCE(battle_rating, 1000) FROM public.user_profiles WHERE id = v_my_id), true;
    RETURN;
  END IF;

  SELECT COALESCE(battle_rating, 1000) INTO v_my_rating FROM public.user_profiles WHERE id = v_my_id;
  SELECT COALESCE(battle_rating, 1000) INTO v_other_rating FROM public.user_profiles WHERE id = v_other_id;

  v_expected_my := 1.0 / (1.0 + POWER(10, (v_other_rating - v_my_rating) / 400.0));
  v_expected_other := 1.0 / (1.0 + POWER(10, (v_my_rating - v_other_rating) / 400.0));

  IF v_my_result.score > v_other_result.score THEN
    v_my_outcome := 1; v_other_outcome := 0;
  ELSIF v_my_result.score < v_other_result.score THEN
    v_my_outcome := 0; v_other_outcome := 1;
  ELSE
    v_my_outcome := 0.5; v_other_outcome := 0.5;
  END IF;

  v_my_delta := ROUND(K * (v_my_outcome - v_expected_my));
  v_other_delta := ROUND(K * (v_other_outcome - v_expected_other));

  UPDATE public.battle_results SET rating_change = v_my_delta, is_winner = (v_my_outcome = 1)
    WHERE room_id = p_room_id AND player_id = v_my_id;
  UPDATE public.battle_results SET rating_change = v_other_delta, is_winner = (v_other_outcome = 1)
    WHERE room_id = p_room_id AND player_id = v_other_id;

  UPDATE public.user_profiles SET
    battle_rating = GREATEST(0, COALESCE(battle_rating, 1000) + v_my_delta),
    total_points = COALESCE(total_points, 0) + GREATEST(0, ROUND(v_my_result.score))
    WHERE id = v_my_id;
  UPDATE public.user_profiles SET
    battle_rating = GREATEST(0, COALESCE(battle_rating, 1000) + v_other_delta),
    total_points = COALESCE(total_points, 0) + GREATEST(0, ROUND(v_other_result.score))
    WHERE id = v_other_id;

  UPDATE public.battle_rooms SET status = 'completed', completed_at = now() WHERE id = p_room_id;

  RETURN QUERY SELECT v_my_delta, (v_my_rating + v_my_delta), true;
END;
$$;

-- ------------------------------------------------------------
-- STEP 3: PERMISSIONS & ROW LEVEL SECURITY (RLS)
-- ------------------------------------------------------------

ALTER TABLE public.battle_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matchmaking_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.battle_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.battle_answers ENABLE ROW LEVEL SECURITY;

-- Policies for battle_rooms
DROP POLICY IF EXISTS "participants_read_battle_rooms" ON public.battle_rooms;
CREATE POLICY "participants_read_battle_rooms" ON public.battle_rooms FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "users_create_battle_rooms" ON public.battle_rooms;
CREATE POLICY "users_create_battle_rooms" ON public.battle_rooms FOR INSERT TO authenticated, anon WITH CHECK (true);

DROP POLICY IF EXISTS "users_update_battle_rooms" ON public.battle_rooms;
CREATE POLICY "users_update_battle_rooms" ON public.battle_rooms FOR UPDATE TO authenticated, anon USING (true);

-- Policies for room_members
DROP POLICY IF EXISTS "auth_read_room_members" ON public.room_members;
CREATE POLICY "auth_read_room_members" ON public.room_members FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "auth_insert_room_members" ON public.room_members;
CREATE POLICY "auth_insert_room_members" ON public.room_members FOR INSERT TO authenticated, anon WITH CHECK (true);

-- Policies for matchmaking_queue
DROP POLICY IF EXISTS "users_manage_own_queue" ON public.matchmaking_queue;
CREATE POLICY "users_manage_own_queue" ON public.matchmaking_queue FOR ALL TO authenticated, anon USING (true);

-- Policies for battle_answers
DROP POLICY IF EXISTS "players_insert_own_battle_answers" ON public.battle_answers;
CREATE POLICY "players_insert_own_battle_answers" ON public.battle_answers FOR INSERT TO authenticated, anon WITH CHECK (true);

DROP POLICY IF EXISTS "room_members_read_battle_answers" ON public.battle_answers;
CREATE POLICY "room_members_read_battle_answers" ON public.battle_answers FOR SELECT TO authenticated, anon USING (true);

-- Grant Execution Permissions
GRANT EXECUTE ON FUNCTION public.is_room_member(UUID) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.pick_battle_questions(TEXT, INTEGER) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.find_or_create_battle_match(TEXT, TEXT) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.create_private_battle_room(TEXT, INTEGER) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.join_private_battle_room(TEXT) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.submit_battle_result(UUID, NUMERIC, INTEGER, INTEGER, NUMERIC, INTEGER) TO authenticated, anon, service_role;

-- Realtime Publication for Live Multiplayer
DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.battle_rooms; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.battle_results; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.matchmaking_queue; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.battle_answers; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- ------------------------------------------------------------
-- STEP 4: RELOAD SCHEMA CACHE
-- ------------------------------------------------------------
NOTIFY pgrst, 'reload schema';
