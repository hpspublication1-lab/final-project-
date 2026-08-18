-- ============================================================
-- Billing History & Payment Methods Migration
-- ============================================================

-- Billing history table
CREATE TABLE IF NOT EXISTS public.billing_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  plan public.subscription_plan NOT NULL,
  amount_npr INTEGER NOT NULL DEFAULT 0,
  billing_period TEXT NOT NULL DEFAULT 'monthly',
  payment_method TEXT NOT NULL DEFAULT 'esewa',
  transaction_ref TEXT,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'failed', 'refunded')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_billing_history_user_id ON public.billing_history(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_history_created_at ON public.billing_history(created_at);

-- Enable RLS
ALTER TABLE public.billing_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "users_view_own_billing_history" ON public.billing_history;
CREATE POLICY "users_view_own_billing_history"
ON public.billing_history
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "admin_manage_billing_history" ON public.billing_history;
CREATE POLICY "admin_manage_billing_history"
ON public.billing_history
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Seed sample billing history for existing users
DO $$
DECLARE
  existing_user_id UUID;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'user_profiles'
  ) THEN
    SELECT id INTO existing_user_id FROM public.user_profiles
    WHERE subscription_plan != 'free'
    LIMIT 1;

    IF existing_user_id IS NOT NULL THEN
      INSERT INTO public.billing_history (id, user_id, plan, amount_npr, billing_period, payment_method, transaction_ref, status, created_at)
      VALUES
        (gen_random_uuid(), existing_user_id, 'student'::public.subscription_plan, 799, 'monthly', 'esewa', 'ESW-2026-001234', 'completed', NOW() - INTERVAL '30 days'),
        (gen_random_uuid(), existing_user_id, 'student'::public.subscription_plan, 799, 'monthly', 'khalti', 'KHL-2026-005678', 'completed', NOW() - INTERVAL '60 days')
      ON CONFLICT (id) DO NOTHING;
    END IF;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Billing history seed failed: %', SQLERRM;
END $$;
