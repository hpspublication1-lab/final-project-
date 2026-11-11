# 04 — Coding Agent Prompt: Integrate With the Real Samyak Repository

Copy this prompt into Claude Code, Codex, Cursor, or the coding agent operating inside the actual `d:\FR` repository. Attach this implementation pack to that coding session.

---

You are the principal engineer responsible for integrating a dedicated Colyseus authoritative multiplayer service into the existing Samyak CEE / Samyak Tutor repository.

## Non-negotiable context

The platform currently uses Next.js 15 App Router, React 19, TypeScript, Node.js, Supabase Auth/PostgreSQL, Vercel, Cloudflare, and Bunny.net. Existing Arena code and tables already exist. Do not build a second Arena schema or duplicate identity.

The architecture pack is a design reference. You must inspect the real source code and current official Colyseus documentation before writing code. The source tree and actual database migrations are authoritative.

## Stage A — Read-only reconnaissance

1. Inspect the full Arena UI and API implementation.
2. Inspect every migration defining Arena tables, functions, triggers, indexes and RLS.
3. Inspect all callers of `submit_battle_result`, `find_or_create_battle_match`, presence APIs and Supabase Realtime messages.
4. Trace whether answer keys, client-computed scores, winner IDs, user IDs or ELO deltas are trusted.
5. Identify the actual question table columns and exam/subject relationships.
6. Inspect package versions and deployment workflow.
7. Produce a gap report with exact file paths, line numbers and SQL definitions.

Do not modify any files during Stage A.

## Stage B — Security remediation proposal

Prioritize:
- remove answer keys from all client-facing Arena responses;
- make matchmaking identity derive only from verified Supabase identity;
- remove client authority over score, winner and rating changes;
- eliminate high-frequency ephemeral progress writes to PostgreSQL;
- verify RLS, RPC grants, tenant boundaries and admin permissions;
- design secure ticket issuance and room authorization.

For each fix, state whether it is backward-compatible and how rollback works.

## Stage C — Approved implementation

Only after the owner approves the Stage A findings and remediation plan:

1. Scaffold a separate Colyseus service using the currently supported official generator and compatible package versions.
2. Implement a short-lived signed ticket route in Next.js.
3. Verify Supabase access tokens server-side; never trust a client-provided user ID.
4. Bind each ticket to a user, single match ID, allowed room type, issuer, audience, expiry and unique nonce.
5. Verify ticket and match membership in Colyseus `static onAuth` and room join lifecycle.
6. Implement one server-authoritative 1v1 quiz room.
7. Fetch questions and private answer keys only through a trusted repository adapter.
8. Never transmit answer keys until the configured reveal point.
9. Validate every inbound message with a strict schema, length limit, rate limit and room-state check.
10. Use server time for question deadlines and server code for scoring.
11. Use durable, idempotent result persistence. The final result and rating ledger must not be applied twice.
12. Add reconnect behavior with explicit fair timer policy.
13. Keep Redis disabled in local single-process development; add Redis Presence and Driver for multi-process staging.
14. Add health checks, structured logs, metrics and graceful shutdown.
15. Add tests for auth, cheating, answer-key secrecy, duplicate submissions, reconnects, persistence and failures.

## Architecture constraints

- Next.js remains the control plane; Colyseus is a separate long-running service.
- Supabase remains the canonical identity, academic, and durable records system.
- No bearer ticket in query string.
- No Supabase service-role key in the client or Colyseus room payload.
- No client-provided score, winner, answer correctness, role or ELO delta.
- No direct writes to the existing result tables from the browser.
- No public ability to create unlimited rooms; match/room creation must be authorized by trusted control-plane logic.
- Do not store every timer tick or ephemeral presence ping in PostgreSQL.
- Do not auto-ban students solely on a simplistic response-time threshold.
- Do not add PlayFab, Photon, Nakama or Firebase unless a documented product requirement justifies it.

## Stage D — Validation

Run type checks, unit tests, integration tests, dependency audit, static analysis and staging end-to-end tests. Generate reproducible load-test evidence. Do not claim a capacity number based on VM specifications alone.

## Stage E — Deliverables

Return:
1. Modified file list and reason for each modification.
2. Architecture diagram matching actual code.
3. Database migration(s) with down/forward recovery considerations.
4. New API contract.
5. Environment variable names (no values or secrets).
6. Test output and untested areas.
7. Security findings and remediation evidence.
8. Performance benchmark with exact environment and workload.
9. Deployment and rollback instructions.
10. A clear statement of what is not production-ready.

Do not deploy, migrate production data, change DNS, rotate production secrets, or make live payment changes without explicit approval. If any schema or permission is ambiguous, stop that particular change and report the exact ambiguity rather than guessing.

---
