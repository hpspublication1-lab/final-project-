import { CeeApiError, handle, ok } from '@/lib/cee-visual/http';
import { ProgramCode } from '@/lib/cee-visual/schemas';
import { curriculumForAdmin, staffContext } from '@/lib/cee-visual/admin.server';

export const dynamic = 'force-dynamic';

/** All syllabus versions (any status) and their nodes, for pickers in the CMS. */
export function GET(req: Request) {
  return handle('GET admin/curriculum', async (requestId) => {
    const ctx = await staffContext(req, requestId);
    const p = ProgramCode.safeParse(new URL(req.url).searchParams.get('program') ?? 'cee_medical');
    if (!p.success) throw new CeeApiError('INVALID_REQUEST', 'Unknown course.');
    return ok(await curriculumForAdmin(ctx, p.data), requestId);
  });
}
