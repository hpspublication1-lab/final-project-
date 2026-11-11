import { describe, it, expect, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import { QuizBattleRoom } from '../src/rooms/QuizBattleRoom';
import { Client } from '../src/colyseus/room';
import { clearConsumedNoncesForTest } from '../src/authentication/ticketValidator';

class MockClient implements Client {
  public sessionId: string;
  public auth?: any;
  public messagesSent: Array<{ type: string | number; message: any }> = [];
  public isClosed: boolean = false;
  public closeCode?: number;
  public closeReason?: string;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
  }

  send(type: string | number, message?: any): void {
    this.messagesSent.push({ type, message });
  }

  close(code?: number, data?: string): void {
    this.isClosed = true;
    this.closeCode = code;
    this.closeReason = data;
  }

  getLastMessage(type?: string): any {
    if (type) {
      const match = [...this.messagesSent].reverse().find((m) => m.type === type);
      return match?.message;
    }
    return this.messagesSent[this.messagesSent.length - 1]?.message;
  }
}

describe('4. Authoritative QuizBattleRoom Lifecycle & Netcode', () => {
  const secret = 'samyak_colyseus_multiplayer_secret_key_2026';
  let room: QuizBattleRoom;

  beforeEach(async () => {
    clearConsumedNoncesForTest();
    room = new QuizBattleRoom();
    await room.onCreate({
      ticket: '',
      questionCount: 3,
    });
  });

  function makeTicket(userId: string, rating: number = 1400): string {
    const now = Math.floor(Date.now() / 1000);
    return jwt.sign(
      {
        userId,
        email: `${userId}@samyakcee.com`,
        fullName: `Candidate ${userId}`,
        rating,
        gameMode: 'ranked_1v1',
        nonce: `nonce_${userId}_${Math.random()}`,
        iat: now,
        exp: now + 60,
      },
      secret
    );
  }

  it('should initialize room with 0 players and total questions set', () => {
    expect(room.state.status).toBe('waiting');
    expect(room.state.players.size).toBe(0);
    expect(room.state.totalQuestions).toBe(3);
  });

  it('should reject client during onAuth if ticket is invalid or missing', async () => {
    const client = new MockClient('sess_bad');

    await expect(room.onAuth(client, { ticket: 'invalid_junk_ticket' })).rejects.toThrow(
      /Authentication Failed/i
    );
  });

  it('should accept client during onAuth with valid ticket and return player claims', async () => {
    const client = new MockClient('sess_good');
    const ticket = makeTicket('student_valid');

    const auth = await room.onAuth(client, { ticket });
    expect(auth.userId).toBe('student_valid');
    expect(auth.rating).toBe(1400);
  });

  it('should allow two players to join and automatically trigger 3-second countdown', async () => {
    const client1 = new MockClient('sess_1');
    const client2 = new MockClient('sess_2');

    const auth1 = await room.onAuth(client1, { ticket: makeTicket('user_1', 1450) });
    const auth2 = await room.onAuth(client2, { ticket: makeTicket('user_2', 1500) });

    await room.onJoin(client1, {} as any, auth1);
    expect(room.state.players.size).toBe(1);
    expect(room.state.status).toBe('waiting');

    await room.onJoin(client2, {} as any, auth2);
    expect(room.state.players.size).toBe(2);
    expect(room.state.status).toBe('countdown');

    const lastBroadcast = client1.getLastMessage('countdownTick');
    expect(lastBroadcast).toBeDefined();
  });

  it('should evaluate submitted answers server-side and update player score', async () => {
    const client1 = new MockClient('sess_1');
    const client2 = new MockClient('sess_2');

    const auth1 = await room.onAuth(client1, { ticket: makeTicket('user_1') });
    const auth2 = await room.onAuth(client2, { ticket: makeTicket('user_2') });

    await room.onJoin(client1, {} as any, auth1);
    await room.onJoin(client2, {} as any, auth2);

    // Fast-forward countdown into question active stage
    (room as any).startNextRound();
    expect(room.state.status).toBe('question_active');
    expect(room.state.currentQuestion).toBeDefined();

    const activeQ = room.state.currentQuestion!;
    const correctOptionId = (room as any).answerKeyMap.get(activeQ.id);

    // Player 1 submits correct answer
    room.dispatchMessage(client1, 'SUBMIT_OPTION', {
      questionId: activeQ.id,
      optionId: correctOptionId,
    });

    const evalP1 = client1.getLastMessage('answerEvaluated');
    expect(evalP1.isCorrect).toBe(true);
    expect(evalP1.pointsAwarded).toBeGreaterThanOrEqual(100);
    expect(evalP1.correctOptionId).toBe(correctOptionId);

    // Opponent receives progress update
    const oppUpdate = client2.getLastMessage('opponentProgress');
    expect(oppUpdate.opponentId).toBe('user_1');
    expect(oppUpdate.opponentScore).toBe(evalP1.currentScore);
  });

  it('should block duplicate answer submissions from the same player in a single round', () => {
    const client1 = new MockClient('sess_1');
    const client2 = new MockClient('sess_2');
    room.clients.push(client1, client2);

    room.state.players.set('sess_1', { id: 'u1', hasAnsweredCurrentRound: false, streak: 0, score: 0 } as any);
    room.state.players.set('sess_2', { id: 'u2', hasAnsweredCurrentRound: false, streak: 0, score: 0 } as any);
    (room as any).startNextRound();

    const activeQ = room.state.currentQuestion!;

    // 1st submission: OK
    room.dispatchMessage(client1, 'SUBMIT_OPTION', {
      questionId: activeQ.id,
      optionId: 'a',
    });

    // 2nd submission in same round: Blocked
    room.dispatchMessage(client1, 'SUBMIT_OPTION', {
      questionId: activeQ.id,
      optionId: 'b',
    });

    const errorMsg = client1.getLastMessage('error');
    expect(errorMsg.code).toBe('DUPLICATE_SUBMISSION');
    expect(errorMsg.message).toMatch(/already submitted/i);
  });

  it('should advance to round review immediately once both players submit', () => {
    const client1 = new MockClient('sess_1');
    const client2 = new MockClient('sess_2');
    room.clients.push(client1, client2);

    room.state.players.set('sess_1', { id: 'u1', hasAnsweredCurrentRound: false, streak: 0, score: 0 } as any);
    room.state.players.set('sess_2', { id: 'u2', hasAnsweredCurrentRound: false, streak: 0, score: 0 } as any);
    (room as any).startNextRound();

    const activeQ = room.state.currentQuestion!;

    room.dispatchMessage(client1, 'SUBMIT_OPTION', { questionId: activeQ.id, optionId: 'a' });
    expect(room.state.status).toBe('question_active');

    room.dispatchMessage(client2, 'SUBMIT_OPTION', { questionId: activeQ.id, optionId: 'b' });
    // Both answered -> transitions to round review
    expect(room.state.status).toBe('round_review');
  });

  it('should conclude match, calculate ELO, and broadcast results after all questions', async () => {
    const client1 = new MockClient('sess_1');
    const client2 = new MockClient('sess_2');
    room.clients.push(client1, client2);

    const p1 = { id: 'u1', name: 'Candidate 1', rating: 1400, score: 650, correctCount: 3, incorrectCount: 0 } as any;
    const p2 = { id: 'u2', name: 'Candidate 2', rating: 1400, score: 320, correctCount: 1, incorrectCount: 2 } as any;

    room.state.players.set('sess_1', p1);
    room.state.players.set('sess_2', p2);

    await room.finishMatch();

    expect(room.state.status).toBe('match_ended');
    expect(room.state.winnerId).toBe('u1');
    expect(room.state.idempotencyHash).toBeDefined();

    const matchEndedMsg = client1.getLastMessage('matchEnded');
    expect(matchEndedMsg).toBeDefined();
    expect(matchEndedMsg.winnerId).toBe('u1');
    expect(matchEndedMsg.results.length).toBe(2);
    expect(matchEndedMsg.results[0].ratingDelta).toBe(16);
    expect(matchEndedMsg.results[1].ratingDelta).toBe(-16);
  });

  it('should forward WebRTC proctoring signaling between candidates in the room', async () => {
    const client1 = new MockClient('sess_1');
    const client2 = new MockClient('sess_2');

    const auth1 = await room.onAuth(client1, { ticket: makeTicket('u1') });
    const auth2 = await room.onAuth(client2, { ticket: makeTicket('u2') });

    await room.onJoin(client1, { ticket: '' }, auth1);
    await room.onJoin(client2, { ticket: '' }, auth2);

    // Client 1 sends WebRTC SDP Offer
    room.dispatchMessage(client1, 'WEBRTC_SIGNAL', {
      type: 'offer',
      data: { sdp: 'v=0\r\no=alice...' },
    });

    // Client 2 should receive the relayed signal
    const c2Signal = client2.getLastMessage('WEBRTC_SIGNAL');
    expect(c2Signal).toBeDefined();
    expect(c2Signal.senderSessionId).toBe('sess_1');
    expect(c2Signal.type).toBe('offer');
    expect(c2Signal.data.sdp).toBe('v=0\r\no=alice...');

    // Client 2 replies with SDP Answer
    room.dispatchMessage(client2, 'WEBRTC_SIGNAL', {
      type: 'answer',
      data: { sdp: 'v=0\r\no=bob...' },
    });

    // Client 1 should receive the relayed answer
    const c1Signal = client1.getLastMessage('WEBRTC_SIGNAL');
    expect(c1Signal).toBeDefined();
    expect(c1Signal.senderSessionId).toBe('sess_2');
    expect(c1Signal.type).toBe('answer');
  });
});
