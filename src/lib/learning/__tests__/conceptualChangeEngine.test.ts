import { describe, it, expect } from 'vitest';
import {
  diagnoseMisconceptionFromSignals,
  generateFiveStageRemediation,
  recordTransferResponse,
  getPendingReassessments,
  CANONICAL_MISCONCEPTIONS,
  StudentCognitiveState,
  DiagnosticEvidence,
} from '../conceptualChangeEngine';

describe('Conceptual Change Engine (Cognitive Remediation Loop)', () => {
  describe('Multi-Signal Diagnostic Rule', () => {
    it('requires at least 2 converging signals to diagnose a persistent misconception', () => {
      // Single signal - should flag for more evidence, not diagnosed yet
      const singleEvidence: DiagnosticEvidence[] = [
        {
          questionId: 'q-fall-1',
          studentAnswerTextOrChoice: 'The heavier object hits first because it has more mass.',
          timestamp: new Date().toISOString(),
        },
      ];

      const res1 = diagnoseMisconceptionFromSignals(singleEvidence);
      expect(res1.diagnosed).toBe(false);
      expect(res1.requiresMoreEvidence).toBe(true);
      expect(res1.evidenceCount).toBe(1);

      // Two signals - confirms diagnosis
      const multiEvidence: DiagnosticEvidence[] = [
        ...singleEvidence,
        {
          questionId: 'q-fall-2',
          studentAnswerTextOrChoice: 'In a vacuum, the heavier falls faster than feather.',
          timestamp: new Date().toISOString(),
        },
      ];

      const res2 = diagnoseMisconceptionFromSignals(multiEvidence);
      expect(res2.diagnosed).toBe(true);
      expect(res2.requiresMoreEvidence).toBe(false);
      expect(res2.evidenceCount).toBe(2);
      expect(res2.misconception?.id).toBe('misc-grav-mass-dependent');
    });

    it('returns not diagnosed if no known triggers match', () => {
      const neutralEvidence: DiagnosticEvidence[] = [
        {
          questionId: 'q-neutral',
          studentAnswerTextOrChoice: 'The derivative of velocity with respect to time gives acceleration.',
          timestamp: new Date().toISOString(),
        },
      ];

      const res = diagnoseMisconceptionFromSignals(neutralEvidence);
      expect(res.diagnosed).toBe(false);
      expect(res.requiresMoreEvidence).toBe(false);
    });
  });

  describe('5-Stage Remediation Generation', () => {
    it('constructs complete 5-stage plan including 7-day spaced reassessment', () => {
      const plan = generateFiveStageRemediation('misc-plant-respiration-co2');

      expect(plan).not.toBeNull();
      expect(plan?.stage1_identification.misconceptionId).toBe('misc-plant-respiration-co2');
      expect(plan?.stage2_contrastiveDistinction.contrastiveExplanation).toContain('mitochondria');
      expect(plan?.stage3_workedExample.correctReasoningSteps.length).toBeGreaterThan(0);
      expect(plan?.stage4_immediateTransfer.options).toHaveLength(4);
      expect(plan?.stage5_delayedReassessment.delayDays).toBe(7);

      const scheduledTime = new Date(plan!.stage5_delayedReassessment.targetReassessmentDate).getTime();
      const nowTime = Date.now();
      const diffDays = Math.round((scheduledTime - nowTime) / (1000 * 60 * 60 * 24));
      expect(diffDays).toBe(7);
    });

    it('returns null for nonexistent misconception', () => {
      expect(generateFiveStageRemediation('nonexistent-id')).toBeNull();
    });
  });

  describe('Immediate Transfer & Cognitive Profile Tracking', () => {
    const initialProfile: StudentCognitiveState = {
      studentId: 'student-test-42',
      misconceptions: {},
      retentionRatePercentage: 100,
      lastUpdated: new Date().toISOString(),
    };

    it('updates stage to transfer_passed and schedules 7-day review on correct answer', () => {
      const miscId = 'misc-series-current-consumed';
      const def = CANONICAL_MISCONCEPTIONS[miscId];

      const outcome = recordTransferResponse(
        initialProfile,
        miscId,
        def.immediateTransferProblem.correctOptionIndex
      );

      expect(outcome.passed).toBe(true);
      expect(outcome.updatedProfile.misconceptions[miscId].stage).toBe('transfer_passed');
      expect(outcome.updatedProfile.retentionRatePercentage).toBe(100);
      expect(outcome.scheduledDate).toBeDefined();
    });

    it('updates stage to relapsed on incorrect transfer answer', () => {
      const miscId = 'misc-series-current-consumed';
      const wrongOptionIndex = 0; // distractor: bulb A is brighter

      const outcome = recordTransferResponse(initialProfile, miscId, wrongOptionIndex);

      expect(outcome.passed).toBe(false);
      expect(outcome.updatedProfile.misconceptions[miscId].stage).toBe('relapsed');
      expect(outcome.updatedProfile.retentionRatePercentage).toBe(0);
      expect(outcome.feedback).toContain('Review the contrastive distinction');
    });

    it('detects when 7-day delayed reassessment becomes due', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 8); // 8 days ago (past the 7-day target)

      const profileWithDueReview: StudentCognitiveState = {
        studentId: 'student-test-42',
        misconceptions: {
          'misc-grav-mass-dependent': {
            misconceptionId: 'misc-grav-mass-dependent',
            signalsCount: 2,
            confirmed: true,
            firstSeenAt: pastDate.toISOString(),
            lastSeenAt: pastDate.toISOString(),
            stage: 'transfer_passed',
            scheduledReassessmentDate: pastDate.toISOString(),
          },
        },
        retentionRatePercentage: 100,
        lastUpdated: pastDate.toISOString(),
      };

      const due = getPendingReassessments(profileWithDueReview);
      expect(due).toHaveLength(1);
      expect(due[0].misconceptionId).toBe('misc-grav-mass-dependent');
    });
  });
});
