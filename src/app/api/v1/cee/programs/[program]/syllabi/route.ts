import { CeeApiError, handle, ok } from '@/lib/cee-visual/http';
import { ProgramCode } from '@/lib/cee-visual/schemas';
import { db, listVerifiedSyllabi, requireFeature, requireUser } from '@/lib/cee-visual/service.server';

export const dynamic = 'force-dynamic';

/** Verified syllabus versions for a program. */
export function GET(req: Request, ctx: { params: Promise<{ program: string }> }) {
  return handle('GET programs/:program/syllabi', async (requestId) => {
    const client = db();
    await requireFeature(client);
    await requireUser(req);
    const program = ProgramCode.safeParse((await ctx.params).program);
    if (!program.success) throw new CeeApiError('NOT_FOUND');
    return ok({ syllabi: await listVerifiedSyllabi(client, program.data) }, requestId);
  });
}
