'use client';

import { useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface RoomMessage {
  id: string;
  message: string;
  user_id: string;
  author: string;
  authorInitial: string;
  timestamp: string;
}

interface UseRoomChannelOptions {
  roomId: string;
  enabled?: boolean;
  onMessage: (msg: RoomMessage) => void;
}

/**
 * Subscribes to a private Supabase Realtime broadcast channel for a room.
 * Topic format: room:<roomId>:messages
 * Uses config: { private: true } + setAuth() for authenticated private channels.
 * Broadcasts event: 'message_created'
 */
export function useRoomChannel({ roomId, enabled = true, onMessage }: UseRoomChannelOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const sendMessage = useCallback(
    async (message: string, userId: string, author: string) => {
      if (!channelRef.current) return;
      await channelRef.current.send({
        type: 'broadcast',
        event: 'message_created',
        payload: {
          id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          message,
          user_id: userId,
          author,
          authorInitial: author.charAt(0).toUpperCase(),
          timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        } satisfies RoomMessage,
      });
    },
    []
  );

  useEffect(() => {
    if (!enabled || !roomId) return;

    const supabase = createClient();

    const setup = async () => {
      // setAuth() is required for private channels — uses the current session token
      await supabase.realtime.setAuth();

      const channel = supabase.channel(`room:${roomId}:messages`, {
        config: { private: true },
      });

      channel
        .on('broadcast', { event: 'message_created' }, ({ payload }) => {
          if (payload) {
            onMessageRef.current(payload as RoomMessage);
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
  }, [roomId, enabled]);

  return { sendMessage };
}
