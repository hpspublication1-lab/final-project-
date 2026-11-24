import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import {
  resolveRowCourse,
  parseCourseId,
  belongsToCourse,
  courseFromTitle,
  AMBIGUOUS_PROGRAM_VALUES,
} from '@/lib/courses/courseIds';
import { ROLE_PERMISSIONS, hasPermission } from '@/lib/auth/rbac';
import { validateVisualAssetManifest } from '@/lib/cee/visual/manifestSchema';
import { GET as getCurriculum } from '@/app/api/cee/curriculum/route';
import { GET as getLesson } from '@/app/api/cee/lessons/[slug]/route';
import { POST as submitRevision } from '@/app/api/cee/admin/lesson-revisions/[id]/submit/route';
import { POST as recordDecision } from '@/app/api/cee/admin/reviews/decision/route';
import { POST as publishLesson } from '@/app/api/cee/admin/publications/route';
import { POST as recordEvent } from '@/app/api/cee/me/lessons/[id]/events/route';
import { POST as recordProgress } from '@/app/api/cee/me/lessons/[id]/progress/route';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'usr_sec_audit_01' } },
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
                id: 'rev_audit_draft',
                status: 'DRAFT',
                revision_number: 1,
                lesson_id: 'les_audit_01',
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

describe('Independent Support Protocol — Security & Content Isolation Audit Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── 1. Academic Data Isolation & Cross-Department Leakage ─────────────────────
  describe('1. Academic Data & Program Isolation (CEE vs SEE vs IELTS vs IOE)', () => {
    it('strictly isolates course IDs and aliases without accidental cross-bleeding', () => {
      expect(parseCourseId('cee_medical')).toBe('cee_medical');
      expect(parseCourseId('cee')).toBe('cee_medical');
      expect(parseCourseId('see_class_10')).toBe('see_class_10');
      expect(parseCourseId('see')).toBe('see_class_10');
      expect(parseCourseId('ielts')).toBe('ielts');
      expect(parseCourseId('english')).toBe('ielts');
      expect(parseCourseId('ioe_engineering')).toBe('ioe_engineering');
      expect(parseCourseId('lok_sewa')).toBe('lok_sewa');
    });

    it('returns null for ambiguous legacy aliases (digital) to prevent data bleed', () => {
      expect(parseCourseId('digital')).toBeNull();
      expect(AMBIGUOUS_PROGRAM_VALUES).toContain('digital');
      expect(belongsToCourse('digital', 'cee_medical')).toBe(false);
      expect(belongsToCourse('digital', 'see_class_10')).toBe(false);
    });

    it('resolves row course correctly and never leaks SEE or IELTS rows into CEE', () => {
      // SEE row with clear SEE signals
      const seeRow = {
        title: 'SEE Class 10 Compulsory Mathematics - Compound Interest',
        name: 'compulsory_math',
        program_type: 'see_class_10',
      };
      expect(resolveRowCourse(seeRow)).toBe('see_class_10');

      // IELTS row
      const ieltsRow = {
        title: 'IELTS Academic Writing Task 2 Masterclass',
        program_type: 'ielts',
      };
      expect(resolveRowCourse(ieltsRow)).toBe('ielts');

      // CEE Biology row
      const ceeRow = {
        title: 'Human Physiology - Cardiac Cycle & Hemodynamics',
        name: 'biology',
        program_type: 'cee_medical',
      };
      expect(resolveRowCourse(ceeRow)).toBe('cee_medical');
    });

    it('enforces server-side cross-program isolation on CEE curriculum API (CEE-002)', async () => {
      // IELTS attempting to query CEE visual curriculum
      const reqIelts = new NextRequest('http://localhost:4028/api/cee/curriculum?program=ielts');
      const resIelts = await getCurriculum(reqIelts);
      expect(resIelts.status).toBe(403);
      const jsonIelts = await resIelts.json();
      expect(jsonIelts.error.code).toBe('CROSS_PROGRAM_ISOLATION_VIOLATION');

      // SEE attempting to query CEE visual curriculum
      const reqSee = new NextRequest('http://localhost:4028/api/cee/curriculum?program=see');
      const resSee = await getCurriculum(reqSee);
      expect(resSee.status).toBe(403);
      const jsonSee = await resSee.json();
      expect(jsonSee.error.code).toBe('CROSS_PROGRAM_ISOLATION_VIOLATION');

      // Authorized CEE query
      const reqCee = new NextRequest('http://localhost:4028/api/cee/curriculum?program=cee');
      const resCee = await getCurriculum(reqCee);
      expect(resCee.status).toBe(200);
      const jsonCee = await resCee.json();
      expect(jsonCee.data.program).toBe('cee');
    });
  });

  // ── 2. Visual Asset Manifest & Security Hardening ───────────────────────────
  describe('2. Visual Asset Manifest Validation & Origin Security (FND-005)', () => {
    it('accepts valid 2D/3D manifest with compliant CDN origin and sha256 checksum', () => {
      const valid = {
        schemaVersion: '1.0',
        assetId: 'ast_test_valid',
        assetVersionId: 'ast_ver_01',
        kind: 'SIMULATION',
        title: 'Valid Biological Simulation',
        sourceUrl: '/art/heart.png',
        fallbackUrl: '/art/heart.png',
        thumbnailUrl: '/art/heart-thumb.png',
        checksumSha256: '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
        simulation: {
          engine: 'cardiac_cycle',
          playbackModes: ['forward', 'loop'],
          defaultSpeed: 1,
          steps: [{ label: 'Phase 1', note: 'Resting state', drift: 'along' }],
        },
        hotspots: [],
        accessibility: {
          description: 'Valid accessible diagram description',
          reducedMotionSupported: true,
          screenReaderKeyPoints: [],
        },
      };

      const result = validateVisualAssetManifest(valid);
      expect(result.valid).toBe(true);
      expect(result.manifest).toBeDefined();
    });

    it('rejects unapproved untrusted CDN origins', () => {
      const untrusted = {
        schemaVersion: '1.0',
        assetId: 'ast_test_untrusted',
        assetVersionId: 'ast_ver_01',
        kind: 'MODEL_3D',
        title: 'Untrusted Asset',
        sourceUrl: 'http://malicious-external-host.com/trojan.glb',
        fallbackUrl: '/art/heart.png',
        thumbnailUrl: '/art/heart.png',
        checksumSha256: '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
        accessibility: {
          description: 'Untrusted external asset test',
          reducedMotionSupported: true,
          screenReaderKeyPoints: [],
        },
      };

      const result = validateVisualAssetManifest(untrusted);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('sourceUrl') || e.includes('origin'))).toBe(true);
    });

    it('rejects invalid or corrupted SHA256 checksums', () => {
      const badChecksum = {
        schemaVersion: '1.0',
        assetId: 'ast_bad_hash',
        assetVersionId: 'ast_ver_01',
        kind: 'DIAGRAM_2D',
        title: 'Bad Hash Diagram',
        sourceUrl: '/art/heart.png',
        fallbackUrl: '/art/heart.png',
        thumbnailUrl: '/art/heart.png',
        checksumSha256: 'invalid_short_hash_123', // Not 64 hex characters
        accessibility: {
          description: 'Invalid hash test',
          reducedMotionSupported: true,
          screenReaderKeyPoints: [],
        },
      };

      const result = validateVisualAssetManifest(badChecksum);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('checksumSha256'))).toBe(true);
    });
  });

  // ── 3. RBAC & Visual Learning Authority Matrix ──────────────────────────────
  describe('3. Role-Based Access Control (RBAC) Authority Enforcement (FND-002)', () => {
    it('restricts students to visual:read and denies authoring, review, and publication', () => {
      const studentFree = 'student_free';
      const studentPaid = 'student_paid_cee';

      expect(hasPermission(studentFree, 'visual:read')).toBe(true);
      expect(hasPermission(studentFree, 'visual:author')).toBe(false);
      expect(hasPermission(studentFree, 'visual:review')).toBe(false);
      expect(hasPermission(studentFree, 'visual:publish')).toBe(false);

      expect(hasPermission(studentPaid, 'visual:read')).toBe(true);
      expect(hasPermission(studentPaid, 'visual:author')).toBe(false);
      expect(hasPermission(studentPaid, 'visual:review')).toBe(false);
      expect(hasPermission(studentPaid, 'visual:publish')).toBe(false);
    });

    it('authorizes teachers/experts for visual:author and visual:review but not publication', () => {
      const teacher = 'teacher';
      expect(hasPermission(teacher, 'visual:author')).toBe(true);
      expect(hasPermission(teacher, 'visual:review')).toBe(true);
      expect(hasPermission(teacher, 'visual:publish')).toBe(false);
    });

    it('authorizes administrators and super admins for visual:publish', () => {
      const admin = 'admin';
      const superAdmin = 'super_admin';

      expect(hasPermission(admin, 'visual:publish')).toBe(true);
      expect(hasPermission(superAdmin, 'visual:publish')).toBe(true);
    });
  });

  // ── 4. Academic Review State Machine & Immutability ──────────────────────────
  describe('4. Academic Review State Machine & Immutability Guard (CEE Blueprint 08)', () => {
    it('rejects publishing a revision that is not in APPROVED state', async () => {
      const req = new NextRequest('http://localhost:4028/api/cee/admin/publications', {
        method: 'POST',
        body: JSON.stringify({
          lessonId: 'les_audit_01',
          revisionId: 'rev_audit_draft', // Status is DRAFT in mock
          idempotencyKey: 'idem_sec_audit_pub',
        }),
      });

      const res = await publishLesson(req);
      const json = await res.json();

      expect(res.status).toBe(409);
      expect(json.error.code).toBe('ACADEMIC_APPROVAL_REQUIRED');
    });

    it('strictly requires explanatory comments when requesting changes in review', async () => {
      const req = new NextRequest('http://localhost:4028/api/cee/admin/reviews/decision', {
        method: 'POST',
        body: JSON.stringify({
          requestId: 'req_audit_01',
          decision: 'CHANGES_REQUESTED',
          comments: '', // Empty feedback
        }),
      });

      const res = await recordDecision(req);
      const json = await res.json();

      expect(res.status).toBe(422);
      expect(json.error.code).toBe('COMMENTS_REQUIRED');
    });
  });

  // ── 5. Student Telemetry Idempotency & Tamper Resistance ────────────────────
  describe('5. Progress Calculation & Telemetry Tamper Resistance (FND-016)', () => {
    it('deduplicates identical eventId to prevent duplicate event ingestion (CEE-009)', async () => {
      const payload = {
        eventId: 'evt_sec_audit_dedup_001',
        publicationId: 'pub_heart_v1',
        assetVersionId: 'ast_ver_01',
        type: 'STAGE_COMPLETED',
        metadata: { stageIndex: 2 },
      };

      const req1 = new NextRequest('http://localhost:4028/api/cee/me/lessons/human-heart/events', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const res1 = await recordEvent(req1, { params: Promise.resolve({ id: 'human-heart' }) });
      const json1 = await res1.json();
      expect(json1.data.recorded).toBe(true);
      expect(json1.data.deduplicated).toBe(false);

      // Replay identical eventId
      const req2 = new NextRequest('http://localhost:4028/api/cee/me/lessons/human-heart/events', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const res2 = await recordEvent(req2, { params: Promise.resolve({ id: 'human-heart' }) });
      const json2 = await res2.json();
      expect(json2.data.recorded).toBe(true);
      expect(json2.data.deduplicated).toBe(true);
    });

    it('computes completion mathematically on the server and rejects client tampering (CEE-008)', async () => {
      const tamperedPayload = {
        publicationId: 'pub_heart_v1',
        inspectedHotspotsCount: 1,
        totalHotspotsCount: 6,
        quizScore: 0,
        quizTotal: 3,
        completed: true, // Client tampering attempting to self-award 100% completion
      };

      const req = new NextRequest('http://localhost:4028/api/cee/me/lessons/human-heart/progress', {
        method: 'POST',
        body: JSON.stringify(tamperedPayload),
      });
      const res = await recordProgress(req, { params: Promise.resolve({ id: 'human-heart' }) });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data.completed).toBe(false); // Server overridden client claim
      expect(json.data.completionPercentage).toBeLessThan(80);
      expect(json.data.verifiedByServer).toBe(true);
    });
  });
});
