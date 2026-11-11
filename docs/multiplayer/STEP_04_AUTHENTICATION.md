# STEP 04 — MULTIPLAYER AUTHENTICATION & TICKET PROTOCOL SPECIFICATION
**Document Version:** 1.0.0-AUTH  
**Stage:** Step 4 (Multiplayer Authentication & Token Exchange)  
**Date:** November 10, 2026  
**Security Architect:** Application Security Engineer, Principal Software Architect  
**Target Repository:** `d:\FR` (Paths: `src/app/api/arena/auth/ticket/route.ts`, `services/multiplayer/src/authentication/ticketValidator.ts`)  

---

## 1. Authentication Architecture & Protocol Flow

Direct browser-to-Colyseus connections without prior authorization represent a catastrophic security risk. Students could flood rooms, spoof opponent ratings, and manipulate IDs.

To achieve bank-grade zero-trust authentication, the platform uses a **Two-Phase Ticket Exchange Protocol**:

```mermaid
sequenceDiagram
    autonumber
    actor Student as Student Browser
    participant Web as Next.js Control Plane (/api/arena/auth/ticket)
    participant Auth as Supabase Auth (JWT Verification)
    participant DB as Supabase PostgreSQL (Profiles & Rooms)
    participant Game as Colyseus Multiplayer Server (Port 2567)

    Student->>Web: POST /api/arena/auth/ticket { matchId, gameMode } + Cookie Session
    Web->>Auth: supabase.auth.getUser()
    Auth-->>Web: Verified Student User Record (user.id)
    Web->>DB: Query user_profiles (rating, name) & battle_rooms (roster check)
    DB-->>Web: Authoritative Profile & Room Membership
    Web->>Web: Generate Random Nonce & Sign HMAC-SHA256 Ticket (TTL 60s)
    Web-->>Student: 200 OK { ticket, wsEndpoint, expiresInSeconds: 60 }

    Student->>Game: WebSocket Connect (Ticket passed in Handshake Auth Payload)
    Note over Game: static onAuth(token, options)
    Game->>Game: 1. Verify HMAC-SHA256 Signature using MULTIPLAYER_SECRET_KEY
    Game->>Game: 2. Check Expiration (exp > now)
    Game->>Game: 3. Verify Nonce is unused; consume nonce into anti-replay store
    Game->>Game: 4. Assert matchId matches ticket claims
    alt Invalid Signature / Expired / Nonce Reused
        Game-->>Student: 401 Unauthorized / WebSocket Closed
    else Authentication Succeeded
        Game-->>Student: Connection Accepted & Room Joined
    end
```

---

## 2. Ticket Specification & Claims Schema

The access ticket is an HMAC-SHA256 JSON Web Token with a maximum Time-To-Live of **60 seconds**.

### Cryptographic Claims Schema:
```typescript
export interface MultiplayerTicketPayload {
  sub: string;           // Canonical student UUID (auth.uid)
  userId: string;        // Compatibility mirror of student UUID
  email: string;         // Student email address
  fullName: string;      // Verified display name from user_profiles
  rating: number;        // Authoritative Elo rating from user_profiles
  gameMode: string;      // 'ranked_1v1' | 'unranked_1v1' | 'custom_room' | 'quiz_battle'
  matchId?: string;      // UUID of the authorized room (if joining an existing match)
  roomCode?: string;     // Friendly 6-character room code or matchId
  scope: 'arena:join';   // Restricted scope
  roomType: 'quiz_battle';// Allowed room definition
  nonce: string;         // Single-use cryptographically random token (e.g. 'tic_1731234567_abc123')
  iat: number;           // Unix epoch timestamp of issuance (seconds)
  exp: number;           // Unix epoch timestamp of expiration (seconds, iat + 60)
}
```

---

## 3. Defense-in-Depth Security Controls

### A. Strict Anti-Replay Protection via Nonce Tracking
Every ticket contains a cryptographically random nonce generated via `crypto.randomBytes(8)`. 
Upon receipt in `ticketValidator.ts`:
1. The server queries an in-memory map of consumed nonces (`consumedNonces: Map<string, number>`).
2. If the nonce is already present, the request is immediately rejected with `code: 'REPLAY_DETECTED'`.
3. If fresh, the nonce is registered with its expiration timestamp.
4. An automated cleaner thread sweeps expired nonces, bounding memory consumption.

### B. Prevention of Token Exposure in URLs
In compliance with strict security requirements, **tickets are never transmitted via query strings** (e.g., `ws://...?token=...`). Tickets are exclusively supplied via:
- Colyseus client connection options: `client.joinOrCreate('quiz_battle', { matchId }, ticket)`.
- Handshake `auth` payload over the encrypted WebSocket tunnel.

### C. Administrator Impersonation Guard
The ticket endpoint enforces integration with `impersonationGuard.ts`. If an administrator is browsing in "Ghost Mode" (viewing the platform as a student for support), they are blocked from requesting multiplayer battle tickets with error `403 Forbidden: Cannot perform competitive battles while in impersonation mode`.

### D. Zero-Trust User Derivation
The ticket issuer **never** accepts a client-provided `userId` in the HTTP request body. The user identity is extracted strictly from the encrypted, signed Supabase authentication session cookie via `supabase.auth.getUser()`.

---

## 4. Verification & Audit Results

The ticket authentication subsystem is fully covered by automated unit and security tests in [`services/multiplayer/tests/authentication.test.ts`](file:///d:/FR/services/multiplayer/tests/authentication.test.ts):

| Test Scenario | Implementation | Test Result |
| :--- | :--- | :---: |
| **Valid Ticket Authentication** | Signs token with valid claims and submits. | **PASSED** (Validates student identity and rating) |
| **Tampered Signature Rejection** | Modifies payload or alters secret key. | **PASSED** (Returns `INVALID_TOKEN`) |
| **Expired Ticket Rejection** | Submits token where `exp <= nowSec`. | **PASSED** (Returns `EXPIRED_TICKET`) |
| **Replay Attack Neutralization** | Submits the identical ticket twice. | **PASSED** (Second attempt returns `REPLAY_DETECTED`) |
| **Malformed Payload Handling** | Passes missing `nonce` or invalid `gameMode`. | **PASSED** (Returns `MALFORMED_PAYLOAD`) |
| **Cross-Match Token Theft** | Submits ticket scoped to match A for match B. | **PASSED** (Rejected during room `onAuth`) |
