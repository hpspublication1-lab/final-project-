import { describe, expect, it } from 'vitest';
import { ACTION_ROLES, REVIEW_GATES, decideScope, reviewAction, type RoleAssignment } from '../authz';
import { U } from './fixtures';

const BIOLOGY = U(201);
const PHYSICS = U(202);
const me = U(1);
const other = U(2);

const biologyEditor: RoleAssignment = { role_key: 'EDITOR', program_code: 'cee_medical', subject_node_id: BIOLOGY, revoked_at: null };

describe('decideScope: program and subject isolation', () => {
  it('lets a Biology editor edit Biology lessons in CEE', () => {
    const d = decideScope([biologyEditor], { actorId: me, action: 'lesson:edit', program: 'cee_medical', subjectNodeId: BIOLOGY });
    expect(d.allowed).toBe(true);
  });

  it('blocks the same editor from Physics, from IELTS, and from IOE', () => {
    for (const req of [
      { program: 'cee_medical' as const, subjectNodeId: PHYSICS },
      { program: 'ielts' as const, subjectNodeId: BIOLOGY },
      { program: 'ioe_engineering' as const, subjectNodeId: BIOLOGY },
    ]) {
      const d = decideScope([biologyEditor], { actorId: me, action: 'lesson:edit', ...req });
      expect(d).toMatchObject({ allowed: false, code: 'FORBIDDEN' });
    }
  });

  it('does not let a subject-scoped role do program-wide actions', () => {
    const d = decideScope([biologyEditor], { actorId: me, action: 'lesson:edit', program: 'cee_medical' });
    expect(d.allowed).toBe(false);
  });

  it('lets a whole-program assignment cover every subject in that program only', () => {
    const director: RoleAssignment = { role_key: 'ACADEMIC_DIRECTOR', program_code: 'cee_medical', subject_node_id: null, revoked_at: null };
    expect(decideScope([director], { actorId: me, action: 'curriculum:edit', program: 'cee_medical', subjectNodeId: PHYSICS }).allowed).toBe(true);
    expect(decideScope([director], { actorId: me, action: 'curriculum:edit', program: 'see_class_10', subjectNodeId: PHYSICS }).allowed).toBe(false);
  });

  it('ignores revoked assignments', () => {
    const revoked = { ...biologyEditor, revoked_at: '2026-11-01T00:00:00Z' };
    expect(decideScope([revoked], { actorId: me, action: 'lesson:edit', program: 'cee_medical', subjectNodeId: BIOLOGY }).allowed).toBe(false);
  });

  it('requires the right role for the action', () => {
    expect(decideScope([biologyEditor], { actorId: me, action: 'publish', program: 'cee_medical', subjectNodeId: BIOLOGY }).allowed).toBe(false);
    expect(decideScope([biologyEditor], { actorId: me, action: 'review:SCIENTIFIC', program: 'cee_medical', subjectNodeId: BIOLOGY }).allowed).toBe(false);
  });

  it('denies everything with no assignments', () => {
    for (const action of Object.keys(ACTION_ROLES) as (keyof typeof ACTION_ROLES)[]) {
      expect(decideScope([], { actorId: me, action, program: 'cee_medical', subjectNodeId: BIOLOGY }).allowed).toBe(false);
    }
  });
});

describe('decideScope: separation of duties', () => {
  const publisher: RoleAssignment = { role_key: 'PUBLISHER', program_code: 'cee_medical', subject_node_id: null, revoked_at: null };
  const expert: RoleAssignment = { role_key: 'SUBJECT_EXPERT', program_code: 'cee_medical', subject_node_id: BIOLOGY, revoked_at: null };

  it('blocks an author from publishing their own revision', () => {
    const d = decideScope([publisher], { actorId: me, action: 'publish', program: 'cee_medical', subjectNodeId: BIOLOGY, authorIds: [me] });
    expect(d).toMatchObject({ allowed: false, code: 'SOD_VIOLATION' });
  });

  it('allows a different publisher', () => {
    const d = decideScope([publisher], { actorId: me, action: 'publish', program: 'cee_medical', subjectNodeId: BIOLOGY, authorIds: [other] });
    expect(d.allowed).toBe(true);
  });

  it('blocks an author from reviewing their own work on every gate', () => {
    const all: RoleAssignment[] = ['ACADEMIC_DIRECTOR', 'SUBJECT_EXPERT', 'QUESTION_REVIEWER', 'ACCESSIBILITY_REVIEWER', 'RIGHTS_REVIEWER'].map(
      (role_key) => ({ role_key, program_code: 'cee_medical', subject_node_id: null, revoked_at: null }) as RoleAssignment
    );
    for (const gate of REVIEW_GATES) {
      const d = decideScope(all, { actorId: me, action: reviewAction(gate), program: 'cee_medical', subjectNodeId: BIOLOGY, authorIds: [me] });
      expect(d).toMatchObject({ allowed: false, code: 'SOD_VIOLATION' });
    }
  });

  it('does not apply separation of duties to editing your own draft', () => {
    const d = decideScope([biologyEditor], { actorId: me, action: 'lesson:edit', program: 'cee_medical', subjectNodeId: BIOLOGY, authorIds: [me] });
    expect(d.allowed).toBe(true);
  });

  it('allows the scientific gate only for subject experts in scope', () => {
    expect(
      decideScope([expert], { actorId: me, action: 'review:SCIENTIFIC', program: 'cee_medical', subjectNodeId: BIOLOGY, authorIds: [other] }).allowed
    ).toBe(true);
    expect(
      decideScope([expert], { actorId: me, action: 'review:SCIENTIFIC', program: 'cee_medical', subjectNodeId: PHYSICS, authorIds: [other] }).allowed
    ).toBe(false);
  });
});
