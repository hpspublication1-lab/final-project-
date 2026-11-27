import { CeeApiError, fromZod, handle, ok, readJson } from '@/lib/cee-visual/http';
import { AttemptRequest, IdempotencyKey } from '@/lib/cee-visual/schemas';
import { rateLimit, studentLesson, submitAttempt } from '@/lib/cee-visual/service.server';

export const dynamic = 'force-dynamic';

/**
 * Submit answers to the lesson's questions. Graded here against the pinned
 * question revisions; the correct answers and explanations are returned only
 * now, after submission. Requires an Idempotency-Key header, so a retried
 * submission returns the same result instead of creating a second attempt.
 */
export function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle('POST me/lessons/:id/attempts', async (requestId) => {
    const key = IdempotencyKey.safeParse(req.headers.get('idempotency-key') ?? '');
    if (!key.success) throw new CeeApiError('INVALID_REQUEST', 'Send an Idempotency-Key header (8–128 letters, digits, - or _).');
    const { client, user, lesson } = await studentLesson(req, (await ctx.params).id);
    await rateLimit(user.id, 'attempts', 10);
    const parsed = AttemptRequest.safeParse(await readJson(req, 32 * 1024));
    if (!parsed.success) throw fromZod(parsed.error);
    const result = await submitAttempt(client, user.id, lesson, parsed.data, key.data);
    return ok(result, requestId, result.replay ? 200 : 201);
  });
}
