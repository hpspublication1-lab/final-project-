# 03 — Integration and Deployment Runbook

## Phase 0 — Repository inspection (no code changes)

Before integrating this pack, inspect the live repository and write down:

1. The exact columns and constraints for `battle_rooms`, `room_members`, `matchmaking_queue`, `battle_results`, `battle_answers`, `championship_entries`, and `championship_matches`.
2. Current RLS policies and grants for all Arena tables.
3. The current `find_or_create_battle_match` and `submit_battle_result` RPC definitions.
4. Exact fields returned by `/api/arena/questions`.
5. All frontend callers of Arena APIs and Supabase Realtime channels.
6. Whether score/ELO/payout logic is duplicated in UI, API, RPC, or SQL triggers.
7. Existing migration naming convention and deployment procedure.

Do not apply the proposed migration until this is complete.

## Phase 1 — Scaffold the dedicated multiplayer service

Use the current official Colyseus generator, not a manually guessed old package layout:

```bash
npm create colyseus-app@latest services/multiplayer
```

Review the generated package versions and TypeScript configuration. Copy the relevant files from this pack into the generated structure, adapting import paths to the generated server entrypoint.

Install the Redis components only when preparing multi-process staging:

```bash
npm install @colyseus/redis-presence @colyseus/redis-driver ioredis
```

Keep the first local prototype single-process with the default in-memory driver. Do not add Redis complexity until the local room flow works; add Redis for shared presence and room discovery when deploying multiple processes.

## Phase 2 — Configure secrets

Generate a separate strong ticket secret (minimum 32 random bytes). Do not reuse Supabase service-role credentials, JWT secrets, Bunny tokens, Fonepay secrets, or Cloudflare keys.

Configure the same `ARENA_TICKET_SECRET`, `ARENA_TICKET_ISSUER`, and `ARENA_TICKET_AUDIENCE` in:

- Vercel Preview/Development environment for the ticket route;
- the staging multiplayer service.

Use a different secret for production. Rotate secrets through a planned deployment, not by changing one side first.

Do not commit `.env` files. `.env.example` may contain names and dummy values only.

## Phase 3 — Implement the actual Supabase adapters

The starter uses an `ArenaRepository` interface because the full Samyak table definitions are not in the uploaded document.

Implement these operations using the real project schema:

- `assertPlayerCanJoinMatch(userId, matchId)`
- `loadMatchForRoom(matchId)`
- `loadQuestionsForMatch(matchId)` — return private answer keys only to the game server
- map the canonical approved Samyak battle scoring policy into `AuthorizedMatch.scoringRules`
- `persistAuthoritativeResult(result)` — transactionally persist result and rating changes once

Recommended `persistAuthoritativeResult` contract:

1. Validate match is in a finalizable state.
2. Verify both participants and authoritative question outcomes.
3. Insert one result keyed by unique `match_id` or a stable idempotency key.
4. Apply rating deltas in the same database transaction or through a durable ledger workflow.
5. Record completion timestamp and server/build identifier.
6. Return the already-persisted result on a legitimate retry; never apply ELO twice.

If Supabase PostgREST cannot express the needed transaction safely, implement a tightly scoped SQL function/RPC with restricted execute grants and server-only invocation. Do not split result insert and rating update into unrelated client operations.

## Phase 4 — Authentication ticket route

Copy `web/route.ts.example` into `src/app/api/arena/auth/ticket/route.ts` only after adapting the imports and authorization repository.

The route must:

- require an Authorization Bearer Supabase access token;
- verify that token with Supabase Auth (`auth.getUser(accessToken)` or an established verified-claims utility);
- validate `matchId`;
- verify the user is a participant in the correct waiting match;
- apply rate limits;
- create a signed ticket with issuer, audience, subject, match ID, scope, nonce, `iat`, and `exp`;
- return only the ticket, WebSocket endpoint and expiry.

Do not trust `userId`, rating, role, match status, or eligibility sent in the body.

## Phase 5 — Room creation and join authorization

The room is not allowed to load arbitrary question IDs from client-supplied options.

Before exposing public matchmaking:

1. Define how the first player creates a room for an already-authorized match intent.
2. Define how the second assigned player joins that same room.
3. Ensure a ticket is scoped to one match ID and one room type.
4. Verify participant membership on the server before adding the player.
5. Prevent public clients from creating unlimited arbitrary rooms.

The exact orchestration must guarantee one Colyseus room per canonical `matchId`. The sample room definition filters `joinOrCreate()` by `matchId`, but concurrent first-join races must still be tested. For production, implement an idempotent room-allocation operation in the trusted control plane (for example, use Colyseus Matchmaker API from a server-side service and persist the selected `roomId` against the canonical match under a database uniqueness/locking rule). Do not allow clients to create arbitrary match records or unlimited rooms. Keep any internal service credential server-to-server only.

## Phase 6 — Local validation

```bash
# from services/multiplayer
npm install
npm run build
npm test
```

Run the generated Colyseus test tooling or the repository's test runner. Confirm the generated commands; do not assume the scripts are identical across generator versions.

Start local Redis only when testing the distributed configuration:

```bash
docker compose -f docker-compose.redis.yml up -d
```

## Phase 7 — Staging deployment

- Use a dedicated staging service and staging Redis.
- Use a staging Supabase project or isolated staging schema/data.
- Configure `arena-staging.samyakcee.com` to the game-service origin.
- Enable WebSockets in Cloudflare network settings.
- Keep the origin inaccessible except through the intended proxy or secured origin network path.
- Test WSS handshake, idle timeout, reconnect, graceful shutdown, and health checks.
- Configure health monitoring and alerting before inviting students.

Cloudflare's WAF can protect the initial WebSocket upgrade request; application-level messages still require validation in the room server.

## Phase 8 — Feature-flagged pilot

1. Allow internal staff only.
2. Compare result calculations with a trusted expected-result fixture.
3. Pilot with a small invited student cohort.
4. Do not double-award ELO or prizes while old and new paths coexist.
5. Expand by cohort after a successful observation window.
6. Maintain a rollback switch to the old user interface, but do not restore unsafe client-authoritative scoring.

## Phase 9 — Production scale

Only add more game nodes after measuring one-node behavior. For multi-process or multi-machine deployments, configure both Colyseus shared Presence and a shared Driver (Redis Presence and Redis Driver are the standard Redis components). Confirm public address / room routing and load balancer behavior from the current Colyseus deployment docs.

Capacity certification requires load tests that use the actual client protocol, actual room logic, realistic player behavior, and production-equivalent networking. A raw WebSocket connection test is not a quiz-game capacity test.

## Rollback

- Keep the previous Arena UI available behind a feature flag.
- Keep existing database tables and records intact.
- Do not roll back migrations that have written production results unless a tested forward-fix/reconciliation procedure exists.
- Disable new room creation first; allow active rooms to finish or close with a clear user message.
- Confirm result persistence and avoid duplicate ratings after rollback.
