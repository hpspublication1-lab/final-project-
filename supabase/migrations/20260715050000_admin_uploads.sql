-- Admin Uploads: Storage buckets and content tables
-- Timestamp: 20260715050000

-- ============================================================
-- 1. STORAGE BUCKETS (via insert into storage.buckets)
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('notes-pdfs',       'notes-pdfs',       true,  52428800,  ARRAY['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  ('lecture-videos',   'lecture-videos',   false, 524288000, ARRAY['video/mp4','video/webm','video/ogg','video/quicktime']),
  ('study-materials',  'study-materials',  true,  104857600, ARRAY['application/pdf','image/jpeg','image/png','image/webp','image/gif','application/zip']),
  ('diagrams-images',  'diagrams-images',  true,  10485760,  ARRAY['image/jpeg','image/png','image/webp','image/gif','image/svg+xml']),
  ('live-resources',   'live-resources',   true,  52428800,  ARRAY['application/pdf','image/jpeg','image/png','application/zip'])
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 2. CONTENT TABLES
-- ============================================================

-- Notes (rich text + PDF)
CREATE TABLE IF NOT EXISTS public.notes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id    UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  chapter_id    UUID REFERENCES public.chapters(id) ON DELETE SET NULL,
  title         TEXT NOT NULL,
  content       TEXT,
  pdf_url       TEXT,
  pdf_path      TEXT,
  is_premium    BOOLEAN DEFAULT false,
  is_active     BOOLEAN DEFAULT true,
  created_by    UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Video Lectures
CREATE TABLE IF NOT EXISTS public.video_lectures (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id    UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  chapter_id    UUID REFERENCES public.chapters(id) ON DELETE SET NULL,
  title         TEXT NOT NULL,
  description   TEXT,
  video_url     TEXT,
  video_path    TEXT,
  thumbnail_url TEXT,
  duration_sec  INTEGER DEFAULT 0,
  is_premium    BOOLEAN DEFAULT false,
  is_active     BOOLEAN DEFAULT true,
  created_by    UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Study Materials (PDFs, images, zip bundles)
CREATE TABLE IF NOT EXISTS public.study_materials (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id    UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  chapter_id    UUID REFERENCES public.chapters(id) ON DELETE SET NULL,
  title         TEXT NOT NULL,
  description   TEXT,
  file_url      TEXT NOT NULL,
  file_path     TEXT NOT NULL,
  file_type     TEXT NOT NULL,
  file_size     BIGINT DEFAULT 0,
  material_type TEXT DEFAULT 'general' CHECK (material_type IN ('general','formula_sheet','past_paper','reference','diagram','other')),
  is_premium    BOOLEAN DEFAULT false,
  is_active     BOOLEAN DEFAULT true,
  created_by    UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Live Classes
CREATE TABLE IF NOT EXISTS public.live_classes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id      UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  scheduled_at    TIMESTAMPTZ NOT NULL,
  duration_min    INTEGER DEFAULT 60,
  meeting_url     TEXT,
  recording_url   TEXT,
  recording_path  TEXT,
  resources_urls  JSONB DEFAULT '[]'::jsonb,
  status          TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled','live','completed','cancelled')),
  is_premium      BOOLEAN DEFAULT false,
  created_by      UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 3. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_notes_subject_id       ON public.notes(subject_id);
CREATE INDEX IF NOT EXISTS idx_notes_chapter_id       ON public.notes(chapter_id);
CREATE INDEX IF NOT EXISTS idx_video_lectures_subject ON public.video_lectures(subject_id);
CREATE INDEX IF NOT EXISTS idx_study_materials_subject ON public.study_materials(subject_id);
CREATE INDEX IF NOT EXISTS idx_live_classes_scheduled ON public.live_classes(scheduled_at);

-- ============================================================
-- 4. HELPER FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
$$;

-- ============================================================
-- 5. ENABLE RLS
-- ============================================================

ALTER TABLE public.notes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_lectures  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_classes    ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 6. RLS POLICIES
-- ============================================================

-- NOTES
DROP POLICY IF EXISTS "public_read_notes"  ON public.notes;
CREATE POLICY "public_read_notes" ON public.notes
  FOR SELECT TO public USING (is_active = true);

DROP POLICY IF EXISTS "admin_manage_notes" ON public.notes;
CREATE POLICY "admin_manage_notes" ON public.notes
  FOR ALL TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

-- VIDEO LECTURES
DROP POLICY IF EXISTS "public_read_videos"  ON public.video_lectures;
CREATE POLICY "public_read_videos" ON public.video_lectures
  FOR SELECT TO public USING (is_active = true);

DROP POLICY IF EXISTS "admin_manage_videos" ON public.video_lectures;
CREATE POLICY "admin_manage_videos" ON public.video_lectures
  FOR ALL TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

-- STUDY MATERIALS
DROP POLICY IF EXISTS "public_read_materials"  ON public.study_materials;
CREATE POLICY "public_read_materials" ON public.study_materials
  FOR SELECT TO public USING (is_active = true);

DROP POLICY IF EXISTS "admin_manage_materials" ON public.study_materials;
CREATE POLICY "admin_manage_materials" ON public.study_materials
  FOR ALL TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

-- LIVE CLASSES
DROP POLICY IF EXISTS "public_read_live_classes"  ON public.live_classes;
CREATE POLICY "public_read_live_classes" ON public.live_classes
  FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "admin_manage_live_classes" ON public.live_classes;
CREATE POLICY "admin_manage_live_classes" ON public.live_classes
  FOR ALL TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

-- ============================================================
-- 7. STORAGE RLS POLICIES
-- ============================================================

-- notes-pdfs bucket
DROP POLICY IF EXISTS "public_read_notes_pdfs"  ON storage.objects;
CREATE POLICY "public_read_notes_pdfs" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'notes-pdfs');

DROP POLICY IF EXISTS "admin_upload_notes_pdfs" ON storage.objects;
CREATE POLICY "admin_upload_notes_pdfs" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'notes-pdfs' AND public.is_admin_user());

DROP POLICY IF EXISTS "admin_delete_notes_pdfs" ON storage.objects;
CREATE POLICY "admin_delete_notes_pdfs" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'notes-pdfs' AND public.is_admin_user());

-- lecture-videos bucket
DROP POLICY IF EXISTS "admin_read_lecture_videos"  ON storage.objects;
CREATE POLICY "admin_read_lecture_videos" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'lecture-videos');

DROP POLICY IF EXISTS "admin_upload_lecture_videos" ON storage.objects;
CREATE POLICY "admin_upload_lecture_videos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'lecture-videos' AND public.is_admin_user());

DROP POLICY IF EXISTS "admin_delete_lecture_videos" ON storage.objects;
CREATE POLICY "admin_delete_lecture_videos" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'lecture-videos' AND public.is_admin_user());

-- study-materials bucket
DROP POLICY IF EXISTS "public_read_study_materials"  ON storage.objects;
CREATE POLICY "public_read_study_materials" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'study-materials');

DROP POLICY IF EXISTS "admin_upload_study_materials" ON storage.objects;
CREATE POLICY "admin_upload_study_materials" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'study-materials' AND public.is_admin_user());

DROP POLICY IF EXISTS "admin_delete_study_materials" ON storage.objects;
CREATE POLICY "admin_delete_study_materials" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'study-materials' AND public.is_admin_user());

-- diagrams-images bucket
DROP POLICY IF EXISTS "public_read_diagrams"  ON storage.objects;
CREATE POLICY "public_read_diagrams" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'diagrams-images');

DROP POLICY IF EXISTS "admin_upload_diagrams" ON storage.objects;
CREATE POLICY "admin_upload_diagrams" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'diagrams-images' AND public.is_admin_user());

DROP POLICY IF EXISTS "admin_delete_diagrams" ON storage.objects;
CREATE POLICY "admin_delete_diagrams" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'diagrams-images' AND public.is_admin_user());

-- live-resources bucket
DROP POLICY IF EXISTS "public_read_live_resources"  ON storage.objects;
CREATE POLICY "public_read_live_resources" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'live-resources');

DROP POLICY IF EXISTS "admin_upload_live_resources" ON storage.objects;
CREATE POLICY "admin_upload_live_resources" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'live-resources' AND public.is_admin_user());

DROP POLICY IF EXISTS "admin_delete_live_resources" ON storage.objects;
CREATE POLICY "admin_delete_live_resources" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'live-resources' AND public.is_admin_user());
