-- ============================================================
-- Samyak CEE — make Fonepay payments workable (DB side)
--
-- Creates the payment_transactions table the payment routes write to, and
-- ensures user_profiles has the columns the activation step updates. Fully
-- guarded / idempotent so it runs cleanly on your (diverged) database.
--
-- Paste this ENTIRE file into: Supabase Dashboard → SQL Editor → Run.
-- Safe to run more than once.
--
-- NOTE: this is only the DATABASE half. You must ALSO put your Supabase
-- service_role key in .env.local as SUPABASE_SERVICE_ROLE_KEY and restart
-- the dev server, or the app still says "Payments not configured".
-- ============================================================

-- 1) Ensure the subscription_plan enum exists ------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_plan'
                 AND typnamespace = 'public'::regnamespace) THEN
    CREATE TYPE public.subscription_plan AS ENUM ('free', 'student', 'pro', 'institution');
  END IF;
END $$;

-- 2) Ensure user_profiles has the subscription columns the app updates -----
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS subscription_plan public.subscription_plan DEFAULT 'free';
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

-- 3) Payment transactions audit log ----------------------------------------
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  gateway            TEXT NOT NULL CHECK (gateway IN ('esewa', 'khalti', 'fonepay')),
  purchase_order_id  TEXT NOT NULL UNIQUE,
  gateway_ref        TEXT,
  amount_paisa       BIGINT NOT NULL,
  currency           TEXT NOT NULL DEFAULT 'NPR',
  plan               public.subscription_plan NOT NULL,
  duration_days      INTEGER NOT NULL DEFAULT 30,
  status             TEXT NOT NULL DEFAULT 'initiated'
                       CHECK (status IN ('initiated', 'pending', 'completed', 'failed', 'refunded')),
  gateway_response   JSONB,
  created_at         TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- If the table already existed with an older CHECK, widen it to allow fonepay.
ALTER TABLE public.payment_transactions
  DROP CONSTRAINT IF EXISTS payment_transactions_gateway_check;
ALTER TABLE public.payment_transactions
  ADD CONSTRAINT payment_transactions_gateway_check
  CHECK (gateway IN ('esewa', 'khalti', 'fonepay'));

CREATE INDEX IF NOT EXISTS idx_payment_tx_user   ON public.payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_tx_status ON public.payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_tx_order  ON public.payment_transactions(purchase_order_id);

ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- Users may read their own rows (all writes go through the service role).
DROP POLICY IF EXISTS "users_read_own_payments" ON public.payment_transactions;
CREATE POLICY "users_read_own_payments"
  ON public.payment_transactions FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- 4) updated_at trigger — only if the shared helper exists -----------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column'
             AND pronamespace = 'public'::regnamespace) THEN
    EXECUTE 'DROP TRIGGER IF EXISTS update_payment_tx_updated_at ON public.payment_transactions';
    EXECUTE 'CREATE TRIGGER update_payment_tx_updated_at BEFORE UPDATE ON public.payment_transactions '
         || 'FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()';
  END IF;
END $$;

-- 5) Admin read policy — only if is_admin() exists -------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin'
             AND pronamespace = 'public'::regnamespace) THEN
    EXECUTE 'DROP POLICY IF EXISTS "admin_read_all_payments" ON public.payment_transactions';
    EXECUTE 'CREATE POLICY "admin_read_all_payments" ON public.payment_transactions FOR SELECT TO authenticated '
         || 'USING (public.is_admin())';
  END IF;
END $$;
