/**
 * Samyak Multiplayer Service — Anti-Cheat & Telemetry Sentry
 * Detects speed-hacks, sub-human reaction times, packet injection, and action spam.
 */
export interface AntiCheatAuditLog {
    userId: string;
    matchId: string;
    eventType: 'SUB_HUMAN_REACTION' | 'DUPLICATE_SUBMISSION' | 'RATE_LIMIT_EXCEEDED' | 'OUT_OF_BOUNDS_TIMER';
    details: Record<string, any>;
    timestamp: string;
}
export declare class AntiCheatEngine {
    private clientActionBuckets;
    private auditLogs;
    /**
     * Enforces rate limiting per WebSocket connection session.
     */
    checkRateLimit(sessionId: string, maxPerSec?: number): boolean;
    /**
     * Evaluates response time for automated bot / optical recognition detection.
     * Human optical response + cognitive option selection cannot consistently occur under 350ms.
     */
    evaluateReactionTime(userId: string, matchId: string, questionId: string, elapsedMs: number, thresholdMs?: number): {
        suspicious: boolean;
        elapsedMs: number;
    };
    recordAudit(log: AntiCheatAuditLog): void;
    getAuditLogsForMatch(matchId: string): AntiCheatAuditLog[];
    cleanupSession(sessionId: string): void;
}
export declare const antiCheatEngine: AntiCheatEngine;
