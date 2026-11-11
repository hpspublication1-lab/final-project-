/** Call at process boot before accepting traffic. */
export function assertProductionConfiguration(): void {
  if (process.env.NODE_ENV !== "production") return;

  const required = [
    "ARENA_TICKET_SECRET",
    "ARENA_TICKET_ISSUER",
    "ARENA_TICKET_AUDIENCE",
    "REDIS_URL",
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
  ];
  const missing = required.filter((name) => !process.env[name]);
  if (missing.length) {
    throw new Error(`Missing required production variables: ${missing.join(", ")}`);
  }
  if (Buffer.byteLength(process.env.ARENA_TICKET_SECRET ?? "", "utf8") < 32) {
    throw new Error("ARENA_TICKET_SECRET must be at least 32 bytes");
  }
}
