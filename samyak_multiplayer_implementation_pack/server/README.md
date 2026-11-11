# Colyseus service scaffold

## Important

This folder contains integration-oriented TypeScript examples, not a compiled drop-in service. The current uploaded Samyak blueprint does not include full SQL table definitions or repository source. The `ArenaRepository` intentionally fails closed until your team implements it against the actual schema.

## Scaffold the current server

Run from the repository root:

```bash
npm create colyseus-app@latest services/multiplayer
```

Use the current generated project layout and package versions. The Colyseus documentation currently identifies v0.18. Adapt imports if the generator layout differs.

Copy the files under this `server/` directory into the generated project, adjusting relative paths and entrypoint as necessary.

## Dependencies

The scaffold assumes these runtime packages are available in the generated project:

- `colyseus`
- `@colyseus/redis-presence` (multi-process staging/production only)
- `@colyseus/redis-driver` (multi-process staging/production only)
- `ioredis` (nonce single-use and shared coordination)
- `jsonwebtoken`
- `zod`

Use compatible versions generated/validated with the current Colyseus release. Commit a lockfile. Do not use floating production dependency ranges.

## Local development

The server can run single-process without Redis for a local prototype if the nonce store is substituted with a single-process test implementation. Never use that fallback in a multi-process or production deployment.

## Required before running

1. Implement `ArenaRepository`.
2. Configure the question repository to query the real question bank using an explicit public/private DTO split.
3. Implement match creation/assignment using existing Arena matchmaking logic, but fix identity authorization first.
4. Configure a separate staging Supabase project or controlled staging database.
5. Configure ticket secret and Redis.
6. Add tests and health/metrics endpoints.
