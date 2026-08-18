-- ============================================================
-- Migration: messages table + broadcast trigger + presence RLS
-- Timestamp: 20260715100000
-- ============================================================

-- 1. Create messages table
-- Stores chat messages for both battle rooms and live class rooms.
-- room_id is a TEXT so it can hold either a battle_room UUID or a live_class id string.
CREATE TABLE IF NOT EXISTS public.messages (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id    TEXT NOT NULL,
    user_id    UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    body       TEXT NOT NULL,
    author     TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_messages_room_id ON public.messages(room_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON public.messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);

-- 3. Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 4. RLS policies for messages
-- Authenticated users can read messages (topic-level auth handled by Realtime RLS)
DROP POLICY IF EXISTS "messages_select_authenticated" ON public.messages;
CREATE POLICY "messages_select_authenticated"
ON public.messages
FOR SELECT
TO authenticated
USING (true);

-- Users can insert their own messages
DROP POLICY IF EXISTS "messages_insert_own" ON public.messages;
CREATE POLICY "messages_insert_own"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 5. Trigger function: broadcast message changes via Realtime
--    Calls realtime.broadcast_changes so DB inserts auto-broadcast
--    to subscribers on topic room:<room_id>:messages
-- ============================================================
CREATE OR REPLACE FUNCTION public.broadcast_message_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM realtime.broadcast_changes(
            'room:' || NEW.room_id || ':messages',  -- topic
            TG_OP,                                   -- event (INSERT)
            TG_OP,                                   -- event alias
            TG_TABLE_NAME,                           -- table
            TG_TABLE_SCHEMA,                         -- schema
            NEW,                                     -- new record
            NULL                                     -- old record
        );
    END IF;
    RETURN NEW;
END;
$$;

-- 6. Attach trigger to messages table
DROP TRIGGER IF EXISTS on_message_insert ON public.messages;
CREATE TRIGGER on_message_insert
    AFTER INSERT ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.broadcast_message_changes();

-- ============================================================
-- 7. Realtime Authorization: allow presence channels for typing
--    Topic format: room:<room_id>:typing
--    These are presence channels — allow all authenticated users
--    who are members of the room to track/receive presence.
-- ============================================================

-- Allow authenticated users to receive presence on typing channels
-- (presence channels use realtime.messages with type='presence')
DROP POLICY IF EXISTS "room members can receive presence" ON realtime.messages;
CREATE POLICY "room members can receive presence"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
    -- Allow typing presence topics for room members
    (realtime.topic() LIKE 'room:%:typing'
     AND public.is_room_member(
         split_part(realtime.topic(), ':', 2)::UUID
     ))
    -- Allow non-room topics to pass through unchanged
    OR realtime.topic() NOT LIKE 'room:%:%'
);
