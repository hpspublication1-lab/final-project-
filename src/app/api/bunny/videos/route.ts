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
    const requestedLib = request.nextUrl.searchParams.get('libraryId');
    const mediumParam = (request.nextUrl.searchParams.get('medium') || 'all').toLowerCase();
    
    // Default library is 379737 (English Medium), or 367785 (Nepali Medium)
    const isNepaliRequested = mediumParam === 'nepali' || requestedLib === '367785';
    const libraryId = requestedLib || (isNepaliRequested ? '367785' : (process.env.BUNNY_LIBRARY_ID || '379737'));
    
    const defaultEMKey = 'a4fd2aae-2b48-4322-8352f0d513c5-79b9-4d81';
    const libraryKeys: Record<string, string> = {
      '379737': process.env.BUNNY_STREAM_API_KEY_379737 || process.env.BUNNY_STREAM_API_KEY_EM || process.env.BUNNY_STREAM_API_KEY || defaultEMKey,
      '367785': process.env.BUNNY_STREAM_API_KEY_367785 || process.env.BUNNY_STREAM_API_KEY_NM || '',
    };

    let activeLibraryId = libraryId;
    let apiKey = libraryKeys[libraryId] || process.env.BUNNY_STREAM_API_KEY || defaultEMKey;
    const cdnHost = process.env.BUNNY_CDN_HOSTNAME || 'vz-11253e6e-275.b-cdn.net';
    const search = request.nextUrl.searchParams.get('search') || '';
    const collectionId = request.nextUrl.searchParams.get('collectionId') || '';

    // 1. Fetch Collections
    let collections: BunnyCollection[] = [];
    let isFallback = false;

    try {
      const collRes = await fetch(`https://video.bunnycdn.com/library/${activeLibraryId}/collections?itemsPerPage=100`, {
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
      } else if (activeLibraryId === '367785' && collRes.status === 401) {
        // Graceful fallback for Nepali medium when library 367785 API key is pending
        isFallback = true;
        activeLibraryId = '379737';
        apiKey = libraryKeys['379737'];
        const fbRes = await fetch(`https://video.bunnycdn.com/library/379737/collections?itemsPerPage=100`, {
          headers: { 'AccessKey': apiKey, 'accept': 'application/json' },
          next: { revalidate: 120 }
        });
        if (fbRes.ok) {
          const fbData = await fbRes.json();
          collections = (fbData.items || []).map((c: any) => ({
            guid: c.guid,
            name: c.name,
            videoCount: c.videoCount || 0,
          }));
        }
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
      let url = `https://video.bunnycdn.com/library/${activeLibraryId}/videos?page=${page}&itemsPerPage=100`;
      if (collectionId) url += `&collection=${collectionId}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;

      const bunnyRes = await fetch(url, {
        headers: { 'AccessKey': apiKey, 'accept': 'application/json' },
        next: { revalidate: 60 }
      });

      if (!bunnyRes.ok) {
        if (activeLibraryId === '367785' && bunnyRes.status === 401 && !isFallback) {
          // Switch to 379737 master library fallback
          isFallback = true;
          activeLibraryId = '379737';
          apiKey = libraryKeys['379737'];
          page = 0; // Restart loop with fallback
          continue;
        }
        break;
      }
      const data = await bunnyRes.json();
      const items: BunnyRawVideo[] = data.items || [];
      allRawVideos = allRawVideos.concat(items);
      if (items.length < 100) break; // Last page reached
    }

    // 3. Transform and organize videos
    let videos = allRawVideos.map((v) => {
      const guid = v.guid;
      const rawTitle = v.title || 'Untitled Lecture';
      const collectionName = v.collectionId ? collMap.get(v.collectionId) || 'General' : 'General';
      const { title: cleanTitle, unit, part } = cleanVideoTitle(rawTitle);

      // Infer subject from collection name or title
      let subject = 'other';
      let subjectDisplayName = 'General Studies';
      let nepaliSubjectName = 'सामान्य अध्ययन';

      const collLower = collectionName.toLowerCase();
      const rawLower = rawTitle.toLowerCase();

      if (collLower.includes('biology') || collLower.includes('botany') || collLower.includes('zoology') || rawLower.includes('botany') || rawLower.includes('zoology')) {
        subject = 'biology';
        subjectDisplayName = 'Biology (Botany & Zoology)';
        nepaliSubjectName = 'जीवविज्ञान (वनस्पति तथा प्राणीशास्त्र)';
      } else if (collLower.includes('chemistry') || rawLower.includes('organic') || rawLower.includes('inorganic') || rawLower.includes('electrochem')) {
        subject = 'chemistry';
        subjectDisplayName = 'Chemistry';
        nepaliSubjectName = 'रसायनशास्त्र';
      } else if (collLower.includes('physics') || rawLower.includes('optics') || rawLower.includes('thermodynamics') || rawLower.includes('electromagnetism')) {
        subject = 'physics';
        subjectDisplayName = 'Physics';
        nepaliSubjectName = 'भौतिकशास्त्र';
      } else if (collLower.includes('mental agility') || collLower.includes('mat') || rawLower.includes('reasoning')) {
        subject = 'mat';
        subjectDisplayName = 'Mental Agility (MAT)';
        nepaliSubjectName = 'मानसिक क्षमता परीक्षण';
      } else if (collLower.includes('science') || rawLower.includes('sci') || rawLower.includes('hydrocarbon') || rawLower.includes('force')) {
        subject = 'science';
        subjectDisplayName = 'Science & Technology';
        nepaliSubjectName = 'विज्ञान तथा प्रविधि';
      } else if (collLower.includes('opt math') || rawLower.includes('see-om') || rawLower.includes('linear programming') || rawLower.includes('continuity')) {
        subject = 'opt_math';
        subjectDisplayName = 'Optional Mathematics';
        nepaliSubjectName = 'ऐच्छिक गणित';
      } else if (collLower.includes('c. math') || rawLower.includes('arithmetic') || rawLower.includes('compound interest')) {
        subject = 'math';
        subjectDisplayName = 'Compulsory Mathematics';
        nepaliSubjectName = 'अनिवार्य गणित';
      } else if (collLower.includes('social') || rawLower.includes('social') || rawLower.includes('samajik') || rawLower.includes('सामाजिक') || rawLower.includes('history') || rawLower.includes('geography')) {
        subject = 'social_studies';
        subjectDisplayName = 'Social Studies (सामाजिक अध्ययन)';
        nepaliSubjectName = 'सामाजिक अध्ययन तथा मानव मूल्य';
      } else if (collLower.includes('english') || rawLower.includes('grammar') || rawLower.includes('pronoun') || rawLower.includes('verb')) {
        subject = 'english';
        subjectDisplayName = 'English Language';
        nepaliSubjectName = 'अंग्रेजी भाषा तथा व्याकरण';
      }

      // Infer Medium
      let medium: 'english' | 'nepali' | 'both' = 'both';
      if (rawLower.includes('-em-') || rawLower.includes('_em_') || collLower.includes('-em') || collLower.includes('english')) {
        medium = 'english';
      } else if (rawLower.includes('-nm-') || rawLower.includes('_nm_') || collLower.includes('-nm') || collLower.includes('nepali') || subject === 'social_studies') {
        medium = 'nepali';
      }

      // If viewing in Nepali Medium context
      const isNepaliContext = isNepaliRequested || libraryId === '367785';

      return {
        id: guid,
        guid: guid,
        rawTitle: rawTitle,
        title: isNepaliContext && nepaliSubjectName ? `${cleanTitle}` : cleanTitle,
        unit: unit,
        part: part,
        collectionId: v.collectionId,
        collectionName: collectionName,
        subject: subject,
        subjectDisplayName: isNepaliContext ? nepaliSubjectName : subjectDisplayName,
        nepaliSubjectName: nepaliSubjectName,
        medium: isNepaliContext ? 'nepali' : medium,
        mediumDisplayName: isNepaliContext ? '🇳🇵 नेपाली माध्यम' : (medium === 'english' ? '🇬🇧 English Medium' : '🌐 All Mediums'),
        description: v.description || '',
        duration: Math.round(v.length || 0),
        durationSec: Math.round(v.length || 0),
        thumbnailUrl: v.thumbnailUrl || `https://${cdnHost}/${guid}/thumbnail.jpg`,
        videoUrl: `https://${cdnHost}/${guid}/playlist.m3u8`,
        embedUrl: `https://iframe.mediadelivery.net/embed/${activeLibraryId}/${guid}`,
        views: v.views || 0,
        dateUploaded: v.dateUploaded,
        availableResolutions: v.availableResolutions || '',
        isPremium: true,
      };
    });

    // 4. Filter by medium if specifically requested
    if (mediumParam === 'english') {
      videos = videos.filter((v) => v.medium === 'english' || v.medium === 'both');
    } else if (mediumParam === 'nepali') {
      // In Nepali Medium, include all mapped curriculum lectures
      videos = videos.map((v) => ({
        ...v,
        medium: 'nepali' as const,
        mediumDisplayName: '🇳🇵 नेपाली माध्यम',
      }));
    }

    return NextResponse.json({
      totalCount: videos.length,
      libraryId: activeLibraryId,
      requestedLibraryId: libraryId,
      isFallback: isFallback,
      medium: mediumParam,
      collections: collections,
      videos: videos,
    });
  } catch (err: any) {
    console.error('Error fetching Bunny videos:', err);
    return NextResponse.json({
      totalCount: 0,
      libraryId: '379737',
      collections: [],
      videos: [],
      error: err.message || 'Server error',
    }, { status: 200 }); // Return 200 with empty list and error to prevent frontend crash
  }
}
