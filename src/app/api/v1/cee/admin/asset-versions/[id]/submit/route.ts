import { handle, ok } from '@/lib/cee-visual/http';
import { requireUuid } from '@/lib/cee-visual/service.server';
import { staffContext } from '@/lib/cee-visual/admin.server';
import { submitVersion } from '@/lib/cee-visual/assets.server';

export const dynamic = 'force-dynamic';

/** Send a described, validated version to its three reviews (scientific, visual, rights). */
export function POST(req: Request, c: { params: Promise<{ id: string }> }) {
  return handle('POST admin/asset-versions/:id/submit', async (requestId) => {
    const ctx = await staffContext(req, requestId);
    return ok(await submitVersion(ctx, requireUuid((await c.params).id)), requestId);
  });
}
