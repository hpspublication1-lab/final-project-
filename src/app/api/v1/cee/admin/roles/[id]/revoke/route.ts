import { handle, ok } from '@/lib/cee-visual/http';
import { requireUuid } from '@/lib/cee-visual/service.server';
import { revokeRole, staffContext } from '@/lib/cee-visual/admin.server';

export const dynamic = 'force-dynamic';

export function POST(req: Request, c: { params: Promise<{ id: string }> }) {
  return handle('POST admin/roles/:id/revoke', async (requestId) => {
    const ctx = await staffContext(req, requestId);
    await revokeRole(ctx, requireUuid((await c.params).id));
    return ok({ revoked: true }, requestId);
  });
}
