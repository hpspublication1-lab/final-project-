-- ============================================================
-- Samyak CEE — create the missing PROGRESS-TRACKING tables.
--
-- This DB is missing exam_attempts, practice_attempts AND topic_mastery,
-- so: practice results don't save, mock-test history is blank, and the
-- dashboard mastery rings / weak-topics / study plan show nothing.
-- topic_mastery alone can't help — it is DERIVED from practice_attempts,
-- and practice saving needs exam_attempts. So this creates all three,
-- wires a trigger that auto-fills mastery as students practice, and sets
-- RLS (students see only their own rows; admins read all).
--
-- No enum dependencies (uses TEXT + CHECK) so it runs on this diverged DB.
--
-- Paste this ENTIRE file into: Supabase Dashboard → SQL Editor → Run.
-- Safe to run more than once (idempotent).
-- ============================================================

-- 1) exam_attempts — one row per completed mock/practice exam ---------------
CREATE TABLE IF NOT EXISTS public.exam_attempts (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id            UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  student_id         UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  score              NUMERIC(6,2),
  total_marks        INTEGER,
  correct_answers    INTEGER DEFAULT 0,
  incorrect_answers  INTEGER DEFAULT 0,
  unattempted        INTEGER DEFAULT 0,
  percentage         NUMERIC(5,2),
  percentile         NUMERIC(5,2),
  time_taken_seconds INTEGER,
  completed_at       TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_student ON public.exam_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_exam    ON public.exam_attempts(exam_id);

-- 2) practice_attempts — one row per answered practice question ------------
CREATE TABLE IF NOT EXISTS public.practice_attempts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  question_id     UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  selected_option TEXT,
  is_correct      BOOLEAN NOT NULL DEFAULT false,
  subject_id      UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  difficulty      TEXT CHECK (difficulty IS NULL OR difficulty IN ('easy','medium','hard')),
  session_id      UUID,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_practice_attempts_student  ON public.practice_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_practice_attempts_question ON public.practice_attempts(question_id);

-- 3) topic_mastery — DERIVED per-chapter mastery (what the dashboard reads) -
CREATE TABLE IF NOT EXISTS public.topic_mastery (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id          UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  chapter_id          UUID REFERENCES public.chapters(id) ON DELETE CASCADE,
  subject_id          UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  topic_name          TEXT,
  mastery_level       TEXT NOT NULL DEFAULT 'not_attempted'
                        CHECK (mastery_level IN ('not_attempted','critical','weak','developing','strong','mastered')),
  mastery_score       NUMERIC(5,2) NOT NULL DEFAULT 0,
  accuracy            NUMERIC(5,2) NOT NULL DEFAULT 0,
  questions_attempted INTEGER NOT NULL DEFAULT 0,
  correct_answers     INTEGER NOT NULL DEFAULT 0,
  last_practiced_at   TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, chapter_id)
);
CREATE INDEX IF NOT EXISTS idx_topic_mastery_student ON public.topic_mastery(student_id);
CREATE INDEX IF NOT EXISTS idx_topic_mastery_subject ON public.topic_mastery(subject_id);

-- updated_at auto-touch (only if the shared helper exists) ------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname='update_updated_at_column'
             AND pronamespace='public'::regnamespace) THEN
    EXECUTE 'DROP TRIGGER IF EXISTS update_topic_mastery_updated_at ON public.topic_mastery';
    EXECUTE 'CREATE TRIGGER update_topic_mastery_updated_at BEFORE UPDATE ON public.topic_mastery '
         || 'FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()';
  END IF;
END $$;

-- 4) Auto-populate topic_mastery from each practice answer ------------------
CREATE OR REPLACE FUNCTION public.sync_topic_mastery()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_chapter UUID; v_subject UUID; v_att INTEGER; v_cor INTEGER; v_acc NUMERIC(5,2); v_level TEXT;
BEGIN
  SELECT q.chapter_id, q.subject_id INTO v_chapter, v_subject
  FROM public.questions q WHERE q.id = NEW.question_id;
  IF v_chapter IS NULL THEN RETURN NEW; END IF;

  SELECT COUNT(*), COUNT(*) FILTER (WHERE pa.is_correct) INTO v_att, v_cor
  FROM public.practice_attempts pa
  JOIN public.questions q2 ON q2.id = pa.question_id
  WHERE pa.student_id = NEW.student_id AND q2.chapter_id = v_chapter;

  v_acc := CASE WHEN v_att > 0 THEN round((v_cor::numeric / v_att) * 100, 2) ELSE 0 END;
  v_level := CASE
    WHEN v_att = 0 THEN 'not_attempted'
    WHEN v_acc >= 85 THEN 'mastered'
    WHEN v_acc >= 70 THEN 'strong'
    WHEN v_acc >= 50 THEN 'developing'
    WHEN v_acc >= 30 THEN 'weak'
    ELSE 'critical' END;

  INSERT INTO public.topic_mastery
    (student_id, chapter_id, subject_id, mastery_level, mastery_score, accuracy,
     questions_attempted, correct_answers, last_practiced_at, updated_at)
  VALUES
    (NEW.student_id, v_chapter, v_subject, v_level, v_acc, v_acc, v_att, v_cor, now(), now())
  ON CONFLICT (student_id, chapter_id) DO UPDATE SET
    subject_id=EXCLUDED.subject_id, mastery_level=EXCLUDED.mastery_level,
    mastery_score=EXCLUDED.mastery_score, accuracy=EXCLUDED.accuracy,
    questions_attempted=EXCLUDED.questions_attempted, correct_answers=EXCLUDED.correct_answers,
    last_practiced_at=now(), updated_at=now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_topic_mastery ON public.practice_attempts;
CREATE TRIGGER trg_sync_topic_mastery
  AFTER INSERT ON public.practice_attempts
  FOR EACH ROW EXECUTE FUNCTION public.sync_topic_mastery();

-- 5) Row-Level Security ----------------------------------------------------
ALTER TABLE public.exam_attempts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topic_mastery     ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "students_manage_own_exam_attempts" ON public.exam_attempts;
CREATE POLICY "students_manage_own_exam_attempts" ON public.exam_attempts
  FOR ALL TO authenticated USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid());

DROP POLICY IF EXISTS "students_manage_own_practice_attempts" ON public.practice_attempts;
CREATE POLICY "students_manage_own_practice_attempts" ON public.practice_attempts
  FOR ALL TO authenticated USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid());

DROP POLICY IF EXISTS "students_manage_own_topic_mastery" ON public.topic_mastery;
CREATE POLICY "students_manage_own_topic_mastery" ON public.topic_mastery
  FOR ALL TO authenticated USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid());

-- Admins read everything (is_admin() is SECURITY DEFINER → non-recursive).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname='is_admin' AND pronamespace='public'::regnamespace) THEN
    EXECUTE 'DROP POLICY IF EXISTS "admin_read_exam_attempts" ON public.exam_attempts';
    EXECUTE 'CREATE POLICY "admin_read_exam_attempts" ON public.exam_attempts FOR SELECT TO authenticated USING (public.is_admin())';
    EXECUTE 'DROP POLICY IF EXISTS "admin_read_practice_attempts" ON public.practice_attempts';
    EXECUTE 'CREATE POLICY "admin_read_practice_attempts" ON public.practice_attempts FOR SELECT TO authenticated USING (public.is_admin())';
    EXECUTE 'DROP POLICY IF EXISTS "admin_read_topic_mastery" ON public.topic_mastery';
    EXECUTE 'CREATE POLICY "admin_read_topic_mastery" ON public.topic_mastery FOR SELECT TO authenticated USING (public.is_admin())';
  END IF;
END $$;

-- 6) Realtime so the dashboard mastery rings live-update (optional) ---------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname='supabase_realtime') THEN
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.topic_mastery; EXCEPTION WHEN duplicate_object THEN NULL; END;
  END IF;
END $$;
