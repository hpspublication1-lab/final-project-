import 'server-only';

/**
 * Visual asset library for the CMS: create an asset, upload versions straight
 * to a private quarantine bucket through a signed single-use URL, then process
 * them on the server (verify size and SHA-256 against what was declared, check
 * the real file type, run the validator), scan (a slot until decision D7), and
 * promote to the published bucket only when validated AND scanned clean.
 *
 * Files never pass through the app's own request bodies (Vercel caps those at
 * about 4.5 MB). Every step is recorded in cee_asset_jobs and the audit log.
 */
import { z } from 'zod';
import { audit, authorize, authorizeView, check, revisionWithScope, RoleGrant, type StaffContext } from './admin.server';
import { acceptedType, ACCEPTED_TYPES, publishedKey, quarantineKey, reportForStorage, validateAssetBytes, type AssetKind } from './assetPipeline';
import { CeeApiError, mapDbError } from './http';
import { getScanner, NO_SCANNER_MESSAGE } from './scanner';
import { VisualAssetManifest, type ProgramCode } from './schemas';
import { PUBLISHED_BUCKET, SIGNED_URL_SECONDS } from './service.server';
import { checkManifest } from './validators/manifest';
import type { GlbReport } from './validators/glb';

export const QUARANTINE_BUCKET = 'cee-quarantine';
const UPLOAD_URL_SECONDS = 2 * 60 * 60; // how long Supabase signed upload URLs last
const STEPS = ['VERIFY_UPLOAD', 'VALIDATE', 'SCAN', 'PROMOTE'] as const;
type Step = (typeof STEPS)[number];

interface AssetRow {
  id: string;
  program_code: ProgramCode;
  title: string;
  kind: AssetKind;
  license: string | null;
  source_credit: string | null;
  created_by: string;
  created_at: string;
}

interface VersionRow {
  id: string;
  asset_id: string;
  version_number: number;
  status: 'UPLOADING' | 'VALIDATING' | 'VALIDATED' | 'REJECTED';
  quarantine_key: string;
  published_key: string | null;
  sha256: string;
  size_bytes: number;
  mime_type: string;
  scan_status: 'NOT_SCANNED' | 'CLEAN' | 'INFECTED' | 'ERROR';
  manifest: Record<string, unknown>;
  validation_report: Record<string, unknown> | null;
  locked_at: string | null;
  created_by: string;
  created_at: string;
}

const VERSION_COLS =
  'id, asset_id, version_number, status, quarantine_key, published_key, sha256, size_bytes, mime_type, scan_status, manifest, validation_report, locked_at, created_by, created_at';

async function assetRow(ctx: StaffContext, assetId: string): Promise<AssetRow> {
  const a = check(
    await ctx.client.from('cee_visual_assets').select('id, program_code, title, kind, license, source_credit, created_by, created_at').eq('id', assetId).maybeSingle()
  ) as AssetRow | null;
  if (!a) throw new CeeApiError('NOT_FOUND');
  return a;
}

async function versionWithAsset(ctx: StaffContext, versionId: string): Promise<{ v: VersionRow; a: AssetRow }> {
  const v = check(await ctx.client.from('cee_asset_versions').select(VERSION_COLS).eq('id', versionId).maybeSingle()) as VersionRow | null;
  if (!v) throw new CeeApiError('NOT_FOUND');
  return { v, a: await assetRow(ctx, v.asset_id) };
}

const extOf = (mime: string) => Object.values(ACCEPTED_TYPES).flat().find((t) => t.mime === mime)?.ext ?? 'bin';

async function setJob(ctx: StaffContext, versionId: string, step: Step, status: 'PENDING' | 'RUNNING' | 'DONE' | 'FAILED' | 'DEAD', lastError: string | null = null, bumpAttempt = false) {
  const current = check(
    await ctx.client.from('cee_asset_jobs').select('attempts').eq('asset_version_id', versionId).eq('step', step).maybeSingle()
  ) as { attempts: number } | null;
  const attempts = Math.min(3, (current?.attempts ?? 0) + (bumpAttempt ? 1 : 0));
  check(
    await ctx.client
      .from('cee_asset_jobs')
      .upsert({ asset_version_id: versionId, step, status, attempts, last_error: lastError?.slice(0, 500) ?? null, updated_at: new Date().toISOString() }, { onConflict: 'asset_version_id,step' })
  );
}

// ── Create and list ────────────────────────────────────────────────────────

export const AssetCreate = z.strictObject({
  program: RoleGrant.shape.program,
  title: z.string().trim().min(3).max(200),
  kind: z.enum(['MODEL_3D', 'DIAGRAM_2D']),
  /** Licence and credit are what the rights reviewer checks; required up front. */
  license: z.string().trim().min(2).max(200),
  sourceCredit: z.string().trim().min(2).max(500),
});

export async function createAsset(ctx: StaffContext, input: z.infer<typeof AssetCreate>) {
  authorize(ctx, 'asset:upload', input.program, null);
  const row = check(
    await ctx.client
      .from('cee_visual_assets')
      .insert({ program_code: input.program, title: input.title, kind: input.kind, license: input.license, source_credit: input.sourceCredit, created_by: ctx.user.id })
      .select('id')
      .single()
  ) as { id: string };
  await audit(ctx, 'ASSET_CREATE', 'VISUAL_ASSET', row.id, input);
  return { id: row.id };
}

type ReviewState = 'NOT_SUBMITTED' | 'IN_REVIEW' | 'APPROVED' | 'CHANGES_REQUESTED';

export async function listAssets(ctx: StaffContext, program: ProgramCode) {
  authorizeView(ctx, program);
  const assets = check(
    await ctx.client
      .from('cee_visual_assets')
      .select('id, program_code, title, kind, license, source_credit, created_by, created_at')
      .eq('program_code', program)
      .order('created_at', { ascending: false })
      .limit(500)
  ) as AssetRow[];
  const ids = assets.map((a) => a.id);
  const versions = ids.length
    ? (check(await ctx.client.from('cee_asset_versions').select(VERSION_COLS).in('asset_id', ids).order('version_number', { ascending: false })) as VersionRow[])
    : [];
  const vIds = versions.map((v) => v.id);
  const [requests, jobs] = vIds.length
    ? await Promise.all([
        ctx.client.from('cee_review_requests').select('id, entity_id, gate, status').eq('entity_type', 'ASSET_VERSION').in('entity_id', vIds),
        ctx.client.from('cee_asset_jobs').select('asset_version_id, step, status, attempts, last_error').in('asset_version_id', vIds),
      ])
    : [{ data: [], error: null }, { data: [], error: null }];
  const reqs = check(requests) as { id: string; entity_id: string; gate: string; status: string }[];
  const decisions = reqs.length
    ? (check(await ctx.client.from('cee_review_decisions').select('request_id, decision, comments, decided_at').in('request_id', reqs.map((r) => r.id))) as {
        request_id: string;
        decision: string;
        comments: string | null;
        decided_at: string;
      }[])
    : [];
  const jobRows = check(jobs) as { asset_version_id: string; step: Step; status: string; attempts: number; last_error: string | null }[];

  const reviewOf = (versionId: string) => {
    const mine = reqs.filter((r) => r.entity_id === versionId);
    const gates = mine.map((r) => {
      const d = decisions.find((x) => x.request_id === r.id);
      return { gate: r.gate, status: r.status, decision: d?.decision ?? null, comments: d?.comments ?? null };
    });
    let state: ReviewState = 'NOT_SUBMITTED';
    if (gates.some((g) => g.decision === 'REQUEST_CHANGES' || g.decision === 'REJECT')) state = 'CHANGES_REQUESTED';
    else if (gates.length && gates.every((g) => g.decision === 'APPROVE')) state = 'APPROVED';
    else if (gates.length) state = 'IN_REVIEW';
    return { state, gates };
  };

  return {
    acceptedTypes: ACCEPTED_TYPES,
    /** False until decision D7: uploads can be checked, described and reviewed, but not published. */
    scannerConfigured: getScanner() !== null,
    assets: assets.map((a) => ({
      id: a.id,
      title: a.title,
      kind: a.kind,
      license: a.license,
      sourceCredit: a.source_credit,
      createdAt: a.created_at,
      versions: versions
        .filter((v) => v.asset_id === a.id)
        .map((v) => ({
          id: v.id,
          number: v.version_number,
          status: v.status,
          scanStatus: v.scan_status,
          mimeType: v.mime_type,
          sizeBytes: v.size_bytes,
          sha256: v.sha256,
          published: v.published_key !== null,
          locked: v.locked_at !== null,
          manifest: Object.keys(v.manifest ?? {}).length ? v.manifest : null,
          report: v.validation_report ? { ok: v.validation_report.ok, errors: v.validation_report.errors, warnings: v.validation_report.warnings, model: v.validation_report.model, image: v.validation_report.image, svg: v.validation_report.svg } : null,
          jobs: jobRows.filter((j) => j.asset_version_id === v.id).map((j) => ({ step: j.step, status: j.status, attempts: j.attempts, lastError: j.last_error })),
          review: reviewOf(v.id),
          uploadedByMe: v.created_by === ctx.user.id,
          createdAt: v.created_at,
        })),
    })),
  };
}

// ── Upload: signed URL in, server-side processing out ────────────────────────

export const VersionInit = z.strictObject({
  mimeType: z.string().min(3).max(100),
  sizeBytes: z.number().int().positive().max(52428800),
  sha256: z.string().regex(/^[0-9a-f]{64}$/, 'lowercase hex SHA-256 of the file'),
});

export async function initUpload(ctx: StaffContext, assetId: string, input: z.infer<typeof VersionInit>) {
  const a = await assetRow(ctx, assetId);
  authorize(ctx, 'asset:upload', a.program_code, null);
  const type = acceptedType(a.kind, input.mimeType);
  if (!type) {
    const ok = ACCEPTED_TYPES[a.kind].map((t) => t.ext.toUpperCase()).join(', ') || 'nothing yet';
    throw new CeeApiError('UNSUPPORTED_TYPE', `This visual accepts ${ok}.`);
  }
  if (input.sizeBytes > type.maxBytes) throw new CeeApiError('PAYLOAD_TOO_LARGE', `${type.ext.toUpperCase()} files can be at most ${Math.round(type.maxBytes / 1024 / 1024)} MB.`);

  let row: { id: string; version_number: number } | null = null;
  for (let attempt = 0; attempt < 2 && !row; attempt++) {
    const last = check(
      await ctx.client.from('cee_asset_versions').select('version_number').eq('asset_id', assetId).order('version_number', { ascending: false }).limit(1)
    ) as { version_number: number }[];
    const id = crypto.randomUUID();
    const res = await ctx.client
      .from('cee_asset_versions')
      .insert({
        id,
        asset_id: assetId,
        version_number: (last[0]?.version_number ?? 0) + 1,
        quarantine_key: quarantineKey(assetId, id, type.ext),
        sha256: input.sha256,
        size_bytes: input.sizeBytes,
        mime_type: input.mimeType,
        created_by: ctx.user.id,
      })
      .select('id, version_number')
      .single();
    if (res.error?.code === '23505' && attempt === 0) continue; // someone else took that number; try the next
    row = check(res) as { id: string; version_number: number };
  }
  if (!row) throw new CeeApiError('STATE_CONFLICT', 'Another upload is starting for this visual. Try again.');
  check(await ctx.client.from('cee_asset_jobs').insert(STEPS.map((step) => ({ asset_version_id: row!.id, step }))));

  const signed = await ctx.client.storage.from(QUARANTINE_BUCKET).createSignedUploadUrl(quarantineKey(assetId, row.id, type.ext));
  if (signed.error || !signed.data) {
    console.error(`[cee-visual] signed upload URL failed for ${row.id}: ${signed.error?.message}`);
    throw new CeeApiError('INTERNAL');
  }
  await audit(ctx, 'ASSET_UPLOAD_START', 'ASSET_VERSION', row.id, { mimeType: input.mimeType, sizeBytes: input.sizeBytes, sha256: input.sha256 });
  return {
    versionId: row.id,
    versionNumber: row.version_number,
    upload: { url: signed.data.signedUrl, method: 'PUT' as const, headers: { 'content-type': input.mimeType, 'x-upsert': 'false' }, expiresInSeconds: UPLOAD_URL_SECONDS },
  };
}

async function readQuarantine(ctx: StaffContext, key: string): Promise<Uint8Array | null> {
  const { data, error } = await ctx.client.storage.from(QUARANTINE_BUCKET).download(key);
  if (error || !data) return null;
  return new Uint8Array(await data.arrayBuffer());
}

/**
 * Runs whatever steps a version still needs, in order, and returns its state.
 * Safe to call again: after an interruption, or once a scanner exists (D7).
 */
export async function processVersion(ctx: StaffContext, versionId: string) {
  let { v, a } = await versionWithAsset(ctx, versionId);
  authorize(ctx, 'asset:upload', a.program_code, null);
  if (v.status === 'REJECTED') throw new CeeApiError('STATE_CONFLICT', 'This version failed its checks. Upload a corrected file as a new version.');
  let bytes: Uint8Array | null = null;

  if (v.status === 'UPLOADING' || v.status === 'VALIDATING') {
    bytes = await readQuarantine(ctx, v.quarantine_key);
    if (!bytes) throw new CeeApiError('STATE_CONFLICT', 'The file hasn’t arrived yet. Upload it, then try again.');
    if (v.status === 'UPLOADING') check(await ctx.client.from('cee_asset_versions').update({ status: 'VALIDATING' }).eq('id', v.id).eq('status', 'UPLOADING'));
    await setJob(ctx, v.id, 'VERIFY_UPLOAD', 'RUNNING', null, true);
    const result = await validateAssetBytes(a.kind, { mime: v.mime_type, sizeBytes: v.size_bytes, sha256: v.sha256 }, bytes);
    const uploadProblem = result.errors.find((e) => ['SIZE_MISMATCH', 'HASH_MISMATCH', 'TOO_LARGE', 'TYPE_NOT_ALLOWED', 'CONTENT_MISMATCH'].includes(e.code));
    await setJob(ctx, v.id, 'VERIFY_UPLOAD', uploadProblem ? 'FAILED' : 'DONE', uploadProblem?.message ?? null);
    await setJob(ctx, v.id, 'VALIDATE', uploadProblem ? 'PENDING' : result.ok ? 'DONE' : 'FAILED', uploadProblem ? null : result.ok ? null : result.errors[0]?.message ?? 'invalid', !uploadProblem);
    const status = result.ok ? 'VALIDATED' : 'REJECTED';
    check(await ctx.client.from('cee_asset_versions').update({ status, validation_report: reportForStorage(result) }).eq('id', v.id).eq('status', 'VALIDATING'));
    await audit(ctx, result.ok ? 'ASSET_VALIDATED' : 'ASSET_REJECTED', 'ASSET_VERSION', v.id, { errors: result.errors.slice(0, 10).map((e) => e.code) });
    ({ v, a } = await versionWithAsset(ctx, versionId));
    if (v.status === 'REJECTED') return versionState(v, result.errors);
  }

  if (v.status === 'VALIDATED' && (v.scan_status === 'NOT_SCANNED' || v.scan_status === 'ERROR')) {
    const scanner = getScanner();
    if (!scanner) {
      await setJob(ctx, v.id, 'SCAN', 'PENDING', NO_SCANNER_MESSAGE);
    } else {
      bytes ??= await readQuarantine(ctx, v.quarantine_key);
      if (!bytes) throw new CeeApiError('STATE_CONFLICT', 'The uploaded file is missing from quarantine.');
      await setJob(ctx, v.id, 'SCAN', 'RUNNING', null, true);
      let verdict: Awaited<ReturnType<typeof scanner.scan>>;
      try {
        verdict = await scanner.scan(bytes, { sha256: v.sha256, mime: v.mime_type });
      } catch (e) {
        verdict = { status: 'ERROR', engine: scanner.name, detail: e instanceof Error ? e.message : String(e) };
      }
      check(await ctx.client.from('cee_asset_versions').update({ scan_status: verdict.status }).eq('id', v.id));
      const jobs = check(await ctx.client.from('cee_asset_jobs').select('attempts').eq('asset_version_id', v.id).eq('step', 'SCAN').single()) as { attempts: number };
      await setJob(ctx, v.id, 'SCAN', verdict.status === 'ERROR' ? (jobs.attempts >= 3 ? 'DEAD' : 'FAILED') : 'DONE', verdict.status === 'CLEAN' ? null : `${verdict.engine}: ${verdict.status}${verdict.detail ? ` (${verdict.detail})` : ''}`);
      await audit(ctx, `ASSET_SCAN_${verdict.status}`, 'ASSET_VERSION', v.id, { engine: verdict.engine });
      ({ v, a } = await versionWithAsset(ctx, versionId));
    }
  }

  if (v.status === 'VALIDATED' && v.scan_status === 'CLEAN' && !v.published_key) {
    const key = publishedKey(v.sha256, v.id, extOf(v.mime_type));
    await setJob(ctx, v.id, 'PROMOTE', 'RUNNING', null, true);
    const copied = await ctx.client.storage.from(QUARANTINE_BUCKET).copy(v.quarantine_key, key, { destinationBucket: PUBLISHED_BUCKET });
    // The key holds this version's id and hash and only this code writes it, so "already exists" means an earlier attempt finished.
    if (copied.error && !/exist|duplicate/i.test(copied.error.message)) {
      await setJob(ctx, v.id, 'PROMOTE', 'FAILED', copied.error.message);
      throw new CeeApiError('INTERNAL');
    }
    check(await ctx.client.from('cee_asset_versions').update({ published_key: key }).eq('id', v.id).is('published_key', null));
    await setJob(ctx, v.id, 'PROMOTE', 'DONE');
    await audit(ctx, 'ASSET_PROMOTED', 'ASSET_VERSION', v.id, { publishedKey: key });
    ({ v, a } = await versionWithAsset(ctx, versionId));
  }
  return versionState(v, []);
}

function versionState(v: VersionRow, errors: { code: string; message: string }[]) {
  const nextStep =
    v.status === 'REJECTED'
      ? 'Fix the problems and upload the file again as a new version.'
      : v.scan_status === 'NOT_SCANNED'
        ? NO_SCANNER_MESSAGE
        : v.scan_status === 'INFECTED'
          ? 'The scanner flagged this file. It will never be published.'
          : v.scan_status === 'ERROR'
            ? 'Scanning failed. Try again later.'
            : v.published_key
              ? 'Ready: validated, scanned clean and promoted.'
              : 'Waiting to be promoted.';
  return { versionId: v.id, status: v.status, scanStatus: v.scan_status, published: v.published_key !== null, errors: errors.slice(0, 20), nextStep };
}

// ── Describe (manifest), preview, review ─────────────────────────────────────

/** The model's node names, kept in the validation report so hotspots and layers can be checked without re-reading the file. */
function modelForChecks(v: VersionRow): GlbReport | null {
  const nodes = (v.validation_report?.modelNodes ?? null) as { nodeNames: string[]; duplicateNodeNames: string[] } | null;
  return nodes ? ({ nodeNames: nodes.nodeNames, duplicateNodeNames: nodes.duplicateNodeNames } as unknown as GlbReport) : null;
}

export async function saveManifest(ctx: StaffContext, versionId: string, raw: unknown) {
  const { v, a } = await versionWithAsset(ctx, versionId);
  authorize(ctx, 'asset:upload', a.program_code, null);
  if (v.status !== 'VALIDATED') throw new CeeApiError('STATE_CONFLICT', 'Describe a version once it has passed its checks.');
  if (v.locked_at) throw new CeeApiError('STATE_CONFLICT', 'This version was sent for review, so its description is fixed. Upload a new version to change it.');
  const parsed = VisualAssetManifest.safeParse(raw);
  if (!parsed.success) {
    throw new CeeApiError('ASSET_INVALID', 'The description is incomplete or invalid.', {
      issues: parsed.error.issues.slice(0, 20).map((i) => ({ path: i.path.join('.'), message: i.message })),
    });
  }
  const m = parsed.data;
  if (m.kind !== a.kind) throw new CeeApiError('ASSET_INVALID', `This visual is a ${a.kind}, not a ${m.kind}.`);
  if (m.kind === 'MODEL_3D') {
    const check3d = checkManifest(raw, modelForChecks(v));
    if (!check3d.ok) throw new CeeApiError('ASSET_INVALID', 'The description refers to parts that are not in the model.', { issues: check3d.errors.slice(0, 20) });
    const fb = m.fallback!;
    const { v: fv, a: fa } = await versionWithAsset(ctx, fb.assetVersionId).catch(() => {
      throw new CeeApiError('ASSET_INVALID', 'The 2D fallback doesn’t exist.');
    });
    if (fa.kind !== 'DIAGRAM_2D' || fa.program_code !== a.program_code || fv.status !== 'VALIDATED' || extOf(fv.mime_type) !== fb.kind) {
      throw new CeeApiError('ASSET_INVALID', 'The fallback must be a validated 2D diagram from the same course, and its file type must match.');
    }
  }
  check(await ctx.client.from('cee_asset_versions').update({ manifest: m }).eq('id', v.id).is('locked_at', null));
  await audit(ctx, 'ASSET_DESCRIBE', 'ASSET_VERSION', v.id, { title: m.title, hotspots: m.hotspots.length, sequences: m.sequences.length });
  return { saved: true };
}

/**
 * What a reviewer needs to judge a version: short-lived links to the file (and,
 * for 3D, its 2D fallback), the description, and the licence and credit. Uses
 * the published copy when there is one.
 */
export async function previewVersion(ctx: StaffContext, versionId: string) {
  const { v, a } = await versionWithAsset(ctx, versionId);
  authorizeView(ctx, a.program_code);
  if (v.status !== 'VALIDATED') throw new CeeApiError('STATE_CONFLICT', 'Only a version that passed its checks can be previewed.');
  const sign = async (row: VersionRow) => {
    const bucket = row.published_key ? PUBLISHED_BUCKET : QUARANTINE_BUCKET;
    const { data, error } = await ctx.client.storage.from(bucket).createSignedUrl(row.published_key ?? row.quarantine_key, SIGNED_URL_SECONDS);
    if (error || !data) throw mapDbError({ message: error?.message ?? 'sign failed' });
    return data.signedUrl;
  };
  const parsed = VisualAssetManifest.safeParse(v.manifest);
  let fallbackUrl: string | null = null;
  if (parsed.success && parsed.data.fallback) {
    const fb = check(await ctx.client.from('cee_asset_versions').select(VERSION_COLS).eq('id', parsed.data.fallback.assetVersionId).maybeSingle()) as VersionRow | null;
    if (fb?.status === 'VALIDATED') fallbackUrl = await sign(fb);
  }
  return {
    url: await sign(v),
    fallbackUrl,
    mimeType: v.mime_type,
    kind: a.kind,
    title: a.title,
    versionNumber: v.version_number,
    license: a.license,
    sourceCredit: a.source_credit,
    manifest: parsed.success ? parsed.data : null,
    scanned: v.scan_status === 'CLEAN',
    expiresInSeconds: SIGNED_URL_SECONDS,
  };
}

export async function submitVersion(ctx: StaffContext, versionId: string) {
  const { v, a } = await versionWithAsset(ctx, versionId);
  authorize(ctx, 'asset:upload', a.program_code, null);
  if (!VisualAssetManifest.safeParse(v.manifest).success) throw new CeeApiError('STATE_CONFLICT', 'Describe the visual (title, accessibility description) before review.');
  check(await ctx.client.rpc('cee_submit_asset_version', { p_version: versionId, p_actor: ctx.user.id, p_request_id: ctx.requestId }));
  return { submitted: true };
}

// ── Pinning a version to a lesson revision ─────────────────────────────────

export const PinInput = z.strictObject({
  assetVersionId: z.uuid(),
  role: z.enum(['PRIMARY', 'FALLBACK', 'SUPPORTING']),
});

export async function pinAsset(ctx: StaffContext, revisionId: string, input: z.infer<typeof PinInput>) {
  const { rev, lesson, subjectId } = await revisionWithScope(ctx.client, revisionId);
  authorize(ctx, 'lesson:edit', lesson.program_code, subjectId);
  if (rev.status !== 'DRAFT') throw new CeeApiError('STATE_CONFLICT', 'Visuals can be attached only to a draft.');
  const { v, a } = await versionWithAsset(ctx, input.assetVersionId);
  if (a.program_code !== lesson.program_code) throw new CeeApiError('CROSS_PROGRAM_MAPPING', 'That visual belongs to another course.');
  if (v.status !== 'VALIDATED') throw new CeeApiError('STATE_CONFLICT', 'Only a version that passed its checks can be attached.');
  if (input.role === 'FALLBACK' && a.kind !== 'DIAGRAM_2D') throw new CeeApiError('INVALID_REQUEST', 'A fallback must be a 2D diagram.');
  const pinned = check(
    await ctx.client.from('cee_lesson_assets').select('asset_version_id, role, cee_asset_versions(asset_id)').eq('lesson_revision_id', revisionId)
  ) as unknown as { asset_version_id: string; role: string; cee_asset_versions: { asset_id: string } | { asset_id: string }[] }[];
  const assetOf = (p: (typeof pinned)[number]) => (Array.isArray(p.cee_asset_versions) ? p.cee_asset_versions[0]?.asset_id : p.cee_asset_versions?.asset_id);
  if (pinned.some((p) => assetOf(p) === a.id)) throw new CeeApiError('STATE_CONFLICT', 'A version of this visual is already attached. Remove it first.');
  if (input.role !== 'SUPPORTING' && pinned.some((p) => p.role === input.role)) {
    throw new CeeApiError('STATE_CONFLICT', `This draft already has a ${input.role === 'PRIMARY' ? 'main visual' : 'fallback'}. Remove it first.`);
  }
  check(
    await ctx.client.from('cee_lesson_assets').insert({ lesson_revision_id: revisionId, asset_version_id: v.id, role: input.role, sort_key: pinned.length * 10 })
  );
  await audit(ctx, 'ASSET_ATTACH', 'LESSON_REVISION', revisionId, input);
  return { attached: true };
}

export async function unpinAsset(ctx: StaffContext, revisionId: string, assetVersionId: string) {
  const { rev, lesson, subjectId } = await revisionWithScope(ctx.client, revisionId);
  authorize(ctx, 'lesson:edit', lesson.program_code, subjectId);
  if (rev.status !== 'DRAFT') throw new CeeApiError('STATE_CONFLICT', 'Visuals can be removed only from a draft.');
  const gone = check(
    await ctx.client.from('cee_lesson_assets').delete().eq('lesson_revision_id', revisionId).eq('asset_version_id', assetVersionId).select('asset_version_id')
  ) as unknown[];
  if (gone.length === 0) throw new CeeApiError('NOT_FOUND');
  await audit(ctx, 'ASSET_DETACH', 'LESSON_REVISION', revisionId, { assetVersionId });
  return { removed: true };
}

/** For the review queue: a visual version's scope and title. Program-wide (visuals have no subject). */
export async function assetReviewScope(ctx: StaffContext, versionId: string) {
  const { v, a } = await versionWithAsset(ctx, versionId);
  return { versionId: v.id, versionNumber: v.version_number, createdBy: v.created_by, assetId: a.id, assetTitle: a.title, kind: a.kind, program: a.program_code };
}
