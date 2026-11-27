/**
 * Lesson completion, computed on the server from stored events and the best
 * graded attempt. The client never says "done"; it only reports what happened.
 *
 * A lesson is complete when all of these hold:
 *  1. it was opened, and the visual became ready (3D, diagram or fallback);
 *  2. every required section was read;
 *  3. the required sequence (if any) was stepped through: one SEQUENCE_STEP
 *     for every step index, then SEQUENCE_COMPLETED. The fallback view offers
 *     the same steps as text, so students without 3D can complete it too;
 *  4. if the lesson has questions: an attempt was submitted, and its score
 *     meets minScorePercent when one is set.
 *
 * Limits, stated honestly: events come from the browser, so a modified client
 * can still claim it read a section. What it cannot forge is the score, which
 * is graded here against pinned answer keys. Duplicate events (same id) are
 * rejected by the database and change nothing here: the rules use sets.
 */
import type { LessonContent, VisualAssetManifest } from './schemas';

export interface StoredEvent {
  type: string;
  payload: Record<string, unknown>;
}

export interface AttemptSummary {
  percent: number;
  /** questionRevisionId → answered correctly */
  correctById: Record<string, boolean>;
}

export interface CompletionInput {
  content: LessonContent;
  /** Manifest of the primary visual, when the lesson has one. */
  primaryManifest: VisualAssetManifest | null;
  events: readonly StoredEvent[];
  questions: readonly { id: string; objectiveId: string | null }[];
  bestAttempt: AttemptSummary | null;
}

export interface CompletionResult {
  state: 'IN_PROGRESS' | 'COMPLETED';
  objectivesMet: string[];
  /** What is still missing, as stable codes the UI can explain. */
  missing: string[];
}

export function computeCompletion(input: CompletionInput): CompletionResult {
  const { content, primaryManifest, events, questions, bestAttempt } = input;
  const missing: string[] = [];

  const has = (type: string) => events.some((e) => e.type === type);
  const payloadValues = (type: string, field: string) =>
    new Set(events.filter((e) => e.type === type).map((e) => String(e.payload?.[field] ?? '')));

  // 1. Opened, and the visual was shown in some form.
  if (!has('LESSON_OPENED')) missing.push('OPENED');
  if (primaryManifest && !has('PLAYER_READY')) missing.push('VISUAL_SHOWN');

  // 2. Required sections.
  const read = payloadValues('SECTION_READ', 'sectionKey');
  for (const s of content.sections) {
    if (s.required && !read.has(s.key)) missing.push(`SECTION:${s.key}`);
  }

  // 3. Required sequence, every step seen.
  const seqKey = content.completion.requireSequenceKey;
  if (seqKey) {
    const seq = primaryManifest?.sequences.find((s) => s.key === seqKey);
    if (!seq) {
      // A misconfigured lesson must never complete silently.
      missing.push(`SEQUENCE_MISSING_IN_VISUAL:${seqKey}`);
    } else {
      const seen = new Set(
        events
          .filter((e) => e.type === 'SEQUENCE_STEP' && e.payload?.sequenceKey === seqKey)
          .map((e) => Number(e.payload?.stepIndex))
      );
      const allSteps = seq.steps.every((_, i) => seen.has(i));
      const finished = payloadValues('SEQUENCE_COMPLETED', 'sequenceKey').has(seqKey);
      if (!allSteps || !finished) missing.push(`SEQUENCE:${seqKey}`);
    }
  }

  // 4. Questions.
  if (questions.length > 0) {
    if (!bestAttempt) missing.push('ATTEMPT');
    else if (content.completion.minScorePercent !== undefined && bestAttempt.percent < content.completion.minScorePercent) {
      missing.push('SCORE');
    }
  }

  const state = missing.length === 0 ? 'COMPLETED' : 'IN_PROGRESS';

  // Objectives: met when every question linked to it was answered correctly in
  // the best attempt; objectives with no linked question are met on completion.
  const objectivesMet = content.objectiveIds.filter((objectiveId) => {
    const linked = questions.filter((q) => q.objectiveId === objectiveId);
    if (linked.length === 0) return state === 'COMPLETED';
    return bestAttempt !== null && linked.every((q) => bestAttempt.correctById[q.id] === true);
  });

  return { state, objectivesMet, missing };
}
