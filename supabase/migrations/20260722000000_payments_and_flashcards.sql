-- ============================================================
-- Migration: payment transaction logging + SM-2 flashcards
-- Timestamp: 20260722000000
-- ============================================================

-- ============================================================
-- 1. PAYMENT TRANSACTIONS (eSewa / Khalti)
--    Immutable-ish audit log of every payment attempt. Rows are
--    created when a checkout is initiated and updated to 'completed'
--    /'failed' by the server AFTER verifying with the gateway
--    (server-to-server). Clients may only READ their own rows — all
--    writes go through server routes / SECURITY DEFINER logic added
--    in the payments wave, never directly from the browser.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  gateway            TEXT NOT NULL CHECK (gateway IN ('esewa', 'khalti')),
  purchase_order_id  TEXT NOT NULL UNIQUE,          -- our transaction_uuid / purchase_order_id
  gateway_ref        TEXT,                          -- eSewa transaction_code / Khalti pidx
  amount_paisa       BIGINT NOT NULL,               -- store money in the smallest unit (paisa)
  currency           TEXT NOT NULL DEFAULT 'NPR',
  plan               public.subscription_plan NOT NULL,
  duration_days      INTEGER NOT NULL DEFAULT 30,
  status             TEXT NOT NULL DEFAULT 'initiated'
                       CHECK (status IN ('initiated', 'pending', 'completed', 'failed', 'refunded')),
  gateway_response   JSONB,
  created_at         TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payment_tx_user     ON public.payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_tx_status   ON public.payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_tx_order    ON public.payment_transactions(purchase_order_id);

DROP TRIGGER IF EXISTS update_payment_tx_updated_at ON public.payment_transactions;
CREATE TRIGGER update_payment_tx_updated_at
  BEFORE UPDATE ON public.payment_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_read_own_payments" ON public.payment_transactions;
CREATE POLICY "users_read_own_payments"
ON public.payment_transactions FOR SELECT TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "admin_read_all_payments" ON public.payment_transactions;
CREATE POLICY "admin_read_all_payments"
ON public.payment_transactions FOR SELECT TO authenticated
USING (public.is_admin());

-- NOTE: intentionally NO client INSERT/UPDATE policy. Payment rows are
-- written by trusted server code only.

-- ============================================================
-- 2. FLASHCARDS (content) + per-student SM-2 review state
-- ============================================================
CREATE TABLE IF NOT EXISTS public.flashcards (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id   UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  chapter_id   UUID REFERENCES public.chapters(id) ON DELETE SET NULL,
  front        TEXT NOT NULL,        -- prompt (question / term / diagram caption)
  back         TEXT NOT NULL,        -- answer / definition
  hint         TEXT,
  image_url    TEXT,                 -- optional diagram image
  is_premium   BOOLEAN NOT NULL DEFAULT false,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_by   UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_flashcards_subject ON public.flashcards(subject_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_chapter ON public.flashcards(chapter_id);

ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;

-- Non-premium cards public; premium cards need a paid plan (matches the
-- rest of the app's premium gating via is_pro_user()).
DROP POLICY IF EXISTS "read_free_flashcards" ON public.flashcards;
CREATE POLICY "read_free_flashcards"
ON public.flashcards FOR SELECT TO public
USING (is_active = true AND is_premium = false);

DROP POLICY IF EXISTS "read_premium_flashcards" ON public.flashcards;
CREATE POLICY "read_premium_flashcards"
ON public.flashcards FOR SELECT TO authenticated
USING (is_active = true AND (is_premium = false OR public.is_pro_user()));

DROP POLICY IF EXISTS "admin_manage_flashcards" ON public.flashcards;
CREATE POLICY "admin_manage_flashcards"
ON public.flashcards FOR ALL TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Per-student SM-2 scheduling state (one row per student per card).
CREATE TABLE IF NOT EXISTS public.flashcard_reviews (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id     UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  flashcard_id   UUID NOT NULL REFERENCES public.flashcards(id) ON DELETE CASCADE,
  ease_factor    NUMERIC(4,2) NOT NULL DEFAULT 2.50,   -- SM-2 EF, floor 1.30
  interval_days  INTEGER NOT NULL DEFAULT 0,
  repetitions    INTEGER NOT NULL DEFAULT 0,
  due_at         TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_grade     INTEGER,                              -- last quality 0..5
  last_reviewed_at TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, flashcard_id)
);
CREATE INDEX IF NOT EXISTS idx_flashcard_reviews_due ON public.flashcard_reviews(student_id, due_at);

DROP TRIGGER IF EXISTS update_flashcard_reviews_updated_at ON public.flashcard_reviews;
CREATE TRIGGER update_flashcard_reviews_updated_at
  BEFORE UPDATE ON public.flashcard_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.flashcard_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "students_manage_own_flashcard_reviews" ON public.flashcard_reviews;
CREATE POLICY "students_manage_own_flashcard_reviews"
ON public.flashcard_reviews FOR ALL TO authenticated
USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid());
