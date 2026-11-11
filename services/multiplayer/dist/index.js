"use strict";
/**
 * Samyak Multiplayer Service — Main Daemon Entry Point
 * Starts the Colyseus game server, registers room definitions, and binds signal handlers.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMultiplayerServer = createMultiplayerServer;
exports.startServer = startServer;
const server_1 = require("./colyseus/server");
const QuizBattleRoom_1 = require("./rooms/QuizBattleRoom");
const environment_1 = require("./config/environment");
function createMultiplayerServer() {
    const gameServer = new server_1.GameServer();
    // Register the Authoritative 1v1 Quiz Battle Room
    gameServer.define('quiz_battle', QuizBattleRoom_1.QuizBattleRoom);
    return gameServer;
}
function startServer() {
    const server = createMultiplayerServer();
    server.listen(environment_1.config.port, environment_1.config.host, () => {
        console.info(`
🎮 ========================================================
   SAMYAK CEE — COLYSEUS MULTIPLAYER SERVER (STAGING)
   Listening on http://${environment_1.config.host}:${environment_1.config.port}
   Environment: ${environment_1.config.env}
   Max Reconnect Grace: ${environment_1.config.reconnectGraceSeconds}s
   Question Time Limit: ${environment_1.config.questionTimeLimitSeconds}s
   Health Check: http://${environment_1.config.host}:${environment_1.config.port}/health
======================================================== 🎮
    `);
    });
    // Graceful shutdown handling
    const shutdown = async (signal) => {
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
