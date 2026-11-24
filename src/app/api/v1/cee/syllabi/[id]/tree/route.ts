import { handle, ok } from '@/lib/cee-visual/http';
import { db, requireFeature, requireUser, requireUuid, syllabusTree } from '@/lib/cee-visual/service.server';

export const dynamic = 'force-dynamic';

/** Subject → chapter → topic tree of a verified syllabus, with published-lesson counts. */
export function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle('GET syllabi/:id/tree', async (requestId) => {
    const client = db();
    await requireFeature(client);
    await requireUser(req);
    return ok(await syllabusTree(client, requireUuid((await ctx.params).id)), requestId);
  });
}
