-- Migration: 20260809000000_cee_see_program_architecture.sql
-- Description: Production-grade database schema extension for CEE & SEE dual-program architecture.

-- 1. Add program_type column to core tables (Defaulting to 'cee' for backward compatibility)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subjects' AND column_name = 'program_type') THEN
        ALTER TABLE subjects ADD COLUMN program_type VARCHAR(20) NOT NULL DEFAULT 'cee';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chapters' AND column_name = 'program_type') THEN
        ALTER TABLE chapters ADD COLUMN program_type VARCHAR(20) NOT NULL DEFAULT 'cee';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'batches' AND column_name = 'program_type') THEN
        ALTER TABLE batches ADD COLUMN program_type VARCHAR(20) NOT NULL DEFAULT 'cee';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questions' AND column_name = 'program_type') THEN
        ALTER TABLE questions ADD COLUMN program_type VARCHAR(20) NOT NULL DEFAULT 'cee';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'video_lectures' AND column_name = 'program_type') THEN
        ALTER TABLE video_lectures ADD COLUMN program_type VARCHAR(20) NOT NULL DEFAULT 'cee';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'exams' AND column_name = 'program_type') THEN
        ALTER TABLE exams ADD COLUMN program_type VARCHAR(20) NOT NULL DEFAULT 'cee';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notes' AND column_name = 'program_type') THEN
        ALTER TABLE notes ADD COLUMN program_type VARCHAR(20) NOT NULL DEFAULT 'cee';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'target_program') THEN
        ALTER TABLE user_profiles ADD COLUMN target_program VARCHAR(20) NOT NULL DEFAULT 'cee';
    END IF;
END $$;

-- 2. Create PostgreSQL indexes for high-concurrency query performance
CREATE INDEX IF NOT EXISTS idx_subjects_program ON subjects(program_type, is_active);
CREATE INDEX IF NOT EXISTS idx_chapters_program ON chapters(program_type, is_active);
CREATE INDEX IF NOT EXISTS idx_batches_program ON batches(program_type, is_active);
CREATE INDEX IF NOT EXISTS idx_questions_program ON questions(program_type, is_published);
CREATE INDEX IF NOT EXISTS idx_video_lectures_program ON video_lectures(program_type, is_active);
CREATE INDEX IF NOT EXISTS idx_exams_program ON exams(program_type, is_published);
CREATE INDEX IF NOT EXISTS idx_notes_program ON notes(program_type, is_active);

-- 3. Mark SEE subjects explicitly as 'see'
UPDATE subjects SET program_type = 'see' WHERE name IN (
  'compulsory_science', 'compulsory_math', 'optional_math', 'english', 'social_studies'
);

-- 4. Mark CEE subjects explicitly as 'cee'
UPDATE subjects SET program_type = 'cee' WHERE name IN (
  'biology', 'chemistry', 'physics', 'mental_agility'
);

-- 5. Mark SEE batches explicitly as 'see'
UPDATE batches SET program_type = 'see' WHERE slug LIKE 'see-%' OR slug LIKE '%-see-%';

-- 6. Mark CEE batches explicitly as 'cee'
UPDATE batches SET program_type = 'cee' WHERE slug LIKE 'target-cee%' OR slug LIKE '%-cee-%' OR program_type IS NULL;
