export interface ServerQuestion {
  id: string;
  prompt: string;
  options: Array<{ id: string; text: string }>;
  /** Must never be serialized to a client before the reveal stage. */
  correctOptionId: string;
  explanation?: string;
}

export interface AuthorizedMatch {
  id: string;
  roomType: "quiz_battle";
  status: "waiting" | "ready" | "active" | "completed" | "cancelled";
  participantIds: string[];
  questionIds: string[];
  questionDurationMs: number;
  /** Must map from Samyak's approved game rules; clients cannot choose these values. */
  scoringRules: { correct: number; incorrect: number; unanswered: number };
}

export interface FinalPlayerResult {
  userId: string;
  score: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
}

export interface AuthoritativeMatchResult {
  matchId: string;
  idempotencyKey: string;
  completedAt: string;
  players: FinalPlayerResult[];
  engineVersion: string;
}

/**
 * Implement this interface against Samyak's real schema.
 * Never infer column names or table constraints from this interface.
 */
export interface ArenaRepository {
  loadMatch(matchId: string): Promise<AuthorizedMatch | null>;
  assertPlayerCanJoinMatch(matchId: string, userId: string): Promise<boolean>;
  getPublicDisplayName(userId: string): Promise<string>;
  loadQuestionsForMatch(matchId: string): Promise<ServerQuestion[]>;
  /**
   * Must atomically persist result and rating ledger, or call a transaction-safe RPC.
   * A retry with the same idempotencyKey must not apply scores/ELO twice.
   */
  persistAuthoritativeResult(result: AuthoritativeMatchResult): Promise<void>;
  /** Record a no-contest/cancelled match with no rating change; must be idempotent. */
  persistNoContest(input: { matchId: string; userId: string; reason: string; idempotencyKey: string }): Promise<void>;
}

/**
 * Fail-closed adapter placeholder. Replace with the real Supabase adapter before use.
 * This intentionally prevents accidental production deployment with fake persistence.
 */
export const arenaRepository: ArenaRepository = {
  async loadMatch() {
    throw new Error("ArenaRepository.loadMatch is not implemented");
  },
  async assertPlayerCanJoinMatch() {
    throw new Error("ArenaRepository.assertPlayerCanJoinMatch is not implemented");
  },
  async getPublicDisplayName() {
    throw new Error("ArenaRepository.getPublicDisplayName is not implemented");
  },
  async loadQuestionsForMatch() {
    throw new Error("ArenaRepository.loadQuestionsForMatch is not implemented");
  },
  async persistAuthoritativeResult() {
    throw new Error("ArenaRepository.persistAuthoritativeResult is not implemented");
  },
  async persistNoContest() {
    throw new Error("ArenaRepository.persistNoContest is not implemented");
  },
};
