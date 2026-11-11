"use strict";
/**
 * Samyak Multiplayer Service — Ticket Validation & Authentication Engine
 * Validates HMAC-SHA256 signed multiplayer access tickets issued by the platform.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateMultiplayerTicket = validateMultiplayerTicket;
exports.clearConsumedNoncesForTest = clearConsumedNoncesForTest;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const environment_1 = require("../config/environment");
// In-memory nonce store to prevent token reuse and replay attacks
const consumedNonces = new Map();
/**
 * Clears expired nonces periodically to maintain bounded memory footprint.
 */
function cleanStaleNonces() {
    const now = Math.floor(Date.now() / 1000);
    for (const [nonce, expiresAt] of consumedNonces.entries()) {
        if (expiresAt <= now) {
            consumedNonces.delete(nonce);
        }
    }
}
/**
 * Validates a short-lived multiplayer access ticket.
 * Enforces HMAC-SHA256 signature verification, TTL check, and single-use nonces.
 */
function validateMultiplayerTicket(ticket, options) {
    if (!ticket || typeof ticket !== 'string') {
        return {
            valid: false,
            error: 'Missing multiplayer access ticket',
            code: 'INVALID_TOKEN',
        };
    }
    const secret = options?.secret || environment_1.config.multiplayerSecret;
    const nowSec = options?.nowSec ?? Math.floor(Date.now() / 1000);
    try {
        const decoded = jsonwebtoken_1.default.verify(ticket, secret, { algorithms: ['HS256'] });
        const userId = decoded.userId || decoded.sub;
        if (!decoded || !userId || !decoded.nonce) {
            return {
                valid: false,
                error: 'Malformed ticket payload: missing essential student claims',
                code: 'MALFORMED_PAYLOAD',
            };
        }
        const ALLOWED_GAME_MODES = ['ranked_1v1', 'unranked_1v1', 'custom_room', 'tournament_match', 'classroom_battle', 'quiz_battle'];
        if (decoded.gameMode && !ALLOWED_GAME_MODES.includes(decoded.gameMode)) {
            return {
                valid: false,
                error: `Unsupported or unauthorized game mode: ${decoded.gameMode}`,
                code: 'MALFORMED_PAYLOAD',
            };
        }
        // 1. Expiration check
        if (decoded.exp && decoded.exp <= nowSec) {
            return {
                valid: false,
                error: 'Multiplayer ticket has expired. Please acquire a fresh ticket.',
                code: 'EXPIRED_TICKET',
            };
        }
        // 2. Anti-Replay check: Nonce must be unique and unused
        if (consumedNonces.has(decoded.nonce)) {
            return {
                valid: false,
                error: 'Security Violation: Ticket nonce has already been consumed (Replay Attack Detected)',
                code: 'REPLAY_DETECTED',
            };
        }
        // Mark nonce as consumed until its expiration timestamp
        consumedNonces.set(decoded.nonce, decoded.exp || nowSec + 120);
        // Evict stale nonces if map grows
        if (consumedNonces.size > 10000) {
            cleanStaleNonces();
        }
        const player = {
            userId: String(userId).trim(),
            email: String(decoded.email || '').trim(),
            fullName: String(decoded.fullName || 'Student').trim(),
            rating: Number(decoded.rating) || 1000,
            gameMode: String(decoded.gameMode || 'ranked_1v1'),
            roomCode: decoded.roomCode ? String(decoded.roomCode).toUpperCase().trim() : (decoded.matchId ? String(decoded.matchId).trim() : undefined),
            nonce: String(decoded.nonce),
            issuedAt: Number(decoded.iat) || nowSec,
            expiresAt: Number(decoded.exp) || nowSec + 60,
        };
        return {
            valid: true,
            player,
        };
    }
    catch (err) {
        if (err?.name === 'TokenExpiredError') {
            return {
                valid: false,
                error: 'Multiplayer ticket has expired',
                code: 'EXPIRED_TICKET',
            };
        }
        return {
            valid: false,
            error: `Invalid multiplayer ticket signature: ${err?.message || 'Verification failed'}`,
            code: 'INVALID_TOKEN',
        };
    }
}
/**
 * Reset nonces cache (used for unit tests)
 */
function clearConsumedNoncesForTest() {
    consumedNonces.clear();
}
