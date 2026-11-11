import { describe, it, expect, beforeEach } from 'vitest';
import { Matchmaker } from '../src/matchmaking/matchmaker';
import { ValidatedPlayerAuth } from '../src/authentication/ticketValidator';

describe('2. Matchmaking Engine & ELO Expansion Tests', () => {
  let mm: Matchmaker;

  beforeEach(() => {
    mm = new Matchmaker();
  });

  function makePlayer(id: string, rating: number, subject: string = 'physics'): ValidatedPlayerAuth {
    return {
      userId: `user_${id}`,
      email: `${id}@samyakcee.com`,
      fullName: `Player ${id}`,
      rating,
      gameMode: 'ranked_1v1',
      nonce: `nonce_${id}_${Date.now()}`,
      issuedAt: Math.floor(Date.now() / 1000),
      expiresAt: Math.floor(Date.now() / 1000) + 60,
    };
  }

  it('should immediately pair two players with close ELO (< 75 difference)', () => {
    const p1 = makePlayer('1', 1450, 'physics');
    const p2 = makePlayer('2', 1480, 'physics'); // diff = 30 (< 75)

    mm.enqueue('sess_1', p1, 'physics');
    mm.enqueue('sess_2', p2, 'physics');

    const matches = mm.processQueue();
    expect(matches.length).toBe(1);
    expect(matches[0].isBotMatch).toBe(false);
    expect(matches[0].player1.player.userId).toBe('user_1');
    expect(matches[0].player2.player.userId).toBe('user_2');
    expect(mm.getQueueSize()).toBe(0);
  });

  it('should not pair players with large ELO gap immediately (> 75 difference within 0-5s)', () => {
    const p1 = makePlayer('1', 1200, 'physics');
    const p2 = makePlayer('2', 1500, 'physics'); // diff = 300 (> 75)

    mm.enqueue('sess_1', p1, 'physics');
    mm.enqueue('sess_2', p2, 'physics');

    const matches = mm.processQueue(Date.now()); // 0s elapsed
    expect(matches.length).toBe(0);
    expect(mm.getQueueSize()).toBe(2);
  });

  it('should expand ELO range to ±150 after 6 seconds of waiting', () => {
    const now = Date.now();
    const p1 = makePlayer('1', 1350, 'biology');
    const p2 = makePlayer('2', 1480, 'biology'); // diff = 130 (< 150)

    mm.enqueue('sess_1', p1, 'biology');
    mm.enqueue('sess_2', p2, 'biology');

    // 0s: No match
    expect(mm.processQueue(now).length).toBe(0);

    // 6s elapsed: Range expands to ±150 -> Matches!
    const matches = mm.processQueue(now + 6000);
    expect(matches.length).toBe(1);
    expect(matches[0].player1.player.userId).toBe('user_1');
    expect(matches[0].player2.player.userId).toBe('user_2');
  });

  it('should expand ELO range to ±300 after 11 seconds of waiting', () => {
    const now = Date.now();
    const p1 = makePlayer('1', 1200, 'chemistry');
    const p2 = makePlayer('2', 1450, 'chemistry'); // diff = 250 (< 300)

    mm.enqueue('sess_1', p1, 'chemistry');
    mm.enqueue('sess_2', p2, 'chemistry');

    // 8s: No match (diff 250 > 150)
    expect(mm.processQueue(now + 8000).length).toBe(0);

    // 12s elapsed: Range expands to ±300 -> Matches!
    const matches = mm.processQueue(now + 12000);
    expect(matches.length).toBe(1);
    expect(matches[0].isBotMatch).toBe(false);
  });

  it('should spawn a balanced AI opponent after 15 seconds to prevent starvation in small pools', () => {
    const now = Date.now();
    const lonelyPlayer = makePlayer('solo', 1600, 'mental_agility');

    mm.enqueue('sess_solo', lonelyPlayer, 'mental_agility');

    // At 16 seconds of waiting
    const matches = mm.processQueue(now + 16000);
    expect(matches.length).toBe(1);
    expect(matches[0].isBotMatch).toBe(true);
    expect(matches[0].player1.player.userId).toBe('user_solo');
    expect(matches[0].player2.player.userId).toMatch(/^bot_/);
    expect(matches[0].player2.player.fullName).toMatch(/AI Scholar/i);
    expect(mm.getQueueSize()).toBe(0);
  });

  it('should remove player from queue upon dequeue', () => {
    const p = makePlayer('1', 1400);
    mm.enqueue('sess_1', p);
    expect(mm.getQueueSize()).toBe(1);

    const removed = mm.dequeue('sess_1');
    expect(removed).toBe(true);
    expect(mm.getQueueSize()).toBe(0);
  });
});
