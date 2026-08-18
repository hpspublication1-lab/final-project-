'use client';

import { useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

/** Reserved sentinel author value that marks a `messages` row as a live
 * battle-progress ping rather than a real chat message. */
export const BATTLE_PROGRESS_AUTHOR = '__battle_progress__';

export interface BattleProgressPayload {
  questionIndex: number;
  score: number;
  correctCount: number;
  finished?: boolean;
}

interface UseBattleProgressOptions {
  roomId: string;
  enabled?: boolean;
  userId?: string;
  onOpponentProgress: (fromUserId: string, payload: BattleProgressPayload) => void;
}

/**
 * Broadcasts and receives live battle progress (current question index,
 * running score) between the two players in a battle room.
 *
 * Reuses the exact same public.messages broadcast trigger + membership-
 * scoped Realtime RLS as the room chat (see useRealtimeChat) — no new
 * table or Realtime authorization policy needed — but tags rows with a
 * reserved author sentinel so useRealtimeChat can filter them out of the
 * visible chat log while this hook picks them out for the live opponent
 * score/progress display.
 */
export function useBattleProgress({
  roomId,
  enabled = true,
  userId,
  onOpponentProgress,
}: UseBattleProgressOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const onProgressRef = useRef(onOpponentProgress);
  onProgressRef.current = onOpponentProgress;

  useEffect(() => {
    if (!enabled || !roomId) return;

    const supabase = createClient();

    const setup = async () => {
      await supabase.realtime.setAuth();

      const channel = supabase.channel(`room:${roomId}:messages`, {
        config: { private: true },
      });

      channel
        .on('broadcast', { event: 'INSERT' }, ({ payload }) => {
          const record = payload?.record ?? payload;
          if (!record || record.author !== BATTLE_PROGRESS_AUTHOR) return;
          if (record.user_id === userId) return; // ignore our own echo

          try {
            const parsed = JSON.parse(record.body) as BattleProgressPayload;
            onProgressRef.current(record.user_id as string, parsed);
          } catch {
            // ignore malformed progress payloads
          }
        })
        .subscribe();

      channelRef.current = channel;
    };

    setup();

    return () => {
      if (channelRef.current) {
        const supabase = createClient();
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [roomId, enabled, userId]);

  const sendProgress = useCallback(
    async (payload: BattleProgressPayload) => {
      if (!userId || !roomId) return;
      const supabase = createClient();
      await supabase.from('messages').insert({
        room_id: roomId,
        user_id: userId,
        body: JSON.stringify(payload),
        author: BATTLE_PROGRESS_AUTHOR,
      });
    },
    [roomId, userId]
  );

  return { sendProgress };
}
