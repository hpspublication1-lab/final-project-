-- ============================================================================
-- SAMYAK CEE & SEE DUAL-PROGRAM DATABASE MIGRATION SCRIPT
-- Run this once in Supabase Dashboard → SQL Editor
-- ============================================================================

-- 1. Add program_type column to subjects
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS program_type VARCHAR(20) NOT NULL DEFAULT 'cee';

-- 2. Add program_type column to chapters
ALTER TABLE chapters ADD COLUMN IF NOT EXISTS program_type VARCHAR(20) NOT NULL DEFAULT 'cee';

-- 3. Add program_type column to batches
ALTER TABLE batches ADD COLUMN IF NOT EXISTS program_type VARCHAR(20) NOT NULL DEFAULT 'cee';

-- 4. Add program_type column to questions
ALTER TABLE questions ADD COLUMN IF NOT EXISTS program_type VARCHAR(20) NOT NULL DEFAULT 'cee';

-- 5. Add program_type column to video_lectures
ALTER TABLE video_lectures ADD COLUMN IF NOT EXISTS program_type VARCHAR(20) NOT NULL DEFAULT 'cee';

-- 6. Add program_type column to exams
ALTER TABLE exams ADD COLUMN IF NOT EXISTS program_type VARCHAR(20) NOT NULL DEFAULT 'cee';

-- 7. Add program_type column to notes
ALTER TABLE notes ADD COLUMN IF NOT EXISTS program_type VARCHAR(20) NOT NULL DEFAULT 'cee';

-- 8. Add target_program column to user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS target_program VARCHAR(20) NOT NULL DEFAULT 'cee';

-- 9. Create PostgreSQL performance indexes for high concurrency
CREATE INDEX IF NOT EXISTS idx_subjects_program ON subjects(program_type, is_active);
CREATE INDEX IF NOT EXISTS idx_chapters_program ON chapters(program_type, is_active);
CREATE INDEX IF NOT EXISTS idx_batches_program ON batches(program_type, is_active);
CREATE INDEX IF NOT EXISTS idx_questions_program ON questions(program_type, is_published);
CREATE INDEX IF NOT EXISTS idx_video_lectures_program ON video_lectures(program_type, is_active);
CREATE INDEX IF NOT EXISTS idx_exams_program ON exams(program_type, is_published);

-- 10. Update SEE subjects & batches
UPDATE subjects SET program_type = 'see' WHERE name IN (
  'compulsory_science', 'compulsory_math', 'optional_math', 'english', 'social_studies'
);

UPDATE subjects SET program_type = 'cee' WHERE name IN (
  'biology', 'chemistry', 'physics', 'mental_agility'
);

UPDATE batches SET program_type = 'see' WHERE slug LIKE 'see-%' OR slug LIKE '%-see-%';
UPDATE batches SET program_type = 'cee' WHERE slug LIKE 'target-cee%' OR slug LIKE '%-cee-%';
