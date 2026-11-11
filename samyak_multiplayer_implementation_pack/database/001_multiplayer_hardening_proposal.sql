-- PROPOSAL ONLY — DO NOT APPLY UNTIL THE CURRENT SCHEMA IS INSPECTED.
-- The supplied blueprint names public.battle_results, but constraints, column names,
-- RLS policies, and existing idempotency logic must be checked first.

DO $$
BEGIN
  IF to_regclass('public.battle_results') IS NULL THEN
    RAISE EXCEPTION 'public.battle_results does not exist; inspect schema before applying';
  END IF;
END $$;

BEGIN;

ALTER TABLE public.battle_results
  ADD COLUMN IF NOT EXISTS idempotency_hash text,
  ADD COLUMN IF NOT EXISTS server_node_id text,
  ADD COLUMN IF NOT EXISTS engine_version text,
  ADD COLUMN IF NOT EXISTS finalized_at timestamptz;

-- Check for existing duplicate non-NULL values before creating this index.
CREATE UNIQUE INDEX IF NOT EXISTS uq_battle_results_idempotency_hash
  ON public.battle_results (idempotency_hash)
  WHERE idempotency_hash IS NOT NULL;

COMMIT;

-- Follow-up work NOT implemented by this proposal:
-- 1. Transaction-safe result + rating ledger RPC, exactly once.
-- 2. Restrictive EXECUTE grants for that RPC.
-- 3. RLS review for all Arena tables and RPCs.
-- 4. Migration-specific rollback/forward-fix based on existing production rows.
