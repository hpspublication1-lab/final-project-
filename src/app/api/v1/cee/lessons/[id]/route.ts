import { handle, ok } from '@/lib/cee-visual/http';
import { recomputeProgress, resolveVisual, studentLesson, toStudentView } from '@/lib/cee-visual/service.server';

export const dynamic = 'force-dynamic';

/** The active published lesson: content, visual with fresh URLs, questions without answers, own progress. */
export function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle('GET lessons/:id', async (requestId) => {
    const { client, user, lesson } = await studentLesson(req, (await ctx.params).id);
    const [visual, progress] = await Promise.all([resolveVisual(client, lesson), recomputeProgress(client, user.id, lesson, false)]);
    return ok({ lesson: toStudentView(lesson), visual, progress }, requestId);
  });
}
