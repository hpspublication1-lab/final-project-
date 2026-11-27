'use client';

/**
 * The visual player. Owns the player state machine and everything a student
 * can do with a visual: pick parts, switch layers, step through the guided
 * tour, switch between 3D and the 2D diagram. Every one of those is also
 * reachable by keyboard and screen reader, and every objective can be reached
 * without WebGL (the fallback is never a dead end).
 *
 * It reports what happened through `onEvent`; it never decides completion.
 */
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { initialPlayerState, playerReducer, shows3D, showsFallback, type FallbackReason } from '@/lib/cee-visual/playerMachine';
import type { PlayerEventType, ResolvedVisual } from '@/lib/cee-visual/schemas';
import type { CameraPose, Model3DRendererProps } from './Model3DRenderer';

const Model3DRenderer = dynamic<Model3DRendererProps>(() => import('./Model3DRenderer'), { ssr: false });

export interface PlayerEventDraft {
  type: PlayerEventType;
  payload: Record<string, unknown>;
  assetVersionId?: string;
}

export interface VisualPlayerShellProps {
  visual: ResolvedVisual;
  onEvent?(event: PlayerEventDraft): void;
  /** Set when the server has confirmed the lesson is complete. */
  serverCompleted?: boolean;
  /** Lab only: behave as if the device had no WebGL. */
  forceNoWebGL?: boolean;
  onDebugReady?(api: { loseContext(): void }): void;
}

const LOAD_TIMEOUT_MS = 30_000;
const RECOVERY_TIMEOUT_MS = 8_000;
const MIN_STEP_MS = 3_000;

function detectWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = (canvas.getContext('webgl2') || canvas.getContext('webgl')) as WebGLRenderingContext | null;
    if (!gl) return false;
    gl.getExtension('WEBGL_lose_context')?.loseContext(); // free the probe context
    return true;
  } catch {
    return false;
  }
}

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return reduced;
}

const FALLBACK_COPY: Record<FallbackReason, string> = {
  NO_WEBGL: 'This device can’t show 3D, so you’re seeing the 2D diagram. Everything in the lesson works here too.',
  LOAD_FAILED: 'The 3D model didn’t load, so you’re seeing the 2D diagram. Everything in the lesson works here too.',
  CONTEXT_LOST: 'The 3D view stopped working on this device, so you’re seeing the 2D diagram. Everything in the lesson works here too.',
  USER_CHOICE: 'You’re viewing the 2D diagram.',
};

export default function VisualPlayerShell({ visual, onEvent, serverCompleted, forceNoWebGL, onDebugReady }: VisualPlayerShellProps) {
  const { manifest } = visual;
  const [state, dispatch] = useReducer(playerReducer, initialPlayerState);
  const reducedMotion = useReducedMotion();
  const [progress, setProgress] = useState<number | null>(null);
  const [rendererKey, setRendererKey] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const emit = useCallback(
    (type: PlayerEventType, payload: Record<string, unknown> = {}) => onEvent?.({ type, payload, assetVersionId: visual.assetVersionId }),
    [onEvent, visual.assetVersionId]
  );

  // ── Open ────────────────────────────────────────────────────────────────
  const mode = manifest.kind === 'MODEL_3D' ? '3d' : 'diagram';
  const supported = manifest.kind === 'MODEL_3D' || manifest.kind === 'DIAGRAM_2D';
  const hasFallback = manifest.kind === 'MODEL_3D' && Boolean(visual.fallbackUrl);

  useEffect(() => {
    if (!supported) return;
    const webgl = !forceNoWebGL && detectWebGL();
    dispatch({ type: 'OPEN', webgl, mode, hasFallback });
    // OPEN is ignored after the first time, so re-running is harmless.
  }, [supported, forceNoWebGL, mode, hasFallback]);

  // ── Events for state changes ────────────────────────────────────────────
  const reported = useRef<{ ready?: string; fallback?: string; error?: string }>({});
  useEffect(() => {
    if (state.name === 'READY' && reported.current.ready !== 'live') {
      reported.current.ready = 'live';
      emit('PLAYER_READY', { mode: state.mode === '3d' ? '3d' : 'diagram' });
    }
    if (state.name === 'FALLBACK' && state.fallbackReason && reported.current.fallback !== state.fallbackReason) {
      reported.current.fallback = state.fallbackReason;
      emit('FALLBACK_SHOWN', { reason: state.fallbackReason });
      emit('PLAYER_READY', { mode: 'fallback' });
    }
    if (state.name === 'ERROR' && state.errorCode && reported.current.error !== state.errorCode) {
      reported.current.error = state.errorCode;
      emit('PLAYER_ERROR', { code: state.errorCode.replace(/[^A-Z_]/g, '_').slice(0, 64) || 'UNKNOWN' });
    }
  }, [state.name, state.mode, state.fallbackReason, state.errorCode, emit]);

  // A load error moves on to the fallback straight away.
  useEffect(() => {
    if (state.name === 'ERROR' && state.hasFallback) dispatch({ type: 'SHOW_FALLBACK', reason: 'LOAD_FAILED' });
  }, [state.name, state.hasFallback]);

  // Timeouts for loading and recovering.
  useEffect(() => {
    if (state.name === 'LOADING') {
      const t = window.setTimeout(() => dispatch({ type: 'LOAD_FAILED', code: 'TIMEOUT' }), LOAD_TIMEOUT_MS);
      return () => window.clearTimeout(t);
    }
    if (state.name === 'RECOVERING' || state.name === 'CONTEXT_LOST') {
      const t = window.setTimeout(() => dispatch({ type: 'RECOVERY_TIMEOUT' }), RECOVERY_TIMEOUT_MS);
      return () => window.clearTimeout(t);
    }
  }, [state.name]);

  // After the context comes back, remount the renderer on a fresh canvas.
  useEffect(() => {
    if (state.name === 'RECOVERING') setRendererKey((k) => k + 1);
  }, [state.name]);

  useEffect(() => {
    if (serverCompleted) dispatch({ type: 'SERVER_COMPLETED' });
  }, [serverCompleted, state.name]);

  // Interacting → ready after a pause.
  const idleTimer = useRef<number | undefined>(undefined);
  const onInteract = useCallback(() => {
    dispatch({ type: 'INPUT' });
    window.clearTimeout(idleTimer.current);
    idleTimer.current = window.setTimeout(() => dispatch({ type: 'IDLE' }), 1500);
  }, []);
  useEffect(() => () => window.clearTimeout(idleTimer.current), []);

  // ── Layers ──────────────────────────────────────────────────────────────
  const layers = useMemo(() => manifest.model?.layers ?? [], [manifest.model]);
  const defaultLayers = useMemo(() => new Set(layers.filter((l) => l.visibleByDefault).map((l) => l.key)), [layers]);
  const [visibleLayers, setVisibleLayers] = useState<ReadonlySet<string>>(defaultLayers);
  const toggleLayer = (key: string) => {
    setVisibleLayers((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // ── Parts ───────────────────────────────────────────────────────────────
  const selected = manifest.hotspots.find((h) => h.id === selectedId) ?? null;
  const select = useCallback(
    (id: string) => {
      setSelectedId((prev) => (prev === id ? null : id));
      if (id !== selectedId) emit('STRUCTURE_SELECTED', { hotspotId: id });
    },
    [emit, selectedId]
  );

  // ── Guided tour ─────────────────────────────────────────────────────────
  const sequence = manifest.sequences[0] ?? null;
  const [stepIndex, setStepIndex] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [cameraNonce, setCameraNonce] = useState(0);
  const seenSteps = useRef(new Set<number>());
  const completedSeq = useRef(false);
  const step = sequence && stepIndex !== null ? sequence.steps[stepIndex] : null;

  const goToStep = useCallback(
    (i: number) => {
      if (!sequence) return;
      const idx = Math.max(0, Math.min(sequence.steps.length - 1, i));
      const st = sequence.steps[idx];
      setStepIndex(idx);
      setVisibleLayers(st.visibleLayers ? new Set(st.visibleLayers) : defaultLayers);
      setCameraNonce((n) => n + 1);
      if (!seenSteps.current.has(idx)) {
        seenSteps.current.add(idx);
        emit('SEQUENCE_STEP', { sequenceKey: sequence.key, stepIndex: idx });
      }
      if (!completedSeq.current && seenSteps.current.size === sequence.steps.length) {
        completedSeq.current = true;
        emit('SEQUENCE_COMPLETED', { sequenceKey: sequence.key });
      }
    },
    [sequence, defaultLayers, emit]
  );

  useEffect(() => {
    if (!playing || !sequence || stepIndex === null) return;
    if (stepIndex >= sequence.steps.length - 1) {
      setPlaying(false);
      return;
    }
    const gap = Math.max(MIN_STEP_MS, sequence.steps[stepIndex + 1].atMs - sequence.steps[stepIndex].atMs);
    const t = window.setTimeout(() => goToStep(stepIndex + 1), gap);
    return () => window.clearTimeout(t);
  }, [playing, stepIndex, sequence, goToStep]);

  useEffect(() => {
    if (reducedMotion) setPlaying(false);
  }, [reducedMotion]);

  const highlight = useMemo(() => step?.highlight ?? [], [step]);
  const cameraPose: CameraPose | null = step?.camera ?? manifest.model?.initialCamera ?? null;

  // Esc clears the selected part.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setSelectedId(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // ── Render ──────────────────────────────────────────────────────────────
  const in3D = shows3D(state);
  const inFallback = showsFallback(state);
  const imageUrl = manifest.kind === 'DIAGRAM_2D' ? (state.name === 'ERROR' ? undefined : visual.diagramUrl) : inFallback ? visual.fallbackUrl : undefined;
  const loading = state.name === 'LOADING' || state.name === 'RECOVERING';

  if (!supported) {
    return (
      <section className="rounded-xl border border-border bg-card p-5" aria-label="Visual">
        <p className="font-semibold text-foreground">This kind of visual can’t be shown here yet.</p>
        <p className="mt-2 text-sm text-muted-foreground">{manifest.accessibility.description}</p>
      </section>
    );
  }

  return (
    <section
      aria-label={`Visual: ${manifest.title}`}
      data-player-state={state.name}
      data-player-fallback={state.fallbackReason ?? undefined}
      className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]"
    >
      <div className="min-w-0">
        {visual.fixtureNotice && (
          <p className="mb-2 rounded-lg border border-warning bg-warning-light px-3 py-2 text-sm font-medium text-foreground">
            {visual.fixtureNotice}
          </p>
        )}

        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-border bg-muted" onPointerDown={in3D ? onInteract : undefined}>
          {in3D && visual.modelUrl && (
            <div role="img" aria-label={manifest.accessibility.description} className="absolute inset-0 touch-none">
              <Model3DRenderer
                key={rendererKey}
                url={visual.modelUrl}
                manifest={manifest}
                visibleLayers={visibleLayers}
                highlight={highlight}
                selectedHotspotId={selectedId}
                camera={cameraPose}
                cameraNonce={cameraNonce}
                reducedMotion={reducedMotion}
                onLoaded={() => {
                  // Each is ignored unless it applies, so sending both is safe and avoids a stale state read.
                  dispatch({ type: 'LOADED' });
                  dispatch({ type: 'RECOVERED' });
                }}
                onProgress={setProgress}
                onError={(code) => dispatch({ type: 'LOAD_FAILED', code })}
                onSelectHotspot={select}
                onContextLost={() => dispatch({ type: 'CONTEXT_LOST' })}
                onContextRestored={() => dispatch({ type: 'CONTEXT_RESTORED' })}
                onInteract={onInteract}
                onDebugReady={onDebugReady}
              />
            </div>
          )}

          {imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- signed, short-lived URL; next/image would proxy and cache it
            <img
              src={imageUrl}
              alt={manifest.accessibility.description}
              className="absolute inset-0 h-full w-full object-contain"
              onLoad={() => manifest.kind === 'DIAGRAM_2D' && dispatch({ type: 'LOADED' })}
              onError={() => (manifest.kind === 'DIAGRAM_2D' ? dispatch({ type: 'LOAD_FAILED', code: 'IMAGE_FAILED' }) : emit('PLAYER_ERROR', { code: 'FALLBACK_LOAD_FAILED' }))}
            />
          )}

          {loading && (
            <div className="absolute inset-0 grid place-items-center bg-muted" role="status" aria-live="polite">
              <p className="text-sm font-medium text-muted-foreground">
                {state.name === 'RECOVERING' ? 'Restoring the 3D view…' : progress !== null ? `Loading the 3D model… ${Math.round(progress * 100)}%` : 'Loading the 3D model…'}
              </p>
            </div>
          )}

          {state.name === 'CONTEXT_LOST' && (
            <div className="absolute inset-0 grid place-items-center bg-muted" role="status" aria-live="polite">
              <p className="text-sm font-medium text-muted-foreground">The 3D view paused. Restoring it…</p>
            </div>
          )}

          {state.name === 'ERROR' && !state.hasFallback && (
            <div className="absolute inset-0 grid place-items-center bg-muted p-6 text-center" role="alert">
              <div>
                <p className="font-semibold text-foreground">The visual couldn’t be shown.</p>
                <p className="mt-2 text-sm text-muted-foreground">{manifest.accessibility.description}</p>
              </div>
            </div>
          )}

          {step && (
            <p className="absolute inset-x-3 bottom-3 rounded-lg bg-[rgba(9,13,26,0.82)] px-3 py-2 text-sm text-white" aria-hidden="true">
              {step.caption}
            </p>
          )}
        </div>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm">
          <p className="text-muted-foreground" role="status" aria-live="polite">
            {state.name === 'FALLBACK' && state.fallbackReason ? FALLBACK_COPY[state.fallbackReason] : in3D ? 'Drag to rotate. Scroll or pinch to zoom.' : ''}
          </p>
          {manifest.kind === 'MODEL_3D' && hasFallback && (in3D || (state.name === 'FALLBACK' && state.fallbackReason === 'USER_CHOICE' && state.webgl)) && (
            <button
              type="button"
              className="rounded-lg border border-border px-3 py-1.5 font-medium text-foreground hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
              onClick={() => dispatch(in3D ? { type: 'SHOW_FALLBACK', reason: 'USER_CHOICE' } : { type: 'TRY_3D' })}
            >
              {in3D ? 'Show 2D diagram' : 'Show 3D model'}
            </button>
          )}
        </div>
      </div>

      <aside className="flex flex-col gap-4">
        {manifest.hotspots.length > 0 && (
          <section aria-labelledby="vp-parts" className="rounded-xl border border-border bg-card p-4">
            <h3 id="vp-parts" className="text-sm font-semibold text-foreground">
              Parts
            </h3>
            <ul className="mt-2 flex flex-wrap gap-2">
              {manifest.hotspots.map((h) => (
                <li key={h.id}>
                  <button
                    type="button"
                    aria-pressed={selectedId === h.id}
                    onClick={() => select(h.id)}
                    className={`rounded-full border px-3 py-1 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
                      selectedId === h.id ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-foreground hover:bg-muted'
                    }`}
                  >
                    {h.label}
                  </button>
                </li>
              ))}
            </ul>
            <div aria-live="polite" className="mt-3 min-h-[2.5rem] text-sm">
              {selected ? (
                <p>
                  <span className="font-semibold text-foreground">{selected.label}. </span>
                  <span className="text-muted-foreground">{selected.explanation ?? ''}</span>
                </p>
              ) : (
                <p className="text-muted-foreground">Choose a part to learn about it.</p>
              )}
            </div>
          </section>
        )}

        {layers.length > 0 && (
          <section aria-labelledby="vp-layers" className="rounded-xl border border-border bg-card p-4">
            <h3 id="vp-layers" className="text-sm font-semibold text-foreground">
              Layers
            </h3>
            {in3D ? (
              <ul className="mt-2 space-y-1.5">
                {layers.map((l) => (
                  <li key={l.key}>
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
                      <input type="checkbox" className="h-4 w-4 accent-[var(--primary)]" checked={visibleLayers.has(l.key)} onChange={() => toggleLayer(l.key)} />
                      {l.label}
                    </label>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">Layers can be switched in the 3D view. The diagram shows every part.</p>
            )}
          </section>
        )}

        {sequence && (
          <section aria-labelledby="vp-tour" className="rounded-xl border border-border bg-card p-4">
            <h3 id="vp-tour" className="text-sm font-semibold text-foreground">
              {sequence.title}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {stepIndex === null ? `${sequence.steps.length} steps` : `Step ${stepIndex + 1} of ${sequence.steps.length}`}
            </p>
            <p aria-live="polite" className="mt-2 min-h-[2.5rem] text-sm text-foreground">
              {step ? step.caption : 'Start the tour to see each step.'}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {stepIndex === null ? (
                <button
                  type="button"
                  onClick={() => goToStep(0)}
                  className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  Start tour
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    disabled={stepIndex === 0}
                    onClick={() => goToStep(stepIndex - 1)}
                    className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={stepIndex >= sequence.steps.length - 1}
                    onClick={() => goToStep(stepIndex + 1)}
                    className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary-dark disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    Next
                  </button>
                  {!reducedMotion && in3D && (
                    <button
                      type="button"
                      aria-pressed={playing}
                      onClick={() => setPlaying((p) => !p)}
                      disabled={stepIndex >= sequence.steps.length - 1 && !playing}
                      className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                    >
                      {playing ? 'Pause' : 'Play'}
                    </button>
                  )}
                </>
              )}
            </div>
          </section>
        )}

        <details className="rounded-xl border border-border bg-card p-4 text-sm">
          <summary className="cursor-pointer font-semibold text-foreground">Text description</summary>
          <p className="mt-2 text-muted-foreground">{manifest.accessibility.description}</p>
        </details>
      </aside>
    </section>
  );
}
