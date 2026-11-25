/**
 * API integration test: real route handlers → real supabase-js → real
 * PostgREST → Postgres with the proposed schema. Only the session, course
 * enrolment and storage signing are stubbed.
 *
 * Skipped unless the throwaway environment from scripts/cee/it-setup.sh is up
 * (CEE_IT_URL, CEE_IT_SERVICE_KEY, CEE_IT_PSQL).
 */
import { execSync } from 'node:child_process';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { fixtureLesson, fixtureManifest, FIXTURE_ASSET_VERSION_ID, FIXTURE_FALLBACK_VERSION_ID } from '../devFixture';

const state = vi.hoisted(() => ({ user: null as null | { id: string; email: string | null }, cee: true }));

vi.mock('@/lib/supabase/route-auth', () => ({ getSessionUser: async () => state.user }));
vi.mock('@/lib/services/enrollmentService', () => ({
  EnrollmentService: { getStudentAccess: async () => ({ courses: { cee_medical: { canAccessFullCourse: state.cee } } }) },
}));
vi.mock('@/lib/supabase/admin', async () => {
  const { createClient } = await import('@supabase/supabase-js');
  return {
    createAdminClient: () =>
      createClient(process.env.CEE_IT_URL!, process.env.CEE_IT_SERVICE_KEY!, { auth: { persistSession: false, autoRefreshToken: false } }),
  };
});

const enabled = Boolean(process.env.CEE_IT_URL && process.env.CEE_IT_SERVICE_KEY && process.env.CEE_IT_PSQL);

const ID = {
  director: '0d000000-0000-4000-8000-000000000001',
  editor: '0d000000-0000-4000-8000-000000000002',
  expert: '0d000000-0000-4000-8000-000000000003',
  publisher: '0d000000-0000-4000-8000-000000000004',
  studentA: '0d000000-0000-4000-8000-0000000000a1',
  studentB: '0d000000-0000-4000-8000-0000000000b1',
  syllabus: '51000000-0000-4000-8000-000000000001',
  ieltsSyllabus: '51000000-0000-4000-8000-000000000002',
  biology: '52000000-0000-4000-8000-000000000001',
  physiology: '52000000-0000-4000-8000-000000000002',
  circulatory: '52000000-0000-4000-8000-000000000003',
  heart: '52000000-0000-4000-8000-000000000004',
  lesson: '53000000-0000-4000-8000-000000000001',
  revision: '54000000-0000-4000-8000-000000000001',
  modelAsset: '55000000-0000-4000-8000-000000000001',
  fallbackAsset: '55000000-0000-4000-8000-000000000002',
  q1: '56000000-0000-4000-8000-000000000001',
  q2: '56000000-0000-4000-8000-000000000002',
};

/** The fixture lesson with a 50% pass mark, so the score rule is exercised. */
const lessonForIt = { ...fixtureLesson, completion: { ...fixtureLesson.completion, minScorePercent: 50 } };

const sql = (text: string) => execSync(`${process.env.CEE_IT_PSQL} -v ON_ERROR_STOP=1 -q -At`, { input: text }).toString().trim();
const json = (v: unknown) => `$json$${JSON.stringify(v)}$json$::jsonb`;

function seed() {
  sql(`
TRUNCATE cee_settings, cee_syllabus_versions, cee_curriculum_nodes, cee_learning_objectives, cee_lessons, cee_lesson_revisions,
  cee_lesson_mappings, cee_visual_assets, cee_asset_versions, cee_asset_jobs, cee_lesson_assets, cee_question_revisions,
  cee_lesson_questions, cee_review_requests, cee_review_decisions, cee_publications, cee_role_assignments, cee_audit_logs,
  cee_student_progress, cee_player_events, cee_attempts CASCADE;
INSERT INTO cee_settings (key, value) VALUES ('cee_visual_enabled', 'false');
INSERT INTO cee_syllabus_versions (id, program_code, label, created_by)
VALUES ('${ID.syllabus}', 'cee_medical', 'MEC CEE (integration test)', '${ID.editor}'),
       ('${ID.ieltsSyllabus}', 'ielts', 'IELTS (integration test, unverified)', '${ID.editor}');
INSERT INTO cee_curriculum_nodes (id, syllabus_version_id, parent_id, node_type, code, title, sort_key, created_by) VALUES
 ('${ID.biology}', '${ID.syllabus}', NULL, 'SUBJECT', 'biology', 'Biology', 1, '${ID.editor}'),
 ('${ID.physiology}', '${ID.syllabus}', '${ID.biology}', 'CHAPTER', 'human-physiology', 'Human Physiology', 1, '${ID.editor}'),
 ('${ID.circulatory}', '${ID.syllabus}', '${ID.physiology}', 'TOPIC', 'circulatory-system', 'Circulatory System', 1, '${ID.editor}'),
 ('${ID.heart}', '${ID.syllabus}', '${ID.circulatory}', 'TOPIC', 'human-heart', 'Human Heart', 1, '${ID.editor}');
-- Verified the only way the schema allows: by a separate academic director, through the function.
INSERT INTO cee_role_assignments (user_id, role_key, program_code, granted_by) VALUES ('${ID.director}', 'ACADEMIC_DIRECTOR', 'cee_medical', '${ID.director}');
SELECT cee_verify_syllabus('${ID.syllabus}', '${ID.director}', 'https://example.org/integration-test-document', repeat('a', 64));
INSERT INTO cee_lessons (id, program_code, slug, title, created_by)
VALUES ('${ID.lesson}', 'cee_medical', 'player-test', 'Player test lesson (integration fixture)', '${ID.editor}');
INSERT INTO cee_lesson_mappings (lesson_id, node_id, status, approved_by, approved_at, created_by)
VALUES ('${ID.lesson}', '${ID.heart}', 'APPROVED', '${ID.director}', now(), '${ID.editor}');
INSERT INTO cee_visual_assets (id, program_code, title, kind, license, created_by) VALUES
 ('${ID.modelAsset}', 'cee_medical', 'Player test model', 'MODEL_3D', 'dev-fixture-not-for-production', '${ID.editor}'),
 ('${ID.fallbackAsset}', 'cee_medical', 'Player test fallback', 'DIAGRAM_2D', 'dev-fixture-not-for-production', '${ID.editor}');
INSERT INTO cee_asset_versions (id, asset_id, version_number, status, quarantine_key, published_key, sha256, size_bytes, mime_type, scan_status, manifest, created_by) VALUES
 ('${FIXTURE_ASSET_VERSION_ID}', '${ID.modelAsset}', 1, 'VALIDATED', 'quarantine/m/1', 'published/m/1/${'1'.repeat(64)}', '${'1'.repeat(64)}', 46240, 'model/gltf-binary', 'CLEAN', ${json(fixtureManifest)}, '${ID.editor}'),
 ('${FIXTURE_FALLBACK_VERSION_ID}', '${ID.fallbackAsset}', 1, 'VALIDATED', 'quarantine/f/1', 'published/f/1/${'2'.repeat(64)}', '${'2'.repeat(64)}', 1042, 'image/svg+xml', 'CLEAN', '{}', '${ID.editor}');
DO $$ DECLARE v uuid; g text; rid uuid; BEGIN
  FOREACH v IN ARRAY ARRAY['${FIXTURE_ASSET_VERSION_ID}'::uuid, '${FIXTURE_FALLBACK_VERSION_ID}'::uuid] LOOP
    FOREACH g IN ARRAY ARRAY['SCIENTIFIC','VISUAL','RIGHTS'] LOOP
      INSERT INTO cee_review_requests (entity_type, entity_id, gate, requested_by) VALUES ('ASSET_VERSION', v, g, '${ID.editor}') RETURNING id INTO rid;
      INSERT INTO cee_review_decisions (request_id, decision, reviewer_id) VALUES (rid, 'APPROVE', '${ID.expert}');
    END LOOP;
  END LOOP;
END $$;
INSERT INTO cee_question_revisions (id, question_key, revision_number, program_code, node_id, stem, options, answer_key, rationale, status, created_by) VALUES
 ('${ID.q1}', gen_random_uuid(), 1, 'cee_medical', '${ID.heart}', 'In the player test scene, which shape is in the centre?',
  '["Cube","Sphere","Cone","Base"]', 'B', 'The sphere sits between the cube and the cone.', 'APPROVED', '${ID.editor}'),
 ('${ID.q2}', gen_random_uuid(), 1, 'cee_medical', '${ID.heart}', 'Which layer hides the cube and the cone?',
  '["Sphere","Base","Cube and cone","None"]', 'C', 'Switching off the “Cube and cone” layer hides both shapes.', 'APPROVED', '${ID.editor}');
INSERT INTO cee_lesson_revisions (id, lesson_id, revision_number, content, created_by)
VALUES ('${ID.revision}', '${ID.lesson}', 1, ${json(lessonForIt)}, '${ID.editor}');
INSERT INTO cee_lesson_assets (lesson_revision_id, asset_version_id, role) VALUES
 ('${ID.revision}', '${FIXTURE_ASSET_VERSION_ID}', 'PRIMARY'), ('${ID.revision}', '${FIXTURE_FALLBACK_VERSION_ID}', 'FALLBACK');
INSERT INTO cee_lesson_questions VALUES ('${ID.revision}', '${ID.q1}', 1), ('${ID.revision}', '${ID.q2}', 2);
UPDATE cee_lesson_revisions SET status = 'IN_REVIEW', submitted_at = now() WHERE id = '${ID.revision}';
DO $$ DECLARE g text; rid uuid; BEGIN
  FOREACH g IN ARRAY ARRAY['SYLLABUS_MAPPING','SCIENTIFIC','VISUAL','ASSESSMENT','ACCESSIBILITY','RIGHTS'] LOOP
    INSERT INTO cee_review_requests (entity_type, entity_id, gate, requested_by) VALUES ('LESSON_REVISION', '${ID.revision}', g, '${ID.editor}') RETURNING id INTO rid;
    INSERT INTO cee_review_decisions (request_id, decision, reviewer_id) VALUES (rid, 'APPROVE', '${ID.expert}');
  END LOOP;
END $$;
UPDATE cee_lesson_revisions SET status = 'APPROVED' WHERE id = '${ID.revision}';
INSERT INTO cee_role_assignments (user_id, role_key, program_code, granted_by) VALUES ('${ID.publisher}', 'PUBLISHER', 'cee_medical', '${ID.director}');
SELECT cee_publish_revision('${ID.revision}', '${ID.publisher}', 'it-publish-1');
`);
}

type Envelope<T = Record<string, unknown>> = { data: T; error?: { code: string; message: string }; meta: { requestId: string } };
const call = async (p: Promise<Response>) => {
  const r = await p;
  return { status: r.status, body: (await r.json()) as Envelope<any> };
};
const params = <T extends Record<string, string>>(v: T) => ({ params: Promise.resolve(v) });
const post = (body: unknown, headers: Record<string, string> = {}) =>
  new Request('http://test/api', { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) });
const get = () => new Request('http://test/api');

let n = 0;
const uuid = () => `5e000000-0000-4000-8000-${String(++n).padStart(12, '0')}`;
const now = () => new Date().toISOString();
const ev = (type: string, payload: Record<string, unknown> = {}) => ({ eventId: uuid(), occurredAt: now(), type, payload });

describe.skipIf(!enabled)('CEE visual student API (real PostgREST)', () => {
  let routes: Record<string, any>;
  let resetFlagCache: () => void;
  const setFlag = (on: boolean) => {
    sql(`UPDATE cee_settings SET value = '${on}' WHERE key = 'cee_visual_enabled'`);
    resetFlagCache();
  };

  beforeAll(async () => {
    seed();
    ({ resetFlagCache } = await import('../service.server'));
    routes = {
      syllabi: await import('@/app/api/v1/cee/programs/[program]/syllabi/route'),
      tree: await import('@/app/api/v1/cee/syllabi/[id]/tree/route'),
      topic: await import('@/app/api/v1/cee/topics/[id]/lessons/route'),
      lesson: await import('@/app/api/v1/cee/lessons/[id]/route'),
      manifest: await import('@/app/api/v1/cee/lessons/[id]/manifest/route'),
      events: await import('@/app/api/v1/cee/me/lessons/[id]/events/route'),
      attempts: await import('@/app/api/v1/cee/me/lessons/[id]/attempts/route'),
      progress: await import('@/app/api/v1/cee/me/lessons/[id]/progress/route'),
      myProgress: await import('@/app/api/v1/cee/me/progress/route'),
    };
  }, 60000);

  it('hides everything while the feature flag is off', async () => {
    setFlag(false);
    state.user = { id: ID.studentA, email: 'a@test.invalid' };
    const r = await call(routes.lesson.GET(get(), params({ id: ID.lesson })));
    expect(r.status).toBe(404);
    expect(r.body.error?.code).toBe('NOT_FOUND');
    setFlag(true);
  });

  it('requires sign-in, then course access', async () => {
    state.user = null;
    expect((await call(routes.lesson.GET(get(), params({ id: ID.lesson })))).status).toBe(401);
    state.user = { id: ID.studentA, email: 'a@test.invalid' };
    state.cee = false;
    const denied = await call(routes.lesson.GET(get(), params({ id: ID.lesson })));
    expect(denied.status).toBe(403);
    expect(denied.body.error?.message).toContain('Enrol');
    state.cee = true;
  });

  it('serves the published lesson with signed URLs and no answer keys', async () => {
    const r = await call(routes.lesson.GET(get(), params({ id: ID.lesson })));
    expect(r.status).toBe(200);
    const text = JSON.stringify(r.body);
    expect(text).not.toMatch(/answerKey|answer_key|rationale|The sphere sits/);
    expect(text).not.toMatch(/publishedKey|published_key|quarantine/); // only signed URLs, never key fields
    expect(r.body.data.visual.modelUrl).toMatch(/^http:\/\/127\.0\.0\.1:54331\/storage\/v1\/object\/sign\/cee-published\/published\/m\/1\/.+token=/);
    expect(r.body.data.visual.fallbackUrl).toContain('/published/f/1/');
    expect(r.body.data.visual.manifest).toEqual(fixtureManifest);
    expect(r.body.data.lesson.questions.map((q: any) => q.options.map((o: any) => o.key).join(''))).toEqual(['ABCD', 'ABCD']);
    expect(r.body.data.progress).toMatchObject({ state: 'IN_PROGRESS' });
    expect(r.body.meta.requestId).toMatch(/^req_/);
  });

  it('returns 404 for unknown and malformed lesson ids', async () => {
    expect((await call(routes.lesson.GET(get(), params({ id: '53000000-0000-4000-8000-0000000000ff' })))).status).toBe(404);
    expect((await call(routes.lesson.GET(get(), params({ id: "1' OR '1'='1" })))).status).toBe(404);
  });

  it('lists only verified syllabi, and builds the tree with rolled-up counts', async () => {
    const cee = await call(routes.syllabi.GET(get(), params({ program: 'cee_medical' })));
    expect(cee.body.data.syllabi.map((s: any) => s.id)).toEqual([ID.syllabus]);
    expect((await call(routes.syllabi.GET(get(), params({ program: 'ielts' })))).body.data.syllabi).toEqual([]);
    expect((await call(routes.syllabi.GET(get(), params({ program: 'pte' })))).status).toBe(404);
    expect((await call(routes.tree.GET(get(), params({ id: ID.ieltsSyllabus })))).status).toBe(404);

    const t = await call(routes.tree.GET(get(), params({ id: ID.syllabus })));
    expect(t.status).toBe(200);
    const bio = t.body.data.tree[0];
    expect([bio.title, bio.children[0].title, bio.children[0].children[0].title, bio.children[0].children[0].children[0].title]).toEqual([
      'Biology',
      'Human Physiology',
      'Circulatory System',
      'Human Heart',
    ]);
    expect(bio.publishedLessons).toBe(1);
  });

  it('lists published lessons per topic, with the empty message when there are none', async () => {
    const heart = await call(routes.topic.GET(get(), params({ id: ID.heart })));
    expect(heart.body.data.lessons.map((l: any) => l.slug)).toEqual(['player-test']);
    expect(heart.body.data.emptyMessage).toBeNull();
    const circ = await call(routes.topic.GET(get(), params({ id: ID.circulatory })));
    expect(circ.body.data.lessons).toEqual([]);
    expect(circ.body.data.emptyMessage).toBe('No visual lessons have been published for this topic yet.');
  });

  const fullRun = () => [
    ev('LESSON_OPENED'),
    ev('PLAYER_READY', { mode: '3d' }),
    ...fixtureLesson.sections.map((s) => ev('SECTION_READ', { sectionKey: s.key })),
    ...fixtureManifest.sequences[0].steps.map((_, i) => ev('SEQUENCE_STEP', { sequenceKey: 'tour', stepIndex: i })),
    ev('SEQUENCE_COMPLETED', { sequenceKey: 'tour' }),
  ];
  let firstBatch: ReturnType<typeof fullRun>;

  it('records events once; a resent batch is all duplicates and earns nothing', async () => {
    firstBatch = fullRun();
    const r1 = await call(routes.events.POST(post({ events: firstBatch }), params({ id: ID.lesson })));
    expect(r1.status).toBe(200);
    expect(r1.body.data.accepted).toHaveLength(firstBatch.length);
    expect(r1.body.data.duplicates).toEqual([]);
    expect(r1.body.data.progress.missing).toEqual(['ATTEMPT']); // everything but the questions
    const r2 = await call(routes.events.POST(post({ events: firstBatch }), params({ id: ID.lesson })));
    expect(r2.body.data.accepted).toEqual([]);
    expect(r2.body.data.duplicates).toHaveLength(firstBatch.length);
    expect(sql(`SELECT count(*) FROM cee_player_events WHERE student_id = '${ID.studentA}'`)).toBe(String(firstBatch.length));
  });

  it('rejects events that do not belong to the lesson, and malformed batches', async () => {
    const bad = [ev('SECTION_READ', { sectionKey: 'not-a-section' }), ev('SEQUENCE_STEP', { sequenceKey: 'tour', stepIndex: 40 })];
    const r = await call(routes.events.POST(post({ events: bad }), params({ id: ID.lesson })));
    expect(r.body.data.rejected.map((x: any) => x.reason)).toEqual(['unknown section', 'unknown sequence step']);
    expect((await call(routes.events.POST(post({ events: [{ type: 'LESSON_COMPLETED' }] }), params({ id: ID.lesson })))).status).toBe(400);
  });

  it('grades attempts on the server, idempotently', async () => {
    const answersWrong = { answers: [{ questionRevisionId: ID.q1, choice: 'A' }, { questionRevisionId: ID.q2, choice: 'A' }] };
    expect((await call(routes.attempts.POST(post(answersWrong), params({ id: ID.lesson })))).status).toBe(400); // no Idempotency-Key

    const first = await call(routes.attempts.POST(post(answersWrong, { 'Idempotency-Key': 'attempt-0001' }), params({ id: ID.lesson })));
    expect(first.status).toBe(201);
    expect(first.body.data).toMatchObject({ score: 0, maxScore: 2, replay: false });
    expect(first.body.data.questions[0]).toMatchObject({ answerKey: 'B', correct: false, rationale: 'The sphere sits between the cube and the cone.' });

    const replay = await call(routes.attempts.POST(post(answersWrong, { 'Idempotency-Key': 'attempt-0001' }), params({ id: ID.lesson })));
    expect(replay.status).toBe(200);
    expect(replay.body.data).toMatchObject({ replay: true, attemptId: first.body.data.attemptId });

    const changed = { answers: [{ questionRevisionId: ID.q1, choice: 'B' }] };
    const conflict = await call(routes.attempts.POST(post(changed, { 'Idempotency-Key': 'attempt-0001' }), params({ id: ID.lesson })));
    expect(conflict.status).toBe(409);
    expect(conflict.body.error?.code).toBe('IDEMPOTENCY_CONFLICT');

    const foreign = { answers: [{ questionRevisionId: '56000000-0000-4000-8000-0000000000ff', choice: 'A' }] };
    expect((await call(routes.attempts.POST(post(foreign, { 'Idempotency-Key': 'attempt-0002' }), params({ id: ID.lesson })))).status).toBe(400);

    expect(sql(`SELECT count(*) FROM cee_attempts WHERE student_id = '${ID.studentA}'`)).toBe('1');
  });

  it('completes the lesson only when the server says so, and keeps it complete', async () => {
    const before = await call(routes.progress.GET(get(), params({ id: ID.lesson })));
    expect(before.body.data.progress).toMatchObject({ state: 'IN_PROGRESS', missing: ['SCORE'], bestScorePercent: 0 }); // 0% < 50%

    const right = { answers: [{ questionRevisionId: ID.q1, choice: 'B' }, { questionRevisionId: ID.q2, choice: 'C' }] };
    const r = await call(routes.attempts.POST(post(right, { 'Idempotency-Key': 'attempt-0003' }), params({ id: ID.lesson })));
    expect(r.body.data).toMatchObject({ score: 2, percent: 100 });
    expect(r.body.data.progress).toMatchObject({ state: 'COMPLETED', missing: [], bestScorePercent: 100 });

    const mine = await call(routes.myProgress.GET(get()));
    expect(mine.body.data.progress).toEqual([expect.objectContaining({ lessonId: ID.lesson, state: 'COMPLETED', bestScorePercent: 100 })]);
    expect(sql(`SELECT state FROM cee_student_progress WHERE student_id = '${ID.studentA}'`)).toBe('COMPLETED');
  });

  it('keeps students apart: another student starts from nothing', async () => {
    state.user = { id: ID.studentB, email: 'b@test.invalid' };
    expect((await call(routes.myProgress.GET(get()))).body.data.progress).toEqual([]);
    const p = await call(routes.progress.GET(get(), params({ id: ID.lesson })));
    expect(p.body.data.progress.state).toBe('IN_PROGRESS');
    expect(p.body.data.progress.missing).toContain('OPENED');
    // Student B replaying student A's event ids gains nothing.
    const r = await call(routes.events.POST(post({ events: firstBatch }), params({ id: ID.lesson })));
    expect(r.body.data.accepted).toEqual([]);
    expect(sql(`SELECT count(*) FROM cee_player_events WHERE student_id = '${ID.studentB}'`)).toBe('0');
    state.user = { id: ID.studentA, email: 'a@test.invalid' };
  });

  it('re-signs URLs on request', async () => {
    const r = await call(routes.manifest.GET(get(), params({ id: ID.lesson })));
    expect(r.status).toBe(200);
    expect(r.body.data.visual.modelUrl).toContain('token=');
  });
});
