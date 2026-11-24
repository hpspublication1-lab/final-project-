'use client';

/**
 * Lesson check-questions. Answers are marked on the server; the correct answer
 * and explanation arrive only in the response to a submission.
 */
import { useRef, useState } from 'react';
import type { StudentQuestion } from '@/lib/cee-visual/grading';
import type { Choice } from '@/lib/cee-visual/schemas';

export interface GradedView {
  score: number;
  maxScore: number;
  percent: number;
  questions: { id: string; choice: string | null; correct: boolean; answerKey: string; rationale: string }[];
}

export default function VisualQuizPanel({
  questions,
  submit,
}: {
  questions: StudentQuestion[];
  /** Sends the answers with the given idempotency key; resolves to the graded result. */
  submit(answers: { questionRevisionId: string; choice: Choice | null }[], idempotencyKey: string): Promise<GradedView>;
}) {
  const [answers, setAnswers] = useState<Record<string, Choice>>({});
  const [result, setResult] = useState<GradedView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  // One key per submission, reused if the same submission is retried after a network error.
  const key = useRef<string | null>(null);

  const choose = (qid: string, c: Choice) => {
    setAnswers((a) => ({ ...a, [qid]: c }));
    key.current = null; // different answers are a different submission
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSending(true);
    key.current ??= `att_${crypto.randomUUID().replace(/-/g, '')}`;
    try {
      const graded = await submit(
        questions.map((q) => ({ questionRevisionId: q.id, choice: answers[q.id] ?? null })),
        key.current
      );
      setResult(graded);
      key.current = null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Your answers weren’t sent. Check your connection and try again.');
    } finally {
      setSending(false);
    }
  };

  const reset = () => {
    setAnswers({});
    setResult(null);
    key.current = null;
  };

  if (questions.length === 0) return null;
  const graded = new Map(result?.questions.map((q) => [q.id, q]));
  const unanswered = questions.filter((q) => !answers[q.id]).length;

  return (
    <section aria-labelledby="quiz-heading" className="rounded-xl border border-border bg-card p-5">
      <h2 id="quiz-heading" className="text-lg font-semibold text-foreground">
        Check your understanding
      </h2>
      {result && (
        <p className="mt-1 text-sm font-medium text-foreground" role="status">
          You scored {result.score} of {result.maxScore}.
        </p>
      )}

      <form onSubmit={onSubmit} className="mt-4 space-y-5">
        {questions.map((q, i) => {
          const g = graded.get(q.id);
          return (
            <fieldset key={q.id} disabled={Boolean(result)} className="space-y-2">
              <legend className="text-sm font-semibold text-foreground">
                {i + 1}. {q.stem}
              </legend>
              {q.options.map((o) => {
                const isKey = g?.answerKey === o.key;
                const picked = (g?.choice ?? answers[q.id]) === o.key;
                const tone = g ? (isKey ? 'border-success bg-success-light' : picked ? 'border-error bg-error-light' : 'border-border') : picked ? 'border-primary' : 'border-border';
                return (
                  <label key={o.key} className={`flex cursor-pointer items-start gap-2 rounded-lg border px-3 py-2 text-sm text-foreground ${tone}`}>
                    <input
                      type="radio"
                      name={q.id}
                      value={o.key}
                      checked={picked}
                      onChange={() => choose(q.id, o.key)}
                      className="mt-0.5 h-4 w-4 accent-[var(--primary)]"
                    />
                    <span>
                      <span className="font-semibold">{o.key}.</span> {o.text}
                      {g && isKey && <span className="ml-2 font-medium text-success">Correct answer</span>}
                      {g && picked && !isKey && <span className="ml-2 font-medium text-error">Your answer</span>}
                    </span>
                  </label>
                );
              })}
              {g && <p className="text-sm text-muted-foreground">{g.rationale}</p>}
            </fieldset>
          );
        })}

        {error && (
          <p className="text-sm font-medium text-error" role="alert">
            {error}
          </p>
        )}

        {result ? (
          <button type="button" onClick={reset} className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted">
            Try again
          </button>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={sending}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-dark disabled:opacity-50"
            >
              {sending ? 'Checking…' : 'Check answers'}
            </button>
            {unanswered > 0 && <span className="text-sm text-muted-foreground">{unanswered} not answered yet</span>}
          </div>
        )}
      </form>
    </section>
  );
}
