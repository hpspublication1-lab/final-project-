# 02 — Findings From the Uploaded Samyak Multiplayer Blueprint

This document separates what the uploaded blueprint **reports** from actions that still require verification against the current `d:\FR` source tree and staging database.

## 1. Critical items reported by the audit

| Finding reported in uploaded blueprint | Why it matters | Required action before Colyseus migration |
|---|---|---|
| `/api/arena/questions` reportedly returns `correct_answer` | Students can inspect answer keys before a match | Stop returning answer keys; use an allowlisted public DTO |
| Battle Arena browser reportedly calculates scores and calls `submit_battle_result` with score values | Client can forge result payloads | Move scoring, winner calculation, and rating changes to trusted server code |
| `/api/arena/matchmake` reportedly trusts `body.userId` | Users can impersonate other users if not independently authenticated | Derive user ID only from verified Supabase identity; ignore client user ID |
| Presence/progress reportedly writes to `messages` every two seconds | Creates unnecessary database writes and WAL/replication load | Move transient progress/presence into room memory/Redis; persist only durable events |
| Existing progress uses Supabase Realtime messages | Database CDC is not a game-state transport substitute at high message frequency | Use Colyseus WebSockets for the match session |
| Reconnect handling is reportedly weak | Mobile network changes can leave matches inconsistent | Add explicit state machine and reconnect policy |

**Source:** supplied blueprint, lines 32–57. Findings are not independently reproduced here because the actual repository source was not attached.

## 2. Remediation order

### P0 — Contain existing security issues

1. Verify the question API in code and staging network traces.
2. Remove all answer keys from student-facing payloads.
3. Disable any client-submitted authoritative score path or make its server-side result calculation fully authoritative.
4. Authenticate matchmaking requests against Supabase and derive the user ID from verified claims.
5. Check RLS and RPC grants for all Arena-related tables/functions.
6. Review any legacy result writes before changing the client.

### P1 — Reduce database pressure safely

1. Inventory all writes to `messages`, `user_presence`, and Arena tables.
2. Distinguish durable chat/audit messages from ephemeral progress pings.
3. Move only transient room events to Colyseus/Redis.
4. Keep canonical match result, rating ledger, and tournament ledger writes in PostgreSQL.
5. Add rate limits shared across instances rather than in-process-only counters.

### P2 — Build the isolated game service

1. Scaffold Colyseus from its current official generator.
2. Implement Supabase identity verification and short-lived ticket issuance.
3. Implement server-authoritative 1v1 room.
4. Wire a repository adapter to the real battle tables and columns.
5. Add durable/idempotent result persistence.
6. Run staging-only functional and performance tests.

### P3 — Gradual cutover

1. Add a feature flag for a small internal group.
2. Run old and new Arena paths only in a controlled comparison mode; do not double-write awards or ELO.
3. Validate match results and persistence.
4. Expand pilot cohort.
5. Cut over only after acceptance criteria are met.
6. Keep rollback to legacy UI/API available while legacy security issues remain fixed.

## 3. Corrections to risky assumptions in the uploaded blueprint

### 3.1 CCU and cost claims are not validated

The uploaded blueprint includes estimates for per-node CCU, ping times, service costs, and total budget compliance. Treat these as planning assumptions, not vendor guarantees or measured capacity. Obtain actual quotes and benchmark your room workload.

### 3.2 Vercel WebSocket support does not remove the need for a game-service decision

Vercel has announced WebSocket support for Functions, but connections are pinned to a Function for its maximum duration and later connections are not guaranteed to reach the same Function. A separately managed Colyseus service gives Samyak explicit room-process lifecycle, capacity and routing control. See the source references in the handoff response.

### 3.3 Cloudflare WAF is not application message inspection

Cloudflare supports proxied WebSockets. However, its documentation says WAF rules apply to the initial HTTP 101 upgrade request and do not inspect subsequent messages inside the established WebSocket. Every game message must still be authenticated, schema-validated, rate-limited, size-limited, and authorized by Colyseus.

### 3.4 Do not put the ticket in the URL

The uploaded blueprint's example endpoint includes `?ticket=...`. Do not implement that as written. Query strings may be captured in proxy logs, traces, telemetry and diagnostics. Set the Colyseus SDK authentication token through its supported client auth mechanism and validate it in `static onAuth`.

### 3.5 Do not auto-ban based on a fixed reaction-time threshold

A rule such as “under 400ms means bot” is not a reliable standalone detector. Fast recall, accessibility tools, latency differences and question familiarity can cause false positives. Collect risk signals, rate-limit automation, preserve evidence, and require human review before punitive action.

### 3.6 A volatile queue does not guarantee zero data loss

A Redis/in-memory enqueue is not automatically equivalent to durable persistence. For final results, either commit the result transaction before acknowledging success, or use a durable queue with explicit persistence, retry, idempotency, monitoring and a tested recovery contract. Never promise zero data loss without proving that contract.

### 3.7 Do not pause all matches indefinitely on disconnect

A reconnect grace period is a product rule, not a free timer extension. Define whether the clock continues, whether the room pauses for all players, how many pauses are permitted, and what happens after timeout. For the first ranked quiz mode, keep server time authoritative and use a short documented reconnect policy with no client-controlled time extension.

## 4. Evidence required from the engineering team

For each reported finding, attach:

- exact current source file and commit SHA;
- endpoint request/response trace with sensitive data removed;
- SQL policy/function definition;
- reproduction steps in staging;
- fix commit;
- regression test;
- retest evidence.

Do not mark a finding “fixed” based only on code review or a passing TypeScript build.
