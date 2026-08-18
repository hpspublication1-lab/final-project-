-- v2 hardening for Digital & AI Academy + English/IELTS backend.

-- ============================================================
-- 1. Digital Track Modules & Progress
-- ============================================================

CREATE TABLE IF NOT EXISTS public.digital_track_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_slug TEXT NOT NULL DEFAULT 'prompt-engineering',
  title TEXT NOT NULL,
  description TEXT,
  order_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.digital_track_modules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "digital_track_modules_public" ON public.digital_track_modules;
CREATE POLICY "digital_track_modules_public"
  ON public.digital_track_modules FOR SELECT TO authenticated, anon USING (true);

CREATE TABLE IF NOT EXISTS public.digital_track_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  track_slug TEXT NOT NULL DEFAULT 'prompt-engineering',
  modules_completed INT NOT NULL DEFAULT 0,
  percent_complete NUMERIC(5,2) NOT NULL DEFAULT 0,
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, track_slug)
);

ALTER TABLE public.digital_track_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "digital_progress_owner_select" ON public.digital_track_progress;
CREATE POLICY "digital_progress_owner_select"
  ON public.digital_track_progress FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.digital_module_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.digital_track_modules(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_id)
);

CREATE INDEX IF NOT EXISTS idx_module_completions_user ON public.digital_module_completions(user_id);
ALTER TABLE public.digital_module_completions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "module_completions_owner" ON public.digital_module_completions;
CREATE POLICY "module_completions_owner"
  ON public.digital_module_completions FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.digital_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  track_slug TEXT NOT NULL DEFAULT 'prompt-engineering',
  certificate_code TEXT NOT NULL UNIQUE,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, track_slug)
);

ALTER TABLE public.digital_certificates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "digital_certificates_owner" ON public.digital_certificates;
CREATE POLICY "digital_certificates_owner"
  ON public.digital_certificates FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- 2. Prompt engineering attempts table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.digital_prompt_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  prompt_text TEXT NOT NULL,
  ai_output TEXT,
  prompt_score NUMERIC(5,2),
  score_breakdown JSONB,
  improved_prompt TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prompt_attempts_user
  ON public.digital_prompt_attempts(user_id, created_at DESC);

ALTER TABLE public.digital_prompt_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "prompt_attempts_owner_select" ON public.digital_prompt_attempts;
CREATE POLICY "prompt_attempts_owner_select"
  ON public.digital_prompt_attempts FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "prompt_attempts_owner_insert" ON public.digital_prompt_attempts;
CREATE POLICY "prompt_attempts_owner_insert"
  ON public.digital_prompt_attempts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 3. English practice modules
-- ============================================================

CREATE TABLE IF NOT EXISTS public.english_modules (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT
);

ALTER TABLE public.english_modules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "english_modules_public" ON public.english_modules;
CREATE POLICY "english_modules_public" ON public.english_modules FOR SELECT TO authenticated, anon USING (true);

INSERT INTO public.english_modules (slug, title, description) VALUES
  ('writing', 'IELTS Writing', 'Task 1 & Task 2 academic essay writing'),
  ('speaking', 'IELTS Speaking', 'Part 1, Part 2 Cue Card & Part 3 Discussion'),
  ('grammar', 'Grammar Drills', 'Advanced English grammar & sentence structure')
ON CONFLICT (slug) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.english_task_types (
  slug TEXT PRIMARY KEY,
  module_slug TEXT NOT NULL REFERENCES public.english_modules(slug),
  title TEXT NOT NULL,
  instructions TEXT,
  criteria JSONB NOT NULL DEFAULT '[]'::jsonb,
  target_word_count INT,
  time_limit_minutes INT
);

ALTER TABLE public.english_task_types ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "english_task_types_select_public" ON public.english_task_types;
CREATE POLICY "english_task_types_select_public"
  ON public.english_task_types FOR SELECT TO authenticated, anon USING (true);

INSERT INTO public.english_task_types (slug, module_slug, title, instructions, criteria, target_word_count, time_limit_minutes) VALUES
  ('writing-task-1', 'writing', 'Writing Task 1',
   'Describe the visual information in your own words. Do not give opinions.',
   '["Task Achievement","Coherence and Cohesion","Lexical Resource","Grammatical Range and Accuracy"]'::jsonb, 150, 20),
  ('writing-task-2', 'writing', 'Writing Task 2',
   'Write an essay responding to the argument. State and support a clear position.',
   '["Task Response","Coherence and Cohesion","Lexical Resource","Grammatical Range and Accuracy"]'::jsonb, 250, 40),
  ('speaking-part-2', 'speaking', 'Speaking Part 2 (Cue Card)',
   'Speak for 1-2 minutes on the topic after 1 minute of preparation.',
   '["Fluency and Coherence","Lexical Resource","Grammatical Range and Accuracy","Pronunciation"]'::jsonb, null, 2),
  ('grammar-drill', 'grammar', 'Grammar Drill',
   'Rewrite the sentence correctly and explain the rule you applied.',
   '["Grammatical Accuracy","Rule Understanding"]'::jsonb, null, 5)
ON CONFLICT (slug) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.english_practice_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  task_type_slug TEXT REFERENCES public.english_task_types(slug),
  prompt_text TEXT NOT NULL,
  response_text TEXT NOT NULL,
  band_score NUMERIC(3,1),
  rubric_scores JSONB,
  feedback TEXT,
  weakest_criterion TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.english_practice_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "english_attempts_owner" ON public.english_practice_attempts;
CREATE POLICY "english_attempts_owner"
  ON public.english_practice_attempts FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
