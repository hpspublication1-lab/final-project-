import { handle, ok } from '@/lib/cee-visual/http';
import { recomputeProgress, studentLesson } from '@/lib/cee-visual/service.server';

export const dynamic = 'force-dynamic';

/** Own progress for one lesson, computed on the server. */
export function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle('GET me/lessons/:id/progress', async (requestId) => {
    const { client, user, lesson } = await studentLesson(req, (await ctx.params).id);
    return ok({ progress: await recomputeProgress(client, user.id, lesson, false) }, requestId);
  });
}
