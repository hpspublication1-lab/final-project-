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

export class Clock {
  private intervals: NodeJS.Timeout[] = [];
  private timeouts: NodeJS.Timeout[] = [];

  setInterval(handler: () => void, ms: number): NodeJS.Timeout {
    const handle = setInterval(handler, ms);
    this.intervals.push(handle);
    return handle;
  }

  setTimeout(handler: () => void, ms: number): NodeJS.Timeout {
    const handle = setTimeout(handler, ms);
    this.timeouts.push(handle);
    return handle;
  }

  clearInterval(handle: NodeJS.Timeout): void {
    clearInterval(handle);
    this.intervals = this.intervals.filter((h) => h !== handle);
  }

  clearTimeout(handle: NodeJS.Timeout): void {
    clearTimeout(handle);
    this.timeouts = this.timeouts.filter((h) => h !== handle);
  }

  clear(): void {
    this.intervals.forEach(clearInterval);
    this.timeouts.forEach(clearTimeout);
    this.intervals = [];
    this.timeouts = [];
  }
}

export abstract class Room<State = any> extends EventEmitter {
  public roomId: string = '';
  public roomName: string = '';
  public maxClients: number = 2;
  public clients: Client[] = [];
  public state: State = {} as State;
  public clock: Clock = new Clock();
  public autoDispose: boolean = true;
  protected isDisposed: boolean = false;

  private messageHandlers: Map<string, (client: Client, message: any) => void> = new Map();
  private reconnectionWaiters: Map<string, {
    resolve: (client: Client) => void;
    reject: (err: any) => void;
    timeoutHandle: NodeJS.Timeout;
  }> = new Map();

  constructor() {
    super();
  }

  /**
   * Sets the authoritative state for this room.
   */
  setState(newState: State): void {
    this.state = newState;
  }

  /**
   * Registers a handler for a client message type.
   */
  onMessage<T = any>(type: string, handler: (client: Client, message: T) => void): void {
    this.messageHandlers.set(type, handler);
  }

  /**
   * Dispatches an incoming message from a client to its registered handler.
   */
  dispatchMessage(client: Client, type: string, message: any): void {
    const handler = this.messageHandlers.get(type);
    if (handler) {
      handler(client, message);
    }
  }

  /**
   * Sends a message to a specific client.
   */
  send(client: Client, type: string, message?: any): void {
    client.send(type, message);
  }

  /**
   * Broadcasts a message to all connected clients in the room.
   */
  broadcast(type: string, message?: any, options?: { except?: Client }): void {
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
  async allowReconnection(previousClient: Client, seconds: number = 15): Promise<Client> {
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
  handleClientReconnect(sessionId: string, newClient: Client): boolean {
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
  async disconnect(): Promise<void> {
    if (this.isDisposed) return;
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
