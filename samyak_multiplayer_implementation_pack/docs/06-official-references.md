# 06 — Official Documentation and Integration References

Checked for this handoff on 10 November 2026. Re-check versions and pricing before procurement or deployment.

## Colyseus

- Documentation (currently shown as v0.18): https://docs.colyseus.io/
- Create a server: https://docs.colyseus.io/getting-started
- Rooms and lifecycle: https://docs.colyseus.io/room
- Room authentication: https://docs.colyseus.io/auth/room
- Reconnection: https://docs.colyseus.io/room/reconnection
- Matchmaking: https://docs.colyseus.io/matchmaker
- Room visibility: https://docs.colyseus.io/matchmaker/visibility
- Scaling: https://docs.colyseus.io/scalability
- Driver / shared room discovery: https://docs.colyseus.io/server/driver
- Presence: https://docs.colyseus.io/server/presence
- Deployment: https://docs.colyseus.io/deployment

Implementation note: for multi-process or multi-machine deployments, use the appropriate shared Presence and shared Driver adapters. Confirm room allocation, seat reservation, load-balancer routing and reconnection behavior against the exact Colyseus version used by the generated project.

## Supabase

- Verify a user from an access token: https://supabase.com/docs/reference/javascript/auth-getuser
- Row Level Security: https://supabase.com/docs/guides/database/postgres/row-level-security
- Database functions: https://supabase.com/docs/guides/database/functions

Implementation note: the ticket issuer must verify the Supabase access token server-side and check the match roster using the actual Samyak schema. RLS must be tested directly; do not assume server-side code or a service-role client automatically enforces user-level authorization.

## Cloudflare

- WebSockets: https://developers.cloudflare.com/network/websockets/

Cloudflare documentation says proxied WebSocket connections are supported. The game server must still authenticate the upgrade and validate every message after the connection is established. Do not treat the WAF as message-level inspection of WebSocket frames.

## Vercel

- WebSocket support in Vercel Functions: https://vercel.com/kb/guide/do-vercel-serverless-functions-support-websocket-connections

Vercel documentation currently describes WebSocket support as a public beta and explains function-duration/reconnection behavior. Samyak's proposed separate long-running Colyseus service is a deliberate boundary for room lifecycle, predictable process ownership and capacity management—not a claim that Vercel has no WebSocket capability.

## Security and load testing

- OWASP Application Security Verification Standard: https://owasp.org/www-project-application-security-verification-standard/
- OWASP API Security: https://owasp.org/API-Security/
- k6 documentation: https://grafana.com/docs/k6/latest/

## Procurement cautions

No player-per-VM, fixed latency, or fixed monthly cost figure in the architecture blueprint should be treated as guaranteed. Obtain current provider quotes and benchmark a representative game room, player count, message rate, payload size and Nepal network paths before purchasing capacity.
