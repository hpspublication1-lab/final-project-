import { handle, ok } from '@/lib/cee-visual/http';
import { requireUuid } from '@/lib/cee-visual/service.server';
import { staffContext, submitRevision } from '@/lib/cee-visual/admin.server';

export const dynamic = 'force-dynamic';

/** Send a complete draft for review: opens the six review gates and freezes it. */
export function POST(req: Request, c: { params: Promise<{ id: string }> }) {
  return handle('POST admin/lesson-revisions/:id/submit', async (requestId) => {
    const ctx = await staffContext(req, requestId);
    await submitRevision(ctx, requireUuid((await c.params).id));
    return ok({ status: 'IN_REVIEW' }, requestId);
  });
}
