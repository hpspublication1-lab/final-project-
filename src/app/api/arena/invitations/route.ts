import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { enforceRateLimit } from '@/lib/security/rateLimiter';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const rl = await enforceRateLimit(req, 'api');
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429, headers: { 'Retry-After': String(rl.resetSeconds) } }
      );
    }

    const supabase = await createServerClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
    }

    const userId = user.id; // Strictly authoritative
    const admin = createAdminClient();
    if (!admin) {
      return NextResponse.json({ error: 'Database service unavailable' }, { status: 500 });
    }

    // Fetch active pending invitations received
    const { data: invRows } = await admin
      .from('battle_invitations')
      .select('*')
      .eq('receiver_id', userId)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString());

    if (!invRows || invRows.length === 0) {
      return NextResponse.json({ invitations: [] });
    }

    const senderIds = invRows.map((inv: any) => inv.sender_id);
    const { data: senders } = await admin
      .from('user_profiles')
      .select('id, full_name, battle_rating, college')
      .in('id', senderIds);

    const senderMap = new Map((senders || []).map((s: any) => [s.id, s]));

    const invitations = invRows.map((inv: any) => ({
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

export async function POST(req: NextRequest) {
  try {
    const rl = await enforceRateLimit(req, 'api');
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429, headers: { 'Retry-After': String(rl.resetSeconds) } }
      );
    }

    const supabase = await createServerClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
    }

    const userId = user.id; // Strictly authoritative
    const admin = createAdminClient();
    if (!admin) {
      return NextResponse.json({ error: 'Database service unavailable' }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const { action, targetUserId, invitationId, subjectFilter = 'mixed' } = body;

    if (action === 'send_invite') {
      if (!targetUserId) {
        return NextResponse.json({ error: 'Target user ID required' }, { status: 400 });
      }

      // 1. Privacy & In-Match Check
      const { data: recPresence } = await admin
        .from('user_presence')
        .select('*')
        .eq('user_id', targetUserId)
        .maybeSingle();

      if (recPresence?.status === 'in_match') {
        return NextResponse.json({ success: false, message: 'This player is currently in a match' });
      }

      // Expire previous invites
      await admin
        .from('battle_invitations')
        .update({ status: 'expired', updated_at: new Date().toISOString() })
        .eq('sender_id', userId)
        .eq('receiver_id', targetUserId)
        .eq('status', 'pending');

      const expiresAt = new Date(Date.now() + 60000).toISOString();

      const { data: inv, error: invError } = await admin
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
      if (!invitationId) {
        return NextResponse.json({ error: 'Invitation ID required' }, { status: 400 });
      }

      // Execute atomic match room creation
      const { data: rpcData, error: rpcError } = await admin.rpc('respond_battle_invitation', {
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
      const { data: inv } = await admin
        .from('battle_invitations')
        .select('*')
        .eq('id', invitationId)
        .single();

      if (!inv || inv.status !== 'pending') {
        return NextResponse.json({ success: false, message: 'Invitation has expired or is no longer valid' });
      }

      // Verify caller is the intended recipient
      if (inv.receiver_id !== userId) {
        return NextResponse.json({ error: 'Forbidden: You are not the recipient of this invitation' }, { status: 403 });
      }

      // Fetch questions
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

      await admin.from('room_members').insert([
        { room_id: room.id, user_id: inv.sender_id },
        { room_id: room.id, user_id: userId },
      ]);

      await admin
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
      if (!invitationId) {
        return NextResponse.json({ error: 'Invitation ID required' }, { status: 400 });
      }

      await admin
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
