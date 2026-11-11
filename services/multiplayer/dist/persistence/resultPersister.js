"use strict";
/**
 * Samyak Multiplayer Service — Idempotent Result Persistence Engine
 * Writes validated match results, rating deltas, and telemetry to Supabase PostgreSQL.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.resultPersister = exports.ResultPersister = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const environment_1 = require("../config/environment");
const scoring_1 = require("../game-engine/scoring");
const antiCheat_1 = require("../security/antiCheat");
class ResultPersister {
    supabase = null;
    processedMatches = new Map();
    constructor() {
        if (environment_1.config.supabaseUrl && environment_1.config.supabaseServiceKey && !environment_1.config.supabaseUrl.includes('placeholder')) {
            try {
                this.supabase = (0, supabase_js_1.createClient)(environment_1.config.supabaseUrl, environment_1.config.supabaseServiceKey, {
                    auth: { persistSession: false },
                });
            }
            catch {
                this.supabase = null;
            }
        }
    }
    /**
     * Persists match results idempotently.
     * If called multiple times with the same roomId and scores, returns identical stored receipt.
     */
    async persistMatchResult(payload) {
        const { roomId, player1, player2, subject, totalQuestions } = payload;
        // 1. Calculate Authoritative ELO Ratings
        const eloResult = (0, scoring_1.calculateEloDeltas)({
            player1: { id: player1.id, rating: player1.rating, score: player1.score },
            player2: { id: player2.id, rating: player2.rating, score: player2.score },
            kFactor: environment_1.config.eloKFactor,
        });
        // 2. Generate Deterministic Idempotency Hash
        const idempotencyHash = (0, scoring_1.computeMatchReceiptHash)(roomId, player1.id, player2.id, player1.score, player2.score, environment_1.config.multiplayerSecret);
        // If already processed, return cached idempotent result (Replay Protection)
        if (this.processedMatches.has(idempotencyHash)) {
            return this.processedMatches.get(idempotencyHash);
        }
        let persistedToDatabase = false;
        // 3. Write to Supabase PostgreSQL if client is available
        if (this.supabase) {
            try {
                const now = new Date().toISOString();
                const p1Accuracy = totalQuestions > 0 ? (player1.correctCount / totalQuestions) * 100 : 0;
                const p2Accuracy = totalQuestions > 0 ? (player2.correctCount / totalQuestions) * 100 : 0;
                const auditLogs = antiCheat_1.antiCheatEngine.getAuditLogsForMatch(roomId);
                // a. Update battle_rooms row
                await this.supabase
                    .from('battle_rooms')
                    .update({
                    status: 'completed',
                    completed_at: now,
                })
                    .eq('id', roomId);
                // b. Insert Player 1 Battle Result
                await this.supabase
                    .from('battle_results')
                    .insert({
                    room_id: roomId,
                    player_id: player1.id,
                    score: player1.score,
                    correct_answers: player1.correctCount,
                    incorrect_answers: player1.incorrectCount,
                    accuracy: p1Accuracy,
                    rating_change: eloResult.p1Delta,
                    is_winner: eloResult.winnerId === player1.id,
                    idempotency_hash: `${idempotencyHash}_p1`,
                    telemetry_audit: { auditLogs },
                });
                // c. Insert Player 2 Battle Result (if not simulated bot)
                if (!player2.id.startsWith('bot_')) {
                    await this.supabase
                        .from('battle_results')
                        .insert({
                        room_id: roomId,
                        player_id: player2.id,
                        score: player2.score,
                        correct_answers: player2.correctCount,
                        incorrect_answers: player2.incorrectCount,
                        accuracy: p2Accuracy,
                        rating_change: eloResult.p2Delta,
                        is_winner: eloResult.winnerId === player2.id,
                        idempotency_hash: `${idempotencyHash}_p2`,
                        telemetry_audit: { auditLogs },
                    });
                }
                // d. Update player ratings in user_profiles
                await this.supabase
                    .from('user_profiles')
                    .update({
                    battle_rating: eloResult.p1NewRating,
                    total_points: player1.score,
                })
                    .eq('id', player1.id);
                if (!player2.id.startsWith('bot_')) {
                    await this.supabase
                        .from('user_profiles')
                        .update({
                        battle_rating: eloResult.p2NewRating,
                        total_points: player2.score,
                    })
                        .eq('id', player2.id);
                }
                persistedToDatabase = true;
            }
            catch (err) {
                console.warn(`[ResultPersister] PostgreSQL write failed, retaining in-memory: ${err?.message}`);
            }
        }
        const result = {
            success: true,
            idempotencyHash,
            eloResult,
            persistedToDatabase,
        };
        this.processedMatches.set(idempotencyHash, result);
        return result;
    }
    clearProcessedMatches() {
        this.processedMatches.clear();
    }
}
exports.ResultPersister = ResultPersister;
exports.resultPersister = new ResultPersister();
