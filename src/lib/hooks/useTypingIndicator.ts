'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface TypingUser {
  userId: string;
  name: string;
}

interface UseTypingIndicatorOptions {
  roomId: string;
  enabled?: boolean;
  userId?: string;
  userName?: string;
  /** Debounce delay in ms before untracking (default: 2000) */
  debounceMs?: number;
}

interface UseTypingIndicatorReturn {
  typingUsers: TypingUser[];
  /** Call when user starts/continues typing */
  onTyping: () => void;
  /** Call when user explicitly stops typing (e.g. sends message) */
  onStopTyping: () => void;
  typingLabel: string;
}

/**
 * Typing indicator hook using Supabase Presence.
 *
 * Architecture:
 * - Subscribes to presence channel: room:<roomId>:typing
 * - track({ userId, name }) when user types
 * - untrack() after debounce timeout or explicit stop
 * - typingUsers = all currently tracked users EXCEPT self
 */
export function useTypingIndicator({
  roomId,
  enabled = true,
  userId,
  userName = 'Someone',
  debounceMs = 2000,
}: UseTypingIndicatorOptions): UseTypingIndicatorReturn {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTrackingRef = useRef(false);

  useEffect(() => {
    if (!enabled || !roomId || !userId) return;

    const supabase = createClient();

    const setup = async () => {
      await supabase.realtime.setAuth();

      const channel = supabase.channel(`room:${roomId}:typing`, {
        config: {
          presence: { key: userId },
        },
      });

      channel
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState<{ userId: string; name: string }>();
          const users: TypingUser[] = [];
          for (const presenceKey of Object.keys(state)) {
            const entries = state[presenceKey];
            for (const entry of entries) {
              // Exclude self
              if (entry.userId && entry.userId !== userId) {
                users.push({ userId: entry.userId, name: entry.name ?? 'Someone' });
              }
            }
          }
          setTypingUsers(users);
        })
        .subscribe();

      channelRef.current = channel;
    };

    setup();

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (channelRef.current) {
        const supabase = createClient();
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        isTrackingRef.current = false;
      }
    };
  }, [roomId, enabled, userId]);

  const onTyping = useCallback(() => {
    if (!channelRef.current || !userId) return;

    // Track presence (idempotent — Supabase handles re-track gracefully)
    if (!isTrackingRef.current) {
      channelRef.current.track({ userId, name: userName });
      isTrackingRef.current = true;
    }

    // Reset debounce timer
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      if (channelRef.current) {
        channelRef.current.untrack();
        isTrackingRef.current = false;
      }
    }, debounceMs);
  }, [userId, userName, debounceMs]);

  const onStopTyping = useCallback(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    if (channelRef.current && isTrackingRef.current) {
      channelRef.current.untrack();
      isTrackingRef.current = false;
    }
  }, []);

  // Build human-readable label
  const typingLabel =
    typingUsers.length === 0
      ? ''
      : typingUsers.length === 1
      ? `${typingUsers[0].name} is typing…`
      : typingUsers.length === 2
      ? `${typingUsers[0].name} and ${typingUsers[1].name} are typing…`
      : `${typingUsers[0].name} and ${typingUsers.length - 1} others are typing…`;

  return { typingUsers, onTyping, onStopTyping, typingLabel };
}
