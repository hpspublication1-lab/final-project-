import { describe, expect, it } from 'vitest';
import { EventQueue, resultForStatus, type SendResult } from '../eventQueue';
import { EventBatch, type PlayerEvent } from '../schemas';

let n = 0;
const uuid = () => `00000000-0000-4000-8000-${String(++n).padStart(12, '0')}`;
const now = () => new Date('2026-11-23T10:00:00.000Z');

describe('EventQueue', () => {
  it('produces batches the server schema accepts', async () => {
    const sent: PlayerEvent[][] = [];
    const q = new EventQueue({ send: async (b) => (sent.push(b), 'ok'), uuid, now });
    q.push({ type: 'LESSON_OPENED', payload: {} });
    q.push({ type: 'SEQUENCE_STEP', payload: { sequenceKey: 'tour', stepIndex: 0 }, assetVersionId: uuid() });
    expect(await q.flush()).toBe('ok');
    expect(EventBatch.safeParse({ events: sent[0] }).success).toBe(true);
    expect(q.size).toBe(0);
  });

  it('keeps the same event ids when a batch is retried', async () => {
    const results: SendResult[] = ['retry', 'ok'];
    const ids: string[][] = [];
    const q = new EventQueue({ send: async (b) => (ids.push(b.map((e) => e.eventId)), results.shift()!), uuid, now });
    q.push({ type: 'LESSON_OPENED', payload: {} });
    expect(await q.flush()).toBe('retry');
    expect(q.backoffMs).toBe(1000);
    expect(await q.flush()).toBe('ok');
    expect(ids[0]).toEqual(ids[1]);
    expect(q.backoffMs).toBe(0);
  });

  it('treats a network error as retry, and drops a batch the server rejects', async () => {
    const q = new EventQueue({ send: async () => Promise.reject(new Error('offline')), uuid, now });
    q.push({ type: 'LESSON_OPENED', payload: {} });
    expect(await q.flush()).toBe('retry');
    expect(q.size).toBe(1);
    const d = new EventQueue({ send: async () => 'drop', uuid, now });
    d.push({ type: 'LESSON_OPENED', payload: {} });
    expect(await d.flush()).toBe('drop');
    expect(d.size).toBe(0);
  });

  it('sends at most one batch at a time, 50 events each', async () => {
    let release!: () => void;
    const sizes: number[] = [];
    const q = new EventQueue({
      send: (b) => new Promise<SendResult>((r) => ((release = () => r('ok')), sizes.push(b.length))),
      uuid,
      now,
    });
    for (let i = 0; i < 60; i++) q.push({ type: 'SECTION_READ', payload: { sectionKey: 'intro' } });
    const first = q.flush();
    expect(await q.flush()).toBe('busy');
    release();
    await first;
    expect(sizes).toEqual([50]);
    expect(q.size).toBe(10);
  });

  it('caps the queue, keeping the newest events', () => {
    const q = new EventQueue({ send: async () => 'ok', uuid, now, maxQueue: 3 });
    for (let i = 0; i < 5; i++) q.push({ type: 'SEQUENCE_STEP', payload: { sequenceKey: 'tour', stepIndex: i } });
    expect(q.drain().map((e) => (e.payload as { stepIndex: number }).stepIndex)).toEqual([2, 3, 4]);
  });

  it('maps HTTP statuses', () => {
    expect([200, 207, 400, 404, 429, 500, 503].map(resultForStatus)).toEqual(['ok', 'ok', 'drop', 'drop', 'retry', 'retry', 'retry']);
  });
});
