import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { enforceRateLimit } from '@/lib/security/rateLimiter';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // 0. Rate limiting
    const rl = await enforceRateLimit(req, 'api');
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many matchmaking attempts. Please wait.' },
        { status: 429, headers: { 'Retry-After': String(rl.resetSeconds) } }
      );
    }

    // 1. Authoritative Session Verification - Never trust body.userId
    const supabase = await createServerClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json(
        { error: 'Unauthorized: Valid student session required' },
        { status: 401 }
      );
    }

    const userId = user.id; // Authoritative ID derived strictly from verified JWT
    const admin = createAdminClient();
    if (!admin) {
      return NextResponse.json({ error: 'Database service unavailable' }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const { action, queueMode = 'quick', subjectFilter = 'mixed' } = body;

    if (action === 'cancel') {
      await admin
        .from('matchmaking_queue')
        .update({ status: 'cancelled' })
        .eq('player_id', userId)
        .eq('status', 'searching');

      return NextResponse.json({ success: true, status: 'cancelled' });
    }

    // 2. Fetch authoritative rating from user_profiles
    const { data: profile } = await admin
      .from('user_profiles')
      .select('battle_rating')
      .eq('id', userId)
      .maybeSingle();

    const playerRating = profile?.battle_rating || 1000;

    // 3. Try atomic database RPC first
    const { data: rpcData, error: rpcError } = await admin.rpc('find_or_create_battle_match', {
      p_queue_mode: queueMode,
      p_subject_filter: subjectFilter,
    });

    if (!rpcError && rpcData && rpcData.length > 0) {
      const matchResult = rpcData[0];
      return NextResponse.json({
        success: true,
        matched: matchResult.matched,
        roomId: matchResult.room_id,
        queueId: matchResult.queue_id,
      });
    }

    // 4. Server-side Fallback matching logic (if RPC unavailable during migration)
    // Clear old searching entries
    await admin
      .from('matchmaking_queue')
      .update({ status: 'cancelled' })
      .eq('player_id', userId)
      .eq('status', 'searching');

    // Look for an existing searching candidate
    const { data: candidates } = await admin
      .from('matchmaking_queue')
      .select('*')
      .eq('status', 'searching')
      .neq('player_id', userId)
      .order('joined_at', { ascending: true })
      .limit(1);

    if (candidates && candidates.length > 0) {
      const opponent = candidates[0];
      
      // Fetch random questions
      const { data: qData } = await admin
        .from('questions')
        .select('id')
        .eq('is_active', true)
        .limit(10);

      const questionIds = (qData || []).map((q: any) => q.id);
      const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      const { data: room, error: roomError } = await admin
        .from('battle_rooms')
        .insert({
          room_code: roomCode,
          creator_id: opponent.player_id,
          opponent_id: userId,
          status: 'in_progress',
          question_count: Math.max(questionIds.length, 1),
          time_limit_seconds: 300,
          question_ids: questionIds,
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (!roomError && room) {
        // Mark both queued
        await admin
          .from('matchmaking_queue')
          .update({ status: 'matched', matched_room_id: room.id, matched_at: new Date().toISOString() })
          .eq('id', opponent.id);

        const { data: myQueue } = await admin
          .from('matchmaking_queue')
          .insert({
            player_id: userId,
            queue_mode: queueMode,
            player_rating: playerRating,
            subject_filter: subjectFilter,
            status: 'matched',
            matched_room_id: room.id,
            matched_at: new Date().toISOString(),
          })
          .select()
          .single();

        return NextResponse.json({
          success: true,
          matched: true,
          roomId: room.id,
          queueId: myQueue?.id || room.id,
        });
      }
    }

    // No opponent found yet -> Queue player
    const { data: myQueue } = await admin
      .from('matchmaking_queue')
      .insert({
        player_id: userId,
        queue_mode: queueMode,
        player_rating: playerRating,
        subject_filter: subjectFilter,
        status: 'searching',
      })
      .select()
      .single();

    return NextResponse.json({
      success: true,
      matched: false,
      roomId: null,
      queueId: myQueue?.id,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Matchmaking failed' }, { status: 500 });
  }
}
