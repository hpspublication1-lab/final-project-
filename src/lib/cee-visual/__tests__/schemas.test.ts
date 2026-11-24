import { describe, expect, it } from 'vitest';
import { AttemptRequest, EventBatch, LessonContent, PlayerEvent, VisualAssetManifest } from '../schemas';
import { U, lessonContent, manifest3d } from './fixtures';

const at = '2026-11-23T10:00:00.000Z';

describe('VisualAssetManifest', () => {
  it('accepts a complete 3D manifest', () => {
    expect(VisualAssetManifest.safeParse(manifest3d()).success).toBe(true);
  });

  it('requires a 2D fallback for 3D', () => {
    const m = manifest3d();
    delete (m as Partial<typeof m>).fallback;
    const r = VisualAssetManifest.safeParse(m);
    expect(r.success).toBe(false);
    expect(JSON.stringify(r.error?.issues)).toContain('fallback');
  });

  it('requires a model block for 3D', () => {
    const m = manifest3d();
    delete (m as Partial<typeof m>).model;
    expect(VisualAssetManifest.safeParse(m).success).toBe(false);
  });

  it('rejects unknown keys (no smuggled URLs)', () => {
    expect(VisualAssetManifest.safeParse({ ...manifest3d(), sourceUrl: 'https://evil.example/x.glb' }).success).toBe(false);
  });

  it('rejects a hotspot with neither node nor position', () => {
    const m = manifest3d();
    m.hotspots = [{ id: 'x', label: 'X' }];
    expect(VisualAssetManifest.safeParse(m).success).toBe(false);
  });

  it('rejects duplicate hotspot ids and layer keys', () => {
    const m = manifest3d();
    m.hotspots = [m.hotspots[0], { ...m.hotspots[0] }];
    expect(VisualAssetManifest.safeParse(m).success).toBe(false);
    const n = manifest3d();
    n.model!.layers = [n.model!.layers[0], { ...n.model!.layers[0] }];
    expect(VisualAssetManifest.safeParse(n).success).toBe(false);
  });

  it('rejects a step that shows a layer that does not exist', () => {
    const m = manifest3d();
    m.sequences[0].steps[1].visibleLayers = ['nope'];
    expect(VisualAssetManifest.safeParse(m).success).toBe(false);
  });

  it('rejects steps out of time order', () => {
    const m = manifest3d();
    m.sequences[0].steps[2].atMs = 10;
    expect(VisualAssetManifest.safeParse(m).success).toBe(false);
  });

  it('requires a real accessibility description', () => {
    const m = manifest3d();
    m.accessibility.description = 'short';
    expect(VisualAssetManifest.safeParse(m).success).toBe(false);
  });
});

describe('LessonContent', () => {
  it('accepts valid content and rejects duplicate section keys', () => {
    expect(LessonContent.safeParse(lessonContent()).success).toBe(true);
    const c = lessonContent();
    c.sections.push({ ...c.sections[0] });
    expect(LessonContent.safeParse(c).success).toBe(false);
  });
});

describe('PlayerEvent', () => {
  it('validates the payload for each type', () => {
    expect(PlayerEvent.safeParse({ eventId: U(1), occurredAt: at, type: 'SECTION_READ', payload: { sectionKey: 'intro' } }).success).toBe(true);
    expect(PlayerEvent.safeParse({ eventId: U(1), occurredAt: at, type: 'SECTION_READ', payload: { hotspotId: 'x' } }).success).toBe(false);
    expect(
      PlayerEvent.safeParse({ eventId: U(1), occurredAt: at, type: 'SEQUENCE_STEP', payload: { sequenceKey: 'tour', stepIndex: 1.5 } }).success
    ).toBe(false);
  });

  it('rejects types outside the allowlist, such as a client claiming completion', () => {
    expect(PlayerEvent.safeParse({ eventId: U(1), occurredAt: at, type: 'LESSON_COMPLETED', payload: {} }).success).toBe(false);
  });

  it('rejects a non-uuid event id and a bad timestamp', () => {
    expect(PlayerEvent.safeParse({ eventId: 'abc', occurredAt: at, type: 'LESSON_OPENED', payload: {} }).success).toBe(false);
    expect(PlayerEvent.safeParse({ eventId: U(1), occurredAt: 'yesterday', type: 'LESSON_OPENED', payload: {} }).success).toBe(false);
  });
});

describe('EventBatch', () => {
  const ev = (n: number) => ({ eventId: U(n), occurredAt: at, type: 'LESSON_OPENED' as const, payload: {} });
  it('caps the batch at 50 and rejects duplicate ids inside it', () => {
    expect(EventBatch.safeParse({ events: [ev(1), ev(2)] }).success).toBe(true);
    expect(EventBatch.safeParse({ events: [ev(1), ev(1)] }).success).toBe(false);
    expect(EventBatch.safeParse({ events: Array.from({ length: 51 }, (_, i) => ev(i + 1)) }).success).toBe(false);
    expect(EventBatch.safeParse({ events: [] }).success).toBe(false);
  });
});

describe('AttemptRequest', () => {
  it('allows one answer per question and null for skipped', () => {
    expect(AttemptRequest.safeParse({ answers: [{ questionRevisionId: U(1), choice: null }] }).success).toBe(true);
    expect(
      AttemptRequest.safeParse({ answers: [{ questionRevisionId: U(1), choice: 'A' }, { questionRevisionId: U(1), choice: 'B' }] }).success
    ).toBe(false);
    expect(AttemptRequest.safeParse({ answers: [{ questionRevisionId: U(1), choice: 'E' }] }).success).toBe(false);
  });
});
