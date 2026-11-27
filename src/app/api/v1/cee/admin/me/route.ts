import { handle, ok } from '@/lib/cee-visual/http';
import { me, staffContext } from '@/lib/cee-visual/admin.server';

export const dynamic = 'force-dynamic';

/** The caller's CEE content roles. */
export function GET(req: Request) {
  return handle('GET admin/me', async (requestId) => ok(me(await staffContext(req, requestId)), requestId));
}
