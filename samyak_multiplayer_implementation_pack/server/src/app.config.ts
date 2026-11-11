import { defineRoom, defineServer } from "colyseus";
import { RedisPresence } from "@colyseus/redis-presence";
import { RedisDriver } from "@colyseus/redis-driver";
import Redis from "ioredis";
import { QuizBattleRoom, isArenaRepositoryConfigured } from "./rooms/QuizBattleRoom.js";
import { configureNonceStore, InMemoryNonceStore, RedisNonceStore } from "./auth/nonceStore.js";
import { assertProductionConfiguration } from "./config/production-checks.js";

assertProductionConfiguration();
if (process.env.NODE_ENV === "production" && !isArenaRepositoryConfigured()) {
  throw new Error("Configure the real Samyak ArenaRepository before production startup");
}

const redisUrl = process.env.REDIS_URL;
if (process.env.NODE_ENV === "production" && !redisUrl) {
  throw new Error("REDIS_URL is required in production for shared nonce protection");
}

const nonceRedis = redisUrl ? new Redis(redisUrl, { maxRetriesPerRequest: 2 }) : null;
configureNonceStore(nonceRedis ? new RedisNonceStore(nonceRedis) : new InMemoryNonceStore());

const distributedConfig = redisUrl
  ? {
      presence: new RedisPresence(redisUrl),
      driver: new RedisDriver(redisUrl),
    }
  : {};

// TODO: Before production, import your real Supabase repository adapter and call
// configureArenaRepository(adapter) before defineServer(). The default adapter fails closed.

const server = defineServer({
  ...distributedConfig,
  rooms: {
    quiz_battle: defineRoom(QuizBattleRoom).filterBy(["matchId"]),
  },
  express: (app) => {
    app.get("/healthz", (_req, res) => {
      res.status(200).json({ status: "ok", service: "samyak-multiplayer" });
    });
  },
});

const port = Number(process.env.PORT ?? 2567);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be a valid TCP port");
}

server.listen(port);

export default server;
