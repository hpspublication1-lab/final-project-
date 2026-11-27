/**
 * Visual asset pipeline integration test: real admin route handlers →
 * supabase-js → PostgREST → Postgres with the proposed schema, and the test
 * proxy's storage stand-in (signed single-use uploads, private buckets).
 * The browser's direct upload is a real HTTP PUT to the signed URL.
 *
 * Only the session, super-admin list and (for one step) the malware scanner are
 * stubbed: no scanner is integrated until decision D7, so the test supplies one
 * to prove promotion happens only after a CLEAN verdict.
 *
 * Skipped unless scripts/cee/it-setup.sh is running (CEE_IT_URL, …).
 */
import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  user: null as null | { id: string; email: string | null },
  scanner: null as null | { name: string; scan: () => Promise<{ status: 'CLEAN' | 'INFECTED' | 'ERROR'; engine: string }> },
}));

vi.mock('@/lib/supabase/route-auth', () => ({ getSessionUser: async () => state.user }));
vi.mock('@/lib/config/superAdmin', () => ({ SUPER_ADMINS: [], isSuperAdmin: () => false }));
vi.mock('@/lib/supabase/admin', async () => {
  const { createClient } = await import('@supabase/supabase-js');
  return {
    createAdminClient: () =>
      createClient(process.env.CEE_IT_URL!, process.env.CEE_IT_SERVICE_KEY!, { auth: { persistSession: false, autoRefreshToken: false } }),
  };
});
vi.mock('../scanner', async (orig) => ({ ...(await orig<typeof import('../scanner')>()), getScanner: () => state.scanner }));

const enabled = Boolean(process.env.CEE_IT_URL && process.env.CEE_IT_SERVICE_KEY && process.env.CEE_IT_PSQL);
const sql = (text: string) => execSync(`${process.env.CEE_IT_PSQL} -v ON_ERROR_STOP=1 -q -At`, { input: text }).toString().trim();
const storageDir = process.env.IT_STORAGE_DIR ?? '/tmp/cee-it/storage';

const people = {
  animator: 'a2000000-0000-4000-8000-000000000001',
  expert: 'a2000000-0000-4000-8000-000000000002',
  rights: 'a2000000-0000-4000-8000-000000000003',
  editor: 'a2000000-0000-4000-8000-000000000004',
  ieltsEditor: 'a2000000-0000-4000-8000-000000000005',
  publisher: 'a2000000-0000-4000-8000-000000000006',
  subjectExpert: 'a2000000-0000-4000-8000-000000000007',
} as const;
type Who = keyof typeof people;
const as = (w: Who) => (state.user = { id: people[w], email: `${w}@test.invalid` });
const ID = {
  syllabus: '61000000-0000-4000-8000-000000000001',
  subject: '62000000-0000-4000-8000-000000000001',
  chapter: '62000000-0000-4000-8000-000000000002',
  lesson: '63000000-0000-4000-8000-000000000001',
  revision: '64000000-0000-4000-8000-000000000001',
};

type Res = { status: number; body: any };
const call = async (p: Promise<Response>): Promise<Res> => {
  const r = await p;
  return { status: r.status, body: await r.json() };
};
const params = <T extends Record<string, string>>(v: T) => ({ params: Promise.resolve(v) });
const req = (method: string, body?: unknown, query = '') =>
  new Request(`http://test/api${query}`, { method, headers: { 'content-type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
const sha = (b: Uint8Array) => createHash('sha256').update(b).digest('hex');

const glb = new Uint8Array(readFileSync('public/cee-dev-fixture/fixture.glb'));
const svg = new Uint8Array(readFileSync('public/cee-dev-fixture/fallback.svg'));

describe.skipIf(!enabled)('CEE visual asset pipeline (real PostgREST + storage stand-in)', () => {
  let r: Record<string, any>;
  const ids: Record<string, string> = {};

  /** What the browser does: declare, PUT the bytes to the signed URL, ask the server to process. */
  async function upload(assetId: string, bytes: Uint8Array, mime: string, declared: Uint8Array = bytes) {
    const init = await call(r.versions.POST(req('POST', { mimeType: mime, sizeBytes: declared.length, sha256: sha(declared) }), params({ id: assetId })));
    expect(init.status, JSON.stringify(init.body)).toBe(201);
    const put = await fetch(init.body.data.upload.url, { method: 'PUT', headers: init.body.data.upload.headers, body: new Blob([bytes as BlobPart]) });
    return { versionId: init.body.data.versionId as string, url: init.body.data.upload.url as string, put: put.status };
  }
  const processV = (id: string) => call(r.process.POST(req('POST'), params({ id })));

  beforeAll(async () => {
    sql(`
TRUNCATE cee_settings, cee_syllabus_versions, cee_curriculum_nodes, cee_learning_objectives, cee_lessons, cee_lesson_revisions,
  cee_lesson_mappings, cee_visual_assets, cee_asset_versions, cee_asset_jobs, cee_lesson_assets, cee_question_revisions,
  cee_lesson_questions, cee_review_requests, cee_review_decisions, cee_publications, cee_role_assignments, cee_audit_logs,
  cee_student_progress, cee_player_events, cee_attempts CASCADE;
INSERT INTO cee_settings (key, value) VALUES ('cee_visual_enabled', 'false');
INSERT INTO cee_role_assignments (user_id, role_key, program_code, granted_by) VALUES
  ('${people.animator}', 'ANIMATOR', 'cee_medical', '${people.expert}'),
  ('${people.expert}', 'SUBJECT_EXPERT', 'cee_medical', '${people.animator}'),
  ('${people.rights}', 'RIGHTS_REVIEWER', 'cee_medical', '${people.animator}'),
  ('${people.editor}', 'EDITOR', 'cee_medical', '${people.animator}'),
  ('${people.ieltsEditor}', 'EDITOR', 'ielts', '${people.animator}'),
  ('${people.publisher}', 'PUBLISHER', 'cee_medical', '${people.animator}');
-- Test data only: a placeholder syllabus, lesson and draft.
INSERT INTO cee_syllabus_versions (id, program_code, label, created_by) VALUES ('${ID.syllabus}', 'cee_medical', 'Asset test (not a real syllabus)', '${people.editor}');
INSERT INTO cee_curriculum_nodes (id, syllabus_version_id, parent_id, node_type, code, title, created_by) VALUES
  ('${ID.subject}', '${ID.syllabus}', NULL, 'SUBJECT', 'test-subject', 'Test subject', '${people.editor}'),
  ('${ID.chapter}', '${ID.syllabus}', '${ID.subject}', 'CHAPTER', 'test-chapter', 'Test chapter', '${people.editor}');
INSERT INTO cee_role_assignments (user_id, role_key, program_code, subject_node_id, granted_by)
  VALUES ('${people.subjectExpert}', 'SUBJECT_EXPERT', 'cee_medical', '${ID.subject}', '${people.animator}');
INSERT INTO cee_lessons (id, program_code, slug, title, created_by) VALUES ('${ID.lesson}', 'cee_medical', 'asset-test', 'Asset test lesson (not real content)', '${people.editor}');
INSERT INTO cee_lesson_mappings (lesson_id, node_id, created_by) VALUES ('${ID.lesson}', '${ID.chapter}', '${people.editor}');
INSERT INTO cee_lesson_revisions (id, lesson_id, revision_number, content, created_by) VALUES ('${ID.revision}', '${ID.lesson}', 1, '{}', '${people.editor}');
`);
    r = {
      assets: await import('@/app/api/v1/cee/admin/assets/route'),
      versions: await import('@/app/api/v1/cee/admin/assets/[id]/versions/route'),
      process: await import('@/app/api/v1/cee/admin/asset-versions/[id]/process/route'),
      manifest: await import('@/app/api/v1/cee/admin/asset-versions/[id]/manifest/route'),
      preview: await import('@/app/api/v1/cee/admin/asset-versions/[id]/preview/route'),
      submit: await import('@/app/api/v1/cee/admin/asset-versions/[id]/submit/route'),
      reviews: await import('@/app/api/v1/cee/admin/reviews/route'),
      decide: await import('@/app/api/v1/cee/admin/reviews/[id]/decision/route'),
      pin: await import('@/app/api/v1/cee/admin/lesson-revisions/[id]/assets/route'),
      unpin: await import('@/app/api/v1/cee/admin/lesson-revisions/[id]/assets/[versionId]/route'),
    };
  }, 60000);

  it('creates visuals only with an upload role in the course, and requires licence and credit', async () => {
    as('expert');
    expect((await call(r.assets.POST(req('POST', { program: 'cee_medical', title: 'Test heart model', kind: 'MODEL_3D', license: 'test-only', sourceCredit: 'Fixture' })))).status).toBe(403);
    as('ieltsEditor');
    expect((await call(r.assets.POST(req('POST', { program: 'cee_medical', title: 'Test heart model', kind: 'MODEL_3D', license: 'test-only', sourceCredit: 'Fixture' })))).status).toBe(403);
    as('animator');
    expect((await call(r.assets.POST(req('POST', { program: 'cee_medical', title: 'No licence', kind: 'MODEL_3D' })))).status).toBe(400);
    expect((await call(r.assets.POST(req('POST', { program: 'cee_medical', title: 'A video', kind: 'VIDEO', license: 'x1', sourceCredit: 'x1' })))).status).toBe(400);
    const model = await call(r.assets.POST(req('POST', { program: 'cee_medical', title: 'Test model (fixture, not anatomy)', kind: 'MODEL_3D', license: 'test-only', sourceCredit: 'Dev fixture' })));
    const diagram = await call(r.assets.POST(req('POST', { program: 'cee_medical', title: 'Test diagram (fixture)', kind: 'DIAGRAM_2D', license: 'test-only', sourceCredit: 'Dev fixture' })));
    expect(model.status).toBe(201);
    ids.model = model.body.data.id;
    ids.diagram = diagram.body.data.id;
  });

  it('refuses types the kind does not accept and oversize files before any upload', async () => {
    as('animator');
    const wrong = await call(r.versions.POST(req('POST', { mimeType: 'image/svg+xml', sizeBytes: 100, sha256: 'a'.repeat(64) }), params({ id: ids.model })));
    expect(wrong.status).toBe(415);
    const big = await call(r.versions.POST(req('POST', { mimeType: 'model/gltf-binary', sizeBytes: 30 * 1024 * 1024, sha256: 'a'.repeat(64) }), params({ id: ids.model })));
    expect(big.status).toBe(413);
  });

  it('uploads straight to quarantine with a single-use URL, then validates on the server', async () => {
    as('animator');
    const early = await call(r.versions.POST(req('POST', { mimeType: 'model/gltf-binary', sizeBytes: glb.length, sha256: sha(glb) }), params({ id: ids.model })));
    expect((await processV(early.body.data.versionId)).body.error.code).toBe('STATE_CONFLICT'); // nothing uploaded yet

    const m = await upload(ids.model, glb, 'model/gltf-binary');
    expect(m.put).toBe(200);
    expect((await fetch(m.url, { method: 'PUT', headers: { 'content-type': 'model/gltf-binary' }, body: new Blob([glb as BlobPart]) })).status).toBe(400); // token used up
    const done = await processV(m.versionId);
    expect(done.status).toBe(200);
    expect(done.body.data).toMatchObject({ status: 'VALIDATED', scanStatus: 'NOT_SCANNED', published: false });
    expect(done.body.data.nextStep).toMatch(/No malware scanner is configured yet/);
    ids.modelV = m.versionId;
    const jobs = sql(`SELECT string_agg(step || ':' || status, ',' ORDER BY step) FROM cee_asset_jobs WHERE asset_version_id = '${m.versionId}'`);
    expect(jobs).toBe('PROMOTE:PENDING,SCAN:PENDING,VALIDATE:DONE,VERIFY_UPLOAD:DONE');
    expect(existsSync(`${storageDir}/cee-published`)).toBe(false); // nothing promoted without a scan

    const d = await upload(ids.diagram, svg, 'image/svg+xml');
    expect((await processV(d.versionId)).body.data.status).toBe('VALIDATED');
    ids.diagramV = d.versionId;
  });

  it('rejects a file that is not the one declared, for good', async () => {
    as('animator');
    const other = new Uint8Array(glb);
    other[100] ^= 0xff;
    const v = await upload(ids.model, other, 'model/gltf-binary', glb);
    const res = await processV(v.versionId);
    expect(res.body.data.status).toBe('REJECTED');
    expect(res.body.data.errors.map((e: any) => e.code)).toEqual(['HASH_MISMATCH']);
    expect((await processV(v.versionId)).status).toBe(409);
    expect(sql(`SELECT validation_report->'errors'->0->>'code' FROM cee_asset_versions WHERE id = '${v.versionId}'`)).toBe('HASH_MISMATCH');
  });

  it('a script disguised as an SVG diagram is rejected by the validator', async () => {
    as('animator');
    const bad = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"><script>fetch("/x")</script></svg>');
    const v = await upload(ids.diagram, bad, 'image/svg+xml');
    expect((await processV(v.versionId)).body.data.status).toBe('REJECTED');
  });

  it('describes the 3D version with a validated 2D fallback; node names must exist in the model', async () => {
    as('animator');
    const node = sql(`SELECT validation_report->'modelNodes'->'nodeNames'->>0 FROM cee_asset_versions WHERE id = '${ids.modelV}'`);
    const manifest = (hotspotNode: string) => ({
      schemaVersion: '1.0',
      kind: 'MODEL_3D',
      title: 'Test model (fixture)',
      model: { format: 'glb', layers: [] },
      hotspots: [{ id: 'part-a', label: 'Part A', targetNode: hotspotNode }],
      sequences: [],
      fallback: { assetVersionId: ids.diagramV, kind: 'svg' },
      accessibility: { description: 'A geometric test fixture with three simple shapes. Not anatomy.', reducedMotionSupported: true },
    });
    const wrongNode = await call(r.manifest.PUT(req('PUT', manifest('no-such-node')), params({ id: ids.modelV })));
    expect(wrongNode.status).toBe(422);
    const ok = await call(r.manifest.PUT(req('PUT', manifest(node)), params({ id: ids.modelV })));
    expect(ok.status, JSON.stringify(ok.body)).toBe(200);
    const d = await call(r.manifest.PUT(req('PUT', { schemaVersion: '1.0', kind: 'DIAGRAM_2D', title: 'Test diagram', hotspots: [], sequences: [], accessibility: { description: 'A flat test diagram used as the fallback. Not anatomy.', reducedMotionSupported: true } }), params({ id: ids.diagramV })));
    expect(d.status).toBe(200);
  });

  it('staff can preview a validated version through a short-lived link', async () => {
    as('expert');
    const p = await call(r.preview.GET(req('GET'), params({ id: ids.modelV })));
    expect(p.status).toBe(200);
    expect(p.body.data.scanned).toBe(false);
    const got = new Uint8Array(await (await fetch(p.body.data.url)).arrayBuffer());
    expect(sha(got)).toBe(sha(glb));
  });

  it('sends versions to three reviews; reviewers decide in the shared queue; the uploader cannot review', async () => {
    as('animator');
    expect((await call(r.submit.POST(req('POST'), params({ id: ids.modelV })))).status).toBe(200);
    expect((await call(r.submit.POST(req('POST'), params({ id: ids.modelV })))).status).toBe(409); // once only
    expect((await call(r.manifest.PUT(req('PUT', {}), params({ id: ids.modelV })))).status).toBe(409); // description fixed
    expect((await call(r.submit.POST(req('POST'), params({ id: ids.diagramV })))).status).toBe(200);

    const queue = async (w: Who) => {
      as(w);
      return (await call(r.reviews.GET(req('GET', undefined, '?program=cee_medical&status=OPEN')))).body.data.reviews.filter((x: any) => x.subject === 'ASSET');
    };
    expect((await queue('expert')).map((x: any) => x.gate).sort()).toEqual(['SCIENTIFIC', 'SCIENTIFIC', 'VISUAL', 'VISUAL']);
    expect((await queue('rights')).map((x: any) => x.gate)).toEqual(['RIGHTS', 'RIGHTS']);
    expect(await queue('subjectExpert')).toEqual([]); // visuals have no subject: course-wide roles only
    const animatorView = await queue('animator');
    expect(animatorView).toEqual([]);

    const decide = (w: Who, id: string, decision = 'APPROVE', comments?: string) => {
      as(w);
      return call(r.decide.POST(req('POST', { decision, comments }), params({ id })));
    };
    const all = sql(`SELECT string_agg(gate || '=' || id, ',') FROM cee_review_requests WHERE entity_type = 'ASSET_VERSION' AND entity_id = '${ids.modelV}'`)
      .split(',')
      .map((x) => x.split('='));
    const reqFor = (g: string) => all.find(([gate]) => gate === g)![1];
    expect((await decide('animator', reqFor('SCIENTIFIC'))).status).toBe(403);
    expect((await decide('expert', reqFor('SCIENTIFIC'))).body.data).toEqual({ assetReviewState: 'IN_REVIEW' });
    expect((await decide('expert', reqFor('VISUAL'))).body.data).toEqual({ assetReviewState: 'IN_REVIEW' });
    expect((await decide('expert', reqFor('RIGHTS'))).status).toBe(403); // wrong role for the gate
    expect((await decide('rights', reqFor('RIGHTS'))).body.data).toEqual({ assetReviewState: 'APPROVED' });

    for (const [gate, id] of sql(`SELECT string_agg(gate || '=' || id, ',') FROM cee_review_requests WHERE entity_type = 'ASSET_VERSION' AND entity_id = '${ids.diagramV}'`)
      .split(',')
      .map((x) => x.split('='))) {
      expect((await decide(gate === 'RIGHTS' ? 'rights' : 'expert', id)).status).toBe(200);
    }
  });

  it('attaches versions to a draft with the right roles, inside its own course', async () => {
    as('ieltsEditor');
    expect((await call(r.pin.POST(req('POST', { assetVersionId: ids.modelV, role: 'PRIMARY' }), params({ id: ID.revision })))).status).toBe(403);
    as('editor');
    expect((await call(r.pin.POST(req('POST', { assetVersionId: ids.modelV, role: 'FALLBACK' }), params({ id: ID.revision })))).status).toBe(400);
    expect((await call(r.pin.POST(req('POST', { assetVersionId: ids.modelV, role: 'PRIMARY' }), params({ id: ID.revision })))).status).toBe(201);
    expect((await call(r.pin.POST(req('POST', { assetVersionId: ids.diagramV, role: 'PRIMARY' }), params({ id: ID.revision })))).status).toBe(409);
    expect((await call(r.pin.POST(req('POST', { assetVersionId: ids.diagramV, role: 'FALLBACK' }), params({ id: ID.revision })))).status).toBe(201);
    const rejected = sql(`SELECT id FROM cee_asset_versions WHERE status = 'REJECTED' AND asset_id = '${ids.diagram}' LIMIT 1`);
    expect((await call(r.pin.POST(req('POST', { assetVersionId: rejected, role: 'SUPPORTING' }), params({ id: ID.revision })))).status).toBe(409);
    expect((await call(r.unpin.DELETE(req('DELETE'), params({ id: ID.revision, versionId: ids.diagramV })))).status).toBe(200);
    expect((await call(r.pin.POST(req('POST', { assetVersionId: ids.diagramV, role: 'FALLBACK' }), params({ id: ID.revision })))).status).toBe(201);
    expect(sql(`SELECT string_agg(role, ',' ORDER BY role) FROM cee_lesson_assets WHERE lesson_revision_id = '${ID.revision}'`)).toBe('FALLBACK,PRIMARY');
  });

  it('promotes only after a CLEAN scan, to a key that starts with the content hash; INFECTED is final', async () => {
    as('animator');
    state.scanner = { name: 'test-scanner', scan: async () => ({ status: 'CLEAN', engine: 'test-scanner' }) };
    try {
      const res = await processV(ids.modelV);
      expect(res.body.data).toMatchObject({ status: 'VALIDATED', scanStatus: 'CLEAN', published: true });
      const key = sql(`SELECT published_key FROM cee_asset_versions WHERE id = '${ids.modelV}'`);
      expect(key).toBe(`${sha(glb)}/${ids.modelV}.glb`);
      expect(sha(new Uint8Array(readFileSync(`${storageDir}/cee-published/${key}`)))).toBe(sha(glb));
      expect((await processV(ids.modelV)).body.data.published).toBe(true); // repeat is harmless

      state.scanner = { name: 'test-scanner', scan: async () => ({ status: 'INFECTED', engine: 'test-scanner' }) };
      const infected = await processV(ids.diagramV);
      expect(infected.body.data).toMatchObject({ scanStatus: 'INFECTED', published: false });
      state.scanner = { name: 'test-scanner', scan: async () => ({ status: 'CLEAN', engine: 'test-scanner' }) };
      expect((await processV(ids.diagramV)).body.data).toMatchObject({ scanStatus: 'INFECTED', published: false }); // final
    } finally {
      state.scanner = null;
    }
    expect(sql(`SELECT count(*) FROM cee_audit_logs WHERE action IN ('ASSET_UPLOAD_START','ASSET_VALIDATED','ASSET_REJECTED','ASSET_SCAN_CLEAN','ASSET_SCAN_INFECTED','ASSET_PROMOTED') AND request_id IS NOT NULL`)).not.toBe('0');
  });

  it('lists the course’s visuals with versions, checks, jobs and review state', async () => {
    as('expert');
    const list = await call(r.assets.GET(req('GET', undefined, '?program=cee_medical')));
    const model = list.body.data.assets.find((a: any) => a.id === ids.model);
    const v = model.versions.find((x: any) => x.id === ids.modelV);
    expect(v).toMatchObject({ status: 'VALIDATED', scanStatus: 'CLEAN', published: true, locked: true, review: { state: 'APPROVED' } });
    expect(model.versions.some((x: any) => x.status === 'REJECTED' && x.report.errors[0].code === 'HASH_MISMATCH')).toBe(true);
    expect(list.body.data.acceptedTypes.MODEL_3D[0].ext).toBe('glb');
  });
});
