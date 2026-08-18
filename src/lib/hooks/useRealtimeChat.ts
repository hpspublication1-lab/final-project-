'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface ChatMessage {
  id: string;
  room_id: string;
  user_id: string;
  body: string;
  author: string;
  created_at: string;
  /** Derived display fields */
  authorInitial: string;
  timestamp: string;
}

interface UseRealtimeChatOptions {
  roomId: string;
  enabled?: boolean;
  userId?: string;
  authorName?: string;
}

interface UseRealtimeChatReturn {
  messages: ChatMessage[];
  sendMessage: (body: string) => Promise<void>;
  isConnected: boolean;
}

/**
 * Realtime chat hook using Supabase Broadcast private channels.
 *
 * Architecture:
 * - Subscribes to private channel: room:<roomId>:messages
 * - Listens for 'broadcast' events with event name 'INSERT' (emitted by the
 *   broadcast_message_changes() trigger on public.messages)
 * - Sends messages by INSERTing into public.messages (trigger auto-broadcasts)
 * - Own messages are added optimistically; duplicates from broadcast are deduped
 */
export function useRealtimeChat({
  roomId,
  enabled = true,
  userId,
  authorName = 'You',
}: UseRealtimeChatOptions): UseRealtimeChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const seenIdsRef = useRef<Set<string>>(new Set());

  const addMessage = useCallback((msg: ChatMessage) => {
    if (seenIdsRef.current.has(msg.id)) return;
    seenIdsRef.current.add(msg.id);
    setMessages((prev) => [...prev, msg]);
  }, []);

  // Subscribe to broadcast channel
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
          // Payload from realtime.broadcast_changes trigger:
          // { type: 'broadcast', event: 'INSERT', payload: { record: {...} } }
          const record = payload?.record ?? payload;
          if (!record?.id) return;
          // Battle-progress pings share this same table/channel (see
          // useBattleProgress) but must never show up as chat bubbles.
          if (record.author === '__battle_progress__') return;

          const msg: ChatMessage = {
            id: record.id,
            room_id: record.room_id ?? roomId,
            user_id: record.user_id ?? '',
            body: record.body ?? '',
            author: record.author ?? 'Unknown',
            created_at: record.created_at ?? new Date().toISOString(),
            authorInitial: (record.author ?? 'U').charAt(0).toUpperCase(),
            timestamp: new Date(record.created_at ?? Date.now()).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            }),
          };
          addMessage(msg);
        })
        .subscribe((status) => {
          setIsConnected(status === 'SUBSCRIBED');
        });

      channelRef.current = channel;
    };

    setup();

    return () => {
      if (channelRef.current) {
        const supabase = createClient();
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        setIsConnected(false);
      }
    };
  }, [roomId, enabled, addMessage]);

  const sendMessage = useCallback(
    async (body: string) => {
      if (!body.trim() || !userId) return;

      const supabase = createClient();
      const tempId = `opt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

      // Optimistic insert (shown immediately, deduped when broadcast arrives)
      const optimistic: ChatMessage = {
        id: tempId,
        room_id: roomId,
        user_id: userId,
        body: body.trim(),
        author: authorName,
        created_at: new Date().toISOString(),
        authorInitial: authorName.charAt(0).toUpperCase(),
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      };
      addMessage(optimistic);

      // Insert into DB — trigger will broadcast to all subscribers
      const { error } = await supabase.from('messages').insert({
        room_id: roomId,
        user_id: userId,
        body: body.trim(),
        author: authorName,
      });

      if (error) {
        // Remove optimistic message on failure
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        seenIdsRef.current.delete(tempId);
      }
    },
    [roomId, userId, authorName, addMessage]
  );

  return { messages, sendMessage, isConnected };
}
