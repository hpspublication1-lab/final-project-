'use client';

/**
 * A published visual lesson for a signed-in, enrolled student. The browser
 * only reports what happened; progress shown here always comes back from the
 * server.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import LessonSections from '@/components/visual-player/LessonSections';
import VisualPlayerShell, { type PlayerEventDraft } from '@/components/visual-player/VisualPlayerShell';
import VisualQuizPanel, { type GradedView } from '@/components/visual-player/VisualQuizPanel';
import { describeMissing } from '@/components/visual-player/completionCopy';
import { EventQueue, resultForStatus } from '@/lib/cee-visual/eventQueue';
import type { PlayerEvent, ResolvedVisual } from '@/lib/cee-visual/schemas';
import type { ProgressView, StudentLessonView } from '@/lib/cee-visual/service.server';

const FLUSH_MS = 3000;

export default function VisualLessonClient({
  lesson,
  initialVisual,
  initialProgress,
}: {
  lesson: StudentLessonView;
  initialVisual: ResolvedVisual | null;
  initialProgress: ProgressView;
}) {
  const base = `/api/v1/cee/me/lessons/${lesson.id}`;
  const [progress, setProgress] = useState(initialProgress);
  const [visual, setVisual] = useState(initialVisual);
  const refreshed = useRef(false);

  // Sections read on this visit, plus required sections the server no longer lists as missing.
  // (The server only tracks required sections, so optional ones show as read only once read here.)
  const [readNow, setReadNow] = useState<Set<string>>(new Set());
  const readKeys = useMemo(() => {
    const missing = new Set(progress.missing);
    const s = new Set(readNow);
    for (const sec of lesson.content.sections) if (sec.required && !missing.has(`SECTION:${sec.key}`)) s.add(sec.key);
    return s;
  }, [progress, readNow, lesson.content.sections]);

  const queue = useMemo(
    () =>
      new EventQueue({
        send: async (events: PlayerEvent[]) => {
          const res = await fetch(`${base}/events`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ events }),
          });
          if (res.ok) {
            const body = (await res.json()) as { data: { progress: ProgressView } };
            setProgress(body.data.progress);
          }
          return resultForStatus(res.status);
        },
      }),
    [base]
  );

  const report = useCallback((d: PlayerEventDraft) => queue.push(d), [queue]);

  // Opened, then flush on a timer, and once more as the page goes away.
  useEffect(() => {
    queue.push({ type: 'LESSON_OPENED', payload: {} });
    let timer: number;
    const tick = async () => {
      if (queue.size > 0) await queue.flush();
      timer = window.setTimeout(tick, Math.max(FLUSH_MS, queue.backoffMs));
    };
    timer = window.setTimeout(tick, 500);
    const flushOnHide = () => {
      if (document.visibilityState !== 'hidden' || queue.size === 0) return;
      const events = queue.drain();
      void fetch(`${base}/events`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ events }),
        keepalive: true,
      }).catch(() => undefined);
    };
    document.addEventListener('visibilitychange', flushOnHide);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', flushOnHide);
    };
  }, [queue, base]);

  const onEvent = useCallback(
    (e: PlayerEventDraft) => {
      report(e);
      // Signed URLs last 10 minutes; if the 2D image was opened later than that, fetch fresh ones once.
      if (e.type === 'PLAYER_ERROR' && e.payload.code === 'FALLBACK_LOAD_FAILED' && !refreshed.current) {
        refreshed.current = true;
        void fetch(`/api/v1/cee/lessons/${lesson.id}/manifest`)
          .then((r) => (r.ok ? r.json() : null))
          .then((b) => b?.data?.visual && setVisual(b.data.visual as ResolvedVisual))
          .catch(() => undefined);
      }
    },
    [report, lesson.id]
  );

  const onRead = useCallback(
    (key: string) => {
      setReadNow((s) => new Set(s).add(key));
      report({ type: 'SECTION_READ', payload: { sectionKey: key } });
    },
    [report]
  );

  const submit = useCallback(
    async (answers: { questionRevisionId: string; choice: string | null }[], idempotencyKey: string): Promise<GradedView> => {
      await queue.flush(); // let the server see the latest activity first
      const res = await fetch(`${base}/attempts`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'Idempotency-Key': idempotencyKey },
        body: JSON.stringify({ answers }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error?.message ?? 'Your answers weren’t sent. Try again.');
      setProgress(body.data.progress as ProgressView);
      return body.data as GradedView;
    },
    [base, queue]
  );

  const complete = progress.state === 'COMPLETED';

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <header className="max-w-3xl">
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{lesson.title}</h1>
        <p className="mt-2 text-muted-foreground">{lesson.content.summary}</p>
      </header>

      {visual ? (
        <div className="mt-6">
          <VisualPlayerShell visual={visual} onEvent={onEvent} serverCompleted={complete} />
        </div>
      ) : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex flex-col gap-6">
          <LessonSections content={lesson.content} readKeys={readKeys} onRead={onRead} />
          <VisualQuizPanel questions={lesson.questions} submit={submit} />
        </div>
        <aside>
          <section aria-live="polite" className="rounded-xl border border-border bg-card p-4 lg:sticky lg:top-24">
            <h2 className="text-sm font-semibold text-foreground">Your progress</h2>
            {complete ? (
              <p className="mt-2 text-sm font-medium text-success">Lesson complete.</p>
            ) : (
              <>
                <p className="mt-2 text-sm text-muted-foreground">To finish this lesson:</p>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-foreground">
                  {progress.missing.map((m) => (
                    <li key={m}>{describeMissing(m, lesson.content, visual?.manifest ?? null)}</li>
                  ))}
                </ul>
              </>
            )}
            {progress.bestScorePercent !== null && (
              <p className="mt-3 text-sm text-muted-foreground">Best score: {Math.round(progress.bestScorePercent)}%</p>
            )}
          </section>
        </aside>
      </div>
    </main>
  );
}
