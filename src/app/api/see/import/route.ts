import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getSessionUser } from '@/lib/supabase/route-auth';

export const dynamic = 'force-dynamic';

interface ImportRecord {
  course_id?: string;
  subject?: string;
  subject_slug?: string;
  chapter?: string;
  chapter_name?: string;
  lesson_title?: string;
  title?: string;
  video_url?: string;
  thumbnail?: string;
  thumbnail_url?: string;
  duration?: number | string;
  duration_sec?: number | string;
  description?: string;
  order?: number | string;
  lesson_order?: number | string;
  is_free?: boolean | string;
  pdf_url?: string;
}

function isValidHttpUrl(string: string) {
  let url;
  try {
    url = new URL(string);
  } catch (_) {
    return false;
  }
  return url.protocol === 'http:' || url.protocol === 'https:';
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
    }

    const admin = createAdminClient();

    // Check admin privileges
    const { data: profile } = await admin
      .from('user_profiles')
      .select('is_admin')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden. Admin privileges required.' }, { status: 403 });
    }

    const payload = await request.json();
    const records: ImportRecord[] = Array.isArray(payload) ? payload : payload.records || [];

    if (!records || records.length === 0) {
      return NextResponse.json(
        { error: 'No content records provided. Please provide an array of lesson records.' },
        { status: 400 }
      );
    }

    const report = {
      totalRecords: records.length,
      successfulRecords: 0,
      failedRecords: 0,
      duplicateRecords: 0,
      invalidUrls: 0,
      missingFields: 0,
      errors: [] as { row: number; title: string; reason: string }[],
      insertedLessons: [] as any[],
    };

    // Fetch existing lessons to detect duplicates
    const { data: existingLessons } = await admin
      .from('see_lessons')
      .select('title, chapter_name, subject_slug');

    const existingSet = new Set(
      (existingLessons || []).map((l) => `${l.subject_slug}:::${l.chapter_name}:::${l.title}`.toLowerCase())
    );

    const validRowsToInsert: any[] = [];

    records.forEach((rec, index) => {
      const rowNum = index + 1;
      const title = (rec.lesson_title || rec.title || '').trim();
      const subject = (rec.subject || rec.subject_slug || 'physics').toLowerCase().trim();
      const chapter = (rec.chapter || rec.chapter_name || 'General').trim();
      const videoUrl = (rec.video_url || '').trim();
      const thumbnailUrl = (rec.thumbnail || rec.thumbnail_url || '').trim();
      const description = (rec.description || '').trim();
      const pdfUrl = (rec.pdf_url || '').trim();

      let durationSec = 0;
      if (typeof rec.duration_sec === 'number') durationSec = rec.duration_sec;
      else if (typeof rec.duration === 'number') durationSec = rec.duration;
      else if (typeof rec.duration === 'string') {
        const parsed = parseInt(rec.duration, 10);
        durationSec = isNaN(parsed) ? 0 : parsed;
      }

      let order = 1;
      if (typeof rec.lesson_order === 'number') order = rec.lesson_order;
      else if (typeof rec.order === 'number') order = rec.order;
      else if (typeof rec.order === 'string') {
        const parsed = parseInt(rec.order, 10);
        order = isNaN(parsed) ? 1 : parsed;
      }

      const isFree =
        rec.is_free === true ||
        rec.is_free === 'true' ||
        rec.is_free === '1' ||
        rec.is_free === 1;

      // 1. Validation: Missing required fields
      if (!title || !subject || !chapter) {
        report.failedRecords++;
        report.missingFields++;
        report.errors.push({
          row: rowNum,
          title: title || 'Untitled',
          reason: `Missing required field: ${!title ? 'title' : !subject ? 'subject' : 'chapter'} is required`,
        });
        return;
      }

      // 2. Validation: Video URL format check
      if (videoUrl && !isValidHttpUrl(videoUrl)) {
        report.failedRecords++;
        report.invalidUrls++;
        report.errors.push({
          row: rowNum,
          title,
          reason: `Invalid video URL format: '${videoUrl}'. Must start with http:// or https://`,
        });
        return;
      }

      // 3. Validation: Duplicate detection
      const key = `${subject}:::${chapter}:::${title}`.toLowerCase();
      if (existingSet.has(key)) {
        report.failedRecords++;
        report.duplicateRecords++;
        report.errors.push({
          row: rowNum,
          title,
          reason: `Duplicate record: Lesson already exists in '${subject}' under chapter '${chapter}'`,
        });
        return;
      }

      // Record is valid
      existingSet.add(key); // prevent intra-batch duplicates
      validRowsToInsert.push({
        course_id: rec.course_id || 'see_class_10',
        subject_slug: subject,
        chapter_name: chapter,
        title,
        description,
        video_url: videoUrl || null,
        thumbnail_url: thumbnailUrl || null,
        duration_sec: durationSec,
        lesson_order: order,
        pdf_url: pdfUrl || null,
        is_free: isFree,
        is_published: true,
      });
    });

    // Insert valid records into database
    if (validRowsToInsert.length > 0) {
      const { data: inserted, error: insertError } = await admin
        .from('see_lessons')
        .insert(validRowsToInsert)
        .select();

      if (insertError) {
        console.error('Bulk insert error:', insertError.message);
        return NextResponse.json(
          {
            error: 'Failed to insert validated records into database',
            details: insertError.message,
            report,
          },
          { status: 500 }
        );
      }

      report.successfulRecords = inserted?.length || validRowsToInsert.length;
      report.insertedLessons = inserted || [];
    }

    return NextResponse.json({
      success: report.failedRecords === 0,
      report,
    });
  } catch (err: any) {
    console.error('API /api/see/import error:', err);
    return NextResponse.json({ error: 'Bulk import failed', details: err?.message }, { status: 500 });
  }
}
