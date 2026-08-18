-- ============================================================
-- Migration: exam integrity (server-side grading) + activation
-- brute-force protection + notification-insert fix
-- Timestamp: 20260722010000
-- ============================================================

-- ============================================================
-- 1. EXAM ANSWER-KEY PROTECTION
--    The questions table exposes correct_option + explanation to any
--    client that can read a question (needed for instant-feedback
--    practice). But for a *graded* mock exam, shipping the answer key
--    to the browser lets a user read it from the network/DOM before
--    submitting. These two SECURITY DEFINER RPCs let the exam flow
--    fetch questions WITHOUT the key and grade entirely on the server.
-- ============================================================

-- Fetch an exam's questions with NO correct_option / explanation.
CREATE OR REPLACE FUNCTION public.get_exam_questions_secure(p_exam_id UUID)
RETURNS TABLE (
  question_id     UUID,
  question_order  INTEGER,
  question_text   TEXT,
  option_a        TEXT,
  option_b        TEXT,
  option_c        TEXT,
  option_d        TEXT,
  marks           INTEGER,
  negative_marks  INTEGER,
  subject_id      UUID,
  difficulty      public.difficulty_level
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    q.id, eq.question_order, q.question_text,
    q.option_a, q.option_b, q.option_c, q.option_d,
    eq.marks, eq.negative_marks, q.subject_id, q.difficulty
  FROM public.exam_questions eq
  JOIN public.questions q ON q.id = eq.question_id
  WHERE eq.exam_id = p_exam_id AND q.is_active = true
  ORDER BY eq.question_order ASC;
$$;

GRANT EXECUTE ON FUNCTION public.get_exam_questions_secure(UUID) TO authenticated;

-- Grade an attempt server-side. The client submits only the selected
-- options; correct answers are looked up here and never leave the DB.
-- p_answers is a JSONB array: [{"question_id":"...","selected_option":"a"}, ...]
CREATE OR REPLACE FUNCTION public.grade_exam_attempt(
  p_attempt_id UUID,
  p_answers    JSONB,
  p_time_taken_seconds INTEGER DEFAULT NULL
)
RETURNS TABLE (
  score            NUMERIC,
  total_marks      NUMERIC,
  correct_answers  INTEGER,
  incorrect_answers INTEGER,
  unattempted      INTEGER,
  percentage       INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_exam_id UUID;
  v_student UUID;
  v_total_marks NUMERIC := 0;
  v_score NUMERIC := 0;
  v_correct INTEGER := 0;
  v_incorrect INTEGER := 0;
  v_answered INTEGER := 0;
  v_total_q INTEGER := 0;
  v_ans JSONB;
  v_qid UUID;
  v_sel TEXT;
  v_correct_opt TEXT;
  v_marks INTEGER;
  v_neg INTEGER;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- The attempt must belong to the caller.
  SELECT ea.exam_id, ea.student_id INTO v_exam_id, v_student
  FROM public.exam_attempts ea
  WHERE ea.id = p_attempt_id
  FOR UPDATE;

  IF v_student IS NULL OR v_student <> v_uid THEN
    RAISE EXCEPTION 'Attempt not found for this user';
  END IF;

  SELECT COUNT(*) INTO v_total_q FROM public.exam_questions WHERE exam_id = v_exam_id;

  -- Grade each submitted answer against the DB's correct_option.
  FOR v_ans IN SELECT * FROM jsonb_array_elements(COALESCE(p_answers, '[]'::jsonb))
  LOOP
    v_qid := (v_ans->>'question_id')::UUID;
    v_sel := lower(v_ans->>'selected_option');

    SELECT lower(q.correct_option), eq.marks, eq.negative_marks
      INTO v_correct_opt, v_marks, v_neg
    FROM public.exam_questions eq
    JOIN public.questions q ON q.id = eq.question_id
    WHERE eq.exam_id = v_exam_id AND eq.question_id = v_qid;

    IF v_correct_opt IS NULL THEN
      CONTINUE; -- question not part of this exam; ignore
    END IF;

    v_total_marks := v_total_marks + COALESCE(v_marks, 4);

    IF v_sel IS NULL OR v_sel = '' THEN
      CONTINUE; -- unattempted
    END IF;

    v_answered := v_answered + 1;

    IF v_sel = v_correct_opt THEN
      v_correct := v_correct + 1;
      v_score := v_score + COALESCE(v_marks, 4);
    ELSE
      v_incorrect := v_incorrect + 1;
      v_score := v_score - COALESCE(v_neg, 1);
    END IF;

    -- Persist the per-question answer (idempotent per attempt+question).
    INSERT INTO public.exam_question_answers (attempt_id, question_id, selected_option, is_correct)
    VALUES (p_attempt_id, v_qid, v_sel, v_sel = v_correct_opt)
    ON CONFLICT (attempt_id, question_id)
    DO UPDATE SET selected_option = EXCLUDED.selected_option, is_correct = EXCLUDED.is_correct;
  END LOOP;

  -- Finalize the attempt.
  UPDATE public.exam_attempts
  SET score = v_score,
      total_marks = v_total_marks,
      correct_answers = v_correct,
      incorrect_answers = v_incorrect,
      unattempted = GREATEST(v_total_q - v_answered, 0),
      percentage = CASE WHEN v_total_marks > 0 THEN ROUND((v_score / v_total_marks) * 100) ELSE 0 END,
      time_taken_seconds = COALESCE(p_time_taken_seconds, time_taken_seconds),
      completed_at = NOW()
  WHERE id = p_attempt_id;

  RETURN QUERY SELECT
    v_score,
    v_total_marks,
    v_correct,
    v_incorrect,
    GREATEST(v_total_q - v_answered, 0),
    CASE WHEN v_total_marks > 0 THEN ROUND((v_score / v_total_marks) * 100)::INTEGER ELSE 0 END;
END;
$$;

GRANT EXECUTE ON FUNCTION public.grade_exam_attempt(UUID, JSONB, INTEGER) TO authenticated;

-- ============================================================
-- 2. ACTIVATION-CODE BRUTE-FORCE PROTECTION
--    activate_plan_with_code had no rate limit, so codes could be
--    guessed by automated redemption in a loop. Add a per-user attempt
--    log + a sliding-window cap, enforced inside the function.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.activation_attempts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  attempted_code TEXT,
  success       BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_activation_attempts_user_time
  ON public.activation_attempts(user_id, created_at DESC);

ALTER TABLE public.activation_attempts ENABLE ROW LEVEL SECURITY;
-- Writes happen only inside the SECURITY DEFINER function; users may read
-- their own attempts (e.g. to show "locked for N minutes").
DROP POLICY IF EXISTS "users_read_own_activation_attempts" ON public.activation_attempts;
CREATE POLICY "users_read_own_activation_attempts"
ON public.activation_attempts FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.activate_plan_with_code(p_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code_record public.activation_codes%ROWTYPE;
  v_user_id UUID := auth.uid();
  v_recent_failures INTEGER;
  v_max_failures CONSTANT INTEGER := 5;     -- per window
  v_window CONSTANT INTERVAL := '15 minutes';
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Rate limit: count recent FAILED attempts in the sliding window.
  SELECT COUNT(*) INTO v_recent_failures
  FROM public.activation_attempts
  WHERE user_id = v_user_id
    AND success = false
    AND created_at > NOW() - v_window;

  IF v_recent_failures >= v_max_failures THEN
    RETURN jsonb_build_object('success', false,
      'error', 'Too many failed attempts. Please wait 15 minutes and try again.');
  END IF;

  SELECT * INTO v_code_record
  FROM public.activation_codes
  WHERE code = UPPER(TRIM(p_code)) AND is_active = true
  LIMIT 1;

  IF NOT FOUND THEN
    INSERT INTO public.activation_attempts (user_id, attempted_code, success)
    VALUES (v_user_id, UPPER(TRIM(p_code)), false);
    RETURN jsonb_build_object('success', false, 'error', 'Invalid activation code');
  END IF;

  IF v_code_record.used_by IS NOT NULL THEN
    INSERT INTO public.activation_attempts (user_id, attempted_code, success)
    VALUES (v_user_id, UPPER(TRIM(p_code)), false);
    RETURN jsonb_build_object('success', false, 'error', 'This code has already been used');
  END IF;

  IF v_code_record.expires_at IS NOT NULL AND v_code_record.expires_at < NOW() THEN
    INSERT INTO public.activation_attempts (user_id, attempted_code, success)
    VALUES (v_user_id, UPPER(TRIM(p_code)), false);
    RETURN jsonb_build_object('success', false, 'error', 'This activation code has expired');
  END IF;

  UPDATE public.activation_codes
  SET used_by = v_user_id, used_at = NOW(), is_active = false
  WHERE id = v_code_record.id;

  UPDATE public.user_profiles
  SET subscription_plan = v_code_record.plan,
      subscription_expires_at = NOW() + (v_code_record.duration_days || ' days')::INTERVAL,
      updated_at = NOW()
  WHERE id = v_user_id;

  INSERT INTO public.activation_attempts (user_id, attempted_code, success)
  VALUES (v_user_id, UPPER(TRIM(p_code)), true);

  RETURN jsonb_build_object(
    'success', true,
    'plan', v_code_record.plan::TEXT,
    'expires_at', (NOW() + (v_code_record.duration_days || ' days')::INTERVAL)::TEXT
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.activate_plan_with_code(TEXT) TO authenticated;

-- ============================================================
-- 3. NOTIFICATIONS: an earlier migration created
--    notifications_admin_insert WITH CHECK (true), which let ANY
--    authenticated user insert notifications for ANY user (spam /
--    phishing vector). Restrict inserts to admins; the app's own
--    notifications are created by SECURITY DEFINER triggers which
--    bypass RLS anyway.
-- ============================================================
DROP POLICY IF EXISTS "notifications_admin_insert" ON public.notifications;
CREATE POLICY "notifications_admin_insert"
ON public.notifications FOR INSERT TO authenticated
WITH CHECK (public.is_admin());
