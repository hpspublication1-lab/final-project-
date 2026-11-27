import { describe, expect, it } from 'vitest';
import { computeCompletion, type StoredEvent } from '../completion';
import { gradeAttempt, toStudentQuestion, type PinnedQuestion } from '../grading';
import { CeeApiError } from '../http';
import { U, lessonContent, manifest3d } from './fixtures';

const q = (n: number, answerKey: 'A' | 'B' | 'C' | 'D', objectiveId: string | null = null): PinnedQuestion => ({
  id: U(n),
  stem: `Question ${n}`,
  options: ['one', 'two', 'three', 'four'],
  answerKey,
  rationale: `Because ${n}`,
  objectiveId,
  sortKey: n,
});

describe('toStudentQuestion', () => {
  it('never includes the answer key or rationale', () => {
    const s = toStudentQuestion(q(1, 'C'));
    const text = JSON.stringify(s);
    expect(text).not.toContain('answerKey');
    expect(text).not.toContain('Because');
    expect(s.options.map((o) => o.key)).toEqual(['A', 'B', 'C', 'D']);
  });
});

describe('gradeAttempt', () => {
  const pinned = [q(1, 'A'), q(2, 'B'), q(3, 'C'), q(4, 'D')];

  it('scores one mark per correct answer, with no negative marking', () => {
    const r = gradeAttempt(pinned, [
      { questionRevisionId: U(1), choice: 'A' },
      { questionRevisionId: U(2), choice: 'C' },
      { questionRevisionId: U(3), choice: null },
    ]);
    expect(r).toMatchObject({ score: 1, maxScore: 4, percent: 25 });
    expect(r.questions.find((x) => x.id === U(4))).toMatchObject({ choice: null, correct: false });
  });

  it('rejects answers to questions that are not pinned to the lesson', () => {
    expect(() => gradeAttempt(pinned, [{ questionRevisionId: U(99), choice: 'A' }])).toThrow(CeeApiError);
  });

  it('refuses to grade a lesson with no questions', () => {
    expect(() => gradeAttempt([], [{ questionRevisionId: U(1), choice: 'A' }])).toThrow(CeeApiError);
  });
});

describe('computeCompletion', () => {
  const content = lessonContent();
  const manifest = manifest3d();
  const questions = [
    { id: U(1), objectiveId: U(100) },
    { id: U(2), objectiveId: U(100) },
  ];

  const ev = (type: string, payload: Record<string, unknown> = {}): StoredEvent => ({ type, payload });
  const fullRun: StoredEvent[] = [
    ev('LESSON_OPENED'),
    ev('PLAYER_READY', { mode: '3d' }),
    ev('SECTION_READ', { sectionKey: 'intro' }),
    ev('SEQUENCE_STEP', { sequenceKey: 'tour', stepIndex: 0 }),
    ev('SEQUENCE_STEP', { sequenceKey: 'tour', stepIndex: 1 }),
    ev('SEQUENCE_STEP', { sequenceKey: 'tour', stepIndex: 2 }),
    ev('SEQUENCE_COMPLETED', { sequenceKey: 'tour' }),
  ];
  const passing = { percent: 100, correctById: { [U(1)]: true, [U(2)]: true } };

  it('completes when every rule is met', () => {
    const r = computeCompletion({ content, primaryManifest: manifest, events: fullRun, questions, bestAttempt: passing });
    expect(r).toEqual({ state: 'COMPLETED', objectivesMet: [U(100), U(101)], missing: [] });
  });

  it('does not complete on SEQUENCE_COMPLETED alone without seeing every step', () => {
    const events = fullRun.filter((e) => !(e.type === 'SEQUENCE_STEP' && e.payload.stepIndex === 1));
    const r = computeCompletion({ content, primaryManifest: manifest, events, questions, bestAttempt: passing });
    expect(r.state).toBe('IN_PROGRESS');
    expect(r.missing).toContain('SEQUENCE:tour');
  });

  it('requires the required section but not the optional one', () => {
    const events = fullRun.filter((e) => e.type !== 'SECTION_READ');
    const r = computeCompletion({ content, primaryManifest: manifest, events, questions, bestAttempt: passing });
    expect(r.missing).toEqual(['SECTION:intro']);
  });

  it('requires an attempt, and the minimum score', () => {
    expect(computeCompletion({ content, primaryManifest: manifest, events: fullRun, questions, bestAttempt: null }).missing).toEqual(['ATTEMPT']);
    const low = { percent: 40, correctById: { [U(1)]: true, [U(2)]: false } };
    const r = computeCompletion({ content, primaryManifest: manifest, events: fullRun, questions, bestAttempt: low });
    expect(r.missing).toEqual(['SCORE']);
    expect(r.objectivesMet).toEqual([]);
  });

  it('can be completed through the fallback path', () => {
    const events = fullRun.map((e) => (e.type === 'PLAYER_READY' ? ev('PLAYER_READY', { mode: 'fallback' }) : e));
    events.push(ev('FALLBACK_SHOWN', { reason: 'NO_WEBGL' }));
    expect(computeCompletion({ content, primaryManifest: manifest, events, questions, bestAttempt: passing }).state).toBe('COMPLETED');
  });

  it('gives the same result when events are duplicated', () => {
    const once = computeCompletion({ content, primaryManifest: manifest, events: fullRun, questions, bestAttempt: passing });
    const twice = computeCompletion({ content, primaryManifest: manifest, events: [...fullRun, ...fullRun], questions, bestAttempt: passing });
    expect(twice).toEqual(once);
  });

  it('never completes a lesson whose required sequence is missing from the visual', () => {
    const c = lessonContent({ completion: { requireSequenceKey: 'not-there' } });
    const r = computeCompletion({ content: c, primaryManifest: manifest, events: fullRun, questions: [], bestAttempt: null });
    expect(r.state).toBe('IN_PROGRESS');
    expect(r.missing).toEqual(['SEQUENCE_MISSING_IN_VISUAL:not-there']);
  });

  it('meets an objective only when all its linked questions were right', () => {
    const half = { percent: 50, correctById: { [U(1)]: true, [U(2)]: false } };
    const r = computeCompletion({ content, primaryManifest: manifest, events: fullRun, questions, bestAttempt: half });
    expect(r.state).toBe('COMPLETED'); // 50 ≥ minScorePercent 50
    expect(r.objectivesMet).toEqual([U(101)]); // U(100) has a wrong linked answer
  });
});
