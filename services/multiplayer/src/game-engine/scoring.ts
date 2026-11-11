/**
 * Samyak Multiplayer Service — Authoritative Scoring & ELO Calculation Engine
 * Pure mathematical functions for answer evaluation, speed bonuses, streaks, and rating reconciliation.
 */

import crypto from 'crypto';

export interface AnswerEvaluationInput {
  isCorrect: boolean;
  elapsedMs: number;
  timeLimitMs: number;
  currentStreak: number;
}

export interface AnswerScoreResult {
  basePoints: number;
  speedBonus: number;
  streakBonus: number;
  totalRoundPoints: number;
  newStreak: number;
}

export interface EloReconciliationInput {
  player1: { id: string; rating: number; score: number };
  player2: { id: string; rating: number; score: number };
  kFactor?: number;
}

export interface EloReconciliationResult {
  p1Delta: number;
  p2Delta: number;
  p1NewRating: number;
  p2NewRating: number;
  winnerId: string | null; // null if draw
  isDraw: boolean;
}

/**
 * Calculates score for an answered question server-side.
 * Speed bonus reward is strictly bound between 0 and 100 based on server-verified elapsed time.
 */
export function calculateRoundScore(input: AnswerEvaluationInput): AnswerScoreResult {
  if (!input.isCorrect) {
    return {
      basePoints: 0,
      speedBonus: 0,
      streakBonus: 0,
      totalRoundPoints: 0,
      newStreak: 0,
    };
  }

  const basePoints = 100;

  // Speed bonus: max 100 points, linearly scaled by remaining time
  const remainingMs = Math.max(0, input.timeLimitMs - input.elapsedMs);
  const speedBonus = Math.min(100, Math.max(0, Math.floor((remainingMs / input.timeLimitMs) * 100)));

  // Consecutive answer streak multiplier
  const newStreak = input.currentStreak + 1;
  let streakMultiplier = 0;
  if (newStreak >= 5) {
    streakMultiplier = 0.3; // +30%
  } else if (newStreak >= 3) {
    streakMultiplier = 0.2; // +20%
  } else if (newStreak >= 2) {
    streakMultiplier = 0.1; // +10%
  }

  const subtotal = basePoints + speedBonus;
  const streakBonus = Math.floor(subtotal * streakMultiplier);
  const totalRoundPoints = subtotal + streakBonus;

  return {
    basePoints,
    speedBonus,
    streakBonus,
    totalRoundPoints,
    newStreak,
  };
}

/**
 * Authoritative ELO Rating Adjustment (FIDE Formula)
 */
export function calculateEloDeltas(input: EloReconciliationInput): EloReconciliationResult {
  const K = input.kFactor ?? 32;
  const { player1, player2 } = input;

  const r1 = player1.rating;
  const r2 = player2.rating;

  // Expected outcomes (logistic distribution)
  const expectedP1 = 1 / (1 + Math.pow(10, (r2 - r1) / 400));
  const expectedP2 = 1 / (1 + Math.pow(10, (r1 - r2) / 400));

  let actualP1 = 0.5;
  let actualP2 = 0.5;
  let winnerId: string | null = null;
  let isDraw = false;

  if (player1.score > player2.score) {
    actualP1 = 1.0;
    actualP2 = 0.0;
    winnerId = player1.id;
  } else if (player2.score > player1.score) {
    actualP1 = 0.0;
    actualP2 = 1.0;
    winnerId = player2.id;
  } else {
    isDraw = true;
  }

  const p1Delta = Math.round(K * (actualP1 - expectedP1));
  const p2Delta = Math.round(K * (actualP2 - expectedP2));

  const p1NewRating = Math.max(100, r1 + p1Delta);
  const p2NewRating = Math.max(100, r2 + p2Delta);

  return {
    p1Delta,
    p2Delta,
    p1NewRating,
    p2NewRating,
    winnerId,
    isDraw,
  };
}

/**
 * Computes deterministic idempotency hash for a completed match.
 */
export function computeMatchReceiptHash(
  matchId: string,
  p1Id: string,
  p2Id: string,
  p1Score: number,
  p2Score: number,
  secretKey: string = 'samyak_receipt_master'
): string {
  const payload = [matchId, p1Id, p2Id, p1Score, p2Score].join('|');
  return crypto.createHmac('sha256', secretKey).update(payload).digest('hex');
}
