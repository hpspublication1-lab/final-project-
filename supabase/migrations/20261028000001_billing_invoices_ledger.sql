-- ============================================================================
-- Migration: Cryptographically Secured & Immutable Billing Ledger
-- Timestamp: 20261028000001
-- ============================================================================

-- 1. Core Immutable Billing Invoices Table
CREATE TABLE IF NOT EXISTS public.billing_invoices (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number        TEXT NOT NULL UNIQUE,
  receipt_number        TEXT UNIQUE,
  user_id               UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE RESTRICT,
  source_type           TEXT NOT NULL CHECK (source_type IN ('payment_transaction', 'course_order', 'billing_history', 'manual_grant')),
  source_id             TEXT NOT NULL,
  purchase_order_id     TEXT,
  customer_name         TEXT NOT NULL DEFAULT 'Student',
  customer_email        TEXT,
  customer_phone        TEXT,
  item_title            TEXT NOT NULL,
  item_sku              TEXT NOT NULL,
  course_slug           TEXT,
  plan_tier             TEXT,
  duration_days         INTEGER NOT NULL DEFAULT 365,
  gross_amount_paisa    BIGINT NOT NULL DEFAULT 0 CHECK (gross_amount_paisa >= 0),
  discount_amount_paisa BIGINT NOT NULL DEFAULT 0 CHECK (discount_amount_paisa >= 0),
  tax_amount_paisa      BIGINT NOT NULL DEFAULT 0 CHECK (tax_amount_paisa >= 0),
  net_amount_paisa      BIGINT NOT NULL DEFAULT 0 CHECK (net_amount_paisa >= 0),
  currency              TEXT NOT NULL DEFAULT 'NPR',
  gateway               TEXT NOT NULL DEFAULT 'fonepay',
  gateway_ref           TEXT,
  status                TEXT NOT NULL DEFAULT 'paid'
                          CHECK (status IN ('paid', 'pending', 'refunded', 'failed', 'void')),
  fiscal_year_bs        TEXT NOT NULL DEFAULT '2082/83',
  signature_hash        TEXT NOT NULL,
  verification_code     TEXT NOT NULL,
  notes                 TEXT,
  company_snapshot      JSONB NOT NULL DEFAULT '{}'::jsonb,
  metadata              JSONB NOT NULL DEFAULT '{}'::jsonb,
  issued_at             TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  paid_at               TIMESTAMPTZ,
  refunded_at           TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (source_type, source_id)
);

CREATE INDEX IF NOT EXISTS idx_billing_invoices_user_id
  ON public.billing_invoices(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_billing_invoices_invoice_number
  ON public.billing_invoices(invoice_number);

CREATE INDEX IF NOT EXISTS idx_billing_invoices_verification_code
  ON public.billing_invoices(verification_code);

CREATE INDEX IF NOT EXISTS idx_billing_invoices_purchase_order
  ON public.billing_invoices(purchase_order_id);

DROP TRIGGER IF EXISTS update_billing_invoices_updated_at ON public.billing_invoices;
CREATE TRIGGER update_billing_invoices_updated_at
  BEFORE UPDATE ON public.billing_invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Database-Level Immutability Guard on Financial Records
CREATE OR REPLACE FUNCTION public.enforce_billing_invoice_immutability()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Financial records in billing_invoices are immutable and cannot be deleted. Transition status to void or refunded instead.';
  END IF;

  IF TG_OP = 'UPDATE' THEN
    -- Core identity & monetary fields of a paid invoice can never be altered
    IF OLD.status = 'paid' THEN
      IF NEW.invoice_number IS DISTINCT FROM OLD.invoice_number
         OR NEW.user_id IS DISTINCT FROM OLD.user_id
         OR NEW.source_type IS DISTINCT FROM OLD.source_type
         OR NEW.source_id IS DISTINCT FROM OLD.source_id
         OR NEW.net_amount_paisa IS DISTINCT FROM OLD.net_amount_paisa
         OR NEW.currency IS DISTINCT FROM OLD.currency THEN
        RAISE EXCEPTION 'Tamper protection: Core financial fields of a settled invoice (%) cannot be modified.', OLD.invoice_number;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_billing_invoice_immutability ON public.billing_invoices;
CREATE TRIGGER trg_enforce_billing_invoice_immutability
  BEFORE UPDATE OR DELETE ON public.billing_invoices
  FOR EACH ROW EXECUTE FUNCTION public.enforce_billing_invoice_immutability();

-- 3. Append-Only Billing Audit Trail Table
CREATE TABLE IF NOT EXISTS public.billing_audit_logs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id        UUID NOT NULL,
  invoice_number    TEXT NOT NULL,
  user_id           UUID NOT NULL,
  event_type        TEXT NOT NULL CHECK (event_type IN ('ISSUED', 'STATUS_UPDATED', 'REFUNDED', 'VOIDED')),
  previous_status   TEXT,
  new_status        TEXT NOT NULL,
  net_amount_paisa  BIGINT NOT NULL,
  signature_hash    TEXT NOT NULL,
  verification_code TEXT NOT NULL,
  recorded_at       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_billing_audit_logs_invoice_id
  ON public.billing_audit_logs(invoice_id, recorded_at DESC);

CREATE OR REPLACE FUNCTION public.prevent_billing_audit_log_modification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RAISE EXCEPTION 'billing_audit_logs is an append-only ledger and cannot be updated or deleted.';
END;
$$;

DROP TRIGGER IF EXISTS trg_immutable_billing_audit_logs ON public.billing_audit_logs;
CREATE TRIGGER trg_immutable_billing_audit_logs
  BEFORE UPDATE OR DELETE ON public.billing_audit_logs
  FOR EACH ROW EXECUTE FUNCTION public.prevent_billing_audit_log_modification();

CREATE OR REPLACE FUNCTION public.record_billing_invoice_audit_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_event TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_event := 'ISSUED';
  ELSIF NEW.status = 'refunded' AND OLD.status IS DISTINCT FROM 'refunded' THEN
    v_event := 'REFUNDED';
  ELSIF NEW.status = 'void' AND OLD.status IS DISTINCT FROM 'void' THEN
    v_event := 'VOIDED';
  ELSE
    v_event := 'STATUS_UPDATED';
  END IF;

  INSERT INTO public.billing_audit_logs (
    invoice_id,
    invoice_number,
    user_id,
    event_type,
    previous_status,
    new_status,
    net_amount_paisa,
    signature_hash,
    verification_code
  ) VALUES (
    NEW.id,
    NEW.invoice_number,
    NEW.user_id,
    v_event,
    CASE WHEN TG_OP = 'UPDATE' THEN OLD.status ELSE NULL END,
    NEW.status,
    NEW.net_amount_paisa,
    NEW.signature_hash,
    NEW.verification_code
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_record_billing_invoice_audit ON public.billing_invoices;
CREATE TRIGGER trg_record_billing_invoice_audit
  AFTER INSERT OR UPDATE ON public.billing_invoices
  FOR EACH ROW EXECUTE FUNCTION public.record_billing_invoice_audit_event();

-- 4. Row-Level Security (Read-Only for Owner/Admin; Zero Client Write Access)
ALTER TABLE public.billing_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_read_own_billing_invoices" ON public.billing_invoices;
CREATE POLICY "users_read_own_billing_invoices"
  ON public.billing_invoices
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "admin_read_all_billing_invoices" ON public.billing_invoices;
CREATE POLICY "admin_read_all_billing_invoices"
  ON public.billing_invoices
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "users_read_own_billing_audit_logs" ON public.billing_audit_logs;
CREATE POLICY "users_read_own_billing_audit_logs"
  ON public.billing_audit_logs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "admin_read_all_billing_audit_logs" ON public.billing_audit_logs;
CREATE POLICY "admin_read_all_billing_audit_logs"
  ON public.billing_audit_logs
  FOR SELECT
  TO authenticated
  USING (public.is_admin());
