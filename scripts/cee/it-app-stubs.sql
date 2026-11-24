-- Minimal stand-ins for the app tables the course-access check reads, for the
-- throwaway integration database only. Real projects already have these.
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid PRIMARY KEY, email text, full_name text, subscription_plan text, subscription_expires_at timestamptz,
  is_banned boolean DEFAULT false, status text, is_admin boolean DEFAULT false);
CREATE TABLE IF NOT EXISTS public.enrollments (student_id uuid, course_id text, batch_id text, status text, created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.subscriptions (user_id uuid, created_at timestamptz DEFAULT now(), started_at timestamptz, expires_at timestamptz);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_profiles, public.enrollments, public.subscriptions TO service_role;
-- The site's middleware reads the signed-in user's profile row with that user's own token.
GRANT SELECT ON public.user_profiles TO authenticated;
NOTIFY pgrst, 'reload schema';
