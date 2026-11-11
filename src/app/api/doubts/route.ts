import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/supabase/route-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { enforceRateLimit } from '@/lib/security/rateLimiter';
import { validateBase64Upload } from '@/lib/security/uploadValidation';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const subjectId = searchParams.get('subject_id');
    const status = searchParams.get('status');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);

    const admin = createAdminClient();
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Database unavailable' }, { status: 500 });
    }

    let query = admin
      .from('doubts')
      .select('id, title, question_text, status, created_at, subject_id, image_url, subjects(display_name)')
      .eq('student_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (subjectId) {
      query = query.eq('subject_id', subjectId);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data: doubts, error } = await query;

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, doubts: doubts || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const rateLimit = await enforceRateLimit(req, 'submission', 'doubt-create');
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: `Too many submissions. Please wait ${rateLimit.resetSeconds}s.` },
        { status: 429 }
      );
    }

    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { title, question_text, subject_id, image_base64 } = body;

    // Enforce file upload rate limit if doubt includes image attachment
    if (image_base64) {
      const uploadLimit = await enforceRateLimit(req, 'upload', 'doubt-image');
      if (!uploadLimit.allowed) {
        return NextResponse.json(
          { success: false, error: `Too many image uploads. Please wait ${uploadLimit.resetSeconds}s.` },
          { status: 429 }
        );
      }
    }

    if (!title || typeof title !== 'string' || title.trim().length < 3) {
      return NextResponse.json(
        { success: false, error: 'Title must be at least 3 characters.' },
        { status: 400 }
      );
    }

    if (!question_text || typeof question_text !== 'string' || question_text.trim().length < 5) {
      return NextResponse.json(
        { success: false, error: 'Question text must be at least 5 characters.' },
        { status: 400 }
      );
    }

    let imageUrl: string | null = null;
    if (image_base64) {
      const val = validateBase64Upload(image_base64);
      if (!val.valid) {
        return NextResponse.json({ success: false, error: val.error }, { status: 400 });
      }
      // Image data URL is validated safe
      imageUrl = image_base64;
    }

    const admin = createAdminClient();
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Database unavailable' }, { status: 500 });
    }

    const { data: newDoubt, error } = await admin
      .from('doubts')
      .insert({
        student_id: user.id,
        title: title.trim(),
        question_text: question_text.trim(),
        subject_id: subject_id || null,
        image_url: imageUrl,
        status: 'open',
      })
      .select('id, title, question_text, status, created_at, subject_id, image_url')
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, doubt: newDoubt }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal error' }, { status: 500 });
  }
}
