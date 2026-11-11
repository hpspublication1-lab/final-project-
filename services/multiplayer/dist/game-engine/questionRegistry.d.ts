/**
 * Samyak Multiplayer Service — Question Registry & Secret Answer Store
 * Authoritative keeper of quiz questions. Answer keys NEVER leave the server.
 */
export interface QuestionOption {
    id: string;
    text: string;
}
export interface PublicQuestion {
    id: string;
    text: string;
    options: QuestionOption[];
    subject: string;
    difficulty: 'easy' | 'medium' | 'hard';
}
export interface AuthoritativeQuestion extends PublicQuestion {
    correctOptionId: string;
    explanation?: string;
}
export declare class QuestionRegistry {
    private questions;
    constructor(initialQuestions?: AuthoritativeQuestion[]);
    /**
     * Retrieves randomized questions for a match room.
     * Returns:
     * - publicQuestions: sent to clients (WITHOUT correctOptionId)
     * - answerKeyMap: retained in server room memory ONLY
     */
    getQuestionsForMatch(count?: number, subjectFilter?: string): {
        publicQuestions: PublicQuestion[];
        answerKeyMap: Map<string, string>;
    };
    /**
     * Verifies if an option choice is correct.
     */
    verifyAnswer(questionId: string, optionId: string): boolean;
}
export declare const defaultQuestionRegistry: QuestionRegistry;
