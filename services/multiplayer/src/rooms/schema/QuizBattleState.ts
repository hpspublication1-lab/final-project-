/**
 * Samyak Multiplayer Service — Colyseus Room State Definition
 * Synchronized state published to clients. Excludes answer keys and sensitive server data.
 */

import { PublicQuestion } from '../../game-engine/questionRegistry';

export class PlayerState {
  id: string = '';
  sessionId: string = '';
  name: string = '';
  rating: number = 1000;
  score: number = 0;
  streak: number = 0;
  correctCount: number = 0;
  incorrectCount: number = 0;
  connected: boolean = true;
  isReady: boolean = false;
  hasAnsweredCurrentRound: boolean = false;
  lastAnswerElapsedMs: number = 0;

  constructor(init?: Partial<PlayerState>) {
    if (init) Object.assign(this, init);
  }
}

export type RoomStatus =
  | 'waiting'
  | 'countdown'
  | 'question_active'
  | 'round_review'
  | 'match_ended';

export class QuizBattleState {
  status: RoomStatus = 'waiting';
  currentQuestionIndex: number = 0;
  totalQuestions: number = 5;
  timeRemainingSeconds: number = 15;
  roundStartTime: number = 0;
  winnerId: string | null = null;
  isDraw: boolean = false;
  players: Map<string, PlayerState> = new Map();
  currentQuestion: PublicQuestion | null = null;
  idempotencyHash: string | null = null;

  constructor(init?: Partial<QuizBattleState>) {
    if (init) Object.assign(this, init);
  }

  toJSON() {
    return {
      status: this.status,
      currentQuestionIndex: this.currentQuestionIndex,
      totalQuestions: this.totalQuestions,
      timeRemainingSeconds: this.timeRemainingSeconds,
      roundStartTime: this.roundStartTime,
      winnerId: this.winnerId,
      isDraw: this.isDraw,
      players: Object.fromEntries(
        Array.from(this.players.entries()).map(([k, p]) => [k, { ...p }])
      ),
      currentQuestion: this.currentQuestion,
      idempotencyHash: this.idempotencyHash,
    };
  }
}
