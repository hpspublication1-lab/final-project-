-- Add hint column to questions table for AI-generated student hints
ALTER TABLE public.questions
ADD COLUMN IF NOT EXISTS hint TEXT DEFAULT NULL;
