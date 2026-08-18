-- ============================================================
-- Batches / Courses Module (Physics-Wallah-style structured courses)
-- Timestamp: 20260721000000
-- ============================================================

-- 1. Batches table
CREATE TABLE IF NOT EXISTS public.batches (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,
  description     TEXT,
  subject_id      UUID REFERENCES public.subjects(id) ON DELETE SET NULL, -- NULL = all-subjects / full batch
  cee_year        INTEGER,
  instructor_name TEXT,
  thumbnail_url   TEXT,
  start_date      DATE,
  end_date        DATE,
  price_npr       INTEGER NOT NULL DEFAULT 0,
  is_premium      BOOLEAN NOT NULL DEFAULT false,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_by      UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_batches_subject_id ON public.batches(subject_id);
CREATE INDEX IF NOT EXISTS idx_batches_cee_year ON public.batches(cee_year);
CREATE INDEX IF NOT EXISTS idx_batches_is_active ON public.batches(is_active);

DROP TRIGGER IF EXISTS update_batches_updated_at ON public.batches;
CREATE TRIGGER update_batches_updated_at
  BEFORE UPDATE ON public.batches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Batch enrollments
CREATE TABLE IF NOT EXISTS public.batch_enrollments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id      UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  student_id    UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  enrolled_at   TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(batch_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_batch_enrollments_batch_id ON public.batch_enrollments(batch_id);
CREATE INDEX IF NOT EXISTS idx_batch_enrollments_student_id ON public.batch_enrollments(student_id);

-- 3. Link existing content tables to batches (nullable — content can exist
--    outside of any batch, exactly like it does today)
ALTER TABLE public.live_classes   ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES public.batches(id) ON DELETE SET NULL;
ALTER TABLE public.video_lectures ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES public.batches(id) ON DELETE SET NULL;
ALTER TABLE public.notes          ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES public.batches(id) ON DELETE SET NULL;
ALTER TABLE public.exams          ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES public.batches(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_live_classes_batch_id   ON public.live_classes(batch_id);
CREATE INDEX IF NOT EXISTS idx_video_lectures_batch_id ON public.video_lectures(batch_id);
CREATE INDEX IF NOT EXISTS idx_notes_batch_id           ON public.notes(batch_id);
CREATE INDEX IF NOT EXISTS idx_exams_batch_id           ON public.exams(batch_id);

-- 4. RLS
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_enrollments ENABLE ROW LEVEL SECURITY;

-- Batches: publicly browsable (like subjects/chapters/exams), admin-managed.
-- Matches the same two-tier pattern used for questions/exams: anonymous
-- visitors only see free batches, any signed-in user can see premium ones too
-- (premium is a soft paywall today, same as the rest of the app).
DROP POLICY IF EXISTS "public_read_free_batches" ON public.batches;
CREATE POLICY "public_read_free_batches"
ON public.batches FOR SELECT TO public
USING (is_active = true AND is_premium = false);

DROP POLICY IF EXISTS "auth_read_all_active_batches" ON public.batches;
CREATE POLICY "auth_read_all_active_batches"
ON public.batches FOR SELECT TO authenticated
USING (is_active = true);

DROP POLICY IF EXISTS "admin_manage_batches" ON public.batches;
CREATE POLICY "admin_manage_batches"
ON public.batches FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Batch enrollments: students see/manage only their own rows, admin sees all
DROP POLICY IF EXISTS "students_manage_own_enrollments" ON public.batch_enrollments;
CREATE POLICY "students_manage_own_enrollments"
ON public.batch_enrollments FOR ALL TO authenticated
USING (student_id = auth.uid())
WITH CHECK (student_id = auth.uid());

DROP POLICY IF EXISTS "admin_read_all_enrollments" ON public.batch_enrollments;
CREATE POLICY "admin_read_all_enrollments"
ON public.batch_enrollments FOR SELECT TO authenticated
USING (public.is_admin());

-- 5. Seed a couple of demo batches so the feature isn't empty on first load
DO $$
DECLARE
  bio_id UUID;
  chem_id UUID;
BEGIN
  SELECT id INTO bio_id FROM public.subjects WHERE name = 'biology' LIMIT 1;
  SELECT id INTO chem_id FROM public.subjects WHERE name = 'chemistry' LIMIT 1;

  INSERT INTO public.batches (title, slug, description, subject_id, cee_year, instructor_name, price_npr, is_premium, is_active)
  VALUES
    ('Target CEE 2026 — Full Batch', 'target-cee-2026-full', 'Complete CEE preparation covering Biology, Chemistry, Physics and Mental Agility with live classes, notes, and weekly mock tests.', NULL, 2026, 'Samyak Faculty Team', 4999, true, true),
    ('Biology Crash Course 2026', 'biology-crash-course-2026', 'Fast-paced revision of high-yield Biology chapters with daily practice sets.', bio_id, 2026, 'Dr. Sunita Poudel', 1499, true, true),
    ('Chemistry Foundation (Free)', 'chemistry-foundation-free', 'Free introductory batch covering atomic structure, bonding, and basic organic chemistry.', chem_id, 2027, 'Samyak Faculty Team', 0, false, true)
  ON CONFLICT (slug) DO NOTHING;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Batch seed failed: %', SQLERRM;
END $$;
