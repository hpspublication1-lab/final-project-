import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/bunny/videos
 * 
 * Fetches all videos and collections directly from Bunny Stream API library.
 * Automatically paginates to retrieve ALL videos in the library (292+ videos),
 * formats clean titles, and organizes by Subject & Chapter collections.
 */

interface BunnyRawVideo {
  guid: string;
  title: string;
  description?: string;
  length?: number;
  thumbnailUrl?: string;
  collectionId?: string;
  views?: number;
  dateUploaded?: string;
  availableResolutions?: string;
}

interface BunnyCollection {
  guid: string;
  name: string;
  videoCount: number;
}

function cleanVideoTitle(rawTitle: string): { title: string; unit?: string; part?: string; subject?: string } {
  let t = (rawTitle || 'Untitled Lecture').replace(/\.mp4$/i, '').trim();

  // Extract Part info
  let partMatch = t.match(/[-_\s]+(part[-_\s]*[0-9ivx]+|p[0-9ivx]+)/i);
  let part = partMatch ? partMatch[0].replace(/[-_]/g, ' ').trim() : undefined;

  // Extract Unit info
  let unitMatch = t.match(/(unit[-_\s]*[0-9]+|u[0-9]+)/i);
  let unit = unitMatch ? unitMatch[0].replace(/[-_]/g, ' ').toUpperCase().trim() : undefined;

  // Clean title for display
  let clean = t
    .replace(/^SEE[-_][A-Z0-9&]+[-_][A-Z0-9]+[-_][A-Z0-9]+[-_]+/i, '') // Remove prefix like SEE-OM-EM-HRT-U1-L4-
    .replace(/^SEE[-_][A-Z0-9&]+[-_]+/i, '')
    .replace(/^Q\.?\s*NO\s*[0-9]+[A-Z]?\s*/i, '') // Remove Q. NO 10
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Capitalize nicely
  if (clean.length > 0) {
    clean = clean.charAt(0).toUpperCase() + clean.slice(1);
  }

  return { title: clean || t, unit, part };
}

export async function GET(request: NextRequest) {
  try {
    const libraryId = request.nextUrl.searchParams.get('libraryId') || process.env.BUNNY_LIBRARY_ID || '379737';
    const apiKey = process.env.BUNNY_STREAM_API_KEY || 'a4fd2aae-2b48-4322-8352f0d513c5-79b9-4d81';
    const cdnHost = process.env.BUNNY_CDN_HOSTNAME || 'vz-11253e6e-275.b-cdn.net';
    const search = request.nextUrl.searchParams.get('search') || '';
    const collectionId = request.nextUrl.searchParams.get('collectionId') || '';

    if (!libraryId || !apiKey) {
      return NextResponse.json({ error: 'Bunny configuration missing' }, { status: 500 });
    }

    // 1. Fetch Collections
    let collections: BunnyCollection[] = [];
    try {
      const collRes = await fetch(`https://video.bunnycdn.com/library/${libraryId}/collections?itemsPerPage=100`, {
        headers: { 'AccessKey': apiKey, 'accept': 'application/json' },
        next: { revalidate: 120 }
      });
      if (collRes.ok) {
        const collData = await collRes.json();
        collections = (collData.items || []).map((c: any) => ({
          guid: c.guid,
          name: c.name,
          videoCount: c.videoCount || 0,
        }));
      }
    } catch (e) {
      console.warn('Failed to fetch collections:', e);
    }

    // Collection lookup map
    const collMap = new Map<string, string>();
    collections.forEach((c) => collMap.set(c.guid, c.name));

    // 2. Fetch All Videos (Paginate across pages to get full library 292+ videos)
    let allRawVideos: BunnyRawVideo[] = [];
    for (let page = 1; page <= 5; page++) {
      let url = `https://video.bunnycdn.com/library/${libraryId}/videos?page=${page}&itemsPerPage=100`;
      if (collectionId) url += `&collection=${collectionId}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;

      const bunnyRes = await fetch(url, {
        headers: { 'AccessKey': apiKey, 'accept': 'application/json' },
        next: { revalidate: 60 }
      });

      if (!bunnyRes.ok) break;
      const data = await bunnyRes.json();
      const items: BunnyRawVideo[] = data.items || [];
      allRawVideos = allRawVideos.concat(items);
      if (items.length < 100) break; // Last page reached
    }

    // 3. Transform and organize videos
    const videos = allRawVideos.map((v) => {
      const guid = v.guid;
      const rawTitle = v.title || 'Untitled Lecture';
      const collectionName = v.collectionId ? collMap.get(v.collectionId) || 'General' : 'General';
      const { title: cleanTitle, unit, part } = cleanVideoTitle(rawTitle);

      // Infer subject from collection name or title
      let subject = 'other';
      let subjectDisplayName = 'General Studies';
      const collLower = collectionName.toLowerCase();
      const rawLower = rawTitle.toLowerCase();

      if (collLower.includes('science') || rawLower.includes('sci') || rawLower.includes('hydrocarbon') || rawLower.includes('force')) {
        subject = 'science';
        subjectDisplayName = 'Science & Technology';
      } else if (collLower.includes('opt math') || rawLower.includes('see-om') || rawLower.includes('linear programming') || rawLower.includes('continuity')) {
        subject = 'opt_math';
        subjectDisplayName = 'Optional Mathematics';
      } else if (collLower.includes('c. math') || rawLower.includes('arithmetic') || rawLower.includes('compound interest')) {
        subject = 'math';
        subjectDisplayName = 'Compulsory Mathematics';
      } else if (collLower.includes('english') || rawLower.includes('grammar') || rawLower.includes('pronoun') || rawLower.includes('verb')) {
        subject = 'english';
        subjectDisplayName = 'English Language';
      }

      return {
        id: guid,
        guid: guid,
        rawTitle: rawTitle,
        title: cleanTitle,
        unit: unit,
        part: part,
        collectionId: v.collectionId,
        collectionName: collectionName,
        subject: subject,
        subjectDisplayName: subjectDisplayName,
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
      totalCount: videos.length,
      libraryId: libraryId,
      collections: collections,
      videos: videos,
    });
  } catch (err: any) {
    console.error('Error fetching Bunny videos:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
