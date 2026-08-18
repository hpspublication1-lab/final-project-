-- ============================================================
-- Samyak CEE — create the missing FLASHCARDS & DOUBTS tables.
--
-- These tables never existed on this DB (the earlier "grant" idea was
-- wrong — the SQL editor confirms they don't exist). This creates all
-- four (flashcards, flashcard_reviews, doubts, doubt_replies) with the
-- exact columns the app expects, a non-recursive is_pro_user() helper,
-- RLS policies, table grants, and a PostgREST schema reload.
--
-- Paste into: Supabase Dashboard → SQL Editor → Run. Idempotent.
-- ============================================================

-- 0) Non-recursive premium check (SECURITY DEFINER → safe in policies) ------
CREATE OR REPLACE FUNCTION public.is_pro_user()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.id = auth.uid()
      AND up.subscription_plan IN ('student','pro','institution')
      AND (up.subscription_expires_at IS NULL OR up.subscription_expires_at > now())
  );
$$;
GRANT EXECUTE ON FUNCTION public.is_pro_user() TO anon, authenticated;

-- 1) flashcards ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.flashcards (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  chapter_id UUID REFERENCES public.chapters(id) ON DELETE SET NULL,
  front      TEXT NOT NULL,
  back       TEXT NOT NULL,
  hint       TEXT,
  image_url  TEXT,
  is_premium BOOLEAN NOT NULL DEFAULT false,
  is_active  BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_flashcards_subject ON public.flashcards(subject_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_chapter ON public.flashcards(chapter_id);

-- 2) flashcard_reviews (per-student SM-2 state) ---------------------------
CREATE TABLE IF NOT EXISTS public.flashcard_reviews (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id       UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  flashcard_id     UUID NOT NULL REFERENCES public.flashcards(id) ON DELETE CASCADE,
  ease_factor      NUMERIC(4,2) NOT NULL DEFAULT 2.50,
  interval_days    INTEGER NOT NULL DEFAULT 0,
  repetitions      INTEGER NOT NULL DEFAULT 0,
  due_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_grade       INTEGER,
  last_reviewed_at TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, flashcard_id)
);
CREATE INDEX IF NOT EXISTS idx_flashcard_reviews_due ON public.flashcard_reviews(student_id, due_at);

-- 3) doubts ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.doubts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  subject_id    UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  chapter_id    UUID REFERENCES public.chapters(id) ON DELETE SET NULL,
  title         TEXT NOT NULL,
  question_text TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','answered','closed')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_doubts_student ON public.doubts(student_id);

-- 4) doubt_replies ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.doubt_replies (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doubt_id       UUID NOT NULL REFERENCES public.doubts(id) ON DELETE CASCADE,
  user_id        UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  reply_text     TEXT NOT NULL,
  is_staff_reply BOOLEAN NOT NULL DEFAULT false,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_doubt_replies_doubt ON public.doubt_replies(doubt_id);

-- 5) RLS -------------------------------------------------------------------
ALTER TABLE public.flashcards        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcard_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doubts            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doubt_replies     ENABLE ROW LEVEL SECURITY;

-- Flashcards: free cards public; premium require a paid plan; admins manage all.
DROP POLICY IF EXISTS "read_free_flashcards" ON public.flashcards;
CREATE POLICY "read_free_flashcards" ON public.flashcards FOR SELECT TO anon, authenticated
  USING (is_active = true AND is_premium = false);
DROP POLICY IF EXISTS "read_premium_flashcards" ON public.flashcards;
CREATE POLICY "read_premium_flashcards" ON public.flashcards FOR SELECT TO authenticated
  USING (is_active = true AND (is_premium = false OR public.is_pro_user() OR public.is_admin()));
DROP POLICY IF EXISTS "admin_manage_flashcards" ON public.flashcards;
CREATE POLICY "admin_manage_flashcards" ON public.flashcards FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Flashcard reviews: each student manages their own.
DROP POLICY IF EXISTS "students_manage_own_flashcard_reviews" ON public.flashcard_reviews;
CREATE POLICY "students_manage_own_flashcard_reviews" ON public.flashcard_reviews FOR ALL TO authenticated
  USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid());

-- Doubts: students manage their own; admins read/update all.
DROP POLICY IF EXISTS "students_manage_own_doubts" ON public.doubts;
CREATE POLICY "students_manage_own_doubts" ON public.doubts FOR ALL TO authenticated
  USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid());
DROP POLICY IF EXISTS "admin_manage_all_doubts" ON public.doubts;
CREATE POLICY "admin_manage_all_doubts" ON public.doubts FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Doubt replies: visible on your own doubt (or to admins); you can reply to your own.
DROP POLICY IF EXISTS "view_doubt_replies" ON public.doubt_replies;
CREATE POLICY "view_doubt_replies" ON public.doubt_replies FOR SELECT TO authenticated
  USING (public.is_admin() OR EXISTS (SELECT 1 FROM public.doubts d WHERE d.id = doubt_id AND d.student_id = auth.uid()));
DROP POLICY IF EXISTS "insert_doubt_replies" ON public.doubt_replies;
CREATE POLICY "insert_doubt_replies" ON public.doubt_replies FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() OR (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.doubts d WHERE d.id = doubt_id AND d.student_id = auth.uid())));

-- 6) Grants + updated_at triggers + schema reload -------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON public.flashcards        TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.flashcard_reviews TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.doubts           TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.doubt_replies    TO anon, authenticated;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname='update_updated_at_column' AND pronamespace='public'::regnamespace) THEN
    EXECUTE 'DROP TRIGGER IF EXISTS upd_flashcards ON public.flashcards';
    EXECUTE 'CREATE TRIGGER upd_flashcards BEFORE UPDATE ON public.flashcards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()';
    EXECUTE 'DROP TRIGGER IF EXISTS upd_doubts ON public.doubts';
    EXECUTE 'CREATE TRIGGER upd_doubts BEFORE UPDATE ON public.doubts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()';
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
