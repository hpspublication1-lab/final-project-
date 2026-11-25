-- A production-like public schema exercising every kind of object the snapshot
-- must reproduce. Synthetic: no real names or data.
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TYPE public.plan_kind AS ENUM ('free', 'pro', 'it''s quoted');
CREATE TABLE public.user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE,
  plan public.plan_kind NOT NULL DEFAULT 'free',
  role text CHECK (role IN ('student', 'admin')),
  full_name text,
  search tsvector GENERATED ALWAYS AS (to_tsvector('simple', coalesce(full_name, ''))) STORED,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.notes (id bigserial PRIMARY KEY, owner uuid REFERENCES public.user_profiles(id), title text NOT NULL, body text);
CREATE TABLE public.events (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, kind text NOT NULL, at timestamptz DEFAULT now());
CREATE INDEX notes_title_idx ON public.notes (lower(title)) WHERE body IS NOT NULL;
CREATE VIEW public.note_titles AS SELECT n.id, n.title, p.email FROM public.notes n LEFT JOIN public.user_profiles p ON p.id = n.owner;
CREATE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $f$
BEGIN INSERT INTO public.user_profiles (id, email) VALUES (NEW.id, NEW.email); RETURN NEW; END $f$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
CREATE FUNCTION public.note_count(p uuid) RETURNS bigint LANGUAGE sql STABLE AS $f$ SELECT count(*) FROM public.notes WHERE owner = p $f$;
REVOKE ALL ON FUNCTION public.note_count(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.note_count(uuid) TO authenticated;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile" ON public.user_profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "own notes write" ON public.notes AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (owner = auth.uid());
CREATE POLICY "read notes" ON public.notes FOR SELECT USING (true);
GRANT SELECT ON public.user_profiles TO authenticated;
GRANT SELECT, INSERT ON public.notes TO authenticated;
GRANT ALL ON public.notes, public.user_profiles, public.events TO service_role;
GRANT SELECT ON public.note_titles TO anon;
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES ('notes-pdf', 'notes-pdf', true, 52428800, '{application/pdf}');
CREATE POLICY "public read notes-pdf" ON storage.objects FOR SELECT USING (bucket_id = 'notes-pdf');
-- Synthetic rows, to prove the snapshot carries none of them.
INSERT INTO auth.users (id, email) VALUES ('00000000-0000-4000-8000-000000000001', 'synthetic-student@example.invalid');
INSERT INTO public.notes (owner, title, body) VALUES ('00000000-0000-4000-8000-000000000001', 'SECRET-ROW-MARKER', 'x');
