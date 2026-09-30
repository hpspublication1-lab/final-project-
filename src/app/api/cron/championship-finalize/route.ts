import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { finalizeDailyChampionship } from '@/lib/arena/championshipService';

function isAuthorizedCron(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    // In production, fail closed if CRON_SECRET is unconfigured
    return process.env.NODE_ENV !== 'production';
  }
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  return token === cronSecret;
}

export async function GET(req: NextRequest) {
  if (!isAuthorizedCron(req)) {
    return NextResponse.json({ error: 'Unauthorized: Invalid cron secret' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const dateParam = searchParams.get('date') || undefined;

  return executeFinalization(dateParam);
}

export async function POST(req: NextRequest) {
  if (!isAuthorizedCron(req)) {
    return NextResponse.json({ error: 'Unauthorized: Invalid cron secret' }, { status: 401 });
  }

  let dateParam: string | undefined = undefined;
  try {
    const body = await req.json();
    if (body && typeof body.date === 'string') {
      dateParam = body.date;
    }
  } catch {}

  if (!dateParam) {
    const { searchParams } = new URL(req.url);
    dateParam = searchParams.get('date') || undefined;
  }

  return executeFinalization(dateParam);
}

async function executeFinalization(dateStr?: string) {
  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json(
      { ok: false, error: 'Database admin client unavailable (SUPABASE_SERVICE_ROLE_KEY missing)' },
      { status: 500 }
    );
  }

  try {
    const result = await finalizeDailyChampionship(admin, dateStr);
    return NextResponse.json({
      ok: result.success,
      ...result,
    });
  } catch (err: any) {
    console.error('[CRON Championship Finalization Error]:', err);
    return NextResponse.json(
      { ok: false, error: err.message || 'Championship finalization failed' },
      { status: 500 }
    );
  }
}
