/**
 * Samyak Multiplayer Service — Idempotent Result Persistence Engine
 * Writes validated match results, rating deltas, and telemetry to Supabase PostgreSQL.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config/environment';
import {
  calculateEloDeltas,
  computeMatchReceiptHash,
  EloReconciliationResult,
} from '../game-engine/scoring';
import { PlayerState } from '../rooms/schema/QuizBattleState';
import { antiCheatEngine } from '../security/antiCheat';

export interface MatchPersistencePayload {
  roomId: string;
  roomCode?: string;
  player1: PlayerState;
  player2: PlayerState;
  subject: string;
  totalQuestions: number;
}

export interface PersistenceResult {
  success: boolean;
  idempotencyHash: string;
  eloResult: EloReconciliationResult;
  persistedToDatabase: boolean;
  error?: string;
}

export class ResultPersister {
  private supabase: SupabaseClient | null = null;
  private processedMatches: Map<string, PersistenceResult> = new Map();

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

  /**
   * Persists match results idempotently.
   * If called multiple times with the same roomId and scores, returns identical stored receipt.
   */
  async persistMatchResult(payload: MatchPersistencePayload): Promise<PersistenceResult> {
    const { roomId, player1, player2, subject, totalQuestions } = payload;

    // 1. Calculate Authoritative ELO Ratings
    const eloResult = calculateEloDeltas({
      player1: { id: player1.id, rating: player1.rating, score: player1.score },
      player2: { id: player2.id, rating: player2.rating, score: player2.score },
      kFactor: config.eloKFactor,
    });

    // 2. Generate Deterministic Idempotency Hash
    const idempotencyHash = computeMatchReceiptHash(
      roomId,
      player1.id,
      player2.id,
      player1.score,
      player2.score,
      config.multiplayerSecret
    );

    // If already processed, return cached idempotent result (Replay Protection)
    if (this.processedMatches.has(idempotencyHash)) {
      return this.processedMatches.get(idempotencyHash)!;
    }

    let persistedToDatabase = false;

    // 3. Write to Supabase PostgreSQL if client is available
    if (this.supabase) {
      try {
        const now = new Date().toISOString();
        const p1Accuracy = totalQuestions > 0 ? (player1.correctCount / totalQuestions) * 100 : 0;
        const p2Accuracy = totalQuestions > 0 ? (player2.correctCount / totalQuestions) * 100 : 0;
        const auditLogs = antiCheatEngine.getAuditLogsForMatch(roomId);

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
      } catch (err: any) {
        console.warn(`[ResultPersister] PostgreSQL write failed, retaining in-memory: ${err?.message}`);
      }
    }

    const result: PersistenceResult = {
      success: true,
      idempotencyHash,
      eloResult,
      persistedToDatabase,
    };

    this.processedMatches.set(idempotencyHash, result);
    return result;
  }

  clearProcessedMatches(): void {
    this.processedMatches.clear();
  }
}

export const resultPersister = new ResultPersister();
