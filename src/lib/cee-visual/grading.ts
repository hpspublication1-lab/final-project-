/**
 * MCQ marking for visual lessons, done only on the server.
 *
 * Lesson check-questions are formative: one mark per correct answer, no
 * negative marking, unanswered counts as not correct. Questions are graded
 * against the exact revisions pinned to the published lesson revision.
 *
 * Before submission a student only ever receives `toStudentQuestion()`, which
 * drops the answer key and rationale.
 */
import type { Choice } from './schemas';
import { CeeApiError } from './http';

export interface PinnedQuestion {
  id: string; // cee_question_revisions.id
  stem: string;
  options: readonly string[]; // exactly 4, shown as A–D
  answerKey: Choice;
  rationale: string;
  objectiveId: string | null;
  sortKey: number;
}

export interface StudentQuestion {
  id: string;
  stem: string;
  options: { key: Choice; text: string }[];
}

const KEYS: readonly Choice[] = ['A', 'B', 'C', 'D'];

export function toStudentQuestion(q: PinnedQuestion): StudentQuestion {
  return {
    id: q.id,
    stem: q.stem,
    options: q.options.slice(0, 4).map((text, i) => ({ key: KEYS[i], text })),
  };
}

export interface GradedQuestion {
  id: string;
  choice: Choice | null;
  correct: boolean;
  answerKey: Choice;
  rationale: string;
  objectiveId: string | null;
}

export interface GradeResult {
  score: number;
  maxScore: number;
  percent: number;
  questions: GradedQuestion[];
}

export function gradeAttempt(
  pinned: readonly PinnedQuestion[],
  answers: readonly { questionRevisionId: string; choice: Choice | null }[]
): GradeResult {
  if (pinned.length === 0) throw new CeeApiError('NOT_FOUND', 'This lesson has no questions.');

  const byId = new Map(pinned.map((q) => [q.id, q]));
  const unknown = answers.filter((a) => !byId.has(a.questionRevisionId)).map((a) => a.questionRevisionId);
  if (unknown.length > 0) {
    throw new CeeApiError('INVALID_REQUEST', 'Some answers are for questions that are not in this lesson.', {
      unknownQuestionIds: unknown.slice(0, 20),
    });
  }

  const chosen = new Map(answers.map((a) => [a.questionRevisionId, a.choice]));
  const ordered = [...pinned].sort((a, b) => a.sortKey - b.sortKey || a.id.localeCompare(b.id));
  const questions: GradedQuestion[] = ordered.map((q) => {
    const choice = chosen.get(q.id) ?? null;
    return {
      id: q.id,
      choice,
      correct: choice !== null && choice === q.answerKey,
      answerKey: q.answerKey,
      rationale: q.rationale,
      objectiveId: q.objectiveId,
    };
  });

  const score = questions.filter((q) => q.correct).length;
  const maxScore = questions.length;
  return { score, maxScore, percent: Math.round((score / maxScore) * 10000) / 100, questions };
}
