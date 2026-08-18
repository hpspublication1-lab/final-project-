-- ============================================================
-- Samyak CEE Mastery — Initial Schema Migration
-- ============================================================

-- 1. TYPES
DROP TYPE IF EXISTS public.user_role CASCADE;
CREATE TYPE public.user_role AS ENUM ('student', 'teacher', 'content_reviewer', 'support_agent', 'admin');

DROP TYPE IF EXISTS public.subscription_plan CASCADE;
CREATE TYPE public.subscription_plan AS ENUM ('free', 'student', 'pro', 'institution');

DROP TYPE IF EXISTS public.subject_name CASCADE;
CREATE TYPE public.subject_name AS ENUM ('biology', 'chemistry', 'physics', 'mental_agility');

DROP TYPE IF EXISTS public.difficulty_level CASCADE;
CREATE TYPE public.difficulty_level AS ENUM ('easy', 'medium', 'hard');

DROP TYPE IF EXISTS public.topic_mastery_level CASCADE;
CREATE TYPE public.topic_mastery_level AS ENUM ('not_attempted', 'critical', 'weak', 'developing', 'strong', 'mastered');

-- 2. CORE TABLES

-- User profiles (linked to auth.users via trigger)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  phone TEXT,
  college TEXT,
  cee_year INTEGER,
  role public.user_role DEFAULT 'student'::public.user_role,
  subscription_plan public.subscription_plan DEFAULT 'free'::public.subscription_plan,
  subscription_expires_at TIMESTAMPTZ,
  study_streak INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  battle_rating INTEGER DEFAULT 1000,
  rank_position INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Subjects
CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name public.subject_name NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  color TEXT,
  icon TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Chapters
CREATE TABLE IF NOT EXISTS public.chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  chapter_number INTEGER,
  is_premium BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Questions (MCQs)
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  chapter_id UUID REFERENCES public.chapters(id) ON DELETE SET NULL,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_option TEXT NOT NULL CHECK (correct_option IN ('a', 'b', 'c', 'd')),
  explanation TEXT,
  difficulty public.difficulty_level DEFAULT 'medium'::public.difficulty_level,
  is_premium BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Exams
CREATE TABLE IF NOT EXISTS public.exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  total_marks INTEGER NOT NULL DEFAULT 100,
  negative_marking BOOLEAN DEFAULT true,
  is_premium BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Exam attempts
CREATE TABLE IF NOT EXISTS public.exam_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  score NUMERIC(6,2),
  total_marks INTEGER,
  correct_answers INTEGER DEFAULT 0,
  incorrect_answers INTEGER DEFAULT 0,
  unattempted INTEGER DEFAULT 0,
  percentage NUMERIC(5,2),
  percentile NUMERIC(5,2),
  time_taken_seconds INTEGER,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Topic mastery (per student per chapter)
CREATE TABLE IF NOT EXISTS public.topic_mastery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  mastery_level public.topic_mastery_level DEFAULT 'not_attempted'::public.topic_mastery_level,
  questions_attempted INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  accuracy NUMERIC(5,2) DEFAULT 0,
  last_practiced_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, chapter_id)
);

-- Bookmarks
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, question_id)
);

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type TEXT DEFAULT 'info',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Battle rooms
CREATE TABLE IF NOT EXISTS public.battle_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code TEXT NOT NULL UNIQUE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  chapter_id UUID REFERENCES public.chapters(id) ON DELETE SET NULL,
  creator_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  opponent_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'completed', 'cancelled')),
  question_count INTEGER DEFAULT 10,
  time_limit_seconds INTEGER DEFAULT 300,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Battle results
CREATE TABLE IF NOT EXISTS public.battle_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.battle_rooms(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  score NUMERIC(6,2) DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  incorrect_answers INTEGER DEFAULT 0,
  accuracy NUMERIC(5,2) DEFAULT 0,
  time_taken_seconds INTEGER,
  rating_change INTEGER DEFAULT 0,
  is_winner BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(room_id, player_id)
);

-- 3. INDEXES
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_chapters_subject_id ON public.chapters(subject_id);
CREATE INDEX IF NOT EXISTS idx_questions_subject_id ON public.questions(subject_id);
CREATE INDEX IF NOT EXISTS idx_questions_chapter_id ON public.questions(chapter_id);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_student_id ON public.exam_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_exam_id ON public.exam_attempts(exam_id);
CREATE INDEX IF NOT EXISTS idx_topic_mastery_student_id ON public.topic_mastery(student_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_student_id ON public.bookmarks(student_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_battle_rooms_room_code ON public.battle_rooms(room_code);
CREATE INDEX IF NOT EXISTS idx_battle_rooms_creator_id ON public.battle_rooms(creator_id);

-- 4. FUNCTIONS

-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, avatar_url, phone, college, cee_year, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', NULL),
    COALESCE(NEW.raw_user_meta_data->>'college', NULL),
    CASE WHEN NEW.raw_user_meta_data->>'cee_year' IS NOT NULL
         THEN (NEW.raw_user_meta_data->>'cee_year')::INTEGER
         ELSE NULL END,
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')::public.user_role
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

-- Check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users au
    WHERE au.id = auth.uid()
    AND (au.raw_user_meta_data->>'role' = 'admin'
         OR au.raw_app_meta_data->>'role' = 'admin')
  )
$$;

-- 5. ENABLE RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topic_mastery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.battle_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.battle_results ENABLE ROW LEVEL SECURITY;

-- 6. RLS POLICIES

-- user_profiles
DROP POLICY IF EXISTS "users_manage_own_user_profiles" ON public.user_profiles;
CREATE POLICY "users_manage_own_user_profiles"
ON public.user_profiles FOR ALL TO authenticated
USING (id = auth.uid()) WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "admin_full_access_user_profiles" ON public.user_profiles;
CREATE POLICY "admin_full_access_user_profiles"
ON public.user_profiles FOR ALL TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

-- subjects (public read)
DROP POLICY IF EXISTS "public_read_subjects" ON public.subjects;
CREATE POLICY "public_read_subjects"
ON public.subjects FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "admin_manage_subjects" ON public.subjects;
CREATE POLICY "admin_manage_subjects"
ON public.subjects FOR ALL TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

-- chapters (public read)
DROP POLICY IF EXISTS "public_read_chapters" ON public.chapters;
CREATE POLICY "public_read_chapters"
ON public.chapters FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "admin_manage_chapters" ON public.chapters;
CREATE POLICY "admin_manage_chapters"
ON public.chapters FOR ALL TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

-- questions (public read for free, premium requires auth)
DROP POLICY IF EXISTS "public_read_free_questions" ON public.questions;
CREATE POLICY "public_read_free_questions"
ON public.questions FOR SELECT TO public USING (is_premium = false AND is_active = true);

DROP POLICY IF EXISTS "auth_read_premium_questions" ON public.questions;
CREATE POLICY "auth_read_premium_questions"
ON public.questions FOR SELECT TO authenticated USING (is_active = true);

DROP POLICY IF EXISTS "admin_manage_questions" ON public.questions;
CREATE POLICY "admin_manage_questions"
ON public.questions FOR ALL TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

-- exams (public read for free)
DROP POLICY IF EXISTS "public_read_free_exams" ON public.exams;
CREATE POLICY "public_read_free_exams"
ON public.exams FOR SELECT TO public USING (is_premium = false AND is_active = true);

DROP POLICY IF EXISTS "auth_read_premium_exams" ON public.exams;
CREATE POLICY "auth_read_premium_exams"
ON public.exams FOR SELECT TO authenticated USING (is_active = true);

DROP POLICY IF EXISTS "admin_manage_exams" ON public.exams;
CREATE POLICY "admin_manage_exams"
ON public.exams FOR ALL TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

-- exam_attempts (own data only)
DROP POLICY IF EXISTS "users_manage_own_exam_attempts" ON public.exam_attempts;
CREATE POLICY "users_manage_own_exam_attempts"
ON public.exam_attempts FOR ALL TO authenticated
USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid());

-- topic_mastery (own data only)
DROP POLICY IF EXISTS "users_manage_own_topic_mastery" ON public.topic_mastery;
CREATE POLICY "users_manage_own_topic_mastery"
ON public.topic_mastery FOR ALL TO authenticated
USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid());

-- bookmarks (own data only)
DROP POLICY IF EXISTS "users_manage_own_bookmarks" ON public.bookmarks;
CREATE POLICY "users_manage_own_bookmarks"
ON public.bookmarks FOR ALL TO authenticated
USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid());

-- notifications (own data only)
DROP POLICY IF EXISTS "users_read_own_notifications" ON public.notifications;
CREATE POLICY "users_read_own_notifications"
ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "users_update_own_notifications" ON public.notifications;
CREATE POLICY "users_update_own_notifications"
ON public.notifications FOR UPDATE TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- battle_rooms
DROP POLICY IF EXISTS "auth_read_battle_rooms" ON public.battle_rooms;
CREATE POLICY "auth_read_battle_rooms"
ON public.battle_rooms FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "users_create_battle_rooms" ON public.battle_rooms;
CREATE POLICY "users_create_battle_rooms"
ON public.battle_rooms FOR INSERT TO authenticated
WITH CHECK (creator_id = auth.uid());

DROP POLICY IF EXISTS "users_update_own_battle_rooms" ON public.battle_rooms;
CREATE POLICY "users_update_own_battle_rooms"
ON public.battle_rooms FOR UPDATE TO authenticated
USING (creator_id = auth.uid() OR opponent_id = auth.uid())
WITH CHECK (creator_id = auth.uid() OR opponent_id = auth.uid());

-- battle_results
DROP POLICY IF EXISTS "users_manage_own_battle_results" ON public.battle_results;
CREATE POLICY "users_manage_own_battle_results"
ON public.battle_results FOR ALL TO authenticated
USING (player_id = auth.uid()) WITH CHECK (player_id = auth.uid());

DROP POLICY IF EXISTS "auth_read_battle_results" ON public.battle_results;
CREATE POLICY "auth_read_battle_results"
ON public.battle_results FOR SELECT TO authenticated USING (true);

-- 7. TRIGGERS
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_chapters_updated_at ON public.chapters;
CREATE TRIGGER update_chapters_updated_at
  BEFORE UPDATE ON public.chapters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 8. SEED DATA

-- Insert subjects
INSERT INTO public.subjects (id, name, display_name, description, color, icon) VALUES
  (gen_random_uuid(), 'biology', 'Biology', 'Cell biology, genetics, ecology, human physiology and more', '#16A36A', '🧬'),
  (gen_random_uuid(), 'chemistry', 'Chemistry', 'Organic, inorganic, physical chemistry and chemical reactions', '#8B5CF6', '⚗️'),
  (gen_random_uuid(), 'physics', 'Physics', 'Mechanics, thermodynamics, optics, electromagnetism', '#2563EB', '⚡'),
  (gen_random_uuid(), 'mental_agility', 'Mental Agility', 'Logical reasoning, verbal ability, quantitative aptitude', '#E59A18', '🧠')
ON CONFLICT (name) DO NOTHING;

-- Insert demo chapters for Biology
DO $$
DECLARE
  bio_id UUID;
  chem_id UUID;
  phys_id UUID;
BEGIN
  SELECT id INTO bio_id FROM public.subjects WHERE name = 'biology' LIMIT 1;
  SELECT id INTO chem_id FROM public.subjects WHERE name = 'chemistry' LIMIT 1;
  SELECT id INTO phys_id FROM public.subjects WHERE name = 'physics' LIMIT 1;

  IF bio_id IS NOT NULL THEN
    INSERT INTO public.chapters (subject_id, title, chapter_number, is_premium) VALUES
      (bio_id, 'Cell Biology & Cell Division', 1, false),
      (bio_id, 'Genetics & Heredity', 2, false),
      (bio_id, 'Human Physiology — Digestion', 3, true),
      (bio_id, 'Human Physiology — Circulation', 4, true),
      (bio_id, 'Ecology & Environment', 5, false)
    ON CONFLICT DO NOTHING;
  END IF;

  IF chem_id IS NOT NULL THEN
    INSERT INTO public.chapters (subject_id, title, chapter_number, is_premium) VALUES
      (chem_id, 'Atomic Structure & Periodic Table', 1, false),
      (chem_id, 'Chemical Bonding', 2, false),
      (chem_id, 'Organic Chemistry — Hydrocarbons', 3, true),
      (chem_id, 'Electrochemistry', 4, true)
    ON CONFLICT DO NOTHING;
  END IF;

  IF phys_id IS NOT NULL THEN
    INSERT INTO public.chapters (subject_id, title, chapter_number, is_premium) VALUES
      (phys_id, 'Mechanics — Kinematics', 1, false),
      (phys_id, 'Laws of Motion', 2, false),
      (phys_id, 'Thermodynamics', 3, true),
      (phys_id, 'Optics & Wave Optics', 4, true)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Insert demo auth users (trigger creates user_profiles automatically)
DO $$
DECLARE
  student_pro_uuid UUID := gen_random_uuid();
  student_free_uuid UUID := gen_random_uuid();
  admin_uuid UUID := gen_random_uuid();
BEGIN
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
    is_sso_user, is_anonymous, confirmation_token, confirmation_sent_at,
    recovery_token, recovery_sent_at, email_change_token_new, email_change,
    email_change_sent_at, email_change_token_current, email_change_confirm_status,
    reauthentication_token, reauthentication_sent_at, phone, phone_change,
    phone_change_token, phone_change_sent_at
  ) VALUES
    (
      student_pro_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      'priya.thapa@samyakcee.edu.np', crypt('CEE2026#Priya', gen_salt('bf', 10)), now(), now(), now(),
      jsonb_build_object('full_name', 'Priya Thapa', 'role', 'student', 'college', 'Kathmandu Model College', 'cee_year', 2026),
      jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[]),
      false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null
    ),
    (
      student_free_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      'aarav.sharma@samyakcee.edu.np', crypt('CEE2026#Aarav', gen_salt('bf', 10)), now(), now(), now(),
      jsonb_build_object('full_name', 'Aarav Sharma', 'role', 'student', 'college', 'St. Xavier College', 'cee_year', 2026),
      jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[]),
      false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null
    ),
    (
      admin_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      'admin@samyakcee.edu.np', crypt('Admin@CEE2026!', gen_salt('bf', 10)), now(), now(), now(),
      jsonb_build_object('full_name', 'Samyak Admin', 'role', 'admin'),
      jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[], 'role', 'admin'),
      false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null
    )
  ON CONFLICT (id) DO NOTHING;

  -- Update subscription for pro student after trigger creates profile
  UPDATE public.user_profiles
  SET subscription_plan = 'pro'::public.subscription_plan,
      subscription_expires_at = now() + INTERVAL '1 year',
      study_streak = 14,
      total_points = 4820,
      battle_rating = 1245,
      rank_position = 47
  WHERE email = 'priya.thapa@samyakcee.edu.np';

  UPDATE public.user_profiles
  SET subscription_plan = 'free'::public.subscription_plan,
      study_streak = 3,
      total_points = 320,
      battle_rating = 980,
      rank_position = 1842
  WHERE email = 'aarav.sharma@samyakcee.edu.np';

  UPDATE public.user_profiles
  SET role = 'admin'::public.user_role
  WHERE email = 'admin@samyakcee.edu.np';

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Seed data error: %', SQLERRM;
END $$;

-- Insert sample exam attempts for Priya
DO $$
DECLARE
  student_id UUID;
  exam_id UUID;
BEGIN
  SELECT id INTO student_id FROM public.user_profiles WHERE email = 'priya.thapa@samyakcee.edu.np' LIMIT 1;

  IF student_id IS NOT NULL THEN
    -- Create a sample exam
    INSERT INTO public.exams (id, title, description, duration_minutes, total_marks, is_premium)
    VALUES
      (gen_random_uuid(), 'Biology Full Mock — Set 1', 'Complete biology mock exam', 90, 100, false),
      (gen_random_uuid(), 'Chemistry Chapter Test — Atomic Structure', 'Chapter test on atomic structure', 30, 40, false),
      (gen_random_uuid(), 'Physics Mock — Mechanics', 'Mechanics and kinematics mock', 60, 80, true)
    ON CONFLICT DO NOTHING;

    SELECT id INTO exam_id FROM public.exams WHERE title = 'Biology Full Mock — Set 1' LIMIT 1;

    IF exam_id IS NOT NULL THEN
      INSERT INTO public.exam_attempts (
        exam_id, student_id, score, total_marks, correct_answers, incorrect_answers,
        unattempted, percentage, percentile, time_taken_seconds, completed_at
      ) VALUES
        (exam_id, student_id, 78, 100, 78, 15, 7, 78.0, 82.5, 4800, now() - INTERVAL '2 days')
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Exam seed error: %', SQLERRM;
END $$;
