/**
 * Samyak Multiplayer Service — Authoritative Supabase Repository Adapter
 * Bridges Colyseus game rooms with the canonical Supabase PostgreSQL database.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config/environment';

export interface ServerQuestion {
  id: string;
  prompt: string;
  options: Array<{ id: string; text: string }>;
  correctOptionId: string; // Server authoritative key; never serialized prior to reveal
  explanation?: string;
}

export interface AuthorizedMatch {
  id: string;
  roomType: 'quiz_battle';
  status: 'waiting' | 'ready' | 'active' | 'completed' | 'cancelled';
  participantIds: string[];
  questionIds: string[];
  questionDurationMs: number;
  scoringRules: { correct: number; incorrect: number; unanswered: number };
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
  persistNoContest(input: { matchId: string; userId: string; reason: string; idempotencyKey: string }): Promise<void>;
}

function resolveOptionKey(correctAnswer: string, options: string[] | any[]): string {
  if (!correctAnswer) return 'a';
  const clean = correctAnswer.trim().toLowerCase();
  if (['a', 'b', 'c', 'd'].includes(clean)) return clean;
  if (Array.isArray(options)) {
    const idx = options.findIndex((opt) => {
      if (typeof opt === 'string') return opt.trim().toLowerCase() === clean;
      if (opt && typeof opt === 'object' && opt.text) return opt.text.trim().toLowerCase() === clean;
      return false;
    });
    if (idx >= 0 && idx < 4) {
      return ['a', 'b', 'c', 'd'][idx];
    }
  }
  return 'a';
}

export class SupabaseArenaRepository implements ArenaRepository {
  private supabase: SupabaseClient | null = null;
  private readonly fallbackDisplayNames = new Map<string, string>();
  private readonly processedIdempotencyKeys = new Set<string>();

  constructor() {
    if (config.supabaseUrl && config.supabaseServiceKey && !config.supabaseUrl.includes('placeholder')) {
      try {
        this.supabase = createClient(config.supabaseUrl, config.supabaseServiceKey, {
          auth: { persistSession: false },
        });
      } catch {
        this.supabase = null;
      }
    }
  }

  async loadMatch(matchId: string): Promise<AuthorizedMatch | null> {
    if (!this.supabase) {
      return {
        id: matchId,
        roomType: 'quiz_battle',
        status: 'ready',
        participantIds: [],
        questionIds: [],
        questionDurationMs: config.questionTimeLimitSeconds * 1000,
        scoringRules: { correct: 1.0, incorrect: -0.25, unanswered: 0 },
      };
    }

    try {
      const { data: room, error } = await this.supabase
        .from('battle_rooms')
        .select('id, creator_id, opponent_id, status, question_ids, time_limit_seconds')
        .eq('id', matchId)
        .maybeSingle();

      if (error || !room) return null;

      const participantIds: string[] = [];
      if (room.creator_id) participantIds.push(room.creator_id);
      if (room.opponent_id) participantIds.push(room.opponent_id);

      return {
        id: room.id,
        roomType: 'quiz_battle',
        status: room.status as any,
        participantIds,
        questionIds: Array.isArray(room.question_ids) ? room.question_ids : [],
        questionDurationMs: (room.time_limit_seconds || config.questionTimeLimitSeconds) * 1000,
        scoringRules: { correct: 1.0, incorrect: -0.25, unanswered: 0 },
      };
    } catch {
      return null;
    }
  }

  async assertPlayerCanJoinMatch(matchId: string, userId: string): Promise<boolean> {
    if (!this.supabase) return true;

    try {
      const { data: room, error } = await this.supabase
        .from('battle_rooms')
        .select('creator_id, opponent_id, status')
        .eq('id', matchId)
        .maybeSingle();

      if (error || !room) return false;

      // Allow creator, assigned opponent, or an unassigned seat in a waiting room
      if (room.creator_id === userId || room.opponent_id === userId) return true;
      if (!room.opponent_id && room.status === 'waiting') return true;

      return false;
    } catch {
      return false;
    }
  }

  async getPublicDisplayName(userId: string): Promise<string> {
    if (this.fallbackDisplayNames.has(userId)) {
      return this.fallbackDisplayNames.get(userId)!;
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
    } catch {
      return `Student_${userId.substring(0, 6)}`;
    }
  }

  async loadQuestionsForMatch(matchId: string): Promise<ServerQuestion[]> {
    if (!this.supabase) return [];

    try {
      const match = await this.loadMatch(matchId);
      if (!match || match.questionIds.length === 0) return [];

      const { data: qRows, error } = await this.supabase
        .from('questions')
        .select('id, question_text, options, correct_answer, explanation')
        .in('id', match.questionIds);

      if (error || !qRows) return [];

      return qRows.map((q) => {
        const rawOptions = Array.isArray(q.options) ? q.options : [];
        const formattedOptions = rawOptions.map((opt: any, index: number) => {
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
    } catch {
      return [];
    }
  }

  async persistAuthoritativeResult(result: AuthoritativeMatchResult): Promise<void> {
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
      } catch (err: any) {
        console.warn(`[SupabaseArenaRepository] Persistence warning: ${err?.message}`);
      }
    }

    this.processedIdempotencyKeys.add(idempotencyKey);
  }

  async persistNoContest(input: { matchId: string; userId: string; reason: string; idempotencyKey: string }): Promise<void> {
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
      } catch (err: any) {
        console.warn(`[SupabaseArenaRepository] No-contest persistence warning: ${err?.message}`);
      }
    }

    this.processedIdempotencyKeys.add(input.idempotencyKey);
  }
}

export const defaultSupabaseArenaRepository = new SupabaseArenaRepository();
