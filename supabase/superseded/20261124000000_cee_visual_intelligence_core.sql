-- ============================================================================
-- Samyak Guru — CEE Visual Intelligence Core Schema
-- Migration: 20261124000000_cee_visual_intelligence_core.sql
-- Status: Additive, Non-Destructive Schema with Scoped Program Isolation
-- ============================================================================

-- 1. PROGRAM REGISTRY & OFFICIAL SYLLABI
CREATE TABLE IF NOT EXISTS public.cee_exam_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cee_syllabus_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES public.cee_exam_programs(id) ON DELETE RESTRICT,
  label TEXT NOT NULL,
  source_url TEXT,
  source_hash CHAR(64),
  effective_date DATE NOT NULL,
  verified_at TIMESTAMPTZ,
  verified_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(program_id, label)
);

CREATE TABLE IF NOT EXISTS public.cee_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  color TEXT,
  icon TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. CURRICULUM HIERARCHY & OBJECTIVES
CREATE TABLE IF NOT EXISTS public.cee_curriculum_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  syllabus_version_id UUID NOT NULL REFERENCES public.cee_syllabus_versions(id) ON DELETE RESTRICT,
  subject_id UUID NOT NULL REFERENCES public.cee_subjects(id) ON DELETE RESTRICT,
  parent_id UUID REFERENCES public.cee_curriculum_nodes(id) ON DELETE RESTRICT,
  node_type TEXT NOT NULL CHECK (node_type IN ('CHAPTER', 'TOPIC', 'SUBTOPIC')),
  title TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cee_learning_objectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id UUID NOT NULL REFERENCES public.cee_curriculum_nodes(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. VISUAL ASSETS & VERSIONED MANIFESTS
CREATE TABLE IF NOT EXISTS public.cee_visual_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('MODEL_3D', 'DIAGRAM_2D', 'ANIMATION_2D', 'VIDEO', 'SIMULATION')),
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cee_asset_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES public.cee_visual_assets(id) ON DELETE RESTRICT,
  version_number INT NOT NULL CHECK (version_number > 0),
  storage_key TEXT NOT NULL UNIQUE,
  checksum_sha256 CHAR(64) NOT NULL,
  manifest_json JSONB NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('QUARANTINED', 'SCANNING', 'VALIDATED', 'APPROVED', 'REJECTED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(asset_id, version_number)
);

CREATE TABLE IF NOT EXISTS public.cee_asset_hotspots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_version_id UUID NOT NULL REFERENCES public.cee_asset_versions(id) ON DELETE CASCADE,
  hotspot_key TEXT NOT NULL,
  target_node TEXT,
  position_json JSONB NOT NULL,
  label TEXT NOT NULL,
  explanation TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cee_animation_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_version_id UUID NOT NULL REFERENCES public.cee_asset_versions(id) ON DELETE CASCADE,
  sequence_key TEXT NOT NULL,
  timeline_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. LESSONS, REVISIONS & MAPPINGS
CREATE TABLE IF NOT EXISTS public.cee_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cee_lesson_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES public.cee_lessons(id) ON DELETE RESTRICT,
  revision_number INT NOT NULL CHECK (revision_number > 0),
  content_json JSONB NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('DRAFT', 'IN_REVIEW', 'APPROVED', 'PUBLISHED', 'SUPERSEDED', 'ARCHIVED')),
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(lesson_id, revision_number)
);

CREATE TABLE IF NOT EXISTS public.cee_lesson_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES public.cee_lessons(id) ON DELETE CASCADE,
  curriculum_node_id UUID NOT NULL REFERENCES public.cee_curriculum_nodes(id) ON DELETE CASCADE,
  approved_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(lesson_id, curriculum_node_id)
);

CREATE TABLE IF NOT EXISTS public.cee_lesson_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_revision_id UUID NOT NULL REFERENCES public.cee_lesson_revisions(id) ON DELETE CASCADE,
  asset_version_id UUID NOT NULL REFERENCES public.cee_asset_versions(id) ON DELETE RESTRICT,
  sort_order INT NOT NULL DEFAULT 0,
  UNIQUE(lesson_revision_id, asset_version_id)
);

-- 5. ACADEMIC REVIEWS & IMMUTABLE PUBLICATIONS
CREATE TABLE IF NOT EXISTS public.cee_review_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  revision_id UUID NOT NULL REFERENCES public.cee_lesson_revisions(id) ON DELETE CASCADE,
  reviewer_id UUID,
  review_type TEXT NOT NULL DEFAULT 'ACADEMIC_EXPERT' CHECK (review_type IN ('ACADEMIC_EXPERT', 'SCIENTIFIC', 'VISUAL', 'RIGHTS_ACCESSIBILITY')),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'CHANGES_REQUESTED')),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cee_review_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.cee_review_requests(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL,
  decision TEXT NOT NULL CHECK (decision IN ('APPROVED', 'CHANGES_REQUESTED')),
  comments TEXT,
  reviewed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cee_publications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES public.cee_lessons(id) ON DELETE RESTRICT,
  lesson_revision_id UUID NOT NULL REFERENCES public.cee_lesson_revisions(id) ON DELETE RESTRICT,
  published_by UUID NOT NULL,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  superseded_at TIMESTAMPTZ
);

-- 6. STUDENT PROGRESS & TELEMETRY
CREATE TABLE IF NOT EXISTS public.cee_student_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  lesson_id UUID NOT NULL REFERENCES public.cee_lessons(id) ON DELETE RESTRICT,
  publication_id UUID NOT NULL REFERENCES public.cee_publications(id) ON DELETE RESTRICT,
  completion_percentage INT NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, publication_id)
);

CREATE TABLE IF NOT EXISTS public.cee_player_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL UNIQUE,
  student_id UUID NOT NULL,
  publication_id UUID NOT NULL REFERENCES public.cee_publications(id) ON DELETE RESTRICT,
  asset_version_id UUID NOT NULL REFERENCES public.cee_asset_versions(id) ON DELETE RESTRICT,
  type TEXT NOT NULL,
  metadata JSONB,
  occurred_at TIMESTAMPTZ NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. PERFORMANCE & ISOLATION INDEXES
CREATE INDEX IF NOT EXISTS idx_cee_curriculum_parent ON public.cee_curriculum_nodes(parent_id);
CREATE INDEX IF NOT EXISTS idx_cee_curriculum_subject ON public.cee_curriculum_nodes(subject_id);
CREATE INDEX IF NOT EXISTS idx_cee_curriculum_syllabus ON public.cee_curriculum_nodes(syllabus_version_id);
CREATE INDEX IF NOT EXISTS idx_cee_lesson_mappings_node ON public.cee_lesson_mappings(curriculum_node_id);
CREATE INDEX IF NOT EXISTS idx_cee_publications_lesson ON public.cee_publications(lesson_id);
CREATE INDEX IF NOT EXISTS idx_cee_publications_superseded ON public.cee_publications(superseded_at);
CREATE INDEX IF NOT EXISTS idx_cee_progress_student ON public.cee_student_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_cee_events_student ON public.cee_player_events(student_id, publication_id);

-- 8. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.cee_exam_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cee_syllabus_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cee_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cee_curriculum_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cee_learning_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cee_visual_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cee_asset_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cee_asset_hotspots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cee_animation_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cee_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cee_lesson_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cee_lesson_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cee_lesson_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cee_review_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cee_review_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cee_publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cee_student_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cee_player_events ENABLE ROW LEVEL SECURITY;

-- Public & Student read policies for published curriculum
CREATE POLICY "Public read cee_exam_programs" ON public.cee_exam_programs FOR SELECT USING (active = true);
CREATE POLICY "Public read cee_syllabus_versions" ON public.cee_syllabus_versions FOR SELECT USING (verified_at IS NOT NULL);
CREATE POLICY "Public read cee_subjects" ON public.cee_subjects FOR SELECT USING (true);
CREATE POLICY "Public read cee_curriculum_nodes" ON public.cee_curriculum_nodes FOR SELECT USING (true);
CREATE POLICY "Public read cee_learning_objectives" ON public.cee_learning_objectives FOR SELECT USING (true);
CREATE POLICY "Public read cee_publications" ON public.cee_publications FOR SELECT USING (superseded_at IS NULL);

-- Published lessons & asset read policies for authenticated students
CREATE POLICY "Students read published cee_lessons" ON public.cee_lessons FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.cee_publications p WHERE p.lesson_id = cee_lessons.id AND p.superseded_at IS NULL)
);

CREATE POLICY "Students read published cee_lesson_revisions" ON public.cee_lesson_revisions FOR SELECT USING (
  status = 'PUBLISHED'
);

CREATE POLICY "Students read approved cee_asset_versions" ON public.cee_asset_versions FOR SELECT USING (
  status = 'APPROVED'
);

CREATE POLICY "Students read cee_asset_hotspots" ON public.cee_asset_hotspots FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.cee_asset_versions av WHERE av.id = cee_asset_hotspots.asset_version_id AND av.status = 'APPROVED')
);

CREATE POLICY "Students read cee_animation_sequences" ON public.cee_animation_sequences FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.cee_asset_versions av WHERE av.id = cee_animation_sequences.asset_version_id AND av.status = 'APPROVED')
);

CREATE POLICY "Students manage own cee_student_progress" ON public.cee_student_progress
  FOR ALL USING (auth.uid() = student_id) WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students insert own cee_player_events" ON public.cee_player_events
  FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students view own cee_player_events" ON public.cee_player_events
  FOR SELECT USING (auth.uid() = student_id);

-- 9. INITIAL SEED: CEE PROGRAM & HUMAN HEART TOPIC
INSERT INTO public.cee_exam_programs (code, name, active)
VALUES ('CEE_ME_NEPAL', 'Nepal Medical Education Commission Common Entrance Examination (CEE)', true)
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.cee_subjects (code, name, color, icon, sort_order)
VALUES
  ('BIO_ZOO', 'Biology — Zoology', 'text-emerald-500', 'Fish', 10),
  ('BIO_BOT', 'Biology — Botany', 'text-teal-500', 'Leaf', 20),
  ('CHEM', 'Chemistry', 'text-amber-500', 'FlaskConical', 30),
  ('PHYS', 'Physics', 'text-blue-500', 'Atom', 40),
  ('MAT', 'Mental Agility Test (MAT)', 'text-purple-500', 'Brain', 50)
ON CONFLICT (code) DO NOTHING;
