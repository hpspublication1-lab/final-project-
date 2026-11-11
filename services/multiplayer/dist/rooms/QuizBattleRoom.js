"use strict";
/**
 * Samyak Multiplayer Service — Authoritative 1v1 Quiz Battle Room
 * Colyseus room controlling match lifecycle, timers, scoring, anti-cheat, and persistence.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuizBattleRoom = void 0;
const room_1 = require("../colyseus/room");
const QuizBattleState_1 = require("./schema/QuizBattleState");
const ticketValidator_1 = require("../authentication/ticketValidator");
const questionRegistry_1 = require("../game-engine/questionRegistry");
const scoring_1 = require("../game-engine/scoring");
const antiCheat_1 = require("../security/antiCheat");
const resultPersister_1 = require("../persistence/resultPersister");
const environment_1 = require("../config/environment");
class QuizBattleRoom extends room_1.Room {
    maxClients = 2;
    questions = [];
    answerKeyMap = new Map();
    questionRegistry = questionRegistry_1.defaultQuestionRegistry;
    roundTimerHandle;
    countdownTimerHandle;
    reviewTimerHandle;
    questionStartTimeMs = 0;
    isMatchConcluded = false;
    async onCreate(options) {
        this.roomId = `room_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        this.roomName = 'quiz_battle_1v1';
        this.setState(new QuizBattleState_1.QuizBattleState());
        if (options.questionRegistry) {
            this.questionRegistry = options.questionRegistry;
        }
        const questionCount = Math.min(10, Math.max(3, options.questionCount || 5));
        const loaded = this.questionRegistry.getQuestionsForMatch(questionCount, options.subjectFilter);
        this.questions = loaded.publicQuestions;
        this.answerKeyMap = loaded.answerKeyMap;
        this.state.totalQuestions = this.questions.length;
        // Register Message Handlers
        this.onMessage('SUBMIT_OPTION', (client, message) => this.handleSubmitOption(client, message));
        this.onMessage('PING', (client) => {
            this.send(client, 'PONG', { serverTime: Date.now() });
        });
        // WebRTC Peer-to-Peer Live Proctoring Signaling
        this.onMessage('WEBRTC_SIGNAL', (client, message) => {
            // Forward signal to the opposing candidate in this 1v1 battle room
            const opponent = this.clients.find((c) => c.sessionId !== client.sessionId);
            if (opponent) {
                this.send(opponent, 'WEBRTC_SIGNAL', {
                    senderSessionId: client.sessionId,
                    type: message?.type,
                    data: message?.data,
                });
            }
        });
    }
    /**
     * Colyseus Authentication Hook
     * Validates short-lived HMAC-SHA256 access ticket and checks match eligibility.
     */
    async onAuth(client, options) {
        const authResult = (0, ticketValidator_1.validateMultiplayerTicket)(options.ticket);
        if (!authResult.valid || !authResult.player) {
            throw new Error(`Authentication Failed: ${authResult.error || 'Invalid ticket'}`);
        }
        // Verify room code match if ticket is locked to a specific private room
        if (authResult.player.roomCode && options.roomCode) {
            if (authResult.player.roomCode.toUpperCase() !== options.roomCode.toUpperCase()) {
                throw new Error('Unauthorized room access: Ticket is locked to another private room');
            }
        }
        return authResult.player;
    }
    /**
     * Colyseus Player Join Hook
     * Binds authenticated player session to room state.
     */
    async onJoin(client, options, auth) {
        client.auth = auth;
        if (!this.clients.some((c) => c.sessionId === client.sessionId)) {
            this.clients.push(client);
        }
        const playerState = new QuizBattleState_1.PlayerState({
            id: auth.userId,
            sessionId: client.sessionId,
            name: auth.fullName,
            rating: auth.rating,
            score: 0,
            streak: 0,
            correctCount: 0,
            incorrectCount: 0,
            connected: true,
            isReady: true,
        });
        this.state.players.set(client.sessionId, playerState);
        this.broadcast('playerJoined', {
            playerId: playerState.id,
            name: playerState.name,
            rating: playerState.rating,
            currentCount: this.state.players.size,
        });
        // When 2 players connect, initiate match countdown
        if (this.state.players.size === 2 && this.state.status === 'waiting') {
            this.startCountdown();
        }
    }
    /**
     * Synchronized 3-second match start countdown
     */
    startCountdown() {
        this.state.status = 'countdown';
        this.state.timeRemainingSeconds = environment_1.config.countdownSeconds;
        this.broadcast('countdownTick', { secondsRemaining: this.state.timeRemainingSeconds });
        this.countdownTimerHandle = this.clock.setInterval(() => {
            this.state.timeRemainingSeconds -= 1;
            if (this.state.timeRemainingSeconds <= 0) {
                this.clock.clearInterval(this.countdownTimerHandle);
                this.startNextRound();
            }
            else {
                this.broadcast('countdownTick', { secondsRemaining: this.state.timeRemainingSeconds });
            }
        }, 1000);
    }
    /**
     * Authoritative Round Dispenser
     * Sends next question to both clients simultaneously WITHOUT correct answer keys.
     */
    startNextRound() {
        if (this.state.currentQuestionIndex >= this.questions.length) {
            this.finishMatch();
            return;
        }
        const currentQuestion = this.questions[this.state.currentQuestionIndex];
        this.state.currentQuestion = currentQuestion;
        this.state.status = 'question_active';
        this.state.timeRemainingSeconds = environment_1.config.questionTimeLimitSeconds;
        this.questionStartTimeMs = Date.now();
        this.state.roundStartTime = this.questionStartTimeMs;
        // Reset per-round submission flags
        for (const player of this.state.players.values()) {
            player.hasAnsweredCurrentRound = false;
        }
        this.broadcast('roundStart', {
            roundIndex: this.state.currentQuestionIndex,
            totalRounds: this.state.totalQuestions,
            question: currentQuestion,
            timeLimitSeconds: environment_1.config.questionTimeLimitSeconds,
            startTimeMs: this.questionStartTimeMs,
        });
        // Authoritative 1-second interval timer
        this.roundTimerHandle = this.clock.setInterval(() => {
            this.state.timeRemainingSeconds -= 1;
            this.broadcast('timerTick', { secondsRemaining: this.state.timeRemainingSeconds });
            if (this.state.timeRemainingSeconds <= 0) {
                this.clock.clearInterval(this.roundTimerHandle);
                this.evaluateRoundTimeout();
            }
        }, 1000);
    }
    /**
     * Server-authoritative answer submission handler.
     */
    handleSubmitOption(client, payload) {
        const player = this.state.players.get(client.sessionId);
        if (!player)
            return;
        // 1. Rate Limiting Check
        if (!antiCheat_1.antiCheatEngine.checkRateLimit(client.sessionId)) {
            this.send(client, 'error', { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many actions sent' });
            return;
        }
        // 2. Validate Match & Round State
        if (this.state.status !== 'question_active' || !this.state.currentQuestion) {
            this.send(client, 'error', { code: 'ROUND_NOT_ACTIVE', message: 'Round is not active' });
            return;
        }
        if (payload.questionId !== this.state.currentQuestion.id) {
            this.send(client, 'error', { code: 'STALE_QUESTION', message: 'Submitted answer for incorrect question' });
            return;
        }
        // 3. Duplicate Submission Protection
        if (player.hasAnsweredCurrentRound) {
            this.send(client, 'error', { code: 'DUPLICATE_SUBMISSION', message: 'Answer already submitted for this round' });
            return;
        }
        player.hasAnsweredCurrentRound = true;
        // 4. Calculate Server-Authoritative Elapsed Time
        const now = Date.now();
        const serverElapsedMs = Math.max(0, now - this.questionStartTimeMs);
        const timeLimitMs = environment_1.config.questionTimeLimitSeconds * 1000;
        // 5. Anti-Cheat: Evaluate reaction time (< 350ms flagged)
        antiCheat_1.antiCheatEngine.evaluateReactionTime(player.id, this.roomId, payload.questionId, serverElapsedMs);
        // 6. Verify Correctness Against Server Secret Key
        const correctOption = this.answerKeyMap.get(payload.questionId);
        const isCorrect = Boolean(correctOption &&
            payload.optionId &&
            correctOption.toLowerCase() === payload.optionId.toLowerCase().trim());
        // 7. Calculate Points & Bonuses Server-Side
        const scoreResult = (0, scoring_1.calculateRoundScore)({
            isCorrect,
            elapsedMs: serverElapsedMs,
            timeLimitMs,
            currentStreak: player.streak,
        });
        player.score += scoreResult.totalRoundPoints;
        player.streak = scoreResult.newStreak;
        player.lastAnswerElapsedMs = serverElapsedMs;
        if (isCorrect) {
            player.correctCount += 1;
        }
        else {
            player.incorrectCount += 1;
        }
        // Send private result to submitting player
        this.send(client, 'answerEvaluated', {
            questionId: payload.questionId,
            isCorrect,
            correctOptionId: correctOption, // Revealed only AFTER player has answered
            pointsAwarded: scoreResult.totalRoundPoints,
            speedBonus: scoreResult.speedBonus,
            streakBonus: scoreResult.streakBonus,
            currentScore: player.score,
            currentStreak: player.streak,
        });
        // Broadcast running score to opponent
        this.broadcast('opponentProgress', {
            opponentId: player.id,
            opponentScore: player.score,
            questionIndex: this.state.currentQuestionIndex,
        }, { except: client });
        // If both players have answered, proceed to review immediately
        const allAnswered = Array.from(this.state.players.values()).every((p) => p.hasAnsweredCurrentRound);
        if (allAnswered) {
            if (this.roundTimerHandle)
                this.clock.clearInterval(this.roundTimerHandle);
            this.startRoundReview();
        }
    }
    /**
     * Round Timeout Handler (when 15s timer expires before both submit)
     */
    evaluateRoundTimeout() {
        const currentQ = this.state.currentQuestion;
        const correctOption = currentQ ? this.answerKeyMap.get(currentQ.id) : undefined;
        // Treat unanswered players as incorrect
        for (const player of this.state.players.values()) {
            if (!player.hasAnsweredCurrentRound) {
                player.hasAnsweredCurrentRound = true;
                player.streak = 0;
                player.incorrectCount += 1;
            }
        }
        this.startRoundReview(correctOption);
    }
    /**
     * 3-second round review phase showing correct answer before next question
     */
    startRoundReview(revealedCorrectOption) {
        this.state.status = 'round_review';
        const currentQ = this.state.currentQuestion;
        const correctOption = revealedCorrectOption || (currentQ ? this.answerKeyMap.get(currentQ.id) : undefined);
        this.broadcast('roundReview', {
            roundIndex: this.state.currentQuestionIndex,
            correctOptionId: correctOption,
            reviewDurationSeconds: environment_1.config.roundReviewSeconds,
            scores: Array.from(this.state.players.values()).map((p) => ({
                id: p.id,
                name: p.name,
                score: p.score,
            })),
        });
        this.reviewTimerHandle = this.clock.setTimeout(() => {
            this.state.currentQuestionIndex += 1;
            this.startNextRound();
        }, environment_1.config.roundReviewSeconds * 1000);
    }
    /**
     * Colyseus Disconnect Handler
     * Implements 15-second grace period before forfeiture.
     */
    async onLeave(client, consented) {
        const player = this.state.players.get(client.sessionId);
        if (!player)
            return;
        player.connected = false;
        this.broadcast('playerDisconnected', {
            playerId: player.id,
            name: player.name,
            gracePeriodSeconds: environment_1.config.reconnectGraceSeconds,
        });
        // If match was in progress and disconnection was unconsented, offer reconnect grace period
        if (!consented && this.state.status !== 'match_ended') {
            try {
                await this.allowReconnection(client, environment_1.config.reconnectGraceSeconds);
                player.connected = true;
                this.broadcast('playerReconnected', { playerId: player.id, name: player.name });
                return;
            }
            catch {
                // Reconnection window expired -> opponent wins by forfeit
            }
        }
        // If opponent has left permanently, conclude match by forfeit
        if (this.state.status !== 'match_ended' && !this.isMatchConcluded) {
            const remaining = Array.from(this.state.players.values()).find((p) => p.connected);
            this.finishMatch(remaining?.id);
        }
    }
    /**
     * Concludes the match, computes ELO deltas, and persists results idempotently.
     */
    async finishMatch(forfeitWinnerId) {
        if (this.isMatchConcluded)
            return;
        this.isMatchConcluded = true;
        this.state.status = 'match_ended';
        this.clock.clear();
        const playersList = Array.from(this.state.players.values());
        if (playersList.length < 2) {
            return;
        }
        const [p1, p2] = playersList;
        if (forfeitWinnerId) {
            if (forfeitWinnerId === p1.id) {
                p1.score = Math.max(p1.score, p2.score + 100);
            }
            else {
                p2.score = Math.max(p2.score, p1.score + 100);
            }
        }
        // Persist to database with cryptographic idempotency
        const persistenceResult = await resultPersister_1.resultPersister.persistMatchResult({
            roomId: this.roomId,
            player1: p1,
            player2: p2,
            subject: this.questions[0]?.subject || 'Mixed',
            totalQuestions: this.state.totalQuestions,
        });
        this.state.idempotencyHash = persistenceResult.idempotencyHash;
        this.state.winnerId = persistenceResult.eloResult.winnerId;
        this.state.isDraw = persistenceResult.eloResult.isDraw;
        this.broadcast('matchEnded', {
            winnerId: persistenceResult.eloResult.winnerId,
            isDraw: persistenceResult.eloResult.isDraw,
            idempotencyHash: persistenceResult.idempotencyHash,
            results: [
                {
                    id: p1.id,
                    name: p1.name,
                    finalScore: p1.score,
                    correctCount: p1.correctCount,
                    incorrectCount: p1.incorrectCount,
                    ratingDelta: persistenceResult.eloResult.p1Delta,
                    newRating: persistenceResult.eloResult.p1NewRating,
                    isWinner: persistenceResult.eloResult.winnerId === p1.id,
                },
                {
                    id: p2.id,
                    name: p2.name,
                    finalScore: p2.score,
                    correctCount: p2.correctCount,
                    incorrectCount: p2.incorrectCount,
                    ratingDelta: persistenceResult.eloResult.p2Delta,
                    newRating: persistenceResult.eloResult.p2NewRating,
                    isWinner: persistenceResult.eloResult.winnerId === p2.id,
                },
            ],
        });
    }
    async onDispose() {
        this.clock.clear();
        for (const client of this.clients) {
            antiCheat_1.antiCheatEngine.cleanupSession(client.sessionId);
        }
    }
}
exports.QuizBattleRoom = QuizBattleRoom;
