-- ═══════════════════════════════════════════════════════════════════════════
-- PROPOSED — NOT APPLIED. CEE Visual Intelligence: Foundation schema.
-- Samyak Guru, 24 Nov 2026. See docs/cee-visual/DATABASE_DESIGN.md.
-- ═══════════════════════════════════════════════════════════════════════════
-- Additive only: creates new cee_* tables, functions and triggers. It does not
-- alter, reference by foreign key, or lock any existing table. (legacy_subject_id
-- and legacy_chapter_id are plain uuids, checked by the service, so deleting an
-- old chapter keeps working exactly as today.)
--
-- Must be re-checked against a schema dump of the live database before use; the
-- repo's migrations are known not to match live (CURRENT_ARCHITECTURE.md §5).
-- Undo: 20261124_cee_visual_foundation_ROLLBACK.sql (drops only what this adds).
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ── Program ids: the same canonical ids as src/lib/courses/courseIds.ts ─────
CREATE DOMAIN cee_program_code AS text
  CHECK (VALUE IN ('cee_medical','see_class_10','neb_class_11','neb_class_12','ioe_engineering',
                   'lok_sewa','ielts','digital_marketing','artificial_intelligence'));

-- ── Feature flag, read by the server (no redeploy to switch) ───────────────
CREATE TABLE public.cee_settings (
  key         text PRIMARY KEY,
  value       jsonb NOT NULL,
  updated_by  uuid,
  updated_at  timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.cee_settings (key, value) VALUES ('cee_visual_enabled', 'false');

-- ── Syllabus versions ─────────────────────────────────────────────────────
CREATE TABLE public.cee_syllabus_versions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_code   cee_program_code NOT NULL,
  label          text NOT NULL,
  source_url     text,
  source_sha256  char(64),
  effective_date date,
  status         text NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','VERIFIED','RETIRED')),
  verified_by    uuid,
  verified_at    timestamptz,
  notes          text,
  created_by     uuid NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (program_code, label),
  CHECK (status <> 'VERIFIED' OR (verified_by IS NOT NULL AND verified_at IS NOT NULL AND source_sha256 IS NOT NULL))
);

-- ── Curriculum tree: SUBJECT → CHAPTER → TOPIC (topics may nest) ──────────
CREATE TABLE public.cee_curriculum_nodes (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  syllabus_version_id uuid NOT NULL REFERENCES public.cee_syllabus_versions(id) ON DELETE RESTRICT,
  parent_id           uuid REFERENCES public.cee_curriculum_nodes(id) ON DELETE RESTRICT,
  node_type           text NOT NULL CHECK (node_type IN ('SUBJECT','CHAPTER','TOPIC')),
  code                text NOT NULL CHECK (code ~ '^[a-z0-9][a-z0-9_-]{0,63}$'),
  title               text NOT NULL,
  sort_key            integer NOT NULL DEFAULT 0,
  legacy_subject_id   uuid,   -- existing public.subjects.id (no FK on purpose)
  legacy_chapter_id   uuid,   -- existing public.chapters.id (no FK on purpose)
  source_ref          text CHECK (source_ref IS NULL OR length(source_ref) BETWEEN 1 AND 200),  -- where in the official document, e.g. "p. 4, 2.3"
  created_by          uuid NOT NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  CHECK ((node_type = 'SUBJECT') = (parent_id IS NULL))
);
-- Sibling codes unique; roots handled separately (no nullable-unique trap).
CREATE UNIQUE INDEX cee_nodes_sibling_code ON public.cee_curriculum_nodes (parent_id, code) WHERE parent_id IS NOT NULL;
CREATE UNIQUE INDEX cee_nodes_root_code    ON public.cee_curriculum_nodes (syllabus_version_id, code) WHERE parent_id IS NULL;

CREATE FUNCTION public.cee_check_node() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE p record; hops int := 0; cur uuid;
BEGIN
  IF NEW.parent_id IS NULL THEN RETURN NEW; END IF;
  SELECT * INTO p FROM public.cee_curriculum_nodes WHERE id = NEW.parent_id;
  IF p.syllabus_version_id <> NEW.syllabus_version_id THEN
    RAISE EXCEPTION 'CURRICULUM_SCOPE: parent belongs to another syllabus version' USING ERRCODE = 'check_violation';
  END IF;
  IF NOT ((NEW.node_type = 'CHAPTER' AND p.node_type = 'SUBJECT')
       OR (NEW.node_type = 'TOPIC'   AND p.node_type IN ('CHAPTER','TOPIC'))) THEN
    RAISE EXCEPTION 'CURRICULUM_SHAPE: % cannot sit under %', NEW.node_type, p.node_type USING ERRCODE = 'check_violation';
  END IF;
  cur := NEW.parent_id;                         -- walk up: reject cycles
  WHILE cur IS NOT NULL LOOP
    IF cur = NEW.id THEN RAISE EXCEPTION 'CURRICULUM_CYCLE' USING ERRCODE = 'check_violation'; END IF;
    hops := hops + 1;
    IF hops > 32 THEN RAISE EXCEPTION 'CURRICULUM_DEPTH' USING ERRCODE = 'check_violation'; END IF;
    SELECT parent_id INTO cur FROM public.cee_curriculum_nodes WHERE id = cur;
  END LOOP;
  RETURN NEW;
END $$;
CREATE TRIGGER cee_check_node BEFORE INSERT OR UPDATE ON public.cee_curriculum_nodes
  FOR EACH ROW EXECUTE FUNCTION public.cee_check_node();

-- A syllabus is edited only while DRAFT. It becomes VERIFIED only through
-- cee_verify_syllabus(); from then on its identity, source and tree are frozen
-- and the only change allowed is retiring it. Changes need a new version.
CREATE FUNCTION public.cee_guard_syllabus_version() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status <> 'DRAFT' OR NEW.verified_by IS NOT NULL OR NEW.verified_at IS NOT NULL THEN
      RAISE EXCEPTION 'ILLEGAL_TRANSITION: a syllabus starts as DRAFT' USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
  END IF;
  IF TG_OP = 'DELETE' THEN
    IF OLD.status <> 'DRAFT' THEN
      RAISE EXCEPTION 'IMMUTABLE_SYLLABUS: only a draft syllabus can be deleted' USING ERRCODE = 'check_violation';
    END IF;
    RETURN OLD;
  END IF;
  IF OLD.status = 'DRAFT' THEN
    IF (NEW.status = 'VERIFIED' OR NEW.verified_by IS NOT NULL OR NEW.verified_at IS NOT NULL)
       AND coalesce(current_setting('cee.verifying', true), '') <> 'on' THEN
      RAISE EXCEPTION 'VERIFY_VIA_FUNCTION: use cee_verify_syllabus()' USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
  END IF;
  IF NOT ((OLD.status = 'VERIFIED' AND NEW.status IN ('VERIFIED','RETIRED')) OR (OLD.status = 'RETIRED' AND NEW.status = 'RETIRED')) THEN
    RAISE EXCEPTION 'ILLEGAL_TRANSITION: syllabus % to %', OLD.status, NEW.status USING ERRCODE = 'check_violation';
  END IF;
  IF ROW(NEW.program_code, NEW.label, NEW.source_url, NEW.source_sha256, NEW.effective_date, NEW.verified_by, NEW.verified_at, NEW.created_by, NEW.created_at)
     IS DISTINCT FROM ROW(OLD.program_code, OLD.label, OLD.source_url, OLD.source_sha256, OLD.effective_date, OLD.verified_by, OLD.verified_at, OLD.created_by, OLD.created_at) THEN
    RAISE EXCEPTION 'IMMUTABLE_SYLLABUS: a verified syllabus can only be retired; create a new version' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER cee_guard_syllabus_version BEFORE INSERT OR UPDATE OR DELETE ON public.cee_syllabus_versions
  FOR EACH ROW EXECUTE FUNCTION public.cee_guard_syllabus_version();

-- Nodes change only while their syllabus is DRAFT. The one exception is the link
-- to an existing course page (legacy_*), which isn't syllabus content. FOR SHARE
-- makes a concurrent verification wait for this change, or this change see it.
CREATE FUNCTION public.cee_guard_curriculum_frozen() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE st text; link_only boolean;
BEGIN
  link_only := TG_OP = 'UPDATE'
    AND (to_jsonb(NEW) - 'legacy_subject_id' - 'legacy_chapter_id') = (to_jsonb(OLD) - 'legacy_subject_id' - 'legacy_chapter_id');
  IF TG_OP IN ('UPDATE','DELETE') THEN
    SELECT status INTO st FROM public.cee_syllabus_versions WHERE id = OLD.syllabus_version_id FOR SHARE;
    IF st <> 'DRAFT' AND NOT link_only THEN
      RAISE EXCEPTION 'CURRICULUM_FROZEN: the syllabus is %; create a new version to change it', st USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  IF TG_OP IN ('INSERT','UPDATE') THEN
    SELECT status INTO st FROM public.cee_syllabus_versions WHERE id = NEW.syllabus_version_id FOR SHARE;
    IF st <> 'DRAFT' AND NOT link_only THEN
      RAISE EXCEPTION 'CURRICULUM_FROZEN: the syllabus is %; create a new version to change it', st USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END $$;
CREATE TRIGGER cee_guard_curriculum_frozen BEFORE INSERT OR UPDATE OR DELETE ON public.cee_curriculum_nodes
  FOR EACH ROW EXECUTE FUNCTION public.cee_guard_curriculum_frozen();

CREATE TABLE public.cee_learning_objectives (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id   uuid NOT NULL REFERENCES public.cee_curriculum_nodes(id) ON DELETE RESTRICT,
  code      text NOT NULL,
  text      text NOT NULL,
  sort_key  integer NOT NULL DEFAULT 0,
  UNIQUE (node_id, code)
);

-- ── Lessons and immutable revisions ───────────────────────────────────────
CREATE TABLE public.cee_lessons (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_code  cee_program_code NOT NULL,
  slug          text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9][a-z0-9-]{1,95}$'),
  title         text NOT NULL,
  created_by    uuid NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.cee_lesson_revisions (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id        uuid NOT NULL REFERENCES public.cee_lessons(id) ON DELETE RESTRICT,
  revision_number  integer NOT NULL CHECK (revision_number > 0),
  status           text NOT NULL DEFAULT 'DRAFT'
                   CHECK (status IN ('DRAFT','IN_REVIEW','CHANGES_REQUESTED','APPROVED','PUBLISHED','SUPERSEDED','ARCHIVED')),
  content          jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by       uuid NOT NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  submitted_at     timestamptz,
  updated_at       timestamptz NOT NULL DEFAULT now(),  -- set by the guard; editors send it back to detect concurrent edits
  UNIQUE (lesson_id, revision_number)
);

CREATE TABLE public.cee_lesson_mappings (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id          uuid NOT NULL REFERENCES public.cee_lessons(id) ON DELETE RESTRICT,
  node_id            uuid NOT NULL REFERENCES public.cee_curriculum_nodes(id) ON DELETE RESTRICT,
  cross_program      boolean NOT NULL DEFAULT false,
  status             text NOT NULL DEFAULT 'PROPOSED' CHECK (status IN ('PROPOSED','APPROVED','REJECTED')),
  approved_by        uuid,
  approved_at        timestamptz,
  created_by         uuid NOT NULL,
  created_at         timestamptz NOT NULL DEFAULT now(),
  UNIQUE (lesson_id, node_id)
);

-- A lesson may map only into its own program, unless the row is explicitly
-- marked cross-program (which the service gates behind its own review).
CREATE FUNCTION public.cee_check_mapping() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE lp text; np text;
BEGIN
  SELECT program_code INTO lp FROM public.cee_lessons WHERE id = NEW.lesson_id;
  SELECT s.program_code INTO np FROM public.cee_curriculum_nodes n
    JOIN public.cee_syllabus_versions s ON s.id = n.syllabus_version_id WHERE n.id = NEW.node_id;
  IF lp <> np AND NOT NEW.cross_program THEN
    RAISE EXCEPTION 'CROSS_PROGRAM_MAPPING: lesson is % but node is %', lp, np USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER cee_check_mapping BEFORE INSERT OR UPDATE ON public.cee_lesson_mappings
  FOR EACH ROW EXECUTE FUNCTION public.cee_check_mapping();

-- ── Assets and immutable versions ─────────────────────────────────────────
CREATE TABLE public.cee_visual_assets (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_code   cee_program_code NOT NULL,
  title          text NOT NULL,
  kind           text NOT NULL CHECK (kind IN ('MODEL_3D','DIAGRAM_2D','ANIMATION_2D','VIDEO','SIMULATION')),
  license        text,          -- e.g. 'owned', 'CC-BY-4.0', 'licensed:<vendor>'
  source_credit  text,
  created_by     uuid NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.cee_asset_versions (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id           uuid NOT NULL REFERENCES public.cee_visual_assets(id) ON DELETE RESTRICT,
  version_number     integer NOT NULL CHECK (version_number > 0),
  status             text NOT NULL DEFAULT 'UPLOADING'
                     CHECK (status IN ('UPLOADING','VALIDATING','VALIDATED','REJECTED')),
  quarantine_key     text NOT NULL UNIQUE,
  published_key      text UNIQUE,
  sha256             char(64) NOT NULL CHECK (sha256 ~ '^[0-9a-f]{64}$'),
  size_bytes         bigint NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 52428800),
  mime_type          text NOT NULL,
  scan_status        text NOT NULL DEFAULT 'NOT_SCANNED' CHECK (scan_status IN ('NOT_SCANNED','CLEAN','INFECTED','ERROR')),
  manifest           jsonb NOT NULL DEFAULT '{}'::jsonb,   -- hotspots, layers, sequences, fallback (zod-validated)
  validation_report  jsonb,
  locked_at          timestamptz,   -- set when first approved; bytes and manifest frozen from then on
  created_by         uuid NOT NULL,
  created_at         timestamptz NOT NULL DEFAULT now(),
  UNIQUE (asset_id, version_number),
  CHECK (published_key IS NULL OR (status = 'VALIDATED' AND scan_status = 'CLEAN'))   -- promoted only once validated AND scanned clean
);

CREATE TABLE public.cee_asset_jobs (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_version_id  uuid NOT NULL REFERENCES public.cee_asset_versions(id) ON DELETE RESTRICT,
  step              text NOT NULL CHECK (step IN ('VERIFY_UPLOAD','VALIDATE','SCAN','PROMOTE')),
  status            text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','RUNNING','DONE','FAILED','DEAD')),
  attempts          integer NOT NULL DEFAULT 0 CHECK (attempts BETWEEN 0 AND 3),
  last_error        text,
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (asset_version_id, step)
);

CREATE TABLE public.cee_lesson_assets (
  lesson_revision_id  uuid NOT NULL REFERENCES public.cee_lesson_revisions(id) ON DELETE RESTRICT,
  asset_version_id    uuid NOT NULL REFERENCES public.cee_asset_versions(id) ON DELETE RESTRICT,
  role                text NOT NULL DEFAULT 'PRIMARY' CHECK (role IN ('PRIMARY','FALLBACK','SUPPORTING')),
  sort_key            integer NOT NULL DEFAULT 0,
  PRIMARY KEY (lesson_revision_id, asset_version_id)
);

-- ── Questions: immutable revisions, pinned to lesson revisions ────────────
CREATE TABLE public.cee_question_revisions (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_key        uuid NOT NULL,                 -- stable identity across revisions
  revision_number     integer NOT NULL CHECK (revision_number > 0),
  program_code        cee_program_code NOT NULL,
  node_id             uuid REFERENCES public.cee_curriculum_nodes(id) ON DELETE RESTRICT,
  objective_id        uuid REFERENCES public.cee_learning_objectives(id) ON DELETE RESTRICT,
  stem                text NOT NULL,
  options             jsonb NOT NULL CHECK (jsonb_typeof(options) = 'array' AND jsonb_array_length(options) = 4),
  answer_key          char(1) NOT NULL CHECK (answer_key IN ('A','B','C','D')),
  rationale           text NOT NULL,
  difficulty          text CHECK (difficulty IN ('easy','medium','hard')),
  status              text NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','IN_REVIEW','APPROVED','RETIRED')),
  asset_version_id    uuid REFERENCES public.cee_asset_versions(id) ON DELETE RESTRICT,
  visual_state        jsonb,
  source_question_id  uuid,      -- existing public.questions.id it was imported from, if any
  created_by          uuid NOT NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (question_key, revision_number)
);

CREATE TABLE public.cee_lesson_questions (
  lesson_revision_id    uuid NOT NULL REFERENCES public.cee_lesson_revisions(id) ON DELETE RESTRICT,
  question_revision_id  uuid NOT NULL REFERENCES public.cee_question_revisions(id) ON DELETE RESTRICT,
  sort_key              integer NOT NULL DEFAULT 0,
  PRIMARY KEY (lesson_revision_id, question_revision_id)
);

-- ── Reviews: requests and append-only decisions ───────────────────────────
CREATE TABLE public.cee_review_requests (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type   text NOT NULL CHECK (entity_type IN ('LESSON_REVISION','ASSET_VERSION','QUESTION_REVISION','SYLLABUS_VERSION','LESSON_MAPPING')),
  entity_id     uuid NOT NULL,
  gate          text NOT NULL CHECK (gate IN ('SYLLABUS_MAPPING','SCIENTIFIC','VISUAL','ASSESSMENT','ACCESSIBILITY','RIGHTS')),
  status        text NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','DECIDED','CANCELLED')),
  requested_by  uuid NOT NULL,
  assigned_to   uuid,
  requested_at  timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX cee_one_open_request ON public.cee_review_requests (entity_type, entity_id, gate) WHERE status = 'OPEN';

CREATE TABLE public.cee_review_decisions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id   uuid NOT NULL REFERENCES public.cee_review_requests(id) ON DELETE RESTRICT,
  decision     text NOT NULL CHECK (decision IN ('APPROVE','REQUEST_CHANGES','REJECT')),
  comments     text,
  reviewer_id  uuid NOT NULL,
  decided_at   timestamptz NOT NULL DEFAULT now()
);

-- ── Publications: one active per lesson ───────────────────────────────────
CREATE TABLE public.cee_publications (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id           uuid NOT NULL REFERENCES public.cee_lessons(id) ON DELETE RESTRICT,
  lesson_revision_id  uuid NOT NULL UNIQUE REFERENCES public.cee_lesson_revisions(id) ON DELETE RESTRICT,
  published_by        uuid NOT NULL,
  published_at        timestamptz NOT NULL DEFAULT now(),
  superseded_at       timestamptz,
  archived_at         timestamptz,
  idempotency_key     text NOT NULL UNIQUE
);
CREATE UNIQUE INDEX cee_one_active_publication ON public.cee_publications (lesson_id)
  WHERE superseded_at IS NULL AND archived_at IS NULL;

-- ── Scoped roles ──────────────────────────────────────────────────────────
CREATE TABLE public.cee_role_assignments (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL,
  role_key         text NOT NULL CHECK (role_key IN ('ACADEMIC_DIRECTOR','SUBJECT_EXPERT','ANIMATOR','EDITOR',
                                                     'QUESTION_REVIEWER','ACCESSIBILITY_REVIEWER','RIGHTS_REVIEWER','PUBLISHER')),
  program_code     cee_program_code NOT NULL,
  subject_node_id  uuid REFERENCES public.cee_curriculum_nodes(id) ON DELETE RESTRICT,  -- NULL = whole program
  granted_by       uuid NOT NULL,
  granted_at       timestamptz NOT NULL DEFAULT now(),
  revoked_at       timestamptz
);
CREATE UNIQUE INDEX cee_role_active ON public.cee_role_assignments
  (user_id, role_key, program_code, coalesce(subject_node_id, '00000000-0000-0000-0000-000000000000'::uuid))
  WHERE revoked_at IS NULL;

-- ── Audit (append-only) ───────────────────────────────────────────────────
CREATE TABLE public.cee_audit_logs (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_id     uuid,
  action       text NOT NULL,
  entity_type  text NOT NULL,
  entity_id    uuid,
  before_json  jsonb,
  after_json   jsonb,
  request_id   text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ── Student progress, events, attempts ────────────────────────────────────
CREATE TABLE public.cee_student_progress (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      uuid NOT NULL,
  lesson_id       uuid NOT NULL REFERENCES public.cee_lessons(id) ON DELETE RESTRICT,
  publication_id  uuid NOT NULL REFERENCES public.cee_publications(id) ON DELETE RESTRICT,
  state           text NOT NULL DEFAULT 'IN_PROGRESS' CHECK (state IN ('IN_PROGRESS','COMPLETED')),
  objectives_met  jsonb NOT NULL DEFAULT '[]'::jsonb,
  best_score      numeric(5,2),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, publication_id)
);

CREATE TABLE public.cee_player_events (
  event_id          uuid PRIMARY KEY,                 -- client-generated: duplicates are rejected
  student_id        uuid NOT NULL,
  publication_id    uuid NOT NULL REFERENCES public.cee_publications(id) ON DELETE RESTRICT,
  asset_version_id  uuid REFERENCES public.cee_asset_versions(id) ON DELETE RESTRICT,
  type              text NOT NULL CHECK (type IN ('LESSON_OPENED','PLAYER_READY','PLAYER_ERROR','FALLBACK_SHOWN',
                                                  'STRUCTURE_SELECTED','SEQUENCE_STEP','SEQUENCE_COMPLETED','SECTION_READ')),
  payload           jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (octet_length(payload::text) <= 8192),
  occurred_at       timestamptz NOT NULL,
  received_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX cee_events_student_pub ON public.cee_player_events (student_id, publication_id);

CREATE TABLE public.cee_attempts (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id       uuid NOT NULL,
  publication_id   uuid NOT NULL REFERENCES public.cee_publications(id) ON DELETE RESTRICT,
  answers          jsonb NOT NULL,
  score            numeric(6,2) NOT NULL,
  max_score        numeric(6,2) NOT NULL,
  idempotency_key  text NOT NULL UNIQUE,
  submitted_at     timestamptz NOT NULL DEFAULT now()
);

-- ═══ Immutability and append-only rules ════════════════════════════════════

-- Lesson revisions: content frozen from the moment it is submitted for review,
-- so every approval applies to exactly the content reviewed. "Revise" after
-- CHANGES_REQUESTED creates a NEW revision; the old one is never edited.
CREATE FUNCTION public.cee_guard_lesson_revision() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.status <> 'DRAFT' THEN RAISE EXCEPTION 'IMMUTABLE_REVISION: only drafts can be deleted' USING ERRCODE = 'check_violation'; END IF;
    RETURN OLD;
  END IF;
  IF OLD.status <> 'DRAFT'
     AND (NEW.content IS DISTINCT FROM OLD.content OR NEW.lesson_id <> OLD.lesson_id OR NEW.revision_number <> OLD.revision_number) THEN
    RAISE EXCEPTION 'IMMUTABLE_REVISION: create a new revision instead' USING ERRCODE = 'check_violation';
  END IF;
  IF NEW.status <> OLD.status AND NOT (
       (OLD.status = 'DRAFT'             AND NEW.status = 'IN_REVIEW')
    OR (OLD.status = 'IN_REVIEW'         AND NEW.status IN ('CHANGES_REQUESTED','APPROVED'))
    OR (OLD.status = 'APPROVED'          AND NEW.status = 'PUBLISHED')
    OR (OLD.status = 'PUBLISHED'         AND NEW.status IN ('SUPERSEDED','ARCHIVED'))
  ) THEN
    RAISE EXCEPTION 'ILLEGAL_TRANSITION: % -> %', OLD.status, NEW.status USING ERRCODE = 'check_violation';
  END IF;
  IF NEW.status = 'PUBLISHED' AND OLD.status <> 'PUBLISHED'
     AND coalesce(current_setting('cee.publishing', true), '') <> 'on' THEN
    RAISE EXCEPTION 'PUBLISH_VIA_FUNCTION: use cee_publish_revision()' USING ERRCODE = 'check_violation';
  END IF;
  NEW.updated_at := clock_timestamp();
  RETURN NEW;
END $$;
CREATE TRIGGER cee_guard_lesson_revision BEFORE UPDATE OR DELETE ON public.cee_lesson_revisions
  FOR EACH ROW EXECUTE FUNCTION public.cee_guard_lesson_revision();

-- Asset versions: bytes, checksum and manifest frozen once locked.
CREATE FUNCTION public.cee_guard_asset_version() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN RAISE EXCEPTION 'IMMUTABLE_ASSET: asset versions are never deleted' USING ERRCODE = 'check_violation'; END IF;
  IF NEW.sha256 <> OLD.sha256 OR NEW.quarantine_key <> OLD.quarantine_key OR NEW.size_bytes <> OLD.size_bytes THEN
    RAISE EXCEPTION 'IMMUTABLE_ASSET: bytes never change; upload a new version' USING ERRCODE = 'check_violation';
  END IF;
  IF OLD.published_key IS NOT NULL AND NEW.published_key IS DISTINCT FROM OLD.published_key THEN
    RAISE EXCEPTION 'IMMUTABLE_ASSET: published key is permanent' USING ERRCODE = 'check_violation';
  END IF;
  IF OLD.locked_at IS NOT NULL AND (NEW.manifest IS DISTINCT FROM OLD.manifest OR NEW.locked_at IS DISTINCT FROM OLD.locked_at) THEN
    RAISE EXCEPTION 'IMMUTABLE_ASSET: approved manifest is frozen; create a new version' USING ERRCODE = 'check_violation';
  END IF;
  -- Pipeline states only move forward: UPLOADING → VALIDATING → VALIDATED | REJECTED.
  IF NEW.status <> OLD.status AND NOT (
       (OLD.status = 'UPLOADING'  AND NEW.status IN ('VALIDATING','REJECTED'))
    OR (OLD.status = 'VALIDATING' AND NEW.status IN ('VALIDATED','REJECTED'))) THEN
    RAISE EXCEPTION 'ILLEGAL_TRANSITION: asset version % to %', OLD.status, NEW.status USING ERRCODE = 'check_violation';
  END IF;
  -- A scan verdict of CLEAN or INFECTED is final; ERROR may be retried.
  IF NEW.scan_status <> OLD.scan_status AND OLD.scan_status IN ('CLEAN','INFECTED') THEN
    RAISE EXCEPTION 'ILLEGAL_TRANSITION: scan result % is final', OLD.scan_status USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER cee_guard_asset_version BEFORE UPDATE OR DELETE ON public.cee_asset_versions
  FOR EACH ROW EXECUTE FUNCTION public.cee_guard_asset_version();

-- Question revisions: frozen once approved.
CREATE FUNCTION public.cee_guard_question_revision() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.status <> 'DRAFT' THEN RAISE EXCEPTION 'IMMUTABLE_QUESTION' USING ERRCODE = 'check_violation'; END IF;
    RETURN OLD;
  END IF;
  IF OLD.status IN ('IN_REVIEW','APPROVED','RETIRED') AND (
       NEW.stem IS DISTINCT FROM OLD.stem OR NEW.options IS DISTINCT FROM OLD.options
    OR NEW.answer_key IS DISTINCT FROM OLD.answer_key OR NEW.rationale IS DISTINCT FROM OLD.rationale
    OR NEW.asset_version_id IS DISTINCT FROM OLD.asset_version_id OR NEW.visual_state IS DISTINCT FROM OLD.visual_state) THEN
    RAISE EXCEPTION 'IMMUTABLE_QUESTION: create a new revision instead' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER cee_guard_question_revision BEFORE UPDATE OR DELETE ON public.cee_question_revisions
  FOR EACH ROW EXECUTE FUNCTION public.cee_guard_question_revision();

-- Pinned assets and questions freeze with their revision: once a revision
-- leaves DRAFT, nothing can be swapped in or out behind the reviewers' backs.
CREATE FUNCTION public.cee_guard_revision_pins() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE st text;
BEGIN
  IF TG_OP IN ('UPDATE','DELETE') THEN
    SELECT status INTO st FROM public.cee_lesson_revisions WHERE id = OLD.lesson_revision_id;
    IF st IS DISTINCT FROM 'DRAFT' THEN
      RAISE EXCEPTION 'IMMUTABLE_REVISION: pinned assets and questions change only in a draft' USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  IF TG_OP IN ('INSERT','UPDATE') THEN
    SELECT status INTO st FROM public.cee_lesson_revisions WHERE id = NEW.lesson_revision_id;
    IF st IS DISTINCT FROM 'DRAFT' THEN
      RAISE EXCEPTION 'IMMUTABLE_REVISION: pinned assets and questions change only in a draft' USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
  END IF;
  RETURN OLD;
END $$;
CREATE TRIGGER cee_guard_lesson_asset_pins BEFORE INSERT OR UPDATE OR DELETE ON public.cee_lesson_assets
  FOR EACH ROW EXECUTE FUNCTION public.cee_guard_revision_pins();
CREATE TRIGGER cee_guard_lesson_question_pins BEFORE INSERT OR UPDATE OR DELETE ON public.cee_lesson_questions
  FOR EACH ROW EXECUTE FUNCTION public.cee_guard_revision_pins();

-- An asset version's manifest freezes when its first review is requested.
CREATE FUNCTION public.cee_lock_on_review() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.entity_type = 'ASSET_VERSION' THEN
    UPDATE public.cee_asset_versions SET locked_at = now() WHERE id = NEW.entity_id AND locked_at IS NULL;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER cee_lock_on_review AFTER INSERT ON public.cee_review_requests
  FOR EACH ROW EXECUTE FUNCTION public.cee_lock_on_review();

-- Append-only tables.
CREATE FUNCTION public.cee_append_only() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'APPEND_ONLY: % rows cannot be changed or deleted', TG_TABLE_NAME USING ERRCODE = 'check_violation';
END $$;
CREATE TRIGGER cee_decisions_append_only BEFORE UPDATE OR DELETE ON public.cee_review_decisions
  FOR EACH ROW EXECUTE FUNCTION public.cee_append_only();
CREATE TRIGGER cee_audit_append_only BEFORE UPDATE OR DELETE ON public.cee_audit_logs
  FOR EACH ROW EXECUTE FUNCTION public.cee_append_only();
CREATE TRIGGER cee_events_append_only BEFORE UPDATE OR DELETE ON public.cee_player_events
  FOR EACH ROW EXECUTE FUNCTION public.cee_append_only();
CREATE TRIGGER cee_attempts_append_only BEFORE UPDATE OR DELETE ON public.cee_attempts
  FOR EACH ROW EXECUTE FUNCTION public.cee_append_only();

-- Separation of duties: nobody decides on a request for something they created.
CREATE FUNCTION public.cee_check_decision() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE r record; creator uuid;
BEGIN
  SELECT * INTO r FROM public.cee_review_requests WHERE id = NEW.request_id;
  IF r.status <> 'OPEN' THEN RAISE EXCEPTION 'REVIEW_CLOSED' USING ERRCODE = 'check_violation'; END IF;
  creator := CASE r.entity_type
    WHEN 'LESSON_REVISION'   THEN (SELECT created_by FROM public.cee_lesson_revisions   WHERE id = r.entity_id)
    WHEN 'ASSET_VERSION'     THEN (SELECT created_by FROM public.cee_asset_versions     WHERE id = r.entity_id)
    WHEN 'QUESTION_REVISION' THEN (SELECT created_by FROM public.cee_question_revisions WHERE id = r.entity_id)
    WHEN 'SYLLABUS_VERSION'  THEN (SELECT created_by FROM public.cee_syllabus_versions  WHERE id = r.entity_id)
    WHEN 'LESSON_MAPPING'    THEN (SELECT created_by FROM public.cee_lesson_mappings    WHERE id = r.entity_id)
  END;
  IF creator = NEW.reviewer_id THEN
    RAISE EXCEPTION 'SOD_VIOLATION: the creator cannot review their own work' USING ERRCODE = 'check_violation';
  END IF;
  UPDATE public.cee_review_requests SET status = 'DECIDED' WHERE id = NEW.request_id;
  RETURN NEW;
END $$;
CREATE TRIGGER cee_check_decision BEFORE INSERT ON public.cee_review_decisions
  FOR EACH ROW EXECUTE FUNCTION public.cee_check_decision();

-- ═══ Publication transaction ═══════════════════════════════════════════════
-- Gates required for a lesson revision. Asset versions need SCIENTIFIC, VISUAL
-- and RIGHTS on the exact version, plus VALIDATED + CLEAN + a fallback for 3D.
CREATE FUNCTION public.cee_latest_decision(p_type text, p_id uuid, p_gate text) RETURNS text
LANGUAGE sql STABLE AS $$
  SELECT d.decision FROM public.cee_review_decisions d
  JOIN public.cee_review_requests r ON r.id = d.request_id
  WHERE r.entity_type = p_type AND r.entity_id = p_id AND r.gate = p_gate
  ORDER BY d.decided_at DESC, d.id DESC LIMIT 1
$$;

CREATE FUNCTION public.cee_publish_revision(p_revision uuid, p_publisher uuid, p_idempotency_key text)
RETURNS uuid LANGUAGE plpgsql AS $$
DECLARE rev record; existing uuid; pub uuid; g text; a record; q record; m record;
BEGIN
  SELECT id INTO existing FROM public.cee_publications WHERE idempotency_key = p_idempotency_key;
  IF existing IS NOT NULL THEN RETURN existing; END IF;            -- safe retry

  SELECT * INTO rev FROM public.cee_lesson_revisions WHERE id = p_revision FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'NOT_FOUND' USING ERRCODE = 'no_data_found'; END IF;
  IF rev.status <> 'APPROVED' THEN RAISE EXCEPTION 'STATE_CONFLICT: revision is %', rev.status USING ERRCODE = 'check_violation'; END IF;
  IF rev.created_by = p_publisher THEN RAISE EXCEPTION 'SOD_VIOLATION: the author cannot publish' USING ERRCODE = 'check_violation'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.cee_role_assignments ra JOIN public.cee_lessons l ON l.id = rev.lesson_id
                 WHERE ra.user_id = p_publisher AND ra.role_key = 'PUBLISHER' AND ra.program_code = l.program_code AND ra.revoked_at IS NULL) THEN
    RAISE EXCEPTION 'FORBIDDEN: no PUBLISHER role for this program' USING ERRCODE = 'insufficient_privilege';
  END IF;

  FOREACH g IN ARRAY ARRAY['SYLLABUS_MAPPING','SCIENTIFIC','VISUAL','ASSESSMENT','ACCESSIBILITY','RIGHTS'] LOOP
    IF coalesce(public.cee_latest_decision('LESSON_REVISION', p_revision, g), '') <> 'APPROVE' THEN
      RAISE EXCEPTION 'ACADEMIC_APPROVAL_REQUIRED: gate % not approved', g USING ERRCODE = 'check_violation';
    END IF;
  END LOOP;

  -- At least one approved mapping, into a VERIFIED syllabus.
  IF NOT EXISTS (SELECT 1 FROM public.cee_lesson_mappings mp
                 JOIN public.cee_curriculum_nodes n ON n.id = mp.node_id
                 JOIN public.cee_syllabus_versions s ON s.id = n.syllabus_version_id
                 WHERE mp.lesson_id = rev.lesson_id AND mp.status = 'APPROVED' AND s.status = 'VERIFIED') THEN
    RAISE EXCEPTION 'MAPPING_NOT_VERIFIED' USING ERRCODE = 'check_violation';
  END IF;

  FOR a IN SELECT av.*, va.kind FROM public.cee_lesson_assets la
           JOIN public.cee_asset_versions av ON av.id = la.asset_version_id
           JOIN public.cee_visual_assets va ON va.id = av.asset_id
           WHERE la.lesson_revision_id = p_revision LOOP
    IF a.status <> 'VALIDATED' OR a.scan_status <> 'CLEAN' OR a.published_key IS NULL OR a.locked_at IS NULL THEN
      RAISE EXCEPTION 'ASSET_NOT_READY: %', a.id USING ERRCODE = 'check_violation';
    END IF;
    FOREACH g IN ARRAY ARRAY['SCIENTIFIC','VISUAL','RIGHTS'] LOOP
      IF coalesce(public.cee_latest_decision('ASSET_VERSION', a.id, g), '') <> 'APPROVE' THEN
        RAISE EXCEPTION 'ASSET_APPROVAL_REQUIRED: % on %', g, a.id USING ERRCODE = 'check_violation';
      END IF;
    END LOOP;
  END LOOP;
  IF EXISTS (SELECT 1 FROM public.cee_lesson_assets la JOIN public.cee_asset_versions av ON av.id = la.asset_version_id
             JOIN public.cee_visual_assets va ON va.id = av.asset_id
             WHERE la.lesson_revision_id = p_revision AND va.kind = 'MODEL_3D')
     AND NOT EXISTS (SELECT 1 FROM public.cee_lesson_assets WHERE lesson_revision_id = p_revision AND role = 'FALLBACK') THEN
    RAISE EXCEPTION 'FALLBACK_REQUIRED' USING ERRCODE = 'check_violation';
  END IF;

  FOR q IN SELECT qr.* FROM public.cee_lesson_questions lq JOIN public.cee_question_revisions qr ON qr.id = lq.question_revision_id
           WHERE lq.lesson_revision_id = p_revision LOOP
    IF q.status <> 'APPROVED' THEN RAISE EXCEPTION 'QUESTION_NOT_APPROVED: %', q.id USING ERRCODE = 'check_violation'; END IF;
  END LOOP;

  PERFORM set_config('cee.publishing', 'on', true);
  UPDATE public.cee_lesson_revisions SET status = 'SUPERSEDED'
   WHERE id IN (SELECT lesson_revision_id FROM public.cee_publications
                WHERE lesson_id = rev.lesson_id AND superseded_at IS NULL AND archived_at IS NULL);
  UPDATE public.cee_publications SET superseded_at = now()
   WHERE lesson_id = rev.lesson_id AND superseded_at IS NULL AND archived_at IS NULL;
  UPDATE public.cee_lesson_revisions SET status = 'PUBLISHED' WHERE id = p_revision;
  INSERT INTO public.cee_publications (lesson_id, lesson_revision_id, published_by, idempotency_key)
  VALUES (rev.lesson_id, p_revision, p_publisher, p_idempotency_key) RETURNING id INTO pub;
  INSERT INTO public.cee_audit_logs (actor_id, action, entity_type, entity_id, after_json)
  VALUES (p_publisher, 'PUBLISH', 'LESSON_REVISION', p_revision, jsonb_build_object('publication_id', pub));
  PERFORM set_config('cee.publishing', 'off', true);
  RETURN pub;
END $$;

-- ═══ Submission and review decisions (transactional) ═══════════════════════
-- The API checks scoped roles first; these make each step all-or-nothing.

-- DRAFT → IN_REVIEW, freeze pinned questions, open the six lesson gates.
CREATE FUNCTION public.cee_submit_revision(p_revision uuid, p_actor uuid) RETURNS void
LANGUAGE plpgsql AS $$
DECLARE g text;
BEGIN
  UPDATE public.cee_lesson_revisions SET status = 'IN_REVIEW', submitted_at = now()
   WHERE id = p_revision AND status = 'DRAFT';
  IF NOT FOUND THEN RAISE EXCEPTION 'STATE_CONFLICT: only a draft can be submitted' USING ERRCODE = 'check_violation'; END IF;
  UPDATE public.cee_question_revisions SET status = 'IN_REVIEW'
   WHERE status = 'DRAFT'
     AND id IN (SELECT question_revision_id FROM public.cee_lesson_questions WHERE lesson_revision_id = p_revision);
  FOREACH g IN ARRAY ARRAY['SYLLABUS_MAPPING','SCIENTIFIC','VISUAL','ASSESSMENT','ACCESSIBILITY','RIGHTS'] LOOP
    INSERT INTO public.cee_review_requests (entity_type, entity_id, gate, requested_by)
    VALUES ('LESSON_REVISION', p_revision, g, p_actor);
  END LOOP;
  INSERT INTO public.cee_audit_logs (actor_id, action, entity_type, entity_id)
  VALUES (p_actor, 'SUBMIT', 'LESSON_REVISION', p_revision);
END $$;

-- Record a decision on a lesson-revision gate and apply its consequences:
--  REQUEST_CHANGES / REJECT → revision CHANGES_REQUESTED, other open gates cancelled;
--  APPROVE on ASSESSMENT → pinned questions APPROVED;
--  APPROVE on SYLLABUS_MAPPING → the lesson's proposed mappings APPROVED;
--  all six gates approved → revision APPROVED.
CREATE FUNCTION public.cee_decide_review(p_request uuid, p_reviewer uuid, p_decision text, p_comments text)
RETURNS text LANGUAGE plpgsql AS $$
DECLARE r record; rev record; g text; pending int := 0;
BEGIN
  SELECT * INTO r FROM public.cee_review_requests WHERE id = p_request FOR UPDATE;
  IF r.id IS NULL THEN RAISE EXCEPTION 'NOT_FOUND: review request' USING ERRCODE = 'check_violation'; END IF;
  IF r.entity_type <> 'LESSON_REVISION' THEN
    RAISE EXCEPTION 'STATE_CONFLICT: only lesson-revision reviews are decided here' USING ERRCODE = 'check_violation';
  END IF;
  SELECT * INTO rev FROM public.cee_lesson_revisions WHERE id = r.entity_id FOR UPDATE;
  IF rev.status <> 'IN_REVIEW' THEN
    RAISE EXCEPTION 'STATE_CONFLICT: the revision is %, not in review', rev.status USING ERRCODE = 'check_violation';
  END IF;

  -- The decision trigger enforces separation of duties and closes the request.
  INSERT INTO public.cee_review_decisions (request_id, decision, comments, reviewer_id)
  VALUES (p_request, p_decision, p_comments, p_reviewer);

  IF p_decision IN ('REQUEST_CHANGES','REJECT') THEN
    UPDATE public.cee_lesson_revisions SET status = 'CHANGES_REQUESTED' WHERE id = rev.id;
    UPDATE public.cee_review_requests SET status = 'CANCELLED'
     WHERE entity_type = 'LESSON_REVISION' AND entity_id = rev.id AND status = 'OPEN';
  ELSE
    IF r.gate = 'ASSESSMENT' THEN
      UPDATE public.cee_question_revisions SET status = 'APPROVED'
       WHERE status = 'IN_REVIEW'
         AND id IN (SELECT question_revision_id FROM public.cee_lesson_questions WHERE lesson_revision_id = rev.id);
    ELSIF r.gate = 'SYLLABUS_MAPPING' THEN
      UPDATE public.cee_lesson_mappings SET status = 'APPROVED', approved_by = p_reviewer, approved_at = now()
       WHERE lesson_id = rev.lesson_id AND status = 'PROPOSED';
    END IF;
    FOREACH g IN ARRAY ARRAY['SYLLABUS_MAPPING','SCIENTIFIC','VISUAL','ASSESSMENT','ACCESSIBILITY','RIGHTS'] LOOP
      IF public.cee_latest_decision('LESSON_REVISION', rev.id, g) IS DISTINCT FROM 'APPROVE' THEN pending := pending + 1; END IF;
    END LOOP;
    IF pending = 0 THEN UPDATE public.cee_lesson_revisions SET status = 'APPROVED' WHERE id = rev.id; END IF;
  END IF;

  INSERT INTO public.cee_audit_logs (actor_id, action, entity_type, entity_id, after_json)
  VALUES (p_reviewer, 'REVIEW_' || p_decision, 'LESSON_REVISION', rev.id,
          jsonb_build_object('gate', r.gate, 'request_id', p_request));
  RETURN (SELECT status FROM public.cee_lesson_revisions WHERE id = rev.id);
END $$;

-- ═══ Syllabus import and verification (transactional) ═════════════════════
-- Import replaces a DRAFT syllabus's tree in one transaction: all rows or none.
-- p_nodes is an array ordered parents-first: [{id, parent_id, node_type, code,
-- title, sort_key, source_ref}]. The node triggers check shape, scope and cycles.
CREATE FUNCTION public.cee_import_curriculum(p_syllabus uuid, p_actor uuid, p_nodes jsonb, p_replace boolean, p_request_id text DEFAULT NULL)
RETURNS integer LANGUAGE plpgsql AS $$
DECLARE s record; existing int; n int := 0; e record;
BEGIN
  SELECT * INTO s FROM public.cee_syllabus_versions WHERE id = p_syllabus FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'NOT_FOUND' USING ERRCODE = 'no_data_found'; END IF;
  IF s.status <> 'DRAFT' THEN
    RAISE EXCEPTION 'CURRICULUM_FROZEN: the syllabus is %; create a new version to change it', s.status USING ERRCODE = 'check_violation';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.cee_role_assignments WHERE user_id = p_actor AND role_key IN ('ACADEMIC_DIRECTOR','EDITOR')
                 AND program_code = s.program_code AND subject_node_id IS NULL AND revoked_at IS NULL) THEN
    RAISE EXCEPTION 'FORBIDDEN: importing needs a program-wide ACADEMIC_DIRECTOR or EDITOR role' USING ERRCODE = 'insufficient_privilege';
  END IF;
  IF jsonb_typeof(p_nodes) IS DISTINCT FROM 'array' OR jsonb_array_length(p_nodes) NOT BETWEEN 1 AND 5000 THEN
    RAISE EXCEPTION 'CURRICULUM_SHAPE: an import needs between 1 and 5000 entries' USING ERRCODE = 'check_violation';
  END IF;

  SELECT count(*) INTO existing FROM public.cee_curriculum_nodes WHERE syllabus_version_id = p_syllabus;
  IF existing > 0 THEN
    IF NOT p_replace THEN
      RAISE EXCEPTION 'STATE_CONFLICT: this draft already has % entries; replace them or use a new draft', existing USING ERRCODE = 'check_violation';
    END IF;
    BEGIN
      LOOP  -- leaves first, so each parent is unreferenced when it goes
        DELETE FROM public.cee_curriculum_nodes x WHERE x.syllabus_version_id = p_syllabus
           AND NOT EXISTS (SELECT 1 FROM public.cee_curriculum_nodes c WHERE c.parent_id = x.id);
        EXIT WHEN NOT FOUND;
      END LOOP;
    EXCEPTION WHEN foreign_key_violation THEN
      RAISE EXCEPTION 'IN_USE: lessons, objectives or role scopes already point at entries in this draft' USING ERRCODE = 'check_violation';
    END;
  END IF;

  FOR e IN SELECT v, ord FROM jsonb_array_elements(p_nodes) WITH ORDINALITY AS t(v, ord) ORDER BY ord LOOP
    INSERT INTO public.cee_curriculum_nodes (id, syllabus_version_id, parent_id, node_type, code, title, sort_key, source_ref, created_by)
    VALUES ((e.v->>'id')::uuid, p_syllabus, (e.v->>'parent_id')::uuid, e.v->>'node_type', e.v->>'code', e.v->>'title',
            coalesce((e.v->>'sort_key')::int, 0), nullif(e.v->>'source_ref', ''), p_actor);
    n := n + 1;
  END LOOP;

  INSERT INTO public.cee_audit_logs (actor_id, action, entity_type, entity_id, after_json, request_id)
  VALUES (p_actor, 'CURRICULUM_IMPORT', 'SYLLABUS_VERSION', p_syllabus, jsonb_build_object('entries', n, 'replaced', existing), p_request_id);
  RETURN n;
END $$;

-- Verification: a program-wide academic director who neither created the
-- syllabus nor entered any of it, checking the same document it was entered
-- from (when one was recorded). The tree must have at least one subject, and
-- every subject at least one chapter.
CREATE FUNCTION public.cee_verify_syllabus(p_syllabus uuid, p_verifier uuid, p_source_url text, p_sha256 text, p_request_id text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE s record; subjects int; empty_subjects int; entries int;
BEGIN
  SELECT * INTO s FROM public.cee_syllabus_versions WHERE id = p_syllabus FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'NOT_FOUND' USING ERRCODE = 'no_data_found'; END IF;
  IF s.status <> 'DRAFT' THEN RAISE EXCEPTION 'STATE_CONFLICT: the syllabus is %', s.status USING ERRCODE = 'check_violation'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.cee_role_assignments WHERE user_id = p_verifier AND role_key = 'ACADEMIC_DIRECTOR'
                 AND program_code = s.program_code AND subject_node_id IS NULL AND revoked_at IS NULL) THEN
    RAISE EXCEPTION 'FORBIDDEN: verifying needs a program-wide ACADEMIC_DIRECTOR role' USING ERRCODE = 'insufficient_privilege';
  END IF;
  IF p_verifier = s.created_by
     OR EXISTS (SELECT 1 FROM public.cee_curriculum_nodes WHERE syllabus_version_id = p_syllabus AND created_by = p_verifier) THEN
    RAISE EXCEPTION 'SOD_VIOLATION: whoever created or entered this syllabus cannot verify it' USING ERRCODE = 'check_violation';
  END IF;
  IF p_sha256 IS NULL OR p_sha256 !~ '^[0-9a-f]{64}$' THEN
    RAISE EXCEPTION 'SOURCE_MISMATCH: a lowercase hex SHA-256 of the official document is required' USING ERRCODE = 'check_violation';
  END IF;
  IF s.source_sha256 IS NOT NULL AND s.source_sha256 <> p_sha256 THEN
    RAISE EXCEPTION 'SOURCE_MISMATCH: the document checked is not the one this syllabus was entered from' USING ERRCODE = 'check_violation';
  END IF;
  SELECT count(*) FILTER (WHERE node_type = 'SUBJECT'),
         count(*) FILTER (WHERE node_type = 'SUBJECT' AND NOT EXISTS (
           SELECT 1 FROM public.cee_curriculum_nodes c WHERE c.parent_id = n.id AND c.node_type = 'CHAPTER')),
         count(*)
    INTO subjects, empty_subjects, entries
    FROM public.cee_curriculum_nodes n WHERE n.syllabus_version_id = p_syllabus;
  IF subjects = 0 OR empty_subjects > 0 THEN
    RAISE EXCEPTION 'SYLLABUS_INCOMPLETE: % subject(s), % without a chapter', subjects, empty_subjects USING ERRCODE = 'check_violation';
  END IF;

  PERFORM set_config('cee.verifying', 'on', true);
  UPDATE public.cee_syllabus_versions
     SET status = 'VERIFIED', verified_by = p_verifier, verified_at = now(), source_sha256 = p_sha256,
         source_url = coalesce(nullif(p_source_url, ''), source_url)
   WHERE id = p_syllabus;
  PERFORM set_config('cee.verifying', 'off', true);
  INSERT INTO public.cee_audit_logs (actor_id, action, entity_type, entity_id, after_json, request_id)
  VALUES (p_verifier, 'SYLLABUS_VERIFY', 'SYLLABUS_VERSION', p_syllabus,
          jsonb_build_object('source_url', coalesce(nullif(p_source_url, ''), s.source_url), 'source_sha256', p_sha256, 'entries', entries), p_request_id);
END $$;

-- ═══ Asset review (transactional) ═══════════════════════════════════════════
-- A validated version goes to three gates at once. Submitting locks its manifest
-- (cee_lock_on_review); changes after that mean a new version, so a version is
-- submitted exactly once. Licence and credit are required for the rights gate.
CREATE FUNCTION public.cee_submit_asset_version(p_version uuid, p_actor uuid, p_request_id text DEFAULT NULL) RETURNS void
LANGUAGE plpgsql AS $$
DECLARE v record; a record; g text;
BEGIN
  SELECT * INTO v FROM public.cee_asset_versions WHERE id = p_version FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'NOT_FOUND' USING ERRCODE = 'no_data_found'; END IF;
  SELECT * INTO a FROM public.cee_visual_assets WHERE id = v.asset_id;
  IF v.status <> 'VALIDATED' THEN
    RAISE EXCEPTION 'STATE_CONFLICT: only a validated version can be reviewed (this one is %)', v.status USING ERRCODE = 'check_violation';
  END IF;
  IF EXISTS (SELECT 1 FROM public.cee_review_requests WHERE entity_type = 'ASSET_VERSION' AND entity_id = p_version) THEN
    RAISE EXCEPTION 'STATE_CONFLICT: this version was already sent for review; upload a new version to change it' USING ERRCODE = 'check_violation';
  END IF;
  IF v.manifest = '{}'::jsonb THEN
    RAISE EXCEPTION 'STATE_CONFLICT: describe the visual (its manifest) before review' USING ERRCODE = 'check_violation';
  END IF;
  IF nullif(btrim(coalesce(a.license, '')), '') IS NULL OR nullif(btrim(coalesce(a.source_credit, '')), '') IS NULL THEN
    RAISE EXCEPTION 'STATE_CONFLICT: record the licence and source credit before review' USING ERRCODE = 'check_violation';
  END IF;
  FOREACH g IN ARRAY ARRAY['SCIENTIFIC','VISUAL','RIGHTS'] LOOP
    INSERT INTO public.cee_review_requests (entity_type, entity_id, gate, requested_by) VALUES ('ASSET_VERSION', p_version, g, p_actor);
  END LOOP;
  INSERT INTO public.cee_audit_logs (actor_id, action, entity_type, entity_id, request_id)
  VALUES (p_actor, 'SUBMIT', 'ASSET_VERSION', p_version, p_request_id);
END $$;

-- Returns the version's review state afterwards: IN_REVIEW, APPROVED or CHANGES_REQUESTED.
CREATE FUNCTION public.cee_decide_asset_review(p_request uuid, p_reviewer uuid, p_decision text, p_comments text, p_request_id text DEFAULT NULL)
RETURNS text LANGUAGE plpgsql AS $$
DECLARE r record; g text; pending int := 0;
BEGIN
  SELECT * INTO r FROM public.cee_review_requests WHERE id = p_request FOR UPDATE;
  IF r.id IS NULL THEN RAISE EXCEPTION 'NOT_FOUND: review request' USING ERRCODE = 'check_violation'; END IF;
  IF r.entity_type <> 'ASSET_VERSION' THEN
    RAISE EXCEPTION 'STATE_CONFLICT: not an asset review' USING ERRCODE = 'check_violation';
  END IF;
  PERFORM 1 FROM public.cee_asset_versions WHERE id = r.entity_id FOR UPDATE;
  -- The decision trigger enforces separation of duties and closes the request.
  INSERT INTO public.cee_review_decisions (request_id, decision, comments, reviewer_id) VALUES (p_request, p_decision, p_comments, p_reviewer);
  INSERT INTO public.cee_audit_logs (actor_id, action, entity_type, entity_id, after_json, request_id)
  VALUES (p_reviewer, 'REVIEW_' || p_decision, 'ASSET_VERSION', r.entity_id, jsonb_build_object('gate', r.gate, 'request_id', p_request), p_request_id);
  IF p_decision IN ('REQUEST_CHANGES','REJECT') THEN
    UPDATE public.cee_review_requests SET status = 'CANCELLED'
     WHERE entity_type = 'ASSET_VERSION' AND entity_id = r.entity_id AND status = 'OPEN';
    RETURN 'CHANGES_REQUESTED';
  END IF;
  FOREACH g IN ARRAY ARRAY['SCIENTIFIC','VISUAL','RIGHTS'] LOOP
    IF public.cee_latest_decision('ASSET_VERSION', r.entity_id, g) IS DISTINCT FROM 'APPROVE' THEN pending := pending + 1; END IF;
  END LOOP;
  RETURN CASE WHEN pending = 0 THEN 'APPROVED' ELSE 'IN_REVIEW' END;
END $$;

-- ═══ Access: server only ═══════════════════════════════════════════════════
-- Row security on, no policies for anon/authenticated: the browser can't read or
-- write any cee_* table. Route handlers use the service role after verifyCeeScope().
DO $rls$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['cee_settings','cee_syllabus_versions','cee_curriculum_nodes','cee_learning_objectives',
    'cee_lessons','cee_lesson_revisions','cee_lesson_mappings','cee_visual_assets','cee_asset_versions','cee_asset_jobs',
    'cee_lesson_assets','cee_question_revisions','cee_lesson_questions','cee_review_requests','cee_review_decisions',
    'cee_publications','cee_role_assignments','cee_audit_logs','cee_student_progress','cee_player_events','cee_attempts'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC', t);
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN EXECUTE format('REVOKE ALL ON public.%I FROM anon', t); END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN EXECUTE format('REVOKE ALL ON public.%I FROM authenticated', t); END IF;
    -- The server's role gets exactly row access, stated here rather than inherited from
    -- Supabase's default privileges (no TRUNCATE, REFERENCES or TRIGGER).
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
      EXECUTE format('REVOKE ALL ON public.%I FROM service_role', t);
      EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO service_role', t);
    END IF;
  END LOOP;
END $rls$;
-- Functions: closed to everyone, then opened to the server role only. On Supabase,
-- new functions are executable by anon and authenticated through default
-- privileges, so revoking from PUBLIC alone would not be enough.
DO $fn$
DECLARE f regprocedure;
BEGIN
  FOR f IN SELECT p.oid::regprocedure FROM pg_proc p
           WHERE p.pronamespace = 'public'::regnamespace AND p.proname LIKE 'cee\_%' LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', f);
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon', f); END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN EXECUTE format('REVOKE ALL ON FUNCTION %s FROM authenticated', f); END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN EXECUTE format('REVOKE ALL ON FUNCTION %s FROM service_role', f); END IF;
  END LOOP;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    GRANT EXECUTE ON FUNCTION public.cee_publish_revision(uuid, uuid, text),
                              public.cee_submit_revision(uuid, uuid),
                              public.cee_decide_review(uuid, uuid, text, text),
                              public.cee_latest_decision(text, uuid, text),
                              public.cee_import_curriculum(uuid, uuid, jsonb, boolean, text),
                              public.cee_verify_syllabus(uuid, uuid, text, text, text),
                              public.cee_submit_asset_version(uuid, uuid, text),
                              public.cee_decide_asset_review(uuid, uuid, text, text, text)
      TO service_role;
  END IF;
END $fn$;


-- ═══ Storage: two private buckets ══════════════════════════════════════════
-- Uploads land in cee-quarantine through a signed, single-use URL; only files
-- that are validated and scanned clean are copied to cee-published. Neither is
-- public and neither has a policy, so only the server (service role) and signed
-- URLs reach them. Skipped where there is no Supabase Storage schema.
DO $buckets$ BEGIN
  IF to_regclass('storage.buckets') IS NOT NULL THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES
      ('cee-quarantine', 'cee-quarantine', false, 52428800, ARRAY['model/gltf-binary','image/svg+xml','image/png','image/webp']),
      ('cee-published',  'cee-published',  false, 52428800, ARRAY['model/gltf-binary','image/svg+xml','image/png','image/webp'])
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $buckets$;

COMMIT;
