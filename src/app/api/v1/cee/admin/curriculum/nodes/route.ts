import { fromZod, handle, ok, readJson } from '@/lib/cee-visual/http';
import { createNode, NodeCreate, staffContext } from '@/lib/cee-visual/admin.server';

export const dynamic = 'force-dynamic';

export function POST(req: Request) {
  return handle('POST admin/curriculum/nodes', async (requestId) => {
    const ctx = await staffContext(req, requestId);
    const body = NodeCreate.safeParse(await readJson(req, 8 * 1024));
    if (!body.success) throw fromZod(body.error);
    return ok(await createNode(ctx, body.data), requestId, 201);
  });
}
