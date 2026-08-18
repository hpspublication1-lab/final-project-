-- Migration: Mock exam features, exam questions, and notifications seed
-- exam_questions: links exams to questions with ordering
CREATE TABLE IF NOT EXISTS public.exam_questions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_id uuid NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  question_order integer NOT NULL DEFAULT 0,
  marks integer NOT NULL DEFAULT 4,
  negative_marks integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(exam_id, question_id)
);

ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'exam_questions' AND policyname = 'exam_questions_read'
  ) THEN
    CREATE POLICY exam_questions_read ON public.exam_questions
      FOR SELECT USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'exam_questions' AND policyname = 'exam_questions_admin_write'
  ) THEN
    CREATE POLICY exam_questions_admin_write ON public.exam_questions
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM public.user_profiles
          WHERE id = auth.uid() AND role = 'admin'
        )
      );
  END IF;
END $$;

-- exam_question_answers: stores per-question answers for an exam attempt
CREATE TABLE IF NOT EXISTS public.exam_question_answers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  attempt_id uuid NOT NULL REFERENCES public.exam_attempts(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  selected_option text CHECK (selected_option = ANY (ARRAY['a','b','c','d'])),
  is_correct boolean DEFAULT false,
  is_flagged boolean DEFAULT false,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(attempt_id, question_id)
);

ALTER TABLE public.exam_question_answers ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'exam_question_answers' AND policyname = 'exam_question_answers_own'
  ) THEN
    CREATE POLICY exam_question_answers_own ON public.exam_question_answers
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM public.exam_attempts ea
          WHERE ea.id = attempt_id AND ea.student_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Add notifications RLS policies if not present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'notifications_own_read'
  ) THEN
    CREATE POLICY notifications_own_read ON public.notifications
      FOR SELECT USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'notifications_own_update'
  ) THEN
    CREATE POLICY notifications_own_update ON public.notifications
      FOR UPDATE USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'notifications_admin_insert'
  ) THEN
    CREATE POLICY notifications_admin_insert ON public.notifications
      FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- Seed exams with questions if exams exist but have no exam_questions
DO $$
DECLARE
  v_exam_id uuid;
  v_q_ids uuid[];
  v_i integer;
BEGIN
  -- Get first exam
  SELECT id INTO v_exam_id FROM public.exams LIMIT 1;
  IF v_exam_id IS NOT NULL THEN
    -- Get up to 10 active questions
    SELECT ARRAY(SELECT id FROM public.questions WHERE is_active = true LIMIT 10) INTO v_q_ids;
    IF array_length(v_q_ids, 1) > 0 THEN
      FOR v_i IN 1..array_length(v_q_ids, 1) LOOP
        INSERT INTO public.exam_questions (exam_id, question_id, question_order, marks, negative_marks)
        VALUES (v_exam_id, v_q_ids[v_i], v_i, 4, 1)
        ON CONFLICT (exam_id, question_id) DO NOTHING;
      END LOOP;
    END IF;
  END IF;
END $$;
