export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@/lib/supabase/server';
import { isSuperAdmin } from '@/lib/config/superAdmin';

function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function sign100msJwt(
  accessKey: string,
  secretKey: string,
  roomId: string,
  role: string,
  userId: string
): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    access_key: accessKey,
    type: 'app',
    version: 2,
    role: role || 'guest',
    room_id: roomId,
    user_id: userId,
    iat: now,
    exp: now + 86400, // Valid for 24 hours
    jti: crypto.randomUUID(),
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  const signature = crypto
    .createHmac('sha256', secretKey)
    .update(signatureInput)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${signatureInput}.${signature}`;
}

/**
 * POST /api/100ms/token
 * Body: { roomId: string, role?: 'host' | 'teacher' | 'student' | 'guest' }
 *
 * Issues a signed 100ms auth token for joining an interactive WebRTC room.
 * Super admins / teachers get 'host' or 'teacher' role with full broadcast & mute permissions.
 * Students get 'student' or 'guest' role with audio/video/chat permissions.
 */
export async function POST(request: NextRequest) {
  try {
    const { roomId, role: requestedRole } = await request.json();

    if (!roomId || typeof roomId !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid roomId' }, { status: 400 });
    }

    const accessKey = process.env.HMS_APP_ACCESS_KEY;
    const secretKey = process.env.HMS_APP_SECRET;

    if (!accessKey || !secretKey) {
      return NextResponse.json(
        { error: '100ms credentials not configured on server' },
        { status: 503 }
      );
    }

    // Determine user role and identity
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const isHost = user?.email && isSuperAdmin(user.email);
    let role = requestedRole || (isHost ? 'host' : 'guest');

    // Force host role for super admins
    if (isHost && (requestedRole === 'host' || requestedRole === 'teacher')) {
      role = requestedRole;
    } else if (!isHost && (role === 'host' || role === 'teacher')) {
      // Non-admins cannot claim host/teacher role
      role = 'guest';
    }

    const userId = user?.id || `guest_${crypto.randomBytes(4).toString('hex')}`;
    const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Student';

    const token = sign100msJwt(accessKey, secretKey, roomId.trim(), role, userId);

    return NextResponse.json({
      token,
      roomId: roomId.trim(),
      role,
      userId,
      userName,
    });
  } catch (err: any) {
    console.error('100ms token generation error:', err);
    return NextResponse.json(
      { error: err?.message || 'Could not generate room token' },
      { status: 500 }
    );
  }
}
