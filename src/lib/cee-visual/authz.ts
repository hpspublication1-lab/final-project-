/**
 * Scoped permissions for CEE Visual Intelligence (decision D5).
 *
 * A staff member holds role assignments (cee_role_assignments), each limited
 * to one program and, optionally, one subject. An action is allowed only when
 * an active assignment covers the action's program AND subject. Separation of
 * duties is checked here too: nobody reviews or publishes their own work.
 *
 * This file is pure: it decides from data and does no I/O, so every rule is
 * unit-tested. The server loader lives in authz.server.ts.
 */
import type { ProgramCode } from './schemas';

export const ROLE_KEYS = [
  'ACADEMIC_DIRECTOR',
  'SUBJECT_EXPERT',
  'ANIMATOR',
  'EDITOR',
  'QUESTION_REVIEWER',
  'ACCESSIBILITY_REVIEWER',
  'RIGHTS_REVIEWER',
  'PUBLISHER',
] as const;
export type RoleKey = (typeof ROLE_KEYS)[number];

export const REVIEW_GATES = ['SYLLABUS_MAPPING', 'SCIENTIFIC', 'VISUAL', 'ASSESSMENT', 'ACCESSIBILITY', 'RIGHTS'] as const;
export type ReviewGate = (typeof REVIEW_GATES)[number];

/** Which roles may perform each action. Super admins manage roles; they do not bypass scope for content. */
export const ACTION_ROLES = {
  'syllabus:create': ['ACADEMIC_DIRECTOR'],
  'syllabus:verify': ['ACADEMIC_DIRECTOR'],
  'curriculum:edit': ['ACADEMIC_DIRECTOR', 'EDITOR'],
  'mapping:propose': ['EDITOR'],
  'mapping:approve': ['ACADEMIC_DIRECTOR'],
  'lesson:edit': ['EDITOR'],
  'asset:upload': ['ANIMATOR', 'EDITOR'],
  'question:edit': ['EDITOR'],
  'review:assign': ['ACADEMIC_DIRECTOR'],
  'review:SYLLABUS_MAPPING': ['ACADEMIC_DIRECTOR'],
  'review:SCIENTIFIC': ['SUBJECT_EXPERT'],
  'review:VISUAL': ['SUBJECT_EXPERT', 'ACADEMIC_DIRECTOR'],
  'review:ASSESSMENT': ['QUESTION_REVIEWER'],
  'review:ACCESSIBILITY': ['ACCESSIBILITY_REVIEWER'],
  'review:RIGHTS': ['RIGHTS_REVIEWER'],
  'publish': ['PUBLISHER'],
  'cms:view': [...ROLE_KEYS],
} as const satisfies Record<string, readonly RoleKey[]>;
export type CeeAction = keyof typeof ACTION_ROLES;

/** Actions where the actor must not be an author of the thing acted on. */
const SOD_ACTIONS: ReadonlySet<CeeAction> = new Set<CeeAction>([
  'syllabus:verify',
  'mapping:approve',
  'review:SYLLABUS_MAPPING',
  'review:SCIENTIFIC',
  'review:VISUAL',
  'review:ASSESSMENT',
  'review:ACCESSIBILITY',
  'review:RIGHTS',
  'publish',
]);

export interface RoleAssignment {
  role_key: RoleKey;
  program_code: ProgramCode;
  /** null = the whole program. */
  subject_node_id: string | null;
  revoked_at: string | null;
}

export interface ScopeRequest {
  actorId: string;
  action: CeeAction;
  program: ProgramCode;
  /**
   * The subject the target belongs to. Omit only for program-wide actions;
   * then only whole-program assignments match.
   */
  subjectNodeId?: string | null;
  /** Everyone who authored the target (revision creator, asset uploader…). */
  authorIds?: readonly string[];
}

export type ScopeDecision =
  | { allowed: true; via: RoleAssignment }
  | { allowed: false; code: 'FORBIDDEN' | 'SOD_VIOLATION'; reason: string };

export function reviewAction(gate: ReviewGate): CeeAction {
  return `review:${gate}` as CeeAction;
}

export function decideScope(assignments: readonly RoleAssignment[], req: ScopeRequest): ScopeDecision {
  const roles: readonly RoleKey[] = ACTION_ROLES[req.action];
  const subject = req.subjectNodeId ?? null;

  const match = assignments.find(
    (a) =>
      a.revoked_at === null &&
      roles.includes(a.role_key) &&
      a.program_code === req.program &&
      (a.subject_node_id === null || (subject !== null && a.subject_node_id === subject))
  );

  if (!match) {
    return {
      allowed: false,
      code: 'FORBIDDEN',
      reason: `needs ${roles.join(' or ')} for ${req.program}${subject ? ` subject ${subject}` : ''}`,
    };
  }

  if (SOD_ACTIONS.has(req.action) && (req.authorIds ?? []).includes(req.actorId)) {
    return { allowed: false, code: 'SOD_VIOLATION', reason: 'the author cannot approve or publish their own work' };
  }

  return { allowed: true, via: match };
}
