import { handle, ok } from '@/lib/cee-visual/http';
import { requireUuid } from '@/lib/cee-visual/service.server';
import { lessonDetail, staffContext } from '@/lib/cee-visual/admin.server';

export const dynamic = 'force-dynamic';

export function GET(req: Request, c: { params: Promise<{ id: string }> }) {
  return handle('GET admin/lessons/:id', async (requestId) => {
    const ctx = await staffContext(req, requestId);
    return ok(await lessonDetail(ctx, requireUuid((await c.params).id)), requestId);
  });
}
