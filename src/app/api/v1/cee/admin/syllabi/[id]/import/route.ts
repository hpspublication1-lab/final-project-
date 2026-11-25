import { fromZod, handle, ok, readJson } from '@/lib/cee-visual/http';
import { requireUuid } from '@/lib/cee-visual/service.server';
import { CurriculumImport, importCurriculum, staffContext } from '@/lib/cee-visual/admin.server';

export const dynamic = 'force-dynamic';

/**
 * Import a CSV outline into a draft syllabus. `dryRun` defaults to true: the
 * file is only checked and previewed. With `dryRun: false` the draft's tree is
 * replaced in one transaction (`replace: true` is required if it has entries).
 */
export function POST(req: Request, c: { params: Promise<{ id: string }> }) {
  return handle('POST admin/syllabi/:id/import', async (requestId) => {
    const ctx = await staffContext(req, requestId);
    const body = CurriculumImport.safeParse(await readJson(req, 3 * 1024 * 1024));
    if (!body.success) throw fromZod(body.error);
    const result = await importCurriculum(ctx, requireUuid((await c.params).id), body.data);
    return ok(result, requestId, result.dryRun ? 200 : 201);
  });
}
