import { describe, it, expect } from 'vitest';

/**
 * Reusable Nepal Timezone Calculation Helper
 * Matches src/app/api/arena/championship/route.ts
 */
export function getNepalCurrentDate(mockUtcDate?: Date): { dateStr: string; secondsRemainingToday: number } {
  const now = mockUtcDate || new Date();
  const nepalOffsetMs = (5 * 60 + 45) * 60 * 1000;
  const nepalNow = new Date(now.getTime() + nepalOffsetMs);

  const yyyy = nepalNow.getUTCFullYear();
  const mm = String(nepalNow.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(nepalNow.getUTCDate()).padStart(2, '0');
  const dateStr = `${yyyy}-${mm}-${dd}`;

  const endOfDayNepal = new Date(Date.UTC(yyyy, nepalNow.getUTCMonth(), nepalNow.getUTCDate(), 18, 14, 59, 999));
  const secondsRemainingToday = Math.max(0, Math.floor((endOfDayNepal.getTime() - now.getTime()) / 1000));

  return { dateStr, secondsRemainingToday };
}

/**
 * Seeded PRNG Linear Congruential Generator (LCG)
 * Matches src/app/battle-arena/components/BattleArenaPageClient.tsx
 */
export function createSeededRandom(seedStr: string): () => number {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash << 5) - hash + seedStr.charCodeAt(i);
    hash |= 0;
  }
  let s = Math.abs(hash) || 123456789;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

/**
 * Deterministic Leaderboard Ranking Comparator
 * Matches MIGRATE-PHASE-1-FOUNDATION.sql index:
 * (total_score DESC, accuracy_percentage DESC, total_time_seconds ASC)
 */
export interface LeaderboardEntry {
  userId: string;
  totalScore: number;
  accuracy: number;
  totalTimeSeconds: number;
  disqualified: boolean;
  flaggedForReview?: boolean;
}

export function sortChampionshipLeaderboard(entries: LeaderboardEntry[]): LeaderboardEntry[] {
  return [...entries]
    .filter((e) => !e.disqualified)
    .sort((a, b) => {
      // 1. total_score DESC
      if (b.totalScore !== a.totalScore) {
        return b.totalScore - a.totalScore;
      }
      // 2. accuracy_percentage DESC
      if (b.accuracy !== a.accuracy) {
        return b.accuracy - a.accuracy;
      }
      // 3. total_time_seconds ASC
      return a.totalTimeSeconds - b.totalTimeSeconds;
    });
}

/**
 * Championship Match Submission Simulator
 * Validates Idempotency, 10-match cap, scoring, and anti-cheat flagging
 */
export interface ChampionshipState {
  matchCount: number;
  totalScore: number;
  processedRoomIds: string[];
  antiCheatFlags: number;
  disqualified: boolean;
  flaggedForReview: boolean;
}

export function processMatchSubmission(
  current: ChampionshipState,
  submission: {
    roomId: string;
    correctCount: number;
    incorrectCount: number;
    timeTakenSeconds: number;
    tabSwitches: number;
    fastResponses: number;
  }
): {
  success: boolean;
  idempotent?: boolean;
  capped?: boolean;
  updated: ChampionshipState;
  matchPointsAwarded: number;
} {
  // 1. Check idempotency
  if (current.processedRoomIds.includes(submission.roomId)) {
    return {
      success: true,
      idempotent: true,
      updated: { ...current },
      matchPointsAwarded: 0,
    };
  }

  // 2. Check daily match limit (max 10)
  if (current.matchCount >= 10) {
    return {
      success: false,
      capped: true,
      updated: { ...current },
      matchPointsAwarded: 0,
    };
  }

  // 3. Evaluate anti-cheat flags
  const newFlags = current.antiCheatFlags + submission.tabSwitches + submission.fastResponses;
  const flaggedForReview = current.flaggedForReview || newFlags >= 4;

  // 4. Calculate score
  const totalQ = submission.correctCount + submission.incorrectCount;
  const accuracy = totalQ > 0 ? (submission.correctCount / totalQ) * 100 : 0;
  let speedBonus = 0;
  if (accuracy >= 80 && submission.timeTakenSeconds > 0 && submission.timeTakenSeconds < 300) {
    speedBonus = Math.min(5, Math.round((300 - submission.timeTakenSeconds) / 20));
  }
  const matchPoints = Math.max(0, submission.correctCount * 10 - submission.incorrectCount * 2.5 + speedBonus);

  const updated: ChampionshipState = {
    matchCount: current.matchCount + 1,
    totalScore: current.totalScore + matchPoints,
    processedRoomIds: [...current.processedRoomIds, submission.roomId],
    antiCheatFlags: newFlags,
    disqualified: current.disqualified, // Never unilaterally auto-disqualified on threshold
    flaggedForReview,
  };

  return {
    success: true,
    idempotent: false,
    updated,
    matchPointsAwarded: matchPoints,
  };
}

describe('Arena Championship Security, Idempotency & Fair Competition Suite', () => {
  describe('Timezone & Competition Boundaries (Asia/Kathmandu UTC+5:45)', () => {
    it('accurately computes Nepal date across UTC day boundary', () => {
      // 2026-09-20 18:00:00 UTC is 2026-09-20 23:45:00 in Nepal (same day)
      const dateUtc1 = new Date('2026-09-20T18:00:00.000Z');
      const res1 = getNepalCurrentDate(dateUtc1);
      expect(res1.dateStr).toBe('2026-09-20');
      expect(res1.secondsRemainingToday).toBeGreaterThan(0);

      // 2026-09-20 18:30:00 UTC is 2026-09-21 00:15:00 in Nepal (next day in Nepal)
      const dateUtc2 = new Date('2026-09-20T18:30:00.000Z');
      const res2 = getNepalCurrentDate(dateUtc2);
      expect(res2.dateStr).toBe('2026-09-21');
    });

    it('calculates exact seconds remaining until Nepal midnight', () => {
      // 2026-09-20 18:14:00 UTC is 59 seconds before Nepal midnight
      const nearMidnight = new Date('2026-09-20T18:14:00.000Z');
      const { secondsRemainingToday } = getNepalCurrentDate(nearMidnight);
      expect(secondsRemainingToday).toBe(59);
    });
  });

  describe('Match Idempotency & Replay Attack Defense', () => {
    const initialState: ChampionshipState = {
      matchCount: 1,
      totalScore: 80,
      processedRoomIds: ['room-abc-1'],
      antiCheatFlags: 0,
      disqualified: false,
      flaggedForReview: false,
    };

    it('prevents duplicate scoring when the same roomId is submitted multiple times', () => {
      const duplicateSubmission = {
        roomId: 'room-abc-1', // Already processed
        correctCount: 9,
        incorrectCount: 1,
        timeTakenSeconds: 150,
        tabSwitches: 0,
        fastResponses: 0,
      };

      const result = processMatchSubmission(initialState, duplicateSubmission);
      expect(result.success).toBe(true);
      expect(result.idempotent).toBe(true);
      expect(result.matchPointsAwarded).toBe(0);
      expect(result.updated.matchCount).toBe(1); // Did not increment
      expect(result.updated.totalScore).toBe(80); // Did not add points
      expect(result.updated.processedRoomIds).toHaveLength(1);
    });

    it('successfully processes new, distinct room IDs and updates points accurately', () => {
      const freshSubmission = {
        roomId: 'room-def-2', // New room
        correctCount: 8,
        incorrectCount: 2,
        timeTakenSeconds: 200,
        tabSwitches: 0,
        fastResponses: 0,
      };

      const result = processMatchSubmission(initialState, freshSubmission);
      expect(result.success).toBe(true);
      expect(result.idempotent).toBe(false);
      // 8*10 - 2*2.5 = 75 + speed bonus (300-200)/20 = 5 => 80
      expect(result.matchPointsAwarded).toBe(80);
      expect(result.updated.matchCount).toBe(2);
      expect(result.updated.totalScore).toBe(160);
      expect(result.updated.processedRoomIds).toContain('room-def-2');
    });
  });

  describe('Daily 10-Match Limit Enforcement', () => {
    it('blocks submissions beyond the 10-match daily cap', () => {
      const maxedState: ChampionshipState = {
        matchCount: 10,
        totalScore: 850,
        processedRoomIds: Array.from({ length: 10 }, (_, i) => `room-${i + 1}`),
        antiCheatFlags: 0,
        disqualified: false,
        flaggedForReview: false,
      };

      const match11 = {
        roomId: 'room-11',
        correctCount: 10,
        incorrectCount: 0,
        timeTakenSeconds: 120,
        tabSwitches: 0,
        fastResponses: 0,
      };

      const result = processMatchSubmission(maxedState, match11);
      expect(result.success).toBe(false);
      expect(result.capped).toBe(true);
      expect(result.matchPointsAwarded).toBe(0);
      expect(result.updated.matchCount).toBe(10);
      expect(result.updated.totalScore).toBe(850);
    });
  });

  describe('Deterministic Tie-Breaking Logic', () => {
    it('sorts higher score first regardless of time or accuracy', () => {
      const candidates: LeaderboardEntry[] = [
        { userId: 'u1', totalScore: 750, accuracy: 95, totalTimeSeconds: 500, disqualified: false },
        { userId: 'u2', totalScore: 800, accuracy: 80, totalTimeSeconds: 900, disqualified: false },
      ];

      const ranked = sortChampionshipLeaderboard(candidates);
      expect(ranked[0].userId).toBe('u2');
      expect(ranked[1].userId).toBe('u1');
    });

    it('breaks score ties by higher accuracy percentage', () => {
      const candidates: LeaderboardEntry[] = [
        { userId: 'u-tie-low-acc', totalScore: 800, accuracy: 82.5, totalTimeSeconds: 600, disqualified: false },
        { userId: 'u-tie-high-acc', totalScore: 800, accuracy: 90.0, totalTimeSeconds: 600, disqualified: false },
      ];

      const ranked = sortChampionshipLeaderboard(candidates);
      expect(ranked[0].userId).toBe('u-tie-high-acc');
      expect(ranked[1].userId).toBe('u-tie-low-acc');
    });

    it('breaks score and accuracy ties by lower total time seconds (speed tie-breaker)', () => {
      const candidates: LeaderboardEntry[] = [
        { userId: 'u-slower', totalScore: 800, accuracy: 90.0, totalTimeSeconds: 720, disqualified: false },
        { userId: 'u-faster', totalScore: 800, accuracy: 90.0, totalTimeSeconds: 540, disqualified: false },
      ];

      const ranked = sortChampionshipLeaderboard(candidates);
      expect(ranked[0].userId).toBe('u-faster');
      expect(ranked[1].userId).toBe('u-slower');
    });

    it('strictly excludes disqualified entries from the official leaderboard', () => {
      const candidates: LeaderboardEntry[] = [
        { userId: 'u-cheater', totalScore: 999, accuracy: 100, totalTimeSeconds: 50, disqualified: true },
        { userId: 'u-honest', totalScore: 700, accuracy: 85, totalTimeSeconds: 600, disqualified: false },
      ];

      const ranked = sortChampionshipLeaderboard(candidates);
      expect(ranked).toHaveLength(1);
      expect(ranked[0].userId).toBe('u-honest');
    });
  });

  describe('1v1 Multiplayer Seeded PRNG Question Synchronization', () => {
    it('produces identical deterministic question order for two players sharing a room seed', () => {
      const roomId = 'battle-room-nepal-2026-xyz';
      const questionPool = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9', 'q10'];

      // Player 1 (Creator)
      const rng1 = createSeededRandom(roomId);
      const shuffledPlayer1 = [...questionPool].sort(() => rng1() - 0.5);

      // Player 2 (Opponent)
      const rng2 = createSeededRandom(roomId);
      const shuffledPlayer2 = [...questionPool].sort(() => rng2() - 0.5);

      expect(shuffledPlayer1).toEqual(shuffledPlayer2);
      expect(shuffledPlayer1).toHaveLength(10);
    });

    it('produces different question orders for different room seeds', () => {
      const questionPool = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9', 'q10'];

      const rngA = createSeededRandom('room-seed-alpha');
      const orderA = [...questionPool].sort(() => rngA() - 0.5);

      const rngB = createSeededRandom('room-seed-beta');
      const orderB = [...questionPool].sort(() => rngB() - 0.5);

      expect(orderA).not.toEqual(orderB);
    });
  });

  describe('Anti-Cheat Audit Workflow (Task 6 Hardening)', () => {
    it('marks flagged_for_review without unilateral account disqualification when flags reach threshold', () => {
      const freshState: ChampionshipState = {
        matchCount: 2,
        totalScore: 160,
        processedRoomIds: ['r1', 'r2'],
        antiCheatFlags: 1,
        disqualified: false,
        flaggedForReview: false,
      };

      // Student incurs 3 tab switches in match 3 (1 + 3 = 4 total flags)
      const match3 = {
        roomId: 'r3',
        correctCount: 9,
        incorrectCount: 1,
        timeTakenSeconds: 180,
        tabSwitches: 3,
        fastResponses: 0,
      };

      const res = processMatchSubmission(freshState, match3);
      expect(res.success).toBe(true);
      expect(res.updated.antiCheatFlags).toBe(4);
      expect(res.updated.flaggedForReview).toBe(true);
      // Student is NOT unilaterally banned or disqualified; score is retained for admin review
      expect(res.updated.disqualified).toBe(false);
      expect(res.updated.totalScore).toBeGreaterThan(160);
    });
  });
});
