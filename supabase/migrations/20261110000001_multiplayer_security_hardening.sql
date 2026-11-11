-- ==============================================================================
-- SAMYAK MULTIPLAYER ARCHITECTURE — SECURITY & PERSISTENCE HARDENING MIGRATION
-- Migration: 20261110000001_multiplayer_security_hardening.sql
-- 
-- Objectives:
-- 1. Add idempotency tracking and node auditing columns to public.battle_results.
-- 2. Prevent replay attacks via partial unique index on idempotency_hash.
-- 3. Restrict RLS policies on battle_results, battle_answers, and battle_rooms.
-- 4. Eliminate client authority over game outcomes and question keys.
-- ==============================================================================

-- 1. SCHEMA INTEGRITY PRE-CHECK
DO $$
BEGIN
  IF to_regclass('public.battle_results') IS NULL THEN
    RAISE EXCEPTION 'Table public.battle_results does not exist. Ensure prior migrations have run.';
  END IF;
  IF to_regclass('public.battle_rooms') IS NULL THEN
    RAISE EXCEPTION 'Table public.battle_rooms does not exist. Ensure prior migrations have run.';
  END IF;
END $$;

BEGIN;

-- 2. ADD COLUMNS FOR DETERMINISTIC IDEMPOTENCY & CLUSTER TELEMETRY
ALTER TABLE public.battle_results
  ADD COLUMN IF NOT EXISTS idempotency_hash TEXT,
  ADD COLUMN IF NOT EXISTS server_node_id TEXT,
  ADD COLUMN IF NOT EXISTS engine_version TEXT,
  ADD COLUMN IF NOT EXISTS finalized_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS telemetry_audit JSONB DEFAULT '{}'::jsonb;

-- 3. UNIQUE INDEX FOR IDEMPOTENCY PROTECTION (DEDUPLICATION & REPLAY REJECTION)
CREATE UNIQUE INDEX IF NOT EXISTS uq_battle_results_idempotency_hash
  ON public.battle_results (idempotency_hash)
  WHERE idempotency_hash IS NOT NULL;

-- 4. HARDEN RLS: REMOVE DIRECT CLIENT INSERT/UPDATE AUTHORITY OVER BATTLE RESULTS
-- Only authoritative server processes (service-role or verified SECURITY DEFINER RPCs)
-- may write final scores and rating deltas.
DROP POLICY IF EXISTS "users_manage_own_battle_results" ON public.battle_results;
DROP POLICY IF EXISTS "users_read_own_battle_results" ON public.battle_results;

CREATE POLICY "users_read_own_battle_results"
  ON public.battle_results FOR SELECT
  TO authenticated
  USING (
    player_id = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM public.battle_rooms r
      WHERE r.id = battle_results.room_id
        AND (r.creator_id = auth.uid() OR r.opponent_id = auth.uid())
    )
  );

-- Service-role full access policy
DROP POLICY IF EXISTS "service_role_all_battle_results" ON public.battle_results;
CREATE POLICY "service_role_all_battle_results"
  ON public.battle_results FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 5. HARDEN BATTLE_ANSWERS RLS
-- Clients can no longer directly insert client-verified is_correct answers.
DROP POLICY IF EXISTS "players_insert_own_battle_answers" ON public.battle_answers;
DROP POLICY IF EXISTS "room_members_read_battle_answers" ON public.battle_answers;

CREATE POLICY "room_members_read_battle_answers"
  ON public.battle_answers FOR SELECT
  TO authenticated
  USING (
    player_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.battle_rooms r
      WHERE r.id = battle_answers.room_id
        AND (r.creator_id = auth.uid() OR r.opponent_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "service_role_all_battle_answers" ON public.battle_answers;
CREATE POLICY "service_role_all_battle_answers"
  ON public.battle_answers FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 6. HARDEN BATTLE_ROOMS RLS (PREVENT HARVESTING OF ACTIVE ROOM CODES & QUESTIONS)
-- Replace permissive SELECT (true) with room participant & open matchmaking visibility
DROP POLICY IF EXISTS "users_read_battle_rooms" ON public.battle_rooms;
DROP POLICY IF EXISTS "participants_read_battle_rooms" ON public.battle_rooms;
CREATE POLICY "participants_read_battle_rooms"
  ON public.battle_rooms FOR SELECT
  TO authenticated
  USING (
    creator_id = auth.uid()
    OR opponent_id = auth.uid()
    OR status::text = 'waiting'
  );

-- 7. ATOMIC IDEMPOTENT RESULT LEDGER RPC
-- Authoritative procedure callable with deduplication protection
CREATE OR REPLACE FUNCTION public.record_authoritative_battle_result(
  p_room_id UUID,
  p_player_id UUID,
  p_score NUMERIC,
  p_correct_answers INTEGER,
  p_incorrect_answers INTEGER,
  p_accuracy NUMERIC,
  p_time_taken_seconds INTEGER,
  p_rating_change INTEGER,
  p_is_winner BOOLEAN,
  p_idempotency_hash TEXT,
  p_server_node_id TEXT,
  p_engine_version TEXT,
  p_telemetry_audit JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE (applied BOOLEAN, already_existed BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_existing_id UUID;
BEGIN
  -- Replay check via idempotency_hash
  IF p_idempotency_hash IS NOT NULL THEN
    SELECT id INTO v_existing_id
    FROM public.battle_results
    WHERE idempotency_hash = p_idempotency_hash;

    IF v_existing_id IS NOT NULL THEN
      RETURN QUERY SELECT false, true;
      RETURN;
    END IF;
  END IF;

  -- Upsert result atomically
  INSERT INTO public.battle_results (
    room_id,
    player_id,
    score,
    correct_answers,
    incorrect_answers,
    accuracy,
    time_taken_seconds,
    rating_change,
    is_winner,
    idempotency_hash,
    server_node_id,
    engine_version,
    finalized_at,
    telemetry_audit
  ) VALUES (
    p_room_id,
    p_player_id,
    p_score,
    p_correct_answers,
    p_incorrect_answers,
    p_accuracy,
    p_time_taken_seconds,
    p_rating_change,
    p_is_winner,
    p_idempotency_hash,
    p_server_node_id,
    p_engine_version,
    now(),
    p_telemetry_audit
  )
  ON CONFLICT (room_id, player_id) DO UPDATE SET
    score = EXCLUDED.score,
    correct_answers = EXCLUDED.correct_answers,
    incorrect_answers = EXCLUDED.incorrect_answers,
    accuracy = EXCLUDED.accuracy,
    time_taken_seconds = EXCLUDED.time_taken_seconds,
    rating_change = EXCLUDED.rating_change,
    is_winner = EXCLUDED.is_winner,
    idempotency_hash = COALESCE(EXCLUDED.idempotency_hash, public.battle_results.idempotency_hash),
    server_node_id = EXCLUDED.server_node_id,
    engine_version = EXCLUDED.engine_version,
    finalized_at = now(),
    telemetry_audit = EXCLUDED.telemetry_audit;

  RETURN QUERY SELECT true, false;
END;
$$;

-- Secure execution grants
REVOKE ALL ON FUNCTION public.record_authoritative_battle_result(UUID, UUID, NUMERIC, INTEGER, INTEGER, NUMERIC, INTEGER, INTEGER, BOOLEAN, TEXT, TEXT, TEXT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_authoritative_battle_result(UUID, UUID, NUMERIC, INTEGER, INTEGER, NUMERIC, INTEGER, INTEGER, BOOLEAN, TEXT, TEXT, TEXT, JSONB) TO service_role;

COMMIT;

-- ==============================================================================
-- ROLLBACK SCRIPT (DOCUMENTATION ONLY):
-- 
-- BEGIN;
-- DROP INDEX IF EXISTS public.uq_battle_results_idempotency_hash;
-- DROP FUNCTION IF EXISTS public.record_authoritative_battle_result(UUID, UUID, NUMERIC, INTEGER, INTEGER, NUMERIC, INTEGER, INTEGER, BOOLEAN, TEXT, TEXT, TEXT, JSONB);
-- ALTER TABLE public.battle_results
--   DROP COLUMN IF EXISTS idempotency_hash,
--   DROP COLUMN IF EXISTS server_node_id,
--   DROP COLUMN IF EXISTS engine_version,
--   DROP COLUMN IF EXISTS finalized_at,
--   DROP COLUMN IF EXISTS telemetry_audit;
-- COMMIT;
-- ==============================================================================
