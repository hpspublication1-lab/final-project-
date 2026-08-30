import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const videoId = request.nextUrl.searchParams.get('video');
    if (!videoId) return NextResponse.json({ error: 'Missing video id' }, { status: 400 });

    const admin = createAdminClient();
    if (!admin) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
    }

    const { data: video } = await admin
      .from('video_lectures')
      .select('id, video_url, is_premium, is_active')
      .eq('id', videoId)
      .maybeSingle();

    if (!video || !video.is_active || !video.video_url) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    const tokenKey = process.env.BUNNY_TOKEN_KEY;
    const url = new URL(video.video_url);

    // Not a Bunny URL, or signing not configured → return raw URL
    if (!tokenKey || !url.hostname.endsWith('.b-cdn.net')) {
      return NextResponse.json({ url: video.video_url, signed: false });
    }

    const dirPath = url.pathname.substring(0, url.pathname.lastIndexOf('/') + 1);
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
