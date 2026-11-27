/**
 * Client-side batching of player events.
 *
 * Each event gets its id and timestamp when it happens, and keeps them across
 * retries, so a batch sent twice (flaky mobile network) is deduplicated by the
 * server and never earns double credit.
 */
import type { PlayerEvent } from './schemas';

export type SendResult = 'ok' | 'retry' | 'drop';

export interface EventQueueOptions {
  send(events: PlayerEvent[]): Promise<SendResult>;
  maxBatch?: number;
  maxQueue?: number;
  /** For tests. */
  now?(): Date;
  uuid?(): string;
}

export interface EventDraft {
  type: PlayerEvent['type'];
  payload: Record<string, unknown>;
  assetVersionId?: string;
}

export class EventQueue {
  private queue: PlayerEvent[] = [];
  private sending = false;
  private failures = 0;
  readonly maxBatch: number;
  readonly maxQueue: number;

  constructor(private readonly opts: EventQueueOptions) {
    this.maxBatch = opts.maxBatch ?? 50;
    this.maxQueue = opts.maxQueue ?? 500;
  }

  push(draft: EventDraft): PlayerEvent {
    const event = {
      eventId: (this.opts.uuid ?? (() => crypto.randomUUID()))(),
      occurredAt: (this.opts.now?.() ?? new Date()).toISOString(),
      type: draft.type,
      payload: draft.payload,
      ...(draft.assetVersionId ? { assetVersionId: draft.assetVersionId } : {}),
    } as PlayerEvent;
    this.queue.push(event);
    // A queue that can't drain (offline for a long time) keeps the newest events.
    if (this.queue.length > this.maxQueue) this.queue.splice(0, this.queue.length - this.maxQueue);
    return event;
  }

  get size(): number {
    return this.queue.length;
  }

  /** Milliseconds to wait before the next attempt after failures. */
  get backoffMs(): number {
    return this.failures === 0 ? 0 : Math.min(30_000, 1000 * 2 ** (this.failures - 1));
  }

  /** Sends one batch. Returns what happened, or 'busy' if a send is in flight. */
  async flush(): Promise<SendResult | 'empty' | 'busy'> {
    if (this.sending) return 'busy';
    if (this.queue.length === 0) return 'empty';
    this.sending = true;
    const batch = this.queue.slice(0, this.maxBatch);
    try {
      const result = await this.opts.send(batch);
      if (result === 'retry') {
        this.failures++;
      } else {
        this.failures = 0;
        this.queue.splice(0, batch.length);
      }
      return result;
    } catch {
      this.failures++;
      return 'retry';
    } finally {
      this.sending = false;
    }
  }

  /** The pending events, for a last-chance sendBeacon when the page hides. */
  drain(): PlayerEvent[] {
    const all = this.queue.slice(0, this.maxBatch);
    this.queue.splice(0, all.length);
    return all;
  }
}

/** Maps an HTTP status from the events endpoint to what the queue should do. */
export function resultForStatus(status: number): SendResult {
  if (status >= 200 && status < 300) return 'ok';
  if (status === 429 || status >= 500 || status === 0) return 'retry';
  return 'drop'; // 4xx: retrying the same bytes can't succeed
}
