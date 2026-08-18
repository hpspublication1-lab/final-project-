-- Migration: 20260811_see_subjective.sql
-- Subjective (Marks-Based) Question Bank and AI Answer Evaluation for SEE Class 10 written exams.

-- 1. Subjective Questions Table
CREATE TABLE IF NOT EXISTS public.subjective_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program TEXT NOT NULL DEFAULT 'see',
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  chapter_id UUID REFERENCES public.chapters(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  chapter TEXT NOT NULL,
  question_text TEXT NOT NULL,
  marks INTEGER NOT NULL DEFAULT 4,
  suggested_time_minutes INTEGER DEFAULT 10,
  sample_solution TEXT NOT NULL,
  rubric JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. Subjective Evaluations / Submissions Table
CREATE TABLE IF NOT EXISTS public.subjective_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.subjective_questions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  image_url TEXT,
  extracted_text TEXT,
  obtained_marks NUMERIC(4, 2) NOT NULL,
  total_marks NUMERIC(4, 2) NOT NULL,
  percentage NUMERIC(5, 2),
  feedback TEXT NOT NULL,
  rubric_breakdown JSONB DEFAULT '[]'::jsonb,
  suggestions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Indexes for fast query lookup
CREATE INDEX IF NOT EXISTS idx_subjective_questions_program ON public.subjective_questions(program);
CREATE INDEX IF NOT EXISTS idx_subjective_questions_subject ON public.subjective_questions(subject);
CREATE INDEX IF NOT EXISTS idx_subjective_questions_chapter ON public.subjective_questions(chapter);
CREATE INDEX IF NOT EXISTS idx_subjective_evaluations_user ON public.subjective_evaluations(user_id);
CREATE INDEX IF NOT EXISTS idx_subjective_evaluations_question ON public.subjective_evaluations(question_id);

-- 4. Enable RLS
ALTER TABLE public.subjective_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjective_evaluations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subjective_questions
DROP POLICY IF EXISTS "Subjective questions read for all users" ON public.subjective_questions;
CREATE POLICY "Subjective questions read for all users"
  ON public.subjective_questions FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Subjective questions admin write" ON public.subjective_questions;
CREATE POLICY "Subjective questions admin write"
  ON public.subjective_questions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = auth.uid() AND is_admin = true
    )
  );

-- RLS Policies for subjective_evaluations
DROP POLICY IF EXISTS "Users can read own subjective evaluations" ON public.subjective_evaluations;
CREATE POLICY "Users can read own subjective evaluations"
  ON public.subjective_evaluations FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own subjective evaluations" ON public.subjective_evaluations;
CREATE POLICY "Users can insert own subjective evaluations"
  ON public.subjective_evaluations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 5. Storage bucket for handwritten answer uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('subjective-answers', 'subjective-answers', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for storage bucket
DROP POLICY IF EXISTS "Users upload own handwritten answers" ON storage.objects;
CREATE POLICY "Users upload own handwritten answers"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'subjective-answers' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users read own handwritten answers" ON storage.objects;
CREATE POLICY "Users read own handwritten answers"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'subjective-answers' AND auth.uid()::text = (storage.foldername(name))[1]);
