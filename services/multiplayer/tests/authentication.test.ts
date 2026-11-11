import { describe, it, expect, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import {
  validateMultiplayerTicket,
  clearConsumedNoncesForTest,
} from '../src/authentication/ticketValidator';

describe('1. Multiplayer Authentication & Ticket Security', () => {
  const testSecret = 'samyak_test_secret_key_12345';

  beforeEach(() => {
    clearConsumedNoncesForTest();
  });

  it('should accept and validate a legitimate HMAC-SHA256 multiplayer ticket', () => {
    const now = Math.floor(Date.now() / 1000);
    const token = jwt.sign(
      {
        userId: 'student_aarav_01',
        email: 'aarav@samyakcee.com',
        fullName: 'Aarav Sharma',
        rating: 1540,
        gameMode: 'ranked_1v1',
        nonce: 'nonce_valid_001',
        iat: now,
        exp: now + 60,
      },
      testSecret
    );

    const result = validateMultiplayerTicket(token, { secret: testSecret });
    expect(result.valid).toBe(true);
    expect(result.player).toBeDefined();
    expect(result.player?.userId).toBe('student_aarav_01');
    expect(result.player?.fullName).toBe('Aarav Sharma');
    expect(result.player?.rating).toBe(1540);
  });

  it('should reject missing, undefined, or empty tickets with HTTP 401 equivalent', () => {
    const res1 = validateMultiplayerTicket(null);
    expect(res1.valid).toBe(false);
    expect(res1.code).toBe('INVALID_TOKEN');

    const res2 = validateMultiplayerTicket('');
    expect(res2.valid).toBe(false);
    expect(res2.code).toBe('INVALID_TOKEN');
  });

  it('should reject tickets with forged or invalid cryptographic signatures', () => {
    const now = Math.floor(Date.now() / 1000);
    const rogueToken = jwt.sign(
      {
        userId: 'attacker_99',
        nonce: 'nonce_forged_001',
        exp: now + 60,
      },
      'attacker_wrong_secret_key' // Forged key
    );

    const result = validateMultiplayerTicket(rogueToken, { secret: testSecret });
    expect(result.valid).toBe(false);
    expect(result.code).toBe('INVALID_TOKEN');
    expect(result.error).toMatch(/Invalid multiplayer ticket signature/i);
  });

  it('should reject expired multiplayer tickets (TTL > 60 seconds)', () => {
    const now = Math.floor(Date.now() / 1000);
    const expiredToken = jwt.sign(
      {
        userId: 'student_late',
        nonce: 'nonce_expired_001',
        iat: now - 120,
        exp: now - 10, // Expired 10 seconds ago
      },
      testSecret
    );

    const result = validateMultiplayerTicket(expiredToken, { secret: testSecret });
    expect(result.valid).toBe(false);
    expect(result.code).toBe('EXPIRED_TICKET');
    expect(result.error).toMatch(/expired/i);
  });

  it('should detect and reject replay attacks when a ticket nonce is reused', () => {
    const now = Math.floor(Date.now() / 1000);
    const token = jwt.sign(
      {
        userId: 'student_target',
        nonce: 'single_use_nonce_777',
        exp: now + 60,
      },
      testSecret
    );

    // First use: Valid
    const firstAttempt = validateMultiplayerTicket(token, { secret: testSecret });
    expect(firstAttempt.valid).toBe(true);

    // Second use: Replay attack detected
    const secondAttempt = validateMultiplayerTicket(token, { secret: testSecret });
    expect(secondAttempt.valid).toBe(false);
    expect(secondAttempt.code).toBe('REPLAY_DETECTED');
    expect(secondAttempt.error).toMatch(/Replay Attack Detected/i);
  });

  it('should reject malformed payloads missing essential student claims', () => {
    const now = Math.floor(Date.now() / 1000);
    const malformedToken = jwt.sign(
      {
        // Missing userId and nonce
        role: 'guest',
        exp: now + 60,
      },
      testSecret
    );

    const result = validateMultiplayerTicket(malformedToken, { secret: testSecret });
    expect(result.valid).toBe(false);
    expect(result.code).toBe('MALFORMED_PAYLOAD');
  });
});
