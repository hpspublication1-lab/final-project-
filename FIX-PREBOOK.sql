-- ============================================================
-- Samyak CEE — FIX the /prebook error
--   "Could not find the function public.create_prebooking(...)"
--
-- Self-contained & dependency-guarded: creates the prebookings table and
-- the two RPCs the page calls. The trigger and admin policy are created
-- ONLY if their helper functions already exist, so this runs cleanly even
-- though your DB diverges from the repo migrations.
--
-- Paste this ENTIRE file into: Supabase Dashboard → SQL Editor → Run.
-- Safe to run more than once.
-- ============================================================

-- 1) Table -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.prebookings (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference      TEXT NOT NULL UNIQUE,
  full_name      TEXT NOT NULL,
  phone          TEXT NOT NULL,
  email          TEXT,
  college        TEXT,
  cee_year       INTEGER,
  amount_paisa   BIGINT NOT NULL DEFAULT 30000,   -- Rs 300 prebooking fee
  status         TEXT NOT NULL DEFAULT 'reserved'
                   CHECK (status IN ('reserved', 'payment_claimed', 'confirmed', 'cancelled')),
  payment_method TEXT CHECK (payment_method IS NULL OR payment_method IN ('esewa', 'khalti', 'bank', 'whatsapp', 'fonepay')),
  payment_ref    TEXT,
  utm_source     TEXT,
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_prebookings_phone   ON public.prebookings(phone);
CREATE INDEX IF NOT EXISTS idx_prebookings_status  ON public.prebookings(status);
CREATE INDEX IF NOT EXISTS idx_prebookings_created ON public.prebookings(created_at DESC);

ALTER TABLE public.prebookings ENABLE ROW LEVEL SECURITY;

-- 2) updated_at trigger — only if the shared helper exists -----------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column'
             AND pronamespace = 'public'::regnamespace) THEN
    EXECUTE 'DROP TRIGGER IF EXISTS update_prebookings_updated_at ON public.prebookings';
    EXECUTE 'CREATE TRIGGER update_prebookings_updated_at BEFORE UPDATE ON public.prebookings '
         || 'FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()';
  END IF;
END $$;

-- 3) Admin read/manage policy — only if is_admin() exists ------------------
--    (Not required for the public flow; the RPCs below are SECURITY DEFINER.)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin'
             AND pronamespace = 'public'::regnamespace) THEN
    EXECUTE 'DROP POLICY IF EXISTS "admin_manage_prebookings" ON public.prebookings';
    EXECUTE 'CREATE POLICY "admin_manage_prebookings" ON public.prebookings FOR ALL TO authenticated '
         || 'USING (public.is_admin()) WITH CHECK (public.is_admin())';
  END IF;
END $$;

-- 4) Reserve a seat --------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_prebooking(
  p_full_name TEXT,
  p_phone     TEXT,
  p_email     TEXT DEFAULT NULL,
  p_college   TEXT DEFAULT NULL,
  p_cee_year  INTEGER DEFAULT NULL,
  p_utm       TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name  TEXT := btrim(COALESCE(p_full_name, ''));
  v_phone TEXT := regexp_replace(COALESCE(p_phone, ''), '[^0-9]', '', 'g');
  v_ref   TEXT;
  v_existing TEXT;
BEGIN
  IF length(v_name) < 2 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Please enter your full name.');
  END IF;
  IF length(v_phone) < 10 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Please enter a valid 10-digit mobile number.');
  END IF;

  -- Idempotent: return a recent reservation for the same phone.
  SELECT reference INTO v_existing
  FROM public.prebookings
  WHERE phone = v_phone
    AND status IN ('reserved', 'payment_claimed')
    AND created_at > NOW() - INTERVAL '2 hours'
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_existing IS NOT NULL THEN
    RETURN jsonb_build_object('success', true, 'reference', v_existing, 'amount_npr', 300, 'existing', true);
  END IF;

  LOOP
    v_ref := 'SCM-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.prebookings WHERE reference = v_ref);
  END LOOP;

  INSERT INTO public.prebookings (reference, full_name, phone, email, college, cee_year, utm_source)
  VALUES (v_ref, v_name, v_phone, NULLIF(btrim(p_email), ''), NULLIF(btrim(p_college), ''), p_cee_year, p_utm);

  RETURN jsonb_build_object('success', true, 'reference', v_ref, 'amount_npr', 300, 'existing', false);
END;
$$;

-- 5) Claim a payment -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.claim_prebooking_payment(
  p_reference   TEXT,
  p_phone       TEXT,
  p_method      TEXT,
  p_payment_ref TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_phone TEXT := regexp_replace(COALESCE(p_phone, ''), '[^0-9]', '', 'g');
  v_id UUID;
BEGIN
  SELECT id INTO v_id
  FROM public.prebookings
  WHERE reference = upper(btrim(p_reference)) AND phone = v_phone;

  IF v_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'We could not match that booking reference and phone number.');
  END IF;

  UPDATE public.prebookings
  SET status = 'payment_claimed',
      payment_method = CASE WHEN p_method IN ('esewa','khalti','bank','whatsapp','fonepay') THEN p_method ELSE NULL END,
      payment_ref = NULLIF(btrim(p_payment_ref), ''),
      updated_at = NOW()
  WHERE id = v_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- 6) Grants — anonymous visitors reserve/claim through these RPCs ----------
GRANT EXECUTE ON FUNCTION public.create_prebooking(TEXT, TEXT, TEXT, TEXT, INTEGER, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_prebooking_payment(TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;
