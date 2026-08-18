import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/bunny/videos
 * 
 * Fetches all videos directly from Bunny Stream API library.
 * Returns video list with HLS playlist URLs, thumbnails, duration, and titles.
 */
export async function GET(request: NextRequest) {
  try {
    const libraryId = process.env.BUNNY_LIBRARY_ID || '379737';
    const apiKey = process.env.BUNNY_STREAM_API_KEY || 'a4fd2aae-2b48-4322-8352f0d513c5-79b9-4d81';
    const cdnHost = process.env.BUNNY_CDN_HOSTNAME || 'vz-11253e6e-275.b-cdn.net';
    const search = request.nextUrl.searchParams.get('search') || '';
    const page = request.nextUrl.searchParams.get('page') || '1';
    const limit = request.nextUrl.searchParams.get('limit') || '100';

    if (!libraryId || !apiKey) {
      return NextResponse.json({ error: 'Bunny configuration missing' }, { status: 500 });
    }

    let url = `https://video.bunnycdn.com/library/${libraryId}/videos?page=${page}&itemsPerPage=${limit}`;
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }

    const bunnyRes = await fetch(url, {
      headers: {
        'AccessKey': apiKey,
        'accept': 'application/json',
      },
      next: { revalidate: 60 } // cache for 60s
    });

    if (!bunnyRes.ok) {
      const errText = await bunnyRes.text();
      return NextResponse.json({ error: `Bunny API error: ${errText}` }, { status: bunnyRes.status });
    }

    const data = await bunnyRes.json();
    const items = (data.items || []).map((v: any) => {
      const guid = v.guid;
      const cleanTitle = (v.title || 'Untitled Video').replace(/\.mp4$/i, '').trim();
      return {
        id: guid,
        guid: guid,
        title: cleanTitle,
        description: v.description || '',
        duration: Math.round(v.length || 0),
        durationSec: Math.round(v.length || 0),
        thumbnailUrl: v.thumbnailUrl || `https://${cdnHost}/${guid}/thumbnail.jpg`,
        videoUrl: `https://${cdnHost}/${guid}/playlist.m3u8`,
        embedUrl: `https://iframe.mediadelivery.net/embed/${libraryId}/${guid}`,
        views: v.views || 0,
        dateUploaded: v.dateUploaded,
        availableResolutions: v.availableResolutions || '',
        isPremium: true,
      };
    });

    return NextResponse.json({
      totalCount: data.totalItems || items.length,
      currentPage: data.currentPage || 1,
      itemsPerPage: data.itemsPerPage || items.length,
      videos: items,
    });
  } catch (err: any) {
    console.error('Error fetching Bunny videos:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
