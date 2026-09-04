import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, userId, queueMode = 'quick', subjectFilter = 'mixed' } = body;

    if (!userId) {
      return NextResponse.json({ error: 'Authoritative user ID required' }, { status: 400 });
    }

    if (action === 'cancel') {
      await supabaseAdmin
        .from('matchmaking_queue')
        .update({ status: 'cancelled' })
        .eq('player_id', userId)
        .eq('status', 'searching');

      return NextResponse.json({ success: true, status: 'cancelled' });
    }

    // 1. Try atomic database RPC first
    const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc('find_or_create_battle_match', {
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

    // 2. Server-side Fallback matching logic (if RPC unavailable during migration)
    // Clear old searching entries
    await supabaseAdmin
      .from('matchmaking_queue')
      .update({ status: 'cancelled' })
      .eq('player_id', userId)
      .eq('status', 'searching');

    // Look for an existing searching candidate
    const { data: candidates } = await supabaseAdmin
      .from('matchmaking_queue')
      .select('*')
      .eq('status', 'searching')
      .neq('player_id', userId)
      .order('joined_at', { ascending: true })
      .limit(1);

    if (candidates && candidates.length > 0) {
      const opponent = candidates[0];
      
      // Fetch random questions
      const { data: qData } = await supabaseAdmin
        .from('questions')
        .select('id')
        .eq('is_active', true)
        .limit(10);

      const questionIds = (qData || []).map((q) => q.id);
      const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      const { data: room, error: roomError } = await supabaseAdmin
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
        await supabaseAdmin
          .from('matchmaking_queue')
          .update({ status: 'matched', matched_room_id: room.id, matched_at: new Date().toISOString() })
          .eq('id', opponent.id);

        const { data: myQueue } = await supabaseAdmin
          .from('matchmaking_queue')
          .insert({
            player_id: userId,
            queue_mode: queueMode,
            player_rating: 1000,
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

    // No opponent found yet -> Queue player A
    const { data: myQueue } = await supabaseAdmin
      .from('matchmaking_queue')
      .insert({
        player_id: userId,
        queue_mode: queueMode,
        player_rating: 1000,
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
