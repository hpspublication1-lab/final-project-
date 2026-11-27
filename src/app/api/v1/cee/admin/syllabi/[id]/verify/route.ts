import { fromZod, handle, ok, readJson } from '@/lib/cee-visual/http';
import { requireUuid } from '@/lib/cee-visual/service.server';
import { staffContext, SyllabusVerify, verifySyllabus } from '@/lib/cee-visual/admin.server';

export const dynamic = 'force-dynamic';

/** Mark a syllabus verified against the official document (its URL and SHA-256). */
export function POST(req: Request, c: { params: Promise<{ id: string }> }) {
  return handle('POST admin/syllabi/:id/verify', async (requestId) => {
    const ctx = await staffContext(req, requestId);
    const body = SyllabusVerify.safeParse(await readJson(req, 4 * 1024));
    if (!body.success) throw fromZod(body.error);
    await verifySyllabus(ctx, requireUuid((await c.params).id), body.data);
    return ok({ verified: true }, requestId);
  });
}
