-- ============================================================================
-- 🚀 SAMYAK GURU CEE — PRODUCTION MIGRATION NON-DESTRUCTIVE ROLLBACK SCRIPT
-- ============================================================================
-- Target Database: Supabase PostgreSQL (CEE Platform)
-- Purpose: Safely roll back new stored procedures, policies, and constraints
-- SAFETY GUARANTEE: PRESERVES all existing tables, student accounts,
-- historical progress, subscriptions, and battle ratings without truncation or deletion.
-- ============================================================================

-- 1. Rollback RPC Functions
DROP FUNCTION IF EXISTS public.record_championship_match(UUID, UUID, UUID, INTEGER, INTEGER, INTEGER, NUMERIC, INTEGER);

-- 2. Restore Default Questions Permissions (if needed)
DO $$
BEGIN
  -- Re-grant SELECT to restore standard Supabase defaults if required
  GRANT SELECT ON public.questions TO anon, authenticated;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- 3. Drop newly created policies on championship tables (if needed)
DROP POLICY IF EXISTS "read_championship_matches" ON public.championship_matches;

-- 4. Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
