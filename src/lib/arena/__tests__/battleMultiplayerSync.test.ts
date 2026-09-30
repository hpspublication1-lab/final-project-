import { describe, it, expect } from 'vitest';

/**
 * Two-Player Real-Time Battle Arena Synchronization Simulator
 * Tests concurrent session matchmaking, question delivery, ELO updates, and reconnection.
 */
interface BattleRoom {
  id: string;
  room_code: string;
  creator_id: string;
  opponent_id: string | null;
  status: 'waiting' | 'matched' | 'active' | 'completed';
  question_ids: string[];
  is_ranked: boolean;
}

interface BattlePlayerSession {
  userId: string;
  username: string;
  rating: number;
  currentRoomId: string | null;
  receivedQuestions: string[];
  answersSubmitted: Record<string, string>;
  score: number;
  status: 'idle' | 'in_match' | 'disconnected';
}

class BattleArenaServerSimulation {
  private rooms: Map<string, BattleRoom> = new Map();
  private results: Map<string, { ratingChange: number; processed: boolean }> = new Map();

  createRoom(creatorId: string, isRanked: boolean = true): BattleRoom {
    const roomId = `room-${Math.random().toString(36).substring(2, 9)}`;
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    // Server generates authoritative question list
    const questionIds = [
      'q-bio-01', 'q-phy-02', 'q-chem-03', 'q-bio-04', 'q-phy-05',
      'q-mat-06', 'q-chem-07', 'q-bio-08', 'q-phy-09', 'q-mat-10',
    ];

    const room: BattleRoom = {
      id: roomId,
      room_code: roomCode,
      creator_id: creatorId,
      opponent_id: null,
      status: 'waiting',
      question_ids: questionIds,
      is_ranked: isRanked,
    };
    this.rooms.set(roomId, room);
    return room;
  }

  joinRoom(roomId: string, opponentId: string): BattleRoom {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error('Room not found');
    if (room.status !== 'waiting') throw new Error('Room is not available');

    room.opponent_id = opponentId;
    room.status = 'active';
    return room;
  }

  getRoomQuestions(roomId: string, userId: string): string[] {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error('Room not found');
    if (room.creator_id !== userId && room.opponent_id !== userId) {
      throw new Error('Unauthorized room access');
    }
    // Returns the authoritative question sequence
    return [...room.question_ids];
  }

  submitMatchResult(
    roomId: string,
    playerId: string,
    score: number,
    opponentRating: number,
    myRating: number
  ): { ratingChange: number; newRating: number; idempotent: boolean } {
    const key = `${roomId}:${playerId}`;
    const existing = this.results.get(key);

    // Idempotent: cannot submit multiple times for duplicate ELO
    if (existing) {
      return {
        ratingChange: 0,
        newRating: myRating,
        idempotent: true,
      };
    }

    const room = this.rooms.get(roomId);
    let ratingChange = 0;

    // ELO update ONLY occurs if match is ranked
    if (room?.is_ranked) {
      const K = 32;
      const expected = 1 / (1 + Math.pow(10, (opponentRating - myRating) / 400));
      const outcome = score >= 50 ? 1.0 : 0.0;
      ratingChange = Math.round(K * (outcome - expected));
    }

    this.results.set(key, { ratingChange, processed: true });

    return {
      ratingChange,
      newRating: myRating + ratingChange,
      idempotent: false,
    };
  }

  handleDisconnect(roomId: string, playerId: string): void {
    const room = this.rooms.get(roomId);
    if (room && (room.creator_id === playerId || room.opponent_id === playerId)) {
      // Room state is preserved on server for reconnection
      room.status = 'active';
    }
  }

  handleReconnect(roomId: string, playerId: string): BattleRoom | null {
    const room = this.rooms.get(roomId);
    if (room && (room.creator_id === playerId || room.opponent_id === playerId)) {
      return room;
    }
    return null;
  }
}

describe('Battle Arena Real-Time Concurrency & Synchronization (Two-Player Session)', () => {
  it('delivers 100% identical authoritative question sequences to both players in a match', () => {
    const server = new BattleArenaServerSimulation();
    const playerA: BattlePlayerSession = {
      userId: 'student-A-uuid',
      username: 'Aayush CEE',
      rating: 1250,
      currentRoomId: null,
      receivedQuestions: [],
      answersSubmitted: {},
      score: 0,
      status: 'idle',
    };

    const playerB: BattlePlayerSession = {
      userId: 'student-B-uuid',
      username: 'Bibek CEE',
      rating: 1200,
      currentRoomId: null,
      receivedQuestions: [],
      answersSubmitted: {},
      score: 0,
      status: 'idle',
    };

    // 1. Player A creates room
    const room = server.createRoom(playerA.userId, true);
    playerA.currentRoomId = room.id;

    // 2. Player B joins room
    server.joinRoom(room.id, playerB.userId);
    playerB.currentRoomId = room.id;

    // 3. Both fetch questions from the server
    playerA.receivedQuestions = server.getRoomQuestions(room.id, playerA.userId);
    playerB.receivedQuestions = server.getRoomQuestions(room.id, playerB.userId);

    // Must be identical in length, IDs, and sequence
    expect(playerA.receivedQuestions).toEqual(playerB.receivedQuestions);
    expect(playerA.receivedQuestions).toHaveLength(10);
    expect(playerA.receivedQuestions[0]).toBe('q-bio-01');
  });

  it('prevents duplicate result submission from awarding ELO rating changes more than once', () => {
    const server = new BattleArenaServerSimulation();
    const room = server.createRoom('p1', true);
    server.joinRoom(room.id, 'p2');

    // Player 1 finishes and submits
    const firstSubmit = server.submitMatchResult(room.id, 'p1', 80, 1200, 1200);
    expect(firstSubmit.idempotent).toBe(false);
    expect(firstSubmit.ratingChange).toBeGreaterThan(0);
    const initialNewRating = firstSubmit.newRating;

    // Player 1 re-submits due to browser refresh / double click
    const secondSubmit = server.submitMatchResult(room.id, 'p1', 80, 1200, initialNewRating);
    expect(secondSubmit.idempotent).toBe(true);
    expect(secondSubmit.ratingChange).toBe(0);
    expect(secondSubmit.newRating).toBe(initialNewRating);
  });

  it('preserves match room state during player disconnection and enables seamless reconnection', () => {
    const server = new BattleArenaServerSimulation();
    const room = server.createRoom('player-dc', true);
    server.joinRoom(room.id, 'player-stay');

    // Player DC loses internet connection
    server.handleDisconnect(room.id, 'player-dc');

    // Player DC reconnects 5 seconds later
    const restoredRoom = server.handleReconnect(room.id, 'player-dc');
    expect(restoredRoom).not.toBeNull();
    expect(restoredRoom?.id).toBe(room.id);
    expect(restoredRoom?.question_ids).toHaveLength(10);
  });

  it('strictly leaves ELO ratings unchanged for private friendly matches', () => {
    const server = new BattleArenaServerSimulation();
    // Create an UNRANKED private match
    const privateRoom = server.createRoom('friend-1', false);
    server.joinRoom(privateRoom.id, 'friend-2');

    const result = server.submitMatchResult(privateRoom.id, 'friend-1', 90, 1200, 1200);
    expect(result.ratingChange).toBe(0);
    expect(result.newRating).toBe(1200);
  });
});
