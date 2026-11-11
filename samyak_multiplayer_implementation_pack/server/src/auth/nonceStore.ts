import Redis from "ioredis";

export interface OneTimeNonceStore {
  consume(nonce: string, ttlSeconds: number): Promise<boolean>;
}

/**
 * Shared, atomic one-time ticket nonce store.
 * Use the same Redis deployment for every Colyseus process.
 */
export class RedisNonceStore implements OneTimeNonceStore {
  constructor(private readonly redis: Redis) {}

  async consume(nonce: string, ttlSeconds: number): Promise<boolean> {
    if (!/^[A-Za-z0-9_-]{24,128}$/.test(nonce)) return false;
    const result = await this.redis.set(
      `arena:ticket:nonce:${nonce}`,
      "used",
      "EX",
      ttlSeconds,
      "NX",
    );
    return result === "OK";
  }
}

/** Test-only store for a single-process local test. Do not use in production. */
export class InMemoryNonceStore implements OneTimeNonceStore {
  private readonly used = new Map<string, number>();

  async consume(nonce: string, ttlSeconds: number): Promise<boolean> {
    const now = Date.now();
    for (const [key, expiresAt] of this.used) {
      if (expiresAt <= now) this.used.delete(key);
    }
    if (this.used.has(nonce)) return false;
    this.used.set(nonce, now + ttlSeconds * 1000);
    return true;
  }
}

let configuredNonceStore: OneTimeNonceStore | null = null;

export function configureNonceStore(store: OneTimeNonceStore): void {
  configuredNonceStore = store;
}

export async function consumeTicketNonce(nonce: string, ttlSeconds: number): Promise<boolean> {
  if (!configuredNonceStore) {
    throw new Error("Ticket nonce store has not been configured");
  }
  return configuredNonceStore.consume(nonce, ttlSeconds);
}
