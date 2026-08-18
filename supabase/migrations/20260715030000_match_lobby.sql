-- Match Lobby: Matchmaking queue and lobby state
-- Adds matchmaking_queue table for ELO-based matchmaking

-- 1. Matchmaking queue table
CREATE TABLE IF NOT EXISTS public.matchmaking_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    queue_mode TEXT NOT NULL DEFAULT 'quick' CHECK (queue_mode IN ('quick', 'ranked')),
    player_rating INTEGER NOT NULL DEFAULT 1000,
    subject_filter TEXT DEFAULT 'mixed',
    status TEXT NOT NULL DEFAULT 'searching' CHECK (status IN ('searching', 'matched', 'cancelled')),
    matched_room_id UUID REFERENCES public.battle_rooms(id) ON DELETE SET NULL,
    joined_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    matched_at TIMESTAMPTZ
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_matchmaking_queue_player_id ON public.matchmaking_queue(player_id);
CREATE INDEX IF NOT EXISTS idx_matchmaking_queue_status ON public.matchmaking_queue(status);
CREATE INDEX IF NOT EXISTS idx_matchmaking_queue_mode ON public.matchmaking_queue(queue_mode);
CREATE INDEX IF NOT EXISTS idx_battle_rooms_status ON public.battle_rooms(status);

-- 3. Enable RLS
ALTER TABLE public.matchmaking_queue ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for matchmaking_queue
DROP POLICY IF EXISTS "players_manage_own_queue" ON public.matchmaking_queue;
CREATE POLICY "players_manage_own_queue"
ON public.matchmaking_queue
FOR ALL
TO authenticated
USING (player_id = auth.uid())
WITH CHECK (player_id = auth.uid());

DROP POLICY IF EXISTS "players_view_queue" ON public.matchmaking_queue;
CREATE POLICY "players_view_queue"
ON public.matchmaking_queue
FOR SELECT
TO authenticated
USING (true);

-- 5. RLS for battle_rooms - allow authenticated users to read all rooms
DROP POLICY IF EXISTS "users_read_battle_rooms" ON public.battle_rooms;
CREATE POLICY "users_read_battle_rooms"
ON public.battle_rooms
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "users_create_battle_rooms" ON public.battle_rooms;
CREATE POLICY "users_create_battle_rooms"
ON public.battle_rooms
FOR INSERT
TO authenticated
WITH CHECK (creator_id = auth.uid());

DROP POLICY IF EXISTS "users_update_battle_rooms" ON public.battle_rooms;
CREATE POLICY "users_update_battle_rooms"
ON public.battle_rooms
FOR UPDATE
TO authenticated
USING (creator_id = auth.uid() OR opponent_id = auth.uid());

-- 6. RLS for battle_results
DROP POLICY IF EXISTS "users_read_battle_results" ON public.battle_results;
CREATE POLICY "users_read_battle_results"
ON public.battle_results
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "users_manage_own_battle_results" ON public.battle_results;
CREATE POLICY "users_manage_own_battle_results"
ON public.battle_results
FOR INSERT
TO authenticated
WITH CHECK (player_id = auth.uid());
