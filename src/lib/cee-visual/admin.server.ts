import 'server-only';

/**
 * CMS (staff) data layer for CEE visual lessons.
 *
 * Every call first resolves the caller's scoped role assignments
 * (cee_role_assignments, writable only by super admins through this API) and
 * checks them with decideScope() for the exact program and subject. Multi-step
 * changes (submit, review decision, publish) run inside database functions so
 * they are all-or-nothing; separation of duties is enforced here and again by
 * the database. Every write is audited with the request id.
 *
 * The coarse visual:* permissions in rbac.ts are not used as a gate: they come
 * from user_profiles.role, which signed-in users can still change on their own
 * account until the role-lockdown migration is applied (P2).
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { isSuperAdmin } from '@/lib/config/superAdmin';
import { decideScope, reviewAction, type CeeAction, type ReviewGate, type RoleAssignment, type RoleKey } from './authz';
import { CeeApiError, mapDbError, type DbErrorLike } from './http';
import { LessonContent, type ProgramCode } from './schemas';
import { exportSyllabusCsv, planSyllabusImport, toImportPayload, type PlannedNode } from './syllabusImport';
import { db, requireUser, type SessionUser } from './service.server';
import { z } from 'zod';

// ── Context and checks ────────────────────────────────────────────────────

export interface StaffContext {
  client: SupabaseClient;
  user: SessionUser;
  isSuperAdmin: boolean;
  assignments: (RoleAssignment & { id: string })[];
  requestId: string;
}

function check<T>(res: { data: T; error: DbErrorLike | null }): T {
  if (res.error) throw mapDbError(res.error);
  return res.data;
}

export async function staffContext(req: Request, requestId: string): Promise<StaffContext> {
  const client = db();
  const user = await requireUser(req);
  const assignments = check(
    await client
      .from('cee_role_assignments')
      .select('id, role_key, program_code, subject_node_id, revoked_at')
      .eq('user_id', user.id)
      .is('revoked_at', null)
  ) as (RoleAssignment & { id: string })[];
  const superAdmin = isSuperAdmin(user.email);
  if (!superAdmin && assignments.length === 0) throw new CeeApiError('FORBIDDEN', 'You have no CEE content role.');
  return { client, user, isSuperAdmin: superAdmin, assignments, requestId };
}

export function authorize(ctx: StaffContext, action: CeeAction, program: ProgramCode, subjectNodeId: string | null, authorIds: string[] = []): void {
  const d = decideScope(ctx.assignments, { actorId: ctx.user.id, action, program, subjectNodeId, authorIds });
  if (!d.allowed) throw new CeeApiError(d.code, d.code === 'FORBIDDEN' ? `You can’t do this here: ${d.reason}.` : undefined);
}

/** Anyone with a role in the program (or a super admin) may read its CMS data. */
export function authorizeView(ctx: StaffContext, program: ProgramCode): void {
  if (ctx.isSuperAdmin) return;
  if (!ctx.assignments.some((a) => a.program_code === program)) throw new CeeApiError('FORBIDDEN', 'You have no role in this course.');
}

export function requireSuperAdmin(ctx: StaffContext): void {
  if (!ctx.isSuperAdmin) throw new CeeApiError('FORBIDDEN', 'Only a super admin can manage roles.');
}

async function audit(ctx: StaffContext, action: string, entityType: string, entityId: string | null, after?: unknown, before?: unknown) {
  check(
    await ctx.client.from('cee_audit_logs').insert({
      actor_id: ctx.user.id,
      action,
      entity_type: entityType,
      entity_id: entityId,
      before_json: before ?? null,
      after_json: after ?? null,
      request_id: ctx.requestId,
    })
  );
}

// ── Curriculum helpers ────────────────────────────────────────────────────

interface NodeRow {
  id: string;
  parent_id: string | null;
  node_type: 'SUBJECT' | 'CHAPTER' | 'TOPIC';
  title: string;
  syllabus_version_id: string;
}

/** The node, its subject (top ancestor) and its program. */
async function nodeContext(client: SupabaseClient, nodeId: string): Promise<{ node: NodeRow; subjectId: string; program: ProgramCode; path: string[] }> {
  const start = check(
    await client.from('cee_curriculum_nodes').select('id, parent_id, node_type, title, syllabus_version_id').eq('id', nodeId).maybeSingle()
  ) as NodeRow | null;
  if (!start) throw new CeeApiError('NOT_FOUND', 'That curriculum topic doesn’t exist.');
  const all = check(
    await client.from('cee_curriculum_nodes').select('id, parent_id, node_type, title, syllabus_version_id').eq('syllabus_version_id', start.syllabus_version_id)
  ) as NodeRow[];
  const byId = new Map(all.map((n) => [n.id, n]));
  const path: string[] = [];
  let n: NodeRow | undefined = start;
  let subjectId = start.id;
  for (let hops = 0; n && hops < 10; hops++) {
    path.unshift(n.title);
    subjectId = n.id;
    n = n.parent_id ? byId.get(n.parent_id) : undefined;
  }
  const s = check(
    await client.from('cee_syllabus_versions').select('program_code').eq('id', start.syllabus_version_id).single()
  ) as { program_code: ProgramCode };
  return { node: start, subjectId, program: s.program_code, path };
}

interface LessonRow {
  id: string;
  program_code: ProgramCode;
  slug: string;
  title: string;
  created_by: string;
  created_at: string;
}

/** The lesson and the subject its primary (earliest) mapping sits under. */
async function lessonScope(client: SupabaseClient, lessonId: string): Promise<{ lesson: LessonRow; subjectId: string | null; topic: { id: string; path: string[] } | null }> {
  const lesson = check(
    await client.from('cee_lessons').select('id, program_code, slug, title, created_by, created_at').eq('id', lessonId).maybeSingle()
  ) as LessonRow | null;
  if (!lesson) throw new CeeApiError('NOT_FOUND');
  const maps = check(
    await client.from('cee_lesson_mappings').select('node_id, created_at').eq('lesson_id', lessonId).neq('status', 'REJECTED').order('created_at').limit(1)
  ) as { node_id: string }[];
  if (maps.length === 0) return { lesson, subjectId: null, topic: null };
  const nc = await nodeContext(client, maps[0].node_id);
  return { lesson, subjectId: nc.subjectId, topic: { id: maps[0].node_id, path: nc.path } };
}

interface RevisionRow {
  id: string;
  lesson_id: string;
  revision_number: number;
  status: string;
  content: unknown;
  created_by: string;
  created_at: string;
  submitted_at: string | null;
  updated_at: string;
}

const REVISION_COLS = 'id, lesson_id, revision_number, status, content, created_by, created_at, submitted_at, updated_at';

async function revisionWithScope(client: SupabaseClient, revisionId: string) {
  const rev = check(await client.from('cee_lesson_revisions').select(REVISION_COLS).eq('id', revisionId).maybeSingle()) as RevisionRow | null;
  if (!rev) throw new CeeApiError('NOT_FOUND');
  const scope = await lessonScope(client, rev.lesson_id);
  return { rev, ...scope };
}

// ── Me and roles ──────────────────────────────────────────────────────────

export function me(ctx: StaffContext) {
  return {
    userId: ctx.user.id,
    email: ctx.user.email,
    isSuperAdmin: ctx.isSuperAdmin,
    assignments: ctx.assignments.map((a) => ({ id: a.id, role: a.role_key, program: a.program_code, subjectNodeId: a.subject_node_id })),
  };
}

export const RoleGrant = z.strictObject({
  email: z.email().max(320),
  role: z.enum(['ACADEMIC_DIRECTOR', 'SUBJECT_EXPERT', 'ANIMATOR', 'EDITOR', 'QUESTION_REVIEWER', 'ACCESSIBILITY_REVIEWER', 'RIGHTS_REVIEWER', 'PUBLISHER']),
  program: z.enum(['cee_medical', 'see_class_10', 'neb_class_11', 'neb_class_12', 'ioe_engineering', 'lok_sewa', 'ielts', 'digital_marketing', 'artificial_intelligence']),
  subjectNodeId: z.uuid().nullable().default(null),
});

export async function listRoles(ctx: StaffContext, program: ProgramCode) {
  requireSuperAdmin(ctx);
  const rows = check(
    await ctx.client
      .from('cee_role_assignments')
      .select('id, user_id, role_key, program_code, subject_node_id, granted_at')
      .eq('program_code', program)
      .is('revoked_at', null)
      .order('granted_at')
  ) as { id: string; user_id: string; role_key: RoleKey; program_code: ProgramCode; subject_node_id: string | null; granted_at: string }[];
  const ids = [...new Set(rows.map((r) => r.user_id))];
  const profiles = ids.length
    ? ((check(await ctx.client.from('user_profiles').select('id, email, full_name').in('id', ids)) ?? []) as { id: string; email: string | null; full_name: string | null }[])
    : [];
  const who = new Map(profiles.map((p) => [p.id, p]));
  return rows.map((r) => ({
    id: r.id,
    userId: r.user_id,
    email: who.get(r.user_id)?.email ?? null,
    name: who.get(r.user_id)?.full_name ?? null,
    role: r.role_key,
    program: r.program_code,
    subjectNodeId: r.subject_node_id,
    grantedAt: r.granted_at,
  }));
}

export async function grantRole(ctx: StaffContext, input: z.infer<typeof RoleGrant>) {
  requireSuperAdmin(ctx);
  const escaped = input.email.replace(/[\\%_]/g, (c) => `\\${c}`);
  const users = check(await ctx.client.from('user_profiles').select('id, email').ilike('email', escaped).limit(2)) as { id: string }[];
  if (users.length !== 1) throw new CeeApiError('INVALID_REQUEST', 'No single account has that email.');
  if (input.subjectNodeId) {
    const nc = await nodeContext(ctx.client, input.subjectNodeId);
    if (nc.node.node_type !== 'SUBJECT' || nc.program !== input.program) {
      throw new CeeApiError('INVALID_REQUEST', 'subjectNodeId must be a subject in the same course.');
    }
  }
  const row = check(
    await ctx.client
      .from('cee_role_assignments')
      .insert({ user_id: users[0].id, role_key: input.role, program_code: input.program, subject_node_id: input.subjectNodeId, granted_by: ctx.user.id })
      .select('id')
      .single()
  ) as { id: string };
  await audit(ctx, 'ROLE_GRANT', 'ROLE_ASSIGNMENT', row.id, { userId: users[0].id, role: input.role, program: input.program, subjectNodeId: input.subjectNodeId });
  return { id: row.id, userId: users[0].id };
}

export async function revokeRole(ctx: StaffContext, assignmentId: string) {
  requireSuperAdmin(ctx);
  const data = check(
    await ctx.client.from('cee_role_assignments').update({ revoked_at: new Date().toISOString() }).eq('id', assignmentId).is('revoked_at', null).select('id')
  ) as { id: string }[];
  if (data.length === 0) throw new CeeApiError('NOT_FOUND');
  await audit(ctx, 'ROLE_REVOKE', 'ROLE_ASSIGNMENT', assignmentId);
}

// ── Syllabus and curriculum ───────────────────────────────────────────────

export const SyllabusCreate = z.strictObject({
  program: RoleGrant.shape.program,
  label: z.string().min(3).max(120),
  sourceUrl: z.url().max(500).optional(),
  effectiveDate: z.iso.date().optional(),
  notes: z.string().max(2000).optional(),
});

export async function createSyllabus(ctx: StaffContext, input: z.infer<typeof SyllabusCreate>) {
  authorize(ctx, 'syllabus:create', input.program, null);
  const row = check(
    await ctx.client
      .from('cee_syllabus_versions')
      .insert({
        program_code: input.program,
        label: input.label,
        source_url: input.sourceUrl ?? null,
        effective_date: input.effectiveDate ?? null,
        notes: input.notes ?? null,
        created_by: ctx.user.id,
      })
      .select('id')
      .single()
  ) as { id: string };
  await audit(ctx, 'SYLLABUS_CREATE', 'SYLLABUS_VERSION', row.id, input);
  return { id: row.id };
}

export const SyllabusVerify = z.strictObject({
  sourceUrl: z.url().max(500),
  sourceSha256: z.string().regex(/^[0-9a-f]{64}$/, 'lowercase hex SHA-256 of the official document'),
});

interface SyllabusRow {
  id: string;
  program_code: ProgramCode;
  status: string;
  created_by: string;
  source_sha256: string | null;
}

async function syllabusRow(client: SupabaseClient, syllabusId: string): Promise<SyllabusRow> {
  const s = check(
    await client.from('cee_syllabus_versions').select('id, program_code, status, created_by, source_sha256').eq('id', syllabusId).maybeSingle()
  ) as SyllabusRow | null;
  if (!s) throw new CeeApiError('NOT_FOUND');
  return s;
}

/** Everyone who entered part of the syllabus: none of them may verify it. */
async function syllabusAuthors(client: SupabaseClient, s: SyllabusRow): Promise<string[]> {
  const rows = check(await client.from('cee_curriculum_nodes').select('created_by').eq('syllabus_version_id', s.id)) as { created_by: string }[];
  return [...new Set([s.created_by, ...rows.map((r) => r.created_by)])];
}

/**
 * Verification by a program-wide academic director who neither created nor
 * entered the syllabus. The database function repeats every check, compares
 * the document fingerprint with the one recorded while drafting, and freezes
 * the tree.
 */
export async function verifySyllabus(ctx: StaffContext, syllabusId: string, input: z.infer<typeof SyllabusVerify>) {
  const s = await syllabusRow(ctx.client, syllabusId);
  authorize(ctx, 'syllabus:verify', s.program_code, null, await syllabusAuthors(ctx.client, s));
  if (s.status !== 'DRAFT') throw new CeeApiError('STATE_CONFLICT', 'Only a draft syllabus can be verified.');
  if (s.source_sha256 && s.source_sha256 !== input.sourceSha256) throw new CeeApiError('SOURCE_MISMATCH');
  check(
    await ctx.client.rpc('cee_verify_syllabus', {
      p_syllabus: syllabusId,
      p_verifier: ctx.user.id,
      p_source_url: input.sourceUrl,
      p_sha256: input.sourceSha256,
      p_request_id: ctx.requestId,
    })
  );
}

export const SyllabusDraftUpdate = z
  .strictObject({
    label: z.string().min(3).max(120).optional(),
    sourceUrl: z.url().max(500).nullable().optional(),
    sourceSha256: z.string().regex(/^[0-9a-f]{64}$/, 'lowercase hex SHA-256 of the official document').nullable().optional(),
    effectiveDate: z.iso.date().nullable().optional(),
    notes: z.string().max(2000).nullable().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, 'Nothing to change.');

/** Draft details, including the fingerprint of the document it is being entered from. */
export async function updateSyllabusDraft(ctx: StaffContext, syllabusId: string, input: z.infer<typeof SyllabusDraftUpdate>) {
  const s = await syllabusRow(ctx.client, syllabusId);
  authorize(ctx, 'curriculum:edit', s.program_code, null);
  if (s.status !== 'DRAFT') throw new CeeApiError('CURRICULUM_FROZEN');
  const patch: Record<string, unknown> = {};
  if (input.label !== undefined) patch.label = input.label;
  if (input.sourceUrl !== undefined) patch.source_url = input.sourceUrl;
  if (input.sourceSha256 !== undefined) patch.source_sha256 = input.sourceSha256;
  if (input.effectiveDate !== undefined) patch.effective_date = input.effectiveDate;
  if (input.notes !== undefined) patch.notes = input.notes;
  const rows = check(await ctx.client.from('cee_syllabus_versions').update(patch).eq('id', syllabusId).eq('status', 'DRAFT').select('id')) as { id: string }[];
  if (rows.length === 0) throw new CeeApiError('CURRICULUM_FROZEN');
  await audit(ctx, 'SYLLABUS_UPDATE', 'SYLLABUS_VERSION', syllabusId, input);
}

export const CurriculumImport = z.strictObject({
  csv: z.string().min(1).max(1024 * 1024),
  dryRun: z.boolean().default(true),
  replace: z.boolean().default(false),
});

const PREVIEW_LIMIT = 1000;

/**
 * Bulk entry from a CSV outline. A dry run (the default) only validates and
 * previews; a real import replaces the draft's tree in one database
 * transaction, or changes nothing.
 */
export async function importCurriculum(ctx: StaffContext, syllabusId: string, input: z.infer<typeof CurriculumImport>) {
  const s = await syllabusRow(ctx.client, syllabusId);
  authorize(ctx, 'curriculum:edit', s.program_code, null);
  if (s.status !== 'DRAFT') throw new CeeApiError('CURRICULUM_FROZEN');
  const head = await ctx.client.from('cee_curriculum_nodes').select('id', { count: 'exact', head: true }).eq('syllabus_version_id', syllabusId);
  if (head.error) throw mapDbError(head.error);
  const existingEntries = head.count ?? 0;
  const plan = planSyllabusImport(input.csv);
  const needsReplace = existingEntries > 0 && !input.replace;

  if (input.dryRun) {
    return {
      dryRun: true as const,
      valid: plan.errors.length === 0,
      errors: plan.errors,
      warnings: plan.warnings,
      stats: plan.stats,
      existingEntries,
      needsReplace,
      preview: plan.nodes.slice(0, PREVIEW_LIMIT).map((n: PlannedNode) => ({ row: n.row, level: n.level, type: n.nodeType, code: n.code, title: n.title, sourceRef: n.sourceRef })),
      previewTruncated: plan.nodes.length > PREVIEW_LIMIT,
    };
  }
  if (plan.errors.length) throw new CeeApiError('IMPORT_INVALID', undefined, { errors: plan.errors.slice(0, 50) });
  if (needsReplace) throw new CeeApiError('STATE_CONFLICT', `This draft already has ${existingEntries} entries. Choose to replace them, or use a new draft.`);
  const imported = check(
    await ctx.client.rpc('cee_import_curriculum', {
      p_syllabus: syllabusId,
      p_actor: ctx.user.id,
      p_nodes: toImportPayload(plan.nodes, () => crypto.randomUUID()),
      p_replace: input.replace,
      p_request_id: ctx.requestId,
    })
  ) as number;
  return { dryRun: false as const, imported, replaced: existingEntries, warnings: plan.warnings, stats: plan.stats };
}

/** The tree as an import file, for checking side by side with the document or correcting in a new draft. */
export async function exportCurriculum(ctx: StaffContext, syllabusId: string): Promise<{ filename: string; csv: string }> {
  const s = check(
    await ctx.client.from('cee_syllabus_versions').select('id, program_code, label').eq('id', syllabusId).maybeSingle()
  ) as { id: string; program_code: ProgramCode; label: string } | null;
  if (!s) throw new CeeApiError('NOT_FOUND');
  authorizeView(ctx, s.program_code);
  const nodes = check(
    await ctx.client.from('cee_curriculum_nodes').select('id, parent_id, code, title, sort_key, source_ref').eq('syllabus_version_id', syllabusId)
  ) as { id: string; parent_id: string | null; code: string; title: string; sort_key: number; source_ref: string | null }[];
  const csv = exportSyllabusCsv(nodes.map((n) => ({ id: n.id, parentId: n.parent_id, code: n.code, title: n.title, sortKey: n.sort_key, sourceRef: n.source_ref })));
  return { filename: `${codeOrSyllabus(s.label)}.csv`, csv };
}

const codeOrSyllabus = (label: string) => label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'syllabus';

export const NodeLink = z.strictObject({ legacyChapterId: z.uuid().nullable() });

/** Link a syllabus chapter to an existing course chapter page. Allowed after verification: it isn't syllabus content. */
export async function linkNode(ctx: StaffContext, nodeId: string, input: z.infer<typeof NodeLink>) {
  const nc = await nodeContext(ctx.client, nodeId);
  authorize(ctx, 'curriculum:edit', nc.program, nc.subjectId);
  if (nc.node.node_type !== 'CHAPTER') throw new CeeApiError('INVALID_REQUEST', 'Only chapters link to course chapter pages.');
  check(await ctx.client.from('cee_curriculum_nodes').update({ legacy_chapter_id: input.legacyChapterId }).eq('id', nodeId));
  await audit(ctx, 'NODE_LINK', 'CURRICULUM_NODE', nodeId, input);
}

export const NodeCreate = z.strictObject({
  syllabusId: z.uuid(),
  parentId: z.uuid().nullable().default(null),
  nodeType: z.enum(['SUBJECT', 'CHAPTER', 'TOPIC']),
  code: z.string().regex(/^[a-z0-9][a-z0-9_-]{0,63}$/),
  title: z.string().min(1).max(200),
  sortKey: z.number().int().min(0).max(100000).default(0),
  legacySubjectId: z.uuid().nullable().default(null),
  legacyChapterId: z.uuid().nullable().default(null),
  sourceRef: z.string().trim().min(1).max(200).nullable().default(null),
});

export async function createNode(ctx: StaffContext, input: z.infer<typeof NodeCreate>) {
  const s = check(
    await ctx.client.from('cee_syllabus_versions').select('program_code, status').eq('id', input.syllabusId).maybeSingle()
  ) as { program_code: ProgramCode; status: string } | null;
  if (!s) throw new CeeApiError('NOT_FOUND');
  if (s.status !== 'DRAFT') throw new CeeApiError('CURRICULUM_FROZEN');
  // Subjects are program-wide decisions; anything below is scoped to its subject.
  const subjectId = input.parentId ? (await nodeContext(ctx.client, input.parentId)).subjectId : null;
  authorize(ctx, 'curriculum:edit', s.program_code, subjectId);
  const row = check(
    await ctx.client
      .from('cee_curriculum_nodes')
      .insert({
        syllabus_version_id: input.syllabusId,
        parent_id: input.parentId,
        node_type: input.nodeType,
        code: input.code,
        title: input.title,
        sort_key: input.sortKey,
        legacy_subject_id: input.legacySubjectId,
        legacy_chapter_id: input.legacyChapterId,
        source_ref: input.sourceRef,
        created_by: ctx.user.id,
      })
      .select('id')
      .single()
  ) as { id: string };
  await audit(ctx, 'NODE_CREATE', 'CURRICULUM_NODE', row.id, input);
  return { id: row.id };
}

export async function curriculumForAdmin(ctx: StaffContext, program: ProgramCode) {
  authorizeView(ctx, program);
  const syllabi = check(
    await ctx.client
      .from('cee_syllabus_versions')
      .select('id, label, status, effective_date, source_url, source_sha256, created_by, verified_by, verified_at')
      .eq('program_code', program)
      .order('created_at')
  ) as {
    id: string;
    label: string;
    status: string;
    effective_date: string | null;
    source_url: string | null;
    source_sha256: string | null;
    created_by: string;
    verified_by: string | null;
    verified_at: string | null;
  }[];
  const nodes = syllabi.length
    ? (check(
        await ctx.client
          .from('cee_curriculum_nodes')
          .select('id, syllabus_version_id, parent_id, node_type, code, title, sort_key, legacy_chapter_id, source_ref, created_by')
          .in('syllabus_version_id', syllabi.map((s) => s.id))
          .order('sort_key')
          .order('title')
      ) as {
        id: string;
        syllabus_version_id: string;
        parent_id: string | null;
        node_type: string;
        code: string;
        title: string;
        sort_key: number;
        legacy_chapter_id: string | null;
        source_ref: string | null;
        created_by: string;
      }[])
    : [];
  return {
    syllabi: syllabi.map((s) => ({
      id: s.id,
      label: s.label,
      status: s.status,
      effectiveDate: s.effective_date,
      sourceUrl: s.source_url,
      sourceSha256: s.source_sha256,
      verifiedAt: s.verified_at,
      // Whether the caller entered any of it, so the screen can say who may verify.
      enteredByMe: s.created_by === ctx.user.id || nodes.some((n) => n.syllabus_version_id === s.id && n.created_by === ctx.user.id),
      nodes: nodes
        .filter((n) => n.syllabus_version_id === s.id)
        .map((n) => ({
          id: n.id,
          parentId: n.parent_id,
          type: n.node_type,
          code: n.code,
          title: n.title,
          sortKey: n.sort_key,
          sourceRef: n.source_ref,
          legacyChapterId: n.legacy_chapter_id,
        })),
    })),
  };
}

// ── Lessons and revisions ─────────────────────────────────────────────────

/** Draft content may be incomplete; submission requires full LessonContent. */
export const LessonDraftContent = z.strictObject({
  schemaVersion: z.literal('1.0'),
  summary: z.string().max(2000),
  sections: z
    .array(
      z.strictObject({
        key: z.string().regex(/^[a-z0-9][a-z0-9-]{0,63}$/),
        heading: z.string().max(200),
        body: z.string().max(20000),
        required: z.boolean().default(true),
      })
    )
    .max(30),
  objectiveIds: z.array(z.uuid()).max(30).default([]),
  completion: z
    .strictObject({ requireSequenceKey: z.string().regex(/^[a-z0-9][a-z0-9-]{0,63}$/).optional(), minScorePercent: z.number().min(0).max(100).optional() })
    .default({}),
});

const EMPTY_DRAFT = { schemaVersion: '1.0', summary: '', sections: [], objectiveIds: [], completion: {} };

export const LessonCreate = z.strictObject({
  program: RoleGrant.shape.program,
  title: z.string().min(3).max(200),
  slug: z.string().regex(/^[a-z0-9][a-z0-9-]{1,95}$/, 'lowercase letters, digits and hyphens'),
  nodeId: z.uuid(),
});

export async function createLesson(ctx: StaffContext, input: z.infer<typeof LessonCreate>) {
  const nc = await nodeContext(ctx.client, input.nodeId);
  if (nc.program !== input.program) throw new CeeApiError('CROSS_PROGRAM_MAPPING');
  authorize(ctx, 'lesson:edit', input.program, nc.subjectId);

  const lesson = check(
    await ctx.client
      .from('cee_lessons')
      .insert({ program_code: input.program, slug: input.slug, title: input.title, created_by: ctx.user.id })
      .select('id')
      .single()
  ) as { id: string };
  // Not one transaction over PostgREST: if a later step fails, the lesson exists with
  // whatever was created so far, and the editor can finish it (mapping/revision are idempotent to add).
  check(await ctx.client.from('cee_lesson_mappings').insert({ lesson_id: lesson.id, node_id: input.nodeId, created_by: ctx.user.id }));
  const rev = check(
    await ctx.client
      .from('cee_lesson_revisions')
      .insert({ lesson_id: lesson.id, revision_number: 1, content: EMPTY_DRAFT, created_by: ctx.user.id })
      .select('id')
      .single()
  ) as { id: string };
  await audit(ctx, 'LESSON_CREATE', 'LESSON', lesson.id, { ...input, revisionId: rev.id });
  return { id: lesson.id, revisionId: rev.id };
}

export async function listLessons(ctx: StaffContext, program: ProgramCode) {
  authorizeView(ctx, program);
  const lessons = check(
    await ctx.client.from('cee_lessons').select('id, program_code, slug, title, created_by, created_at').eq('program_code', program).order('created_at', { ascending: false }).limit(500)
  ) as LessonRow[];
  if (lessons.length === 0) return [];
  const ids = lessons.map((l) => l.id);
  const [revs, pubs, maps] = await Promise.all([
    ctx.client.from('cee_lesson_revisions').select('id, lesson_id, revision_number, status, updated_at').in('lesson_id', ids),
    ctx.client.from('cee_publications').select('id, lesson_id, published_at, lesson_revision_id').in('lesson_id', ids).is('superseded_at', null).is('archived_at', null),
    ctx.client.from('cee_lesson_mappings').select('lesson_id, node_id, status, created_at').in('lesson_id', ids).order('created_at'),
  ]);
  const revRows = check(revs) as { id: string; lesson_id: string; revision_number: number; status: string; updated_at: string }[];
  const pubRows = check(pubs) as { id: string; lesson_id: string; published_at: string; lesson_revision_id: string }[];
  const mapRows = check(maps) as { lesson_id: string; node_id: string; status: string }[];
  const nodeIds = [...new Set(mapRows.map((m) => m.node_id))];
  const nodes = nodeIds.length
    ? (check(await ctx.client.from('cee_curriculum_nodes').select('id, title').in('id', nodeIds)) as { id: string; title: string }[])
    : [];
  const nodeTitle = new Map(nodes.map((n) => [n.id, n.title]));

  return lessons.map((l) => {
    const latest = revRows.filter((r) => r.lesson_id === l.id).sort((a, b) => b.revision_number - a.revision_number)[0] ?? null;
    const pub = pubRows.find((p) => p.lesson_id === l.id) ?? null;
    const map = mapRows.find((m) => m.lesson_id === l.id) ?? null;
    return {
      id: l.id,
      slug: l.slug,
      title: l.title,
      topic: map ? { id: map.node_id, title: nodeTitle.get(map.node_id) ?? '', mappingStatus: map.status } : null,
      latestRevision: latest ? { id: latest.id, number: latest.revision_number, status: latest.status, updatedAt: latest.updated_at } : null,
      publication: pub
        ? { id: pub.id, publishedAt: pub.published_at, revisionNumber: revRows.find((r) => r.id === pub.lesson_revision_id)?.revision_number ?? null }
        : null,
      createdAt: l.created_at,
    };
  });
}

export async function lessonDetail(ctx: StaffContext, lessonId: string) {
  const { lesson, subjectId, topic } = await lessonScope(ctx.client, lessonId);
  authorizeView(ctx, lesson.program_code);
  const revisions = check(
    await ctx.client.from('cee_lesson_revisions').select(REVISION_COLS).eq('lesson_id', lessonId).order('revision_number', { ascending: false })
  ) as RevisionRow[];
  const latest = revisions[0] ?? null;

  let questions: unknown[] = [];
  let reviews: unknown[] = [];
  if (latest) {
    type QRow = { sort_key: number; cee_question_revisions: unknown };
    const qrows = check(
      await ctx.client
        .from('cee_lesson_questions')
        .select('sort_key, cee_question_revisions!inner(id, stem, options, answer_key, rationale, difficulty, status, created_by)')
        .eq('lesson_revision_id', latest.id)
        .order('sort_key')
    ) as unknown as QRow[];
    questions = qrows.map((r) => {
      const q = (Array.isArray(r.cee_question_revisions) ? r.cee_question_revisions[0] : r.cee_question_revisions) as Record<string, unknown>;
      return { id: q.id, sortKey: r.sort_key, stem: q.stem, options: q.options, answerKey: q.answer_key, rationale: q.rationale, difficulty: q.difficulty, status: q.status };
    });
    reviews = await gateSummary(ctx.client, latest.id);
  }
  const pubs = check(
    await ctx.client.from('cee_publications').select('id, lesson_revision_id, published_at, superseded_at, archived_at').eq('lesson_id', lessonId).order('published_at', { ascending: false })
  ) as { id: string; lesson_revision_id: string; published_at: string; superseded_at: string | null; archived_at: string | null }[];

  const can = (action: CeeAction, authors: string[] = []) =>
    decideScope(ctx.assignments, { actorId: ctx.user.id, action, program: lesson.program_code, subjectNodeId: subjectId, authorIds: authors }).allowed;

  return {
    lesson: { id: lesson.id, slug: lesson.slug, title: lesson.title, program: lesson.program_code, createdAt: lesson.created_at, topic },
    revisions: revisions.map((r) => ({
      id: r.id,
      number: r.revision_number,
      status: r.status,
      createdBy: r.created_by,
      createdAt: r.created_at,
      submittedAt: r.submitted_at,
      updatedAt: r.updated_at,
    })),
    latest: latest ? { id: latest.id, number: latest.revision_number, status: latest.status, content: latest.content, updatedAt: latest.updated_at, createdBy: latest.created_by } : null,
    questions,
    reviews,
    publications: pubs.map((p) => ({ id: p.id, revisionId: p.lesson_revision_id, publishedAt: p.published_at, active: !p.superseded_at && !p.archived_at })),
    permissions: {
      edit: can('lesson:edit'),
      publish: latest ? can('publish', [latest.created_by]) : false,
    },
  };
}

async function gateSummary(client: SupabaseClient, revisionId: string) {
  const reqs = check(
    await client
      .from('cee_review_requests')
      .select('id, gate, status, requested_at')
      .eq('entity_type', 'LESSON_REVISION')
      .eq('entity_id', revisionId)
      .order('requested_at')
  ) as { id: string; gate: string; status: string; requested_at: string }[];
  const decisions = reqs.length
    ? (check(
        await client
          .from('cee_review_decisions')
          .select('request_id, decision, comments, reviewer_id, decided_at')
          .in('request_id', reqs.map((r) => r.id))
      ) as { request_id: string; decision: string; comments: string | null; reviewer_id: string; decided_at: string }[])
    : [];
  return reqs.map((r) => {
    const d = decisions.find((x) => x.request_id === r.id);
    return {
      requestId: r.id,
      gate: r.gate,
      status: r.status,
      requestedAt: r.requested_at,
      decision: d ? { decision: d.decision, comments: d.comments, reviewerId: d.reviewer_id, decidedAt: d.decided_at } : null,
    };
  });
}

export async function newRevision(ctx: StaffContext, lessonId: string) {
  const { lesson, subjectId } = await lessonScope(ctx.client, lessonId);
  authorize(ctx, 'lesson:edit', lesson.program_code, subjectId);
  const revs = check(
    await ctx.client.from('cee_lesson_revisions').select('id, revision_number, status, content').eq('lesson_id', lessonId).order('revision_number', { ascending: false }).limit(1)
  ) as { id: string; revision_number: number; status: string; content: unknown }[];
  const latest = revs[0];
  if (latest && (latest.status === 'DRAFT' || latest.status === 'IN_REVIEW')) {
    throw new CeeApiError('STATE_CONFLICT', `Revision ${latest.revision_number} is still ${latest.status === 'DRAFT' ? 'a draft' : 'in review'}.`);
  }
  const created = check(
    await ctx.client
      .from('cee_lesson_revisions')
      .insert({ lesson_id: lessonId, revision_number: (latest?.revision_number ?? 0) + 1, content: latest?.content ?? EMPTY_DRAFT, created_by: ctx.user.id })
      .select('id, revision_number')
      .single()
  ) as { id: string; revision_number: number };
  if (latest) {
    // Carry the pins over; questions keep their approved revisions until someone replaces them.
    const [assets, questions] = await Promise.all([
      ctx.client.from('cee_lesson_assets').select('asset_version_id, role, sort_key').eq('lesson_revision_id', latest.id),
      ctx.client.from('cee_lesson_questions').select('question_revision_id, sort_key').eq('lesson_revision_id', latest.id),
    ]);
    const a = check(assets) as { asset_version_id: string; role: string; sort_key: number }[];
    const q = check(questions) as { question_revision_id: string; sort_key: number }[];
    if (a.length) check(await ctx.client.from('cee_lesson_assets').insert(a.map((x) => ({ ...x, lesson_revision_id: created.id }))));
    if (q.length) check(await ctx.client.from('cee_lesson_questions').insert(q.map((x) => ({ ...x, lesson_revision_id: created.id }))));
  }
  await audit(ctx, 'REVISION_CREATE', 'LESSON_REVISION', created.id, { lessonId, from: latest?.id ?? null });
  return { id: created.id, number: created.revision_number };
}

export const DraftUpdate = z.strictObject({ content: LessonDraftContent, baseUpdatedAt: z.string().min(10).max(40) });

export async function updateDraft(ctx: StaffContext, revisionId: string, input: z.infer<typeof DraftUpdate>) {
  const { rev, lesson, subjectId } = await revisionWithScope(ctx.client, revisionId);
  authorize(ctx, 'lesson:edit', lesson.program_code, subjectId);
  if (rev.status !== 'DRAFT') throw new CeeApiError('STATE_CONFLICT', 'Only a draft can be edited. Start a new revision.');
  const keys = input.content.sections.map((s) => s.key);
  if (new Set(keys).size !== keys.length) throw new CeeApiError('INVALID_REQUEST', 'Section keys must be unique.');

  const updated = check(
    await ctx.client
      .from('cee_lesson_revisions')
      .update({ content: input.content })
      .eq('id', revisionId)
      .eq('status', 'DRAFT')
      .eq('updated_at', input.baseUpdatedAt)
      .select('updated_at')
  ) as { updated_at: string }[];
  if (updated.length === 0) throw new CeeApiError('REVISION_CONFLICT');
  return { updatedAt: updated[0].updated_at };
}

export const QuestionCreate = z.strictObject({
  stem: z.string().min(5).max(2000),
  options: z.tuple([z.string().min(1).max(500), z.string().min(1).max(500), z.string().min(1).max(500), z.string().min(1).max(500)]),
  answerKey: z.enum(['A', 'B', 'C', 'D']),
  rationale: z.string().min(5).max(4000),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
});

export async function addQuestion(ctx: StaffContext, revisionId: string, input: z.infer<typeof QuestionCreate>) {
  const { rev, lesson, subjectId, topic } = await revisionWithScope(ctx.client, revisionId);
  authorize(ctx, 'question:edit', lesson.program_code, subjectId);
  if (rev.status !== 'DRAFT') throw new CeeApiError('STATE_CONFLICT', 'Questions can only be added to a draft.');
  const q = check(
    await ctx.client
      .from('cee_question_revisions')
      .insert({
        question_key: crypto.randomUUID(),
        revision_number: 1,
        program_code: lesson.program_code,
        node_id: topic?.id ?? null,
        stem: input.stem,
        options: input.options,
        answer_key: input.answerKey,
        rationale: input.rationale,
        difficulty: input.difficulty ?? null,
        created_by: ctx.user.id,
      })
      .select('id')
      .single()
  ) as { id: string };
  const existing = check(await ctx.client.from('cee_lesson_questions').select('sort_key').eq('lesson_revision_id', revisionId)) as { sort_key: number }[];
  check(
    await ctx.client
      .from('cee_lesson_questions')
      .insert({ lesson_revision_id: revisionId, question_revision_id: q.id, sort_key: Math.max(0, ...existing.map((e) => e.sort_key)) + 1 })
  );
  await audit(ctx, 'QUESTION_CREATE', 'QUESTION_REVISION', q.id, { lessonRevisionId: revisionId });
  return { id: q.id };
}

export async function removeQuestion(ctx: StaffContext, revisionId: string, questionRevisionId: string) {
  const { lesson, subjectId } = await revisionWithScope(ctx.client, revisionId);
  authorize(ctx, 'question:edit', lesson.program_code, subjectId);
  const removed = check(
    await ctx.client.from('cee_lesson_questions').delete().eq('lesson_revision_id', revisionId).eq('question_revision_id', questionRevisionId).select('question_revision_id')
  ) as unknown[];
  if (removed.length === 0) throw new CeeApiError('NOT_FOUND');
  await audit(ctx, 'QUESTION_UNPIN', 'LESSON_REVISION', revisionId, { questionRevisionId });
}

export async function submitRevision(ctx: StaffContext, revisionId: string) {
  const { rev, lesson, subjectId } = await revisionWithScope(ctx.client, revisionId);
  authorize(ctx, 'lesson:edit', lesson.program_code, subjectId);
  if (rev.status !== 'DRAFT') throw new CeeApiError('STATE_CONFLICT', 'Only a draft can be submitted.');
  const full = LessonContent.safeParse(rev.content);
  if (!full.success) {
    throw new CeeApiError('INVALID_REQUEST', 'The lesson isn’t ready to submit.', {
      issues: full.error.issues.slice(0, 10).map((i) => ({ path: i.path.join('.'), message: i.message })),
    });
  }
  if (full.data.completion.minScorePercent !== undefined) {
    const qs = check(await ctx.client.from('cee_lesson_questions').select('question_revision_id').eq('lesson_revision_id', revisionId)) as unknown[];
    if (qs.length === 0) throw new CeeApiError('INVALID_REQUEST', 'A pass mark is set but the lesson has no questions.');
  }
  check(await ctx.client.rpc('cee_submit_revision', { p_revision: revisionId, p_actor: ctx.user.id }));
}

// ── Reviews ───────────────────────────────────────────────────────────────

export async function reviewQueue(ctx: StaffContext, program: ProgramCode, status: 'OPEN' | 'DONE') {
  authorizeView(ctx, program);
  const reqs = check(
    await ctx.client
      .from('cee_review_requests')
      .select('id, entity_id, gate, status, requested_at, requested_by')
      .eq('entity_type', 'LESSON_REVISION')
      .in('status', status === 'OPEN' ? ['OPEN'] : ['DECIDED', 'CANCELLED'])
      .order('requested_at', { ascending: status === 'OPEN' })
      .limit(500)
  ) as { id: string; entity_id: string; gate: ReviewGate; status: string; requested_at: string; requested_by: string }[];
  if (reqs.length === 0) return [];
  const revIds = [...new Set(reqs.map((r) => r.entity_id))];
  const revs = check(
    await ctx.client.from('cee_lesson_revisions').select('id, lesson_id, revision_number, status, created_by').in('id', revIds)
  ) as { id: string; lesson_id: string; revision_number: number; status: string; created_by: string }[];
  const lessonIds = [...new Set(revs.map((r) => r.lesson_id))];
  const scopes = new Map<string, Awaited<ReturnType<typeof lessonScope>>>();
  for (const id of lessonIds) scopes.set(id, await lessonScope(ctx.client, id));
  const decisions =
    status === 'DONE'
      ? (check(await ctx.client.from('cee_review_decisions').select('request_id, decision, comments, decided_at').in('request_id', reqs.map((r) => r.id))) as {
          request_id: string;
          decision: string;
          comments: string | null;
          decided_at: string;
        }[])
      : [];

  return reqs.flatMap((r) => {
    const rev = revs.find((x) => x.id === r.entity_id);
    const scope = rev ? scopes.get(rev.lesson_id) : undefined;
    if (!rev || !scope || scope.lesson.program_code !== program) return [];
    const canDecide = decideScope(ctx.assignments, {
      actorId: ctx.user.id,
      action: reviewAction(r.gate),
      program,
      subjectNodeId: scope.subjectId,
      authorIds: [rev.created_by],
    });
    // Reviewers see the gates they can decide; super admins see everything.
    if (status === 'OPEN' && !canDecide.allowed && !ctx.isSuperAdmin) return [];
    const d = decisions.find((x) => x.request_id === r.id);
    return [
      {
        id: r.id,
        gate: r.gate,
        status: r.status,
        requestedAt: r.requested_at,
        lessonId: rev.lesson_id,
        lessonTitle: scope.lesson.title,
        revisionId: rev.id,
        revisionNumber: rev.revision_number,
        revisionStatus: rev.status,
        topic: scope.topic?.path.join(' › ') ?? null,
        canDecide: canDecide.allowed,
        cannotDecideReason: canDecide.allowed ? null : canDecide.code === 'SOD_VIOLATION' ? 'You wrote this revision.' : 'Not your review area.',
        decision: d ? { decision: d.decision, comments: d.comments, decidedAt: d.decided_at } : null,
      },
    ];
  });
}

export const DecisionInput = z.strictObject({
  decision: z.enum(['APPROVE', 'REQUEST_CHANGES', 'REJECT']),
  comments: z.string().max(4000).optional(),
});

export async function decideReview(ctx: StaffContext, requestId: string, input: z.infer<typeof DecisionInput>) {
  const r = check(
    await ctx.client.from('cee_review_requests').select('id, entity_type, entity_id, gate, status').eq('id', requestId).maybeSingle()
  ) as { id: string; entity_type: string; entity_id: string; gate: ReviewGate; status: string } | null;
  if (!r || r.entity_type !== 'LESSON_REVISION') throw new CeeApiError('NOT_FOUND');
  const { rev, lesson, subjectId } = await revisionWithScope(ctx.client, r.entity_id);
  authorize(ctx, reviewAction(r.gate), lesson.program_code, subjectId, [rev.created_by]);
  if (input.decision !== 'APPROVE' && !input.comments?.trim()) {
    throw new CeeApiError('INVALID_REQUEST', 'Say what needs to change.');
  }
  const status = check(
    await ctx.client.rpc('cee_decide_review', {
      p_request: requestId,
      p_reviewer: ctx.user.id,
      p_decision: input.decision,
      p_comments: input.comments?.trim() || null,
    })
  ) as string;
  return { revisionStatus: status };
}

// ── Publication ───────────────────────────────────────────────────────────

export async function publish(ctx: StaffContext, revisionId: string, idempotencyKey: string) {
  const { rev, lesson, subjectId } = await revisionWithScope(ctx.client, revisionId);
  authorize(ctx, 'publish', lesson.program_code, subjectId, [rev.created_by]);
  const id = check(
    await ctx.client.rpc('cee_publish_revision', {
      p_revision: revisionId,
      p_publisher: ctx.user.id,
      p_idempotency_key: `${ctx.user.id}:${idempotencyKey}`,
    })
  ) as string;
  return { publicationId: id };
}
