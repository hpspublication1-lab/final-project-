import { CeeApiError, fromZod, handle, ok, readJson } from '@/lib/cee-visual/http';
import { ProgramCode } from '@/lib/cee-visual/schemas';
import { rateLimit } from '@/lib/cee-visual/service.server';
import { createLesson, LessonCreate, listLessons, staffContext } from '@/lib/cee-visual/admin.server';

export const dynamic = 'force-dynamic';

export function GET(req: Request) {
  return handle('GET admin/lessons', async (requestId) => {
    const ctx = await staffContext(req, requestId);
    const p = ProgramCode.safeParse(new URL(req.url).searchParams.get('program') ?? 'cee_medical');
    if (!p.success) throw new CeeApiError('INVALID_REQUEST', 'Unknown course.');
    return ok({ lessons: await listLessons(ctx, p.data) }, requestId);
  });
}

/** New lesson, mapped (proposed) to a topic, with an empty draft revision 1. */
export function POST(req: Request) {
  return handle('POST admin/lessons', async (requestId) => {
    const ctx = await staffContext(req, requestId);
    await rateLimit(ctx.user.id, 'admin-write', 120);
    const body = LessonCreate.safeParse(await readJson(req, 8 * 1024));
    if (!body.success) throw fromZod(body.error);
    return ok(await createLesson(ctx, body.data), requestId, 201);
  });
}
