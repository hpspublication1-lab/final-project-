import { handle, ok } from '@/lib/cee-visual/http';
import { rateLimit, requireUuid } from '@/lib/cee-visual/service.server';
import { staffContext } from '@/lib/cee-visual/admin.server';
import { processVersion } from '@/lib/cee-visual/assets.server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // reading and validating a model of up to 25 MB

/** Verify, validate, scan and promote whatever this version still needs. Safe to repeat. */
export function POST(req: Request, c: { params: Promise<{ id: string }> }) {
  return handle('POST admin/asset-versions/:id/process', async (requestId) => {
    const ctx = await staffContext(req, requestId);
    await rateLimit(ctx.user.id, 'asset-process', 30);
    return ok(await processVersion(ctx, requireUuid((await c.params).id)), requestId);
  });
}
