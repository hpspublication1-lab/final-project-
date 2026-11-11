/**
 * Samyak Multiplayer Service — Authoritative 1v1 Quiz Battle Room
 * Colyseus room controlling match lifecycle, timers, scoring, anti-cheat, and persistence.
 */
import { Room, Client } from '../colyseus/room';
import { QuizBattleState } from './schema/QuizBattleState';
import { ValidatedPlayerAuth } from '../authentication/ticketValidator';
import { QuestionRegistry } from '../game-engine/questionRegistry';
export interface QuizBattleRoomOptions {
    ticket: string;
    roomCode?: string;
    subjectFilter?: string;
    questionCount?: number;
    questionRegistry?: QuestionRegistry;
}
export declare class QuizBattleRoom extends Room<QuizBattleState> {
    maxClients: number;
    private questions;
    private answerKeyMap;
    private questionRegistry;
    private roundTimerHandle?;
    private countdownTimerHandle?;
    private reviewTimerHandle?;
    private questionStartTimeMs;
    private isMatchConcluded;
    onCreate(options: QuizBattleRoomOptions): Promise<void>;
    /**
     * Colyseus Authentication Hook
     * Validates short-lived HMAC-SHA256 access ticket and checks match eligibility.
     */
    onAuth(client: Client, options: QuizBattleRoomOptions): Promise<ValidatedPlayerAuth>;
    /**
     * Colyseus Player Join Hook
     * Binds authenticated player session to room state.
     */
    onJoin(client: Client, options: QuizBattleRoomOptions, auth: ValidatedPlayerAuth): Promise<void>;
    /**
     * Synchronized 3-second match start countdown
     */
    private startCountdown;
    /**
     * Authoritative Round Dispenser
     * Sends next question to both clients simultaneously WITHOUT correct answer keys.
     */
    private startNextRound;
    /**
     * Server-authoritative answer submission handler.
     */
    private handleSubmitOption;
    /**
     * Round Timeout Handler (when 15s timer expires before both submit)
     */
    private evaluateRoundTimeout;
    /**
     * 3-second round review phase showing correct answer before next question
     */
    private startRoundReview;
    /**
     * Colyseus Disconnect Handler
     * Implements 15-second grace period before forfeiture.
     */
    onLeave(client: Client, consented?: boolean): Promise<void>;
    /**
     * Concludes the match, computes ELO deltas, and persists results idempotently.
     */
    finishMatch(forfeitWinnerId?: string): Promise<void>;
    onDispose(): Promise<void>;
}
