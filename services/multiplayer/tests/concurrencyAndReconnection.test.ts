import { describe, it, expect, beforeEach } from 'vitest';
import { QuizBattleRoom } from '../src/rooms/QuizBattleRoom';
import { Client } from '../src/colyseus/room';
import { ResultPersister } from '../src/persistence/resultPersister';
import { GameServer } from '../src/colyseus/server';

class MockClient implements Client {
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

describe('5. Concurrency, Reconnection Grace Period & Idempotent Persistence', () => {
  let room: QuizBattleRoom;

  beforeEach(async () => {
    room = new QuizBattleRoom();
    await room.onCreate({ ticket: '', questionCount: 3 });
  });

  describe('Reconnection & Disconnect Grace Period', () => {
    it('should mark player disconnected and broadcast grace period warning on unconsented leave', async () => {
      const client1 = new MockClient('sess_1');
      const client2 = new MockClient('sess_2');
      room.clients.push(client1, client2);

      const p1 = { id: 'u1', name: 'Player 1', rating: 1400, score: 200, connected: true } as any;
      const p2 = { id: 'u2', name: 'Player 2', rating: 1400, score: 200, connected: true } as any;

      room.state.players.set('sess_1', p1);
      room.state.players.set('sess_2', p2);
      room.state.status = 'question_active';

      // Simulate network interruption (unconsented leave = false)
      const leavePromise = room.onLeave(client1, false);

      expect(p1.connected).toBe(false);
      const dcMsg = client2.messagesSent.find((m) => m.type === 'playerDisconnected');
      expect(dcMsg).toBeDefined();
      expect(dcMsg?.message.playerId).toBe('u1');
      expect(dcMsg?.message.gracePeriodSeconds).toBe(15);

      // Reconnect immediately before timeout
      const reconnectedClient = new MockClient('sess_1_reconnected');
      const reconnectHandled = room.handleClientReconnect('sess_1', reconnectedClient);
      expect(reconnectHandled).toBe(true);

      await leavePromise;
      expect(p1.connected).toBe(true);
    });

    it('should award forfeit win to remaining player if reconnect grace period expires', async () => {
      const client1 = new MockClient('sess_1');
      const client2 = new MockClient('sess_2');
      room.clients.push(client1, client2);

      const p1 = { id: 'u1', name: 'Player 1', rating: 1400, score: 200, connected: true } as any;
      const p2 = { id: 'u2', name: 'Player 2', rating: 1400, score: 150, connected: true } as any;

      room.state.players.set('sess_1', p1);
      room.state.players.set('sess_2', p2);
      room.state.status = 'question_active';

      // Mock allowReconnection to reject immediately (simulating timeout expiration)
      room.allowReconnection = async () => {
        throw new Error('Timeout expired');
      };

      await room.onLeave(client1, false);

      // Match concluded by forfeit
      expect(room.state.status).toBe('match_ended');
      expect(room.state.winnerId).toBe('u2'); // Remaining connected player wins
    });
  });

  describe('Idempotent Persistence Engine', () => {
    it('should produce identical receipts and prevent duplicate database records on multiple calls', async () => {
      const persister = new ResultPersister();
      const payload = {
        roomId: 'room_idempotent_test_01',
        player1: { id: 'p1', rating: 1500, score: 800, correctCount: 4, incorrectCount: 1 } as any,
        player2: { id: 'p2', rating: 1500, score: 400, correctCount: 2, incorrectCount: 3 } as any,
        subject: 'Physics',
        totalQuestions: 5,
      };

      // Call 1
      const res1 = await persister.persistMatchResult(payload);
      expect(res1.success).toBe(true);
      expect(res1.eloResult.winnerId).toBe('p1');
      expect(res1.idempotencyHash).toBeDefined();

      // Call 2 (Simulated replay or duplicate server post)
      const res2 = await persister.persistMatchResult(payload);
      expect(res2.idempotencyHash).toBe(res1.idempotencyHash);
      expect(res2.eloResult.p1Delta).toBe(res1.eloResult.p1Delta);
      expect(res2.eloResult.p1NewRating).toBe(res1.eloResult.p1NewRating);
    });
  });

  describe('Concurrent Room Isolation', () => {
    it('should maintain strict isolation between multiple concurrent match rooms', async () => {
      const server = new GameServer();
      server.define('quiz_battle', QuizBattleRoom);

      // Spawn 10 concurrent rooms
      const rooms: QuizBattleRoom[] = [];
      for (let i = 0; i < 10; i++) {
        const r = await server.createRoom<QuizBattleRoom>('quiz_battle', {
          roomId: `concurrent_room_${i}`,
          questionCount: 3,
        });
        rooms.push(r);
      }

      expect(server.getActiveRoomsCount()).toBe(10);

      // Mutate room 0 state
      rooms[0].state.status = 'question_active';
      rooms[0].state.currentQuestionIndex = 2;

      // Room 1 should remain in waiting state at index 0
      expect(rooms[1].state.status).toBe('waiting');
      expect(rooms[1].state.currentQuestionIndex).toBe(0);

      // Clean up all rooms
      await server.close();
      expect(server.getActiveRoomsCount()).toBe(0);
    });
  });
});
