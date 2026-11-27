import { handle } from '@/lib/cee-visual/http';
import { requireUuid } from '@/lib/cee-visual/service.server';
import { exportCurriculum, staffContext } from '@/lib/cee-visual/admin.server';

export const dynamic = 'force-dynamic';

/** The syllabus tree as a CSV in the import format. */
export function GET(req: Request, c: { params: Promise<{ id: string }> }) {
  return handle('GET admin/syllabi/:id/export', async (requestId) => {
    const ctx = await staffContext(req, requestId);
    const { filename, csv } = await exportCurriculum(ctx, requireUuid((await c.params).id));
    return new Response('﻿' + csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
        'X-Request-Id': requestId,
      },
    });
  });
}
