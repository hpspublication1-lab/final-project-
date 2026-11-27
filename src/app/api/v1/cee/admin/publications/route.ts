import { CeeApiError, fromZod, handle, ok, readJson } from '@/lib/cee-visual/http';
import { IdempotencyKey } from '@/lib/cee-visual/schemas';
import { publish, staffContext } from '@/lib/cee-visual/admin.server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const Body = z.strictObject({ revisionId: z.uuid() });

/**
 * Publish an approved revision. The database checks every gate again and
 * refuses anything incomplete; a retried request with the same
 * Idempotency-Key returns the same publication.
 */
export function POST(req: Request) {
  return handle('POST admin/publications', async (requestId) => {
    const key = IdempotencyKey.safeParse(req.headers.get('idempotency-key') ?? '');
    if (!key.success) throw new CeeApiError('INVALID_REQUEST', 'Send an Idempotency-Key header.');
    const ctx = await staffContext(req, requestId);
    const body = Body.safeParse(await readJson(req, 2 * 1024));
    if (!body.success) throw fromZod(body.error);
    return ok(await publish(ctx, body.data.revisionId, key.data), requestId, 201);
  });
}
