-- ============================================================
-- Migration: security hardening
-- Timestamp: 20260721090000
-- ============================================================
-- 1. Scope battle_results / battle_rooms reads to participants.
-- 2. Lock search_path on every SECURITY DEFINER function in public.
-- ============================================================

-- ── 1a. battle_results: was FOR SELECT USING (true) — ANY signed-in
--        user could read EVERY player's scores/accuracy. Restrict to
--        the player themselves or a member of that battle room (so the
--        post-match summary can still show both players' results).
DROP POLICY IF EXISTS "auth_read_battle_results" ON public.battle_results;
DROP POLICY IF EXISTS "participants_read_battle_results" ON public.battle_results;
CREATE POLICY "participants_read_battle_results"
ON public.battle_results FOR SELECT TO authenticated
USING (player_id = auth.uid() OR public.is_room_member(room_id));

-- ── 1b. battle_rooms: was FOR SELECT USING (true) — ANY signed-in user
--        could enumerate every room, including private room_codes (which
--        are the only thing protecting a private match). Join-by-code and
--        matchmaking both go through SECURITY DEFINER RPCs that bypass
--        RLS, so the client only ever needs to read rooms it already
--        belongs to.
DROP POLICY IF EXISTS "auth_read_battle_rooms" ON public.battle_rooms;
DROP POLICY IF EXISTS "participants_read_battle_rooms" ON public.battle_rooms;
CREATE POLICY "participants_read_battle_rooms"
ON public.battle_rooms FOR SELECT TO authenticated
USING (
  creator_id = auth.uid()
  OR opponent_id = auth.uid()
  OR public.is_room_member(id)
);

-- ── 2. Lock down SECURITY DEFINER functions.
--       A SECURITY DEFINER function with a mutable search_path can be
--       hijacked (an attacker creates a same-named object in a schema
--       earlier on the search_path). Pinning search_path = public on all
--       of them closes that class of privilege escalation and clears the
--       corresponding Supabase security-advisor warnings. Idempotent.
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.prosecdef = true
      AND n.nspname = 'public'
  LOOP
    EXECUTE format('ALTER FUNCTION public.%I(%s) SET search_path = public', r.proname, r.args);
  END LOOP;
END $$;
