/**
 * Contributed by the independent QA track (Antigravity), branch
 * support/security-regression (8dda209), and reviewed before adoption:
 * 17 of its 18 tests kept as written; one replaced by a note (see Threat Vector 10).
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { toStudentQuestion, gradeAttempt, type PinnedQuestion } from '../grading';
import { computeCompletion, type CompletionInput, type StoredEvent } from '../completion';
import { decideScope, type RoleAssignment, type ScopeRequest } from '../authz';
import { requireFeature, resetFlagCache } from '../service.server';
import { CeeApiError } from '../http';
import { VisualAssetManifest, type LessonContent } from '../schemas';

describe('CEE Visual Intelligence — Advanced Security Regression Suite (Workstream F)', () => {
  beforeEach(() => {
    resetFlagCache();
  });

  // ── Threat Vector 1: Quiz Answer Key Exposure ──────────────────────────
  describe('Threat Vector 1: Quiz Answer Exposure', () => {
    const pinned: PinnedQuestion = {
      id: 'q-rev-heart-001',
      stem: 'Which cardiac chamber generates the highest peak systolic pressure?',
      options: ['Right Atrium', 'Left Ventricle', 'Right Ventricle', 'Left Atrium'],
      answerKey: 'B',
      rationale: 'Left ventricle must overcome systemic vascular resistance (approx. 120 mmHg).',
      objectiveId: 'obj-hemodynamics-1',
      sortKey: 1,
    };

    it('strips answerKey and rationale when converting to student question payload', () => {
      const studentQ = toStudentQuestion(pinned);

      expect(studentQ.id).toBe('q-rev-heart-001');
      expect(studentQ.stem).toContain('highest peak systolic pressure');
      expect(studentQ.options).toHaveLength(4);
      expect(studentQ.options[1].key).toBe('B');
      expect(studentQ.options[1].text).toBe('Left Ventricle');

      // Strict boundary check: sensitive fields must not exist
      expect('answerKey' in studentQ).toBe(false);
      expect('rationale' in studentQ).toBe(false);
      expect((studentQ as any).answerKey).toBeUndefined();
      expect((studentQ as any).rationale).toBeUndefined();
    });

    it('ensures JSON serialized student payload contains zero answer leaks', () => {
      const studentQ = toStudentQuestion(pinned);
      const json = JSON.stringify(studentQ);

      expect(json).not.toContain('"answerKey"');
      expect(json).not.toContain('"rationale"');
      expect(json).not.toContain('systemic vascular resistance');
    });
  });

  // ── Threat Vector 2: Score Manipulation ────────────────────────────────
  describe('Threat Vector 2: Score Manipulation Prevention', () => {
    const questions: PinnedQuestion[] = [
      {
        id: 'q1',
        stem: 'SA node pacemaker potential is primarily driven by which current?',
        options: ['If (Funny current)', 'IKr', 'INa fast', 'ICa-L'],
        answerKey: 'A',
        rationale: 'Hyperpolarization-activated cyclic nucleotide-gated channels.',
        objectiveId: 'obj-electrophys-1',
        sortKey: 1,
      },
      {
        id: 'q2',
        stem: 'AV node conduction delay allows for which physiological event?',
        options: ['Ventricular repolarization', 'Complete atrial emptying', 'Aortic recoil', 'Pericardial expansion'],
        answerKey: 'B',
        rationale: 'Ensures ventricles receive atrial blood volume before systole.',
        objectiveId: 'obj-electrophys-2',
        sortKey: 2,
      },
    ];

    it('computes score purely server-side regardless of client claims', () => {
      // Student submits answer with incorrect choice
      const attempt = [
        { questionRevisionId: 'q1', choice: 'C' as const }, // Wrong
        { questionRevisionId: 'q2', choice: 'B' as const }, // Correct
      ];

      const result = gradeAttempt(questions, attempt);

      expect(result.score).toBe(1);
      expect(result.maxScore).toBe(2);
      expect(result.percent).toBe(50);
      expect(result.questions[0].correct).toBe(false);
      expect(result.questions[1].correct).toBe(true);
    });

    it('strictly rejects attempt with CeeApiError if fabricated question IDs are submitted', () => {
      const attempt = [
        { questionRevisionId: 'q1', choice: 'A' as const },
        { questionRevisionId: 'forged-bonus-q999', choice: 'A' as const }, // Injected question
      ];

      expect(() => gradeAttempt(questions, attempt)).toThrowError(CeeApiError);
      expect(() => gradeAttempt(questions, attempt)).toThrowError(
        /Some answers are for questions that are not in this lesson/
      );
    });
  });

  // ── Threat Vector 3: Telemetry Replay ──────────────────────────────────
  describe('Threat Vector 3: Telemetry Replay Resilience', () => {
    const content: LessonContent = {
      schemaVersion: '1.0',
      summary: 'Cardiac conduction system overview',
      sections: [
        { key: 'sec-intro', heading: 'Introduction', body: 'Overview', required: true },
        { key: 'sec-sa-node', heading: 'SA Node', body: 'Pacemaker', required: true },
      ],
      objectiveIds: [],
      completion: {},
    };

    const primaryManifest: VisualAssetManifest = VisualAssetManifest.parse({
      schemaVersion: '1.0',
      kind: 'MODEL_3D',
      title: 'Test model',
      model: { format: 'glb', layers: [] },
      hotspots: [],
      sequences: [],
      fallback: { assetVersionId: '00000000-0000-4000-8000-000000000001', kind: 'svg' },
      accessibility: { description: 'A test model used only by this security test.', reducedMotionSupported: true },
    });

    it('does not count replayed duplicate section read events towards unread sections', () => {
      // Attacker replays sec-intro 50 times hoping to satisfy all sections
      const replayedEvents: StoredEvent[] = [
        { type: 'LESSON_OPENED', payload: {} },
        { type: 'PLAYER_READY', payload: {} },
        ...Array.from({ length: 50 }, () => ({
          type: 'SECTION_READ',
          payload: { sectionKey: 'sec-intro' },
        })),
      ];

      const input: CompletionInput = {
        content,
        primaryManifest,
        events: replayedEvents,
        questions: [],
        bestAttempt: null,
      };

      const result = computeCompletion(input);

      expect(result.state).toBe('IN_PROGRESS');
      expect(result.missing).toContain('SECTION:sec-sa-node');
    });
  });

  // ── Threat Vector 4: Fabricated Completion Events ──────────────────────
  describe('Threat Vector 4: Fabricated Completion Events', () => {
    const contentWithRules: LessonContent = {
      schemaVersion: '1.0',
      summary: 'Cardiac Output and Valve Mechanics',
      sections: [{ key: 'sec-valves', heading: 'Valves', body: 'Valves', required: true }],
      objectiveIds: ['obj-cardiac-1'],
      completion: {
        requireSequenceKey: 'seq-cycle',
        minScorePercent: 80,
      },
    };

    const primaryManifest: VisualAssetManifest = VisualAssetManifest.parse({
      schemaVersion: '1.0',
      kind: 'MODEL_3D',
      title: 'Test model',
      model: { format: 'glb', layers: [] },
      hotspots: [],
      sequences: [{ key: 'seq-cycle', title: 'Test sequence', steps: [{ atMs: 0, caption: 'Step one' }, { atMs: 3000, caption: 'Step two' }] }],
      fallback: { assetVersionId: '00000000-0000-4000-8000-000000000001', kind: 'svg' },
      accessibility: { description: 'A test model used only by this security test.', reducedMotionSupported: true },
    });

    it('rejects completion when student score is below minScorePercent', () => {
      const input: CompletionInput = {
        content: contentWithRules,
        primaryManifest,
        events: [
          { type: 'LESSON_OPENED', payload: {} },
          { type: 'PLAYER_READY', payload: {} },
          { type: 'SECTION_READ', payload: { sectionKey: 'sec-valves' } },
          { type: 'SEQUENCE_STEP', payload: { sequenceKey: 'seq-cycle', stepIndex: 0 } },
          { type: 'SEQUENCE_STEP', payload: { sequenceKey: 'seq-cycle', stepIndex: 1 } },
          { type: 'SEQUENCE_COMPLETED', payload: { sequenceKey: 'seq-cycle' } },
        ],
        questions: [{ id: 'q1', objectiveId: 'obj-cardiac-1' }],
        bestAttempt: { percent: 75, correctById: { q1: false } }, // 75% < 80%
      };

      const result = computeCompletion(input);

      expect(result.state).toBe('IN_PROGRESS');
      expect(result.missing).toContain('SCORE');
    });

    it('rejects completion if sequence steps were skipped', () => {
      const input: CompletionInput = {
        content: contentWithRules,
        primaryManifest,
        events: [
          { type: 'LESSON_OPENED', payload: {} },
          { type: 'PLAYER_READY', payload: {} },
          { type: 'SECTION_READ', payload: { sectionKey: 'sec-valves' } },
          // step-0 skipped by student!
          { type: 'SEQUENCE_STEP', payload: { sequenceKey: 'seq-cycle', stepIndex: 1 } },
          { type: 'SEQUENCE_COMPLETED', payload: { sequenceKey: 'seq-cycle' } },
        ],
        questions: [{ id: 'q1', objectiveId: 'obj-cardiac-1' }],
        bestAttempt: { percent: 100, correctById: { q1: true } },
      };

      const result = computeCompletion(input);

      expect(result.state).toBe('IN_PROGRESS');
      expect(result.missing).toContain('SEQUENCE:seq-cycle');
    });

    it('awards COMPLETED state when all sequence, reading, and scoring requirements are met', () => {
      const input: CompletionInput = {
        content: contentWithRules,
        primaryManifest,
        events: [
          { type: 'LESSON_OPENED', payload: {} },
          { type: 'PLAYER_READY', payload: {} },
          { type: 'SECTION_READ', payload: { sectionKey: 'sec-valves' } },
          { type: 'SEQUENCE_STEP', payload: { sequenceKey: 'seq-cycle', stepIndex: 0 } },
          { type: 'SEQUENCE_STEP', payload: { sequenceKey: 'seq-cycle', stepIndex: 1 } },
          { type: 'SEQUENCE_COMPLETED', payload: { sequenceKey: 'seq-cycle' } },
        ],
        questions: [{ id: 'q1', objectiveId: 'obj-cardiac-1' }],
        bestAttempt: { percent: 100, correctById: { q1: true } },
      };

      const result = computeCompletion(input);

      expect(result.state).toBe('COMPLETED');
      expect(result.missing).toHaveLength(0);
      expect(result.objectivesMet).toContain('obj-cardiac-1');
    });
  });

  // ── Threat Vector 5: Cross-Subject Access ──────────────────────────────
  describe('Threat Vector 5: Cross-Subject Access Prevention', () => {
    const assignments: RoleAssignment[] = [
      {
        role_key: 'SUBJECT_EXPERT',
        program_code: 'cee_medical',
        subject_node_id: 'sub-biology-anatomy',
        revoked_at: null,
      },
    ];

    it('forbids reviewer from reviewing outside assigned subject node', () => {
      const crossSubjectReq: ScopeRequest = {
        actorId: 'dr-sharma',
        action: 'review:SCIENTIFIC',
        program: 'cee_medical',
        subjectNodeId: 'sub-dental-histology', // Different subject!
      };

      const decision = decideScope(assignments, crossSubjectReq);

      expect(decision.allowed).toBe(false);
      expect(decision).toMatchObject({ allowed: false, code: 'FORBIDDEN' });
    });

    it('forbids reviewer from acting across programs', () => {
      const crossProgramReq: ScopeRequest = {
        actorId: 'dr-sharma',
        action: 'review:SCIENTIFIC',
        program: 'ielts', // Different program!
        subjectNodeId: 'sub-biology-anatomy',
      };

      const decision = decideScope(assignments, crossProgramReq);

      expect(decision.allowed).toBe(false);
      expect(decision).toMatchObject({ allowed: false, code: 'FORBIDDEN' });
    });
  });

  // ── Threat Vector 6: Unauthorized Publication ─────────────────────────
  describe('Threat Vector 6: Unauthorized Publication Prevention', () => {
    const editorAssignments: RoleAssignment[] = [
      {
        role_key: 'EDITOR',
        program_code: 'cee_medical',
        subject_node_id: null,
        revoked_at: null,
      },
    ];

    it('forbids an editor from publishing a lesson', () => {
      const publishReq: ScopeRequest = {
        actorId: 'editor-1',
        action: 'publish',
        program: 'cee_medical',
      };

      const decision = decideScope(editorAssignments, publishReq);

      expect(decision.allowed).toBe(false);
      expect(decision).toMatchObject({ allowed: false, code: 'FORBIDDEN' });
      expect((decision as any).reason).toContain('needs PUBLISHER');
    });
  });

  // ── Threat Vector 7: Author Self-Approval (SoD) ────────────────────────
  describe('Threat Vector 7: Author Self-Approval Prevention (SoD)', () => {
    const dualRoleAssignments: RoleAssignment[] = [
      { role_key: 'SUBJECT_EXPERT', program_code: 'cee_medical', subject_node_id: null, revoked_at: null },
      { role_key: 'PUBLISHER', program_code: 'cee_medical', subject_node_id: null, revoked_at: null },
    ];

    it('blocks author from approving their own scientific review', () => {
      const selfReviewReq: ScopeRequest = {
        actorId: 'author-alice',
        action: 'review:SCIENTIFIC',
        program: 'cee_medical',
        authorIds: ['author-alice', 'coauthor-bob'], // Alice authored the lesson
      };

      const decision = decideScope(dualRoleAssignments, selfReviewReq);

      expect(decision.allowed).toBe(false);
      expect(decision).toMatchObject({ allowed: false, code: 'SOD_VIOLATION' });
      expect((decision as any).reason).toContain('the author cannot approve or publish their own work');
    });

    it('blocks author from publishing their own lesson', () => {
      const selfPublishReq: ScopeRequest = {
        actorId: 'author-alice',
        action: 'publish',
        program: 'cee_medical',
        authorIds: ['author-alice'],
      };

      const decision = decideScope(dualRoleAssignments, selfPublishReq);

      expect(decision.allowed).toBe(false);
      expect(decision).toMatchObject({ allowed: false, code: 'SOD_VIOLATION' });
    });
  });

  // ── Threat Vector 8: Legitimate Author Draft Submission ────────────────
  describe('Threat Vector 8: Legitimate Author Workflow', () => {
    const authorAssignments: RoleAssignment[] = [
      { role_key: 'EDITOR', program_code: 'cee_medical', subject_node_id: null, revoked_at: null },
    ];
    const reviewerAssignments: RoleAssignment[] = [
      { role_key: 'SUBJECT_EXPERT', program_code: 'cee_medical', subject_node_id: null, revoked_at: null },
    ];

    it('allows author to edit lesson draft', () => {
      const editReq: ScopeRequest = {
        actorId: 'author-alice',
        action: 'lesson:edit',
        program: 'cee_medical',
        authorIds: ['author-alice'],
      };

      const decision = decideScope(authorAssignments, editReq);

      expect(decision.allowed).toBe(true);
    });

    it('allows independent reviewer to review draft authored by someone else', () => {
      const reviewReq: ScopeRequest = {
        actorId: 'reviewer-charlie',
        action: 'review:SCIENTIFIC',
        program: 'cee_medical',
        authorIds: ['author-alice'], // Authored by Alice, reviewed by Charlie
      };

      const decision = decideScope(reviewerAssignments, reviewReq);

      expect(decision.allowed).toBe(true);
    });
  });

  // ── Threat Vector 9: Feature Flag Bypass ───────────────────────────────
  describe('Threat Vector 9: Feature Flag Bypass Prevention', () => {
    it('throws 404 CeeApiError when feature flag is disabled', async () => {
      const mockDisabledClient: any = {
        from: () => ({
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: { value: false },
                error: null,
              }),
            }),
          }),
        }),
      };

      await expect(requireFeature(mockDisabledClient)).rejects.toThrowError(CeeApiError);

      try {
        await requireFeature(mockDisabledClient);
      } catch (err: any) {
        expect(err.status).toBe(404);
        expect(err.code).toBe('NOT_FOUND');
      }
    });

    it('resolves silently without throwing when feature flag is enabled', async () => {
      const mockEnabledClient: any = {
        from: () => ({
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: { value: true },
                error: null,
              }),
            }),
          }),
        }),
      };

      await expect(requireFeature(mockEnabledClient)).resolves.toBeUndefined();
    });
  });

  // Threat Vector 10 (unpublished lessons hidden from students) is not unit-testable
  // without a database: the submitted version filtered an array defined in the
  // test itself. It is covered end to end in api.integration.test.ts, where
  // drafts and unpublished revisions are never returned by the student routes.
});
