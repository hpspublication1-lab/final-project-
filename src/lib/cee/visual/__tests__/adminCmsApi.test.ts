import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as getLessons, POST as createLesson } from '@/app/api/cee/admin/lessons/route';
import { POST as submitRevision } from '@/app/api/cee/admin/lesson-revisions/[id]/submit/route';
import { GET as getReviews } from '@/app/api/cee/admin/reviews/route';
import { POST as recordDecision } from '@/app/api/cee/admin/reviews/decision/route';
import { POST as publishLesson } from '@/app/api/cee/admin/publications/route';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'usr_admin_test_01' } },
      }),
    },
    from: vi.fn().mockImplementation((tableName: string) => {
      const mockQuery: any = {
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockImplementation(async () => {
          if (tableName === 'user_profiles') {
            return { data: { role: 'admin' }, error: null };
          }
          if (tableName === 'cee_lesson_revisions') {
            return {
              data: {
                id: 'rev_test_01',
                status: 'DRAFT',
                revision_number: 1,
                lesson_id: 'les_test_01',
              },
              error: null,
            };
          }
          return { data: null, error: null };
        }),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
      return mockQuery;
    }),
  }),
}));

describe('CEE Visual Intelligence — Admin CMS & Review API Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/cee/admin/lessons', () => {
    it('returns 200 with list of visual lessons', async () => {
      const req = new NextRequest('http://localhost:4028/api/cee/admin/lessons');
      const res = await getLessons(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data).toBeDefined();
      expect(Array.isArray(json.data)).toBe(true);
      expect(json.data.length).toBeGreaterThanOrEqual(3);
      expect(json.data.some((l: any) => l.slug === 'human-heart')).toBe(true);
      expect(json.data.some((l: any) => l.slug === 'nephron')).toBe(true);
      expect(json.data.some((l: any) => l.slug === 'gas-exchange')).toBe(true);
    });
  });

  describe('POST /api/cee/admin/lessons', () => {
    it('returns 400 when title or slug is missing', async () => {
      const req = new NextRequest('http://localhost:4028/api/cee/admin/lessons', {
        method: 'POST',
        body: JSON.stringify({ title: '' }),
      });
      const res = await createLesson(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error.code).toBe('VALIDATION_FAILED');
    });

    it('creates new draft lesson with initial Revision 1', async () => {
      const req = new NextRequest('http://localhost:4028/api/cee/admin/lessons', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Ear & Vestibular Apparatus',
          slug: 'ear-vestibular',
          subject: 'Biology — Zoology',
          chapter: 'Sensory Organs',
          topic: 'Hearing & Balance',
        }),
      });
      const res = await createLesson(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data.status).toBe('DRAFT');
      expect(json.data.currentRevisionNumber).toBe(1);
      expect(json.data.slug).toBe('ear-vestibular');
    });
  });

  describe('POST /api/cee/admin/lesson-revisions/[id]/submit', () => {
    it('enqueues the 3 required academic review gates', async () => {
      const req = new NextRequest('http://localhost:4028/api/cee/admin/lesson-revisions/rev_test_01/submit', {
        method: 'POST',
      });
      const res = await submitRevision(req, { params: Promise.resolve({ id: 'rev_test_01' }) });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data.status).toBe('IN_REVIEW');
      expect(json.data.enqueuedReviewGates).toEqual(['SCIENTIFIC', 'VISUAL', 'RIGHTS_ACCESSIBILITY']);
    });
  });

  describe('GET /api/cee/admin/reviews', () => {
    it('returns filtered academic review tasks', async () => {
      const req = new NextRequest('http://localhost:4028/api/cee/admin/reviews?type=SCIENTIFIC');
      const res = await getReviews(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data).toBeDefined();
      expect(Array.isArray(json.data)).toBe(true);
      expect(json.data.every((r: any) => r.reviewType === 'SCIENTIFIC')).toBe(true);
    });
  });

  describe('POST /api/cee/admin/reviews/decision', () => {
    it('rejects changes requested without explanatory comments', async () => {
      const req = new NextRequest('http://localhost:4028/api/cee/admin/reviews/decision', {
        method: 'POST',
        body: JSON.stringify({
          requestId: 'req_01',
          decision: 'CHANGES_REQUESTED',
          comments: '',
        }),
      });
      const res = await recordDecision(req);
      const json = await res.json();

      expect(res.status).toBe(422);
      expect(json.error.code).toBe('COMMENTS_REQUIRED');
    });

    it('records valid approval decision', async () => {
      const req = new NextRequest('http://localhost:4028/api/cee/admin/reviews/decision', {
        method: 'POST',
        body: JSON.stringify({
          requestId: 'req_01',
          decision: 'APPROVED',
          comments: 'Anatomical structures and labels verified.',
        }),
      });
      const res = await recordDecision(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data.decision).toBe('APPROVED');
    });
  });

  describe('POST /api/cee/admin/publications', () => {
    it('rejects publication when lessonId or revisionId is missing', async () => {
      const req = new NextRequest('http://localhost:4028/api/cee/admin/publications', {
        method: 'POST',
        body: JSON.stringify({ lessonId: 'les_heart' }),
      });
      const res = await publishLesson(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error.code).toBe('VALIDATION_FAILED');
    });

    it('rejects publication if revision is not in APPROVED state', async () => {
      const req = new NextRequest('http://localhost:4028/api/cee/admin/publications', {
        method: 'POST',
        body: JSON.stringify({
          lessonId: 'les_human_heart',
          revisionId: 'rev_test_01', // mock returned status: 'DRAFT'
          idempotencyKey: 'idem_test_pub_01',
        }),
      });
      const res = await publishLesson(req);
      const json = await res.json();

      expect(res.status).toBe(409);
      expect(json.error.code).toBe('ACADEMIC_APPROVAL_REQUIRED');
    });
  });
});
