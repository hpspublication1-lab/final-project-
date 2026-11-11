import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// In-memory ultra-fast presence registry (sub-millisecond heartbeat)
const memoryPresence = new Map<string, { status: string; roomId: string | null; lastHeartbeat: number }>();

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { userId, status = 'online', roomId = null } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Instant in-memory registry update
    const now = Date.now();
    memoryPresence.set(String(userId), {
      status,
      roomId,
      lastHeartbeat: now,
    });

    // Clean stale entries (> 5 min)
    if (memoryPresence.size > 2000) {
      const cutoff = now - 5 * 60 * 1000;
      for (const [k, v] of memoryPresence.entries()) {
        if (v.lastHeartbeat < cutoff) memoryPresence.delete(k);
      }
    }

    // Non-blocking background sync to database if admin client is available
    const admin = createAdminClient();
    if (admin) {
      Promise.resolve(
        admin
          .from('user_presence')
          .upsert(
            {
              user_id: userId,
              status,
              current_room_id: roomId,
              last_heartbeat: new Date(now).toISOString(),
            },
            { onConflict: 'user_id' }
          )
      )
        .then(() => {})
        .catch(() => {});
    }

    return NextResponse.json({ success: true, status });
  } catch {
    // Fail-safe: presence heartbeat should never fail client requests
    return NextResponse.json({ success: true, status: 'online' });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (userId) {
      const entry = memoryPresence.get(userId);
      const isOnline = entry ? Date.now() - entry.lastHeartbeat < 60_000 : false;
      return NextResponse.json({
        userId,
        status: isOnline ? (entry?.status || 'online') : 'offline',
        currentRoomId: isOnline ? entry?.roomId : null,
      });
    }

    return NextResponse.json({
      onlineCount: Array.from(memoryPresence.values()).filter(
        (v) => Date.now() - v.lastHeartbeat < 60_000
      ).length,
    });
  } catch {
    return NextResponse.json({ onlineCount: 0 });
  }
}
