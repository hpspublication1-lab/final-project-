-- ============================================================
-- Migration: allow 'fonepay' as a payment gateway
-- Timestamp: 20260724120000
--
-- payment_transactions.gateway previously only accepted 'esewa'/'khalti'.
-- Fonepay dynamic-QR payments write gateway = 'fonepay', so widen the CHECK.
-- ============================================================

ALTER TABLE public.payment_transactions
  DROP CONSTRAINT IF EXISTS payment_transactions_gateway_check;

ALTER TABLE public.payment_transactions
  ADD CONSTRAINT payment_transactions_gateway_check
  CHECK (gateway IN ('esewa', 'khalti', 'fonepay'));

-- The prebooking payment-claim step can now report 'fonepay' as the method.
ALTER TABLE public.prebookings
  DROP CONSTRAINT IF EXISTS prebookings_payment_method_check;

ALTER TABLE public.prebookings
  ADD CONSTRAINT prebookings_payment_method_check
  CHECK (payment_method IS NULL OR payment_method IN ('esewa', 'khalti', 'bank', 'whatsapp', 'fonepay'));

-- Recreate the claim RPC so 'fonepay' is accepted (unknown methods still → NULL).
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

GRANT EXECUTE ON FUNCTION public.claim_prebooking_payment(TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;
