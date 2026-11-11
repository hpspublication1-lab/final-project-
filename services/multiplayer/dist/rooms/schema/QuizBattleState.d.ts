/**
 * Samyak Multiplayer Service — Colyseus Room State Definition
 * Synchronized state published to clients. Excludes answer keys and sensitive server data.
 */
import { PublicQuestion } from '../../game-engine/questionRegistry';
export declare class PlayerState {
    id: string;
    sessionId: string;
    name: string;
    rating: number;
    score: number;
    streak: number;
    correctCount: number;
    incorrectCount: number;
    connected: boolean;
    isReady: boolean;
    hasAnsweredCurrentRound: boolean;
    lastAnswerElapsedMs: number;
    constructor(init?: Partial<PlayerState>);
}
export type RoomStatus = 'waiting' | 'countdown' | 'question_active' | 'round_review' | 'match_ended';
export declare class QuizBattleState {
    status: RoomStatus;
    currentQuestionIndex: number;
    totalQuestions: number;
    timeRemainingSeconds: number;
    roundStartTime: number;
    winnerId: string | null;
    isDraw: boolean;
    players: Map<string, PlayerState>;
    currentQuestion: PublicQuestion | null;
    idempotencyHash: string | null;
    constructor(init?: Partial<QuizBattleState>);
    toJSON(): {
        status: RoomStatus;
        currentQuestionIndex: number;
        totalQuestions: number;
        timeRemainingSeconds: number;
        roundStartTime: number;
        winnerId: string | null;
        isDraw: boolean;
        players: {
            [k: string]: {
                id: string;
                sessionId: string;
                name: string;
                rating: number;
                score: number;
                streak: number;
                correctCount: number;
                incorrectCount: number;
                connected: boolean;
                isReady: boolean;
                hasAnsweredCurrentRound: boolean;
                lastAnswerElapsedMs: number;
            };
        };
        currentQuestion: PublicQuestion | null;
        idempotencyHash: string | null;
    };
}
