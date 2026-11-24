/**
 * Visual player state machine. A pure reducer, so every transition in
 * docs/cee-visual/TARGET_ARCHITECTURE.md §8 is unit-tested.
 *
 *   IDLE → LOADING → READY ⇄ INTERACTING
 *   LOADING → ERROR → FALLBACK           (load, parse or validation failed)
 *   OPEN without WebGL → FALLBACK         (straight to the 2D path)
 *   READY/INTERACTING → CONTEXT_LOST → RECOVERING → READY
 *   a second context loss, or recovery timing out → FALLBACK
 *   READY/INTERACTING/FALLBACK → COMPLETED (only when the server confirms)
 *
 * Events that don't apply in the current state are ignored, never thrown.
 */

export type VisualMode = '3d' | 'diagram';
export type FallbackReason = 'NO_WEBGL' | 'LOAD_FAILED' | 'CONTEXT_LOST' | 'USER_CHOICE';

export type PlayerStateName =
  | 'IDLE'
  | 'LOADING'
  | 'READY'
  | 'INTERACTING'
  | 'CONTEXT_LOST'
  | 'RECOVERING'
  | 'ERROR'
  | 'FALLBACK'
  | 'COMPLETED';

export interface PlayerState {
  name: PlayerStateName;
  mode: VisualMode | null;
  fallbackReason: FallbackReason | null;
  errorCode: string | null;
  /** Context losses since opening; the second one ends in the fallback. */
  contextLosses: number;
  hasFallback: boolean;
  webgl: boolean;
}

export type PlayerAction =
  | { type: 'OPEN'; webgl: boolean; mode: VisualMode; hasFallback: boolean }
  | { type: 'LOADED' }
  | { type: 'LOAD_FAILED'; code: string }
  | { type: 'SHOW_FALLBACK'; reason: FallbackReason }
  | { type: 'TRY_3D' }
  | { type: 'INPUT' }
  | { type: 'IDLE' }
  | { type: 'CONTEXT_LOST' }
  | { type: 'CONTEXT_RESTORED' }
  | { type: 'RECOVERED' }
  | { type: 'RECOVERY_TIMEOUT' }
  | { type: 'SERVER_COMPLETED' };

export const initialPlayerState: PlayerState = {
  name: 'IDLE',
  mode: null,
  fallbackReason: null,
  errorCode: null,
  contextLosses: 0,
  hasFallback: false,
  webgl: false,
};

const toFallback = (s: PlayerState, reason: FallbackReason): PlayerState =>
  s.hasFallback ? { ...s, name: 'FALLBACK', fallbackReason: reason } : { ...s, name: 'ERROR', errorCode: s.errorCode ?? reason };

export function playerReducer(s: PlayerState, a: PlayerAction): PlayerState {
  switch (a.type) {
    case 'OPEN': {
      if (s.name !== 'IDLE') return s;
      const next: PlayerState = { ...initialPlayerState, mode: a.mode, hasFallback: a.hasFallback, webgl: a.webgl };
      if (a.mode === '3d' && !a.webgl) return toFallback(next, 'NO_WEBGL');
      return { ...next, name: 'LOADING' };
    }
    case 'LOADED':
      return s.name === 'LOADING' ? { ...s, name: 'READY', errorCode: null } : s;
    case 'LOAD_FAILED':
      return s.name === 'LOADING' || s.name === 'RECOVERING' ? { ...s, name: 'ERROR', errorCode: a.code } : s;
    case 'SHOW_FALLBACK':
      if (s.name === 'ERROR' || s.name === 'READY' || s.name === 'INTERACTING' || s.name === 'LOADING') {
        return toFallback(s, a.reason);
      }
      return s;
    case 'TRY_3D':
      // Only a student who chose the fallback, on a device with WebGL, may go back.
      return s.name === 'FALLBACK' && s.fallbackReason === 'USER_CHOICE' && s.webgl && s.mode === '3d'
        ? { ...s, name: 'LOADING', fallbackReason: null }
        : s;
    case 'INPUT':
      return s.name === 'READY' ? { ...s, name: 'INTERACTING' } : s;
    case 'IDLE':
      return s.name === 'INTERACTING' ? { ...s, name: 'READY' } : s;
    case 'CONTEXT_LOST': {
      if (s.name === 'READY' || s.name === 'INTERACTING' || s.name === 'LOADING') {
        const losses = s.contextLosses + 1;
        return losses >= 2 ? toFallback({ ...s, contextLosses: losses }, 'CONTEXT_LOST') : { ...s, name: 'CONTEXT_LOST', contextLosses: losses };
      }
      if (s.name === 'RECOVERING') return toFallback({ ...s, contextLosses: s.contextLosses + 1 }, 'CONTEXT_LOST');
      return s;
    }
    case 'CONTEXT_RESTORED':
      return s.name === 'CONTEXT_LOST' ? { ...s, name: 'RECOVERING' } : s;
    case 'RECOVERED':
      return s.name === 'RECOVERING' ? { ...s, name: 'READY' } : s;
    case 'RECOVERY_TIMEOUT':
      return s.name === 'RECOVERING' || s.name === 'CONTEXT_LOST' ? toFallback(s, 'CONTEXT_LOST') : s;
    case 'SERVER_COMPLETED':
      return s.name === 'READY' || s.name === 'INTERACTING' || s.name === 'FALLBACK' ? { ...s, name: 'COMPLETED' } : s;
  }
}

/** Whether the 3D canvas should be mounted in this state. */
export function shows3D(s: PlayerState): boolean {
  if (s.mode !== '3d') return false;
  if (s.name === 'COMPLETED') return s.fallbackReason === null; // completed in 3D: keep the model on screen
  return ['LOADING', 'READY', 'INTERACTING', 'CONTEXT_LOST', 'RECOVERING'].includes(s.name);
}

/** Whether the 2D fallback should be shown in this state. */
export function showsFallback(s: PlayerState): boolean {
  return s.name === 'FALLBACK' || (s.name === 'COMPLETED' && s.fallbackReason !== null);
}
