import { fromZod, handle, ok, readJson } from '@/lib/cee-visual/http';
import { requireUuid } from '@/lib/cee-visual/service.server';
import { linkNode, NodeLink, staffContext } from '@/lib/cee-visual/admin.server';

export const dynamic = 'force-dynamic';

/** Link (or unlink) a syllabus chapter to an existing course chapter page. */
export function PATCH(req: Request, c: { params: Promise<{ id: string }> }) {
  return handle('PATCH admin/curriculum/nodes/:id', async (requestId) => {
    const ctx = await staffContext(req, requestId);
    const body = NodeLink.safeParse(await readJson(req, 1024));
    if (!body.success) throw fromZod(body.error);
    await linkNode(ctx, requireUuid((await c.params).id), body.data);
    return ok({ linked: body.data.legacyChapterId !== null }, requestId);
  });
}
