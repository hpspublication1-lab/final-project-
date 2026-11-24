/**
 * CMS integration test: the whole editorial flow through the real admin route
 * handlers → supabase-js → PostgREST → Postgres with the proposed schema.
 * Only the session, enrolment, super-admin list and storage signing are stubbed.
 *
 * Skipped unless scripts/cee/it-setup.sh is running (CEE_IT_URL, …).
 */
import { execSync } from 'node:child_process';
import { beforeAll, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({ user: null as null | { id: string; email: string | null } }));

vi.mock('@/lib/supabase/route-auth', () => ({ getSessionUser: async () => state.user }));
vi.mock('@/lib/config/superAdmin', () => ({
  SUPER_ADMINS: ['root@test.invalid'],
  isSuperAdmin: (e?: string | null) => e === 'root@test.invalid',
}));
vi.mock('@/lib/services/enrollmentService', () => ({
  EnrollmentService: { getStudentAccess: async () => ({ courses: { cee_medical: { canAccessFullCourse: true } } }) },
}));
vi.mock('@/lib/supabase/admin', async () => {
  const { createClient } = await import('@supabase/supabase-js');
  return {
    createAdminClient: () =>
      createClient(process.env.CEE_IT_URL!, process.env.CEE_IT_SERVICE_KEY!, { auth: { persistSession: false, autoRefreshToken: false } }),
  };
});

const enabled = Boolean(process.env.CEE_IT_URL && process.env.CEE_IT_SERVICE_KEY && process.env.CEE_IT_PSQL);
const sql = (text: string) => execSync(`${process.env.CEE_IT_PSQL} -v ON_ERROR_STOP=1 -q -At`, { input: text }).toString().trim();

const people = {
  root: 'a1000000-0000-4000-8000-000000000001',
  director: 'a1000000-0000-4000-8000-000000000002',
  director2: 'a1000000-0000-4000-8000-000000000003',
  editor: 'a1000000-0000-4000-8000-000000000004',
  expert: 'a1000000-0000-4000-8000-000000000005',
  reviewer: 'a1000000-0000-4000-8000-000000000006',
  publisher: 'a1000000-0000-4000-8000-000000000007',
  ieltsEditor: 'a1000000-0000-4000-8000-000000000008',
  nobody: 'a1000000-0000-4000-8000-000000000009',
  student: 'a1000000-0000-4000-8000-00000000000a',
} as const;
type Who = keyof typeof people;
const email = (w: Who) => `${w}@test.invalid`;
const as = (w: Who) => (state.user = { id: people[w], email: email(w) });

/* eslint-disable @typescript-eslint/no-explicit-any */
type Res = { status: number; body: any };
const call = async (p: Promise<Response>): Promise<Res> => {
  const r = await p;
  return { status: r.status, body: await r.json() };
};
const params = <T extends Record<string, string>>(v: T) => ({ params: Promise.resolve(v) });
const req = (method: string, body?: unknown, headers: Record<string, string> = {}, query = '') =>
  new Request(`http://test/api${query}`, {
    method,
    headers: { 'content-type': 'application/json', ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

describe.skipIf(!enabled)('CEE visual CMS API (real PostgREST)', () => {
  let r: Record<string, any>;
  const ids: Record<string, string> = {};
  const legacyChapter = 'b2000000-0000-4000-8000-000000000001';

  beforeAll(async () => {
    sql(`
TRUNCATE cee_settings, cee_syllabus_versions, cee_curriculum_nodes, cee_learning_objectives, cee_lessons, cee_lesson_revisions,
  cee_lesson_mappings, cee_visual_assets, cee_asset_versions, cee_asset_jobs, cee_lesson_assets, cee_question_revisions,
  cee_lesson_questions, cee_review_requests, cee_review_decisions, cee_publications, cee_role_assignments, cee_audit_logs,
  cee_student_progress, cee_player_events, cee_attempts CASCADE;
TRUNCATE user_profiles;
INSERT INTO cee_settings (key, value) VALUES ('cee_visual_enabled', 'true');
INSERT INTO user_profiles (id, subscription_plan, status) SELECT * FROM (VALUES ${Object.values(people)
      .map((id) => `('${id}'::uuid, 'free', 'active')`)
      .join(',')}) v;
`);
    for (const [w, id] of Object.entries(people)) sql(`UPDATE user_profiles SET email = '${email(w as Who)}' WHERE id = '${id}'`);

    r = {
      me: await import('@/app/api/v1/cee/admin/me/route'),
      roles: await import('@/app/api/v1/cee/admin/roles/route'),
      revoke: await import('@/app/api/v1/cee/admin/roles/[id]/revoke/route'),
      curriculum: await import('@/app/api/v1/cee/admin/curriculum/route'),
      nodes: await import('@/app/api/v1/cee/admin/curriculum/nodes/route'),
      syllabi: await import('@/app/api/v1/cee/admin/syllabi/route'),
      verify: await import('@/app/api/v1/cee/admin/syllabi/[id]/verify/route'),
      lessons: await import('@/app/api/v1/cee/admin/lessons/route'),
      lesson: await import('@/app/api/v1/cee/admin/lessons/[id]/route'),
      revisions: await import('@/app/api/v1/cee/admin/lessons/[id]/revisions/route'),
      draft: await import('@/app/api/v1/cee/admin/lesson-revisions/[id]/route'),
      questions: await import('@/app/api/v1/cee/admin/lesson-revisions/[id]/questions/route'),
      submit: await import('@/app/api/v1/cee/admin/lesson-revisions/[id]/submit/route'),
      reviews: await import('@/app/api/v1/cee/admin/reviews/route'),
      decide: await import('@/app/api/v1/cee/admin/reviews/[id]/decision/route'),
      publish: await import('@/app/api/v1/cee/admin/publications/route'),
      studentLesson: await import('@/app/api/v1/cee/lessons/[id]/route'),
      published: await import('@/app/api/v1/cee/programs/[program]/published/route'),
    };
    (await import('../service.server')).resetFlagCache();
  }, 60000);

  it('only staff get in; only a super admin grants roles', async () => {
    as('nobody');
    expect((await call(r.me.GET(req('GET')))).status).toBe(403);
    as('root');
    expect((await call(r.me.GET(req('GET')))).body.data).toMatchObject({ isSuperAdmin: true, assignments: [] });

    const grant = (who: Who, role: string, program = 'cee_medical') => call(r.roles.POST(req('POST', { email: email(who), role, program })));
    for (const [who, role] of [
      ['director', 'ACADEMIC_DIRECTOR'],
      ['director2', 'ACADEMIC_DIRECTOR'],
      ['editor', 'EDITOR'],
      ['expert', 'SUBJECT_EXPERT'],
      ['reviewer', 'QUESTION_REVIEWER'],
      ['reviewer', 'ACCESSIBILITY_REVIEWER'],
      ['reviewer', 'RIGHTS_REVIEWER'],
      ['publisher', 'PUBLISHER'],
    ] as [Who, string][]) {
      const g = await grant(who, role);
      expect(g.status, `${who} ${role}`).toBe(201);
      if (who === 'publisher') ids.publisherRole = g.body.data.id;
    }
    expect((await grant('ieltsEditor', 'EDITOR', 'ielts')).status).toBe(201);
    expect((await call(r.roles.POST(req('POST', { email: 'ghost@test.invalid', role: 'EDITOR', program: 'cee_medical' })))).status).toBe(400);

    as('director');
    const notRoot = await call(r.roles.POST(req('POST', { email: email('nobody'), role: 'PUBLISHER', program: 'cee_medical' })));
    expect(notRoot.status).toBe(403);
    as('root');
    const listed = await call(r.roles.GET(req('GET', undefined, {}, '?program=cee_medical')));
    expect(listed.body.data.roles).toHaveLength(8);
  });

  it('builds a syllabus tree; the creator cannot verify their own syllabus', async () => {
    as('director');
    const s = await call(r.syllabi.POST(req('POST', { program: 'cee_medical', label: 'MEC CEE (test)' })));
    expect(s.status).toBe(201);
    ids.syllabus = s.body.data.id;
    const node = async (parentId: string | null, nodeType: string, code: string, title: string, legacyChapterId: string | null = null) => {
      const n = await call(r.nodes.POST(req('POST', { syllabusId: ids.syllabus, parentId, nodeType, code, title, legacyChapterId })));
      expect(n.status, title).toBe(201);
      return n.body.data.id as string;
    };
    ids.biology = await node(null, 'SUBJECT', 'biology', 'Biology');
    ids.physiology = await node(ids.biology, 'CHAPTER', 'human-physiology', 'Human Physiology', legacyChapter);
    ids.circulatory = await node(ids.physiology, 'TOPIC', 'circulatory-system', 'Circulatory System');
    ids.heart = await node(ids.circulatory, 'TOPIC', 'human-heart', 'Human Heart');

    const own = await call(r.verify.POST(req('POST', { sourceUrl: 'https://example.org/mec-syllabus.pdf', sourceSha256: 'a'.repeat(64) }), params({ id: ids.syllabus })));
    expect(own.status).toBe(403);
    expect(own.body.error.code).toBe('SOD_VIOLATION');
  });

  it('creates a lesson only inside the editor’s course', async () => {
    as('ieltsEditor');
    expect((await call(r.lessons.POST(req('POST', { program: 'cee_medical', title: 'Heart', slug: 'heart-x', nodeId: ids.heart })))).status).toBe(403);
    expect((await call(r.lessons.GET(req('GET', undefined, {}, '?program=cee_medical')))).status).toBe(403);

    as('editor');
    const c = await call(r.lessons.POST(req('POST', { program: 'cee_medical', title: 'Human Heart: chambers and valves', slug: 'human-heart', nodeId: ids.heart })));
    expect(c.status).toBe(201);
    ids.lesson = c.body.data.id;
    ids.rev1 = c.body.data.revisionId;
    const dup = await call(r.lessons.POST(req('POST', { program: 'cee_medical', title: 'Again', slug: 'human-heart', nodeId: ids.heart })));
    expect(dup.status).toBe(409);

    const list = await call(r.lessons.GET(req('GET', undefined, {}, '?program=cee_medical')));
    expect(list.body.data.lessons).toEqual([
      expect.objectContaining({ slug: 'human-heart', latestRevision: expect.objectContaining({ number: 1, status: 'DRAFT' }), publication: null }),
    ]);
  });

  it('saves drafts with conflict detection and refuses an incomplete submission', async () => {
    as('editor');
    const d = await call(r.lesson.GET(req('GET'), params({ id: ids.lesson })));
    expect(d.body.data.latest).toMatchObject({ number: 1, status: 'DRAFT' });
    expect(d.body.data.permissions).toEqual({ edit: true, publish: false });
    const base = d.body.data.latest.updatedAt;

    expect((await call(r.submit.POST(req('POST'), params({ id: ids.rev1 })))).body.error.code).toBe('INVALID_REQUEST');

    const content = {
      schemaVersion: '1.0',
      summary: 'Integration-test lesson text.',
      sections: [
        { key: 'one', heading: 'One', body: 'First section.', required: true },
        { key: 'two', heading: 'Two', body: 'Second section.', required: false },
      ],
      objectiveIds: [],
      completion: { minScorePercent: 50 },
    };
    const saved = await call(r.draft.PATCH(req('PATCH', { content, baseUpdatedAt: base }), params({ id: ids.rev1 })));
    expect(saved.status).toBe(200);
    const stale = await call(r.draft.PATCH(req('PATCH', { content, baseUpdatedAt: base }), params({ id: ids.rev1 })));
    expect(stale.status).toBe(409);
    expect(stale.body.error.code).toBe('REVISION_CONFLICT');

    const noQuestions = await call(r.submit.POST(req('POST'), params({ id: ids.rev1 })));
    expect(noQuestions.body.error.message).toContain('pass mark');

    const q = await call(
      r.questions.POST(
        req('POST', { stem: 'Which test shape is in the centre?', options: ['Cube', 'Sphere', 'Cone', 'Base'], answerKey: 'B', rationale: 'The sphere is between the others.' }),
        params({ id: ids.rev1 })
      )
    );
    expect(q.status).toBe(201);
    ids.q1 = q.body.data.id;

    const sub = await call(r.submit.POST(req('POST'), params({ id: ids.rev1 })));
    expect(sub.status).toBe(200);
    const after = await call(r.draft.PATCH(req('PATCH', { content, baseUpdatedAt: saved.body.data.updatedAt }), params({ id: ids.rev1 })));
    expect(after.body.error.code).toBe('STATE_CONFLICT');
    const lateQ = await call(r.questions.POST(req('POST', { stem: 'Late question?', options: ['a', 'b', 'c', 'd'], answerKey: 'A', rationale: 'Late one.' }), params({ id: ids.rev1 })));
    expect(lateQ.status).toBe(409);
  });

  it('routes each gate to the right reviewer and keeps authors out', async () => {
    const gatesFor = async (w: Who) => {
      as(w);
      const q = await call(r.reviews.GET(req('GET', undefined, {}, '?program=cee_medical')));
      return (q.body.data.reviews as any[]).map((x) => x.gate).sort();
    };
    expect(await gatesFor('expert')).toEqual(['SCIENTIFIC', 'VISUAL']);
    expect(await gatesFor('reviewer')).toEqual(['ACCESSIBILITY', 'ASSESSMENT', 'RIGHTS']);
    expect(await gatesFor('director')).toEqual(['SYLLABUS_MAPPING', 'VISUAL']); // VISUAL: subject expert or director
    expect(await gatesFor('editor')).toEqual([]);

    as('expert');
    const all = (await call(r.reviews.GET(req('GET', undefined, {}, '?program=cee_medical')))).body.data.reviews as any[];
    const sci = all.find((x) => x.gate === 'SCIENTIFIC');
    const noComment = await call(r.decide.POST(req('POST', { decision: 'REQUEST_CHANGES' }), params({ id: sci.id })));
    expect(noComment.status).toBe(400);
    as('editor');
    const self = await call(r.decide.POST(req('POST', { decision: 'APPROVE' }), params({ id: sci.id })));
    expect(self.status).toBe(403);
  });

  it('approves through all six gates, then publishes once, idempotently', async () => {
    const decide = async (w: Who, gate: string) => {
      as(w);
      const q = (await call(r.reviews.GET(req('GET', undefined, {}, '?program=cee_medical')))).body.data.reviews as any[];
      const item = q.find((x) => x.gate === gate);
      expect(item, `${w} sees ${gate}`).toBeTruthy();
      const d = await call(r.decide.POST(req('POST', { decision: 'APPROVE', comments: 'ok' }), params({ id: item.id })));
      expect(d.status, `${w} decides ${gate}`).toBe(200);
      return d.body.data.revisionStatus as string;
    };
    await decide('director', 'SYLLABUS_MAPPING');
    await decide('expert', 'SCIENTIFIC');
    await decide('expert', 'VISUAL');
    await decide('reviewer', 'ASSESSMENT');
    await decide('reviewer', 'ACCESSIBILITY');
    expect(await decide('reviewer', 'RIGHTS')).toBe('APPROVED');

    as('editor');
    const notPublisher = await call(r.publish.POST(req('POST', { revisionId: ids.rev1 }, { 'Idempotency-Key': 'pub-0000001' })));
    expect(notPublisher.status).toBe(403);

    as('publisher');
    const unverified = await call(r.publish.POST(req('POST', { revisionId: ids.rev1 }, { 'Idempotency-Key': 'pub-0000001' })));
    expect(unverified.status).toBe(422);
    expect(unverified.body.error.code).toBe('MAPPING_NOT_VERIFIED');

    as('director2');
    const v = await call(r.verify.POST(req('POST', { sourceUrl: 'https://example.org/mec-syllabus.pdf', sourceSha256: 'b'.repeat(64) }), params({ id: ids.syllabus })));
    expect(v.status).toBe(200);

    as('publisher');
    const p1 = await call(r.publish.POST(req('POST', { revisionId: ids.rev1 }, { 'Idempotency-Key': 'pub-0000002' })));
    expect(p1.status).toBe(201);
    const p2 = await call(r.publish.POST(req('POST', { revisionId: ids.rev1 }, { 'Idempotency-Key': 'pub-0000002' })));
    expect(p2.body.data.publicationId).toBe(p1.body.data.publicationId);
    expect(sql(`SELECT count(*) FROM cee_publications`)).toBe('1');
  });

  it('shows the published lesson to students, without answers, and links it from its chapter', async () => {
    as('student');
    const s = await call(r.studentLesson.GET(req('GET'), params({ id: ids.lesson })));
    expect(s.status).toBe(200);
    expect(s.body.data.lesson.questions).toHaveLength(1);
    expect(JSON.stringify(s.body.data)).not.toMatch(/answerKey|rationale/);
    const links = await call(r.published.GET(req('GET'), params({ program: 'cee_medical' })));
    expect(links.body.data.lessons).toEqual([{ id: ids.lesson, title: 'Human Heart: chambers and valves', topic: 'Human Heart', legacyChapterIds: [legacyChapter] }]);
  });

  it('starts revision 2 from the published one, and only one open draft at a time', async () => {
    as('editor');
    const n = await call(r.revisions.POST(req('POST'), params({ id: ids.lesson })));
    expect(n.status).toBe(201);
    expect(n.body.data.number).toBe(2);
    expect(sql(`SELECT count(*) FROM cee_lesson_questions WHERE lesson_revision_id = '${n.body.data.id}'`)).toBe('1');
    expect((await call(r.revisions.POST(req('POST'), params({ id: ids.lesson })))).status).toBe(409);
  });

  it('audits every step and revoking a role takes effect at once', async () => {
    const actions = sql(`SELECT string_agg(action, ',' ORDER BY id) FROM cee_audit_logs`).split(',');
    for (const a of ['ROLE_GRANT', 'SYLLABUS_CREATE', 'NODE_CREATE', 'LESSON_CREATE', 'QUESTION_CREATE', 'SUBMIT', 'REVIEW_APPROVE', 'SYLLABUS_VERIFY', 'PUBLISH', 'REVISION_CREATE']) {
      expect(actions, a).toContain(a);
    }
    expect(actions.filter((a) => a === 'REVIEW_APPROVE')).toHaveLength(6);
    expect(sql(`SELECT count(*) FROM cee_audit_logs WHERE action IN ('LESSON_CREATE','ROLE_GRANT') AND request_id LIKE 'req_%'`)).not.toBe('0');

    as('root');
    expect((await call(r.revoke.POST(req('POST'), params({ id: ids.publisherRole })))).status).toBe(200);
    as('publisher');
    expect((await call(r.me.GET(req('GET')))).status).toBe(403);
  });
});
