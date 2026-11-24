import { handle, ok } from '@/lib/cee-visual/http';
import { rateLimit, requireUuid } from '@/lib/cee-visual/service.server';
import { newRevision, staffContext } from '@/lib/cee-visual/admin.server';

export const dynamic = 'force-dynamic';

/** Start a new draft revision from the latest one (content and pins copied). */
export function POST(req: Request, c: { params: Promise<{ id: string }> }) {
  return handle('POST admin/lessons/:id/revisions', async (requestId) => {
    const ctx = await staffContext(req, requestId);
    await rateLimit(ctx.user.id, 'admin-write', 120);
    return ok(await newRevision(ctx, requireUuid((await c.params).id)), requestId, 201);
  });
}
