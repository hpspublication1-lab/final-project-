-- Migration: 20260822_soumya_guru_5_courses.sql
-- Description: Register 5 Soumya Guru specialized course portals & feature entitlements

-- 1. Ensure programs table exists and insert 5 distinct course portals
INSERT INTO public.programs (slug, name, description, category, sort_order) VALUES
  ('cee_medical', 'CEE — Medical Entrance Preparation', 'Nepal Medical Education Commission Entrance Exam (MECEE)', 'exam-prep', 1),
  ('see_class_10', 'SEE — Class 10 Board Exam', 'Secondary Education Examination (Nepal Board Grade 10)', 'exam-prep', 2),
  ('ielts', 'IELTS — English Language Mastery', 'IELTS Academic & General (Target 8.0+ Bands) & Spoken English', 'skill-course', 3),
  ('digital_marketing', 'Digital Marketing — Build Digital Skills', 'Performance marketing, Meta ads, TikTok growth & freelancing', 'skill-course', 4),
  ('artificial_intelligence', 'Artificial Intelligence — AI Academy', 'Prompt engineering, ChatGPT automation, Python & real-world AI', 'skill-course', 5)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  sort_order = EXCLUDED.sort_order;

-- Also maintain legacy aliases for backward compatibility
INSERT INTO public.programs (slug, name, description, category, sort_order) VALUES
  ('cee', 'CEE / Medical Entrance (Alias)', 'Legacy alias for CEE', 'exam-prep', 10),
  ('see', 'SEE Grade 10 Board (Alias)', 'Legacy alias for SEE', 'exam-prep', 11),
  ('english', 'English & IELTS Mastery (Alias)', 'Legacy alias for English/IELTS', 'skill-course', 12),
  ('digital', 'Digital Skills & AI Academy (Alias)', 'Legacy alias for Digital/AI', 'skill-course', 13)
ON CONFLICT (slug) DO NOTHING;

-- 2. Configure feature entitlements per course

-- CEE Medical Features
INSERT INTO public.program_features (program_id, feature_key, config)
SELECT id, feature_key, '{}'::jsonb
FROM public.programs, unnest(ARRAY[
  'mcq_practice', 'mock_tests', 'battle_arena',
  'video_library', 'live_classes', 'flashcards',
  'performance_analytics', 'exam_countdown'
]) AS feature_key
WHERE slug = 'cee_medical' OR slug = 'cee'
ON CONFLICT DO NOTHING;

-- SEE Class 10 Features
INSERT INTO public.program_features (program_id, feature_key, config)
SELECT id, feature_key, '{}'::jsonb
FROM public.programs, unnest(ARRAY[
  'subjective_practice', 'model_papers', 'question_bank',
  'video_library', 'chapter_notes', 'gpa_target_tracker'
]) AS feature_key
WHERE slug = 'see_class_10' OR slug = 'see'
ON CONFLICT DO NOTHING;

-- IELTS & English Features
INSERT INTO public.program_features (program_id, feature_key, config)
SELECT id, feature_key, '{}'::jsonb
FROM public.programs, unnest(ARRAY[
  'ielts_writing_evaluator', 'speaking_simulator', 'listening_drills',
  'reading_drills', 'grammar_drills', 'band_score_predictor'
]) AS feature_key
WHERE slug = 'ielts' OR slug = 'english'
ON CONFLICT DO NOTHING;

-- Digital Marketing Features
INSERT INTO public.program_features (program_id, feature_key, config)
SELECT id, feature_key, '{}'::jsonb
FROM public.programs, unnest(ARRAY[
  'meta_ads_modules', 'seo_playbooks', 'viral_tiktok_formulas',
  'portfolio_projects', 'swipe_files', 'marketing_certification'
]) AS feature_key
WHERE slug = 'digital_marketing'
ON CONFLICT DO NOTHING;

-- AI & Automation Features
INSERT INTO public.program_features (program_id, feature_key, config)
SELECT id, feature_key, '{}'::jsonb
FROM public.programs, unnest(ARRAY[
  'ai_prompt_studio', 'python_runner', 'ai_automation_tools',
  'hands_on_projects', 'prompt_libraries', 'ai_specialist_certificate'
]) AS feature_key
WHERE slug = 'artificial_intelligence' OR slug = 'digital'
ON CONFLICT DO NOTHING;
