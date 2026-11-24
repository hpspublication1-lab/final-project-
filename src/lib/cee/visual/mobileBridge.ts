/**
 * Samyak Guru — CEE Visual Intelligence
 * Mobile Bridge Protocol Adapter (FND-010)
 * Specification: 06_VISUAL_PLAYER_AND_MOBILE.md
 * Safe, versioned, bidirectional communication between Web player and Flutter/PWA shell.
 */

import { z } from 'zod';

export const BridgeMessageTypeSchema = z.enum([
  'PLAYER_READY',
  'STRUCTURE_SELECTED',
  'SEQUENCE_COMPLETED',
  'PROGRESS_UPDATED',
  'PLAYER_ERROR',
  'APP_PAUSE',
  'APP_RESUME',
  'REQUEST_FULLSCREEN',
  'EXIT_FULLSCREEN',
]);

export type BridgeMessageType = z.infer<typeof BridgeMessageTypeSchema>;

export const BridgeMessageSchema = z.object({
  protocolVersion: z.literal(1),
  messageId: z.string().min(1, 'Message ID required for deduplication'),
  timestamp: z.string().datetime().optional(),
  type: BridgeMessageTypeSchema,
  lessonId: z.string().min(1, 'Lesson ID required for contextual safety'),
  payload: z.record(z.string(), z.unknown()).default({}),
});

export type BridgeMessage = z.infer<typeof BridgeMessageSchema>;

export interface MobileBridgeOptions {
  lessonId: string;
  allowedOrigins?: string[];
  onMessage?: (message: BridgeMessage) => void;
  onError?: (error: Error) => void;
}

export class MobileBridgeAdapter {
  private lessonId: string;
  private allowedOrigins: string[];
  private processedMessageIds: Set<string> = new Set();
  private onMessageCallback?: (message: BridgeMessage) => void;
  private onErrorCallback?: (error: Error) => void;
  private isDestroyed = false;

  constructor(options: MobileBridgeOptions) {
    this.lessonId = options.lessonId;
    this.allowedOrigins = options.allowedOrigins || [
      'https://samyakcee.com',
      'http://localhost:4028',
      'http://127.0.0.1:4028',
    ];
    this.onMessageCallback = options.onMessage;
    this.onErrorCallback = options.onError;

    if (typeof window !== 'undefined') {
      window.addEventListener('message', this.handleWindowMessage);
    }
  }

  /**
   * Handle incoming postMessage from Flutter WebView / Parent Window
   */
  private handleWindowMessage = (event: MessageEvent) => {
    if (this.isDestroyed) return;

    // Origin Security Gate (allow localhost in dev or matching domain in prod)
    const isOriginAllowed =
      event.origin === '' || // Flutter WebView often sets empty string for local file/asset roots
      this.allowedOrigins.some(
        (allowed) => event.origin === allowed || event.origin.endsWith(`.${allowed}`)
      );

    if (!isOriginAllowed) {
      return;
    }

    try {
      const rawData = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      if (!rawData || typeof rawData !== 'object') return;

      const parseResult = BridgeMessageSchema.safeParse(rawData);
      if (!parseResult.success) {
        return; // Ignore non-bridge messages silently
      }

      const message = parseResult.data;

      // Context Isolation: reject messages for mismatched lesson IDs
      if (message.lessonId !== this.lessonId) {
        return;
      }

      // Deduplication: prevent replay attacks or duplicate execution
      if (this.processedMessageIds.has(message.messageId)) {
        return;
      }
      this.processedMessageIds.add(message.messageId);

      // Keep cache bounded
      if (this.processedMessageIds.size > 1000) {
        const first = this.processedMessageIds.values().next().value;
        if (first) this.processedMessageIds.delete(first);
      }

      if (this.onMessageCallback) {
        this.onMessageCallback(message);
      }
    } catch (err: unknown) {
      if (this.onErrorCallback) {
        this.onErrorCallback(err instanceof Error ? err : new Error(String(err)));
      }
    }
  };

  /**
   * Send a validated, typed message to the mobile host (Flutter JavaScriptChannel or postMessage)
   */
  public postToHost(
    type: BridgeMessageType,
    payload: Record<string, unknown> = {}
  ): { success: boolean; messageId: string } {
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const message: BridgeMessage = {
      protocolVersion: 1,
      messageId,
      timestamp: new Date().toISOString(),
      type,
      lessonId: this.lessonId,
      payload,
    };

    if (typeof window === 'undefined') {
      return { success: false, messageId };
    }

    try {
      // 1. Flutter inAppWebView JavaScriptHandler
      const flutterBridge = (window as unknown as { flutter_inappwebview?: { callHandler: (name: string, ...args: unknown[]) => void } }).flutter_inappwebview;
      if (flutterBridge && typeof flutterBridge.callHandler === 'function') {
        flutterBridge.callHandler('SamyakBridge', JSON.stringify(message));
      }

      // 2. Standard Flutter WebViewController JavaScriptChannel
      const flutterChannel = (window as unknown as { SamyakBridge?: { postMessage: (msg: string) => void } }).SamyakBridge;
      if (flutterChannel && typeof flutterChannel.postMessage === 'function') {
        flutterChannel.postMessage(JSON.stringify(message));
      }

      // 3. Fallback standard postMessage (for iframe embeds or PWA)
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(JSON.stringify(message), '*');
      }

      return { success: true, messageId };
    } catch (err: unknown) {
      if (this.onErrorCallback) {
        this.onErrorCallback(err instanceof Error ? err : new Error(String(err)));
      }
      return { success: false, messageId };
    }
  }

  /**
   * Clean up event listeners on unmount
   */
  public destroy(): void {
    this.isDestroyed = true;
    if (typeof window !== 'undefined') {
      window.removeEventListener('message', this.handleWindowMessage);
    }
  }
}
