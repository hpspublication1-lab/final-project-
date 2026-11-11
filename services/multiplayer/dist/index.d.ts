/**
 * Samyak Multiplayer Service — Main Daemon Entry Point
 * Starts the Colyseus game server, registers room definitions, and binds signal handlers.
 */
import { GameServer } from './colyseus/server';
export declare function createMultiplayerServer(): GameServer;
export declare function startServer(): GameServer;
