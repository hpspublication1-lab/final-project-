/**
 * Samyak Multiplayer Service — Anti-Cheat & Telemetry Sentry
 * Detects speed-hacks, sub-human reaction times, packet injection, and action spam.
 */

import { config } from '../config/environment';

export interface AntiCheatAuditLog {
  userId: string;
  matchId: string;
  eventType: 'SUB_HUMAN_REACTION' | 'DUPLICATE_SUBMISSION' | 'RATE_LIMIT_EXCEEDED' | 'OUT_OF_BOUNDS_TIMER';
  details: Record<string, any>;
  timestamp: string;
}

export class AntiCheatEngine {
  private clientActionBuckets: Map<string, { count: number; resetAt: number }> = new Map();
  private auditLogs: AntiCheatAuditLog[] = [];

  /**
   * Enforces rate limiting per WebSocket connection session.
   */
  checkRateLimit(sessionId: string, maxPerSec: number = config.rateLimitMaxActionsPerSec): boolean {
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
  evaluateReactionTime(
    userId: string,
    matchId: string,
    questionId: string,
    elapsedMs: number,
    thresholdMs: number = config.subHumanReactionMs
  ): { suspicious: boolean; elapsedMs: number } {
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

  recordAudit(log: AntiCheatAuditLog): void {
    this.auditLogs.push(log);
    if (this.auditLogs.length > 5000) {
      this.auditLogs.splice(0, 1000);
    }
  }

  getAuditLogsForMatch(matchId: string): AntiCheatAuditLog[] {
    return this.auditLogs.filter((l) => l.matchId === matchId);
  }

  cleanupSession(sessionId: string): void {
    this.clientActionBuckets.delete(sessionId);
  }
}

export const antiCheatEngine = new AntiCheatEngine();
