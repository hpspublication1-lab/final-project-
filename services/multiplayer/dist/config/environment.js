"use strict";
/**
 * Samyak Multiplayer Service — Authoritative Environment & Configuration
 * Validates, normalizes, and exposes typed environment settings.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.loadMultiplayerConfig = loadMultiplayerConfig;
function loadMultiplayerConfig() {
    const env = (process.env.NODE_ENV || 'development');
    const multiplayerSecret = process.env.MULTIPLAYER_SECRET_KEY ||
        process.env.SUPABASE_SERVICE_ROLE_KEY ||
        'samyak_colyseus_multiplayer_secret_key_2026';
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key';
    return {
        port: Number(process.env.PORT) || 2567,
        host: process.env.HOST || '0.0.0.0',
        env,
        supabaseUrl,
        supabaseServiceKey,
        multiplayerSecret,
        redisUrl: process.env.REDIS_URL,
        reconnectGraceSeconds: Number(process.env.RECONNECT_GRACE_SECONDS) || 15,
        questionTimeLimitSeconds: Number(process.env.QUESTION_TIME_LIMIT_SECONDS) || 15,
        roundReviewSeconds: Number(process.env.ROUND_REVIEW_SECONDS) || 3,
        countdownSeconds: Number(process.env.COUNTDOWN_SECONDS) || 3,
        maxQuestionsPerMatch: Number(process.env.MAX_QUESTIONS_PER_MATCH) || 10,
        subHumanReactionMs: Number(process.env.SUB_HUMAN_REACTION_MS) || 350,
        rateLimitMaxActionsPerSec: Number(process.env.RATE_LIMIT_ACTIONS_PER_SEC) || 10,
        eloKFactor: Number(process.env.ELO_K_FACTOR) || 32,
    };
}
exports.config = loadMultiplayerConfig();
