# Multiplayer load testing

## Principle

Measure actual game behavior, not just open WebSocket connections. Tests must run in an isolated staging environment with synthetic users and a controlled question bank.

## Test levels

1. 10 players / 5 rooms — smoke test.
2. 50 players / 25 rooms — basic reliability.
3. 100 players / 50 rooms — pilot baseline.
4. 500 players / 250 rooms — early scale.
5. 1,000 players / 500 rooms — first capacity gate.
6. 2,500 / 5,000 / 10,000 — only after examining prior bottlenecks.

Use the real Colyseus SDK/protocol for room joins, messages, reconnects and leave. A generic `ws` echo benchmark does not represent Colyseus matchmaking or quiz traffic.

## Workload model

Define the expected match length, question duration, answer distribution, player reconnect rate, room size, and messages per question before measuring. Example: 10-question match, 15-second question deadline, answer at a randomized point, one answer per player/question, room result persistence at end.

Run at least three workload profiles:

- **Lobby burst:** many users request match tickets / matchmaking over a short period.
- **Active gameplay:** steady connected users with realistic answer message patterns.
- **Reconnect storm:** a percentage of clients disconnect and reconnect within a short window.

## Metrics to capture

- successful WebSocket connections / rejected joins;
- matchmaking queue time and queue depth;
- active rooms and connected clients;
- message throughput per message type;
- average / P95 / P99 server round-trip latency;
- room creation and disposal rate;
- CPU, RSS memory, event-loop lag and network egress;
- Redis latency, throughput, errors and memory;
- Postgres writes, pool wait, CPU and transaction time;
- result persistence success/failure and idempotent retry count;
- dropped connections and reconnect success.

## Stop conditions

Immediately stop a test if it affects production, threatens shared databases, causes uncontrolled spend, or triggers sustained error rates that could damage the staging environment.

## Capacity claim format

A valid report must state: commit SHA, image, VM size, region, Redis topology, database tier, client hardware/network, workload, ramp duration, hold duration, result metrics, failures, and bottlenecks. Do not say “supports X users” without this evidence.
