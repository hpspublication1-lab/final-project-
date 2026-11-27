import { fromZod, handle, ok, readJson } from '@/lib/cee-visual/http';
import { rateLimit, requireUuid } from '@/lib/cee-visual/service.server';
import { addQuestion, QuestionCreate, staffContext } from '@/lib/cee-visual/admin.server';

export const dynamic = 'force-dynamic';

/** Write a new question and pin it to this draft. */
export function POST(req: Request, c: { params: Promise<{ id: string }> }) {
  return handle('POST admin/lesson-revisions/:id/questions', async (requestId) => {
    const ctx = await staffContext(req, requestId);
    await rateLimit(ctx.user.id, 'admin-write', 120);
    const body = QuestionCreate.safeParse(await readJson(req, 32 * 1024));
    if (!body.success) throw fromZod(body.error);
    return ok(await addQuestion(ctx, requireUuid((await c.params).id), body.data), requestId, 201);
  });
}
