/**
 * Mobile WebView bridge protocol (version 1).
 *
 * The mobile app's code isn't in this repo yet (owner blocker G1), so this is
 * the web side of the contract plus a transport that works with the common
 * WebView hosts. Rules, enforced on both sides:
 *  - every message is versioned, typed from an allowlist, and ≤ 16 KB;
 *  - each side accepts only the types the other side may send;
 *  - duplicates (same messageId) are dropped;
 *  - there are no commands for navigation, files, scripts or auth.
 */
import { APP_TO_WEBVIEW, BRIDGE_PROTOCOL_VERSION, BridgeMessage, WEBVIEW_TO_APP } from './schemas';

export const MAX_BRIDGE_BYTES = 16 * 1024;

export type InboundType = (typeof APP_TO_WEBVIEW)[number];
export type OutboundType = (typeof WEBVIEW_TO_APP)[number];

/** Bounded memory of seen message ids. */
export class SeenIds {
  private readonly ids = new Set<string>();
  constructor(private readonly limit = 500) {}
  /** Returns true the first time an id is seen. */
  first(id: string): boolean {
    if (this.ids.has(id)) return false;
    this.ids.add(id);
    if (this.ids.size > this.limit) {
      const oldest = this.ids.values().next().value;
      if (oldest !== undefined) this.ids.delete(oldest);
    }
    return true;
  }
}

export type ParseResult =
  | { ok: true; message: BridgeMessage }
  | { ok: false; reason: 'TOO_LARGE' | 'NOT_JSON' | 'INVALID' | 'WRONG_DIRECTION' | 'DUPLICATE' };

/**
 * Parses a message arriving at one side. `direction` says which side we are:
 * the WebView accepts only app→WebView types, and vice versa.
 */
export function parseBridgeMessage(raw: unknown, seen: SeenIds, receiver: 'webview' | 'app'): ParseResult {
  let value: unknown = raw;
  if (typeof raw === 'string') {
    if (new TextEncoder().encode(raw).length > MAX_BRIDGE_BYTES) return { ok: false, reason: 'TOO_LARGE' };
    try {
      value = JSON.parse(raw);
    } catch {
      return { ok: false, reason: 'NOT_JSON' };
    }
  } else {
    try {
      if (new TextEncoder().encode(JSON.stringify(raw)).length > MAX_BRIDGE_BYTES) return { ok: false, reason: 'TOO_LARGE' };
    } catch {
      return { ok: false, reason: 'INVALID' };
    }
  }

  const parsed = BridgeMessage.safeParse(value);
  if (!parsed.success) return { ok: false, reason: 'INVALID' };

  const allowed: readonly string[] = receiver === 'webview' ? APP_TO_WEBVIEW : WEBVIEW_TO_APP;
  if (!allowed.includes(parsed.data.type)) return { ok: false, reason: 'WRONG_DIRECTION' };
  if (!seen.first(parsed.data.messageId)) return { ok: false, reason: 'DUPLICATE' };
  return { ok: true, message: parsed.data };
}

export function makeOutbound<T extends OutboundType>(
  type: T,
  payload: Extract<BridgeMessage, { type: T }>['payload']
): Extract<BridgeMessage, { type: T }> {
  const msg = { protocolVersion: BRIDGE_PROTOCOL_VERSION, messageId: crypto.randomUUID(), type, payload };
  // Validate our own output too: a bug here must not reach the app.
  return BridgeMessage.parse(msg) as Extract<BridgeMessage, { type: T }>;
}

interface HostWindow {
  ReactNativeWebView?: { postMessage(data: string): void };
  webkit?: { messageHandlers?: { samyak?: { postMessage(data: unknown): void } } };
  SamyakBridge?: { postMessage(data: string): void };
}

/** True when the page runs inside one of the supported WebView hosts. */
export function hasNativeHost(w: unknown): boolean {
  const h = w as HostWindow | undefined;
  return Boolean(h?.ReactNativeWebView || h?.webkit?.messageHandlers?.samyak || h?.SamyakBridge);
}

/** Sends to the native host if there is one; otherwise does nothing. */
export function postToHost(w: unknown, message: BridgeMessage): boolean {
  const h = w as HostWindow | undefined;
  const data = JSON.stringify(message);
  if (h?.ReactNativeWebView) h.ReactNativeWebView.postMessage(data);
  else if (h?.webkit?.messageHandlers?.samyak) h.webkit.messageHandlers.samyak.postMessage(data);
  else if (h?.SamyakBridge) h.SamyakBridge.postMessage(data);
  else return false;
  return true;
}
