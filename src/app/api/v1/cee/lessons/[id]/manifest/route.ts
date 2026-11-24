import { handle, ok } from '@/lib/cee-visual/http';
import { resolveVisual, studentLesson } from '@/lib/cee-visual/service.server';

export const dynamic = 'force-dynamic';

/** Fresh signed URLs for the lesson's visual (they expire after 10 minutes). */
export function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle('GET lessons/:id/manifest', async (requestId) => {
    const { client, lesson } = await studentLesson(req, (await ctx.params).id);
    return ok({ visual: await resolveVisual(client, lesson) }, requestId);
  });
}
