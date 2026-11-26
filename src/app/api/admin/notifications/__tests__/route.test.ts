import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { GET, POST } from '../route';
import * as serverGuard from '@/lib/auth/serverGuard';
import * as adminSupabase from '@/lib/supabase/admin';

describe('Admin Notifications API (/api/admin/notifications)', () => {
  let mockAdminClient: any;
  let mockNotificationsInsert: any;
  let mockAnnouncementsInsert: any;
  let mockAuditLogsInsert: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockNotificationsInsert = vi.fn().mockResolvedValue({ data: null, error: null });
    mockAnnouncementsInsert = vi.fn().mockResolvedValue({ data: null, error: null });
    mockAuditLogsInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: { id: 'audit_123' }, error: null }),
      }),
    });

    const mockStudents = [
      { id: 'student_1', full_name: 'MD AAZAM ALI', cee_year: 2026, is_admin: false },
      { id: 'student_2', full_name: 'Sakan', cee_year: 2026, is_admin: false },
      { id: 'student_3', full_name: 'SEE Student', cee_year: null, is_admin: false },
    ];

    mockAdminClient = {
      from: vi.fn((table: string) => {
        if (table === 'notifications') {
          return {
            insert: mockNotificationsInsert,
          };
        }
        if (table === 'announcements') {
          return {
            insert: mockAnnouncementsInsert,
            select: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({
                  data: [
                    {
                      id: 'ann_1',
                      title: 'Welcome Exam',
                      body: 'Exam is starting.',
                      target_audience: 'all',
                      created_at: '2026-11-20T10:00:00Z',
                    },
                  ],
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'admin_audit_logs') {
          return {
            insert: mockAuditLogsInsert,
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({
                    data: [
                      {
                        id: 'audit_log_1',
                        action: 'dispatch_notification',
                        details: {
                          title: 'Grand Mock 1 Ready',
                          body: 'Score cards available.',
                          target: 'cee',
                          recipient_label: 'CEE Candidates',
                          dispatched_count: 24,
                          link_url: '/mock-tests',
                        },
                        created_at: '2026-11-25T12:00:00Z',
                      },
                    ],
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        if (table === 'user_profiles') {
          return {
            select: vi.fn().mockReturnValue({
              not: vi.fn().mockResolvedValue({
                data: mockStudents.filter((s) => s.cee_year !== null),
                error: null,
              }),
              is: vi.fn().mockResolvedValue({
                data: mockStudents.filter((s) => s.cee_year === null),
                error: null,
              }),
              then: (resolve: any) => resolve({ data: mockStudents, error: null }),
            }),
          };
        }
        return {};
      }),
    };

    vi.spyOn(adminSupabase, 'createAdminClient').mockReturnValue(mockAdminClient);
  });

  describe('GET /api/admin/notifications', () => {
    it('returns 401/403 when guard denies access', async () => {
      vi.spyOn(serverGuard, 'verifyServerPermission').mockResolvedValue({
        authorized: false,
        response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      });

      const req = new NextRequest('http://localhost:3000/api/admin/notifications');
      const res = await GET(req);
      expect(res.status).toBe(401);
    });

    it('returns recent dispatches from audit logs when authorized', async () => {
      vi.spyOn(serverGuard, 'verifyServerPermission').mockResolvedValue({
        authorized: true,
        user: { id: 'admin_1', email: 'admin@samyakcee.com' },
        role: 'super_admin',
        email: 'admin@samyakcee.com',
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
      });

      const req = new NextRequest('http://localhost:3000/api/admin/notifications');
      const res = await GET(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(Array.isArray(json.dispatches)).toBe(true);
      expect(json.dispatches.length).toBe(1);
      expect(json.dispatches[0].title).toBe('Grand Mock 1 Ready');
      expect(json.dispatches[0].recipient).toBe('CEE Candidates');
      expect(json.dispatches[0].count).toBe(24);
      expect(json.dispatches[0].link_url).toBe('/mock-tests');
    });
  });

  describe('POST /api/admin/notifications', () => {
    const adminAuth: serverGuard.GuardSuccess = {
      authorized: true,
      user: { id: 'admin_1', email: 'admin@samyakcee.com' },
      role: 'super_admin',
      email: 'admin@samyakcee.com',
      ipAddress: '127.0.0.1',
      userAgent: 'test-agent',
    };

    it('returns 401/403 when unauthenticated or unauthorized', async () => {
      vi.spyOn(serverGuard, 'verifyServerPermission').mockResolvedValue({
        authorized: false,
        response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
      });

      const req = new NextRequest('http://localhost:3000/api/admin/notifications', {
        method: 'POST',
        body: JSON.stringify({ title: 'Test', body: 'Test body' }),
      });
      const res = await POST(req);
      expect(res.status).toBe(403);
    });

    it('returns 400 when title is missing or too short', async () => {
      vi.spyOn(serverGuard, 'verifyServerPermission').mockResolvedValue(adminAuth);

      const req = new NextRequest('http://localhost:3000/api/admin/notifications', {
        method: 'POST',
        body: JSON.stringify({ title: 'Hi', body: 'Valid message body here' }),
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toMatch(/title must be at least 3 characters/i);
    });

    it('returns 400 when body is missing or too short', async () => {
      vi.spyOn(serverGuard, 'verifyServerPermission').mockResolvedValue(adminAuth);

      const req = new NextRequest('http://localhost:3000/api/admin/notifications', {
        method: 'POST',
        body: JSON.stringify({ title: 'Valid Title Here', body: 'Hey' }),
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toMatch(/body must be at least 5 characters/i);
    });

    it('returns 400 when targetType is invalid', async () => {
      vi.spyOn(serverGuard, 'verifyServerPermission').mockResolvedValue(adminAuth);

      const req = new NextRequest('http://localhost:3000/api/admin/notifications', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Valid Title',
          body: 'Valid message body',
          targetType: 'invalid_target',
        }),
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toMatch(/targetType must be one of/i);
    });

    it('dispatches notification to all students and records audit log', async () => {
      vi.spyOn(serverGuard, 'verifyServerPermission').mockResolvedValue(adminAuth);

      const req = new NextRequest('http://localhost:3000/api/admin/notifications', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Grand Mock 2 Live',
          body: 'Leaderboard is now open for all students.',
          targetType: 'all',
          linkUrl: 'mock-tests',
        }),
      });
      const res = await POST(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.count).toBe(3);
      expect(json.dispatch.title).toBe('Grand Mock 2 Live');
      expect(json.dispatch.recipient).toBe('All Registered Students');
      expect(json.dispatch.link_url).toBe('/mock-tests');

      // Verify notifications insert called with sanitized deep link
      expect(mockNotificationsInsert).toHaveBeenCalledTimes(1);
      const insertedRows = mockNotificationsInsert.mock.calls[0][0];
      expect(insertedRows.length).toBe(3);
      expect(insertedRows[0].title).toBe('Grand Mock 2 Live');
      expect(insertedRows[0].action_url).toBe('/mock-tests');

      // Verify announcements insert called
      expect(mockAnnouncementsInsert).toHaveBeenCalledTimes(1);

      // Verify audit logs insert called
      expect(mockAuditLogsInsert).toHaveBeenCalledTimes(1);
    });

    it('filters recipients when targetType is cee', async () => {
      vi.spyOn(serverGuard, 'verifyServerPermission').mockResolvedValue(adminAuth);

      const req = new NextRequest('http://localhost:3000/api/admin/notifications', {
        method: 'POST',
        body: JSON.stringify({
          title: 'CEE Urgent Update',
          body: 'Biochem formula revision session tonight.',
          targetType: 'cee',
          linkUrl: '/live-classes',
        }),
      });
      const res = await POST(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.count).toBe(2);
      expect(json.dispatch.recipient).toBe('CEE Candidates');
    });

    it('filters recipients when targetType is see', async () => {
      vi.spyOn(serverGuard, 'verifyServerPermission').mockResolvedValue(adminAuth);

      const req = new NextRequest('http://localhost:3000/api/admin/notifications', {
        method: 'POST',
        body: JSON.stringify({
          title: 'SEE Mathematics Model Paper',
          body: 'Check out the compulsory math question solutions.',
          targetType: 'see',
          linkUrl: '/see/subject/mathematics',
        }),
      });
      const res = await POST(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.count).toBe(1);
      expect(json.dispatch.recipient).toBe('SEE Candidates');
    });
  });
});
