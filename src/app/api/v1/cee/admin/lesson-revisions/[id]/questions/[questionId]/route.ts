import { handle, ok } from '@/lib/cee-visual/http';
import { requireUuid } from '@/lib/cee-visual/service.server';
import { removeQuestion, staffContext } from '@/lib/cee-visual/admin.server';

export const dynamic = 'force-dynamic';

/** Unpin a question from this draft (the question revision itself is kept). */
export function DELETE(req: Request, c: { params: Promise<{ id: string; questionId: string }> }) {
  return handle('DELETE admin/lesson-revisions/:id/questions/:questionId', async (requestId) => {
    const ctx = await staffContext(req, requestId);
    const p = await c.params;
    await removeQuestion(ctx, requireUuid(p.id), requireUuid(p.questionId));
    return ok({ removed: true }, requestId);
  });
}
