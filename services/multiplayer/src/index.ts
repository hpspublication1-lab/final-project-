/**
 * Samyak Multiplayer Service — Main Daemon Entry Point
 * Starts the Colyseus game server, registers room definitions, and binds signal handlers.
 */

import { GameServer } from './colyseus/server';
import { QuizBattleRoom } from './rooms/QuizBattleRoom';
import { config } from './config/environment';

export function createMultiplayerServer(): GameServer {
  const gameServer = new GameServer();

  // Register the Authoritative 1v1 Quiz Battle Room
  gameServer.define('quiz_battle', QuizBattleRoom);

  return gameServer;
}

export function startServer(): GameServer {
  const server = createMultiplayerServer();

  server.listen(config.port, config.host, () => {
    console.info(`
🎮 ========================================================
   SAMYAK CEE — COLYSEUS MULTIPLAYER SERVER (STAGING)
   Listening on http://${config.host}:${config.port}
   Environment: ${config.env}
   Max Reconnect Grace: ${config.reconnectGraceSeconds}s
   Question Time Limit: ${config.questionTimeLimitSeconds}s
   Health Check: http://${config.host}:${config.port}/health
======================================================== 🎮
    `);
  });

  // Graceful shutdown handling
  const shutdown = async (signal: string) => {
    console.info(`[Multiplayer] Received ${signal}. Draining active rooms and shutting down...`);
    await server.close();
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  return server;
}

// Auto-start when executed directly
if (typeof require !== 'undefined' && require.main === module) {
  startServer();
}
