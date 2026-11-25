import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { enforceRateLimit } from '@/lib/security/rateLimiter';
import {
  CANONICAL_LESSONS_MAP,
  type VisualLessonPublishedPayload,
} from '@/lib/cee/visual/canonicalLessons';

export type { VisualLessonPublishedPayload };

/**
 * GET /api/cee/lessons/[slug]
 * Delivers verified published lesson snapshot.
 * Strictly returns HTTP 404 for unapproved/draft lessons (CEE-004).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const rl = enforceRateLimit(req, 'api');
    if (!rl.allowed) {
      return NextResponse.json(
        { error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests. Please slow down.' } },
        {
          status: 429,
          headers: {
            'Retry-After': String(rl.resetSeconds),
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }

    const { slug } = await params;

    // Check database if publication exists
    try {
      const supabase = await createClient();
      const { data: dbLesson, error } = await supabase
        .from('cee_lessons')
        .select(`
          id, title, slug,
          cee_publications!inner(id, published_at, superseded_at,
            cee_lesson_revisions!inner(revision_number, content_json, status)
          )
        `)
        .eq('slug', slug)
        .is('cee_publications.superseded_at', null)
        .maybeSingle();

      if (!error && dbLesson) {
        return NextResponse.json({
          data: dbLesson,
          meta: { timestamp: new Date().toISOString() },
        });
      }
    } catch {
      // Database not yet configured or table empty, fallback to published canonical lesson
    }

    // Only serve approved published pilot lessons
    const canonicalLesson = CANONICAL_LESSONS_MAP[slug];
    if (canonicalLesson) {
      return NextResponse.json({
        data: canonicalLesson,
        meta: { timestamp: new Date().toISOString() },
      });
    }

    // Unapproved or non-existent draft lessons return 404 (CEE-004 Acceptance Requirement)
    return NextResponse.json(
      {
        error: {
          code: 'LESSON_NOT_PUBLISHED',
          message: `No approved visual lesson published for slug '${slug}'. Draft or unreviewed content is restricted.`,
        },
      },
      { status: 404 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message } },
      { status: 500 }
    );
  }
}
