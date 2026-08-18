-- ============================================================
-- Doubt-Solving Module (ask a question, teachers/admins answer)
-- Timestamp: 20260721010000
-- ============================================================

-- 1. Helper: is the current user staff (can answer doubts)?
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role IN ('admin', 'teacher', 'content_reviewer')
  )
$$;

-- 2. Doubts table
CREATE TABLE IF NOT EXISTS public.doubts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  subject_id    UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  chapter_id    UUID REFERENCES public.chapters(id) ON DELETE SET NULL,
  title         TEXT NOT NULL,
  question_text TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'answered', 'closed')),
  created_at    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_doubts_student_id ON public.doubts(student_id);
CREATE INDEX IF NOT EXISTS idx_doubts_status ON public.doubts(status);
CREATE INDEX IF NOT EXISTS idx_doubts_subject_id ON public.doubts(subject_id);

DROP TRIGGER IF EXISTS update_doubts_updated_at ON public.doubts;
CREATE TRIGGER update_doubts_updated_at
  BEFORE UPDATE ON public.doubts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Doubt replies
CREATE TABLE IF NOT EXISTS public.doubt_replies (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doubt_id        UUID NOT NULL REFERENCES public.doubts(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  reply_text      TEXT NOT NULL,
  is_staff_reply  BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_doubt_replies_doubt_id ON public.doubt_replies(doubt_id);

-- 4. RLS
ALTER TABLE public.doubts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doubt_replies ENABLE ROW LEVEL SECURITY;

-- Doubts: students manage their own; staff can read/update all
DROP POLICY IF EXISTS "students_manage_own_doubts" ON public.doubts;
CREATE POLICY "students_manage_own_doubts"
ON public.doubts FOR ALL TO authenticated
USING (student_id = auth.uid())
WITH CHECK (student_id = auth.uid());

DROP POLICY IF EXISTS "staff_read_all_doubts" ON public.doubts;
CREATE POLICY "staff_read_all_doubts"
ON public.doubts FOR SELECT TO authenticated
USING (public.is_staff());

DROP POLICY IF EXISTS "staff_update_all_doubts" ON public.doubts;
CREATE POLICY "staff_update_all_doubts"
ON public.doubts FOR UPDATE TO authenticated
USING (public.is_staff())
WITH CHECK (public.is_staff());

-- Doubt replies: student can read/insert replies on their own doubt; staff can
-- read/insert replies on any doubt
DROP POLICY IF EXISTS "students_view_own_doubt_replies" ON public.doubt_replies;
CREATE POLICY "students_view_own_doubt_replies"
ON public.doubt_replies FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.doubts d WHERE d.id = doubt_id AND d.student_id = auth.uid())
  OR public.is_staff()
);

DROP POLICY IF EXISTS "students_reply_own_doubts" ON public.doubt_replies;
CREATE POLICY "students_reply_own_doubts"
ON public.doubt_replies FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND (
    EXISTS (SELECT 1 FROM public.doubts d WHERE d.id = doubt_id AND d.student_id = auth.uid())
    OR public.is_staff()
  )
);

-- 5. Staff (admin/teacher/content_reviewer) need to see which student asked
--    each doubt. The existing "admin_full_access_user_profiles" policy only
--    covers auth.users-metadata admins, so add a read-only policy for the
--    broader staff role set (additive — doesn't remove any existing access).
DROP POLICY IF EXISTS "staff_read_all_user_profiles" ON public.user_profiles;
CREATE POLICY "staff_read_all_user_profiles"
ON public.user_profiles FOR SELECT TO authenticated
USING (public.is_staff());

-- Note: live updates for new replies use Supabase's postgres_changes
-- subscriptions (same pattern as the notifications bell in DashboardLayout),
-- which are already scoped correctly by the RLS policies above — no
-- additional realtime.messages broadcast setup is needed for this feature.
