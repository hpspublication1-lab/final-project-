import { fromZod, handle, ok, readJson } from '@/lib/cee-visual/http';
import { requireUuid } from '@/lib/cee-visual/service.server';
import { staffContext, SyllabusDraftUpdate, updateSyllabusDraft } from '@/lib/cee-visual/admin.server';

export const dynamic = 'force-dynamic';

/** Change a draft's details, including the fingerprint of the official document it is entered from. */
export function PATCH(req: Request, c: { params: Promise<{ id: string }> }) {
  return handle('PATCH admin/syllabi/:id', async (requestId) => {
    const ctx = await staffContext(req, requestId);
    const body = SyllabusDraftUpdate.safeParse(await readJson(req, 8 * 1024));
    if (!body.success) throw fromZod(body.error);
    await updateSyllabusDraft(ctx, requireUuid((await c.params).id), body.data);
    return ok({ updated: true }, requestId);
  });
}
