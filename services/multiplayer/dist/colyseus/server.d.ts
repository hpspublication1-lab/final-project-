/**
 * Samyak Multiplayer Service — Colyseus Game Server Host & Transport
 * Mounts WebSocket connection upgrades, defines room types, and serves health endpoints.
 */
import http from 'http';
import { Room } from './room';
export interface RoomConstructor<T extends Room = Room> {
    new (): T;
}
export declare class GameServer {
    private rooms;
    private roomDefinitions;
    private httpServer;
    constructor(server?: http.Server);
    /**
     * Registers a room type with the game server.
     */
    define(name: string, roomClass: RoomConstructor): void;
    /**
     * Spawns a new instance of a defined room type.
     */
    createRoom<T extends Room = Room>(name: string, options?: any): Promise<T>;
    getRoom(roomId: string): Room | undefined;
    getActiveRoomsCount(): number;
    /**
     * HTTP Router for Health Checks and Telemetry
     */
    private handleHttpRequest;
    listen(port: number, host?: string, callback?: () => void): http.Server;
    close(): Promise<void>;
}
