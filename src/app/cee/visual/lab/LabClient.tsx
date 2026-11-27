'use client';

/**
 * Player lab: exercises the visual player end to end with the development
 * fixture, without a database. Events stay on this page, and completion is
 * computed here with the same function the server uses, so testers can see
 * exactly what a real lesson would record.
 */
import { useCallback, useMemo, useRef, useState } from 'react';
import LessonSections from '@/components/visual-player/LessonSections';
import VisualPlayerShell, { type PlayerEventDraft } from '@/components/visual-player/VisualPlayerShell';
import { describeMissing } from '@/components/visual-player/completionCopy';
import { computeCompletion } from '@/lib/cee-visual/completion';
import { fixtureLesson, fixtureManifest, fixtureVisual } from '@/lib/cee-visual/devFixture';

interface Logged extends PlayerEventDraft {
  at: string;
}

export default function LabClient() {
  const [noWebGL, setNoWebGL] = useState(false);
  const [run, setRun] = useState(0);
  const [events, setEvents] = useState<Logged[]>([{ type: 'LESSON_OPENED', payload: {}, at: new Date().toISOString() }]);
  const debug = useRef<{ loseContext(): void } | null>(null);
  const [canLoseContext, setCanLoseContext] = useState(false);

  const onEvent = useCallback((e: PlayerEventDraft) => setEvents((prev) => [...prev, { ...e, at: new Date().toISOString() }]), []);
  const readKeys = useMemo(
    () => new Set(events.filter((e) => e.type === 'SECTION_READ').map((e) => String(e.payload.sectionKey))),
    [events]
  );
  const onRead = useCallback((key: string) => onEvent({ type: 'SECTION_READ', payload: { sectionKey: key } }), [onEvent]);

  const completion = useMemo(
    () =>
      computeCompletion({
        content: fixtureLesson,
        primaryManifest: fixtureManifest,
        events: events.map((e) => ({ type: e.type, payload: e.payload })),
        questions: [],
        bestAttempt: null,
      }),
    [events]
  );

  const restart = (opts: { noWebGL: boolean }) => {
    setNoWebGL(opts.noWebGL);
    setEvents([{ type: 'LESSON_OPENED', payload: {}, at: new Date().toISOString() }]);
    setCanLoseContext(false);
    debug.current = null;
    setRun((r) => r + 1);
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <header className="max-w-3xl">
        <h1 className="text-2xl font-bold text-foreground">Visual player lab</h1>
        <p className="mt-2 text-muted-foreground">
          A test page for the CEE visual player, using geometric shapes instead of real lesson content. It is only available on preview
          deployments. Nothing here is saved.
        </p>
      </header>

      <div className="mt-6 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4 text-sm">
        <label className="flex items-center gap-2 text-foreground">
          <input type="checkbox" className="h-4 w-4 accent-[var(--primary)]" checked={noWebGL} onChange={(e) => restart({ noWebGL: e.target.checked })} />
          Act like a device without 3D
        </label>
        <button
          type="button"
          disabled={!canLoseContext || noWebGL}
          onClick={() => debug.current?.loseContext()}
          className="rounded-lg border border-border px-3 py-1.5 font-medium text-foreground hover:bg-muted disabled:opacity-40"
        >
          Simulate the 3D view crashing
        </button>
        <button type="button" onClick={() => restart({ noWebGL })} className="rounded-lg border border-border px-3 py-1.5 font-medium text-foreground hover:bg-muted">
          Start over
        </button>
      </div>

      <div className="mt-6">
        <VisualPlayerShell
          key={run}
          visual={fixtureVisual}
          forceNoWebGL={noWebGL}
          onEvent={onEvent}
          serverCompleted={completion.state === 'COMPLETED'}
          onDebugReady={(api) => {
            debug.current = api;
            setCanLoseContext(true);
          }}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <LessonSections content={fixtureLesson} readKeys={readKeys} onRead={onRead} />

        <aside className="flex flex-col gap-4">
          <section className="rounded-xl border border-border bg-card p-4" aria-live="polite">
            <h2 className="text-sm font-semibold text-foreground">Completion</h2>
            {completion.state === 'COMPLETED' ? (
              <p className="mt-2 text-sm font-medium text-success">Complete. A real lesson would now record this on the server.</p>
            ) : (
              <>
                <p className="mt-2 text-sm text-muted-foreground">Still to do:</p>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-foreground">
                  {completion.missing.map((m) => (
                    <li key={m}>{describeMissing(m, fixtureLesson, fixtureManifest)}</li>
                  ))}
                </ul>
              </>
            )}
          </section>

          <section className="rounded-xl border border-border bg-card p-4">
            <h2 className="text-sm font-semibold text-foreground">Events this page would send ({events.length})</h2>
            <ol className="mt-2 max-h-80 space-y-1 overflow-auto font-mono text-xs text-muted-foreground">
              {events.map((e, i) => (
                <li key={i}>
                  <span className="text-foreground">{e.type}</span> {Object.keys(e.payload).length > 0 ? JSON.stringify(e.payload) : ''}
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </div>
    </main>
  );
}
