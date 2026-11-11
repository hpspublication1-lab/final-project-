/**
 * Samyak Multiplayer Service — Authoritative Supabase Repository Adapter
 * Bridges Colyseus game rooms with the canonical Supabase PostgreSQL database.
 */
export interface ServerQuestion {
    id: string;
    prompt: string;
    options: Array<{
        id: string;
        text: string;
    }>;
    correctOptionId: string;
    explanation?: string;
}
export interface AuthorizedMatch {
    id: string;
    roomType: 'quiz_battle';
    status: 'waiting' | 'ready' | 'active' | 'completed' | 'cancelled';
    participantIds: string[];
    questionIds: string[];
    questionDurationMs: number;
    scoringRules: {
        correct: number;
        incorrect: number;
        unanswered: number;
    };
}
export interface FinalPlayerResult {
    userId: string;
    score: number;
    correctCount: number;
    incorrectCount: number;
    unansweredCount: number;
    ratingChange?: number;
    newRating?: number;
    isWinner?: boolean;
}
export interface AuthoritativeMatchResult {
    matchId: string;
    idempotencyKey: string;
    completedAt: string;
    players: FinalPlayerResult[];
    engineVersion: string;
    serverNodeId?: string;
    telemetryAudit?: Record<string, unknown>;
}
export interface ArenaRepository {
    loadMatch(matchId: string): Promise<AuthorizedMatch | null>;
    assertPlayerCanJoinMatch(matchId: string, userId: string): Promise<boolean>;
    getPublicDisplayName(userId: string): Promise<string>;
    loadQuestionsForMatch(matchId: string): Promise<ServerQuestion[]>;
    persistAuthoritativeResult(result: AuthoritativeMatchResult): Promise<void>;
    persistNoContest(input: {
        matchId: string;
        userId: string;
        reason: string;
        idempotencyKey: string;
    }): Promise<void>;
}
export declare class SupabaseArenaRepository implements ArenaRepository {
    private supabase;
    private readonly fallbackDisplayNames;
    private readonly processedIdempotencyKeys;
    constructor();
    loadMatch(matchId: string): Promise<AuthorizedMatch | null>;
    assertPlayerCanJoinMatch(matchId: string, userId: string): Promise<boolean>;
    getPublicDisplayName(userId: string): Promise<string>;
    loadQuestionsForMatch(matchId: string): Promise<ServerQuestion[]>;
    persistAuthoritativeResult(result: AuthoritativeMatchResult): Promise<void>;
    persistNoContest(input: {
        matchId: string;
        userId: string;
        reason: string;
        idempotencyKey: string;
    }): Promise<void>;
}
export declare const defaultSupabaseArenaRepository: SupabaseArenaRepository;
