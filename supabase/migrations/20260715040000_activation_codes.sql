-- ============================================================
-- Activation Codes — WhatsApp-based plan activation system
-- ============================================================

-- Table: activation_codes
CREATE TABLE IF NOT EXISTS public.activation_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  plan public.subscription_plan NOT NULL,
  duration_days INTEGER NOT NULL DEFAULT 30,
  created_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  used_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_activation_codes_code ON public.activation_codes(code);
CREATE INDEX IF NOT EXISTS idx_activation_codes_used_by ON public.activation_codes(used_by);
CREATE INDEX IF NOT EXISTS idx_activation_codes_created_by ON public.activation_codes(created_by);

-- Enable RLS
ALTER TABLE public.activation_codes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "students_can_view_own_used_codes" ON public.activation_codes;
CREATE POLICY "students_can_view_own_used_codes"
ON public.activation_codes
FOR SELECT
TO authenticated
USING (used_by = auth.uid());

DROP POLICY IF EXISTS "admin_full_access_activation_codes" ON public.activation_codes;
CREATE POLICY "admin_full_access_activation_codes"
ON public.activation_codes
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Function: Activate a plan using a code (server-side, single-use)
CREATE OR REPLACE FUNCTION public.activate_plan_with_code(p_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_code_record public.activation_codes%ROWTYPE;
  v_user_id UUID := auth.uid();
BEGIN
  -- Must be authenticated
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Find the code
  SELECT * INTO v_code_record
  FROM public.activation_codes
  WHERE code = UPPER(TRIM(p_code))
    AND is_active = true
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid activation code');
  END IF;

  -- Check if already used
  IF v_code_record.used_by IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'This code has already been used');
  END IF;

  -- Check if expired
  IF v_code_record.expires_at IS NOT NULL AND v_code_record.expires_at < NOW() THEN
    RETURN jsonb_build_object('success', false, 'error', 'This activation code has expired');
  END IF;

  -- Mark code as used
  UPDATE public.activation_codes
  SET used_by = v_user_id,
      used_at = NOW(),
      is_active = false
  WHERE id = v_code_record.id;

  -- Activate the plan on user profile
  UPDATE public.user_profiles
  SET subscription_plan = v_code_record.plan,
      subscription_expires_at = NOW() + (v_code_record.duration_days || ' days')::INTERVAL,
      updated_at = NOW()
  WHERE id = v_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'plan', v_code_record.plan::TEXT,
    'expires_at', (NOW() + (v_code_record.duration_days || ' days')::INTERVAL)::TEXT
  );
END;
$$;
