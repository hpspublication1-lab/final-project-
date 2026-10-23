import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/bunny/sync
 * 
 * Fetches all videos from Bunny Stream API and syncs them into the `video_lectures` table.
 * Admin-only (or authorized API call).
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin permissions
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const libraryId = process.env.BUNNY_LIBRARY_ID || '379737';
    const apiKey = process.env.BUNNY_STREAM_API_KEY;
    const cdnHost = process.env.BUNNY_CDN_HOSTNAME || 'vz-11253e6e-275.b-cdn.net';

    if (!libraryId || !apiKey) {
      return NextResponse.json({ error: 'Bunny.net configuration missing' }, { status: 500 });
    }

    // Fetch videos from Bunny API
    const bunnyRes = await fetch(
      `https://video.bunnycdn.com/library/${libraryId}/videos?page=1&itemsPerPage=500`,
      {
        headers: {
          'AccessKey': apiKey,
          'accept': 'application/json',
        },
      }
    );

    if (!bunnyRes.ok) {
      const errText = await bunnyRes.text();
      return NextResponse.json(
        { error: `Bunny API error (${bunnyRes.status}): ${errText}` },
        { status: 502 }
      );
    }

    const bunnyData = await bunnyRes.json();
    const bunnyVideos = bunnyData?.items || [];

    // Query subjects for auto-mapping
    const { data: dbSubjects } = await supabase.from('subjects').select('id, name');
    const subjectMap: Record<string, string> = {};
    (dbSubjects || []).forEach((s: any) => {
      subjectMap[s.name] = s.id;
    });

    let syncedCount = 0;
    let errors: string[] = [];

    // Format & upsert videos into video_lectures table
    for (const v of bunnyVideos) {
      const guid = v.guid;
      if (!guid) continue;

      const videoUrl = `https://${cdnHost}/${guid}/playlist.m3u8`;
      const thumbnailUrl = v.thumbnailUrl || `https://${cdnHost}/${guid}/thumbnail.jpg`;
      // Clean up title (remove .mp4 extension if present)
      const title = (v.title || 'Untitled Video').replace(/\.mp4$/i, '').trim();
      const lower = title.toLowerCase();

      // Determine subject_id
      let subjectId = null;
      if (lower.includes('opt math') || lower.includes('see-om') || lower.includes('linear programming') || lower.includes('continuity')) {
        subjectId = subjectMap['optional_math'] || null;
      } else if (lower.includes('c. math') || lower.includes('compound interest') || lower.includes('money exchange') || lower.includes('pyramid') || lower.includes('arithmetic')) {
        subjectId = subjectMap['compulsory_math'] || null;
      } else if (lower.includes('science') || lower.includes('hydrocarbon') || lower.includes('chemical') || lower.includes('metal') || lower.includes('periodic')) {
        subjectId = subjectMap['compulsory_science'] || null;
      } else if (lower.includes('english') || lower.includes('grammar') || lower.includes('q. no') || lower.includes('q.no') || lower.includes('poem') || lower.includes('unseen') || lower.includes('guided')) {
        subjectId = subjectMap['english'] || null;
      } else if (lower.includes('social') || lower.includes('samajik') || lower.includes('सामाजिक')) {
        subjectId = subjectMap['social_studies'] || null;
      }

      const payload: any = {
        title: title,
        description: v.description || `Bunny Stream video (${v.resolution || 'HD'})`,
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl,
        duration_sec: Math.round(v.length || 0),
        is_premium: true,
        is_active: true,
        updated_at: new Date().toISOString(),
      };

      if (subjectId) {
        payload.subject_id = subjectId;
      }

      // Check if video already exists by title or video_url
      const { data: existing } = await supabase
        .from('video_lectures')
        .select('id')
        .eq('video_url', videoUrl)
        .maybeSingle();

      if (existing) {
        const { error: updateErr } = await supabase
          .from('video_lectures')
          .update(payload)
          .eq('id', existing.id);
        if (updateErr) errors.push(`Failed to update ${title}: ${updateErr.message}`);
        else syncedCount++;
      } else {
        const { error: insertErr } = await supabase
          .from('video_lectures')
          .insert(payload);
        if (insertErr) errors.push(`Failed to insert ${title}: ${insertErr.message}`);
        else syncedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      syncedCount,
      totalBunnyVideos: bunnyVideos.length,
      errorsCount: errors.length,
      errors: errors.slice(0, 5),
    });
  } catch (err: any) {
    console.error('Bunny sync error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
