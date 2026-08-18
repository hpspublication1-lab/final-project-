-- ============================================================
-- Real Multiplayer Battle Arena
-- Timestamp: 20260721020000
--
-- Prior to this migration, matchmaking_queue / battle_rooms /
-- room_members / battle_results existed but nothing ever actually
-- created a battle_rooms row or synced two real players — Match
-- Lobby only flipped queue rows to 'matched' (never even setting
-- matched_room_id) and Battle Arena independently faked an opponent
-- client-side. This migration adds the atomic server-side functions
-- needed to make matches, private rooms, and results real.
-- ============================================================

-- 1. Shared question set per room so both players see identical
--    questions in identical order.
ALTER TABLE public.battle_rooms
  ADD COLUMN IF NOT EXISTS question_ids UUID[] DEFAULT '{}';

-- 2. Helper: pick N random active questions, optionally filtered by subject
CREATE OR REPLACE FUNCTION public.pick_battle_questions(
  p_subject_filter TEXT DEFAULT 'mixed',
  p_count INTEGER DEFAULT 10
)
RETURNS UUID[]
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(ARRAY_AGG(id), ARRAY[]::UUID[]) FROM (
    SELECT id FROM public.questions
    WHERE is_active = true
      AND (
        p_subject_filter IS NULL
        OR p_subject_filter = 'mixed'
        OR subject_id = (SELECT id FROM public.subjects WHERE name::TEXT = p_subject_filter)
      )
    ORDER BY random()
    LIMIT p_count
  ) q;
$$;

GRANT EXECUTE ON FUNCTION public.pick_battle_questions(TEXT, INTEGER) TO authenticated;

-- ============================================================
-- 3. Atomic matchmaking
--
--    SECURITY DEFINER is required (not just convenient): matching two
--    players necessarily writes to the OTHER player's queue row and
--    creates room_members rows for both players. The per-user RLS on
--    matchmaking_queue ("player_id = auth.uid()") and room_members
--    ("user_id = auth.uid()") correctly forbid exactly that from a
--    plain client call — which is *why* the old client-side matching
--    code silently only ever updated the caller's own row and could
--    never actually create a room.
--
--    FOR UPDATE SKIP LOCKED on the candidate lookup means two players
--    calling this at the same instant can never both grab the same
--    opponent row and create duplicate rooms.
-- ============================================================
CREATE OR REPLACE FUNCTION public.find_or_create_battle_match(
  p_queue_mode TEXT,
  p_subject_filter TEXT DEFAULT 'mixed'
)
RETURNS TABLE (queue_id UUID, room_id UUID, matched BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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

  -- Clear any stale 'searching' rows left over from an abandoned previous attempt
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

GRANT EXECUTE ON FUNCTION public.find_or_create_battle_match(TEXT, TEXT) TO authenticated;

-- ============================================================
-- 4. Private rooms (create + join by code)
--
--    Creating is fine as a plain client insert under existing RLS
--    (WITH CHECK creator_id = auth.uid()), but *joining* is not: the
--    joiner is by definition not yet creator_id or opponent_id on the
--    row they need to update, so the existing
--    "creator_id = auth.uid() OR opponent_id = auth.uid()" USING
--    clause blocks it. Both are wrapped in RPCs for symmetry and so
--    question selection lives in one place.
-- ============================================================
CREATE OR REPLACE FUNCTION public.create_private_battle_room(
  p_subject_filter TEXT DEFAULT 'mixed',
  p_count INTEGER DEFAULT 10
)
RETURNS TABLE (room_id UUID, room_code TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_my_id UUID := auth.uid();
  v_room_id UUID;
  v_room_code TEXT;
  v_question_ids UUID[];
  v_subject_id UUID;
  v_count INTEGER := GREATEST(1, LEAST(COALESCE(p_count, 10), 50));
BEGIN
  IF v_my_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
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

  INSERT INTO public.room_members (room_id, user_id) VALUES (v_room_id, v_my_id)
  ON CONFLICT DO NOTHING;

  RETURN QUERY SELECT v_room_id, v_room_code;
END;
$$;

CREATE OR REPLACE FUNCTION public.join_private_battle_room(p_room_code TEXT)
RETURNS TABLE (room_id UUID, success BOOLEAN, error_message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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

GRANT EXECUTE ON FUNCTION public.create_private_battle_room(TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_private_battle_room(TEXT) TO authenticated;

-- ============================================================
-- 5. Submit a battle result
--
--    Whichever player's submission is the SECOND to arrive for a
--    given room computes ELO for both players atomically. The
--    `FOR UPDATE` lock on the room row serializes two near-
--    simultaneous submissions so this can never double-fire, race,
--    or leave both calls thinking "opponent hasn't submitted yet".
-- ============================================================
CREATE OR REPLACE FUNCTION public.submit_battle_result(
  p_room_id UUID,
  p_score NUMERIC,
  p_correct_answers INTEGER,
  p_incorrect_answers INTEGER,
  p_accuracy NUMERIC,
  p_time_taken_seconds INTEGER
)
RETURNS TABLE (rating_change INTEGER, new_rating INTEGER, opponent_submitted BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
    -- Solo room (private room started with nobody else) — nothing to reconcile
    RETURN QUERY SELECT 0, (SELECT battle_rating FROM public.user_profiles WHERE id = v_my_id), false;
    RETURN;
  END IF;

  SELECT * INTO v_other_result FROM public.battle_results
    WHERE room_id = p_room_id AND player_id = v_other_id;

  IF v_other_result.id IS NULL THEN
    RETURN QUERY SELECT 0, (SELECT battle_rating FROM public.user_profiles WHERE id = v_my_id), false;
    RETURN;
  END IF;

  IF v_room.status = 'completed' THEN
    SELECT rating_change INTO v_my_delta FROM public.battle_results
      WHERE room_id = p_room_id AND player_id = v_my_id;
    RETURN QUERY SELECT v_my_delta, (SELECT battle_rating FROM public.user_profiles WHERE id = v_my_id), true;
    RETURN;
  END IF;

  SELECT battle_rating INTO v_my_rating FROM public.user_profiles WHERE id = v_my_id;
  SELECT battle_rating INTO v_other_rating FROM public.user_profiles WHERE id = v_other_id;
  v_my_rating := COALESCE(v_my_rating, 1000);
  v_other_rating := COALESCE(v_other_rating, 1000);

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
    battle_rating = GREATEST(0, battle_rating + v_my_delta),
    total_points = total_points + GREATEST(0, ROUND(v_my_result.score))
    WHERE id = v_my_id;
  UPDATE public.user_profiles SET
    battle_rating = GREATEST(0, battle_rating + v_other_delta),
    total_points = total_points + GREATEST(0, ROUND(v_other_result.score))
    WHERE id = v_other_id;

  UPDATE public.battle_rooms SET status = 'completed', completed_at = now() WHERE id = p_room_id;

  RETURN QUERY SELECT v_my_delta, (v_my_rating + v_my_delta), true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_battle_result(UUID, NUMERIC, INTEGER, INTEGER, NUMERIC, INTEGER) TO authenticated;

-- ============================================================
-- 6. Per-question answer log
--
--    battle_results only stores aggregate score/accuracy — with
--    nothing else, the post-match "Question Replay" view has no real
--    data to show. This table logs each answer as it's submitted so
--    that view (and any future review/analytics feature) can show
--    exactly what happened question-by-question, for both players.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.battle_answers (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id             UUID NOT NULL REFERENCES public.battle_rooms(id) ON DELETE CASCADE,
  player_id           UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  question_id         UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  question_index      INTEGER NOT NULL,
  selected_option     TEXT CHECK (selected_option IN ('a', 'b', 'c', 'd')),
  is_correct          BOOLEAN NOT NULL DEFAULT false,
  time_taken_seconds  INTEGER,
  created_at          TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (room_id, player_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_battle_answers_room_id ON public.battle_answers(room_id);
CREATE INDEX IF NOT EXISTS idx_battle_answers_player_id ON public.battle_answers(player_id);

ALTER TABLE public.battle_answers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "players_insert_own_battle_answers" ON public.battle_answers;
CREATE POLICY "players_insert_own_battle_answers"
ON public.battle_answers FOR INSERT TO authenticated
WITH CHECK (player_id = auth.uid());

-- Both participants in a room can review all answers for it (reuses the
-- is_room_member() helper already defined for the chat/typing Realtime RLS).
DROP POLICY IF EXISTS "room_members_read_battle_answers" ON public.battle_answers;
CREATE POLICY "room_members_read_battle_answers"
ON public.battle_answers FOR SELECT TO authenticated
USING (player_id = auth.uid() OR public.is_room_member(room_id));

-- ============================================================
-- 7. Make sure the tables this feature subscribes to via
--    postgres_changes are actually in the realtime publication.
--    (matchmaking_queue was presumably already added since Match
--    Lobby already relied on it — the DO block below is a harmless
--    no-op if so. battle_rooms, battle_results and battle_answers are
--    newly subscribed-to / read by this feature.)
-- ============================================================
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.battle_rooms;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.battle_results;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.matchmaking_queue;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.battle_answers;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;
