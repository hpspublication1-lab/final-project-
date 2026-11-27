import { fromZod, handle, ok, readJson } from '@/lib/cee-visual/http';
import { rateLimit, requireUuid } from '@/lib/cee-visual/service.server';
import { decideReview, DecisionInput, staffContext } from '@/lib/cee-visual/admin.server';

export const dynamic = 'force-dynamic';

export function POST(req: Request, c: { params: Promise<{ id: string }> }) {
  return handle('POST admin/reviews/:id/decision', async (requestId) => {
    const ctx = await staffContext(req, requestId);
    await rateLimit(ctx.user.id, 'admin-write', 120);
    const body = DecisionInput.safeParse(await readJson(req, 16 * 1024));
    if (!body.success) throw fromZod(body.error);
    return ok(await decideReview(ctx, requireUuid((await c.params).id), body.data), requestId);
  });
}
