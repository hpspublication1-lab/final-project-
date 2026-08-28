-- ============================================================
-- Migration: 20260822_see_class_10_complete.sql
-- Description: Complete scalable content structure, video progress tracking,
--              orders, pricing, and bulk import tables for SEE Class 10.
-- ============================================================

-- 1. Create or ensure course_pricing table for admin-configurable prices
CREATE TABLE IF NOT EXISTS public.course_pricing (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id            VARCHAR(50) UNIQUE NOT NULL, -- e.g. 'see_class_10', 'cee_medical', 'ielts'
  course_name          TEXT NOT NULL,
  original_price_npr   INTEGER NOT NULL DEFAULT 4990,
  discount_price_npr   INTEGER NOT NULL DEFAULT 2990,
  coupon_code          VARCHAR(30),
  coupon_discount_npr  INTEGER DEFAULT 0,
  is_active            BOOLEAN NOT NULL DEFAULT true,
  is_lifetime          BOOLEAN NOT NULL DEFAULT true,
  expiry_days          INTEGER DEFAULT 365,
  created_at           TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at           TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Seed default pricing for SEE Class 10 and other canonical courses
INSERT INTO public.course_pricing (course_id, course_name, original_price_npr, discount_price_npr, is_active, is_lifetime)
VALUES 
  ('see_class_10', 'SEE Class 10 Complete Board Master Batch 2082/2083', 4990, 2990, true, true),
  ('cee_medical', 'CEE Medical Entrance Super Target Batch 2026', 7990, 4990, true, false),
  ('ielts', 'IELTS Academic & General Target Band 8.0+ Masterclass', 5490, 3490, true, true),
  ('digital_marketing', 'Digital Marketing, Meta Ads & Freelance Blueprint', 3990, 2490, true, true),
  ('artificial_intelligence', 'AI Academy: Prompt Engineering, Python & Automation', 3990, 2490, true, true)
ON CONFLICT (course_id) DO UPDATE SET
  course_name = EXCLUDED.course_name,
  original_price_npr = EXCLUDED.original_price_npr,
  discount_price_npr = EXCLUDED.discount_price_npr,
  updated_at = CURRENT_TIMESTAMP;

-- 2. Create see_lessons (Scalable lesson and video structure for SEE Class 10)
CREATE TABLE IF NOT EXISTS public.see_lessons (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id              VARCHAR(50) NOT NULL DEFAULT 'see_class_10',
  subject_id             UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  chapter_id             UUID REFERENCES public.chapters(id) ON DELETE SET NULL,
  subject_slug           VARCHAR(50) NOT NULL DEFAULT 'science', -- e.g. 'physics', 'chemistry', 'biology', 'math', 'opt_math', 'english', 'nepali', 'social'
  chapter_name           TEXT NOT NULL,
  title                  TEXT NOT NULL,
  description            TEXT,
  video_url              TEXT,
  thumbnail_url          TEXT,
  duration_sec           INTEGER NOT NULL DEFAULT 0,
  lesson_order           INTEGER NOT NULL DEFAULT 1,
  pdf_url                TEXT,
  downloadable_resources JSONB DEFAULT '[]'::jsonb,
  is_free                BOOLEAN NOT NULL DEFAULT false,
  is_published           BOOLEAN NOT NULL DEFAULT true,
  created_at             TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at             TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_see_lessons_course ON public.see_lessons(course_id, is_published);
CREATE INDEX IF NOT EXISTS idx_see_lessons_subject ON public.see_lessons(subject_slug, lesson_order);
CREATE INDEX IF NOT EXISTS idx_see_lessons_chapter ON public.see_lessons(chapter_id, lesson_order);

-- 3. Create user_video_progress table (Per-student watch duration & resume position)
CREATE TABLE IF NOT EXISTS public.user_video_progress (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  course_id          VARCHAR(50) NOT NULL DEFAULT 'see_class_10',
  lesson_id          UUID NOT NULL REFERENCES public.see_lessons(id) ON DELETE CASCADE,
  watched_seconds    INTEGER NOT NULL DEFAULT 0,
  total_duration_sec INTEGER NOT NULL DEFAULT 0,
  percentage         INTEGER NOT NULL DEFAULT 0,
  is_completed       BOOLEAN NOT NULL DEFAULT false,
  last_watched_at    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_at         TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_user_video_progress_user ON public.user_video_progress(user_id, course_id);
CREATE INDEX IF NOT EXISTS idx_user_video_progress_lesson ON public.user_video_progress(lesson_id);

-- 4. Create course_orders table (Tracking multi-course purchases, Fonepay/eSewa/Khalti transactions)
CREATE TABLE IF NOT EXISTS public.course_orders (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number       VARCHAR(50) UNIQUE NOT NULL, -- e.g. 'ORD-SEE-1785934-A8F1'
  user_id            UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  course_id          VARCHAR(50) NOT NULL, -- e.g. 'see_class_10'
  amount_npr         INTEGER NOT NULL,
  discount_npr       INTEGER NOT NULL DEFAULT 0,
  final_amount_npr   INTEGER NOT NULL,
  currency           VARCHAR(10) NOT NULL DEFAULT 'NPR',
  gateway            VARCHAR(20) NOT NULL, -- 'fonepay', 'esewa', 'khalti', 'manual'
  gateway_ref        TEXT, -- PRN or transaction UUID
  gateway_response   JSONB,
  status             VARCHAR(20) NOT NULL DEFAULT 'initiated', -- 'initiated', 'pending', 'paid', 'failed', 'cancelled', 'refunded'
  created_at         TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  paid_at            TIMESTAMPTZ,
  updated_at         TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_course_orders_user ON public.course_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_course_orders_course ON public.course_orders(course_id, status);
CREATE INDEX IF NOT EXISTS idx_course_orders_order_num ON public.course_orders(order_number);

-- 5. Row Level Security Policies
ALTER TABLE public.course_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.see_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_video_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_orders ENABLE ROW LEVEL SECURITY;

-- Pricing: readable by anyone (public store)
DROP POLICY IF EXISTS "Public can view active pricing" ON public.course_pricing;
CREATE POLICY "Public can view active pricing"
ON public.course_pricing FOR SELECT
USING (is_active = true);

-- SEE Lessons: readable by authenticated students (content gating validated server-side)
DROP POLICY IF EXISTS "Authenticated can view published lessons" ON public.see_lessons;
CREATE POLICY "Authenticated can view published lessons"
ON public.see_lessons FOR SELECT TO authenticated
USING (is_published = true);

-- Video Progress: students manage their own progress
DROP POLICY IF EXISTS "Students manage own video progress" ON public.user_video_progress;
CREATE POLICY "Students manage own video progress"
ON public.user_video_progress FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Course Orders: students can view their own orders
DROP POLICY IF EXISTS "Students view own orders" ON public.course_orders;
CREATE POLICY "Students view own orders"
ON public.course_orders FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- 6. Seed Sample SEE Lessons across Physics, Chem, Bio, Math, English, Nepali, Social
INSERT INTO public.see_lessons (
  course_id, subject_slug, chapter_name, title, description, video_url, thumbnail_url, duration_sec, lesson_order, pdf_url, is_free, is_published
)
VALUES
  -- Physics
  ('see_class_10', 'physics', 'Force and Gravity', 'Lesson 1: Universal Law of Gravitation & Derivation', 'Comprehensive breakdown of Newton''s Law of Universal Gravitation, gravitational constant G, and variations of g.', 'https://vz-11253e6e-275.b-cdn.net/sample-see-physics-1/playlist.m3u8', 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600', 1680, 1, '/pdfs/see-physics-ch1.pdf', true, true),
  ('see_class_10', 'physics', 'Force and Gravity', 'Lesson 2: Free Fall & Weightlessness (Board Numericals)', 'Step-by-step mathematical problem solutions on acceleration due to gravity and terminal velocity.', 'https://vz-11253e6e-275.b-cdn.net/sample-see-physics-2/playlist.m3u8', 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600', 1920, 2, '/pdfs/see-physics-ch1-num.pdf', false, true),
  ('see_class_10', 'physics', 'Pressure', 'Lesson 3: Liquid Pressure, Pascal''s Law & Hydraulic Press', 'Derivation of P = hpg, working principle of hydraulic machines and atmospheric pressure.', 'https://vz-11253e6e-275.b-cdn.net/sample-see-physics-3/playlist.m3u8', 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600', 1800, 3, '/pdfs/see-physics-ch2.pdf', false, true),

  -- Chemistry
  ('see_class_10', 'chemistry', 'Periodic Table & Chemical Reactions', 'Lesson 1: Modern Periodic Table & Group Characteristics', 'Detailed classification of s, p, d block elements and periodicity in properties.', 'https://vz-11253e6e-275.b-cdn.net/sample-see-chem-1/playlist.m3u8', 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=600', 1540, 1, '/pdfs/see-chem-ch1.pdf', true, true),
  ('see_class_10', 'chemistry', 'Metals & Metallurgy', 'Lesson 2: Extraction of Iron & Chemical Reactions in Blast Furnace', 'Zone of reduction, zone of heat absorption, and high-yield chemical equations for board exams.', 'https://vz-11253e6e-275.b-cdn.net/sample-see-chem-2/playlist.m3u8', 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=600', 2100, 2, '/pdfs/see-chem-ch2.pdf', false, true),

  -- Biology
  ('see_class_10', 'biology', 'Nervous & Glandular System', 'Lesson 1: Human Brain Structure, Neurons & Reflex Arc', 'Anatomy of cerebrum, cerebellum, medulla and pathway of reflex actions with labelled diagrams.', 'https://vz-11253e6e-275.b-cdn.net/sample-see-bio-1/playlist.m3u8', 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=600', 1750, 1, '/pdfs/see-bio-ch1.pdf', true, true),
  ('see_class_10', 'biology', 'Heredity & Chromosomes', 'Lesson 2: Mendel''s Monohybrid & Dihybrid Cross Laws', 'Phenotypic and genotypic ratios with Punnett square problem sets for Class 10.', 'https://vz-11253e6e-275.b-cdn.net/sample-see-bio-2/playlist.m3u8', 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=600', 2250, 2, '/pdfs/see-bio-ch2.pdf', false, true),

  -- Mathematics
  ('see_class_10', 'math', 'Sets & Arithmetic', 'Lesson 1: Set Operations & Venn Diagram Word Problems', 'Solving 2-set and 3-set cardinal problem sets with formula and Venn diagram methods.', 'https://vz-11253e6e-275.b-cdn.net/sample-see-math-1/playlist.m3u8', 'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?w=600', 1980, 1, '/pdfs/see-math-ch1.pdf', true, true),
  ('see_class_10', 'math', 'Algebra & Quadratic Equations', 'Lesson 2: Quadratic Equations & Factorization Tricks', 'Solving quadratic roots, discriminant nature and word problems based on speed & age.', 'https://vz-11253e6e-275.b-cdn.net/sample-see-math-2/playlist.m3u8', 'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?w=600', 2400, 2, '/pdfs/see-math-ch2.pdf', false, true),
  ('see_class_10', 'math', 'Geometry Proofs', 'Lesson 3: Cyclic Quadrilaterals & Circle Theorems', 'Formal geometric proofs for angles subtended by arc and cyclic quadrilateral properties.', 'https://vz-11253e6e-275.b-cdn.net/sample-see-math-3/playlist.m3u8', 'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?w=600', 2600, 3, '/pdfs/see-math-ch3.pdf', false, true),

  -- Optional Mathematics
  ('see_class_10', 'opt_math', 'Trigonometry & Vectors', 'Lesson 1: Compound & Multiple Angle Formula Derivations', 'Trigonometric identities, transformation of products and conditional identities.', 'https://vz-11253e6e-275.b-cdn.net/sample-see-optmath-1/playlist.m3u8', 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600', 2150, 1, '/pdfs/see-optmath-ch1.pdf', true, true),

  -- English
  ('see_class_10', 'english', 'Guided Writing', 'Lesson 1: Formal Letter, Job Application & CV Writing', 'Standard NEB format for formal letters and professional curriculum vitae.', 'https://vz-11253e6e-275.b-cdn.net/sample-see-eng-1/playlist.m3u8', 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=600', 1450, 1, '/pdfs/see-english-ch1.pdf', true, true),

  -- Nepali
  ('see_class_10', 'nepali', 'व्याकरण र वाक्य रचना', 'Lesson 1: पदवर्ग र शब्द निर्माण (उपसर्ग र प्रत्यय)', 'नेपाली व्याकरणमा नाम, सर्वनाम, विशेषण र उपसर्ग-प्रत्ययको प्रयोग र नियमहरू।', 'https://vz-11253e6e-275.b-cdn.net/sample-see-nepali-1/playlist.m3u8', 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600', 1520, 1, '/pdfs/see-nepali-ch1.pdf', true, true),

  -- Social Studies
  ('see_class_10', 'social', 'We and Our Society', 'Lesson 1: Human Resources Development in Nepal', 'Classification of human resources, challenges and employment opportunities in Nepal.', 'https://vz-11253e6e-275.b-cdn.net/sample-see-social-1/playlist.m3u8', 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=600', 1380, 1, '/pdfs/see-social-ch1.pdf', true, true);
