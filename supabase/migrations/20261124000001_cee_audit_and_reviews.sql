-- ==============================================================================
-- SAMYAK GURU CEE PLATFORM — MIGRATION 20261124000001
-- AUDIT LOGS, MULTI-GATE REVIEW EXPANSION & PILOT LESSON SEEDING
-- ==============================================================================

-- 1. CEE AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.cee_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  actor_id UUID,
  details_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cee_audit_entity ON public.cee_audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_cee_audit_actor ON public.cee_audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_cee_audit_created ON public.cee_audit_logs(created_at DESC);

ALTER TABLE public.cee_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and Staff view cee_audit_logs" ON public.cee_audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.user_id = auth.uid() AND up.role IN ('admin', 'super_admin', 'teacher')
    )
  );

CREATE POLICY "System insert cee_audit_logs" ON public.cee_audit_logs
  FOR INSERT WITH CHECK (true);

-- 2. STAFF POLICIES FOR REVIEWS & REVISIONS
CREATE POLICY "Staff manage cee_review_requests" ON public.cee_review_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.user_id = auth.uid() AND up.role IN ('admin', 'super_admin', 'teacher', 'content_manager')
    )
  );

CREATE POLICY "Staff manage cee_review_decisions" ON public.cee_review_decisions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.user_id = auth.uid() AND up.role IN ('admin', 'super_admin', 'teacher')
    )
  );

CREATE POLICY "Staff manage cee_lesson_revisions" ON public.cee_lesson_revisions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.user_id = auth.uid() AND up.role IN ('admin', 'super_admin', 'teacher', 'content_manager')
    )
  );

CREATE POLICY "Staff manage cee_publications" ON public.cee_publications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.user_id = auth.uid() AND up.role IN ('admin', 'super_admin')
    )
  );
