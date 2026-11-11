import { describe, it, expect, beforeEach } from 'vitest';
import {
  validateSubmissionSecurity,
  calculateTimerRecovery,
  sanitizeQuestionsForActiveExam,
  computeSyncHash,
  type ActiveExamSession,
} from '../examRegistry';
import {
  saveActiveSession,
  loadActiveSession,
  clearActiveSession,
  enqueueOfflineAnswer,
  getOfflineQueue,
  clearOfflineQueue,
  calculateCalibratedRemainingSeconds,
  STORAGE_KEY_ACTIVE_EXAM,
  STORAGE_KEY_OFFLINE_SYNC,
} from '../examStorage';

// In-memory mock storage for SSR / Node environment tests
class MockStorage implements Storage {
  private store = new Map<string, string>();
  get length() {
    return this.store.size;
  }
  clear(): void {
    this.store.clear();
  }
  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }
  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
}

describe('Exam Timer, Candidate Validation & Durable Sync Security', () => {
  let mockStorage: MockStorage;

  beforeEach(() => {
    mockStorage = new MockStorage();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 1. Server-Controlled Deadline Enforcement
  // ──────────────────────────────────────────────────────────────────────────
  describe('1. Authoritative Server Deadline Enforcement', () => {
    it('allows submission when within duration and 60-second grace period', () => {
      const nowMs = 1700000000000;
      const startedAt = new Date(nowMs - 50 * 60 * 1000).toISOString(); // 50 mins ago

      const check = validateSubmissionSecurity(
        {
          id: 'attempt-1',
          student_id: 'student-123',
          started_at: startedAt,
        },
        'student-123',
        {
          examId: 'cee-mock-1',
          durationMinutes: 60,
          serverNowMs: nowMs,
          gracePeriodSeconds: 60,
        }
      );

      expect(check.allowed).toBe(true);
      expect(check.isDuplicate).toBe(false);
      expect(check.isExpired).toBeUndefined();
    });

    it('allows submission within the 60-second network latency grace window', () => {
      const nowMs = 1700000000000;
      // Started 60 minutes + 30 seconds ago (within 60s grace buffer)
      const startedAt = new Date(nowMs - (60 * 60 + 30) * 1000).toISOString();

      const check = validateSubmissionSecurity(
        {
          id: 'attempt-1',
          student_id: 'student-123',
          started_at: startedAt,
        },
        'student-123',
        {
          examId: 'cee-mock-1',
          durationMinutes: 60,
          serverNowMs: nowMs,
          gracePeriodSeconds: 60,
        }
      );

      expect(check.allowed).toBe(true);
    });

    it('strictly rejects submission when past deadline + 60s grace period with HTTP 403', () => {
      const nowMs = 1700000000000;
      // Started 60 minutes + 75 seconds ago (past grace period)
      const startedAt = new Date(nowMs - (60 * 60 + 75) * 1000).toISOString();

      const check = validateSubmissionSecurity(
        {
          id: 'attempt-1',
          student_id: 'student-123',
          started_at: startedAt,
        },
        'student-123',
        {
          examId: 'cee-mock-1',
          durationMinutes: 60,
          serverNowMs: nowMs,
          gracePeriodSeconds: 60,
        }
      );

      expect(check.allowed).toBe(false);
      expect(check.isExpired).toBe(true);
      expect(check.statusCode).toBe(403);
      expect(check.error).toContain('Examination deadline expired');
      expect(check.serverRemainingSeconds).toBe(0);
      expect(check.deadlineIso).toBeDefined();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 2. Candidate Ownership & Attempt Identity Validation
  // ──────────────────────────────────────────────────────────────────────────
  describe('2. Candidate Ownership & Attempt Consistency', () => {
    it('rejects submission if attempt belongs to another student (Cross-candidate isolation)', () => {
      const check = validateSubmissionSecurity(
        {
          id: 'attempt-999',
          student_id: 'victim-student-id',
          exam_id: 'cee-full-1',
        },
        'attacker-student-id',
        { examId: 'cee-full-1' }
      );

      expect(check.allowed).toBe(false);
      expect(check.statusCode).toBe(403);
      expect(check.error).toContain('cannot access or submit another candidate');
    });

    it('rejects submission if attempt exam_id does not match the requested examId', () => {
      const check = validateSubmissionSecurity(
        {
          id: 'attempt-1',
          student_id: 'student-123',
          exam_id: 'see-science-mock',
        },
        'student-123',
        { examId: 'cee-medical-full' }
      );

      expect(check.allowed).toBe(false);
      expect(check.statusCode).toBe(400);
      expect(check.error).toContain('Attempt does not match the submitted exam ID');
    });

    it('safely handles duplicate submissions idempotently', () => {
      const check = validateSubmissionSecurity(
        {
          id: 'attempt-1',
          student_id: 'student-123',
          completed_at: '2026-11-10T04:00:00.000Z',
          exam_id: 'cee-full-1',
        },
        'student-123',
        { examId: 'cee-full-1' }
      );

      expect(check.allowed).toBe(false);
      expect(check.isDuplicate).toBe(true);
      expect(check.statusCode).toBe(200);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 3. Durable Sync Receipt & Deterministic Hashing
  // ──────────────────────────────────────────────────────────────────────────
  describe('3. Durable Synchronization & Sync Hash Receipts', () => {
    it('computes identical deterministic hash regardless of key insertion order', () => {
      const answersA = { q1: 'a', q2: 'b', q3: 'c' };
      const answersB = { q3: 'c', q1: 'a', q2: 'b' };

      const hashA = computeSyncHash(answersA);
      const hashB = computeSyncHash(answersB);

      expect(hashA).toBe(hashB);
      expect(hashA.startsWith('sync_')).toBe(true);
    });

    it('computes distinct hashes when an answer changes', () => {
      const answersInitial = { q1: 'a', q2: 'b' };
      const answersModified = { q1: 'a', q2: 'c' };

      const hash1 = computeSyncHash(answersInitial);
      const hash2 = computeSyncHash(answersModified);

      expect(hash1).not.toBe(hash2);
    });

    it('computes valid hash for empty answers payload', () => {
      const emptyHash = computeSyncHash({});
      expect(typeof emptyHash).toBe('string');
      expect(emptyHash.startsWith('sync_')).toBe(true);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 4. Timer Recovery & Immunity to Device Clock Manipulation
  // ──────────────────────────────────────────────────────────────────────────
  describe('4. Anti-Tampering Timer Recovery', () => {
    it('recovers remaining seconds anchored to authoritative serverUtc timestamp', () => {
      const serverNow = 1700000000000;
      const startedAt = new Date(serverNow - 30 * 60 * 1000).toISOString(); // 30m elapsed
      const serverExpiresAtMs = serverNow + 30 * 60 * 1000; // 30m remaining

      const session: ActiveExamSession = {
        selectedExam: { id: 'cee-mock-1', duration: 60 },
        questions: [{ id: 'q1', text: 'Sample' }],
        answers: { q1: 'a' },
        markedForReview: [],
        visitedQuestions: ['q1'],
        attemptId: 'att-1',
        currentIdx: 0,
        targetEndTime: serverExpiresAtMs,
        startedAtIso: startedAt,
        serverExpiresAtMs,
        serverTimeOffsetMs: 0,
      };

      const recovery = calculateTimerRecovery(JSON.stringify(session), serverNow);
      expect(recovery.canRecover).toBe(true);
      expect(recovery.isExpired).toBe(false);
      // Approximately 30 minutes = 1800 seconds
      expect(recovery.remainingSeconds).toBe(1800);
      expect(recovery.serverCalibrated).toBe(true);
    });

    it('prevents student from extending exam time by winding back local OS clock', () => {
      const serverNow = 1700000000000;
      const serverExpiresAtMs = serverNow + 10 * 60 * 1000; // 10 minutes left in reality

      // Student rolls local computer clock BACK by 3 hours:
      // Local computer thinks now is (serverNow - 3 hours)
      // BUT serverTimeOffsetMs was calibrated: serverTimeOffsetMs = serverNow - clientTamperedNow = +3 hours
      const clientTamperedNow = serverNow - 3 * 3600 * 1000;
      const offsetMs = serverNow - clientTamperedNow; // +10,800,000 ms

      const session: ActiveExamSession = {
        selectedExam: { id: 'cee-mock-1', duration: 60 },
        questions: [{ id: 'q1', text: 'Sample' }],
        answers: {},
        markedForReview: [],
        visitedQuestions: [],
        attemptId: 'att-1',
        currentIdx: 0,
        targetEndTime: serverExpiresAtMs,
        serverExpiresAtMs,
        serverTimeOffsetMs: offsetMs,
      };

      const recovery = calculateTimerRecovery(JSON.stringify(session), clientTamperedNow);

      // Remaining time MUST reflect authoritative 10 minutes (600s), NOT 3 hours + 10 mins!
      expect(recovery.remainingSeconds).toBe(600);
    });

    it('flags session as expired if server deadline has passed', () => {
      const serverNow = 1700000000000;
      const serverExpiresAtMs = serverNow - 5000; // expired 5 seconds ago

      const session: ActiveExamSession = {
        selectedExam: { id: 'cee-mock-1', duration: 60 },
        questions: [{ id: 'q1', text: 'Sample' }],
        answers: {},
        markedForReview: [],
        visitedQuestions: [],
        attemptId: 'att-1',
        currentIdx: 0,
        targetEndTime: serverExpiresAtMs,
        serverExpiresAtMs,
        serverTimeOffsetMs: 0,
      };

      const recovery = calculateTimerRecovery(JSON.stringify(session), serverNow);
      expect(recovery.canRecover).toBe(false);
      expect(recovery.isExpired).toBe(true);
      expect(recovery.remainingSeconds).toBe(0);
      expect(recovery.reason).toBe('expired');
    });

    it('safely handles corrupted or empty storage payloads without throwing', () => {
      expect(calculateTimerRecovery(null).canRecover).toBe(false);
      expect(calculateTimerRecovery('invalid json string').canRecover).toBe(false);
      expect(calculateTimerRecovery('{}').canRecover).toBe(false);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 5. Offline Queueing & Browser Interruption Recovery
  // ──────────────────────────────────────────────────────────────────────────
  describe('5. Offline Queue & Interruption Storage', () => {
    it('persists and restores active session through custom storage mock', () => {
      const session: ActiveExamSession = {
        selectedExam: { id: 'see-science-mock', duration: 180 },
        questions: [{ id: 'q1', question_text: 'What is G?' }],
        answers: { q1: 'c' },
        markedForReview: ['q1'],
        visitedQuestions: ['q1'],
        attemptId: 'att-offline-1',
        currentIdx: 0,
        targetEndTime: Date.now() + 3600000,
        startedAtIso: new Date().toISOString(),
        serverExpiresAtMs: Date.now() + 3600000,
        serverTimeOffsetMs: 0,
      };

      const saved = saveActiveSession(session, mockStorage);
      expect(saved).toBe(true);

      const loaded = loadActiveSession(mockStorage);
      expect(loaded).not.toBeNull();
      expect(loaded?.selectedExam.id).toBe('see-science-mock');
      expect(loaded?.answers.q1).toBe('c');
      expect(loaded?.attemptId).toBe('att-offline-1');

      clearActiveSession(mockStorage);
      expect(loadActiveSession(mockStorage)).toBeNull();
    });

    it('enqueues offline answers and maintains updated choices per question', () => {
      enqueueOfflineAnswer(
        { attemptId: 'att-1', examId: 'cee-mock-1', questionId: 'q1', selectedOption: 'a' },
        mockStorage
      );
      enqueueOfflineAnswer(
        { attemptId: 'att-1', examId: 'cee-mock-1', questionId: 'q2', selectedOption: 'b' },
        mockStorage
      );
      // Student changes mind offline on q1
      enqueueOfflineAnswer(
        { attemptId: 'att-1', examId: 'cee-mock-1', questionId: 'q1', selectedOption: 'c' },
        mockStorage
      );

      const queue = getOfflineQueue(mockStorage);
      expect(queue.length).toBe(2);
      const q1Item = queue.find((item) => item.questionId === 'q1');
      expect(q1Item?.selectedOption).toBe('c');

      clearOfflineQueue(mockStorage);
      expect(getOfflineQueue(mockStorage).length).toBe(0);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 6. Server-Side Answer Key Redaction (Result Privacy)
  // ──────────────────────────────────────────────────────────────────────────
  describe('6. Active Exam Question Redaction', () => {
    it('completely removes correct options and explanations from active exam payloads', () => {
      const rawQuestions = [
        {
          id: 'q-101',
          question_text: 'What is the SI unit of electric flux?',
          option_a: 'N m^2 C^-1',
          option_b: 'V m',
          option_c: 'N C^-1',
          option_d: 'J C^-1',
          correct_option: 'b',
          correctOption: 'b',
          correct_answer: 'b',
          explanation: 'Flux = E * A = (V/m) * m^2 = V m',
          solution: 'Detailed derivation...',
          markingScheme: '1 mark',
          subject: 'physics',
          marks: 1,
        },
      ];

      const sanitized = sanitizeQuestionsForActiveExam(rawQuestions);

      expect(sanitized.length).toBe(1);
      const q = sanitized[0];

      // Safe fields must remain intact
      expect(q.id).toBe('q-101');
      expect(q.question_text).toContain('electric flux');
      expect(q.option_a).toBe('N m^2 C^-1');
      expect(q.option_b).toBe('V m');

      // Sensitive answers and solutions must be stripped completely
      expect(q.correct_option).toBeUndefined();
      expect(q.correctOption).toBeUndefined();
      expect(q.correct_answer).toBeUndefined();
      expect(q.explanation).toBeUndefined();
      expect(q.solution).toBeUndefined();
      expect(q.markingScheme).toBeUndefined();
    });
  });
});
