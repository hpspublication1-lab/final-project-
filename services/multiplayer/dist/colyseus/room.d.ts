/**
 * Samyak Multiplayer Service — Colyseus Room & Client Architecture
 * Implements the official Colyseus Room lifecycle contracts and Netcode state pattern.
 */
import { EventEmitter } from 'events';
export interface Client {
    sessionId: string;
    auth?: any;
    readyState?: number;
    send: (type: string | number, message?: any) => void;
    close: (code?: number, data?: string) => void;
}
export declare class Clock {
    private intervals;
    private timeouts;
    setInterval(handler: () => void, ms: number): NodeJS.Timeout;
    setTimeout(handler: () => void, ms: number): NodeJS.Timeout;
    clearInterval(handle: NodeJS.Timeout): void;
    clearTimeout(handle: NodeJS.Timeout): void;
    clear(): void;
}
export declare abstract class Room<State = any> extends EventEmitter {
    roomId: string;
    roomName: string;
    maxClients: number;
    clients: Client[];
    state: State;
    clock: Clock;
    autoDispose: boolean;
    protected isDisposed: boolean;
    private messageHandlers;
    private reconnectionWaiters;
    constructor();
    /**
     * Sets the authoritative state for this room.
     */
    setState(newState: State): void;
    /**
     * Registers a handler for a client message type.
     */
    onMessage<T = any>(type: string, handler: (client: Client, message: T) => void): void;
    /**
     * Dispatches an incoming message from a client to its registered handler.
     */
    dispatchMessage(client: Client, type: string, message: any): void;
    /**
     * Sends a message to a specific client.
     */
    send(client: Client, type: string, message?: any): void;
    /**
     * Broadcasts a message to all connected clients in the room.
     */
    broadcast(type: string, message?: any, options?: {
        except?: Client;
    }): void;
    /**
     * Implements Colyseus reconnect grace period.
     * Keeps room paused/waiting for disconnected client to re-establish session.
     */
    allowReconnection(previousClient: Client, seconds?: number): Promise<Client>;
    /**
     * Fulfills an active reconnection request if a waiter is present.
     */
    handleClientReconnect(sessionId: string, newClient: Client): boolean;
    /**
     * Lifecycle Hooks to be implemented by Room subclasses.
     */
    onCreate?(options: any): void | Promise<void>;
    onAuth?(client: Client, options: any, request?: any): boolean | Promise<boolean> | any;
    onJoin?(client: Client, options?: any, auth?: any): void | Promise<void>;
    onLeave?(client: Client, consented?: boolean): void | Promise<void>;
    onDispose?(): void | Promise<void>;
    /**
     * Cleans up room resources.
     */
    disconnect(): Promise<void>;
}
