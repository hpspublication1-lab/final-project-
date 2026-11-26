import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '../route';
import * as routeAuth from '@/lib/supabase/route-auth';

describe('FCM Token Registration API (/api/notifications/fcm-token)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET returns status ONLINE and device count', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.status).toBe('ONLINE');
    expect(typeof json.totalRegisteredDevices).toBe('number');
  });

  it('POST returns 400 when token is missing or invalid', async () => {
    vi.spyOn(routeAuth, 'getSessionUser').mockResolvedValue(null);

    const req = new NextRequest('http://localhost:3000/api/notifications/fcm-token', {
      method: 'POST',
      body: JSON.stringify({ token: '' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/valid fcm token is required/i);
  });

  it('POST registers valid FCM token successfully', async () => {
    vi.spyOn(routeAuth, 'getSessionUser').mockResolvedValue({
      id: 'student_fcm_user_1',
      email: 'student@example.com',
      role: 'student_free',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    } as any);

    const req = new NextRequest('http://localhost:3000/api/notifications/fcm-token', {
      method: 'POST',
      body: JSON.stringify({
        token: 'fcm_sample_device_registration_token_1234567890',
        userAgent: 'Mozilla/5.0 Test Browser',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.message).toMatch(/registered successfully/i);
  });
});
