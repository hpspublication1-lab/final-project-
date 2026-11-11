/**
 * Samyak Multiplayer Service — Ticket Validation & Authentication Engine
 * Validates HMAC-SHA256 signed multiplayer access tickets issued by the platform.
 */
export interface ValidatedPlayerAuth {
    userId: string;
    email: string;
    fullName: string;
    rating: number;
    gameMode: string;
    roomCode?: string;
    nonce: string;
    issuedAt: number;
    expiresAt: number;
}
export interface TicketValidationResult {
    valid: boolean;
    player?: ValidatedPlayerAuth;
    error?: string;
    code?: 'INVALID_TOKEN' | 'EXPIRED_TICKET' | 'REPLAY_DETECTED' | 'MALFORMED_PAYLOAD';
}
/**
 * Validates a short-lived multiplayer access ticket.
 * Enforces HMAC-SHA256 signature verification, TTL check, and single-use nonces.
 */
export declare function validateMultiplayerTicket(ticket: string | undefined | null, options?: {
    secret?: string;
    nowSec?: number;
}): TicketValidationResult;
/**
 * Reset nonces cache (used for unit tests)
 */
export declare function clearConsumedNoncesForTest(): void;
