import { Room, ServerError, type Client, type Delayed } from "colyseus";
import { z } from "zod";
import { verifyArenaTicket, type ArenaTicketClaims } from "../auth/arenaTicket.js";
import { consumeTicketNonce } from "../auth/nonceStore.js";
import type {
  ArenaRepository,
  AuthorizedMatch,
  ServerQuestion,
  AuthoritativeMatchResult,
  FinalPlayerResult,
} from "../repositories/arenaRepository.js";
import { arenaRepository } from "../repositories/arenaRepository.js";

const JoinOptionsSchema = z.object({
  matchId: z.string().uuid(),
}).strict();

const SubmitAnswerSchema = z.object({
  questionId: z.string().min(1).max(64),
  selectedOptionId: z.string().min(1).max(16),
}).strict();

interface PlayerRecord {
  userId: string; // server-only canonical ID; never sent to other players
  publicId: string;
  displayName: string;
  score: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  connected: boolean;
}

interface AcceptedAnswer {
  selectedOptionId: string;
}

const ENGINE_VERSION = "samyak-quiz-battle/1.0.0";
const MAX_PLAYERS = 2;
const DEFAULT_QUESTION_MS = 15_000;

let repository: ArenaRepository = arenaRepository;
let repositoryConfigured = false;

/** Configure once at process boot with the production repository adapter. */
export function configureArenaRepository(value: ArenaRepository): void {
  repository = value;
  repositoryConfigured = true;
}

export function isArenaRepositoryConfigured(): boolean {
  return repositoryConfigured;
}

export class QuizBattleRoom extends Room {
  maxClients = MAX_PLAYERS;
  maxMessagesPerSecond = 10;
  private matchId = "";
  private match: AuthorizedMatch | null = null;
  private questions: ServerQuestion[] = [];
  private questionIndex = -1;
  private questionDeadline = 0;
  private phase: "waiting" | "active" | "settling" | "completed" = "waiting";
  private readonly players = new Map<string, PlayerRecord>();
  private readonly answers = new Map<string, AcceptedAnswer>();
  private questionTimer?: Delayed;
  private currentDurationMs = DEFAULT_QUESTION_MS;
  private resultPersisted = false;

  /**
   * Static authentication runs before a client is admitted.
   * `client.auth.token` is populated by the Colyseus SDK authentication mechanism.
   */
  static async onAuth(token: string, options: unknown): Promise<ArenaTicketClaims> {
    const parsedOptions = JoinOptionsSchema.safeParse(options);
    if (!parsedOptions.success) throw new ServerError(400, "Invalid match options");

    try {
      const claims = verifyArenaTicket(token);
      if (claims.matchId !== parsedOptions.data.matchId) {
        throw new Error("Ticket is not scoped to this match");
      }
      const remainingSeconds = Math.max(1, claims.exp - Math.floor(Date.now() / 1000));
      const consumed = await consumeTicketNonce(claims.nonce, remainingSeconds + 5);
      if (!consumed) throw new Error("Ticket nonce already used");
      return claims;
    } catch {
      throw new ServerError(401, "Invalid or expired arena ticket");
    }
  }

  async onCreate(options: unknown): Promise<void> {
    const parsed = JoinOptionsSchema.safeParse(options);
    if (!parsed.success) throw new ServerError(400, "A valid matchId is required");

    this.matchId = parsed.data.matchId;
    // `unlisted` hides the room from public listings but still allows joinOrCreate.
    // The matchId filter and server-side roster check prevent cross-match admission.
    await this.setMatchmaking({ unlisted: true, metadata: { matchId: this.matchId } });
    this.clock.start();

    // Load only server-side data. The client cannot choose question IDs or answer keys.
    this.match = await repository.loadMatch(this.matchId);
    if (!this.match || this.match.roomType !== "quiz_battle") {
      throw new ServerError(404, "Match not found");
    }
    if (!(["waiting", "ready"] as const).includes(this.match.status as "waiting" | "ready")) {
      throw new ServerError(409, "Match is not accepting players");
    }

    this.questions = await repository.loadQuestionsForMatch(this.matchId);
    if (this.questions.length < 1 || this.questions.length > 50) {
      throw new ServerError(500, "Match question configuration is invalid");
    }
    this.validateQuestionSet(this.questions);
    const scoring = this.match.scoringRules;
    if (![scoring.correct, scoring.incorrect, scoring.unanswered].every((value) => Number.isFinite(value) && Math.abs(value) <= 1_000)) {
      throw new ServerError(500, "Match scoring configuration is invalid");
    }

    this.onMessage("submit_answer", (client, rawPayload) => {
      void this.handleAnswer(client, rawPayload).catch((error: unknown) => {
        console.error("answer_handler_failed", {
          matchId: this.matchId,
          error: error instanceof Error ? error.message : "unknown",
        });
        client.send("action_rejected", { code: "TEMPORARY_ERROR" });
      });
    });
  }

  async onJoin(client: Client, _options: unknown, auth: ArenaTicketClaims): Promise<void> {
    if (!this.match || auth.matchId !== this.matchId) {
      throw new ServerError(403, "Match authorization failed");
    }
    const allowed = await repository.assertPlayerCanJoinMatch(this.matchId, auth.sub);
    if (!allowed || !this.match.participantIds.includes(auth.sub)) {
      throw new ServerError(403, "You are not a participant in this match");
    }
    if ([...this.players.values()].some((player) => player.userId === auth.sub)) {
      throw new ServerError(409, "This account is already in the room");
    }
    if (this.players.size >= MAX_PLAYERS) {
      throw new ServerError(409, "This match is full");
    }

    const displayName = (await repository.getPublicDisplayName(auth.sub)).replace(/[<>\u0000-\u001f]/g, "").trim().slice(0, 40) || "Student";
    this.players.set(client.sessionId, {
      userId: auth.sub,
      publicId: `player-${this.players.size + 1}`,
      displayName,
      score: 0,
      correctCount: 0,
      incorrectCount: 0,
      unansweredCount: 0,
      connected: true,
    });

    client.send("room_snapshot", {
      matchId: this.matchId,
      phase: this.phase,
      playerCount: this.players.size,
      players: this.publicPlayers(),
    });
    this.broadcast("player_joined", { players: this.publicPlayers() }, { except: client });

    if (this.players.size === MAX_PLAYERS && this.phase === "waiting") {
      this.beginMatch();
    }
  }

  async onDrop(client: Client): Promise<void> {
    const player = this.players.get(client.sessionId);
    if (!player || this.phase === "completed") return;
    player.connected = false;
    this.broadcast("player_connection", {
      publicId: player.publicId,
      connected: false,
      reconnectGraceSeconds: 15,
    });
    // The authoritative question deadline continues. A disconnect does not grant extra time.
    try {
      await this.allowReconnection(client, 15);
      const reconnected = this.players.get(client.sessionId);
      if (reconnected) reconnected.connected = true;
      this.broadcast("player_connection", { publicId: player.publicId, connected: true });
      client.send("room_snapshot", {
        matchId: this.matchId,
        phase: this.phase,
        questionIndex: this.questionIndex,
        questionDeadline: this.questionDeadline,
        players: this.publicPlayers(),
        currentQuestion: this.publicCurrentQuestion(),
      });
    } catch {
      await this.handleForfeit(player.userId);
    }
  }

  onLeave(client: Client): void {
    if (this.phase !== "completed") {
      const player = this.players.get(client.sessionId);
      if (player) void this.handleForfeit(player.userId);
    }
  }

  onDispose(): void {
    this.questionTimer?.clear();
  }

  private validateQuestionSet(questions: ServerQuestion[]): void {
    const ids = new Set<string>();
    for (const question of questions) {
      if (!question.id || ids.has(question.id)) throw new Error("Duplicate or missing question ID");
      ids.add(question.id);
      if (!question.prompt || !Array.isArray(question.options) || question.options.length < 2) {
        throw new Error(`Invalid question ${question.id}`);
      }
      if (!question.options.some((option) => option.id === question.correctOptionId)) {
        throw new Error(`Correct option missing for question ${question.id}`);
      }
    }
  }

  private beginMatch(): void {
    if (this.phase !== "waiting" || this.players.size !== MAX_PLAYERS) return;
    this.phase = "active";
    this.broadcast("match_started", { questionCount: this.questions.length });
    this.clock.setTimeout(() => this.startNextQuestion(), 3_000);
  }

  private startNextQuestion(): void {
    if (this.phase !== "active") return;
    this.questionIndex += 1;
    this.answers.clear();

    if (this.questionIndex >= this.questions.length) {
      void this.finishMatch().catch((error: unknown) => console.error("match_finalization_failed", error));
      return;
    }

    const question = this.questions[this.questionIndex];
    const configuredDuration = this.match?.questionDurationMs ?? DEFAULT_QUESTION_MS;
    const durationMs = Math.min(Math.max(configuredDuration, 5_000), 60_000);
    this.currentDurationMs = durationMs;
    this.questionDeadline = Date.now() + durationMs;

    // Public projection deliberately excludes correctOptionId and explanation.
    this.broadcast("question_started", {
      index: this.questionIndex,
      question: {
        id: question.id,
        prompt: question.prompt,
        options: question.options,
      },
      deadlineEpochMs: this.questionDeadline,
      durationMs,
    });

    this.questionTimer?.clear();
    this.questionTimer = this.clock.setTimeout(() => {
      void this.settleQuestion().catch((error: unknown) => {
        console.error("question_settlement_failed", error);
      });
    }, durationMs);
  }

  private async handleAnswer(client: Client, rawPayload: unknown): Promise<void> {
    const player = this.players.get(client.sessionId);
    if (!player || !player.connected || this.phase !== "active") {
      client.send("action_rejected", { code: "NOT_IN_ACTIVE_MATCH" });
      return;
    }
    const parsed = SubmitAnswerSchema.safeParse(rawPayload);
    if (!parsed.success) {
      client.send("action_rejected", { code: "INVALID_ANSWER_PAYLOAD" });
      return;
    }

    const question = this.questions[this.questionIndex];
    if (!question || parsed.data.questionId !== question.id) {
      client.send("action_rejected", { code: "QUESTION_NOT_CURRENT" });
      return;
    }
    if (Date.now() > this.questionDeadline) {
      client.send("action_rejected", { code: "ANSWER_WINDOW_CLOSED" });
      return;
    }
    if (this.answers.has(player.userId)) {
      client.send("action_rejected", { code: "ANSWER_ALREADY_RECORDED" });
      return;
    }
    if (!question.options.some((option) => option.id === parsed.data.selectedOptionId)) {
      client.send("action_rejected", { code: "UNKNOWN_OPTION" });
      return;
    }

    this.answers.set(player.userId, {
      selectedOptionId: parsed.data.selectedOptionId,
    });
    client.send("answer_received", { questionId: question.id });

    if (this.answers.size === this.players.size) {
      this.questionTimer?.clear();
      await this.settleQuestion();
    }
  }

  private async settleQuestion(): Promise<void> {
    if (this.phase !== "active") return;
    this.phase = "settling";
    const question = this.questions[this.questionIndex];
    if (!question) return;

    const durationMs = Math.max(1, this.currentDurationMs);
    for (const player of this.players.values()) {
      const answer = this.answers.get(player.userId);
      if (!answer) {
        player.unansweredCount += 1;
        player.score += this.match!.scoringRules.unanswered;
        continue;
      }
      if (answer.selectedOptionId === question.correctOptionId) {
        player.correctCount += 1;
        player.score += this.match!.scoringRules.correct;
      } else {
        player.incorrectCount += 1;
        player.score += this.match!.scoringRules.incorrect;
      }
    }

    this.broadcast("question_result", {
      questionId: question.id,
      correctOptionId: question.correctOptionId,
      explanation: question.explanation ?? null,
      players: this.publicPlayers(),
    });

    this.phase = "active";
    this.clock.setTimeout(() => this.startNextQuestion(), 2_000);
  }

  private async finishMatch(): Promise<void> {
    if (this.phase === "completed" || this.resultPersisted) return;
    this.phase = "settling";
    this.questionTimer?.clear();

    const players: FinalPlayerResult[] = [...this.players.values()].map((player) => ({
      userId: player.userId,
      score: player.score,
      correctCount: player.correctCount,
      incorrectCount: player.incorrectCount,
      unansweredCount: player.unansweredCount,
    }));

    const result: AuthoritativeMatchResult = {
      matchId: this.matchId,
      idempotencyKey: `quiz-battle:${this.matchId}:${ENGINE_VERSION}`,
      completedAt: new Date().toISOString(),
      players,
      engineVersion: ENGINE_VERSION,
    };

    // Never announce a final/persisted result if the durable write failed.
    try {
      await repository.persistAuthoritativeResult(result);
    } catch (error) {
      // Do not publish a successful result. The adapter must alert/repair and
      // retry idempotently through a durable workflow; this room remains unsettled.
      console.error("authoritative_result_persistence_failed", {
        matchId: this.matchId,
        idempotencyKey: result.idempotencyKey,
        error: error instanceof Error ? error.message : "unknown",
      });
      this.broadcast("result_pending", { matchId: this.matchId, message: "Result is being verified. Please do not leave this screen." });
      return;
    }
    this.resultPersisted = true;
    this.phase = "completed";
    this.broadcast("match_completed", {
      matchId: this.matchId,
      players: this.publicPlayers(),
      persisted: true,
    });
    this.clock.setTimeout(() => { void this.disconnect(); }, 5_000);
  }

  private async handleForfeit(userId: string): Promise<void> {
    if (this.phase === "completed" || this.phase === "settling") return;
    const player = [...this.players.values()].find((entry) => entry.userId === userId);
    if (!player) return;
    this.phase = "settling";
    const idempotencyKey = `quiz-battle-no-contest:${this.matchId}:${userId}`;
    try {
      // No rating change or automatic win is applied in this starter policy.
      await repository.persistNoContest({
        matchId: this.matchId,
        userId,
        reason: "reconnect_grace_expired_or_player_left",
        idempotencyKey,
      });
      this.phase = "completed";
      this.broadcast("match_voided", {
        matchId: this.matchId,
        publicId: player.publicId,
        reason: "no_contest",
      });
      this.clock.setTimeout(() => { void this.disconnect(); }, 5_000);
    } catch (error) {
      console.error("no_contest_persistence_failed", {
        matchId: this.matchId,
        idempotencyKey,
        error: error instanceof Error ? error.message : "unknown",
      });
      this.broadcast("result_pending", { matchId: this.matchId, message: "Match status is being verified." });
    }
  }

  private publicPlayers() {
    return [...this.players.values()].map((player) => ({
      publicId: player.publicId,
      displayName: player.displayName,
      score: player.score,
      correctCount: player.correctCount,
      incorrectCount: player.incorrectCount,
      unansweredCount: player.unansweredCount,
      connected: player.connected,
    }));
  }

  private publicCurrentQuestion() {
    const question = this.questions[this.questionIndex];
    if (!question || this.phase !== "active") return null;
    return {
      id: question.id,
      prompt: question.prompt,
      options: question.options,
    };
  }
}

