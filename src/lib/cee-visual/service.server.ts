import 'server-only';

/**
 * Server data layer for student-facing CEE visual lessons.
 *
 * The cee_* tables have RLS on and no client privileges, so every read and
 * write goes through here with the service-role client, after the route has
 * checked the feature flag, the session and course access. Only published
 * content is ever read for students.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';
import { getSessionUser } from '@/lib/supabase/route-auth';
import { isSuperAdmin } from '@/lib/config/superAdmin';
import { EnrollmentService } from '@/lib/services/enrollmentService';
import { checkRateLimitAsync } from '@/lib/security/rateLimiter';
import { computeCompletion, type CompletionResult } from './completion';
import { gradeAttempt, toStudentQuestion, type PinnedQuestion, type StudentQuestion } from './grading';
import { CeeApiError, isMissingRelation, mapDbError, type DbErrorLike } from './http';
import {
  LessonContent,
  ProgramCode,
  VisualAssetManifest,
  type AttemptRequest,
  type PlayerEvent,
  type ResolvedVisual,
} from './schemas';

export const PUBLISHED_BUCKET = 'cee-published';
export const SIGNED_URL_SECONDS = 600;

// ── Infrastructure ────────────────────────────────────────────────────────

export function db(): SupabaseClient {
  const client = createAdminClient();
  if (!client) throw new CeeApiError('INTERNAL', 'The database is not configured.');
  return client;
}

function check<T>(res: { data: T; error: DbErrorLike | null }): T {
  if (res.error) throw mapDbError(res.error);
  return res.data;
}

/**
 * PostgREST returns a many-to-one embed as an object, but the untyped client
 * declares it as an array. Accept either rather than trust one assumption.
 */
type Embed<T> = T | T[] | null;
function one<T>(v: Embed<T>): T {
  const x = Array.isArray(v) ? v[0] : v;
  if (!x) throw new CeeApiError('INTERNAL', 'A linked record is missing.');
  return x;
}

let flagCache: { value: boolean; at: number } | null = null;

/** Off unless cee_settings says otherwise. Missing tables mean off. */
export async function isFeatureEnabled(client: SupabaseClient): Promise<boolean> {
  if (process.env.CEE_VISUAL_FORCE_OFF === '1') return false;
  if (flagCache && Date.now() - flagCache.at < 30_000) return flagCache.value;
  const { data, error } = await client.from('cee_settings').select('value').eq('key', 'cee_visual_enabled').maybeSingle();
  if (error && !isMissingRelation(error)) console.warn('[cee-visual] flag read failed:', error.message);
  const value = !error && (data as { value?: unknown } | null)?.value === true;
  flagCache = { value, at: Date.now() };
  return value;
}

/** For tests. */
export function resetFlagCache(): void {
  flagCache = null;
}

export async function requireFeature(client: SupabaseClient): Promise<void> {
  // Hidden, not "disabled": students shouldn't learn the feature exists before launch.
  if (!(await isFeatureEnabled(client))) throw new CeeApiError('NOT_FOUND');
}

export interface SessionUser {
  id: string;
  email: string | null;
}

export async function requireUser(req?: Request): Promise<SessionUser> {
  const user = await getSessionUser(req);
  if (!user?.id) throw new CeeApiError('UNAUTHENTICATED');
  return { id: user.id, email: user.email ?? null };
}

export async function hasProgramAccess(user: SessionUser, program: ProgramCode): Promise<boolean> {
  if (isSuperAdmin(user.email)) return true;
  const access = await EnrollmentService.getStudentAccess(user.id);
  return Boolean(access.courses[program]?.canAccessFullCourse);
}

export async function requireProgramAccess(user: SessionUser, program: ProgramCode): Promise<void> {
  if (!(await hasProgramAccess(user, program))) {
    throw new CeeApiError('FORBIDDEN', 'Enrol in this course to open its visual lessons.');
  }
}

export async function rateLimit(userId: string, bucket: string, limit: number, windowMs = 60_000): Promise<void> {
  const r = await checkRateLimitAsync(`cee:${bucket}:${userId}`, limit, windowMs);
  if (!r.allowed) throw new CeeApiError('RATE_LIMITED', undefined, { retryAfterSeconds: r.resetSeconds });
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function requireUuid(value: string): string {
  if (!UUID_RE.test(value)) throw new CeeApiError('NOT_FOUND');
  return value.toLowerCase();
}

// ── Curriculum ────────────────────────────────────────────────────────────

export interface SyllabusSummary {
  id: string;
  label: string;
  effectiveDate: string | null;
}

export async function listVerifiedSyllabi(client: SupabaseClient, program: ProgramCode): Promise<SyllabusSummary[]> {
  const rows = check(
    await client
      .from('cee_syllabus_versions')
      .select('id, label, effective_date')
      .eq('program_code', program)
      .eq('status', 'VERIFIED')
      .order('effective_date', { ascending: false, nullsFirst: false })
  ) as { id: string; label: string; effective_date: string | null }[];
  return rows.map((r) => ({ id: r.id, label: r.label, effectiveDate: r.effective_date }));
}

export interface TreeNode {
  id: string;
  type: 'SUBJECT' | 'CHAPTER' | 'TOPIC';
  code: string;
  title: string;
  publishedLessons: number;
  children: TreeNode[];
}

/** Lesson ids with an active publication, among those given. */
async function activelyPublished(client: SupabaseClient, lessonIds: string[]): Promise<Set<string>> {
  if (lessonIds.length === 0) return new Set();
  const rows = check(
    await client.from('cee_publications').select('lesson_id').in('lesson_id', lessonIds).is('superseded_at', null).is('archived_at', null)
  ) as { lesson_id: string }[];
  return new Set(rows.map((r) => r.lesson_id));
}

export async function syllabusTree(client: SupabaseClient, syllabusId: string): Promise<{ syllabus: SyllabusSummary & { program: ProgramCode }; tree: TreeNode[] }> {
  const s = check(
    await client.from('cee_syllabus_versions').select('id, label, effective_date, program_code, status').eq('id', syllabusId).maybeSingle()
  ) as { id: string; label: string; effective_date: string | null; program_code: ProgramCode; status: string } | null;
  if (!s || s.status !== 'VERIFIED') throw new CeeApiError('NOT_FOUND');

  const nodes = check(
    await client
      .from('cee_curriculum_nodes')
      .select('id, parent_id, node_type, code, title, sort_key')
      .eq('syllabus_version_id', syllabusId)
      .order('sort_key')
      .order('title')
  ) as { id: string; parent_id: string | null; node_type: TreeNode['type']; code: string; title: string }[];

  const ids = nodes.map((n) => n.id);
  const mappings = ids.length
    ? (check(await client.from('cee_lesson_mappings').select('node_id, lesson_id').in('node_id', ids).eq('status', 'APPROVED')) as {
        node_id: string;
        lesson_id: string;
      }[])
    : [];
  const live = await activelyPublished(client, [...new Set(mappings.map((m) => m.lesson_id))]);
  const direct = new Map<string, number>();
  for (const m of mappings) if (live.has(m.lesson_id)) direct.set(m.node_id, (direct.get(m.node_id) ?? 0) + 1);

  const byId = new Map<string, TreeNode>(
    nodes.map((n) => [n.id, { id: n.id, type: n.node_type, code: n.code, title: n.title, publishedLessons: direct.get(n.id) ?? 0, children: [] }])
  );
  const roots: TreeNode[] = [];
  for (const n of nodes) {
    const node = byId.get(n.id)!;
    const parent = n.parent_id ? byId.get(n.parent_id) : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }
  // Roll counts up so a chapter shows the lessons under its topics.
  const total = (n: TreeNode): number => (n.publishedLessons += n.children.reduce((sum, c) => sum + total(c), 0));
  roots.forEach(total);

  return { syllabus: { id: s.id, label: s.label, effectiveDate: s.effective_date, program: s.program_code }, tree: roots };
}

export interface LessonListItem {
  id: string;
  slug: string;
  title: string;
  publishedAt: string;
}

export async function topicLessons(client: SupabaseClient, topicId: string): Promise<{ topic: { id: string; title: string; program: ProgramCode }; lessons: LessonListItem[] }> {
  const node = check(
    await client.from('cee_curriculum_nodes').select('id, title, node_type, cee_syllabus_versions!inner(program_code, status)').eq('id', topicId).maybeSingle()
  ) as unknown as { id: string; title: string; node_type: string; cee_syllabus_versions: Embed<{ program_code: ProgramCode; status: string }> } | null;
  const syllabus = node ? one(node.cee_syllabus_versions) : null;
  if (!node || !syllabus || syllabus.status !== 'VERIFIED') throw new CeeApiError('NOT_FOUND');

  const maps = check(await client.from('cee_lesson_mappings').select('lesson_id').eq('node_id', topicId).eq('status', 'APPROVED')) as { lesson_id: string }[];
  const lessonIds = [...new Set(maps.map((m) => m.lesson_id))];
  const pubs = lessonIds.length
    ? (check(
        await client
          .from('cee_publications')
          .select('lesson_id, published_at, cee_lessons!inner(id, slug, title)')
          .in('lesson_id', lessonIds)
          .is('superseded_at', null)
          .is('archived_at', null)
      ) as unknown as { lesson_id: string; published_at: string; cee_lessons: Embed<{ id: string; slug: string; title: string }> }[])
    : [];

  return {
    topic: { id: node.id, title: node.title, program: syllabus.program_code },
    lessons: pubs
      .map((p) => {
        const l = one(p.cee_lessons);
        return { id: l.id, slug: l.slug, title: l.title, publishedAt: p.published_at };
      })
      .sort((a, b) => a.title.localeCompare(b.title)),
  };
}

// ── Published lessons ─────────────────────────────────────────────────────

interface PinnedAsset {
  assetVersionId: string;
  role: 'PRIMARY' | 'FALLBACK' | 'SUPPORTING';
  kind: string;
  publishedKey: string;
  manifest: unknown;
}

export interface PublishedLesson {
  publicationId: string;
  lessonId: string;
  revisionId: string;
  program: ProgramCode;
  slug: string;
  title: string;
  publishedAt: string;
  content: LessonContent;
  primary: (PinnedAsset & { manifest: VisualAssetManifest }) | null;
  fallback: PinnedAsset | null;
  assetVersionIds: Set<string>;
  questions: PinnedQuestion[];
}

export async function loadPublishedLesson(client: SupabaseClient, lessonId: string): Promise<PublishedLesson> {
  const pub = check(
    await client
      .from('cee_publications')
      .select('id, lesson_id, lesson_revision_id, published_at')
      .eq('lesson_id', lessonId)
      .is('superseded_at', null)
      .is('archived_at', null)
      .maybeSingle()
  ) as { id: string; lesson_id: string; lesson_revision_id: string; published_at: string } | null;
  if (!pub) throw new CeeApiError('NOT_FOUND');

  const [lessonRes, revRes, assetsRes, questionsRes] = await Promise.all([
    client.from('cee_lessons').select('id, program_code, slug, title').eq('id', lessonId).single(),
    client.from('cee_lesson_revisions').select('id, status, content').eq('id', pub.lesson_revision_id).single(),
    client
      .from('cee_lesson_assets')
      .select('role, sort_key, cee_asset_versions!inner(id, status, scan_status, published_key, manifest, cee_visual_assets!inner(kind))')
      .eq('lesson_revision_id', pub.lesson_revision_id)
      .order('sort_key'),
    client
      .from('cee_lesson_questions')
      .select('sort_key, cee_question_revisions!inner(id, stem, options, answer_key, rationale, objective_id, status)')
      .eq('lesson_revision_id', pub.lesson_revision_id)
      .order('sort_key'),
  ]);
  const lesson = check(lessonRes) as { id: string; program_code: ProgramCode; slug: string; title: string };
  const rev = check(revRes) as { id: string; status: string; content: unknown };
  if (rev.status !== 'PUBLISHED') throw new CeeApiError('NOT_FOUND');

  const content = LessonContent.safeParse(rev.content);
  if (!content.success) {
    console.error(`[cee-visual] published revision ${rev.id} has invalid content`, content.error.issues.slice(0, 3));
    throw new CeeApiError('INTERNAL', 'This lesson can’t be shown right now.');
  }

  type AssetRow = {
    role: PinnedAsset['role'];
    cee_asset_versions: Embed<{ id: string; status: string; scan_status: string; published_key: string | null; manifest: unknown; cee_visual_assets: Embed<{ kind: string }> }>;
  };
  const assets: PinnedAsset[] = [];
  for (const a of check(assetsRes) as unknown as AssetRow[]) {
    const v = one(a.cee_asset_versions);
    // cee_publish_revision() already guarantees this; check again rather than serve an unready file.
    if (v.status !== 'VALIDATED' || v.scan_status !== 'CLEAN' || !v.published_key) {
      console.error(`[cee-visual] pinned asset version ${v.id} is not servable; skipping`);
      continue;
    }
    assets.push({ assetVersionId: v.id, role: a.role, kind: one(v.cee_visual_assets).kind, publishedKey: v.published_key, manifest: v.manifest });
  }

  let primary: PublishedLesson['primary'] = null;
  const primaryRow = assets.find((a) => a.role === 'PRIMARY');
  if (primaryRow) {
    const m = VisualAssetManifest.safeParse(primaryRow.manifest);
    if (m.success) primary = { ...primaryRow, manifest: m.data };
    else console.error(`[cee-visual] asset version ${primaryRow.assetVersionId} has an invalid manifest`);
  }
  const wantedFallback = primary?.manifest.fallback?.assetVersionId;
  const fallback = assets.find((a) => a.role === 'FALLBACK' && (!wantedFallback || a.assetVersionId === wantedFallback)) ?? null;

  type QuestionRow = {
    sort_key: number;
    cee_question_revisions: Embed<{ id: string; stem: string; options: unknown; answer_key: string; rationale: string; objective_id: string | null; status: string }>;
  };
  const questions: PinnedQuestion[] = (check(questionsRes) as unknown as QuestionRow[])
    .map((row) => ({ sortKey: row.sort_key, q: one(row.cee_question_revisions) }))
    .filter(({ q }) => q.status === 'APPROVED' && Array.isArray(q.options) && q.options.length === 4)
    .map(({ sortKey, q }) => ({
      id: q.id,
      stem: q.stem,
      options: (q.options as unknown[]).map(String),
      answerKey: q.answer_key.trim() as PinnedQuestion['answerKey'],
      rationale: q.rationale,
      objectiveId: q.objective_id,
      sortKey,
    }));

  return {
    publicationId: pub.id,
    lessonId: lesson.id,
    revisionId: rev.id,
    program: lesson.program_code,
    slug: lesson.slug,
    title: lesson.title,
    publishedAt: pub.published_at,
    content: content.data,
    primary,
    fallback,
    assetVersionIds: new Set(assets.map((a) => a.assetVersionId)),
    questions,
  };
}

/** Manifest plus fresh short-lived signed URLs. Key fields and unsigned bucket access never reach the browser. */
export async function resolveVisual(client: SupabaseClient, lesson: PublishedLesson): Promise<ResolvedVisual | null> {
  if (!lesson.primary) return null;
  const keys = [lesson.primary.publishedKey, ...(lesson.fallback ? [lesson.fallback.publishedKey] : [])];
  const { data, error } = await client.storage.from(PUBLISHED_BUCKET).createSignedUrls(keys, SIGNED_URL_SECONDS);
  if (error || !data) {
    console.error('[cee-visual] signing failed:', error?.message);
    throw new CeeApiError('INTERNAL', 'The visual can’t be loaded right now.');
  }
  const url = (key: string) => data.find((d) => d.path === key)?.signedUrl ?? undefined;
  const { manifest } = lesson.primary;
  const visual: ResolvedVisual = { assetVersionId: lesson.primary.assetVersionId, manifest };
  if (manifest.kind === 'MODEL_3D') {
    visual.modelUrl = url(lesson.primary.publishedKey);
    if (lesson.fallback) visual.fallbackUrl = url(lesson.fallback.publishedKey);
  } else {
    visual.diagramUrl = url(lesson.primary.publishedKey);
  }
  return visual;
}

export interface StudentLessonView {
  id: string;
  slug: string;
  title: string;
  program: ProgramCode;
  publicationId: string;
  publishedAt: string;
  content: LessonContent;
  questions: StudentQuestion[];
}

export function toStudentView(l: PublishedLesson): StudentLessonView {
  return {
    id: l.lessonId,
    slug: l.slug,
    title: l.title,
    program: l.program,
    publicationId: l.publicationId,
    publishedAt: l.publishedAt,
    content: l.content,
    questions: [...l.questions].sort((a, b) => a.sortKey - b.sortKey).map(toStudentQuestion),
  };
}

// ── Progress, events, attempts ────────────────────────────────────────────

export interface ProgressView extends CompletionResult {
  bestScorePercent: number | null;
}

interface StoredAnswer {
  questionRevisionId: string;
  choice: string | null;
  correct: boolean;
}

export async function recomputeProgress(client: SupabaseClient, studentId: string, lesson: PublishedLesson, persist = true): Promise<ProgressView> {
  const [eventsRes, attemptRes, existingRes] = await Promise.all([
    client.from('cee_player_events').select('type, payload').eq('student_id', studentId).eq('publication_id', lesson.publicationId).limit(5000),
    client
      .from('cee_attempts')
      .select('score, max_score, answers')
      .eq('student_id', studentId)
      .eq('publication_id', lesson.publicationId)
      .order('score', { ascending: false })
      .order('submitted_at', { ascending: true })
      .limit(1),
    client.from('cee_student_progress').select('state, objectives_met').eq('student_id', studentId).eq('publication_id', lesson.publicationId).maybeSingle(),
  ]);
  const events = check(eventsRes) as { type: string; payload: Record<string, unknown> }[];
  const best = (check(attemptRes) as { score: number; max_score: number; answers: StoredAnswer[] }[])[0] ?? null;
  const existing = check(existingRes) as { state: string; objectives_met: string[] } | null;

  const bestAttempt = best
    ? {
        percent: Number(best.max_score) > 0 ? Math.round((Number(best.score) / Number(best.max_score)) * 10000) / 100 : 0,
        correctById: Object.fromEntries((best.answers ?? []).map((a) => [a.questionRevisionId, a.correct === true])),
      }
    : null;

  const result = computeCompletion({
    content: lesson.content,
    primaryManifest: lesson.primary?.manifest ?? null,
    events,
    questions: lesson.questions.map((q) => ({ id: q.id, objectiveId: q.objectiveId })),
    bestAttempt,
  });

  // Completion never goes backwards, even if a lesson's rules were misread later.
  const wasComplete = existing?.state === 'COMPLETED';
  const state = wasComplete ? 'COMPLETED' : result.state;
  const objectivesMet = [...new Set([...(existing?.objectives_met ?? []), ...result.objectivesMet])];
  const view: ProgressView = { state, objectivesMet, missing: state === 'COMPLETED' ? [] : result.missing, bestScorePercent: bestAttempt?.percent ?? null };

  if (persist) {
    check(
      await client.from('cee_student_progress').upsert(
        {
          student_id: studentId,
          lesson_id: lesson.lessonId,
          publication_id: lesson.publicationId,
          state,
          objectives_met: objectivesMet,
          best_score: bestAttempt?.percent ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'student_id,publication_id' }
      )
    );
  }
  return view;
}

const MAX_FUTURE_MS = 5 * 60_000;
const MAX_AGE_MS = 7 * 24 * 3600_000;

/** Why an event can't be accepted for this lesson, or null if it can. */
export function eventProblem(e: PlayerEvent, lesson: PublishedLesson, now = Date.now()): string | null {
  const t = Date.parse(e.occurredAt);
  if (t > now + MAX_FUTURE_MS) return 'occurredAt is in the future';
  if (t < now - MAX_AGE_MS) return 'occurredAt is too old';
  if (e.assetVersionId && !lesson.assetVersionIds.has(e.assetVersionId)) return 'asset is not part of this lesson';
  const manifest = lesson.primary?.manifest;
  switch (e.type) {
    case 'SECTION_READ':
      return lesson.content.sections.some((s) => s.key === e.payload.sectionKey) ? null : 'unknown section';
    case 'STRUCTURE_SELECTED':
      return manifest?.hotspots.some((h) => h.id === e.payload.hotspotId) ? null : 'unknown part';
    case 'SEQUENCE_STEP': {
      const seq = manifest?.sequences.find((s) => s.key === e.payload.sequenceKey);
      return seq && e.payload.stepIndex < seq.steps.length ? null : 'unknown sequence step';
    }
    case 'SEQUENCE_COMPLETED':
      return manifest?.sequences.some((s) => s.key === e.payload.sequenceKey) ? null : 'unknown sequence';
    default:
      return null;
  }
}

export interface EventResult {
  accepted: string[];
  duplicates: string[];
  rejected: { eventId: string; reason: string }[];
  progress: ProgressView;
}

export async function recordEvents(client: SupabaseClient, studentId: string, lesson: PublishedLesson, events: PlayerEvent[]): Promise<EventResult> {
  const rejected: EventResult['rejected'] = [];
  const valid = events.filter((e) => {
    const problem = eventProblem(e, lesson);
    if (problem) rejected.push({ eventId: e.eventId, reason: problem });
    return !problem;
  });

  let inserted: string[] = [];
  if (valid.length > 0) {
    const rows = valid.map((e) => ({
      event_id: e.eventId,
      student_id: studentId,
      publication_id: lesson.publicationId,
      asset_version_id: e.assetVersionId ?? null,
      type: e.type,
      payload: e.payload,
      occurred_at: e.occurredAt,
    }));
    const data = check(await client.from('cee_player_events').upsert(rows, { onConflict: 'event_id', ignoreDuplicates: true }).select('event_id')) as {
      event_id: string;
    }[];
    inserted = (data ?? []).map((r) => r.event_id);
  }
  const insertedSet = new Set(inserted);
  const duplicates = valid.map((e) => e.eventId).filter((id) => !insertedSet.has(id));
  const progress = await recomputeProgress(client, studentId, lesson);
  return { accepted: inserted, duplicates, rejected, progress };
}

export interface AttemptResult {
  attemptId: string;
  replay: boolean;
  score: number;
  maxScore: number;
  percent: number;
  questions: { id: string; choice: string | null; correct: boolean; answerKey: string; rationale: string }[];
  progress: ProgressView;
}

const sameAnswers = (a: StoredAnswer[], b: AttemptRequest['answers']) => {
  const norm = (xs: { questionRevisionId: string; choice: string | null }[]) =>
    JSON.stringify(xs.map((x) => [x.questionRevisionId, x.choice ?? null]).sort());
  return norm(a.filter((x) => x.choice !== null)) === norm(b.filter((x) => x.choice !== null));
};

export async function submitAttempt(
  client: SupabaseClient,
  studentId: string,
  lesson: PublishedLesson,
  body: AttemptRequest,
  idempotencyKey: string
): Promise<AttemptResult> {
  // Keys are namespaced per student so one student's key can never collide with another's.
  const storedKey = `${studentId}:${idempotencyKey}`;
  const graded = gradeAttempt(lesson.questions, body.answers);

  const replayOf = async (): Promise<AttemptResult | null> => {
    const prior = check(
      await client.from('cee_attempts').select('id, student_id, publication_id, answers').eq('idempotency_key', storedKey).maybeSingle()
    ) as { id: string; student_id: string; publication_id: string; answers: StoredAnswer[] } | null;
    if (!prior) return null;
    if (prior.student_id !== studentId || prior.publication_id !== lesson.publicationId || !sameAnswers(prior.answers, body.answers)) {
      throw new CeeApiError('IDEMPOTENCY_CONFLICT');
    }
    const progress = await recomputeProgress(client, studentId, lesson);
    return { attemptId: prior.id, replay: true, ...summarise(graded), progress };
  };

  const existing = await replayOf();
  if (existing) return existing;

  const res = await client
    .from('cee_attempts')
    .insert({
      student_id: studentId,
      publication_id: lesson.publicationId,
      answers: graded.questions.map((q) => ({ questionRevisionId: q.id, choice: q.choice, correct: q.correct })),
      score: graded.score,
      max_score: graded.maxScore,
      idempotency_key: storedKey,
    })
    .select('id')
    .single();
  if (res.error?.code === '23505') {
    const raced = await replayOf(); // the same submission arrived twice at once
    if (raced) return raced;
  }
  const row = check(res) as { id: string };
  const progress = await recomputeProgress(client, studentId, lesson);
  return { attemptId: row.id, replay: false, ...summarise(graded), progress };
}

function summarise(g: ReturnType<typeof gradeAttempt>) {
  return {
    score: g.score,
    maxScore: g.maxScore,
    percent: g.percent,
    questions: g.questions.map((q) => ({ id: q.id, choice: q.choice, correct: q.correct, answerKey: q.answerKey, rationale: q.rationale })),
  };
}

export async function myProgressList(client: SupabaseClient, studentId: string) {
  const rows = check(
    await client
      .from('cee_student_progress')
      .select('lesson_id, publication_id, state, objectives_met, best_score, updated_at, cee_lessons!inner(slug, title)')
      .eq('student_id', studentId)
      .order('updated_at', { ascending: false })
      .limit(500)
  ) as unknown as {
    lesson_id: string;
    publication_id: string;
    state: string;
    objectives_met: string[];
    best_score: number | null;
    updated_at: string;
    cee_lessons: Embed<{ slug: string; title: string }>;
  }[];
  return rows.map((r) => ({
    lessonId: r.lesson_id,
    publicationId: r.publication_id,
    slug: one(r.cee_lessons).slug,
    title: one(r.cee_lessons).title,
    state: r.state,
    objectivesMet: r.objectives_met,
    bestScorePercent: r.best_score === null ? null : Number(r.best_score),
    updatedAt: r.updated_at,
  }));
}

/** Common start of every per-lesson student route: flag, session, lesson, course access. */
export async function studentLesson(req: Request, rawLessonId: string) {
  const client = db();
  await requireFeature(client);
  const user = await requireUser(req);
  const lesson = await loadPublishedLesson(client, requireUuid(rawLessonId));
  await requireProgramAccess(user, lesson.program);
  return { client, user, lesson };
}
