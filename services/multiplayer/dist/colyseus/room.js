"use strict";
/**
 * Samyak Multiplayer Service — Colyseus Room & Client Architecture
 * Implements the official Colyseus Room lifecycle contracts and Netcode state pattern.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Room = exports.Clock = void 0;
const events_1 = require("events");
class Clock {
    intervals = [];
    timeouts = [];
    setInterval(handler, ms) {
        const handle = setInterval(handler, ms);
        this.intervals.push(handle);
        return handle;
    }
    setTimeout(handler, ms) {
        const handle = setTimeout(handler, ms);
        this.timeouts.push(handle);
        return handle;
    }
    clearInterval(handle) {
        clearInterval(handle);
        this.intervals = this.intervals.filter((h) => h !== handle);
    }
    clearTimeout(handle) {
        clearTimeout(handle);
        this.timeouts = this.timeouts.filter((h) => h !== handle);
    }
    clear() {
        this.intervals.forEach(clearInterval);
        this.timeouts.forEach(clearTimeout);
        this.intervals = [];
        this.timeouts = [];
    }
}
exports.Clock = Clock;
class Room extends events_1.EventEmitter {
    roomId = '';
    roomName = '';
    maxClients = 2;
    clients = [];
    state = {};
    clock = new Clock();
    autoDispose = true;
    isDisposed = false;
    messageHandlers = new Map();
    reconnectionWaiters = new Map();
    constructor() {
        super();
    }
    /**
     * Sets the authoritative state for this room.
     */
    setState(newState) {
        this.state = newState;
    }
    /**
     * Registers a handler for a client message type.
     */
    onMessage(type, handler) {
        this.messageHandlers.set(type, handler);
    }
    /**
     * Dispatches an incoming message from a client to its registered handler.
     */
    dispatchMessage(client, type, message) {
        const handler = this.messageHandlers.get(type);
        if (handler) {
            handler(client, message);
        }
    }
    /**
     * Sends a message to a specific client.
     */
    send(client, type, message) {
        client.send(type, message);
    }
    /**
     * Broadcasts a message to all connected clients in the room.
     */
    broadcast(type, message, options) {
        for (const client of this.clients) {
            if (options?.except && client.sessionId === options.except.sessionId) {
                continue;
            }
            client.send(type, message);
        }
    }
    /**
     * Implements Colyseus reconnect grace period.
     * Keeps room paused/waiting for disconnected client to re-establish session.
     */
    async allowReconnection(previousClient, seconds = 15) {
        return new Promise((resolve, reject) => {
            const timeoutHandle = setTimeout(() => {
                this.reconnectionWaiters.delete(previousClient.sessionId);
                reject(new Error(`Reconnection timeout of ${seconds}s exceeded for session ${previousClient.sessionId}`));
            }, seconds * 1000);
            this.reconnectionWaiters.set(previousClient.sessionId, {
                resolve,
                reject,
                timeoutHandle,
            });
        });
    }
    /**
     * Fulfills an active reconnection request if a waiter is present.
     */
    handleClientReconnect(sessionId, newClient) {
        const waiter = this.reconnectionWaiters.get(sessionId);
        if (waiter) {
            clearTimeout(waiter.timeoutHandle);
            this.reconnectionWaiters.delete(sessionId);
            newClient.auth = waiter;
            this.clients.push(newClient);
            waiter.resolve(newClient);
            return true;
        }
        return false;
    }
    /**
     * Cleans up room resources.
     */
    async disconnect() {
        if (this.isDisposed)
            return;
        this.isDisposed = true;
        this.clock.clear();
        for (const waiter of this.reconnectionWaiters.values()) {
            clearTimeout(waiter.timeoutHandle);
            waiter.reject(new Error('Room closed'));
        }
        this.reconnectionWaiters.clear();
        if (this.onDispose) {
            await this.onDispose();
        }
        this.emit('dispose');
    }
}
exports.Room = Room;
