-- ============================================================
-- Migration: room_members table + topic-scoped Realtime RLS
-- Timestamp: 20260715080000
-- ============================================================

-- 1. Create room_members table
-- Tracks which users belong to which rooms (battle rooms, live class rooms, etc.)
CREATE TABLE IF NOT EXISTS public.room_members (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id    UUID NOT NULL REFERENCES public.battle_rooms(id) ON DELETE CASCADE,
    user_id    UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    joined_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT room_members_unique UNIQUE (room_id, user_id)
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_room_members_room_id ON public.room_members(room_id);
CREATE INDEX IF NOT EXISTS idx_room_members_user_id ON public.room_members(user_id);

-- 3. Enable RLS on room_members
ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;

-- 4. RLS policies for room_members
-- Users can view members of rooms they belong to
DROP POLICY IF EXISTS "room_members_select_own" ON public.room_members;
CREATE POLICY "room_members_select_own"
ON public.room_members
FOR SELECT
TO authenticated
USING (
    user_id = auth.uid()
    OR EXISTS (
        SELECT 1 FROM public.room_members rm2
        WHERE rm2.room_id = room_members.room_id
          AND rm2.user_id = auth.uid()
    )
);

-- Users can insert themselves into a room
DROP POLICY IF EXISTS "room_members_insert_self" ON public.room_members;
CREATE POLICY "room_members_insert_self"
ON public.room_members
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can remove themselves from a room
DROP POLICY IF EXISTS "room_members_delete_self" ON public.room_members;
CREATE POLICY "room_members_delete_self"
ON public.room_members
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- ============================================================
-- 5. Helper function: check if current user is a member of a room
--    Used by the Realtime RLS policy below.
--    Checks BOTH room_members table AND battle_rooms creator/opponent
--    so existing battle rooms work without needing a backfill.
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_room_member(p_room_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        -- Explicit membership row
        SELECT 1 FROM public.room_members rm
        WHERE rm.room_id = p_room_id
          AND rm.user_id = auth.uid()
    )
    OR EXISTS (
        -- Battle room creator or opponent (legacy / direct model)
        SELECT 1 FROM public.battle_rooms br
        WHERE br.id = p_room_id
          AND (br.creator_id = auth.uid() OR br.opponent_id = auth.uid())
    );
$$;

-- ============================================================
-- 6. Realtime Authorization: topic-scoped RLS on realtime.messages
--
--    Channel topic format: room:<room_uuid>:messages
--    split_part(topic, ':', 2) extracts the room UUID.
--
--    This replaces the broad "authenticated can receive broadcasts"
--    policy with a membership-scoped one.
-- ============================================================

-- Drop the previous broad policy if it exists
DROP POLICY IF EXISTS "authenticated can receive broadcasts" ON realtime.messages;

-- Drop this policy if it already exists (idempotency)
DROP POLICY IF EXISTS "room members can receive broadcasts" ON realtime.messages;

CREATE POLICY "room members can receive broadcasts"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
    -- Allow non-room topics (e.g. presence, system channels) to pass through
    realtime.topic() NOT LIKE 'room:%:messages'
    OR public.is_room_member(
        split_part(realtime.topic(), ':', 2)::UUID
    )
);
