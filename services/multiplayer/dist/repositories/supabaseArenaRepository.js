"use strict";
/**
 * Samyak Multiplayer Service — Authoritative Supabase Repository Adapter
 * Bridges Colyseus game rooms with the canonical Supabase PostgreSQL database.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultSupabaseArenaRepository = exports.SupabaseArenaRepository = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const environment_1 = require("../config/environment");
function resolveOptionKey(correctAnswer, options) {
    if (!correctAnswer)
        return 'a';
    const clean = correctAnswer.trim().toLowerCase();
    if (['a', 'b', 'c', 'd'].includes(clean))
        return clean;
    if (Array.isArray(options)) {
        const idx = options.findIndex((opt) => {
            if (typeof opt === 'string')
                return opt.trim().toLowerCase() === clean;
            if (opt && typeof opt === 'object' && opt.text)
                return opt.text.trim().toLowerCase() === clean;
            return false;
        });
        if (idx >= 0 && idx < 4) {
            return ['a', 'b', 'c', 'd'][idx];
        }
    }
    return 'a';
}
class SupabaseArenaRepository {
    supabase = null;
    fallbackDisplayNames = new Map();
    processedIdempotencyKeys = new Set();
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
    async loadMatch(matchId) {
        if (!this.supabase) {
            return {
                id: matchId,
                roomType: 'quiz_battle',
                status: 'ready',
                participantIds: [],
                questionIds: [],
                questionDurationMs: environment_1.config.questionTimeLimitSeconds * 1000,
                scoringRules: { correct: 1.0, incorrect: -0.25, unanswered: 0 },
            };
        }
        try {
            const { data: room, error } = await this.supabase
                .from('battle_rooms')
                .select('id, creator_id, opponent_id, status, question_ids, time_limit_seconds')
                .eq('id', matchId)
                .maybeSingle();
            if (error || !room)
                return null;
            const participantIds = [];
            if (room.creator_id)
                participantIds.push(room.creator_id);
            if (room.opponent_id)
                participantIds.push(room.opponent_id);
            return {
                id: room.id,
                roomType: 'quiz_battle',
                status: room.status,
                participantIds,
                questionIds: Array.isArray(room.question_ids) ? room.question_ids : [],
                questionDurationMs: (room.time_limit_seconds || environment_1.config.questionTimeLimitSeconds) * 1000,
                scoringRules: { correct: 1.0, incorrect: -0.25, unanswered: 0 },
            };
        }
        catch {
            return null;
        }
    }
    async assertPlayerCanJoinMatch(matchId, userId) {
        if (!this.supabase)
            return true;
        try {
            const { data: room, error } = await this.supabase
                .from('battle_rooms')
                .select('creator_id, opponent_id, status')
                .eq('id', matchId)
                .maybeSingle();
            if (error || !room)
                return false;
            // Allow creator, assigned opponent, or an unassigned seat in a waiting room
            if (room.creator_id === userId || room.opponent_id === userId)
                return true;
            if (!room.opponent_id && room.status === 'waiting')
                return true;
            return false;
        }
        catch {
            return false;
        }
    }
    async getPublicDisplayName(userId) {
        if (this.fallbackDisplayNames.has(userId)) {
            return this.fallbackDisplayNames.get(userId);
        }
        if (!this.supabase) {
            const fallback = `Student_${userId.substring(0, 6)}`;
            this.fallbackDisplayNames.set(userId, fallback);
            return fallback;
        }
        try {
            const { data: profile } = await this.supabase
                .from('user_profiles')
                .select('full_name, username')
                .eq('id', userId)
                .maybeSingle();
            const name = profile?.full_name || profile?.username || `Student_${userId.substring(0, 6)}`;
            this.fallbackDisplayNames.set(userId, name);
            return name;
        }
        catch {
            return `Student_${userId.substring(0, 6)}`;
        }
    }
    async loadQuestionsForMatch(matchId) {
        if (!this.supabase)
            return [];
        try {
            const match = await this.loadMatch(matchId);
            if (!match || match.questionIds.length === 0)
                return [];
            const { data: qRows, error } = await this.supabase
                .from('questions')
                .select('id, question_text, options, correct_answer, explanation')
                .in('id', match.questionIds);
            if (error || !qRows)
                return [];
            return qRows.map((q) => {
                const rawOptions = Array.isArray(q.options) ? q.options : [];
                const formattedOptions = rawOptions.map((opt, index) => {
                    const id = ['a', 'b', 'c', 'd'][index] || String(index);
                    const text = typeof opt === 'string' ? opt : opt.text || String(opt);
                    return { id, text };
                });
                return {
                    id: q.id,
                    prompt: q.question_text,
                    options: formattedOptions,
                    correctOptionId: resolveOptionKey(q.correct_answer, rawOptions),
                    explanation: q.explanation || undefined,
                };
            });
        }
        catch {
            return [];
        }
    }
    async persistAuthoritativeResult(result) {
        const { matchId, idempotencyKey, players, engineVersion, serverNodeId, telemetryAudit } = result;
        if (this.processedIdempotencyKeys.has(idempotencyKey)) {
            return; // Deduplicated
        }
        if (this.supabase) {
            try {
                // Mark room as completed
                await this.supabase
                    .from('battle_rooms')
                    .update({
                    status: 'completed',
                    completed_at: result.completedAt || new Date().toISOString(),
                })
                    .eq('id', matchId);
                // Persist each player's verified result
                for (const player of players) {
                    const totalAnswered = player.correctCount + player.incorrectCount + player.unansweredCount;
                    const accuracy = totalAnswered > 0 ? Math.round((player.correctCount / totalAnswered) * 100) : 0;
                    const playerHash = `${idempotencyKey}_${player.userId}`;
                    // Invoke idempotent RPC record_authoritative_battle_result
                    await this.supabase.rpc('record_authoritative_battle_result', {
                        p_room_id: matchId,
                        p_player_id: player.userId,
                        p_score: player.score,
                        p_correct_answers: player.correctCount,
                        p_incorrect_answers: player.incorrectCount,
                        p_accuracy: accuracy,
                        p_time_taken_seconds: 0,
                        p_rating_change: player.ratingChange ?? 0,
                        p_is_winner: Boolean(player.isWinner),
                        p_idempotency_hash: playerHash,
                        p_server_node_id: serverNodeId || 'node-colyseus-primary',
                        p_engine_version: engineVersion,
                        p_telemetry_audit: telemetryAudit || {},
                    });
                }
            }
            catch (err) {
                console.warn(`[SupabaseArenaRepository] Persistence warning: ${err?.message}`);
            }
        }
        this.processedIdempotencyKeys.add(idempotencyKey);
    }
    async persistNoContest(input) {
        if (this.processedIdempotencyKeys.has(input.idempotencyKey)) {
            return;
        }
        if (this.supabase) {
            try {
                await this.supabase
                    .from('battle_rooms')
                    .update({
                    status: 'cancelled',
                    completed_at: new Date().toISOString(),
                })
                    .eq('id', input.matchId);
            }
            catch (err) {
                console.warn(`[SupabaseArenaRepository] No-contest persistence warning: ${err?.message}`);
            }
        }
        this.processedIdempotencyKeys.add(input.idempotencyKey);
    }
}
exports.SupabaseArenaRepository = SupabaseArenaRepository;
exports.defaultSupabaseArenaRepository = new SupabaseArenaRepository();
