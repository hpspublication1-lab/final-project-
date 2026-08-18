-- ============================================================
-- Migration: live-class streaming source (broadcast to thousands)
-- Timestamp: 20260722030000
-- ============================================================
-- To deliver a live class to 1,500–2,000+ students you broadcast ONE
-- stream to many viewers over a CDN (HLS), rather than a video call.
-- These columns let a class carry either an HLS playback URL (.m3u8
-- from Cloudflare Stream / Mux / self-hosted) or a YouTube Live source.
-- The in-app player (LiveStreamPlayer) reads them; chat/Q&A stays on the
-- existing Supabase Realtime layer.
-- ============================================================

ALTER TABLE public.live_classes
  ADD COLUMN IF NOT EXISTS stream_provider TEXT
    CHECK (stream_provider IS NULL OR stream_provider IN ('youtube', 'hls', 'zoom')),
  ADD COLUMN IF NOT EXISTS playback_url TEXT;

COMMENT ON COLUMN public.live_classes.stream_provider IS
  'youtube = YouTube Live (playback_url holds the video id or url); hls = adaptive HLS (.m3u8 playback url); zoom = external meeting (uses meeting_url).';
COMMENT ON COLUMN public.live_classes.playback_url IS
  'For stream_provider=youtube: the YouTube video/stream id or url. For hls: the .m3u8 URL from your streaming provider.';
