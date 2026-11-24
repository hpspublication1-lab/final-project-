import { CeeApiError, handle, ok } from '@/lib/cee-visual/http';
import { ProgramCode } from '@/lib/cee-visual/schemas';
import { reviewQueue, staffContext } from '@/lib/cee-visual/admin.server';

export const dynamic = 'force-dynamic';

/** Open reviews the caller can decide (or, with status=done, decided ones). */
export function GET(req: Request) {
  return handle('GET admin/reviews', async (requestId) => {
    const ctx = await staffContext(req, requestId);
    const q = new URL(req.url).searchParams;
    const p = ProgramCode.safeParse(q.get('program') ?? 'cee_medical');
    if (!p.success) throw new CeeApiError('INVALID_REQUEST', 'Unknown course.');
    return ok({ reviews: await reviewQueue(ctx, p.data, q.get('status') === 'done' ? 'DONE' : 'OPEN') }, requestId);
  });
}
