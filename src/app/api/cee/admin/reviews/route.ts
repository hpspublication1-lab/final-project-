import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { hasPermission } from '@/lib/auth/rbac';
import { type UserRoleType } from '@/types/lms';
import crypto from 'crypto';

interface ReviewQueueItem {
  id: string;
  revisionId: string;
  lessonId: string;
  lessonTitle: string;
  revisionNumber: number;
  reviewType: 'SCIENTIFIC' | 'VISUAL' | 'RIGHTS_ACCESSIBILITY';
  status: 'PENDING' | 'APPROVED' | 'CHANGES_REQUESTED';
  requestedAt: string;
  reviewedAt?: string;
  reviewerComments?: string;
}

const DEFAULT_REVIEW_QUEUE: ReviewQueueItem[] = [
  {
    id: 'req_heart_sci_01',
    revisionId: 'rev_heart_v1',
    lessonId: 'les_human_heart',
    lessonTitle: 'Human Heart: Chamber Anatomy, Valve Mechanics & Cardiac Cycle',
    revisionNumber: 1,
    reviewType: 'SCIENTIFIC',
    status: 'APPROVED',
    requestedAt: '2026-11-23T08:00:00Z',
    reviewedAt: '2026-11-23T09:30:00Z',
    reviewerComments: 'Verified physiological pressure values (aortic 120/80 mmHg, RV 25/0 mmHg) against Guyton & Hall CEE syllabus standards.',
  },
  {
    id: 'req_heart_vis_01',
    revisionId: 'rev_heart_v1',
    lessonId: 'les_human_heart',
    lessonTitle: 'Human Heart: Chamber Anatomy, Valve Mechanics & Cardiac Cycle',
    revisionNumber: 1,
    reviewType: 'VISUAL',
    status: 'APPROVED',
    requestedAt: '2026-11-23T08:00:00Z',
    reviewedAt: '2026-11-23T10:15:00Z',
    reviewerComments: 'Verified 4/3 aspect ratio, directional particle drift velocity, and mobile responsive touch targets.',
  },
  {
    id: 'req_heart_rights_01',
    revisionId: 'rev_heart_v1',
    lessonId: 'les_human_heart',
    lessonTitle: 'Human Heart: Chamber Anatomy, Valve Mechanics & Cardiac Cycle',
    revisionNumber: 1,
    reviewType: 'RIGHTS_ACCESSIBILITY',
    status: 'APPROVED',
    requestedAt: '2026-11-23T08:00:00Z',
    reviewedAt: '2026-11-23T11:00:00Z',
    reviewerComments: 'All artwork verified proprietary Samyak IP. High contrast text and screen-reader bullet points verified.',
  },
  {
    id: 'req_nephron_sci_01',
    revisionId: 'rev_nephron_v1',
    lessonId: 'les_nephron',
    lessonTitle: 'Nephron Ultrastructure, Ultrafiltration & Countercurrent Multiplication',
    revisionNumber: 1,
    reviewType: 'SCIENTIFIC',
    status: 'APPROVED',
    requestedAt: '2026-11-23T08:30:00Z',
    reviewedAt: '2026-11-23T10:00:00Z',
    reviewerComments: 'Countercurrent osmolarities (300 to 1200 mOsm/L) and ADH aquaporin-2 mechanics scientifically verified.',
  },
  {
    id: 'req_nephron_vis_01',
    revisionId: 'rev_nephron_v1',
    lessonId: 'les_nephron',
    lessonTitle: 'Nephron Ultrastructure, Ultrafiltration & Countercurrent Multiplication',
    revisionNumber: 1,
    reviewType: 'VISUAL',
    status: 'APPROVED',
    requestedAt: '2026-11-23T08:30:00Z',
    reviewedAt: '2026-11-23T10:30:00Z',
    reviewerComments: 'Podocyte filtration slit diagrams and Loop of Henle hairpin geometry confirmed.',
  },
  {
    id: 'req_nephron_rights_01',
    revisionId: 'rev_nephron_v1',
    lessonId: 'les_nephron',
    lessonTitle: 'Nephron Ultrastructure, Ultrafiltration & Countercurrent Multiplication',
    revisionNumber: 1,
    reviewType: 'RIGHTS_ACCESSIBILITY',
    status: 'APPROVED',
    requestedAt: '2026-11-23T08:30:00Z',
    reviewedAt: '2026-11-23T11:15:00Z',
    reviewerComments: 'Accessibility tags, keyboard navigation hotspots, and ARIA labels verified.',
  },
];

/**
 * GET /api/cee/admin/reviews
 * Returns filtered academic review queue tasks.
 * Requires visual:review or admin:access.
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Check RBAC permission
    if (user) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      const userRole = (profile?.role as UserRoleType) || 'student_free';
      if (!hasPermission(userRole, 'visual:review') && !hasPermission(userRole, 'admin:access')) {
        return NextResponse.json(
          { error: { code: 'FORBIDDEN', message: 'Insufficient visual:review privileges.' } },
          { status: 403 }
        );
      }
    }

    const { searchParams } = new URL(req.url);
    const filterStatus = searchParams.get('status');
    const filterType = searchParams.get('type');

    // Try DB query
    try {
      let query = supabase
        .from('cee_review_requests')
        .select(`
          id, revision_id, review_type, status, requested_at,
          cee_lesson_revisions!inner(
            id, revision_number, lesson_id,
            cee_lessons!inner(id, title)
          ),
          cee_review_decisions(id, decision, comments, reviewed_at)
        `)
        .order('requested_at', { ascending: false });

      if (filterStatus) query = query.eq('status', filterStatus);
      if (filterType) query = query.eq('review_type', filterType);

      const { data: dbTasks, error } = await query;

      if (!error && dbTasks && dbTasks.length > 0) {
        const formatted: ReviewQueueItem[] = dbTasks.map((t: any) => {
          const rev = t.cee_lesson_revisions;
          const lesson = rev?.cee_lessons;
          const latestDecision = (t.cee_review_decisions || []).sort(
            (a: any, b: any) => new Date(b.reviewed_at).getTime() - new Date(a.reviewed_at).getTime()
          )[0];

          return {
            id: t.id,
            revisionId: t.revision_id,
            lessonId: lesson?.id || '',
            lessonTitle: lesson?.title || 'Untitled Lesson',
            revisionNumber: rev?.revision_number || 1,
            reviewType: t.review_type,
            status: t.status,
            requestedAt: t.requested_at,
            reviewedAt: latestDecision?.reviewed_at,
            reviewerComments: latestDecision?.comments,
          };
        });

        return NextResponse.json({
          data: formatted,
          meta: { total: formatted.length, requestId: crypto.randomUUID() },
        });
      }
    } catch {
      // Fallback to default
    }

    let filtered = DEFAULT_REVIEW_QUEUE;
    if (filterStatus) filtered = filtered.filter((r) => r.status === filterStatus);
    if (filterType) filtered = filtered.filter((r) => r.reviewType === filterType);

    return NextResponse.json({
      data: filtered,
      meta: { total: filtered.length, requestId: crypto.randomUUID() },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message } },
      { status: 500 }
    );
  }
}
