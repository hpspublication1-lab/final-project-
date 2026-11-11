import jwt, { type JwtPayload } from "jsonwebtoken";
import { z } from "zod";

const TicketClaimsSchema = z.object({
  sub: z.string().uuid(),
  matchId: z.string().uuid(),
  scope: z.literal("arena:join"),
  roomType: z.literal("quiz_battle"),
  nonce: z.string().min(24).max(128),
  iat: z.number().int().positive(),
  exp: z.number().int().positive(),
  iss: z.string().url(),
  aud: z.string().min(1),
});

export type ArenaTicketClaims = z.infer<typeof TicketClaimsSchema>;

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export function verifyArenaTicket(token: string): ArenaTicketClaims {
  const secret = requiredEnv("ARENA_TICKET_SECRET");
  if (Buffer.byteLength(secret, "utf8") < 32) {
    throw new Error("ARENA_TICKET_SECRET must contain at least 32 bytes");
  }

  const decoded = jwt.verify(token, secret, {
    algorithms: ["HS256"],
    issuer: requiredEnv("ARENA_TICKET_ISSUER"),
    audience: requiredEnv("ARENA_TICKET_AUDIENCE"),
    clockTolerance: 5,
  }) as JwtPayload;

  const parsed = TicketClaimsSchema.safeParse(decoded);
  if (!parsed.success) throw new Error("Invalid arena ticket claims");

  const maxTtl = Number(process.env.ARENA_TICKET_TTL_SECONDS ?? 60);
  const ttl = parsed.data.exp - parsed.data.iat;
  if (!Number.isFinite(maxTtl) || ttl <= 0 || ttl > maxTtl) {
    throw new Error("Arena ticket lifetime is invalid");
  }

  return parsed.data;
}
