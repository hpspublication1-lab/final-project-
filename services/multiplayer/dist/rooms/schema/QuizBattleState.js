"use strict";
/**
 * Samyak Multiplayer Service — Colyseus Room State Definition
 * Synchronized state published to clients. Excludes answer keys and sensitive server data.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuizBattleState = exports.PlayerState = void 0;
class PlayerState {
    id = '';
    sessionId = '';
    name = '';
    rating = 1000;
    score = 0;
    streak = 0;
    correctCount = 0;
    incorrectCount = 0;
    connected = true;
    isReady = false;
    hasAnsweredCurrentRound = false;
    lastAnswerElapsedMs = 0;
    constructor(init) {
        if (init)
            Object.assign(this, init);
    }
}
exports.PlayerState = PlayerState;
class QuizBattleState {
    status = 'waiting';
    currentQuestionIndex = 0;
    totalQuestions = 5;
    timeRemainingSeconds = 15;
    roundStartTime = 0;
    winnerId = null;
    isDraw = false;
    players = new Map();
    currentQuestion = null;
    idempotencyHash = null;
    constructor(init) {
        if (init)
            Object.assign(this, init);
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
            players: Object.fromEntries(Array.from(this.players.entries()).map(([k, p]) => [k, { ...p }])),
            currentQuestion: this.currentQuestion,
            idempotencyHash: this.idempotencyHash,
        };
    }
}
exports.QuizBattleState = QuizBattleState;
