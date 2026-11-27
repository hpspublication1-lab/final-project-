import { CeeApiError, fromZod, handle, ok, readJson } from '@/lib/cee-visual/http';
import { ProgramCode } from '@/lib/cee-visual/schemas';
import { grantRole, listRoles, RoleGrant, staffContext } from '@/lib/cee-visual/admin.server';

export const dynamic = 'force-dynamic';

const program = (req: Request) => {
  const p = ProgramCode.safeParse(new URL(req.url).searchParams.get('program') ?? 'cee_medical');
  if (!p.success) throw new CeeApiError('INVALID_REQUEST', 'Unknown course.');
  return p.data;
};

/** Active role assignments in a course. Super admins only. */
export function GET(req: Request) {
  return handle('GET admin/roles', async (requestId) => {
    const ctx = await staffContext(req, requestId);
    return ok({ roles: await listRoles(ctx, program(req)) }, requestId);
  });
}

/** Grant a scoped role to an existing account (by email). Super admins only. */
export function POST(req: Request) {
  return handle('POST admin/roles', async (requestId) => {
    const ctx = await staffContext(req, requestId);
    const body = RoleGrant.safeParse(await readJson(req, 8 * 1024));
    if (!body.success) throw fromZod(body.error);
    return ok(await grantRole(ctx, body.data), requestId, 201);
  });
}
