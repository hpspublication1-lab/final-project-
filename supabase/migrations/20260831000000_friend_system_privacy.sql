-- ============================================================
-- SAMYAK CEE ARENA — FRIEND SYSTEM, PRIVACY & BATTLE INVITATIONS
-- Migration: 20260831000000
-- ============================================================

-- 1. USER PRIVACY SETTINGS
CREATE TABLE IF NOT EXISTS public.user_privacy_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_requests_from TEXT NOT NULL DEFAULT 'everyone' CHECK (friend_requests_from IN ('everyone', 'friends_of_friends', 'nobody')),
  battle_invites_from TEXT NOT NULL DEFAULT 'everyone' CHECK (battle_invites_from IN ('everyone', 'friends_only', 'nobody')),
  online_status_visibility TEXT NOT NULL DEFAULT 'everyone' CHECK (online_status_visibility IN ('everyone', 'friends_only', 'nobody')),
  profile_visibility TEXT NOT NULL DEFAULT 'public' CHECK (profile_visibility IN ('public', 'friends_only', 'private')),
  match_history_visibility TEXT NOT NULL DEFAULT 'public' CHECK (match_history_visibility IN ('public', 'friends_only', 'private')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_privacy_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view privacy settings" ON public.user_privacy_settings
  FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "Users can update own privacy settings" ON public.user_privacy_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own privacy settings" ON public.user_privacy_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Auto-create privacy settings on user creation
CREATE OR REPLACE FUNCTION public.handle_new_user_privacy()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_privacy_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_privacy ON auth.users;
CREATE TRIGGER on_auth_user_created_privacy
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_privacy();

-- Backfill privacy settings for existing users
INSERT INTO public.user_privacy_settings (user_id)
SELECT id FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- 2. USER BLOCKS
CREATE TABLE IF NOT EXISTS public.user_blocks (
  blocker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id)
);

ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own blocks" ON public.user_blocks
  FOR SELECT USING (auth.uid() = blocker_id OR auth.role() = 'service_role');

CREATE POLICY "Users can insert own blocks" ON public.user_blocks
  FOR INSERT WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can delete own blocks" ON public.user_blocks
  FOR DELETE USING (auth.uid() = blocker_id);

-- 3. FRIEND REQUESTS
CREATE TABLE IF NOT EXISTS public.friend_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT friend_requests_different_users CHECK (sender_id != receiver_id)
);

CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver ON public.friend_requests(receiver_id, status);
CREATE INDEX IF NOT EXISTS idx_friend_requests_sender ON public.friend_requests(sender_id, status);

ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view friend requests involving them" ON public.friend_requests
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id OR auth.role() = 'service_role');

-- 4. USER FRIENDS (ACCEPTED FRIENDSHIPS)
CREATE TABLE IF NOT EXISTS public.user_friends (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, friend_id),
  CONSTRAINT user_friends_different CHECK (user_id != friend_id)
);

ALTER TABLE public.user_friends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own friends" ON public.user_friends
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id OR auth.role() = 'service_role');

-- 5. REAL PRESENCE TRACKING
CREATE TABLE IF NOT EXISTS public.user_presence (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'online' CHECK (status IN ('online', 'away', 'in_match', 'offline')),
  current_room_id UUID,
  last_heartbeat TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view presence if privacy permits" ON public.user_presence
  FOR SELECT USING (true);

-- 6. BATTLE INVITATIONS
CREATE TABLE IF NOT EXISTS public.battle_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_filter TEXT NOT NULL DEFAULT 'mixed',
  matched_room_id UUID,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'cancelled')),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '60 seconds'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT battle_invitations_different CHECK (sender_id != receiver_id)
);

CREATE INDEX IF NOT EXISTS idx_battle_invites_receiver ON public.battle_invitations(receiver_id, status);

ALTER TABLE public.battle_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view invitations involving them" ON public.battle_invitations
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id OR auth.role() = 'service_role');

-- ============================================================
-- ATOMIC RPCS FOR FRIEND SYSTEM & INVITATIONS
-- ============================================================

-- A. Send Friend Request
CREATE OR REPLACE FUNCTION public.send_friend_request(p_receiver_id UUID)
RETURNS TABLE (request_id UUID, success BOOLEAN, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_my_id UUID := auth.uid();
  v_privacy public.user_privacy_settings%ROWTYPE;
  v_is_blocked BOOLEAN;
  v_already_friends BOOLEAN;
  v_existing_req UUID;
  v_new_id UUID;
BEGIN
  IF v_my_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF v_my_id = p_receiver_id THEN
    RETURN QUERY SELECT NULL::UUID, false, 'You cannot send a friend request to yourself';
    RETURN;
  END IF;

  -- Check if blocked in either direction
  SELECT EXISTS (
    SELECT 1 FROM public.user_blocks
    WHERE (blocker_id = v_my_id AND blocked_id = p_receiver_id)
       OR (blocker_id = p_receiver_id AND blocked_id = v_my_id)
  ) INTO v_is_blocked;

  IF v_is_blocked THEN
    RETURN QUERY SELECT NULL::UUID, false, 'Action not allowed';
    RETURN;
  END IF;

  -- Check if already friends
  SELECT EXISTS (
    SELECT 1 FROM public.user_friends
    WHERE user_id = v_my_id AND friend_id = p_receiver_id
  ) INTO v_already_friends;

  IF v_already_friends THEN
    RETURN QUERY SELECT NULL::UUID, false, 'You are already friends';
    RETURN;
  END IF;

  -- Check receiver privacy settings
  SELECT * INTO v_privacy FROM public.user_privacy_settings WHERE user_id = p_receiver_id;
  IF v_privacy.friend_requests_from = 'nobody' THEN
    RETURN QUERY SELECT NULL::UUID, false, 'This user is not accepting friend requests';
    RETURN;
  END IF;

  -- Check pending request
  SELECT id INTO v_existing_req
  FROM public.friend_requests
  WHERE (sender_id = v_my_id AND receiver_id = p_receiver_id AND status = 'pending');

  IF v_existing_req IS NOT NULL THEN
    RETURN QUERY SELECT v_existing_req, true, 'Friend request already sent';
    RETURN;
  END IF;

  INSERT INTO public.friend_requests (sender_id, receiver_id, status)
  VALUES (v_my_id, p_receiver_id, 'pending')
  RETURNING id INTO v_new_id;

  RETURN QUERY SELECT v_new_id, true, 'Friend request sent successfully';
END;
$$;

GRANT EXECUTE ON FUNCTION public.send_friend_request(UUID) TO authenticated;

-- B. Respond to Friend Request (Accept / Decline)
CREATE OR REPLACE FUNCTION public.respond_friend_request(p_request_id UUID, p_action TEXT)
RETURNS TABLE (success BOOLEAN, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_my_id UUID := auth.uid();
  v_req public.friend_requests%ROWTYPE;
BEGIN
  IF v_my_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_req FROM public.friend_requests WHERE id = p_request_id AND receiver_id = v_my_id;

  IF v_req.id IS NULL THEN
    RETURN QUERY SELECT false, 'Friend request not found';
    RETURN;
  END IF;

  IF v_req.status != 'pending' THEN
    RETURN QUERY SELECT false, 'Friend request is no longer pending';
    RETURN;
  END IF;

  IF p_action = 'accept' THEN
    UPDATE public.friend_requests SET status = 'accepted', updated_at = now() WHERE id = p_request_id;
    
    INSERT INTO public.user_friends (user_id, friend_id)
    VALUES (v_my_id, v_req.sender_id), (v_req.sender_id, v_my_id)
    ON CONFLICT DO NOTHING;

    RETURN QUERY SELECT true, 'Friend request accepted';
  ELSIF p_action = 'decline' THEN
    UPDATE public.friend_requests SET status = 'declined', updated_at = now() WHERE id = p_request_id;
    RETURN QUERY SELECT true, 'Friend request declined';
  ELSE
    RETURN QUERY SELECT false, 'Invalid action';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.respond_friend_request(UUID, TEXT) TO authenticated;

-- C. Cancel Friend Request
CREATE OR REPLACE FUNCTION public.cancel_friend_request(p_request_id UUID)
RETURNS TABLE (success BOOLEAN, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_my_id UUID := auth.uid();
BEGIN
  IF v_my_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  UPDATE public.friend_requests
    SET status = 'cancelled', updated_at = now()
    WHERE id = p_request_id AND sender_id = v_my_id AND status = 'pending';

  RETURN QUERY SELECT true, 'Friend request cancelled';
END;
$$;

GRANT EXECUTE ON FUNCTION public.cancel_friend_request(UUID) TO authenticated;

-- D. Remove Friend
CREATE OR REPLACE FUNCTION public.remove_friend(p_friend_id UUID)
RETURNS TABLE (success BOOLEAN, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_my_id UUID := auth.uid();
BEGIN
  IF v_my_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  DELETE FROM public.user_friends
  WHERE (user_id = v_my_id AND friend_id = p_friend_id)
     OR (user_id = p_friend_id AND friend_id = v_my_id);

  RETURN QUERY SELECT true, 'Friend removed';
END;
$$;

GRANT EXECUTE ON FUNCTION public.remove_friend(UUID) TO authenticated;

-- E. Block / Unblock User
CREATE OR REPLACE FUNCTION public.block_user(p_target_id UUID)
RETURNS TABLE (success BOOLEAN, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_my_id UUID := auth.uid();
BEGIN
  IF v_my_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO public.user_blocks (blocker_id, blocked_id)
  VALUES (v_my_id, p_target_id)
  ON CONFLICT DO NOTHING;

  -- Remove friendship if exists
  DELETE FROM public.user_friends
  WHERE (user_id = v_my_id AND friend_id = p_target_id)
     OR (user_id = p_target_id AND friend_id = v_my_id);

  -- Cancel pending requests & invitations
  UPDATE public.friend_requests SET status = 'cancelled', updated_at = now()
  WHERE (sender_id = v_my_id AND receiver_id = p_target_id)
     OR (sender_id = p_target_id AND receiver_id = v_my_id);

  UPDATE public.battle_invitations SET status = 'cancelled', updated_at = now()
  WHERE (sender_id = v_my_id AND receiver_id = p_target_id)
     OR (sender_id = p_target_id AND receiver_id = v_my_id);

  RETURN QUERY SELECT true, 'User blocked successfully';
END;
$$;

GRANT EXECUTE ON FUNCTION public.block_user(UUID) TO authenticated;

-- F. Send Battle Invitation
CREATE OR REPLACE FUNCTION public.send_battle_invitation(
  p_receiver_id UUID,
  p_subject_filter TEXT DEFAULT 'mixed'
)
RETURNS TABLE (invitation_id UUID, success BOOLEAN, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_my_id UUID := auth.uid();
  v_privacy public.user_privacy_settings%ROWTYPE;
  v_is_blocked BOOLEAN;
  v_is_friend BOOLEAN;
  v_rec_presence public.user_presence%ROWTYPE;
  v_new_id UUID;
BEGIN
  IF v_my_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF v_my_id = p_receiver_id THEN
    RETURN QUERY SELECT NULL::UUID, false, 'You cannot invite yourself to a battle';
    RETURN;
  END IF;

  -- Block check
  SELECT EXISTS (
    SELECT 1 FROM public.user_blocks
    WHERE (blocker_id = v_my_id AND blocked_id = p_receiver_id)
       OR (blocker_id = p_receiver_id AND blocked_id = v_my_id)
  ) INTO v_is_blocked;

  IF v_is_blocked THEN
    RETURN QUERY SELECT NULL::UUID, false, 'Action not permitted';
    RETURN;
  END IF;

  -- Friend check
  SELECT EXISTS (
    SELECT 1 FROM public.user_friends
    WHERE user_id = v_my_id AND friend_id = p_receiver_id
  ) INTO v_is_friend;

  -- Privacy check
  SELECT * INTO v_privacy FROM public.user_privacy_settings WHERE user_id = p_receiver_id;
  IF v_privacy.battle_invites_from = 'nobody' OR (v_privacy.battle_invites_from = 'friends_only' AND NOT v_is_friend) THEN
    RETURN QUERY SELECT NULL::UUID, false, 'This user is not accepting battle invitations';
    RETURN;
  END IF;

  -- Check if receiver is currently in a match
  SELECT * INTO v_rec_presence FROM public.user_presence WHERE user_id = p_receiver_id;
  IF v_rec_presence.status = 'in_match' THEN
    RETURN QUERY SELECT NULL::UUID, false, 'This player is currently in a match';
    RETURN;
  END IF;

  -- Expire previous pending invitations between these 2 users
  UPDATE public.battle_invitations
    SET status = 'expired', updated_at = now()
    WHERE sender_id = v_my_id AND receiver_id = p_receiver_id AND status = 'pending';

  INSERT INTO public.battle_invitations (sender_id, receiver_id, subject_filter, status, expires_at)
  VALUES (v_my_id, p_receiver_id, COALESCE(p_subject_filter, 'mixed'), 'pending', now() + INTERVAL '60 seconds')
  RETURNING id INTO v_new_id;

  RETURN QUERY SELECT v_new_id, true, 'Battle invitation sent';
END;
$$;

GRANT EXECUTE ON FUNCTION public.send_battle_invitation(UUID, TEXT) TO authenticated;

-- G. Respond to Battle Invitation (Accept / Decline)
CREATE OR REPLACE FUNCTION public.respond_battle_invitation(
  p_invitation_id UUID,
  p_action TEXT
)
RETURNS TABLE (room_id UUID, success BOOLEAN, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_my_id UUID := auth.uid();
  v_inv public.battle_invitations%ROWTYPE;
  v_room_id UUID;
  v_room_code TEXT;
  v_question_ids UUID[];
BEGIN
  IF v_my_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_inv FROM public.battle_invitations WHERE id = p_invitation_id AND receiver_id = v_my_id FOR UPDATE;

  IF v_inv.id IS NULL THEN
    RETURN QUERY SELECT NULL::UUID, false, 'Invitation not found';
    RETURN;
  END IF;

  IF v_inv.status != 'pending' OR v_inv.expires_at < now() THEN
    UPDATE public.battle_invitations SET status = 'expired', updated_at = now() WHERE id = p_invitation_id;
    RETURN QUERY SELECT NULL::UUID, false, 'Invitation has expired or is no longer valid';
    RETURN;
  END IF;

  IF p_action = 'accept' THEN
    -- Pick questions & create private room
    v_question_ids := public.pick_battle_questions(v_inv.subject_filter, 10);
    v_room_code := UPPER(SUBSTRING(MD5(random()::TEXT || clock_timestamp()::TEXT) FROM 1 FOR 6));

    INSERT INTO public.battle_rooms (
      room_code, creator_id, opponent_id, status, question_count, time_limit_seconds, question_ids, started_at
    ) VALUES (
      v_room_code, v_inv.sender_id, v_my_id, 'active',
      GREATEST(COALESCE(array_length(v_question_ids, 1), 0), 1), 300, v_question_ids, now()
    )
    RETURNING id INTO v_room_id;

    INSERT INTO public.room_members (room_id, user_id)
    VALUES (v_room_id, v_inv.sender_id), (v_room_id, v_my_id)
    ON CONFLICT DO NOTHING;

    UPDATE public.battle_invitations
      SET status = 'accepted', matched_room_id = v_room_id, updated_at = now()
      WHERE id = p_invitation_id;

    -- Update presence for both players to 'in_match'
    INSERT INTO public.user_presence (user_id, status, current_room_id, last_heartbeat)
    VALUES (v_inv.sender_id, 'in_match', v_room_id, now()), (v_my_id, 'in_match', v_room_id, now())
    ON CONFLICT (user_id) DO UPDATE SET status = 'in_match', current_room_id = v_room_id, last_heartbeat = now();

    RETURN QUERY SELECT v_room_id, true, 'Battle invitation accepted';
  ELSIF p_action = 'decline' THEN
    UPDATE public.battle_invitations SET status = 'declined', updated_at = now() WHERE id = p_invitation_id;
    RETURN QUERY SELECT NULL::UUID, true, 'Battle invitation declined';
  ELSE
    RETURN QUERY SELECT NULL::UUID, false, 'Invalid action';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.respond_battle_invitation(UUID, TEXT) TO authenticated;

-- H. Update Heartbeat & User Presence
CREATE OR REPLACE FUNCTION public.update_user_presence(
  p_status TEXT DEFAULT 'online',
  p_room_id UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_my_id UUID := auth.uid();
BEGIN
  IF v_my_id IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO public.user_presence (user_id, status, current_room_id, last_heartbeat)
  VALUES (v_my_id, COALESCE(p_status, 'online'), p_room_id, now())
  ON CONFLICT (user_id) DO UPDATE
    SET status = COALESCE(p_status, 'online'),
        current_room_id = p_room_id,
        last_heartbeat = now();
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_user_presence(TEXT, UUID) TO authenticated;

-- Add Publication for Realtime Broadcast on tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.friend_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.battle_invitations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.matchmaking_queue;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_presence;
