-- Tests for 20261124_cee_visual_foundation.sql. Run on a FRESH scratch database only (a second run on the same database fails, because the first run's rows already exist):
--   psql -v ON_ERROR_STOP=1 -f 20261124_cee_visual_foundation.sql -f tests/cee_visual_foundation_test.sql
-- Each check prints PASS/FAIL; the script ends with a count and fails if any check failed.
\set QUIET on
SET client_min_messages = warning;

CREATE TEMP TABLE results (n serial, name text, ok boolean, detail text);
GRANT ALL ON results TO PUBLIC;
GRANT ALL ON SEQUENCE results_n_seq TO PUBLIC;
\o /dev/null

-- expect(sql, error-text-fragment): passes when the statement raises an error containing the fragment.
CREATE FUNCTION pg_temp.expect(name text, stmt text, fragment text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  BEGIN
    EXECUTE stmt;
    INSERT INTO results(name, ok, detail) VALUES (name, false, 'no error raised');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO results(name, ok, detail) VALUES (name, position(fragment IN SQLERRM) > 0, SQLERRM);
  END;
END $$;
CREATE FUNCTION pg_temp.check(name text, cond boolean, detail text DEFAULT '') RETURNS void LANGUAGE sql AS $$
  INSERT INTO results(name, ok, detail) VALUES (name, cond, detail);
$$;

-- people (plain uuids; the schema has no FK to auth.users by design)
CREATE TEMP TABLE ppl (k text PRIMARY KEY, id uuid);
INSERT INTO ppl VALUES ('editor', gen_random_uuid()), ('expert', gen_random_uuid()), ('director', gen_random_uuid()),
  ('publisher', gen_random_uuid()), ('student', gen_random_uuid()), ('nobody', gen_random_uuid());
CREATE FUNCTION pg_temp.u(k text) RETURNS uuid LANGUAGE sql AS $$ SELECT id FROM ppl WHERE ppl.k = $1 $$;

-- ── Curriculum (CEE-001) ───────────────────────────────────────────────────
INSERT INTO cee_syllabus_versions (id, program_code, label, created_by)
VALUES ('11111111-1111-1111-1111-111111111111', 'cee_medical', 'MEC CEE (dev fixture)', pg_temp.u('director')),
       ('22222222-2222-2222-2222-222222222222', 'ielts', 'IELTS (dev fixture)', pg_temp.u('director'));
INSERT INTO cee_curriculum_nodes (id, syllabus_version_id, parent_id, node_type, code, title, created_by) VALUES
 ('a0000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111',NULL,'SUBJECT','biology','Biology',pg_temp.u('director')),
 ('a0000000-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111','a0000000-0000-0000-0000-000000000001','CHAPTER','human-physiology','Human Physiology',pg_temp.u('director')),
 ('a0000000-0000-0000-0000-000000000003','11111111-1111-1111-1111-111111111111','a0000000-0000-0000-0000-000000000002','TOPIC','circulatory-system','Circulatory System',pg_temp.u('director')),
 ('a0000000-0000-0000-0000-000000000004','11111111-1111-1111-1111-111111111111','a0000000-0000-0000-0000-000000000003','TOPIC','human-heart','Human Heart',pg_temp.u('director')),
 ('b0000000-0000-0000-0000-000000000001','22222222-2222-2222-2222-222222222222',NULL,'SUBJECT','writing','Writing',pg_temp.u('director'));
SELECT pg_temp.check('CEE-001 Biology > Human Physiology > Circulatory > Heart tree accepted',
  (SELECT count(*) FROM cee_curriculum_nodes WHERE syllabus_version_id = '11111111-1111-1111-1111-111111111111') = 4);
SELECT pg_temp.expect('topic directly under a subject is rejected',
  $q$INSERT INTO cee_curriculum_nodes (syllabus_version_id,parent_id,node_type,code,title,created_by) VALUES ('11111111-1111-1111-1111-111111111111','a0000000-0000-0000-0000-000000000001','TOPIC','x','X',gen_random_uuid())$q$, 'CURRICULUM_SHAPE');
SELECT pg_temp.expect('parent from another syllabus/program is rejected',
  $q$INSERT INTO cee_curriculum_nodes (syllabus_version_id,parent_id,node_type,code,title,created_by) VALUES ('22222222-2222-2222-2222-222222222222','a0000000-0000-0000-0000-000000000001','CHAPTER','x','X',gen_random_uuid())$q$, 'CURRICULUM_SCOPE');
SELECT pg_temp.expect('cycle is rejected',
  $q$UPDATE cee_curriculum_nodes SET parent_id = 'a0000000-0000-0000-0000-000000000004' WHERE id = 'a0000000-0000-0000-0000-000000000003'$q$, 'CURRICULUM_CYCLE');
SELECT pg_temp.expect('duplicate sibling code is rejected',
  $q$INSERT INTO cee_curriculum_nodes (syllabus_version_id,parent_id,node_type,code,title,created_by) VALUES ('11111111-1111-1111-1111-111111111111','a0000000-0000-0000-0000-000000000003','TOPIC','human-heart','Dup',gen_random_uuid())$q$, 'duplicate key');
SELECT pg_temp.expect('unknown program code is rejected',
  $q$INSERT INTO cee_syllabus_versions (program_code,label,created_by) VALUES ('pte','PTE',gen_random_uuid())$q$, 'cee_program_code');

-- ── Lesson, mapping (CEE-002) ─────────────────────────────────────────────
INSERT INTO cee_lessons (id, program_code, slug, title, created_by)
VALUES ('c0000000-0000-0000-0000-000000000001', 'cee_medical', 'human-heart', 'Human Heart (dev fixture)', pg_temp.u('editor'));
INSERT INTO cee_lesson_mappings (id, lesson_id, node_id, created_by)
VALUES ('d0000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000004', pg_temp.u('editor'));
SELECT pg_temp.expect('CEE-002 mapping a CEE lesson into another program is rejected',
  $q$INSERT INTO cee_lesson_mappings (lesson_id,node_id,created_by) VALUES ('c0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000001',gen_random_uuid())$q$, 'CROSS_PROGRAM_MAPPING');

-- ── Revisions (CEE-006) ───────────────────────────────────────────────────
INSERT INTO cee_lesson_revisions (id, lesson_id, revision_number, content, created_by)
VALUES ('e0000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-000000000001',1,'{"v":1}', pg_temp.u('editor'));
UPDATE cee_lesson_revisions SET content = '{"v":"1b"}' WHERE id = 'e0000000-0000-0000-0000-000000000001';
SELECT pg_temp.check('a draft can be edited', (SELECT content->>'v' FROM cee_lesson_revisions WHERE id='e0000000-0000-0000-0000-000000000001') = '1b');
UPDATE cee_lesson_revisions SET status = 'IN_REVIEW', submitted_at = now() WHERE id = 'e0000000-0000-0000-0000-000000000001';
SELECT pg_temp.expect('CEE-006 a submitted revision cannot be edited',
  $q$UPDATE cee_lesson_revisions SET content = '{"v":"sneaky"}' WHERE id = 'e0000000-0000-0000-0000-000000000001'$q$, 'IMMUTABLE_REVISION');
SELECT pg_temp.expect('IN_REVIEW cannot jump to PUBLISHED',
  $q$UPDATE cee_lesson_revisions SET status = 'PUBLISHED' WHERE id = 'e0000000-0000-0000-0000-000000000001'$q$, 'ILLEGAL_TRANSITION');

-- ── Reviews, separation of duties (CEE-005) ──────────────────────────────
INSERT INTO cee_review_requests (id, entity_type, entity_id, gate, requested_by)
VALUES ('f0000000-0000-0000-0000-000000000001','LESSON_REVISION','e0000000-0000-0000-0000-000000000001','SCIENTIFIC', pg_temp.u('editor'));
SELECT pg_temp.expect('the author cannot review their own revision',
  format($q$INSERT INTO cee_review_decisions (request_id, decision, reviewer_id) VALUES ('f0000000-0000-0000-0000-000000000001','APPROVE','%s')$q$, pg_temp.u('editor')), 'SOD_VIOLATION');
INSERT INTO cee_review_decisions (request_id, decision, comments, reviewer_id)
VALUES ('f0000000-0000-0000-0000-000000000001','REQUEST_CHANGES','Valve labels swapped', pg_temp.u('expert'));
UPDATE cee_lesson_revisions SET status = 'CHANGES_REQUESTED' WHERE id = 'e0000000-0000-0000-0000-000000000001';
INSERT INTO cee_role_assignments (user_id, role_key, program_code, granted_by) VALUES (pg_temp.u('publisher'),'PUBLISHER','cee_medical',pg_temp.u('director'));
SELECT pg_temp.expect('CEE-005 a revision with requested changes cannot be published',
  format($q$SELECT cee_publish_revision('e0000000-0000-0000-0000-000000000001','%s','k-r1')$q$, pg_temp.u('publisher')), 'STATE_CONFLICT');
SELECT pg_temp.expect('a revision with requested changes is not reopened; a new revision is made',
  $q$UPDATE cee_lesson_revisions SET status = 'DRAFT' WHERE id = 'e0000000-0000-0000-0000-000000000001'$q$, 'ILLEGAL_TRANSITION');
SELECT pg_temp.expect('decisions are append-only',
  $q$UPDATE cee_review_decisions SET decision = 'APPROVE'$q$, 'APPEND_ONLY');
SELECT pg_temp.expect('a decided request takes no second decision',
  format($q$INSERT INTO cee_review_decisions (request_id, decision, reviewer_id) VALUES ('f0000000-0000-0000-0000-000000000001','APPROVE','%s')$q$, pg_temp.u('director')), 'REVIEW_CLOSED');

-- revision 2, all six gates approved by non-authors
INSERT INTO cee_lesson_revisions (id, lesson_id, revision_number, content, created_by)
VALUES ('e0000000-0000-0000-0000-000000000002','c0000000-0000-0000-0000-000000000001',2,'{"v":2}', pg_temp.u('editor'));
UPDATE cee_lesson_revisions SET status = 'IN_REVIEW' WHERE id = 'e0000000-0000-0000-0000-000000000002';
DO $g$ DECLARE g text; rid uuid; BEGIN
  FOREACH g IN ARRAY ARRAY['SYLLABUS_MAPPING','SCIENTIFIC','VISUAL','ASSESSMENT','ACCESSIBILITY','RIGHTS'] LOOP
    INSERT INTO cee_review_requests (entity_type, entity_id, gate, requested_by)
    VALUES ('LESSON_REVISION','e0000000-0000-0000-0000-000000000002', g, pg_temp.u('editor')) RETURNING id INTO rid;
    INSERT INTO cee_review_decisions (request_id, decision, reviewer_id) VALUES (rid, 'APPROVE', pg_temp.u('expert'));
  END LOOP;
END $g$;
UPDATE cee_lesson_revisions SET status = 'APPROVED' WHERE id = 'e0000000-0000-0000-0000-000000000002';

-- ── Publication gates ─────────────────────────────────────────────────────
SELECT pg_temp.expect('cannot publish against an unverified syllabus or unapproved mapping',
  format($q$SELECT cee_publish_revision('e0000000-0000-0000-0000-000000000002','%s','k-r2')$q$, pg_temp.u('publisher')), 'MAPPING_NOT_VERIFIED');
SELECT pg_temp.expect('a syllabus cannot be VERIFIED without verifier and source hash',
  $q$UPDATE cee_syllabus_versions SET status = 'VERIFIED' WHERE id = '11111111-1111-1111-1111-111111111111'$q$, 'check constraint');
UPDATE cee_syllabus_versions SET status = 'VERIFIED', verified_by = pg_temp.u('director'), verified_at = now(),
  source_sha256 = repeat('a', 64) WHERE id = '11111111-1111-1111-1111-111111111111';
UPDATE cee_lesson_mappings SET status = 'APPROVED', approved_by = pg_temp.u('director'), approved_at = now()
  WHERE id = 'd0000000-0000-0000-0000-000000000001';
SELECT pg_temp.expect('the author cannot publish',
  format($q$SELECT cee_publish_revision('e0000000-0000-0000-0000-000000000002','%s','k-r2')$q$, pg_temp.u('editor')), 'SOD_VIOLATION');
SELECT pg_temp.expect('someone without the PUBLISHER role cannot publish',
  format($q$SELECT cee_publish_revision('e0000000-0000-0000-0000-000000000002','%s','k-r2')$q$, pg_temp.u('nobody')), 'FORBIDDEN');
SELECT pg_temp.expect('publishing by flipping the status directly is refused',
  $q$UPDATE cee_lesson_revisions SET status = 'PUBLISHED' WHERE id = 'e0000000-0000-0000-0000-000000000002'$q$, 'PUBLISH_VIA_FUNCTION');
CREATE TEMP TABLE pub1 AS SELECT cee_publish_revision('e0000000-0000-0000-0000-000000000002', pg_temp.u('publisher'), 'k-r2') AS id;
SELECT pg_temp.check('an approved revision publishes', (SELECT status FROM cee_lesson_revisions WHERE id='e0000000-0000-0000-0000-000000000002') = 'PUBLISHED');
SELECT pg_temp.check('a retry with the same idempotency key returns the same publication',
  cee_publish_revision('e0000000-0000-0000-0000-000000000002', pg_temp.u('publisher'), 'k-r2') = (SELECT id FROM pub1));
SELECT pg_temp.expect('CEE-010 a published revision is immutable',
  $q$UPDATE cee_lesson_revisions SET content = '{"v":"changed"}' WHERE id = 'e0000000-0000-0000-0000-000000000002'$q$, 'IMMUTABLE_REVISION');
SELECT pg_temp.check('publication wrote an audit row', EXISTS (SELECT 1 FROM cee_audit_logs WHERE action = 'PUBLISH'));
SELECT pg_temp.expect('audit rows are append-only', $q$DELETE FROM cee_audit_logs$q$, 'APPEND_ONLY');

-- ── Assets: immutability, scan and fallback gates ────────────────────────
INSERT INTO cee_visual_assets (id, program_code, title, kind, license, created_by) VALUES
 ('10000000-0000-0000-0000-000000000001','cee_medical','Heart model (dev fixture)','MODEL_3D','dev-fixture-not-for-production',pg_temp.u('editor')),
 ('10000000-0000-0000-0000-000000000002','cee_medical','Heart diagram fallback (dev fixture)','DIAGRAM_2D','dev-fixture-not-for-production',pg_temp.u('editor'));
INSERT INTO cee_asset_versions (id, asset_id, version_number, quarantine_key, sha256, size_bytes, mime_type, manifest, created_by) VALUES
 ('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001',1,'q/heart/1',repeat('b',64),4000000,'model/gltf-binary','{"hotspots":[]}',pg_temp.u('editor')),
 ('20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000002',1,'q/heart-fb/1',repeat('c',64),90000,'image/png','{}',pg_temp.u('editor'));
SELECT pg_temp.expect('an asset over 50 MB is rejected',
  $q$INSERT INTO cee_asset_versions (asset_id,version_number,quarantine_key,sha256,size_bytes,mime_type,created_by) VALUES ('10000000-0000-0000-0000-000000000001',9,'q/big',repeat('d',64),60000000,'model/gltf-binary',gen_random_uuid())$q$, 'check constraint');
SELECT pg_temp.expect('an asset version''s bytes never change',
  $q$UPDATE cee_asset_versions SET sha256 = repeat('e',64) WHERE id = '20000000-0000-0000-0000-000000000001'$q$, 'IMMUTABLE_ASSET');
UPDATE cee_asset_versions SET manifest = '{"hotspots":[{"id":"left-ventricle"}]}' WHERE id = '20000000-0000-0000-0000-000000000001';
SELECT pg_temp.check('a manifest is editable before review', (SELECT manifest->'hotspots'->0->>'id' FROM cee_asset_versions WHERE id='20000000-0000-0000-0000-000000000001') = 'left-ventricle');
DO $a$ DECLARE g text; rid uuid; v uuid; BEGIN
  FOREACH v IN ARRAY ARRAY['20000000-0000-0000-0000-000000000001'::uuid,'20000000-0000-0000-0000-000000000002'::uuid] LOOP
    FOREACH g IN ARRAY ARRAY['SCIENTIFIC','VISUAL','RIGHTS'] LOOP
      INSERT INTO cee_review_requests (entity_type, entity_id, gate, requested_by) VALUES ('ASSET_VERSION', v, g, pg_temp.u('editor')) RETURNING id INTO rid;
      INSERT INTO cee_review_decisions (request_id, decision, reviewer_id) VALUES (rid, 'APPROVE', pg_temp.u('expert'));
    END LOOP;
  END LOOP;
END $a$;
SELECT pg_temp.expect('a manifest under review is frozen',
  $q$UPDATE cee_asset_versions SET manifest = '{"hotspots":[]}' WHERE id = '20000000-0000-0000-0000-000000000001'$q$, 'IMMUTABLE_ASSET');

-- revision 3 pins the 3D model only
INSERT INTO cee_lesson_revisions (id, lesson_id, revision_number, content, created_by)
VALUES ('e0000000-0000-0000-0000-000000000003','c0000000-0000-0000-0000-000000000001',3,'{"v":3}', pg_temp.u('editor'));
INSERT INTO cee_lesson_assets (lesson_revision_id, asset_version_id, role) VALUES ('e0000000-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000001','PRIMARY');
UPDATE cee_lesson_revisions SET status = 'IN_REVIEW' WHERE id = 'e0000000-0000-0000-0000-000000000003';
DO $g$ DECLARE g text; rid uuid; BEGIN
  FOREACH g IN ARRAY ARRAY['SYLLABUS_MAPPING','SCIENTIFIC','VISUAL','ASSESSMENT','ACCESSIBILITY','RIGHTS'] LOOP
    INSERT INTO cee_review_requests (entity_type, entity_id, gate, requested_by)
    VALUES ('LESSON_REVISION','e0000000-0000-0000-0000-000000000003', g, pg_temp.u('editor')) RETURNING id INTO rid;
    INSERT INTO cee_review_decisions (request_id, decision, reviewer_id) VALUES (rid, 'APPROVE', pg_temp.u('expert'));
  END LOOP;
END $g$;
UPDATE cee_lesson_revisions SET status = 'APPROVED' WHERE id = 'e0000000-0000-0000-0000-000000000003';
SELECT pg_temp.expect('an unscanned, unvalidated asset blocks publication',
  format($q$SELECT cee_publish_revision('e0000000-0000-0000-0000-000000000003','%s','k-r3')$q$, pg_temp.u('publisher')), 'ASSET_NOT_READY');
UPDATE cee_asset_versions SET status = 'VALIDATED', scan_status = 'CLEAN', published_key = 'p/' || id
 WHERE id IN ('20000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000002');
SELECT pg_temp.expect('a 3D lesson without a fallback cannot be published',
  format($q$SELECT cee_publish_revision('e0000000-0000-0000-0000-000000000003','%s','k-r3')$q$, pg_temp.u('publisher')), 'FALLBACK_REQUIRED');
SELECT pg_temp.expect('a published asset key is permanent',
  $q$UPDATE cee_asset_versions SET published_key = 'p/other' WHERE id = '20000000-0000-0000-0000-000000000001'$q$, 'IMMUTABLE_ASSET');

-- revision 4 = model + fallback
INSERT INTO cee_lesson_revisions (id, lesson_id, revision_number, content, created_by)
VALUES ('e0000000-0000-0000-0000-000000000004','c0000000-0000-0000-0000-000000000001',4,'{"v":4}', pg_temp.u('editor'));
INSERT INTO cee_lesson_assets (lesson_revision_id, asset_version_id, role) VALUES
 ('e0000000-0000-0000-0000-000000000004','20000000-0000-0000-0000-000000000001','PRIMARY'),
 ('e0000000-0000-0000-0000-000000000004','20000000-0000-0000-0000-000000000002','FALLBACK');
-- one approved question pinned
INSERT INTO cee_question_revisions (id, question_key, revision_number, program_code, node_id, stem, options, answer_key, rationale, status, created_by)
VALUES ('30000000-0000-0000-0000-000000000001', gen_random_uuid(), 1, 'cee_medical', 'a0000000-0000-0000-0000-000000000004',
  'DEV FIXTURE stem', '["a","b","c","d"]', 'B', 'DEV FIXTURE rationale', 'DRAFT', pg_temp.u('editor'));
INSERT INTO cee_lesson_questions VALUES ('e0000000-0000-0000-0000-000000000004','30000000-0000-0000-0000-000000000001',1);
UPDATE cee_lesson_revisions SET status = 'IN_REVIEW' WHERE id = 'e0000000-0000-0000-0000-000000000004';
DO $g$ DECLARE g text; rid uuid; BEGIN
  FOREACH g IN ARRAY ARRAY['SYLLABUS_MAPPING','SCIENTIFIC','VISUAL','ASSESSMENT','ACCESSIBILITY','RIGHTS'] LOOP
    INSERT INTO cee_review_requests (entity_type, entity_id, gate, requested_by)
    VALUES ('LESSON_REVISION','e0000000-0000-0000-0000-000000000004', g, pg_temp.u('editor')) RETURNING id INTO rid;
    INSERT INTO cee_review_decisions (request_id, decision, reviewer_id) VALUES (rid, 'APPROVE', pg_temp.u('expert'));
  END LOOP;
END $g$;
UPDATE cee_lesson_revisions SET status = 'APPROVED' WHERE id = 'e0000000-0000-0000-0000-000000000004';
SELECT pg_temp.expect('an unapproved question blocks publication',
  format($q$SELECT cee_publish_revision('e0000000-0000-0000-0000-000000000004','%s','k-r4')$q$, pg_temp.u('publisher')), 'QUESTION_NOT_APPROVED');
UPDATE cee_question_revisions SET status = 'IN_REVIEW' WHERE id = '30000000-0000-0000-0000-000000000001';
SELECT pg_temp.expect('a question under review is frozen',
  $q$UPDATE cee_question_revisions SET answer_key = 'C' WHERE id = '30000000-0000-0000-0000-000000000001'$q$, 'IMMUTABLE_QUESTION');
UPDATE cee_question_revisions SET status = 'APPROVED' WHERE id = '30000000-0000-0000-0000-000000000001';
CREATE TEMP TABLE pub2 AS SELECT cee_publish_revision('e0000000-0000-0000-0000-000000000004', pg_temp.u('publisher'), 'k-r4') AS id;
SELECT pg_temp.check('revision with model, fallback and approved question publishes', (SELECT id FROM pub2) IS NOT NULL);
SELECT pg_temp.check('the previous revision is superseded', (SELECT status FROM cee_lesson_revisions WHERE id='e0000000-0000-0000-0000-000000000002') = 'SUPERSEDED');
SELECT pg_temp.expect('a pinned asset cannot be swapped out of a published revision',
  $q$DELETE FROM cee_lesson_assets WHERE lesson_revision_id = 'e0000000-0000-0000-0000-000000000004' AND role = 'FALLBACK'$q$, 'IMMUTABLE_REVISION');
SELECT pg_temp.expect('nothing can be pinned to a published revision',
  $q$INSERT INTO cee_lesson_assets (lesson_revision_id, asset_version_id, role) VALUES ('e0000000-0000-0000-0000-000000000004','20000000-0000-0000-0000-000000000001','SUPPORTING')$q$, 'IMMUTABLE_REVISION');
SELECT pg_temp.expect('a pinned question cannot be repointed after approval',
  $q$UPDATE cee_lesson_questions SET sort_key = 2 WHERE lesson_revision_id = 'e0000000-0000-0000-0000-000000000004'$q$, 'IMMUTABLE_REVISION');
SELECT pg_temp.expect('pins cannot be added to a revision under review',
  $q$INSERT INTO cee_lesson_assets (lesson_revision_id, asset_version_id, role) VALUES ('e0000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000002','FALLBACK')$q$, 'IMMUTABLE_REVISION');
SELECT pg_temp.check('exactly one active publication per lesson',
  (SELECT count(*) FROM cee_publications WHERE lesson_id='c0000000-0000-0000-0000-000000000001' AND superseded_at IS NULL AND archived_at IS NULL) = 1);
SELECT pg_temp.expect('a question with three options is rejected',
  $q$INSERT INTO cee_question_revisions (question_key,revision_number,program_code,stem,options,answer_key,rationale,created_by) VALUES (gen_random_uuid(),1,'cee_medical','s','["a","b","c"]','A','r',gen_random_uuid())$q$, 'check constraint');

-- ── Events and attempts (CEE-008, CEE-009) ───────────────────────────────
INSERT INTO cee_player_events (event_id, student_id, publication_id, type, occurred_at)
VALUES ('40000000-0000-0000-0000-000000000001', pg_temp.u('student'), (SELECT id FROM pub2), 'STRUCTURE_SELECTED', now());
SELECT pg_temp.expect('CEE-009 a duplicate event id gives no second record',
  format($q$INSERT INTO cee_player_events (event_id, student_id, publication_id, type, occurred_at) VALUES ('40000000-0000-0000-0000-000000000001','%s','%s','STRUCTURE_SELECTED',now())$q$, pg_temp.u('student'), (SELECT id FROM pub2)), 'duplicate key');
SELECT pg_temp.expect('an unknown event type is rejected',
  format($q$INSERT INTO cee_player_events (event_id, student_id, publication_id, type, occurred_at) VALUES (gen_random_uuid(),'%s','%s','LESSON_COMPLETED',now())$q$, pg_temp.u('student'), (SELECT id FROM pub2)), 'check constraint');
SELECT pg_temp.expect('an oversized event payload is rejected',
  format($q$INSERT INTO cee_player_events (event_id, student_id, publication_id, type, payload, occurred_at) VALUES (gen_random_uuid(),'%s','%s','SECTION_READ',jsonb_build_object('x', repeat('z', 9000)),now())$q$, pg_temp.u('student'), (SELECT id FROM pub2)), 'check constraint');
SELECT pg_temp.expect('events are append-only', $q$UPDATE cee_player_events SET type = 'SECTION_READ'$q$, 'APPEND_ONLY');
INSERT INTO cee_student_progress (student_id, lesson_id, publication_id) VALUES (pg_temp.u('student'),'c0000000-0000-0000-0000-000000000001',(SELECT id FROM pub2));
SELECT pg_temp.expect('one progress row per student and publication',
  format($q$INSERT INTO cee_student_progress (student_id, lesson_id, publication_id) VALUES ('%s','c0000000-0000-0000-0000-000000000001','%s')$q$, pg_temp.u('student'), (SELECT id FROM pub2)), 'duplicate key');

-- ── Submission and review decisions ─────────────────────────────────────
INSERT INTO cee_lessons (id, program_code, slug, title, created_by)
VALUES ('c0000000-0000-0000-0000-000000000002', 'cee_medical', 'submit-flow-fixture', 'Submit flow (dev fixture)', pg_temp.u('editor'));
INSERT INTO cee_lesson_mappings (lesson_id, node_id, created_by)
VALUES ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004', pg_temp.u('editor'));
INSERT INTO cee_lesson_revisions (id, lesson_id, revision_number, content, created_by)
VALUES ('e0000000-0000-0000-0000-000000000010', 'c0000000-0000-0000-0000-000000000002', 1, '{"v":10}', pg_temp.u('editor'));
INSERT INTO cee_question_revisions (id, question_key, revision_number, program_code, stem, options, answer_key, rationale, created_by)
VALUES ('90000000-0000-0000-0000-000000000001', gen_random_uuid(), 1, 'cee_medical', 'Fixture stem', '["a","b","c","d"]', 'A', 'Fixture rationale', pg_temp.u('editor'));
INSERT INTO cee_lesson_questions VALUES ('e0000000-0000-0000-0000-000000000010', '90000000-0000-0000-0000-000000000001', 1);

CREATE TEMP TABLE t_before AS SELECT updated_at FROM cee_lesson_revisions WHERE id = 'e0000000-0000-0000-0000-000000000010';
UPDATE cee_lesson_revisions SET content = '{"v":11}' WHERE id = 'e0000000-0000-0000-0000-000000000010';
SELECT pg_temp.check('editing a draft moves updated_at forward (concurrent-edit detection)',
  (SELECT updated_at FROM cee_lesson_revisions WHERE id = 'e0000000-0000-0000-0000-000000000010') > (SELECT updated_at FROM t_before));

SELECT public.cee_submit_revision('e0000000-0000-0000-0000-000000000010', pg_temp.u('editor'));
SELECT pg_temp.check('submit: revision in review, six gates open, pinned question frozen',
  (SELECT status FROM cee_lesson_revisions WHERE id = 'e0000000-0000-0000-0000-000000000010') = 'IN_REVIEW'
  AND (SELECT count(*) FROM cee_review_requests WHERE entity_id = 'e0000000-0000-0000-0000-000000000010' AND status = 'OPEN') = 6
  AND (SELECT status FROM cee_question_revisions WHERE id = '90000000-0000-0000-0000-000000000001') = 'IN_REVIEW');
SELECT pg_temp.expect('a revision cannot be submitted twice',
  $q$SELECT public.cee_submit_revision('e0000000-0000-0000-0000-000000000010', gen_random_uuid())$q$, 'STATE_CONFLICT');
SELECT pg_temp.expect('the author cannot decide a review of their own revision',
  format($q$SELECT public.cee_decide_review((SELECT id FROM cee_review_requests WHERE entity_id = 'e0000000-0000-0000-0000-000000000010' AND gate = 'SCIENTIFIC'), '%s', 'APPROVE', NULL)$q$, pg_temp.u('editor')),
  'SOD_VIOLATION');

SELECT public.cee_decide_review((SELECT id FROM cee_review_requests WHERE entity_id = 'e0000000-0000-0000-0000-000000000010' AND gate = 'ASSESSMENT'), pg_temp.u('expert'), 'APPROVE', 'ok');
SELECT pg_temp.check('approving the assessment gate approves the pinned questions',
  (SELECT status FROM cee_question_revisions WHERE id = '90000000-0000-0000-0000-000000000001') = 'APPROVED'
  AND (SELECT status FROM cee_lesson_revisions WHERE id = 'e0000000-0000-0000-0000-000000000010') = 'IN_REVIEW');
SELECT public.cee_decide_review((SELECT id FROM cee_review_requests WHERE entity_id = 'e0000000-0000-0000-0000-000000000010' AND gate = 'SYLLABUS_MAPPING'), pg_temp.u('expert'), 'APPROVE', NULL);
SELECT pg_temp.check('approving the syllabus-mapping gate approves the proposed mapping',
  (SELECT status FROM cee_lesson_mappings WHERE lesson_id = 'c0000000-0000-0000-0000-000000000002') = 'APPROVED');
SELECT public.cee_decide_review(id, pg_temp.u('expert'), 'APPROVE', NULL) FROM cee_review_requests
 WHERE entity_id = 'e0000000-0000-0000-0000-000000000010' AND status = 'OPEN';
SELECT pg_temp.check('the revision is approved once all six gates are approved',
  (SELECT status FROM cee_lesson_revisions WHERE id = 'e0000000-0000-0000-0000-000000000010') = 'APPROVED');
SELECT pg_temp.expect('a decided revision takes no more decisions',
  format($q$SELECT public.cee_decide_review((SELECT id FROM cee_review_requests WHERE entity_id = 'e0000000-0000-0000-0000-000000000010' AND gate = 'RIGHTS'), '%s', 'REJECT', NULL)$q$, pg_temp.u('expert')),
  'STATE_CONFLICT');

INSERT INTO cee_lesson_revisions (id, lesson_id, revision_number, content, created_by)
VALUES ('e0000000-0000-0000-0000-000000000011', 'c0000000-0000-0000-0000-000000000002', 2, '{"v":12}', pg_temp.u('editor'));
SELECT public.cee_submit_revision('e0000000-0000-0000-0000-000000000011', pg_temp.u('editor'));
SELECT public.cee_decide_review((SELECT id FROM cee_review_requests WHERE entity_id = 'e0000000-0000-0000-0000-000000000011' AND gate = 'SCIENTIFIC'), pg_temp.u('expert'), 'REQUEST_CHANGES', 'Fix the caption');
SELECT pg_temp.check('requesting changes sends the revision back and cancels the other open gates',
  (SELECT status FROM cee_lesson_revisions WHERE id = 'e0000000-0000-0000-0000-000000000011') = 'CHANGES_REQUESTED'
  AND (SELECT count(*) FROM cee_review_requests WHERE entity_id = 'e0000000-0000-0000-0000-000000000011' AND status = 'CANCELLED') = 5
  AND (SELECT count(*) FROM cee_audit_logs WHERE entity_id = 'e0000000-0000-0000-0000-000000000011' AND action = 'REVIEW_REQUEST_CHANGES') = 1);

-- ── Browser roles have no access (CEE-004) ───────────────────────────────
SELECT pg_temp.check('row security is on for every cee_* table',
  (SELECT bool_and(relrowsecurity) FROM pg_class WHERE relname LIKE 'cee\_%' AND relkind = 'r'));
SET ROLE authenticated;
SELECT pg_temp.expect('CEE-004 a signed-in browser client cannot read drafts (or anything) directly',
  $q$SELECT * FROM public.cee_lesson_revisions$q$, 'permission denied');
SELECT pg_temp.expect('a signed-in browser client cannot call the publish function',
  $q$SELECT public.cee_publish_revision(gen_random_uuid(), gen_random_uuid(), 'x')$q$, 'permission denied');
SELECT pg_temp.expect('a signed-in browser client cannot submit or decide reviews',
  $q$SELECT public.cee_submit_revision(gen_random_uuid(), gen_random_uuid())$q$, 'permission denied');
RESET ROLE;
SET ROLE anon;
SELECT pg_temp.expect('an anonymous client cannot read lessons', $q$SELECT * FROM public.cee_lessons$q$, 'permission denied');
RESET ROLE;

-- ── Summary ───────────────────────────────────────────────────────────────
\o
\set QUIET off
SELECT n, CASE WHEN ok THEN 'PASS' ELSE 'FAIL' END AS result, name, CASE WHEN ok THEN '' ELSE detail END AS detail FROM results ORDER BY n;
DO $s$ DECLARE f int; t int; BEGIN
  SELECT count(*) FILTER (WHERE NOT ok), count(*) INTO f, t FROM results;
  RAISE NOTICE '% of % checks passed', t - f, t;
  IF f > 0 THEN RAISE EXCEPTION '% check(s) failed', f; END IF;
END $s$;
