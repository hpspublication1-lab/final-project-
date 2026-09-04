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

    // 1. Fetch Friends
    const { data: friendRows } = await supabaseAdmin
      .from('user_friends')
      .select('friend_id, created_at')
      .eq('user_id', userId);

    const friendIds = (friendRows || []).map((f) => f.friend_id);

    // Fetch friend profiles
    let friends: any[] = [];
    if (friendIds.length > 0) {
      const { data: profiles } = await supabaseAdmin
        .from('user_profiles')
        .select('id, full_name, battle_rating, college')
        .in('id', friendIds);

      // Fetch presence
      const { data: presenceRows } = await supabaseAdmin
        .from('user_presence')
        .select('*')
        .in('user_id', friendIds);

      const presenceMap = new Map((presenceRows || []).map((p) => [p.user_id, p]));

      friends = (profiles || []).map((p) => {
        const pres = presenceMap.get(p.id);
        const isRecent = pres?.last_heartbeat
          ? Date.now() - new Date(pres.last_heartbeat).getTime() < 45000
          : false;

        let status = 'offline';
        if (isRecent) {
          status = pres?.status || 'online';
        }

        return {
          id: p.id,
          full_name: p.full_name,
          battle_rating: p.battle_rating ?? 1000,
          college: p.college,
          status,
          current_room_id: pres?.current_room_id || null,
        };
      });
    }

    // 2. Fetch Friend Requests
    const { data: receivedReqs } = await supabaseAdmin
      .from('friend_requests')
      .select('id, sender_id, created_at')
      .eq('receiver_id', userId)
      .eq('status', 'pending');

    const senderIds = (receivedReqs || []).map((r) => r.sender_id);
    let pendingReceived: any[] = [];

    if (senderIds.length > 0) {
      const { data: senderProfiles } = await supabaseAdmin
        .from('user_profiles')
        .select('id, full_name, battle_rating, college')
        .in('id', senderIds);

      const profileMap = new Map((senderProfiles || []).map((sp) => [sp.id, sp]));

      pendingReceived = (receivedReqs || []).map((r) => ({
        requestId: r.id,
        sender: profileMap.get(r.sender_id) || { id: r.sender_id, full_name: 'Student' },
        createdAt: r.created_at,
      }));
    }

    // Sent requests
    const { data: sentReqs } = await supabaseAdmin
      .from('friend_requests')
      .select('id, receiver_id, created_at')
      .eq('sender_id', userId)
      .eq('status', 'pending');

    const receiverIds = (sentReqs || []).map((r) => r.receiver_id);
    let pendingSent: any[] = [];

    if (receiverIds.length > 0) {
      const { data: recProfiles } = await supabaseAdmin
        .from('user_profiles')
        .select('id, full_name, battle_rating, college')
        .in('id', receiverIds);

      const profileMap = new Map((recProfiles || []).map((rp) => [rp.id, rp]));

      pendingSent = (sentReqs || []).map((r) => ({
        requestId: r.id,
        receiver: profileMap.get(r.receiver_id) || { id: r.receiver_id, full_name: 'Student' },
        createdAt: r.created_at,
      }));
    }

    return NextResponse.json({
      friends,
      pendingReceived,
      pendingSent,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch friends' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, userId, targetUserId, requestId } = body;
    const targetUid = targetUserId || body.target_user_id || body.user || body.receiver_id;

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    if (action === 'send_request') {
      if (!targetUid) {
        return NextResponse.json({ error: 'Target user UID required' }, { status: 400 });
      }

      // Check if already requested or friends
      const { data: existing } = await supabaseAdmin
        .from('friend_requests')
        .select('*')
        .or(`and(sender_id.eq.${userId},receiver_id.eq.${targetUid}),and(sender_id.eq.${targetUid},receiver_id.eq.${userId})`)
        .eq('status', 'pending')
        .maybeSingle();

      if (existing) {
        return NextResponse.json({ success: true, message: 'Friend request already pending', requestId: existing.id });
      }

      const { data: newReq, error: insertErr } = await supabaseAdmin
        .from('friend_requests')
        .insert({ sender_id: userId, receiver_id: targetUid, status: 'pending' })
        .select()
        .single();

      if (insertErr) {
        return NextResponse.json({ error: insertErr.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: 'Friend request sent successfully', requestId: newReq?.id });
    }

    if (action === 'accept_request') {
      const { data: reqItem } = await supabaseAdmin
        .from('friend_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (reqItem) {
        await supabaseAdmin
          .from('friend_requests')
          .update({ status: 'accepted', updated_at: new Date().toISOString() })
          .eq('id', requestId);

        await supabaseAdmin.from('user_friends').insert([
          { user_id: reqItem.sender_id, friend_id: reqItem.receiver_id },
          { user_id: reqItem.receiver_id, friend_id: reqItem.sender_id },
        ]);
      }

      return NextResponse.json({ success: true, message: 'Friend request accepted' });
    }

    if (action === 'decline_request') {
      await supabaseAdmin
        .from('friend_requests')
        .update({ status: 'declined', updated_at: new Date().toISOString() })
        .eq('id', requestId);

      return NextResponse.json({ success: true, message: 'Friend request declined' });
    }

    if (action === 'cancel_request') {
      await supabaseAdmin
        .from('friend_requests')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', requestId);

      return NextResponse.json({ success: true, message: 'Friend request cancelled' });
    }

    if (action === 'remove_friend') {
      await supabaseAdmin
        .from('user_friends')
        .delete()
        .or(`and(user_id.eq.${userId},friend_id.eq.${targetUid}),and(user_id.eq.${targetUid},friend_id.eq.${userId})`);

      return NextResponse.json({ success: true, message: 'Friend removed' });
    }

    if (action === 'block_user') {
      await supabaseAdmin
        .from('user_blocks')
        .insert({ blocker_id: userId, blocked_id: targetUid });

      await supabaseAdmin
        .from('user_friends')
        .delete()
        .or(`and(user_id.eq.${userId},friend_id.eq.${targetUid}),and(user_id.eq.${targetUid},friend_id.eq.${userId})`);

      return NextResponse.json({ success: true, message: 'User blocked' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Action failed' }, { status: 500 });
  }
}
