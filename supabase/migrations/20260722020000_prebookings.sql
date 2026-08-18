-- ============================================================
-- Migration: prebooking campaign (lead capture + payment claim)
-- Timestamp: 20260722020000
-- ============================================================
-- Backs the public /prebook page. Visitors are anonymous, so writes go
-- through SECURITY DEFINER RPCs granted to the `anon` role rather than a
-- broad INSERT policy — that way the leads table itself is never readable
-- or writable directly from the browser (no scraping, no tampering).
-- ============================================================

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
  payment_method TEXT CHECK (payment_method IS NULL OR payment_method IN ('esewa', 'khalti', 'bank', 'whatsapp')),
  payment_ref    TEXT,
  utm_source     TEXT,
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_prebookings_phone   ON public.prebookings(phone);
CREATE INDEX IF NOT EXISTS idx_prebookings_status  ON public.prebookings(status);
CREATE INDEX IF NOT EXISTS idx_prebookings_created ON public.prebookings(created_at DESC);

DROP TRIGGER IF EXISTS update_prebookings_updated_at ON public.prebookings;
CREATE TRIGGER update_prebookings_updated_at
  BEFORE UPDATE ON public.prebookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.prebookings ENABLE ROW LEVEL SECURITY;

-- Only admins can read/manage leads directly. No public policies — the
-- public interacts solely through the two RPCs below.
DROP POLICY IF EXISTS "admin_manage_prebookings" ON public.prebookings;
CREATE POLICY "admin_manage_prebookings"
ON public.prebookings FOR ALL TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ── Reserve a seat ──────────────────────────────────────────────────────
-- Returns { reference, amount_npr }. De-dupes accidental double-submits by
-- returning the existing reference if the same phone reserved in the last
-- 2 hours.
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

  -- Return the existing recent reservation for this phone (idempotent submit).
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

  -- Generate a unique, human-friendly reference (retry on the rare clash).
  LOOP
    v_ref := 'SCM-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.prebookings WHERE reference = v_ref);
  END LOOP;

  INSERT INTO public.prebookings (reference, full_name, phone, email, college, cee_year, utm_source)
  VALUES (v_ref, v_name, v_phone, NULLIF(btrim(p_email), ''), NULLIF(btrim(p_college), ''), p_cee_year, p_utm);

  RETURN jsonb_build_object('success', true, 'reference', v_ref, 'amount_npr', 300, 'existing', false);
END;
$$;

-- ── Claim a payment ("I've paid Rs 300") ────────────────────────────────
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
      payment_method = CASE WHEN p_method IN ('esewa','khalti','bank','whatsapp') THEN p_method ELSE NULL END,
      payment_ref = NULLIF(btrim(p_payment_ref), ''),
      updated_at = NOW()
  WHERE id = v_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_prebooking(TEXT, TEXT, TEXT, TEXT, INTEGER, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_prebooking_payment(TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;
