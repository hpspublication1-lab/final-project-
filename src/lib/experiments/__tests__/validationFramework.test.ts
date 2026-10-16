import { describe, it, expect } from 'vitest';
import {
  calculateQWK,
  evaluateExperiment1,
  evaluateExperiment2,
  evaluateExperiment3,
  RubricValidationTrial,
  StudentTrialRecord,
} from '../validationFramework';

describe('Validation Experiments & Research Evaluation Engine', () => {
  describe('Quadratic Weighted Kappa (QWK) Calculation', () => {
    it('returns 1.0 for perfectly agreeing raters', () => {
      const human = [4, 3, 2, 4, 1, 0, 3, 4];
      const model = [4, 3, 2, 4, 1, 0, 3, 4];
      const qwk = calculateQWK(human, model, 0, 4);
      expect(qwk).toBe(1.0);
    });

    it('returns high QWK (>= 0.75) for closely correlated ratings with minor discrepancies', () => {
      const human = [4, 4, 3, 2, 4, 1, 0, 3, 4, 2];
      const model = [4, 3, 3, 2, 4, 1, 0, 3, 3, 2];
      const qwk = calculateQWK(human, model, 0, 4);
      expect(qwk).toBeGreaterThanOrEqual(0.75);
    });

    it('returns lower QWK for noisy uncorrelated ratings', () => {
      const human = [4, 4, 4, 4, 0, 0, 0, 0];
      const model = [0, 0, 0, 0, 4, 4, 4, 4]; // inverted
      const qwk = calculateQWK(human, model, 0, 4);
      expect(qwk).toBeLessThan(0.2);
    });
  });

  describe('Experiment 1: Rubric-Based Grading Validation', () => {
    it('approves GO decision when QWK >= 0.75 and teacher approval >= 90%', () => {
      const trials: RubricValidationTrial[] = [
        {
          trialId: 't1',
          questionId: 'see-sci-01',
          subject: 'Science',
          studentAnswerText: 'Answer 1',
          humanExpertMarks: 4,
          aiAnswerKeyMarks: 3,
          aiRubricMarks: 4,
          maxMarks: 4,
          teacherFeedbackApproved: true,
        },
        {
          trialId: 't2',
          questionId: 'see-sci-02',
          subject: 'Science',
          studentAnswerText: 'Answer 2',
          humanExpertMarks: 3,
          aiAnswerKeyMarks: 2,
          aiRubricMarks: 3,
          maxMarks: 4,
          teacherFeedbackApproved: true,
        },
        {
          trialId: 't3',
          questionId: 'see-sci-03',
          subject: 'Science',
          studentAnswerText: 'Answer 3',
          humanExpertMarks: 2,
          aiAnswerKeyMarks: 1,
          aiRubricMarks: 2,
          maxMarks: 4,
          teacherFeedbackApproved: true,
        },
        {
          trialId: 't4',
          questionId: 'see-sci-04',
          subject: 'Science',
          studentAnswerText: 'Answer 4',
          humanExpertMarks: 4,
          aiAnswerKeyMarks: 3,
          aiRubricMarks: 4,
          maxMarks: 4,
          teacherFeedbackApproved: true,
        },
      ];

      const res = evaluateExperiment1(trials);
      expect(res.overallQwkRubric).toBeGreaterThanOrEqual(0.75);
      expect(res.teacherFeedbackApprovalRate).toBe(1.0);
      expect(res.goNoGoDecision).toBe('GO');
      expect(res.verdict).toContain('Criteria satisfied');
    });

    it('blocks autonomous deployment if teacher approval falls below 90%', () => {
      const trials: RubricValidationTrial[] = [
        {
          trialId: 't1',
          questionId: 'q1',
          subject: 'Science',
          studentAnswerText: 'Answer 1',
          humanExpertMarks: 4,
          aiAnswerKeyMarks: 3,
          aiRubricMarks: 4,
          maxMarks: 4,
          teacherFeedbackApproved: false, // rejected
        },
        {
          trialId: 't2',
          questionId: 'q2',
          subject: 'Science',
          studentAnswerText: 'Answer 2',
          humanExpertMarks: 4,
          aiAnswerKeyMarks: 3,
          aiRubricMarks: 4,
          maxMarks: 4,
          teacherFeedbackApproved: true,
        },
      ];

      const res = evaluateExperiment1(trials);
      expect(res.teacherFeedbackApprovalRate).toBe(0.5);
      expect(res.goNoGoDecision).toBe('NO_GO_REVISE_RUBRIC');
    });
  });

  describe('Experiment 2: Nepal Handwriting Benchmark', () => {
    it('approves GO when CER <= 5%, critical symbols >= 99%, and 0 silent corrections', () => {
      const res = evaluateExperiment2({
        totalScripts: 300,
        averageCer: 0.03,
        averageWer: 0.06,
        criticalSymbolPrecision: 0.995,
        silentCorrectionsCount: 0,
      });

      expect(res.goNoGoDecision).toBe('GO');
      expect(res.verdict).toContain('Approved for pilot processing');
    });

    it('mandates human review if critical symbol accuracy drops below 99%', () => {
      const res = evaluateExperiment2({
        totalScripts: 300,
        averageCer: 0.04,
        averageWer: 0.08,
        criticalSymbolPrecision: 0.94, // 94% < 99%
        silentCorrectionsCount: 0,
      });

      expect(res.goNoGoDecision).toBe('NO_GO_MANDATE_HUMAN_REVIEW');
      expect(res.verdict).toContain('Human review mandatory');
    });
  });

  describe('Experiment 3: Misconception-Matched Feedback A/B Testing', () => {
    it('approves GO when treatment achieves >= +5 percentage points 7-day retention improvement', () => {
      const trials: StudentTrialRecord[] = [];

      // 10 control students (avg retention ~60%)
      for (let i = 0; i < 10; i++) {
        trials.push({
          studentId: `ctrl-${i}`,
          cohort: 'control_standard_explanation',
          initialScorePercentage: 40,
          delayed7DayScorePercentage: 60,
        });
      }

      // 10 treatment students (avg retention ~72%, +12pp improvement)
      for (let i = 0; i < 10; i++) {
        trials.push({
          studentId: `treat-${i}`,
          cohort: 'treatment_misconception_loop',
          initialScorePercentage: 40,
          delayed7DayScorePercentage: 72,
        });
      }

      const res = evaluateExperiment3(trials);
      expect(res.percentagePointImprovement).toBe(12.0);
      expect(res.goNoGoDecision).toBe('GO');
      expect(res.verdict).toContain('Statistically meaningful conceptual change observed');
    });

    it('rejects if improvement is under +5pp', () => {
      const trials: StudentTrialRecord[] = [];

      for (let i = 0; i < 10; i++) {
        trials.push({
          studentId: `ctrl-${i}`,
          cohort: 'control_standard_explanation',
          initialScorePercentage: 40,
          delayed7DayScorePercentage: 60,
        });
      }

      for (let i = 0; i < 10; i++) {
        trials.push({
          studentId: `treat-${i}`,
          cohort: 'treatment_misconception_loop',
          initialScorePercentage: 40,
          delayed7DayScorePercentage: 62, // only +2pp
        });
      }

      const res = evaluateExperiment3(trials);
      expect(res.percentagePointImprovement).toBe(2.0);
      expect(res.goNoGoDecision).toBe('NO_GO_REFINE_REMEDIATION');
    });
  });
});
