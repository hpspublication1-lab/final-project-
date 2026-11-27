import { handle, ok } from '@/lib/cee-visual/http';
import { requireUuid } from '@/lib/cee-visual/service.server';
import { staffContext } from '@/lib/cee-visual/admin.server';
import { unpinAsset } from '@/lib/cee-visual/assets.server';

export const dynamic = 'force-dynamic';

export function DELETE(req: Request, c: { params: Promise<{ id: string; versionId: string }> }) {
  return handle('DELETE admin/lesson-revisions/:id/assets/:versionId', async (requestId) => {
    const ctx = await staffContext(req, requestId);
    const p = await c.params;
    return ok(await unpinAsset(ctx, requireUuid(p.id), requireUuid(p.versionId)), requestId);
  });
}
