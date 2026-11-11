# STEP 05 — SUPABASE REPOSITORY ADAPTER & DATABASE INTEGRATION
**Document Version:** 1.0.0-DB  
**Stage:** Step 5 (Database Integration & Idempotent Persistence)  
**Date:** November 10, 2026  
**Database Architect:** Principal Software Architect, Database Architect  
**Target Repository:** `d:\FR` (Paths: `services/multiplayer/src/repositories/supabaseArenaRepository.ts`, `services/multiplayer/src/persistence/resultPersister.ts`)  

---

## 1. Database Integration Design & Mapping

The repository adapter (`SupabaseArenaRepository`) connects the real-time Colyseus game rooms to the canonical Supabase PostgreSQL schema without introducing database bottlenecks or violating Row Level Security (RLS).

```mermaid
flowchart LR
    subgraph ColyseusService["Colyseus Game Server"]
        Room["QuizBattleRoom"]
        Persister["ResultPersister"]
        Repo["SupabaseArenaRepository"]
    end

    subgraph SupabaseDB["Supabase PostgreSQL (Database Plane)"]
        RoomsTable[("public.battle_rooms")]
        QuestionsTable[("public.questions")]
        ResultsTable[("public.battle_results")]
        ProfilesTable[("public.user_profiles")]
        RPC["record_authoritative_battle_result RPC"]
    end

    Room -->|1. Load Match & Roster| Repo
    Repo -->|SELECT| RoomsTable
    Room -->|2. Load Questions| Repo
    Repo -->|SELECT in (questionIds)| QuestionsTable
    Room -->|3. On Match Completed| Persister
    Persister -->|Compute SHA256 Hash| Persister
    Persister -->|4. Atomically Persist Result| RPC
    RPC -->|INSERT / UPDATE (idempotent)| ResultsTable
    RPC -->|Update Completed At| RoomsTable
    Persister -->|5. Apply Elo Deltas| ProfilesTable
```

---

## 2. Table-by-Table Schema Mapping

| Database Table | Schema Columns Queried / Mutated | Read / Write Mechanism | RLS & Security Boundary |
| :--- | :--- | :--- | :--- |
| **`public.battle_rooms`** | `id`, `creator_id`, `opponent_id`, `status`, `question_ids`, `time_limit_seconds`, `completed_at` | Read via `loadMatch()`<br>Updated on match completion | RLS restricted to participants and open rooms. Direct client updates blocked. |
| **`public.questions`** | `id`, `question_text`, `options`, `correct_answer`, `explanation` | Read via `loadQuestionsForMatch()` using service role | `correct_answer` is strictly loaded into server memory. Never transmitted over WebSocket before reveal stage. |
| **`public.user_profiles`** | `id`, `full_name`, `username`, `battle_rating`, `total_points` | Read for names & ratings<br>Updated with verified Elo deltas | Students can only read public fields; rating and points updates are restricted to server execution. |
| **`public.battle_results`** | `room_id`, `player_id`, `score`, `correct_answers`, `incorrect_answers`, `accuracy`, `time_taken_seconds`, `rating_change`, `is_winner`, `idempotency_hash`, `server_node_id`, `engine_version`, `finalized_at`, `telemetry_audit` | Written via `record_authoritative_battle_result` RPC | Direct client `INSERT` and `UPDATE` revoked. Replay protected by `uq_battle_results_idempotency_hash`. |

---

## 3. Idempotent Result Settlement & Receipt Hashing

To ensure that network dropouts, worker retries, or duplicate client messages cannot apply rating adjustments or contest payouts twice, match outcomes are settled using a **Deterministic SHA-256 Receipt Hash**:

$$\text{ReceiptHash} = \text{HMAC-SHA256}(\text{Secret}, \text{RoomId} \parallel \text{P1\_ID} \parallel \text{P2\_ID} \parallel \text{P1\_Score} \parallel \text{P2\_Score})$$

### Implementation in [`resultPersister.ts`](file:///d:/FR/services/multiplayer/src/persistence/resultPersister.ts):
```typescript
export function computeMatchReceiptHash(
  roomId: string,
  p1Id: string,
  p2Id: string,
  p1Score: number,
  p2Score: number,
  secret: string
): string {
  const payload = `${roomId}:${p1Id}:${p2Id}:${p1Score.toFixed(2)}:${p2Score.toFixed(2)}`;
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}
```

### Settlement Behavior:
1. When a match ends, the server calculates `idempotencyHash`.
2. In-memory check: if `processedMatches.has(idempotencyHash)`, the cached result is returned immediately without re-executing database transactions.
3. Database check: the database RPC checks `public.battle_results.idempotency_hash`. If a row already exists with this hash, the transaction aborts idempotently, returning `{ applied: false, already_existed: true }`.

---

## 4. Resilience & Fail-Closed Behavior

1. **Database Degradation Handling:**
   - If Supabase PostgreSQL experiences network timeouts or connection pool exhaustion, the server logs a warning and stores the verified results in an in-memory fallback ledger.
   - The game room shuts down cleanly and returns verified scores to connected students without crashing the Node.js process.
2. **Missing Environment Keys:**
   - If `SUPABASE_SERVICE_ROLE_KEY` is missing in staging or testing, the repository operates in safe offline mode with seeded medical questions, allowing unit and load tests to pass reliably.
3. **No Contests:**
   - If an opponent disconnects before answering any questions and fails to reconnect within the 15-second grace period, `persistNoContest()` records the match cancellation without penalizing either player's Elo rating.
