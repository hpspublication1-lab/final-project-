import { handle, ok, readJson } from '@/lib/cee-visual/http';
import { requireUuid } from '@/lib/cee-visual/service.server';
import { staffContext } from '@/lib/cee-visual/admin.server';
import { saveManifest } from '@/lib/cee-visual/assets.server';

export const dynamic = 'force-dynamic';

/** Describe a validated version (title, accessibility, and later hotspots, layers, tours). Fixed once sent for review. */
export function PUT(req: Request, c: { params: Promise<{ id: string }> }) {
  return handle('PUT admin/asset-versions/:id/manifest', async (requestId) => {
    const ctx = await staffContext(req, requestId);
    return ok(await saveManifest(ctx, requireUuid((await c.params).id), await readJson(req, 256 * 1024)), requestId);
  });
}
