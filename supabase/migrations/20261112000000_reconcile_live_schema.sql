-- ============================================================================
-- Samyak CEE / SEE Mastery — Reconcile Live Production Schema & Patches
-- Migration: 20261112000000_reconcile_live_schema.sql
-- Integrates all root FIX-*.sql patches and aligns questions table & Nepal quota
-- ============================================================================

-- 1. QUESTIONS TABLE COMPREHENSIVE RECONCILIATION
-- Ensures both legacy (option_a..d, correct_option) and modern (options, correct_answer, is_published)
-- columns exist and stay bidirectionally synchronized.
ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS options JSONB,
  ADD COLUMN IF NOT EXISTS correct_answer TEXT,
  ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS program_type VARCHAR(20) NOT NULL DEFAULT 'cee';

-- Backfill options JSONB array from option_a..d if options is null
UPDATE public.questions
SET options = jsonb_build_array(
  jsonb_build_object('id', 'a', 'text', COALESCE(option_a, '')),
  jsonb_build_object('id', 'b', 'text', COALESCE(option_b, '')),
  jsonb_build_object('id', 'c', 'text', COALESCE(option_c, '')),
  jsonb_build_object('id', 'd', 'text', COALESCE(option_d, ''))
)
WHERE options IS NULL AND (option_a IS NOT NULL OR option_b IS NOT NULL);

-- Backfill correct_answer from correct_option
UPDATE public.questions
SET correct_answer = correct_option
WHERE correct_answer IS NULL AND correct_option IS NOT NULL;

-- Backfill correct_option from correct_answer
UPDATE public.questions
SET correct_option = LOWER(SUBSTRING(correct_answer FROM 1 FOR 1))
WHERE correct_option IS NULL AND correct_answer IS NOT NULL;

-- Ensure is_published is populated
UPDATE public.questions
SET is_published = true
WHERE is_published IS NULL;

-- 2. DUAL-PROGRAM RECONCILIATION (From FIX-CEE-SEE-PROGRAMS.sql)
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS program_type VARCHAR(20) NOT NULL DEFAULT 'cee';
ALTER TABLE public.chapters ADD COLUMN IF NOT EXISTS program_type VARCHAR(20) NOT NULL DEFAULT 'cee';
ALTER TABLE public.batches ADD COLUMN IF NOT EXISTS program_type VARCHAR(20) NOT NULL DEFAULT 'cee';
ALTER TABLE public.video_lectures ADD COLUMN IF NOT EXISTS program_type VARCHAR(20) NOT NULL DEFAULT 'cee';
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS program_type VARCHAR(20) NOT NULL DEFAULT 'cee';
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS program_type VARCHAR(20) NOT NULL DEFAULT 'cee';
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS target_program VARCHAR(20) NOT NULL DEFAULT 'cee';

-- Performance indexes for program-scoped queries
CREATE INDEX IF NOT EXISTS idx_subjects_program ON public.subjects(program_type, is_active);
CREATE INDEX IF NOT EXISTS idx_chapters_program ON public.chapters(program_type, is_active);
CREATE INDEX IF NOT EXISTS idx_batches_program ON public.batches(program_type, is_active);
CREATE INDEX IF NOT EXISTS idx_questions_program ON public.questions(program_type, is_published);
CREATE INDEX IF NOT EXISTS idx_video_lectures_program ON public.video_lectures(program_type, is_active);
CREATE INDEX IF NOT EXISTS idx_exams_program ON public.exams(program_type, is_published);

-- 3. AI QUOTA RESET WINDOW: NEPAL STANDARD TIME (UTC+05:45)
-- Fixes quota reset window from 05:45 AM local (UTC 00:00) to exactly 00:00 midnight NPT.
CREATE OR REPLACE FUNCTION public.check_and_increment_ai_usage(
  p_free_limit INTEGER DEFAULT 25,
  p_pro_limit  INTEGER DEFAULT 200
)
RETURNS TABLE (allowed BOOLEAN, current_count INTEGER, daily_limit INTEGER, tier TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid        UUID := auth.uid();
  v_is_pro     BOOLEAN;
  v_limit      INTEGER;
  v_count      INTEGER;
  v_tier       TEXT;
  v_nepal_date DATE;
BEGIN
  IF v_uid IS NULL THEN
    RETURN QUERY SELECT false, 0, 0, 'anonymous'::TEXT;
    RETURN;
  END IF;

  -- Compute current date in Asia/Kathmandu timezone (+05:45 offset)
  v_nepal_date := (now() AT TIME ZONE 'Asia/Kathmandu')::DATE;
  v_is_pro := public.is_pro_user();
  v_tier := CASE WHEN v_is_pro THEN 'pro' ELSE 'free' END;
  v_limit := CASE WHEN v_is_pro THEN p_pro_limit ELSE p_free_limit END;

  -- Lock (or create) today's row for this user in Nepal date window
  INSERT INTO public.ai_usage (user_id, usage_date, request_count)
  VALUES (v_uid, v_nepal_date, 0)
  ON CONFLICT (user_id, usage_date) DO NOTHING;

  SELECT request_count INTO v_count
  FROM public.ai_usage
  WHERE user_id = v_uid AND usage_date = v_nepal_date
  FOR UPDATE;

  IF v_count >= v_limit THEN
    RETURN QUERY SELECT false, v_count, v_limit, v_tier;
    RETURN;
  END IF;

  UPDATE public.ai_usage
  SET request_count = request_count + 1, updated_at = now()
  WHERE user_id = v_uid AND usage_date = v_nepal_date
  RETURNING request_count INTO v_count;

  RETURN QUERY SELECT true, v_count, v_limit, v_tier;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_and_increment_ai_usage(INTEGER, INTEGER) TO authenticated, anon, service_role;

-- 4. COURSE ORDERS TABLE ALIGNMENT (For Fonepay & SEE checkout)
CREATE TABLE IF NOT EXISTS public.course_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL,
  amount_npr NUMERIC(10, 2) NOT NULL,
  discount_npr NUMERIC(10, 2) DEFAULT 0,
  final_amount_npr NUMERIC(10, 2) NOT NULL,
  currency TEXT DEFAULT 'NPR',
  gateway TEXT DEFAULT 'fonepay',
  status TEXT DEFAULT 'initiated',
  student_name TEXT,
  student_phone TEXT,
  gateway_response JSONB,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_course_orders_order_number ON public.course_orders(order_number);
CREATE INDEX IF NOT EXISTS idx_course_orders_user_id ON public.course_orders(user_id);
ALTER TABLE public.course_orders ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'course_orders' AND policyname = 'users_read_own_orders'
  ) THEN
    CREATE POLICY "users_read_own_orders" ON public.course_orders
      FOR SELECT TO authenticated USING (auth.uid() = user_id);
  END IF;
END $$;
