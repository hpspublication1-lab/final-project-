-- Realtime Broadcast RLS Policy
-- Allows authenticated users to receive broadcasts on private channels
-- Required for Supabase Realtime private channel authorization

-- The realtime.messages table already has RLS enabled (verified via list_tables)
-- Add the policy that allows authenticated users to receive any broadcast

DROP POLICY IF EXISTS "authenticated can receive broadcasts" ON "realtime"."messages";
CREATE POLICY "authenticated can receive broadcasts"
ON "realtime"."messages"
FOR SELECT
TO authenticated
USING (true);
