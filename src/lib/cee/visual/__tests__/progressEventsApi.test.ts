import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as postEvent } from '@/app/api/cee/me/lessons/[id]/events/route';
import { POST as postProgress } from '@/app/api/cee/me/lessons/[id]/progress/route';

describe('CEE Progress & Telemetry API (FND-016)', () => {
  it('CEE-009: should record event on first submission and deduplicate on repeat submission', async () => {
    const eventPayload = {
      eventId: 'evt_unique_test_123',
      publicationId: 'pub_heart_v1',
      assetVersionId: 'ast_ver_01',
      type: 'HOTSPOT_INSPECTED',
      metadata: { hotspotId: 'hp_ra' },
    };

    // 1st submission -> recorded: true, deduplicated: false
    const req1 = new NextRequest('http://localhost:4028/api/cee/me/lessons/human-heart/events', {
      method: 'POST',
      body: JSON.stringify(eventPayload),
    });
    const res1 = await postEvent(req1, { params: Promise.resolve({ id: 'human-heart' }) });
    expect(res1.status).toBe(200);

    const json1 = await res1.json();
    expect(json1.data.recorded).toBe(true);
    expect(json1.data.deduplicated).toBe(false);

    // 2nd submission (identical eventId) -> deduplicated: true, prevents double-counting
    const req2 = new NextRequest('http://localhost:4028/api/cee/me/lessons/human-heart/events', {
      method: 'POST',
      body: JSON.stringify(eventPayload),
    });
    const res2 = await postEvent(req2, { params: Promise.resolve({ id: 'human-heart' }) });
    expect(res2.status).toBe(200);

    const json2 = await res2.json();
    expect(json2.data.recorded).toBe(true);
    expect(json2.data.deduplicated).toBe(true);
  });

  it('CEE-008: should compute verified progress mathematically on server', async () => {
    const progressPayload = {
      publicationId: 'pub_heart_v1',
      inspectedHotspotsCount: 6,
      totalHotspotsCount: 6,
      quizScore: 3,
      quizTotal: 3,
    };

    const req = new NextRequest('http://localhost:4028/api/cee/me/lessons/human-heart/progress', {
      method: 'POST',
      body: JSON.stringify(progressPayload),
    });
    const res = await postProgress(req, { params: Promise.resolve({ id: 'human-heart' }) });
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.data.completionPercentage).toBe(100);
    expect(json.data.completed).toBe(true);
    expect(json.data.verifiedByServer).toBe(true);
  });

  it('should mark uncompleted if threshold < 80%', async () => {
    const lowProgressPayload = {
      publicationId: 'pub_heart_v1',
      inspectedHotspotsCount: 1,
      totalHotspotsCount: 6,
      quizScore: 0,
      quizTotal: 3,
    };

    const req = new NextRequest('http://localhost:4028/api/cee/me/lessons/human-heart/progress', {
      method: 'POST',
      body: JSON.stringify(lowProgressPayload),
    });
    const res = await postProgress(req, { params: Promise.resolve({ id: 'human-heart' }) });
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.data.completionPercentage).toBeLessThan(80);
    expect(json.data.completed).toBe(false);
  });
});
