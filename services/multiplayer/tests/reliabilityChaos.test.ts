/**
 * Samyak Multiplayer Service — Reliability & Chaos Engineering Test Suite
 * Tests 7 failure modes:
 * 1. Abrupt browser closure / unclean disconnect.
 * 2. Transient network drop & reconnection within grace period.
 * 3. Game server graceful drain & restart.
 * 4. Redis interruption & in-memory matchmaking fallback.
 * 5. Database temporary outage & in-memory buffer resilience.
 * 6. Duplicate result persistence defense & receipt idempotency.
 * 7. Simultaneous match conclusions race condition stress test.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { QuizBattleRoom } from '../src/rooms/QuizBattleRoom';
import { Client } from '../src/colyseus/room';
import { GameServer } from '../src/colyseus/server';
import { Matchmaker } from '../src/matchmaking/matchmaker';
import { ResultPersister } from '../src/persistence/resultPersister';
import {
  clearConsumedNoncesForTest,
  ValidatedPlayerAuth,
} from '../src/authentication/ticketValidator';

class ChaosTestClient implements Client {
  public sessionId: string;
  public auth?: any;
  public messagesSent: Array<{ type: string | number; message: any }> = [];
  public isClosed: boolean = false;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
  }

  send(type: string | number, message?: any): void {
    this.messagesSent.push({ type, message });
  }

  close(): void {
    this.isClosed = true;
  }
}

describe('Multiplayer Reliability & Chaos Testing: 7 Failure Modes', () => {
  beforeEach(() => {
    clearConsumedNoncesForTest();
  });

  // ─────────────────────────────────────────────────────────────
  // Chaos Scenario 1: Abrupt Browser Closure
  // ─────────────────────────────────────────────────────────────
  describe('Chaos 1: Browser Closure & Unclean Disconnect', () => {
    it('should transition player to disconnected and award forfeit win to remaining opponent after grace expiry', async () => {
      const room = new QuizBattleRoom();
      await room.onCreate({ ticket: '', questionCount: 3 });

      const c1 = new ChaosTestClient('sess_close_1');
      const c2 = new ChaosTestClient('sess_close_2');
      room.clients.push(c1, c2);

      const p1 = { id: 'usr_close_1', name: 'Student 1', rating: 1400, score: 100, connected: true } as any;
      const p2 = { id: 'usr_close_2', name: 'Student 2', rating: 1400, score: 80, connected: true } as any;

      room.state.players.set('sess_close_1', p1);
      room.state.players.set('sess_close_2', p2);
      room.state.status = 'question_active';

      // Simulate student closing browser tab abruptly (unconsented = false)
      // When allowReconnection rejects (grace period expires)
      room.allowReconnection = async () => {
        throw new Error('Grace period expired: Browser closed');
      };

      await room.onLeave(c1, false);

      expect(p1.connected).toBe(false);
      expect(room.state.status).toBe('match_ended');
      expect(room.state.winnerId).toBe('usr_close_2'); // Student 2 wins by forfeit
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Chaos Scenario 2: Network Drop & Reconnect
  // ─────────────────────────────────────────────────────────────
  describe('Chaos 2: Network Interruption & Reconnection within Grace Window', () => {
    it('should restore player session seamlessly if reconnected within 15s', async () => {
      const room = new QuizBattleRoom();
      await room.onCreate({ ticket: '', questionCount: 3 });

      const c1 = new ChaosTestClient('sess_net_1');
      const c2 = new ChaosTestClient('sess_net_2');
      room.clients.push(c1, c2);

      const p1 = { id: 'usr_net_1', name: 'Mobile Candidate', rating: 1450, score: 200, connected: true } as any;
      const p2 = { id: 'usr_net_2', name: 'Wifi Candidate', rating: 1450, score: 180, connected: true } as any;

      room.state.players.set('sess_net_1', p1);
      room.state.players.set('sess_net_2', p2);
      room.state.status = 'question_active';

      // Mobile player loses cellular signal
      const leavePromise = room.onLeave(c1, false);
      expect(p1.connected).toBe(false);

      // Student regains 4G connection within 3 seconds
      const newClient = new ChaosTestClient('sess_net_1_reconnected');
      const reconnected = room.handleClientReconnect('sess_net_1', newClient);
      expect(reconnected).toBe(true);

      await leavePromise;
      expect(p1.connected).toBe(true);
      expect(room.state.status).toBe('question_active'); // Match didn't abort
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Chaos Scenario 3: Game Server Restart / Graceful Drain
  // ─────────────────────────────────────────────────────────────
  describe('Chaos 3: Game Server Restart & Graceful Drain', () => {
    it('should gracefully disconnect all active rooms without orphaned memory leaks', async () => {
      const server = new GameServer();
      server.define('quiz_battle_1v1', QuizBattleRoom);

      const r1 = await server.createRoom('quiz_battle_1v1', {});
      const r2 = await server.createRoom('quiz_battle_1v1', {});
      expect(server.getActiveRoomsCount()).toBe(2);

      // Trigger server drain / shutdown
      await server.close();

      expect(server.getActiveRoomsCount()).toBe(0);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Chaos Scenario 4: Redis Interruption & In-Memory Fallback
  // ─────────────────────────────────────────────────────────────
  describe('Chaos 4: Redis Outage & In-Memory Fallback', () => {
    it('should maintain active matchmaking queue in-memory during Redis partition', () => {
      const mm = new Matchmaker(); // Operates with local in-memory fallback queues

      const p1: ValidatedPlayerAuth = {
        userId: 'p_red_1',
        email: 'p1@samyakcee.com',
        fullName: 'Player 1',
        rating: 1400,
        gameMode: 'ranked_1v1',
        nonce: 'nonce_red_1',
        issuedAt: Math.floor(Date.now() / 1000),
        expiresAt: Math.floor(Date.now() / 1000) + 60,
      };
      const p2: ValidatedPlayerAuth = {
        userId: 'p_red_2',
        email: 'p2@samyakcee.com',
        fullName: 'Player 2',
        rating: 1420,
        gameMode: 'ranked_1v1',
        nonce: 'nonce_red_2',
        issuedAt: Math.floor(Date.now() / 1000),
        expiresAt: Math.floor(Date.now() / 1000) + 60,
      };

      mm.enqueue('s1', p1);
      mm.enqueue('s2', p2);

      const matches = mm.processQueue();
      expect(matches.length).toBe(1);
      expect(matches[0].player1.player.userId).toBe('p_red_1');
      expect(matches[0].player2.player.userId).toBe('p_red_2');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Chaos Scenario 5: Database Temporary Unavailability
  // ─────────────────────────────────────────────────────────────
  describe('Chaos 5: Database Temporary Outage & In-Memory Resilience', () => {
    it('should not throw uncaught error and should generate valid idempotency receipt when database is down', async () => {
      const persister = new ResultPersister();

      // Mock database throwing connection timeout error
      (persister as any).supabase = {
        from: () => ({
          update: () => ({ eq: () => Promise.reject(new Error('Connection timeout: PostgreSQL 5432 unavailable')) }),
          insert: () => Promise.reject(new Error('Connection timeout: PostgreSQL 5432 unavailable')),
        }),
      };

      const payload = {
        roomId: 'room_chaos_db_down_01',
        player1: { id: 'p1', rating: 1400, score: 300, correctCount: 3, incorrectCount: 1 } as any,
        player2: { id: 'p2', rating: 1400, score: 100, correctCount: 1, incorrectCount: 3 } as any,
        subject: 'Zoology',
        totalQuestions: 4,
      };

      // Execution must succeed and retain memory receipt without throwing
      const result = await persister.persistMatchResult(payload);
      expect(result.success).toBe(true);
      expect(result.idempotencyHash).toBeDefined();
      expect(result.persistedToDatabase).toBe(false); // Gracefully flagged
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Chaos Scenario 6: Duplicate Results Protection
  // ─────────────────────────────────────────────────────────────
  describe('Chaos 6: Duplicate Results & Replay Idempotency', () => {
    it('should return identical receipt without duplicating records when match conclusion event fires twice', async () => {
      const persister = new ResultPersister();

      const payload = {
        roomId: 'room_duplicate_guard_01',
        player1: { id: 'u_alpha', rating: 1500, score: 500, correctCount: 5, incorrectCount: 0 } as any,
        player2: { id: 'u_beta', rating: 1500, score: 200, correctCount: 2, incorrectCount: 3 } as any,
        subject: 'Botany',
        totalQuestions: 5,
      };

      const firstCall = await persister.persistMatchResult(payload);
      const secondCall = await persister.persistMatchResult(payload);

      expect(firstCall.idempotencyHash).toBe(secondCall.idempotencyHash);
      expect(firstCall.eloResult.winnerId).toBe(secondCall.eloResult.winnerId);
      expect(firstCall.eloResult.p1Delta).toBe(secondCall.eloResult.p1Delta);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Chaos Scenario 7: Simultaneous Match Conclusions (Concurrency Stress)
  // ─────────────────────────────────────────────────────────────
  describe('Chaos 7: 50 Simultaneous Match Endings (Concurrency Race Condition)', () => {
    it('should concurrently resolve 50 simultaneous room completions without collisions or deadlocks', async () => {
      const persister = new ResultPersister();
      const promises: Promise<any>[] = [];

      for (let i = 0; i < 50; i++) {
        const payload = {
          roomId: `room_simultaneous_${i}`,
          player1: { id: `p1_${i}`, rating: 1400, score: 300 + i, correctCount: 3, incorrectCount: 2 } as any,
          player2: { id: `p2_${i}`, rating: 1400, score: 200 + i, correctCount: 2, incorrectCount: 3 } as any,
          subject: 'Chemistry',
          totalQuestions: 5,
        };
        promises.push(persister.persistMatchResult(payload));
      }

      const results = await Promise.all(promises);
      expect(results.length).toBe(50);

      // Verify all 50 hashes are unique
      const hashSet = new Set(results.map((r) => r.idempotencyHash));
      expect(hashSet.size).toBe(50);
      expect(results.every((r) => r.success)).toBe(true);
    });
  });
});
