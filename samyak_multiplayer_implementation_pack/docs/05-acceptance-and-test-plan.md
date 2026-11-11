# 05 — Acceptance and Test Plan

## 1. Functional acceptance

| Test | Expected outcome |
|---|---|
| Authenticated eligible student requests ticket | Ticket issued with short expiry and match scope |
| Invalid/expired Supabase access token | 401; no ticket |
| Unknown or unauthorized match ID | Denied; no room membership disclosed |
| Expired game ticket | Colyseus join rejected |
| Replayed one-time ticket nonce | Second use rejected |
| Student tries another user's match | Rejected by server-side roster check |
| Two authorized players join same match | Both enter same room |
| Third player tries to join a 1v1 room | Rejected |
| Client asks for answer key | No answer key returned |
| Client submits a valid answer | Server evaluates using server-held key |
| Client submits same answer twice | At most one accepted answer per player/question |
| Client sends score or winner field | Field ignored/rejected; server computes result |
| Question deadline expires | Server closes question at server deadline |
| Match ends | Persisted result returned only after durable persistence |
| Result finalization retried | No duplicate result/ELO delta |
| Network drops briefly | Documented reconnect policy applied |
| Room process shuts down | Graceful close/reconnect policy applied; no phantom result |

## 2. Security acceptance

- [ ] No answer key in HTTP responses, WebSocket messages, schema state, metadata, client bundles, or logs before reveal.
- [ ] User identity derives from verified Supabase claims, never body/query `userId`.
- [ ] Every room join verifies the match roster.
- [ ] Tickets have explicit issuer, audience, subject, match scope, room scope, expiry and nonce.
- [ ] Ticket signing secret differs from all Supabase and payment secrets.
- [ ] Tickets are not placed in URLs.
- [ ] Ticket replay is rejected using shared, atomic nonce storage for multi-process deployment.
- [ ] Every message has schema validation, size limit and per-user rate limit.
- [ ] All scoring and ELO calculations run in trusted server code.
- [ ] Result write is idempotent and transactionally consistent with rating ledger.
- [ ] Staff/admin room controls are separately authorized and audited.
- [ ] Logs contain no raw tokens, answer keys or unnecessary PII.
- [ ] Cloudflare WAF is not treated as inspection of ongoing WebSocket frames.

## 3. Reliability acceptance

- [ ] Redis unavailable: service fails closed for operations requiring shared matchmaking/nonce state; no unsafe fallback to local-only state in multi-node production.
- [ ] PostgreSQL temporarily unavailable: do not falsely report a final result as durably saved.
- [ ] Duplicate event delivery: no duplicate result or rating effect.
- [ ] Room process restart: the documented policy handles active games; never fabricate a winner.
- [ ] Network reconnect: student returns to server-authoritative current state.
- [ ] Graceful shutdown: clients receive a close/reconnect message; no orphaned match result.
- [ ] Backpressure/queue limits prevent unbounded in-memory growth.

## 4. Performance test matrix

Test gradually in an isolated staging environment. A target should be promoted only after the previous level is stable.

| Level | Concurrent game players | Hold | Purpose |
|---|---:|---:|---|
| 1 | 10 | 10 min | Functional smoke |
| 2 | 50 | 15 min | Basic stability |
| 3 | 100 | 30 min | Pilot validation |
| 4 | 500 | 30 min | Early production simulation |
| 5 | 1,000 | 30 min | Initial scale gate |
| 6 | 2,500+ | 30–60 min | Only after reviewing bottlenecks |
| 7 | 5,000+ | 30–60 min | Capacity certification stage |
| 8 | 10,000+ | 30–60 min | Long-term objective; not a launch assumption |

For each test record:
- exact server size, region and image/build SHA;
- Redis plan, topology and region;
- database tier, pool settings and baseline CPU;
- WebSocket connects and disconnects;
- active rooms and average/max clients per room;
- messages/sec by type;
- average, P95 and P99 message round-trip latency;
- CPU, RSS memory, event-loop delay and network bandwidth;
- Redis latency, command rate and errors;
- DB query/write rate, pool wait and transaction duration;
- failed/duplicate/rejected messages;
- reconnect success rate;
- result persistence success and time.

A generic open-WebSocket test does not validate the Colyseus protocol or gameplay. Use the official Colyseus client or a protocol-compatible test client that performs actual matchmaking, joins rooms, sends valid actions, receives events and leaves cleanly.

## 5. Release gate

Do not enable the new Arena path for public students until:

1. No unresolved Critical or High security issues remain without a formally approved exception.
2. Answer keys are verified absent from all pre-reveal client payloads.
3. Client score/result manipulation tests fail safely.
4. Match participant authorization is enforced server-side.
5. Result persistence is durable and idempotent.
6. Reconnect and process-shutdown behavior is tested.
7. Pilot load target is met with documented measurements.
8. Monitoring, rollback and incident owners are assigned.

## 6. Human/academic fairness

- Provide clear rules for timeouts, disconnections, rematches, ties and disputes.
- Do not use a single reaction-time threshold to auto-ban.
- Preserve a result audit trail for appeals.
- Keep game rating separate from academic mastery and official exam marks.
- Restrict messaging and invitations appropriately for school-age users.
- Avoid pay-to-win mechanics in academic competitions.
