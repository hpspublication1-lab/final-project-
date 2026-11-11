/**
 * Samyak Multiplayer Service — Idempotent Result Persistence Engine
 * Writes validated match results, rating deltas, and telemetry to Supabase PostgreSQL.
 */
import { EloReconciliationResult } from '../game-engine/scoring';
import { PlayerState } from '../rooms/schema/QuizBattleState';
export interface MatchPersistencePayload {
    roomId: string;
    roomCode?: string;
    player1: PlayerState;
    player2: PlayerState;
    subject: string;
    totalQuestions: number;
}
export interface PersistenceResult {
    success: boolean;
    idempotencyHash: string;
    eloResult: EloReconciliationResult;
    persistedToDatabase: boolean;
    error?: string;
}
export declare class ResultPersister {
    private supabase;
    private processedMatches;
    constructor();
    /**
     * Persists match results idempotently.
     * If called multiple times with the same roomId and scores, returns identical stored receipt.
     */
    persistMatchResult(payload: MatchPersistencePayload): Promise<PersistenceResult>;
    clearProcessedMatches(): void;
}
export declare const resultPersister: ResultPersister;
