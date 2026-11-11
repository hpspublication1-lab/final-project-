/**
 * Samyak Multiplayer Service — Authoritative Scoring & ELO Calculation Engine
 * Pure mathematical functions for answer evaluation, speed bonuses, streaks, and rating reconciliation.
 */
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
    player1: {
        id: string;
        rating: number;
        score: number;
    };
    player2: {
        id: string;
        rating: number;
        score: number;
    };
    kFactor?: number;
}
export interface EloReconciliationResult {
    p1Delta: number;
    p2Delta: number;
    p1NewRating: number;
    p2NewRating: number;
    winnerId: string | null;
    isDraw: boolean;
}
/**
 * Calculates score for an answered question server-side.
 * Speed bonus reward is strictly bound between 0 and 100 based on server-verified elapsed time.
 */
export declare function calculateRoundScore(input: AnswerEvaluationInput): AnswerScoreResult;
/**
 * Authoritative ELO Rating Adjustment (FIDE Formula)
 */
export declare function calculateEloDeltas(input: EloReconciliationInput): EloReconciliationResult;
/**
 * Computes deterministic idempotency hash for a completed match.
 */
export declare function computeMatchReceiptHash(matchId: string, p1Id: string, p2Id: string, p1Score: number, p2Score: number, secretKey?: string): string;
