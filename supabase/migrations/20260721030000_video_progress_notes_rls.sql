-- ============================================================
-- Migration: video watch-progress, video notes, messages RLS
-- tightening, and demo content seed for Lecture Videos / Live Classes
-- Timestamp: 20260721030000
-- ============================================================

-- ============================================================
-- 1. Video watch progress (per-student, per-video)
--    Backs the "watched / in-progress / completed" state and
--    progress bars on the Lecture Videos page. Previously this was
--    only ever kept in React state and reset to 0 on every refresh.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.video_watch_progress (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  video_id        UUID NOT NULL REFERENCES public.video_lectures(id) ON DELETE CASCADE,
  watched_seconds INTEGER NOT NULL DEFAULT 0,
  is_completed    BOOLEAN NOT NULL DEFAULT false,
  last_watched_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, video_id)
);

CREATE INDEX IF NOT EXISTS idx_video_watch_progress_student ON public.video_watch_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_video_watch_progress_video   ON public.video_watch_progress(video_id);

ALTER TABLE public.video_watch_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "students_manage_own_watch_progress" ON public.video_watch_progress;
CREATE POLICY "students_manage_own_watch_progress"
ON public.video_watch_progress FOR ALL TO authenticated
USING (student_id = auth.uid())
WITH CHECK (student_id = auth.uid());

-- ============================================================
-- 2. Video notes (per-student, timestamped, per-video)
--    Backs the "Add Note" feature in the video player. Previously
--    these lived only in React state and vanished on refresh.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.video_notes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  video_id      UUID NOT NULL REFERENCES public.video_lectures(id) ON DELETE CASCADE,
  timestamp_sec INTEGER NOT NULL DEFAULT 0,
  note_text     TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_video_notes_student_video ON public.video_notes(student_id, video_id);

ALTER TABLE public.video_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "students_manage_own_video_notes" ON public.video_notes;
CREATE POLICY "students_manage_own_video_notes"
ON public.video_notes FOR ALL TO authenticated
USING (student_id = auth.uid())
WITH CHECK (student_id = auth.uid());

-- ============================================================
-- 3. Tighten public.messages SELECT RLS.
--    Previously "messages_select_authenticated" allowed ANY signed-in
--    user to read every row in the messages table directly
--    (USING (true)) — even though the Realtime *broadcast channel*
--    is already correctly scoped via is_room_member(). That gap meant
--    a user could bypass channel scoping by querying the table
--    directly and read another pair's battle-room chat (including the
--    __battle_progress__ score-tracking pings). Live classes, by
--    design, are open-enrollment — any authenticated student should
--    be able to read that room's chat — so the replacement policy
--    allows both cases explicitly instead of a blanket USING (true).
-- ============================================================

-- room_id is stored as TEXT (it holds either a battle_rooms.id or a
-- live_classes.id). safe_uuid() lets the RLS expression cast it
-- without ever throwing (and failing the whole query) if a future
-- caller stores a non-UUID value there.
CREATE OR REPLACE FUNCTION public.safe_uuid(p_text TEXT)
RETURNS UUID
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN p_text::uuid;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$;

DROP POLICY IF EXISTS "messages_select_authenticated" ON public.messages;
DROP POLICY IF EXISTS "messages_select_scoped" ON public.messages;
CREATE POLICY "messages_select_scoped"
ON public.messages
FOR SELECT
TO authenticated
USING (
  public.is_room_member(public.safe_uuid(room_id))
  OR EXISTS (
    SELECT 1 FROM public.live_classes lc WHERE lc.id = public.safe_uuid(room_id)
  )
);

-- ============================================================
-- 4. Seed a handful of real, honest demo rows so Lecture Videos and
--    Live Classes aren't empty on first load. No fake video/meeting
--    URLs are set — admins attach real files via /admin/uploads at
--    any time; until then the UI shows a clear "not uploaded yet"
--    state instead of pretending media exists. Only runs if the
--    tables are still completely empty, so it never clutters real
--    admin-entered content.
-- ============================================================
DO $$
DECLARE
  bio_id UUID; chem_id UUID; phys_id UUID; ma_id UUID;
  ch_id UUID;
BEGIN
  IF (SELECT COUNT(*) FROM public.video_lectures) = 0 THEN
    SELECT id INTO bio_id  FROM public.subjects WHERE name = 'biology';
    SELECT id INTO chem_id FROM public.subjects WHERE name = 'chemistry';
    SELECT id INTO phys_id FROM public.subjects WHERE name = 'physics';
    SELECT id INTO ma_id   FROM public.subjects WHERE name = 'mental_agility';

    IF bio_id IS NOT NULL THEN
      SELECT id INTO ch_id FROM public.chapters WHERE subject_id = bio_id AND chapter_number = 1;
      INSERT INTO public.video_lectures (subject_id, chapter_id, title, description, duration_sec, is_premium, is_active) VALUES
        (bio_id, ch_id, 'Introduction to Cell Structure', 'Prokaryotic vs eukaryotic cells, organelles, and their functions.', 1800, false, true),
        (bio_id, ch_id, 'Mitosis — Step by Step', 'All phases of mitosis with CEE-pattern MCQs.', 2200, false, true);

      SELECT id INTO ch_id FROM public.chapters WHERE subject_id = bio_id AND chapter_number = 2;
      INSERT INTO public.video_lectures (subject_id, chapter_id, title, description, duration_sec, is_premium, is_active) VALUES
        (bio_id, ch_id, 'Mendel''s Laws of Inheritance', 'Monohybrid and dihybrid crosses with Punnett squares.', 2600, true, true);
    END IF;

    IF chem_id IS NOT NULL THEN
      SELECT id INTO ch_id FROM public.chapters WHERE subject_id = chem_id AND chapter_number = 1;
      INSERT INTO public.video_lectures (subject_id, chapter_id, title, description, duration_sec, is_premium, is_active) VALUES
        (chem_id, ch_id, 'Bohr Model & Quantum Numbers', 'Bohr atomic model, quantum numbers, and electronic configuration.', 2100, false, true),
        (chem_id, ch_id, 'Periodic Table Trends', 'Ionization energy, electronegativity, and atomic radius trends.', 1900, false, true);

      SELECT id INTO ch_id FROM public.chapters WHERE subject_id = chem_id AND chapter_number = 2;
      INSERT INTO public.video_lectures (subject_id, chapter_id, title, description, duration_sec, is_premium, is_active) VALUES
        (chem_id, ch_id, 'Ionic vs Covalent Bonds', 'Types of chemical bonds, Lewis structures, and VSEPR theory.', 2000, false, true);
    END IF;

    IF phys_id IS NOT NULL THEN
      SELECT id INTO ch_id FROM public.chapters WHERE subject_id = phys_id AND chapter_number = 1;
      INSERT INTO public.video_lectures (subject_id, chapter_id, title, description, duration_sec, is_premium, is_active) VALUES
        (phys_id, ch_id, 'Newton''s Laws of Motion', 'All three of Newton''s laws with derivations and real-world applications.', 2600, false, true);

      SELECT id INTO ch_id FROM public.chapters WHERE subject_id = phys_id AND chapter_number = 2;
      INSERT INTO public.video_lectures (subject_id, chapter_id, title, description, duration_sec, is_premium, is_active) VALUES
        (phys_id, ch_id, 'Laws of Motion — Problem Solving', 'Friction, circular motion, and CEE-pattern numericals.', 2400, true, true);
    END IF;

    IF ma_id IS NOT NULL THEN
      INSERT INTO public.video_lectures (subject_id, chapter_id, title, description, duration_sec, is_premium, is_active) VALUES
        (ma_id, NULL, 'Number Series Patterns', 'Arithmetic, geometric, and Fibonacci series with shortcut techniques.', 1500, false, true);
    END IF;
  END IF;

  IF (SELECT COUNT(*) FROM public.live_classes) = 0 THEN
    SELECT id INTO bio_id  FROM public.subjects WHERE name = 'biology';
    SELECT id INTO chem_id FROM public.subjects WHERE name = 'chemistry';
    SELECT id INTO phys_id FROM public.subjects WHERE name = 'physics';
    SELECT id INTO ma_id   FROM public.subjects WHERE name = 'mental_agility';

    INSERT INTO public.live_classes (subject_id, title, description, scheduled_at, duration_min, status, is_premium) VALUES
      (bio_id,  'Cell Division & Mitosis — Live Q&A',        'Live walkthrough of all mitosis phases with real-time doubt clearing.', CURRENT_TIMESTAMP - INTERVAL '15 minutes', 90, 'live',      false),
      (chem_id, 'Organic Mechanisms Deep Dive',                'SN1, SN2, E1, E2 mechanisms with arrow-pushing practice.',              CURRENT_TIMESTAMP + INTERVAL '2 days',     75, 'scheduled', true),
      (phys_id, 'Newton''s Laws — Problem Solving Marathon',   'Solved CEE-level problems on Newton''s laws, friction, and circular motion.', CURRENT_TIMESTAMP - INTERVAL '3 days', 80, 'completed', false),
      (ma_id,   'Number Series & Logical Reasoning',           'Speed techniques for number series, coding-decoding, and blood relations.', CURRENT_TIMESTAMP + INTERVAL '5 days', 60, 'scheduled', false);
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Lecture videos / live classes seed failed: %', SQLERRM;
END $$;
