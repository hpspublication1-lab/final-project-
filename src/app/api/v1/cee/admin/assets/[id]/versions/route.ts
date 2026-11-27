import { fromZod, handle, ok, readJson } from '@/lib/cee-visual/http';
import { rateLimit, requireUuid } from '@/lib/cee-visual/service.server';
import { staffContext } from '@/lib/cee-visual/admin.server';
import { initUpload, VersionInit } from '@/lib/cee-visual/assets.server';

export const dynamic = 'force-dynamic';

/**
 * Start an upload: declare the file's type, size and SHA-256, get a signed
 * single-use URL into the private quarantine bucket. The browser sends the file
 * there directly, then calls /asset-versions/:id/process.
 */
export function POST(req: Request, c: { params: Promise<{ id: string }> }) {
  return handle('POST admin/assets/:id/versions', async (requestId) => {
    const ctx = await staffContext(req, requestId);
    await rateLimit(ctx.user.id, 'asset-upload', 30);
    const body = VersionInit.safeParse(await readJson(req, 1024));
    if (!body.success) throw fromZod(body.error);
    return ok(await initUpload(ctx, requireUuid((await c.params).id), body.data), requestId, 201);
  });
}
