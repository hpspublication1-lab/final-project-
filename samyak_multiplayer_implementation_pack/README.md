# Samyak Multiplayer Implementation Pack

**Purpose:** A safe, staged integration reference for adding authoritative real-time quiz battles to the existing Samyak CEE / Samyak Tutor platform.

**Based on the supplied November 2026 architecture blueprint.** This pack is a developer handoff and starter scaffold. It is **not** a patch to `d:\FR`, has not been compiled against Samyak's private source tree, and is not production-ready until the repository adapters, authorization checks, deployment environment, and tests are completed.

## Recommended first implementation

- Keep Next.js 15, React 19, Supabase Auth, Supabase PostgreSQL, Vercel, Cloudflare, and Bunny.net.
- Add a separate long-running Node.js + TypeScript Colyseus service for authoritative multiplayer rooms.
- Use a short-lived server-issued ticket derived from a verified Supabase access token.
- Use Redis for shared Colyseus Presence, room listing/driver, one-time nonce consumption, and distributed matchmaking state when you scale beyond one process.
- Keep canonical student identity, academic records, question bank, entitlements, and durable match results in Supabase PostgreSQL.
- Keep transient state (live timer, answers received during an active round, temporary room state) in the Colyseus room process.

## What is included

| Path | Purpose |
|---|---|
| `docs/01-architecture-decisions.md` | Target architecture and technology decisions |
| `docs/02-audit-findings-and-remediation.md` | Specific risks identified in the uploaded blueprint and their remediation order |
| `docs/03-integration-runbook.md` | Staged implementation and deployment runbook |
| `docs/04-coding-agent-prompt.md` | Prompt for your coding agent to integrate against the real `d:\FR` codebase |
| `docs/05-acceptance-and-test-plan.md` | Security, functional, reliability, and performance acceptance tests |
| `docs/06-official-references.md` | Current official Colyseus, Supabase, Cloudflare, Vercel and testing documentation |
| `HANDOFF_STATUS.md` | Exact delivered scope, limitations and blockers before staging/production |
| `server/` | Colyseus server scaffold and room/auth/repository interfaces |
| `web/` | Next.js ticket-route and browser-client integration examples |
| `database/` | Additive migration proposal; inspect schema before applying |
| `load-testing/` | Load-testing approach and test matrix |

## Important integration boundary

The uploaded report names existing Samyak tables and files, but it does not contain their complete source code, exact column definitions, complete RLS policies, or deployment secrets. Therefore:

1. Do not blindly apply the SQL migration.
2. Implement `ArenaRepository` against the real schema and current business rules.
3. Verify the existing Fonepay/eSewa, exam and championship transaction flows before reusing them.
4. Do not replace the old Arena until the new path passes staging acceptance tests.
5. Do not route production users to this scaffold until the repository adapter and all release gates are complete.

## Current recommended scope

**Milestone 1:** Secure the existing 1v1 path, then create a staging-only 1v1 authoritative vertical slice.

**Not in Milestone 1:** chat, friend graph, 3D games, real-money prizes, broad tournament migration, 10,000 concurrent multiplayer players, or 100,000 concurrent game sockets.

## Quick start

1. Read `docs/02-audit-findings-and-remediation.md`.
2. Have the technical lead inspect the exact Arena files and Supabase migrations listed in the uploaded blueprint.
3. Scaffold the current Colyseus project using the official generator, then integrate these files into that scaffold (see `server/README.md`).
4. Implement and test the `ArenaRepository` adapter.
5. Configure staging secrets using `server/.env.example` and `web/.env.example`.
6. Deploy only to a staging hostname such as `arena-staging.samyakcee.com`.
7. Complete `docs/05-acceptance-and-test-plan.md` before any production cutover.

## Production warnings

- Never send `correct_answer`, `correct_option`, scoring keys, or answer explanations before the intended reveal point.
- Never accept a client-provided score, ELO delta, winner, timer deadline, role, or authoritative user ID.
- Do not put bearer tokens in URL query strings. URLs are commonly captured in logs, telemetry, browser history, and proxy traces. Use the Colyseus SDK auth token mechanism and verify it server-side.
- Do not treat Cloudflare WAF as message-level WebSocket inspection. It protects the initial upgrade request; validate every message in the game server.
- Do not claim a fixed number of concurrent players per VM. Benchmark the actual room logic, message rate, payload size, CPU, memory, network, and region.
- Do not acknowledge an answer/result as saved until it is durably recorded or accepted by a durable queue with a tested recovery contract.
- Never auto-ban students solely because of a fast answer or mouse telemetry. Use reviewable evidence and fair appeal paths.
