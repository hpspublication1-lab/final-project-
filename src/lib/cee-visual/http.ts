/**
 * Response envelope, error codes and request ids for /api/v1/cee.
 *
 *   success  { data, meta: { requestId } }
 *   failure  { error: { code, message, details }, meta: { requestId } }
 *
 * Database rule violations raised by the proposed schema's triggers and by
 * cee_publish_revision() are mapped to stable API codes here, so a client
 * never sees raw SQL text. See docs/cee-visual/API_SPECIFICATION.md §2.
 */
import type { ZodError } from 'zod';

export const ERROR_STATUS = {
  INVALID_REQUEST: 400,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  SOD_VIOLATION: 403,
  NOT_FOUND: 404,
  REVISION_CONFLICT: 409,
  STATE_CONFLICT: 409,
  IDEMPOTENCY_CONFLICT: 409,
  PAYLOAD_TOO_LARGE: 413,
  UNSUPPORTED_TYPE: 415,
  CURRICULUM_INVALID: 422,
  CROSS_PROGRAM_MAPPING: 422,
  ACADEMIC_APPROVAL_REQUIRED: 422,
  MAPPING_NOT_VERIFIED: 422,
  ASSET_NOT_READY: 422,
  FALLBACK_REQUIRED: 422,
  QUESTION_NOT_APPROVED: 422,
  ASSET_INVALID: 422,
  FEATURE_DISABLED: 423,
  RATE_LIMITED: 429,
  INTERNAL: 500,
  SCANNER_UNAVAILABLE: 503,
} as const;
export type CeeErrorCode = keyof typeof ERROR_STATUS;

const DEFAULT_MESSAGE: Record<CeeErrorCode, string> = {
  INVALID_REQUEST: 'The request is not valid.',
  UNAUTHENTICATED: 'Sign in to continue.',
  FORBIDDEN: 'You do not have access to this.',
  SOD_VIOLATION: 'You cannot review or publish your own work.',
  NOT_FOUND: 'Not found.',
  REVISION_CONFLICT: 'Someone else changed this. Reload and try again.',
  STATE_CONFLICT: 'This can’t be changed in its current state.',
  IDEMPOTENCY_CONFLICT: 'This idempotency key was already used for a different request.',
  PAYLOAD_TOO_LARGE: 'The upload is too large.',
  UNSUPPORTED_TYPE: 'This file type is not allowed.',
  CURRICULUM_INVALID: 'That curriculum change would break the syllabus structure.',
  CROSS_PROGRAM_MAPPING: 'A lesson can only be mapped into its own program.',
  ACADEMIC_APPROVAL_REQUIRED: 'Every review must be approved before publishing.',
  MAPPING_NOT_VERIFIED: 'The lesson must be mapped to a verified syllabus before publishing.',
  ASSET_NOT_READY: 'A visual is not validated, scanned and promoted yet.',
  FALLBACK_REQUIRED: 'A 3D lesson needs an approved 2D fallback.',
  QUESTION_NOT_APPROVED: 'Every question in the lesson must be approved.',
  ASSET_INVALID: 'The file failed validation.',
  FEATURE_DISABLED: 'Visual lessons are not switched on yet.',
  RATE_LIMITED: 'Too many requests. Wait a moment and try again.',
  INTERNAL: 'Something went wrong on our side.',
  SCANNER_UNAVAILABLE: 'The malware scanner is not available, so the file stays unscanned.',
};

export class CeeApiError extends Error {
  readonly code: CeeErrorCode;
  readonly status: number;
  readonly details: Record<string, unknown>;

  constructor(code: CeeErrorCode, message?: string, details: Record<string, unknown> = {}) {
    super(message ?? DEFAULT_MESSAGE[code]);
    this.name = 'CeeApiError';
    this.code = code;
    this.status = ERROR_STATUS[code];
    this.details = details;
  }
}

export function newRequestId(): string {
  return `req_${crypto.randomUUID().replace(/-/g, '').slice(0, 24)}`;
}

const NO_STORE = { 'Cache-Control': 'no-store' };

export function ok<T>(data: T, requestId: string, status = 200): Response {
  return Response.json({ data, meta: { requestId } }, { status, headers: { ...NO_STORE, 'X-Request-Id': requestId } });
}

export function fail(err: CeeApiError, requestId: string): Response {
  return Response.json(
    { error: { code: err.code, message: err.message, details: err.details }, meta: { requestId } },
    { status: err.status, headers: { ...NO_STORE, 'X-Request-Id': requestId } }
  );
}

export function fromZod(err: ZodError): CeeApiError {
  return new CeeApiError('INVALID_REQUEST', undefined, {
    issues: err.issues.slice(0, 20).map((i) => ({ path: i.path.join('.'), message: i.message })),
  });
}

/** Prefixes our own database functions raise, mapped to API codes. */
const DB_REASON: Array<[RegExp, CeeErrorCode]> = [
  [/^CURRICULUM_(SCOPE|SHAPE|CYCLE|DEPTH)\b/, 'CURRICULUM_INVALID'],
  [/^CROSS_PROGRAM_MAPPING\b/, 'CROSS_PROGRAM_MAPPING'],
  [/^SOD_VIOLATION\b/, 'SOD_VIOLATION'],
  [/^FORBIDDEN\b/, 'FORBIDDEN'],
  [/^NOT_FOUND\b/, 'NOT_FOUND'],
  [/^(ACADEMIC|ASSET)_APPROVAL_REQUIRED\b/, 'ACADEMIC_APPROVAL_REQUIRED'],
  [/^MAPPING_NOT_VERIFIED\b/, 'MAPPING_NOT_VERIFIED'],
  [/^ASSET_NOT_READY\b/, 'ASSET_NOT_READY'],
  [/^FALLBACK_REQUIRED\b/, 'FALLBACK_REQUIRED'],
  [/^QUESTION_NOT_APPROVED\b/, 'QUESTION_NOT_APPROVED'],
  [/^(IMMUTABLE_\w+|ILLEGAL_TRANSITION|PUBLISH_VIA_FUNCTION|APPEND_ONLY|REVIEW_CLOSED|STATE_CONFLICT)\b/, 'STATE_CONFLICT'],
];

export interface DbErrorLike {
  message?: string;
  code?: string;
  details?: string | null;
  hint?: string | null;
}

/** Postgres / PostgREST codes meaning "the cee_* tables aren't there yet". */
export function isMissingRelation(err: DbErrorLike | null | undefined): boolean {
  if (!err) return false;
  return err.code === '42P01' || err.code === 'PGRST205' || err.code === '42883' || err.code === 'PGRST202';
}

export function mapDbError(err: DbErrorLike): CeeApiError {
  const message = (err.message ?? '').trim();
  for (const [pattern, code] of DB_REASON) {
    if (pattern.test(message)) {
      // These messages are written by our own schema and contain only codes and ids.
      return new CeeApiError(code, undefined, { reason: message.slice(0, 300) });
    }
  }
  if (err.code === '23505') return new CeeApiError('STATE_CONFLICT', 'That already exists.');
  if (isMissingRelation(err)) return new CeeApiError('NOT_FOUND');
  return new CeeApiError('INTERNAL');
}

/**
 * Wraps a route handler: assigns a request id, converts thrown errors into the
 * envelope, and logs unexpected failures with the id (never the request body).
 */
export async function handle(route: string, fn: (requestId: string) => Promise<Response>): Promise<Response> {
  const requestId = newRequestId();
  try {
    return await fn(requestId);
  } catch (e) {
    if (e instanceof CeeApiError) return fail(e, requestId);
    console.error(`[cee-visual] ${route} ${requestId} unexpected error:`, e instanceof Error ? e.message : e);
    return fail(new CeeApiError('INTERNAL'), requestId);
  }
}

/** Reads a JSON body with a hard size cap, before any parsing. */
export async function readJson(req: Request, maxBytes: number): Promise<unknown> {
  const declared = Number(req.headers.get('content-length') ?? '0');
  if (declared > maxBytes) throw new CeeApiError('PAYLOAD_TOO_LARGE', 'The request body is too large.');
  const text = await req.text();
  if (new TextEncoder().encode(text).length > maxBytes) throw new CeeApiError('PAYLOAD_TOO_LARGE', 'The request body is too large.');
  try {
    return JSON.parse(text);
  } catch {
    throw new CeeApiError('INVALID_REQUEST', 'The body must be JSON.');
  }
}
