import { handle, ok } from '@/lib/cee-visual/http';
import { db, myProgressList, requireFeature, requireUser } from '@/lib/cee-visual/service.server';

export const dynamic = 'force-dynamic';

/** The signed-in student's progress across visual lessons. */
export function GET(req: Request) {
  return handle('GET me/progress', async (requestId) => {
    const client = db();
    await requireFeature(client);
    const user = await requireUser(req);
    return ok({ progress: await myProgressList(client, user.id) }, requestId);
  });
}
