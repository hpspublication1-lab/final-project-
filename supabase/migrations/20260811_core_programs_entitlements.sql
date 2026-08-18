-- Core Programs & Feature Entitlements System
-- The backbone that makes "different courses have different features" an
-- actual backend mechanism instead of hardcoded frontend UI.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,                  -- 'cee', 'see', 'english', 'digital'
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('exam-prep','skill-course')),
  icon TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.program_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,   -- feature-specific settings
  UNIQUE (program_id, feature_key)
);

CREATE TABLE IF NOT EXISTS public.enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'trial' CHECK (status IN ('trial','active','expired')),
  plan_tier TEXT NOT NULL DEFAULT 'free' CHECK (plan_tier IN ('free','prebook','paid','premium')),
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  UNIQUE (user_id, program_id)
);

CREATE INDEX IF NOT EXISTS idx_program_features_program ON public.program_features(program_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_user ON public.enrollments(user_id);

ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

-- Programs and their feature flags are public
DROP POLICY IF EXISTS "programs_select_public" ON public.programs;
CREATE POLICY "programs_select_public"
  ON public.programs FOR SELECT TO authenticated, anon
  USING (is_active = true);

DROP POLICY IF EXISTS "program_features_select_public" ON public.program_features;
CREATE POLICY "program_features_select_public"
  ON public.program_features FOR SELECT TO authenticated, anon
  USING (true);

-- Students see and create only their own enrollments
DROP POLICY IF EXISTS "enrollments_select_own" ON public.enrollments;
CREATE POLICY "enrollments_select_own"
  ON public.enrollments FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "enrollments_insert_own" ON public.enrollments;
CREATE POLICY "enrollments_insert_own"
  ON public.enrollments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Seed: All 4 active platform sectors
INSERT INTO public.programs (slug, name, description, category, sort_order) VALUES
  ('cee', 'CEE / Medical Entrance', 'Medical entrance exam preparation (MECEE)', 'exam-prep', 1),
  ('see', 'SEE Grade 10 Board', 'SEE grade 10 board exam written & MCQ preparation', 'exam-prep', 2),
  ('english', 'English & IELTS Mastery', 'IELTS Academic/General & spoken English fluency', 'skill-course', 3),
  ('digital', 'Digital Skills & AI Academy', 'AI prompt engineering, web development, python & automation', 'skill-course', 4)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category;

-- Feature flags per program
INSERT INTO public.program_features (program_id, feature_key, config)
SELECT id, feature_key, '{}'::jsonb
FROM public.programs, unnest(ARRAY[
  'mcq_practice','subjective_practice','battle_arena',
  'video_library','live_classes','mock_tests'
]) AS feature_key
WHERE slug = 'cee'
ON CONFLICT DO NOTHING;

INSERT INTO public.program_features (program_id, feature_key, config)
SELECT id, feature_key, '{}'::jsonb
FROM public.programs, unnest(ARRAY[
  'mcq_practice','subjective_practice','battle_arena',
  'video_library','live_classes','mock_tests'
]) AS feature_key
WHERE slug = 'see'
ON CONFLICT DO NOTHING;

INSERT INTO public.program_features (program_id, feature_key, config)
SELECT id, feature_key, '{}'::jsonb
FROM public.programs, unnest(ARRAY[
  'ielts_writing_evaluator','speaking_simulator','grammar_drills','certificates'
]) AS feature_key
WHERE slug = 'english'
ON CONFLICT DO NOTHING;

INSERT INTO public.program_features (program_id, feature_key, config)
SELECT id, feature_key, '{}'::jsonb
FROM public.programs, unnest(ARRAY[
  'ai_prompt_studio','python_runner','project_submissions','certificates'
]) AS feature_key
WHERE slug = 'digital'
ON CONFLICT DO NOTHING;
