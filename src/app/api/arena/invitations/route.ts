import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Fetch active pending invitations received
    const { data: invRows } = await supabaseAdmin
      .from('battle_invitations')
      .select('*')
      .eq('receiver_id', userId)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString());

    if (!invRows || invRows.length === 0) {
      return NextResponse.json({ invitations: [] });
    }

    const senderIds = invRows.map((inv) => inv.sender_id);
    const { data: senders } = await supabaseAdmin
      .from('user_profiles')
      .select('id, full_name, battle_rating, college')
      .in('id', senderIds);

    const senderMap = new Map((senders || []).map((s) => [s.id, s]));

    const invitations = invRows.map((inv) => ({
      id: inv.id,
      sender: senderMap.get(inv.sender_id) || { id: inv.sender_id, full_name: 'Student' },
      subjectFilter: inv.subject_filter,
      expiresAt: inv.expires_at,
    }));

    return NextResponse.json({ invitations });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch invitations' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, userId, targetUserId, invitationId, subjectFilter = 'mixed' } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    if (action === 'send_invite') {
      // 1. Privacy & In-Match Check
      const { data: recPresence } = await supabaseAdmin
        .from('user_presence')
        .select('*')
        .eq('user_id', targetUserId)
        .maybeSingle();

      if (recPresence?.status === 'in_match') {
        return NextResponse.json({ success: false, message: 'This player is currently in a match' });
      }

      // Expire previous invites
      await supabaseAdmin
        .from('battle_invitations')
        .update({ status: 'expired', updated_at: new Date().toISOString() })
        .eq('sender_id', userId)
        .eq('receiver_id', targetUserId)
        .eq('status', 'pending');

      const expiresAt = new Date(Date.now() + 60000).toISOString();

      const { data: inv, error: invError } = await supabaseAdmin
        .from('battle_invitations')
        .insert({
          sender_id: userId,
          receiver_id: targetUserId,
          subject_filter: subjectFilter,
          status: 'pending',
          expires_at: expiresAt,
        })
        .select()
        .single();

      if (invError) {
        return NextResponse.json({ error: invError.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'Battle invitation sent',
        invitationId: inv.id,
      });
    }

    if (action === 'accept_invite') {
      // Execute atomic match room creation
      const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc('respond_battle_invitation', {
        p_invitation_id: invitationId,
        p_action: 'accept',
      });

      if (!rpcError && rpcData && rpcData.length > 0) {
        const res = rpcData[0];
        if (res.success && res.room_id) {
          return NextResponse.json({
            success: true,
            roomId: res.room_id,
            message: 'Invitation accepted',
          });
        }
      }

      // Fallback match room creation
      const { data: inv } = await supabaseAdmin
        .from('battle_invitations')
        .select('*')
        .eq('id', invitationId)
        .single();

      if (!inv || inv.status !== 'pending') {
        return NextResponse.json({ success: false, message: 'Invitation has expired or is no longer valid' });
      }

      // Fetch questions
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
          creator_id: inv.sender_id,
          opponent_id: userId,
          status: 'in_progress',
          question_count: Math.max(questionIds.length, 1),
          time_limit_seconds: 300,
          question_ids: questionIds,
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (roomError || !room) {
        return NextResponse.json({ success: false, message: 'Failed to create battle room' });
      }

      await supabaseAdmin.from('room_members').insert([
        { room_id: room.id, user_id: inv.sender_id },
        { room_id: room.id, user_id: userId },
      ]);

      await supabaseAdmin
        .from('battle_invitations')
        .update({ status: 'accepted', matched_room_id: room.id, updated_at: new Date().toISOString() })
        .eq('id', invitationId);

      return NextResponse.json({
        success: true,
        roomId: room.id,
        message: 'Invitation accepted',
      });
    }

    if (action === 'decline_invite') {
      await supabaseAdmin
        .from('battle_invitations')
        .update({ status: 'declined', updated_at: new Date().toISOString() })
        .eq('id', invitationId);

      return NextResponse.json({ success: true, message: 'Invitation declined' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Invitation request failed' }, { status: 500 });
  }
}
