import { CeeApiError, fromZod, handle, ok, readJson } from '@/lib/cee-visual/http';
import { ProgramCode } from '@/lib/cee-visual/schemas';
import { rateLimit } from '@/lib/cee-visual/service.server';
import { staffContext } from '@/lib/cee-visual/admin.server';
import { AssetCreate, createAsset, listAssets } from '@/lib/cee-visual/assets.server';

export const dynamic = 'force-dynamic';

/** The course's visuals with every version's checks, scan state and review state. */
export function GET(req: Request) {
  return handle('GET admin/assets', async (requestId) => {
    const ctx = await staffContext(req, requestId);
    const p = ProgramCode.safeParse(new URL(req.url).searchParams.get('program') ?? 'cee_medical');
    if (!p.success) throw new CeeApiError('INVALID_REQUEST', 'Unknown course.');
    return ok(await listAssets(ctx, p.data), requestId);
  });
}

export function POST(req: Request) {
  return handle('POST admin/assets', async (requestId) => {
    const ctx = await staffContext(req, requestId);
    await rateLimit(ctx.user.id, 'admin-write', 120);
    const body = AssetCreate.safeParse(await readJson(req, 4 * 1024));
    if (!body.success) throw fromZod(body.error);
    return ok(await createAsset(ctx, body.data), requestId, 201);
  });
}
