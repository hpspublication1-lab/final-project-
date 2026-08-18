'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Anti-cheat monitor for competitive battles and graded exams. Detects the
 * common client-side cheating signals — leaving the tab/window, copy/paste,
 * right-click, and implausibly fast answers — and reports them via a callback
 * so the caller can warn, log to the DB, or auto-forfeit.
 *
 * This is a deterrent layer, not a guarantee: it runs in the browser and can
 * be bypassed by a determined attacker. Pair it with the server-side exam
 * grading (grade_exam_attempt) so the answer key never reaches the client.
 */

export type CheatEventType =
  | 'tab_switch'
  | 'window_blur'
  | 'copy'
  | 'paste'
  | 'cut'
  | 'context_menu'
  | 'fast_response';

export interface CheatViolation {
  type: CheatEventType;
  at: number; // Date.now()
  detail?: string;
}

interface UseAntiCheatOptions {
  enabled?: boolean;
  /** Called on every violation. */
  onViolation?: (violation: CheatViolation, total: number) => void;
  /**
   * Answers faster than this (ms) are flagged as 'fast_response' — a heuristic
   * for automation / answer-sharing. Default 800ms.
   */
  minResponseMs?: number;
  /** Block the context menu (right-click) entirely while enabled. Default true. */
  blockContextMenu?: boolean;
}

interface UseAntiCheatReturn {
  violations: CheatViolation[];
  counts: Record<CheatEventType, number>;
  totalViolations: number;
  /** Call when the user submits an answer; pass the ms since the question appeared. */
  recordResponse: (latencyMs: number) => void;
  reset: () => void;
}

const EMPTY_COUNTS: Record<CheatEventType, number> = {
  tab_switch: 0,
  window_blur: 0,
  copy: 0,
  paste: 0,
  cut: 0,
  context_menu: 0,
  fast_response: 0,
};

export function useAntiCheat({
  enabled = true,
  onViolation,
  minResponseMs = 800,
  blockContextMenu = true,
}: UseAntiCheatOptions = {}): UseAntiCheatReturn {
  const [violations, setViolations] = useState<CheatViolation[]>([]);
  const [counts, setCounts] = useState<Record<CheatEventType, number>>({ ...EMPTY_COUNTS });
  const onViolationRef = useRef(onViolation);
  const totalRef = useRef(0);

  useEffect(() => {
    onViolationRef.current = onViolation;
  }, [onViolation]);

  const report = useCallback((type: CheatEventType, detail?: string) => {
    const v: CheatViolation = { type, at: Date.now(), detail };
    totalRef.current += 1;
    setViolations((prev) => [...prev, v]);
    setCounts((prev) => ({ ...prev, [type]: prev[type] + 1 }));
    onViolationRef.current?.(v, totalRef.current);
  }, []);

  const recordResponse = useCallback((latencyMs: number) => {
    if (enabled && latencyMs >= 0 && latencyMs < minResponseMs) {
      report('fast_response', `${Math.round(latencyMs)}ms`);
    }
  }, [enabled, minResponseMs, report]);

  const reset = useCallback(() => {
    totalRef.current = 0;
    setViolations([]);
    setCounts({ ...EMPTY_COUNTS });
  }, []);

  useEffect(() => {
    if (!enabled || typeof document === 'undefined') return;

    const onVisibility = () => {
      if (document.hidden) report('tab_switch');
    };
    const onBlur = () => report('window_blur');
    const onCopy = () => report('copy');
    const onPaste = () => report('paste');
    const onCut = () => report('cut');
    const onContextMenu = (e: Event) => {
      if (blockContextMenu) e.preventDefault();
      report('context_menu');
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', onBlur);
    document.addEventListener('copy', onCopy);
    document.addEventListener('paste', onPaste);
    document.addEventListener('cut', onCut);
    document.addEventListener('contextmenu', onContextMenu);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('copy', onCopy);
      document.removeEventListener('paste', onPaste);
      document.removeEventListener('cut', onCut);
      document.removeEventListener('contextmenu', onContextMenu);
    };
  }, [enabled, blockContextMenu, report]);

  return {
    violations,
    counts,
    totalViolations: totalRef.current,
    recordResponse,
    reset,
  };
}
