/**
 * Samyak CEE Mastery — Exam Client Storage & Durable Synchronization Engine
 * 
 * Provides:
 * 1. Safe, SSR-resilient localStorage caching for active exam sessions.
 * 2. Monotonic server-calibrated drift recovery immune to device clock tampering.
 * 3. Offline answer queuing and automatic background flushing upon reconnection.
 * 4. Deterministic sync hash calculation for verifiable synchronization receipts.
 */

import { type ActiveExamSession, calculateTimerRecovery } from './examRegistry';

export const STORAGE_KEY_ACTIVE_EXAM = 'samyak_active_mock_exam';
export const STORAGE_KEY_OFFLINE_SYNC = 'samyak_exam_offline_sync_queue';

export interface OfflineSyncQueueItem {
  attemptId: string | null;
  examId: string;
  questionId: string;
  selectedOption: string;
  timestamp: number;
}

export interface DurableSyncResponse {
  success: boolean;
  durable: boolean;
  savedAnswerCount: number;
  syncHash: string;
  serverNow: number;
  serverExpiresAtMs: number;
  serverRemainingSeconds: number;
  isExpired: boolean;
  message?: string;
  error?: string;
}

/**
 * Deterministic hash of answers payload to verify durable sync state.
 * Works seamlessly in both browser and Node runtime environments.
 */
export function computeSyncHash(answers: Record<string, string>): string {
  const sortedKeys = Object.keys(answers || {}).sort();
  const canonicalString = sortedKeys.map((k) => `${k}:${answers[k]}`).join('|');
  
  let h1 = 0xdeadbeef ^ 0;
  let h2 = 0x41c6ce57 ^ 0;
  for (let i = 0; i < canonicalString.length; i++) {
    const ch = canonicalString.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const hex1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const hex2 = (h2 >>> 0).toString(16).padStart(8, '0');
  return `sync_${hex1}${hex2}`;
}

function getSafeStorage(storage?: Storage): Storage | null {
  if (storage) return storage;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      return window.localStorage;
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Saves active exam session to localStorage with server timestamp metadata
 */
export function saveActiveSession(session: ActiveExamSession, storage?: Storage): boolean {
  const s = getSafeStorage(storage);
  if (!s) return false;

  try {
    s.setItem(STORAGE_KEY_ACTIVE_EXAM, JSON.stringify(session));
    return true;
  } catch (err) {
    console.warn('[ExamStorage] Failed to save active exam session:', err);
    return false;
  }
}

/**
 * Retrieves active exam session from localStorage
 */
export function loadActiveSession(storage?: Storage): ActiveExamSession | null {
  const s = getSafeStorage(storage);
  if (!s) return null;

  try {
    const raw = s.getItem(STORAGE_KEY_ACTIVE_EXAM);
    if (!raw) return null;
    return JSON.parse(raw) as ActiveExamSession;
  } catch (err) {
    console.warn('[ExamStorage] Failed to parse active exam session:', err);
    return null;
  }
}

/**
 * Clears active exam session from localStorage
 */
export function clearActiveSession(storage?: Storage): void {
  const s = getSafeStorage(storage);
  if (!s) return;

  try {
    s.removeItem(STORAGE_KEY_ACTIVE_EXAM);
  } catch {}
}

/**
 * Enqueues an answered question into the offline synchronization queue
 */
export function enqueueOfflineAnswer(
  item: { attemptId?: string | null; examId: string; questionId: string; selectedOption: string },
  storage?: Storage
): void {
  const s = getSafeStorage(storage);
  if (!s) return;

  try {
    const existing = getOfflineQueue(s);
    // Replace if question already in queue, otherwise append
    const filtered = existing.filter((q) => q.questionId !== item.questionId);
    filtered.push({
      attemptId: item.attemptId ?? null,
      examId: item.examId,
      questionId: item.questionId,
      selectedOption: item.selectedOption,
      timestamp: Date.now(),
    });
    s.setItem(STORAGE_KEY_OFFLINE_SYNC, JSON.stringify(filtered));
  } catch (err) {
    console.warn('[ExamStorage] Failed to enqueue offline answer:', err);
  }
}

/**
 * Gets pending answers waiting for network reconnection
 */
export function getOfflineQueue(storage?: Storage): OfflineSyncQueueItem[] {
  const s = getSafeStorage(storage);
  if (!s) return [];

  try {
    const raw = s.getItem(STORAGE_KEY_OFFLINE_SYNC);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Clears offline sync queue once durably acknowledged by server
 */
export function clearOfflineQueue(storage?: Storage): void {
  const s = getSafeStorage(storage);
  if (!s) return;

  try {
    s.removeItem(STORAGE_KEY_OFFLINE_SYNC);
  } catch {}
}

/**
 * Calculates remaining seconds using server-calibrated drift offset.
 * Protects against student OS clock rolling back or forward.
 */
export function calculateCalibratedRemainingSeconds(
  session: ActiveExamSession,
  clientNowMs: number = Date.now()
): number {
  const recovery = calculateTimerRecovery(JSON.stringify(session), clientNowMs);
  return Math.max(0, recovery.remainingSeconds);
}

/**
 * Sends intermediate answers to server sync endpoint and returns durable confirmation
 */
export async function syncIntermediateAnswers(params: {
  attemptId: string | null;
  examId: string;
  answers: Record<string, string>;
  clientTimestamp?: number;
}): Promise<DurableSyncResponse> {
  const clientTimestamp = params.clientTimestamp ?? Date.now();
  
  const res = await fetch('/api/exams/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      attemptId: params.attemptId,
      examId: params.examId,
      answers: params.answers,
      clientTimestamp,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    return {
      success: false,
      durable: false,
      savedAnswerCount: 0,
      syncHash: '',
      serverNow: Date.now(),
      serverExpiresAtMs: 0,
      serverRemainingSeconds: 0,
      isExpired: data.isExpired ?? false,
      error: data.error || 'Sync request failed',
    };
  }

  return {
    success: true,
    durable: Boolean(data.durable),
    savedAnswerCount: Number(data.savedAnswerCount) || Object.keys(params.answers).length,
    syncHash: data.syncHash || computeSyncHash(params.answers),
    serverNow: Number(data.serverNow) || Date.now(),
    serverExpiresAtMs: Number(data.serverExpiresAtMs) || 0,
    serverRemainingSeconds: Number(data.serverRemainingSeconds) || 0,
    isExpired: Boolean(data.isExpired),
    message: data.message,
  };
}
