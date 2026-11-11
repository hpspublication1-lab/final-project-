import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { enforceRateLimit } from '@/lib/security/rateLimiter';
import { blockSensitiveActionDuringImpersonation } from '@/lib/auth/impersonationGuard';

export const dynamic = 'force-dynamic';

export const MULTIPLAYER_SECRET =
  process.env.MULTIPLAYER_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'samyak_colyseus_multiplayer_secret_key_2026';

export const TICKET_EXPIRY_SECONDS = 60; // 60 seconds TTL

export interface MultiplayerTicketPayload {
  sub?: string;
  userId: string;
  email: string;
  fullName: string;
  rating: number;
  gameMode: string;
  matchId?: string;
  roomCode?: string;
  scope?: string;
  roomType?: string;
  nonce: string;
  iat: number;
  exp: number;
}

/**
 * POST /api/arena/auth/ticket
 * Issues a cryptographically signed, short-lived (60s) multiplayer access ticket.
 * 
 * 1. Enforces rate limits against ticket spam.
 * 2. Authenticates student via authoritative Supabase session.
 * 3. Prevents administrators in Ghost Mode from taking student seats.
 * 4. Validates match authorization if matchId is supplied.
 * 5. Generates single-use nonce for replay protection.
 * 6. Returns signed JWT and WebSocket connection endpoint.
 */
export async function POST(req: NextRequest) {
  try {
    // 0. Rate limiting check
    const rl = await enforceRateLimit(req, 'auth');
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many ticket requests. Please wait a moment.' },
        { status: 429, headers: { 'Retry-After': String(rl.resetSeconds) } }
      );
    }

    // 1. Impersonation Guard: Admins in Ghost Mode cannot play multiplayer battles as students
    const impCheck = await blockSensitiveActionDuringImpersonation(req, 'enter_multiplayer_battle');
    if (impCheck) return impCheck;

    // 2. Authoritative Supabase user authentication
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json(
        { error: 'Unauthorized: Valid student session required' },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { gameMode = 'ranked_1v1', roomCode, matchId } = body;

    const admin = createAdminClient();

    // 3. If matchId is specified, assert that the student is an authorized participant
    if (matchId && admin) {
      const { data: room, error: rErr } = await admin
        .from('battle_rooms')
        .select('id, creator_id, opponent_id, status')
        .eq('id', matchId)
        .maybeSingle();

      if (room && room.creator_id !== user.id && room.opponent_id !== user.id && room.status !== 'waiting') {
        return NextResponse.json(
          { error: 'Forbidden: You are not authorized to join this match' },
          { status: 403 }
        );
      }
    }

    // 4. Fetch authoritative player profile (rating, name)
    let fullName = user.user_metadata?.full_name || 'Student';
    let battleRating = 1000;

    if (admin) {
      const { data: profile } = await admin
        .from('user_profiles')
        .select('full_name, battle_rating')
        .eq('id', user.id)
        .maybeSingle();

      if (profile) {
        if (profile.full_name) fullName = profile.full_name;
        if (typeof profile.battle_rating === 'number') battleRating = profile.battle_rating;
      }
    }

    // 5. Generate cryptographically random single-use nonce
    const nonce = `tic_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    const nowSec = Math.floor(Date.now() / 1000);

    const payload: MultiplayerTicketPayload = {
      sub: user.id,
      userId: user.id,
      email: user.email || '',
      fullName,
      rating: battleRating,
      gameMode,
      matchId: matchId || undefined,
      roomCode: roomCode ? String(roomCode).toUpperCase().trim() : (matchId || undefined),
      scope: 'arena:join',
      roomType: 'quiz_battle',
      nonce,
      iat: nowSec,
      exp: nowSec + TICKET_EXPIRY_SECONDS,
    };

    // 5. Sign JWT ticket with server-side secret
    const ticket = jwt.sign(payload, MULTIPLAYER_SECRET, { algorithm: 'HS256' });

    const wsEndpoint =
      process.env.NEXT_PUBLIC_MULTIPLAYER_WS_URL ||
      process.env.MULTIPLAYER_WS_URL ||
      'ws://localhost:2567';

    return NextResponse.json({
      success: true,
      ticket,
      wsEndpoint,
      expiresInSeconds: TICKET_EXPIRY_SECONDS,
      player: {
        id: user.id,
        fullName,
        rating: battleRating,
      },
    });
  } catch (err: any) {
    console.error('[MultiplayerTicket] Error issuing ticket:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to issue multiplayer ticket' },
      { status: 500 }
    );
  }
}
