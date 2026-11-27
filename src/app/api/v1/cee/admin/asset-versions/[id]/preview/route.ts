import { handle, ok } from '@/lib/cee-visual/http';
import { requireUuid } from '@/lib/cee-visual/service.server';
import { staffContext } from '@/lib/cee-visual/admin.server';
import { previewVersion } from '@/lib/cee-visual/assets.server';

export const dynamic = 'force-dynamic';

/** A 10-minute link for staff to look at a version that passed its checks. */
export function GET(req: Request, c: { params: Promise<{ id: string }> }) {
  return handle('GET admin/asset-versions/:id/preview', async (requestId) => {
    const ctx = await staffContext(req, requestId);
    return ok(await previewVersion(ctx, requireUuid((await c.params).id)), requestId);
  });
}
