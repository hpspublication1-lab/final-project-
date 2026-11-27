import { fromZod, handle, ok, readJson } from '@/lib/cee-visual/http';
import { requireUuid } from '@/lib/cee-visual/service.server';
import { staffContext } from '@/lib/cee-visual/admin.server';
import { pinAsset, PinInput } from '@/lib/cee-visual/assets.server';

export const dynamic = 'force-dynamic';

/** Attach a validated visual version to a draft revision as its main visual, fallback or a supporting visual. */
export function POST(req: Request, c: { params: Promise<{ id: string }> }) {
  return handle('POST admin/lesson-revisions/:id/assets', async (requestId) => {
    const ctx = await staffContext(req, requestId);
    const body = PinInput.safeParse(await readJson(req, 1024));
    if (!body.success) throw fromZod(body.error);
    return ok(await pinAsset(ctx, requireUuid((await c.params).id), body.data), requestId, 201);
  });
}
