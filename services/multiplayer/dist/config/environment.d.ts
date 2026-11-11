/**
 * Samyak Multiplayer Service — Authoritative Environment & Configuration
 * Validates, normalizes, and exposes typed environment settings.
 */
export interface MultiplayerConfig {
    port: number;
    host: string;
    env: 'development' | 'staging' | 'production';
    supabaseUrl: string;
    supabaseServiceKey: string;
    multiplayerSecret: string;
    redisUrl?: string;
    reconnectGraceSeconds: number;
    questionTimeLimitSeconds: number;
    roundReviewSeconds: number;
    countdownSeconds: number;
    maxQuestionsPerMatch: number;
    subHumanReactionMs: number;
    rateLimitMaxActionsPerSec: number;
    eloKFactor: number;
}
export declare function loadMultiplayerConfig(): MultiplayerConfig;
export declare const config: MultiplayerConfig;
