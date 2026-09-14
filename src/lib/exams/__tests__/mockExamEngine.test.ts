import { describe, it, expect } from 'vitest';
import {
  CANONICAL_EXAM_CATALOG,
  calculateRankAndPercentile,
  calculateBreakdowns,
  identifyWeakTopicsAndRecommendations,
  calculateTimerRecovery,
  validateSubmissionSecurity,
  sanitizeQuestionsForActiveExam,
  evaluateScheduledStatus,
  transitionSubjectiveEvaluation,
  SubjectPerformance,
  ChapterPerformance,
  SubjectiveEvaluationItem,
} from '../examRegistry';

describe('Mock Examination Blueprint Catalog', () => {
  it('contains all 8 required exam categories', () => {
    const categories = new Set(CANONICAL_EXAM_CATALOG.map((e) => e.category));
    expect(categories.has('cee_full_200')).toBe(true);
    expect(categories.has('cee_subject')).toBe(true);
    expect(categories.has('see_model')).toBe(true);
    expect(categories.has('see_subject')).toBe(true);
    expect(categories.has('chapter_test')).toBe(true);
    expect(categories.has('scheduled_test')).toBe(true);
    expect(categories.has('practice_test')).toBe(true);
    expect(categories.has('diagnostic_free')).toBe(true);
  });

  it('verifies CEE Grand Mock specifications strictly follow MEC rules', () => {
    const ceeMock = CANONICAL_EXAM_CATALOG.find((e) => e.id === 'cee-grand-mock-1');
    expect(ceeMock).toBeDefined();
    expect(ceeMock?.totalQuestions).toBe(200);
    expect(ceeMock?.totalMarks).toBe(200);
    expect(ceeMock?.durationMinutes).toBe(180);
    expect(ceeMock?.positiveMarks).toBe(1.0);
    expect(ceeMock?.negativeMarks).toBe(0.25);
    expect(ceeMock?.sections).toHaveLength(5);

    const sectionSum = ceeMock!.sections.reduce((acc, s) => acc + s.questionCount, 0);
    expect(sectionSum).toBe(200);
  });

  it('verifies SEE Model Exam specifications follow NEB Class 10 rules with zero negative marking', () => {
    const seeMock = CANONICAL_EXAM_CATALOG.find((e) => e.id === 'see-board-model-sci');
    expect(seeMock).toBeDefined();
    expect(seeMock?.programType).toBe('see_class_10');
    expect(seeMock?.negativeMarks).toBe(0.0);
    expect(seeMock?.allowNegativeTotal).toBe(false);
  });
});

describe('Anti-Fabrication Rank & Percentile Threshold', () => {
  it('strictly returns notEnoughData = true and null rank/percentile when candidate attempts < 5', () => {
    const candidateScore = 150;
    const pastScoresSmall = [120, 140, 160]; // 3 attempts (< 5)

    const result = calculateRankAndPercentile(candidateScore, pastScoresSmall);
    expect(result.notEnoughData).toBe(true);
    expect(result.rank).toBeNull();
    expect(result.percentile).toBeNull();
    expect(result.totalCandidates).toBe(3);
    expect(result.message).toContain('after 5+ student submissions');
  });

  it('computes legitimate rank and percentile when candidate attempts >= 5', () => {
    const candidateScore = 175;
    // 5 attempts total
    const allScores = [100, 120, 140, 150, 175];

    const result = calculateRankAndPercentile(candidateScore, allScores);
    expect(result.notEnoughData).toBe(false);
    expect(result.rank).toBe(1); // Top score
    expect(result.percentile).toBe(100);
    expect(result.totalCandidates).toBe(5);
  });

  it('handles middle ranking properly with tie breakers', () => {
    const candidateScore = 135;
    const allScores = [180, 160, 140, 135, 110, 90]; // 6 candidates total

    const result = calculateRankAndPercentile(candidateScore, allScores);
    expect(result.notEnoughData).toBe(false);
    expect(result.rank).toBe(4); // 180 (1), 160 (2), 140 (3), 135 (4)
    expect(result.percentile).toBeGreaterThan(0);
    expect(result.percentile).toBeLessThanOrEqual(100);
  });
});

describe('Timer Recovery & Network Resilience', () => {
  it('correctly calculates remaining time and restores active session when time is remaining', () => {
    const now = 1700000000000;
    const session = {
      selectedExam: { id: 'cee-grand-mock-1', duration: 180 },
      questions: [{ id: 'q1' }, { id: 'q2' }],
      answers: { q1: 'a' },
      markedForReview: ['q2'],
      visitedQuestions: ['q1', 'q2'],
      attemptId: 'att-123',
      currentIdx: 1,
      targetEndTime: now + 4500000, // 75 minutes remaining
    };

    const recovery = calculateTimerRecovery(JSON.stringify(session), now);
    expect(recovery.canRecover).toBe(true);
    expect(recovery.isExpired).toBe(false);
    expect(recovery.remainingSeconds).toBe(4500);
    expect(recovery.reason).toBe('valid');
    expect(recovery.session?.attemptId).toBe('att-123');
  });

  it('identifies expired sessions and triggers auto-submit condition without resetting timer', () => {
    const now = 1700000000000;
    const expiredSession = {
      selectedExam: { id: 'cee-grand-mock-1', duration: 180 },
      questions: [{ id: 'q1' }],
      answers: { q1: 'c' },
      markedForReview: [],
      visitedQuestions: ['q1'],
      attemptId: 'att-456',
      currentIdx: 0,
      targetEndTime: now - 10000, // Expired 10 seconds ago
    };

    const recovery = calculateTimerRecovery(JSON.stringify(expiredSession), now);
    expect(recovery.canRecover).toBe(false);
    expect(recovery.isExpired).toBe(true);
    expect(recovery.remainingSeconds).toBe(0);
    expect(recovery.reason).toBe('expired');
  });

  it('safely handles corrupted or empty localStorage data', () => {
    expect(calculateTimerRecovery(null).canRecover).toBe(false);
    expect(calculateTimerRecovery('invalid-json').canRecover).toBe(false);
    expect(calculateTimerRecovery(JSON.stringify({ incomplete: true })).reason).toBe('corrupted');
  });
});

describe('Duplicate Submissions & Result Privacy', () => {
  it('allows fresh uncompleted submission for legitimate student', () => {
    const existingAttempt = { id: 'att-789', student_id: 'student-A', completed_at: null };
    const check = validateSubmissionSecurity(existingAttempt, 'student-A');
    expect(check.allowed).toBe(true);
    expect(check.isDuplicate).toBe(false);
  });

  it('intercepts duplicate submissions idempotently if attempt is already completed', () => {
    const completedAttempt = {
      id: 'att-789',
      student_id: 'student-A',
      completed_at: '2026-09-13T12:00:00.000Z',
    };
    const check = validateSubmissionSecurity(completedAttempt, 'student-A');
    expect(check.allowed).toBe(false);
    expect(check.isDuplicate).toBe(true);
    expect(check.statusCode).toBe(200);
    expect(check.error).toContain('already finalized');
  });

  it('enforces result privacy: prevents student B from updating or submitting student A\'s attempt', () => {
    const studentAAttempt = { id: 'att-789', student_id: 'student-A', completed_at: null };
    const check = validateSubmissionSecurity(studentAAttempt, 'student-B');
    expect(check.allowed).toBe(false);
    expect(check.isDuplicate).toBe(false);
    expect(check.statusCode).toBe(403);
    expect(check.error).toContain('Unauthorized');
  });

  it('sanitizes active exam questions to prevent leaking answer keys or explanations to client before submission', () => {
    const sensitiveQuestions = [
      { id: 'q1', question_text: 'What is G?', option_a: '6.67e-11', correct_option: 'a', explanation: 'Universal gravitational constant' },
      { id: 'q2', question_text: 'Formula of water?', option_a: 'H2O', correct_option: 'a', explanation: 'Dihydrogen monoxide' },
    ];

    const safeQuestions = sanitizeQuestionsForActiveExam(sensitiveQuestions);
    expect(safeQuestions).toHaveLength(2);
    expect((safeQuestions[0] as any).correct_option).toBeUndefined();
    expect((safeQuestions[0] as any).explanation).toBeUndefined();
    expect(safeQuestions[0].id).toBe('q1');
    expect(safeQuestions[0].question_text).toBe('What is G?');
  });
});

describe('Subject & Chapter Breakdown Calculation', () => {
  const sampleQuestions = [
    { id: 'q1', subject: 'Physics', chapter: 'Mechanics', marks: 1, negativeMarks: 0.25 },
    { id: 'q2', subject: 'Physics', chapter: 'Mechanics', marks: 1, negativeMarks: 0.25 },
    { id: 'q3', subject: 'Chemistry', chapter: 'Stoichiometry', marks: 1, negativeMarks: 0.25 },
    { id: 'q4', subject: 'Chemistry', chapter: 'Organic', marks: 1, negativeMarks: 0.25 },
  ];

  const keyMap = new Map([
    ['q1', { correctOption: 'a', marks: 1, negativeMarks: 0.25 }],
    ['q2', { correctOption: 'b', marks: 1, negativeMarks: 0.25 }],
    ['q3', { correctOption: 'c', marks: 1, negativeMarks: 0.25 }],
    ['q4', { correctOption: 'd', marks: 1, negativeMarks: 0.25 }],
  ]);

  it('calculates CEE subject and chapter scores with accurate negative marking', () => {
    // Student answered:
    // q1: 'a' (correct -> +1.0)
    // q2: 'c' (wrong -> -0.25)
    // q3: 'c' (correct -> +1.0)
    // q4: unattempted (0)
    const answers = { q1: 'a', q2: 'c', q3: 'c' };

    const { subjects, chapters } = calculateBreakdowns(sampleQuestions, answers, keyMap, 1.0, 0.25);

    const physics = subjects.find((s) => s.subject === 'Physics');
    expect(physics).toBeDefined();
    expect(physics?.attempted).toBe(2);
    expect(physics?.correct).toBe(1);
    expect(physics?.incorrect).toBe(1);
    expect(physics?.netScore).toBe(0.75); // 1.0 - 0.25
    expect(physics?.accuracy).toBe(50);

    const chemistry = subjects.find((s) => s.subject === 'Chemistry');
    expect(chemistry).toBeDefined();
    expect(chemistry?.attempted).toBe(1);
    expect(chemistry?.correct).toBe(1);
    expect(chemistry?.unattempted).toBe(1);
    expect(chemistry?.netScore).toBe(1.0);
    expect(chemistry?.accuracy).toBe(100);

    const mechanics = chapters.find((c) => c.chapter === 'Mechanics');
    expect(mechanics).toBeDefined();
    expect(mechanics?.accuracy).toBe(50);
    expect(mechanics?.status).toBe('average');
  });

  it('identifies weak topics and generates targeted remedial revision guidance', () => {
    const chapters: ChapterPerformance[] = [
      {
        chapter: 'Optics',
        subject: 'Physics',
        attempted: 4,
        correct: 1,
        incorrect: 3,
        accuracy: 25,
        status: 'weak',
      },
      {
        chapter: 'Mechanics',
        subject: 'Physics',
        attempted: 5,
        correct: 4,
        incorrect: 1,
        accuracy: 80,
        status: 'strong',
      },
    ];

    const { weakTopics, recommendations } = identifyWeakTopicsAndRecommendations(chapters);
    expect(weakTopics).toHaveLength(1);
    expect(weakTopics[0]).toContain('Optics (Physics)');
    expect(recommendations.length).toBeGreaterThanOrEqual(2);
    expect(recommendations.some((r) => r.includes('Optics'))).toBe(true);
  });
});

describe('Scheduled Examination Window Evaluation', () => {
  it('identifies upcoming scheduled examination and forbids starting ahead of time', () => {
    const now = new Date('2026-09-19T08:00:00+05:45').getTime();
    const scheduledStart = '2026-09-19T10:00:00+05:45';
    const scheduledEnd = '2026-09-19T13:00:00+05:45';

    const check = evaluateScheduledStatus(scheduledStart, scheduledEnd, now);
    expect(check.status).toBe('upcoming');
    expect(check.canStart).toBe(false);
    expect(check.startsInSeconds).toBe(2 * 3600);
  });

  it('permits candidate to start during the synchronized live examination window', () => {
    const now = new Date('2026-09-19T10:30:00+05:45').getTime();
    const scheduledStart = '2026-09-19T10:00:00+05:45';
    const scheduledEnd = '2026-09-19T13:00:00+05:45';

    const check = evaluateScheduledStatus(scheduledStart, scheduledEnd, now);
    expect(check.status).toBe('live');
    expect(check.canStart).toBe(true);
  });

  it('closes examination access once the scheduled window has passed', () => {
    const now = new Date('2026-09-19T13:05:00+05:45').getTime();
    const scheduledStart = '2026-09-19T10:00:00+05:45';
    const scheduledEnd = '2026-09-19T13:00:00+05:45';

    const check = evaluateScheduledStatus(scheduledStart, scheduledEnd, now);
    expect(check.status).toBe('closed');
    expect(check.canStart).toBe(false);
  });
});

describe('SEE Subjective Rubric Evaluation Lifecycle', () => {
  const sampleSubmission: SubjectiveEvaluationItem = {
    id: 'sub-test-1',
    questionId: 'q-subj-1',
    studentId: 'student-uuid',
    studentName: 'Bidur Adhikari',
    subject: 'Compulsory Science',
    questionText: 'State Ohm’s Law and calculate the resistance of a 100W, 220V bulb.',
    sampleSolution: '1. Statement of Ohm’s law (1M)\n2. Formula V = I*R or P = V^2 / R (1M)\n3. Computation R = 220^2 / 100 = 484 Ohm (2M)',
    studentAnswerText: 'Ohm law states V is proportional to I. P = V^2 / R so R = 220*220/100 = 484 ohms.',
    totalMarks: 4,
    aiDraftScore: 3.5,
    aiDraftFeedback: 'Good formula and arithmetic.',
    aiRubricBreakdown: [
      { criterion: 'Ohm’s Law Statement', score: 0.8, maxMarks: 1.0, feedback: 'Stated without temperature condition' },
      { criterion: 'Formula Definition', score: 1.0, maxMarks: 1.0, feedback: 'Correct formula' },
      { criterion: 'Calculation & Units', score: 1.7, maxMarks: 2.0, feedback: 'Accurate value with Ohm unit' },
    ],
    status: 'pending_review',
    isAiDraft: true,
    createdAt: '2026-09-14T08:00:00.000Z',
  };

  it('verifies that new submissions are marked as AI Drafts with pending status', () => {
    expect(sampleSubmission.isAiDraft).toBe(true);
    expect(sampleSubmission.status).toBe('pending_review');
    expect(sampleSubmission.publishedAt).toBeUndefined();
  });

  it('allows teacher to override rubric criteria and save draft without publishing', () => {
    const updatedRubric = [
      { criterion: 'Ohm’s Law Statement', score: 1.0, maxMarks: 1.0, feedback: 'Full mark awarded upon review' },
      { criterion: 'Formula Definition', score: 1.0, maxMarks: 1.0, feedback: 'Correct formula' },
      { criterion: 'Calculation & Units', score: 2.0, maxMarks: 2.0, feedback: 'Full mark' },
    ];

    const result = transitionSubjectiveEvaluation(sampleSubmission, {
      rubricBreakdown: updatedRubric,
      teacherFeedback: 'Outstanding work. Perfect application of electrical power formula.',
      publish: false,
    });

    expect(result.status).toBe('teacher_reviewed');
    expect(result.isAiDraft).toBe(false);
    expect(result.teacherScore).toBe(4.0);
    expect(result.publishedAt).toBeUndefined();
  });

  it('publishes final score and sets publishedAt timestamp', () => {
    const publishIso = '2026-09-14T11:00:00.000Z';
    const result = transitionSubjectiveEvaluation(
      sampleSubmission,
      {
        teacherScore: 3.8,
        teacherFeedback: 'Officially approved board score.',
        publish: true,
      },
      publishIso
    );

    expect(result.status).toBe('published');
    expect(result.isAiDraft).toBe(false);
    expect(result.teacherScore).toBe(3.8);
    expect(result.publishedAt).toBe(publishIso);
  });
});

describe('Configurable Negative Marking & Scoring Engine', () => {
  it('correctly applies CEE negative marking (+1.0 / -0.25)', () => {
    const qList = [
      { id: 'q1', subject: 'Physics', marks: 1.0, negativeMarks: 0.25 },
      { id: 'q2', subject: 'Physics', marks: 1.0, negativeMarks: 0.25 },
      { id: 'q3', subject: 'Physics', marks: 1.0, negativeMarks: 0.25 },
      { id: 'q4', subject: 'Physics', marks: 1.0, negativeMarks: 0.25 },
    ];

    const keyMap = new Map([
      ['q1', { correctOption: 'a', marks: 1.0, negativeMarks: 0.25 }],
      ['q2', { correctOption: 'b', marks: 1.0, negativeMarks: 0.25 }],
      ['q3', { correctOption: 'c', marks: 1.0, negativeMarks: 0.25 }],
      ['q4', { correctOption: 'd', marks: 1.0, negativeMarks: 0.25 }],
    ]);

    // Student: q1 correct (+1), q2 wrong (-0.25), q3 wrong (-0.25), q4 unattempted (0)
    // Net score = 1.0 - 0.25 - 0.25 = 0.5
    const answers = { q1: 'a', q2: 'a', q3: 'a' };
    const { subjects } = calculateBreakdowns(qList, answers, keyMap, 1.0, 0.25);
    const physics = subjects[0];

    expect(physics.attempted).toBe(3);
    expect(physics.correct).toBe(1);
    expect(physics.incorrect).toBe(2);
    expect(physics.unattempted).toBe(1);
    expect(physics.netScore).toBe(0.5);
  });

  it('verifies SEE scoring with zero negative marking (+2.0 / 0.0)', () => {
    const qList = [
      { id: 'sq1', subject: 'Science', marks: 2.0, negativeMarks: 0.0 },
      { id: 'sq2', subject: 'Science', marks: 2.0, negativeMarks: 0.0 },
    ];

    const keyMap = new Map([
      ['sq1', { correctOption: 'b', marks: 2.0, negativeMarks: 0.0 }],
      ['sq2', { correctOption: 'c', marks: 2.0, negativeMarks: 0.0 }],
    ]);

    // Student: sq1 correct (+2), sq2 wrong (0 penalty)
    // Net score = 2.0
    const answers = { sq1: 'b', sq2: 'a' };
    const { subjects } = calculateBreakdowns(qList, answers, keyMap, 2.0, 0.0);
    const science = subjects[0];

    expect(science.correct).toBe(1);
    expect(science.incorrect).toBe(1);
    expect(science.netScore).toBe(2.0);
  });
});

