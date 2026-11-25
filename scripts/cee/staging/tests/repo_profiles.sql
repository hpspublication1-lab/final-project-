-- user_profiles exactly as keyed in supabase/migrations/20260715003118_initial_schema.sql
-- (id primary key, user_role enum), reduced to the columns the superseded files touch.
CREATE TYPE public.user_role AS ENUM ('student', 'teacher', 'content_reviewer', 'support_agent', 'admin');
CREATE TABLE public.user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  role public.user_role DEFAULT 'student'::public.user_role
);
