import { fromZod, handle, ok, readJson } from '@/lib/cee-visual/http';
import { rateLimit, requireUuid } from '@/lib/cee-visual/service.server';
import { DraftUpdate, staffContext, updateDraft } from '@/lib/cee-visual/admin.server';

export const dynamic = 'force-dynamic';

/** Save draft content. baseUpdatedAt must match, or someone else saved first (409). */
export function PATCH(req: Request, c: { params: Promise<{ id: string }> }) {
  return handle('PATCH admin/lesson-revisions/:id', async (requestId) => {
    const ctx = await staffContext(req, requestId);
    await rateLimit(ctx.user.id, 'admin-write', 120);
    const body = DraftUpdate.safeParse(await readJson(req, 256 * 1024));
    if (!body.success) throw fromZod(body.error);
    return ok(await updateDraft(ctx, requireUuid((await c.params).id), body.data), requestId);
  });
}
