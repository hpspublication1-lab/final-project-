import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

// PATCH-001 (independent audit, VULN-002): completion is derived from watch time only.
const writes: Record<string, unknown>[] = [];
vi.mock('@/lib/supabase/route-auth', () => ({ getSessionUser: async () => ({ id: 'student-1', email: 's@test.invalid' }) }));
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: () => ({
      upsert: (row: Record<string, unknown>) => {
        writes.push(row);
        return { select: () => ({ single: async () => ({ data: row, error: null }) }), then: (r: (v: unknown) => void) => r({ data: row, error: null }) };
      },
    }),
  }),
}));

const post = async (body: Record<string, unknown>) => {
  const { POST } = await import('../route');
  return POST(new NextRequest('http://test/api/see/progress', { method: 'POST', body: JSON.stringify(body) }));
};

describe('POST /api/see/progress', () => {
  beforeEach(() => {
    writes.length = 0;
  });
  it('ignores a client claim of completion without the watch time', async () => {
    await post({ lessonId: 'l1', watchedSeconds: 10, totalDurationSec: 600, isCompleted: true });
    expect(writes.at(-1)).toMatchObject({ user_id: 'student-1', is_completed: false });
  });
  it('completes at 90% watched, whatever the client says', async () => {
    await post({ lessonId: 'l1', watchedSeconds: 540, totalDurationSec: 600, isCompleted: false });
    expect(writes.at(-1)).toMatchObject({ is_completed: true });
  });
  it('does not complete when the duration is unknown', async () => {
    await post({ lessonId: 'l1', watchedSeconds: 999, totalDurationSec: 0, isCompleted: true });
    expect(writes.at(-1)).toMatchObject({ is_completed: false });
  });
});
