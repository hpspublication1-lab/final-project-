import { handle, ok } from '@/lib/cee-visual/http';
import { db, requireFeature, requireUser, requireUuid, topicLessons } from '@/lib/cee-visual/service.server';

export const dynamic = 'force-dynamic';

/** Published lessons mapped to a topic. An empty list is a normal answer. */
export function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle('GET topics/:id/lessons', async (requestId) => {
    const client = db();
    await requireFeature(client);
    await requireUser(req);
    const result = await topicLessons(client, requireUuid((await ctx.params).id));
    return ok(
      { ...result, emptyMessage: result.lessons.length === 0 ? 'No visual lessons have been published for this topic yet.' : null },
      requestId
    );
  });
}
