'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Live-class presence + emoji reactions on Supabase Realtime.
 *
 * - Attendance: presence channel `class:{id}:presence` — every viewer tracks
 *   themselves; the sync'd presence state size = real "N watching" count.
 * - Reactions: broadcast channel `class:{id}:react` — fire-and-forget emoji,
 *   client-side throttled so 2,000 students can't flood the channel.
 *
 * Non-private channels (no RLS topics needed) — attendance counts and emoji
 * bursts aren't sensitive data. Chat stays on its authorized private channel.
 */

export function useLiveAttendance({ classId, enabled, userId }: { classId: string; enabled: boolean; userId?: string }) {
  const [viewerCount, setViewerCount] = useState(0);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!enabled || !classId) return;
    const supabase = createClient();
    const channel = supabase.channel(`class:${classId}:presence`, {
      config: { presence: { key: userId ?? `anon-${Math.random().toString(36).slice(2, 9)}` } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        setViewerCount(Object.keys(channel.presenceState()).length);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') channel.track({ at: Date.now() });
      });

    channelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
      setViewerCount(0);
    };
  }, [classId, enabled, userId]);

  return { viewerCount };
}

export interface FloatingReaction {
  id: string;
  emoji: string;
  /** Random horizontal offset (0–100) so floaters don't stack. */
  x: number;
}

const REACTION_THROTTLE_MS = 1200;

export function useLiveReactions({ classId, enabled }: { classId: string; enabled: boolean }) {
  const [floaters, setFloaters] = useState<FloatingReaction[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const lastSentRef = useRef(0);

  const pushFloater = useCallback((emoji: string) => {
    const f: FloatingReaction = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, emoji, x: 8 + Math.random() * 84 };
    setFloaters((prev) => [...prev.slice(-24), f]); // cap on-screen floaters
    setTimeout(() => setFloaters((prev) => prev.filter((p) => p.id !== f.id)), 2600);
  }, []);

  useEffect(() => {
    if (!enabled || !classId) return;
    const supabase = createClient();
    const channel = supabase.channel(`class:${classId}:react`);

    channel
      .on('broadcast', { event: 'reaction' }, ({ payload }) => {
        if (payload?.emoji && typeof payload.emoji === 'string') pushFloater(payload.emoji.slice(0, 4));
      })
      .subscribe();

    channelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [classId, enabled, pushFloater]);

  const sendReaction = useCallback((emoji: string) => {
    const now = Date.now();
    if (now - lastSentRef.current < REACTION_THROTTLE_MS) {
      pushFloater(emoji); // still show locally so it feels responsive
      return;
    }
    lastSentRef.current = now;
    pushFloater(emoji);
    channelRef.current?.send({ type: 'broadcast', event: 'reaction', payload: { emoji } });
  }, [pushFloater]);

  return { floaters, sendReaction };
}
