import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/video/sign?video=<video_lectures.id>
 *
 * Returns a short-lived, token-authenticated Bunny playback URL for a video,
 * so premium lecture links can't be shared outside the app. Uses Bunny's CDN
 * Token Authentication: token = base64url( sha256( securityKey + path + expires ) ),
 * appended as ?token=...&expires=...
 *
 * Setup (Bunny dashboard): Stream library → your CDN/pull zone → enable
 * "Token Authentication", copy the Token Authentication Key into
 * BUNNY_TOKEN_KEY. If not configured, this returns the raw URL (soft launch).
 *
 * Entitlement: free videos sign for any signed-in user; premium videos require
 * an active paid plan (mirrors the app's premium gating).
 */
export async function GET(request: NextRequest) {
  try {
    const videoId = request.nextUrl.searchParams.get('video');
    if (!videoId) return NextResponse.json({ error: 'Missing video id' }, { status: 400 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Sign in to watch videos' }, { status: 401 });

    const { data: video } = await supabase
      .from('video_lectures')
      .select('id, video_url, is_premium, is_active')
      .eq('id', videoId)
      .maybeSingle();

    if (!video || !video.is_active || !video.video_url) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    // Premium entitlement check (server-side; do not trust the client).
    if (video.is_premium) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('subscription_plan, subscription_expires_at, is_admin')
        .eq('id', user.id)
        .single();
      const paid =
        profile?.is_admin === true ||
        (profile?.subscription_plan && profile.subscription_plan !== 'free' &&
          (!profile.subscription_expires_at || new Date(profile.subscription_expires_at) > new Date()));
      if (!paid) {
        return NextResponse.json({ error: 'Upgrade to Pro to watch this lecture' }, { status: 403 });
      }
    }

    const tokenKey = process.env.BUNNY_TOKEN_KEY;
    const url = new URL(video.video_url);

    // Not a Bunny URL, or signing not configured → return the URL as-is.
    if (!tokenKey || !url.hostname.endsWith('.b-cdn.net')) {
      return NextResponse.json({ url: video.video_url, signed: false });
    }

    // Bunny directory token: sign the folder so the player can fetch the
    // playlist AND its segment files with the same token.
    const dirPath = url.pathname.substring(0, url.pathname.lastIndexOf('/') + 1); // e.g. /{guid}/
    const expires = Math.floor(Date.now() / 1000) + 60 * 60 * 4; // 4 hours

    const hashBase = tokenKey + dirPath + expires;
    const token = crypto
      .createHash('sha256')
      .update(hashBase)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const signedUrl = `${url.origin}${url.pathname}?token=${token}&expires=${expires}&token_path=${encodeURIComponent(dirPath)}`;
    return NextResponse.json({ url: signedUrl, signed: true, expires });
  } catch (err) {
    console.error('video/sign error:', err);
    return NextResponse.json({ error: 'Could not sign video URL' }, { status: 500 });
  }
}
