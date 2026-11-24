import { fromZod, handle, ok, readJson } from '@/lib/cee-visual/http';
import { EventBatch } from '@/lib/cee-visual/schemas';
import { rateLimit, recordEvents, studentLesson } from '@/lib/cee-visual/service.server';

export const dynamic = 'force-dynamic';

/**
 * Up to 50 player events. Each has a client-generated id; a repeated id is
 * reported as a duplicate and earns nothing. Returns the recomputed progress.
 */
export function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle('POST me/lessons/:id/events', async (requestId) => {
    const { client, user, lesson } = await studentLesson(req, (await ctx.params).id);
    await rateLimit(user.id, 'events', 120);
    const parsed = EventBatch.safeParse(await readJson(req, 64 * 1024));
    if (!parsed.success) throw fromZod(parsed.error);
    return ok(await recordEvents(client, user.id, lesson, parsed.data.events), requestId);
  });
}
