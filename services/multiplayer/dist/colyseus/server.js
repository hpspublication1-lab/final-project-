"use strict";
/**
 * Samyak Multiplayer Service — Colyseus Game Server Host & Transport
 * Mounts WebSocket connection upgrades, defines room types, and serves health endpoints.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameServer = void 0;
const http_1 = __importDefault(require("http"));
const url_1 = require("url");
const metrics_1 = require("../monitoring/metrics");
class GameServer {
    rooms = new Map();
    roomDefinitions = new Map();
    httpServer;
    constructor(server) {
        this.httpServer = server || http_1.default.createServer((req, res) => this.handleHttpRequest(req, res));
    }
    /**
     * Registers a room type with the game server.
     */
    define(name, roomClass) {
        this.roomDefinitions.set(name, roomClass);
    }
    /**
     * Spawns a new instance of a defined room type.
     */
    async createRoom(name, options = {}) {
        const RoomClass = this.roomDefinitions.get(name);
        if (!RoomClass) {
            throw new Error(`Room type "${name}" is not registered on the GameServer.`);
        }
        const room = new RoomClass();
        room.roomId = options.roomId || `room_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        room.roomName = name;
        if (room.onCreate) {
            await room.onCreate(options);
        }
        this.rooms.set(room.roomId, room);
        metrics_1.metricsCollector.incrementRooms();
        room.on('dispose', () => {
            this.rooms.delete(room.roomId);
            metrics_1.metricsCollector.decrementRooms();
            metrics_1.metricsCollector.recordMatchCompleted();
        });
        return room;
    }
    getRoom(roomId) {
        return this.rooms.get(roomId);
    }
    getActiveRoomsCount() {
        return this.rooms.size;
    }
    /**
     * HTTP Router for Health Checks and Telemetry
     */
    handleHttpRequest(req, res) {
        const parsed = (0, url_1.parse)(req.url || '/', true);
        // CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        if (req.method === 'OPTIONS') {
            res.writeHead(204);
            res.end();
            return;
        }
        if (parsed.pathname === '/health' || parsed.pathname === '/metrics') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(metrics_1.metricsCollector.getSnapshot(), null, 2));
            return;
        }
        if (parsed.pathname === '/') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                service: 'Samyak CEE Authoritative Multiplayer Service',
                status: 'online',
                roomsDefined: Array.from(this.roomDefinitions.keys()),
                activeRooms: this.rooms.size,
            }));
            return;
        }
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Endpoint not found' }));
    }
    listen(port, host = '0.0.0.0', callback) {
        return this.httpServer.listen(port, host, callback);
    }
    async close() {
        for (const room of this.rooms.values()) {
            await room.disconnect();
        }
        this.rooms.clear();
        return new Promise((resolve) => {
            this.httpServer.close(() => resolve());
        });
    }
}
exports.GameServer = GameServer;
