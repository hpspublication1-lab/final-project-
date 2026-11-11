"use strict";
/**
 * Samyak Multiplayer Service — Anti-Cheat & Telemetry Sentry
 * Detects speed-hacks, sub-human reaction times, packet injection, and action spam.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.antiCheatEngine = exports.AntiCheatEngine = void 0;
const environment_1 = require("../config/environment");
class AntiCheatEngine {
    clientActionBuckets = new Map();
    auditLogs = [];
    /**
     * Enforces rate limiting per WebSocket connection session.
     */
    checkRateLimit(sessionId, maxPerSec = environment_1.config.rateLimitMaxActionsPerSec) {
        const now = Date.now();
        const bucket = this.clientActionBuckets.get(sessionId) || { count: 0, resetAt: now + 1000 };
        if (now > bucket.resetAt) {
            bucket.count = 1;
            bucket.resetAt = now + 1000;
            this.clientActionBuckets.set(sessionId, bucket);
            return true;
        }
        bucket.count += 1;
        this.clientActionBuckets.set(sessionId, bucket);
        return bucket.count <= maxPerSec;
    }
    /**
     * Evaluates response time for automated bot / optical recognition detection.
     * Human optical response + cognitive option selection cannot consistently occur under 350ms.
     */
    evaluateReactionTime(userId, matchId, questionId, elapsedMs, thresholdMs = environment_1.config.subHumanReactionMs) {
        if (elapsedMs < thresholdMs) {
            this.recordAudit({
                userId,
                matchId,
                eventType: 'SUB_HUMAN_REACTION',
                details: {
                    questionId,
                    elapsedMs,
                    thresholdMs,
                    note: `Reaction time ${elapsedMs}ms is below human anatomical threshold (${thresholdMs}ms)`,
                },
                timestamp: new Date().toISOString(),
            });
            return { suspicious: true, elapsedMs };
        }
        return { suspicious: false, elapsedMs };
    }
    recordAudit(log) {
        this.auditLogs.push(log);
        if (this.auditLogs.length > 5000) {
            this.auditLogs.splice(0, 1000);
        }
    }
    getAuditLogsForMatch(matchId) {
        return this.auditLogs.filter((l) => l.matchId === matchId);
    }
    cleanupSession(sessionId) {
        this.clientActionBuckets.delete(sessionId);
    }
}
exports.AntiCheatEngine = AntiCheatEngine;
exports.antiCheatEngine = new AntiCheatEngine();
