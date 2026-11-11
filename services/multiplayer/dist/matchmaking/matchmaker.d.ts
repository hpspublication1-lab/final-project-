/**
 * Samyak Multiplayer Service — ELO Range Expanding Matchmaker
 * Pairs candidates by academic rating, subject filter, and queue duration.
 */
import { ValidatedPlayerAuth } from '../authentication/ticketValidator';
export interface QueuedPlayer {
    sessionId: string;
    player: ValidatedPlayerAuth;
    subjectFilter: string;
    mode: string;
    joinedAt: number;
}
export interface MatchPairResult {
    player1: QueuedPlayer;
    player2: QueuedPlayer;
    isBotMatch: boolean;
    roomId: string;
    subject: string;
}
export declare class Matchmaker {
    private queue;
    /**
     * Enqueues an authenticated candidate.
     */
    enqueue(sessionId: string, player: ValidatedPlayerAuth, subjectFilter?: string): void;
    /**
     * Dequeues a player when canceled or disconnected.
     */
    dequeue(sessionId: string): boolean;
    /**
     * Iterates through queue and pairs compatible candidates.
     * Expands ELO acceptance windows progressively:
     * - < 5s: ±75 ELO
     * - 5-10s: ±150 ELO
     * - 10-15s: ±300 ELO
     * - > 15s: Spawns a balanced AI opponent
     */
    processQueue(nowMs?: number): MatchPairResult[];
    getQueueSize(): number;
    clear(): void;
}
export declare const matchmaker: Matchmaker;
