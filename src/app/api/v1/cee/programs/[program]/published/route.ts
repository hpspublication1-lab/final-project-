import { CeeApiError, handle, ok } from '@/lib/cee-visual/http';
import { ProgramCode } from '@/lib/cee-visual/schemas';
import { db, publishedLessonLinks, requireFeature, requireUser } from '@/lib/cee-visual/service.server';

export const dynamic = 'force-dynamic';

/** Published visual lessons for a program, with the existing chapters they belong to. */
export function GET(req: Request, ctx: { params: Promise<{ program: string }> }) {
  return handle('GET programs/:program/published', async (requestId) => {
    const client = db();
    await requireFeature(client);
    await requireUser(req);
    const program = ProgramCode.safeParse((await ctx.params).program);
    if (!program.success) throw new CeeApiError('NOT_FOUND');
    return ok({ lessons: await publishedLessonLinks(client, program.data) }, requestId);
  });
}
