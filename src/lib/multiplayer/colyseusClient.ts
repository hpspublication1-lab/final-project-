'use client';

/**
 * Samyak CEE Mastery — Client-Side Multiplayer WebSocket Netcode
 * Lightweight, zero-dependency browser client for connecting to the Colyseus game daemon.
 */

export interface MultiplayerMessage<T = any> {
  type: string;
  data?: T;
  [key: string]: any;
}

export interface JoinBattleOptions {
  gameMode?: string;
  roomCode?: string;
  matchId?: string;
}

export interface MultiplayerConnectionHandlers {
  onOpen?: () => void;
  onClose?: (code: number, reason: string) => void;
  onError?: (error: any) => void;
  onCountdownTick?: (secondsRemaining: number) => void;
  onQuestionActive?: (question: any) => void;
  onOpponentAnswered?: (data: { opponentId: string; answered: boolean }) => void;
  onRoundSummary?: (summary: any) => void;
  onMatchEnded?: (results: any) => void;
  onWebRtcSignal?: (signal: { type: string; data: any; senderSessionId: string }) => void;
}

export class ColyseusMultiplayerClient {
  private ws: WebSocket | null = null;
  private wsUrl: string;
  private ticket: string | null = null;
  private handlers: MultiplayerConnectionHandlers = {};
  private isConnected: boolean = false;
  private pingInterval: any = null;

  constructor(customWsUrl?: string) {
    this.wsUrl =
      customWsUrl ||
      process.env.NEXT_PUBLIC_MULTIPLAYER_WS_URL ||
      'ws://localhost:2567';
  }

  /**
   * Acquires a signed HMAC-SHA256 access ticket and joins the authoritative quiz battle room.
   */
  async joinBattle(
    options: JoinBattleOptions = {},
    handlers: MultiplayerConnectionHandlers = {}
  ): Promise<boolean> {
    this.handlers = handlers;

    try {
      // 1. Acquire Ticket from Next.js Control Plane
      const ticketRes = await fetch('/api/arena/auth/ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
      });

      if (!ticketRes.ok) {
        throw new Error(`Failed to acquire multiplayer ticket: HTTP ${ticketRes.status}`);
      }

      const ticketData = await ticketRes.json();
      if (!ticketData.ticket) {
        throw new Error(ticketData.error || 'Invalid ticket response from server');
      }

      this.ticket = ticketData.ticket;
      const targetEndpoint = ticketData.wsEndpoint || this.wsUrl;

      // 2. Connect WebSocket
      const wsProtocol = targetEndpoint.startsWith('https://')
        ? targetEndpoint.replace('https://', 'wss://')
        : targetEndpoint.startsWith('http://')
        ? targetEndpoint.replace('http://', 'ws://')
        : targetEndpoint;

      this.ws = new WebSocket(wsProtocol);

      this.ws.onopen = () => {
        this.isConnected = true;
        // Authenticate with server using the signed ticket
        this.send('onAuth', { ticket: this.ticket, roomCode: options.roomCode });
        this.handlers.onOpen?.();

        // Keepalive heartbeat every 15s
        this.pingInterval = setInterval(() => {
          this.send('PING', { clientTime: Date.now() });
        }, 15000);
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          this.handleServerMessage(msg);
        } catch {
          // Non-JSON packet
        }
      };

      this.ws.onclose = (event) => {
        this.isConnected = false;
        clearInterval(this.pingInterval);
        this.handlers.onClose?.(event.code, event.reason);
      };

      this.ws.onerror = (err) => {
        this.handlers.onError?.(err);
      };

      return true;
    } catch (err) {
      this.handlers.onError?.(err);
      return false;
    }
  }

  /**
   * Internal message dispatcher
   */
  private handleServerMessage(msg: MultiplayerMessage): void {
    const { type, data } = msg;

    switch (type) {
      case 'countdownTick':
        this.handlers.onCountdownTick?.(data?.secondsRemaining ?? 0);
        break;
      case 'question_active':
      case 'questionActive':
        this.handlers.onQuestionActive?.(data);
        break;
      case 'opponent_answered':
      case 'opponentAnswered':
        this.handlers.onOpponentAnswered?.(data);
        break;
      case 'round_summary':
      case 'roundSummary':
        this.handlers.onRoundSummary?.(data);
        break;
      case 'matchEnded':
      case 'match_ended':
        this.handlers.onMatchEnded?.(data);
        break;
      case 'WEBRTC_SIGNAL':
        this.handlers.onWebRtcSignal?.(data || msg);
        break;
    }
  }

  /**
   * Submits an answer choice for the active question.
   */
  submitOption(questionId: string, optionId: string): void {
    this.send('SUBMIT_OPTION', { questionId, optionId });
  }

  /**
   * Relays a WebRTC peer-to-peer signaling payload.
   */
  sendWebRtcSignal(type: 'offer' | 'answer' | 'ice-candidate', data: any): void {
    this.send('WEBRTC_SIGNAL', { type, data });
  }

  /**
   * Dispatches a message packet to the server.
   */
  private send(type: string, data?: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, data }));
    }
  }

  /**
   * Disconnects and cleans up timers.
   */
  disconnect(): void {
    clearInterval(this.pingInterval);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
  }
}

export const multiplayerClient = new ColyseusMultiplayerClient();
