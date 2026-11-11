/**
 * Samyak Multiplayer Service — Colyseus Game Server Host & Transport
 * Mounts WebSocket connection upgrades, defines room types, and serves health endpoints.
 */

import http from 'http';
import { parse as parseUrl } from 'url';
import { Room } from './room';
import { metricsCollector } from '../monitoring/metrics';

export interface RoomConstructor<T extends Room = Room> {
  new (): T;
}

export class GameServer {
  private rooms: Map<string, Room> = new Map();
  private roomDefinitions: Map<string, RoomConstructor> = new Map();
  private httpServer: http.Server;

  constructor(server?: http.Server) {
    this.httpServer = server || http.createServer((req, res) => this.handleHttpRequest(req, res));
  }

  /**
   * Registers a room type with the game server.
   */
  define(name: string, roomClass: RoomConstructor): void {
    this.roomDefinitions.set(name, roomClass);
  }

  /**
   * Spawns a new instance of a defined room type.
   */
  async createRoom<T extends Room = Room>(name: string, options: any = {}): Promise<T> {
    const RoomClass = this.roomDefinitions.get(name);
    if (!RoomClass) {
      throw new Error(`Room type "${name}" is not registered on the GameServer.`);
    }

    const room = new RoomClass() as T;
    room.roomId = options.roomId || `room_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    room.roomName = name;

    if (room.onCreate) {
      await room.onCreate(options);
    }

    this.rooms.set(room.roomId, room);
    metricsCollector.incrementRooms();

    room.on('dispose', () => {
      this.rooms.delete(room.roomId);
      metricsCollector.decrementRooms();
      metricsCollector.recordMatchCompleted();
    });

    return room;
  }

  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  getActiveRoomsCount(): number {
    return this.rooms.size;
  }

  /**
   * HTTP Router for Health Checks and Telemetry
   */
  private handleHttpRequest(req: http.IncomingMessage, res: http.ServerResponse): void {
    const parsed = parseUrl(req.url || '/', true);

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
      res.end(JSON.stringify(metricsCollector.getSnapshot(), null, 2));
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

  listen(port: number, host: string = '0.0.0.0', callback?: () => void): http.Server {
    return this.httpServer.listen(port, host, callback);
  }

  async close(): Promise<void> {
    for (const room of this.rooms.values()) {
      await room.disconnect();
    }
    this.rooms.clear();

    return new Promise((resolve) => {
      this.httpServer.close(() => resolve());
    });
  }
}
