import { describe, it, expect } from 'vitest';
import {
  calculateRoundScore,
  calculateEloDeltas,
  computeMatchReceiptHash,
} from '../src/game-engine/scoring';
import { defaultQuestionRegistry } from '../src/game-engine/questionRegistry';
import { AntiCheatEngine } from '../src/security/antiCheat';

describe('3. Question Security, Authoritative Scoring & Anti-Cheat', () => {
  describe('Question Privacy & Security', () => {
    it('should NEVER include correctOptionId or answer keys in public question payloads', () => {
      const matchQuestions = defaultQuestionRegistry.getQuestionsForMatch(5);

      expect(matchQuestions.publicQuestions.length).toBe(5);

      for (const q of matchQuestions.publicQuestions) {
        // Assert absence of sensitive fields
        expect((q as any).correctOptionId).toBeUndefined();
        expect((q as any).correct_answer).toBeUndefined();
        expect((q as any).explanation).toBeUndefined();

        // Must still have necessary display data
        expect(q.id).toBeDefined();
        expect(q.text.length).toBeGreaterThan(10);
        expect(q.options.length).toBe(4);
      }

      // Assert that secret answer keys are retained in server map
      expect(matchQuestions.answerKeyMap.size).toBe(5);
      for (const [id, key] of matchQuestions.answerKeyMap.entries()) {
        expect(['a', 'b', 'c', 'd']).toContain(key);
      }
    });

    it('should correctly verify answer against secret answer store', () => {
      expect(defaultQuestionRegistry.verifyAnswer('cee-bio-001', 'b')).toBe(true);
      expect(defaultQuestionRegistry.verifyAnswer('cee-bio-001', 'a')).toBe(false);
      expect(defaultQuestionRegistry.verifyAnswer('non_existent', 'b')).toBe(false);
    });
  });

  describe('Server-Side Scoring Calculation', () => {
    it('should award 100 base points plus maximum speed bonus for near-instant correct answer', () => {
      const res = calculateRoundScore({
        isCorrect: true,
        elapsedMs: 500, // 0.5s out of 15s
        timeLimitMs: 15000,
        currentStreak: 0,
      });

      expect(res.basePoints).toBe(100);
      expect(res.speedBonus).toBeGreaterThanOrEqual(95);
      expect(res.totalRoundPoints).toBeGreaterThanOrEqual(195);
      expect(res.newStreak).toBe(1);
    });

    it('should award 0 speed bonus if answer arrives at expiration deadline', () => {
      const res = calculateRoundScore({
        isCorrect: true,
        elapsedMs: 15000, // Exactly at 15s limit
        timeLimitMs: 15000,
        currentStreak: 0,
      });

      expect(res.basePoints).toBe(100);
      expect(res.speedBonus).toBe(0);
      expect(res.totalRoundPoints).toBe(100);
    });

    it('should award 0 points and reset streak to 0 on incorrect answer', () => {
      const res = calculateRoundScore({
        isCorrect: false,
        elapsedMs: 2000,
        timeLimitMs: 15000,
        currentStreak: 4,
      });

      expect(res.totalRoundPoints).toBe(0);
      expect(res.newStreak).toBe(0);
    });

    it('should correctly apply streak multipliers (+10% for >=2, +20% for >=3, +30% for >=5)', () => {
      // Streak 2: +10%
      const resStreak2 = calculateRoundScore({
        isCorrect: true,
        elapsedMs: 15000, // 100 base + 0 speed = 100
        timeLimitMs: 15000,
        currentStreak: 1, // Becomes streak 2
      });
      expect(resStreak2.streakBonus).toBe(10);
      expect(resStreak2.totalRoundPoints).toBe(110);

      // Streak 3: +20%
      const resStreak3 = calculateRoundScore({
        isCorrect: true,
        elapsedMs: 15000,
        timeLimitMs: 15000,
        currentStreak: 2, // Becomes streak 3
      });
      expect(resStreak3.streakBonus).toBe(20);
      expect(resStreak3.totalRoundPoints).toBe(120);

      // Streak 5: +30%
      const resStreak5 = calculateRoundScore({
        isCorrect: true,
        elapsedMs: 15000,
        timeLimitMs: 15000,
        currentStreak: 4, // Becomes streak 5
      });
      expect(resStreak5.streakBonus).toBe(30);
      expect(resStreak5.totalRoundPoints).toBe(130);
    });
  });

  describe('Authoritative ELO Rating Adjustment', () => {
    it('should adjust ratings symmetrically for equally rated players', () => {
      const result = calculateEloDeltas({
        player1: { id: 'p1', rating: 1500, score: 650 },
        player2: { id: 'p2', rating: 1500, score: 400 },
        kFactor: 32,
      });

      expect(result.winnerId).toBe('p1');
      expect(result.isDraw).toBe(false);
      expect(result.p1Delta).toBe(16);
      expect(result.p2Delta).toBe(-16);
      expect(result.p1NewRating).toBe(1516);
      expect(result.p2NewRating).toBe(1484);
    });

    it('should award fewer points to higher-rated favorite beating lower-rated underdog', () => {
      const result = calculateEloDeltas({
        player1: { id: 'fav', rating: 1800, score: 800 },
        player2: { id: 'dog', rating: 1200, score: 300 },
        kFactor: 32,
      });

      // Expected win probability is ~97%, so delta is small
      expect(result.p1Delta).toBeLessThanOrEqual(2);
      expect(result.p2Delta).toBeGreaterThanOrEqual(-2);
    });

    it('should award massive points to lower-rated underdog defeating higher-rated favorite', () => {
      const result = calculateEloDeltas({
        player1: { id: 'dog', rating: 1200, score: 900 },
        player2: { id: 'fav', rating: 1800, score: 400 },
        kFactor: 32,
      });

      // Upset victory awards near maximum K
      expect(result.p1Delta).toBeGreaterThanOrEqual(30);
      expect(result.p2Delta).toBeLessThanOrEqual(-30);
    });

    it('should handle draw match with 0 delta for equal ratings', () => {
      const result = calculateEloDeltas({
        player1: { id: 'p1', rating: 1500, score: 500 },
        player2: { id: 'p2', rating: 1500, score: 500 },
        kFactor: 32,
      });

      expect(result.isDraw).toBe(true);
      expect(result.winnerId).toBeNull();
      expect(result.p1Delta).toBe(0);
      expect(result.p2Delta).toBe(0);
    });
  });

  describe('Anti-Cheat & Rate Limiting Sentry', () => {
    it('should flag reactions faster than 350ms as suspicious sub-human response', () => {
      const sentry = new AntiCheatEngine();
      const eval1 = sentry.evaluateReactionTime('bot_user_99', 'match_1', 'q_1', 120, 350);

      expect(eval1.suspicious).toBe(true);
      expect(sentry.getAuditLogsForMatch('match_1').length).toBe(1);
      expect(sentry.getAuditLogsForMatch('match_1')[0].eventType).toBe('SUB_HUMAN_REACTION');
    });

    it('should accept reactions >= 350ms as realistic human responses', () => {
      const sentry = new AntiCheatEngine();
      const eval2 = sentry.evaluateReactionTime('human_student', 'match_1', 'q_1', 1850, 350);

      expect(eval2.suspicious).toBe(false);
      expect(sentry.getAuditLogsForMatch('match_1').length).toBe(0);
    });

    it('should block actions exceeding rate limits', () => {
      const sentry = new AntiCheatEngine();
      const sessionId = 'flood_sess_001';

      // 10 actions allowed per sec
      for (let i = 0; i < 10; i++) {
        expect(sentry.checkRateLimit(sessionId, 10)).toBe(true);
      }

      // 11th action blocked
      expect(sentry.checkRateLimit(sessionId, 10)).toBe(false);
    });
  });

  describe('Deterministic Receipt Hashing', () => {
    it('should generate identical idempotency hashes for same match outcome', () => {
      const hash1 = computeMatchReceiptHash('match_100', 'p1', 'p2', 650, 400);
      const hash2 = computeMatchReceiptHash('match_100', 'p1', 'p2', 650, 400);

      expect(hash1).toBe(hash2);
      expect(hash1.length).toBe(64); // SHA-256 hex length
    });

    it('should generate distinct hashes when scores or match IDs differ', () => {
      const hash1 = computeMatchReceiptHash('match_100', 'p1', 'p2', 650, 400);
      const hash2 = computeMatchReceiptHash('match_100', 'p1', 'p2', 650, 401);

      expect(hash1).not.toBe(hash2);
    });
  });
});
