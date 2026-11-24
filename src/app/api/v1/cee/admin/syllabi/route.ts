import { fromZod, handle, ok, readJson } from '@/lib/cee-visual/http';
import { createSyllabus, staffContext, SyllabusCreate } from '@/lib/cee-visual/admin.server';

export const dynamic = 'force-dynamic';

export function POST(req: Request) {
  return handle('POST admin/syllabi', async (requestId) => {
    const ctx = await staffContext(req, requestId);
    const body = SyllabusCreate.safeParse(await readJson(req, 8 * 1024));
    if (!body.success) throw fromZod(body.error);
    return ok(await createSyllabus(ctx, body.data), requestId, 201);
  });
}
