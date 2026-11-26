import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/supabase/route-auth';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

// In-memory token storage (token -> metadata)
const registeredTokens = new Map<string, { userId?: string; userAgent?: string; updatedAt: number }>();

export function getRegisteredFCMTokens(): string[] {
  return Array.from(registeredTokens.keys());
}

/**
 * POST /api/notifications/fcm-token
 * Registers or updates a device's Firebase Cloud Messaging (FCM) push token.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    const body = await req.json().catch(() => ({}));
    const { token, userAgent } = body;

    if (!token || typeof token !== 'string' || token.trim().length < 10) {
      return NextResponse.json(
        { success: false, error: 'Valid FCM token is required.' },
        { status: 400 }
      );
    }

    const cleanToken = token.trim();
    const cleanUserAgent = typeof userAgent === 'string' ? userAgent.slice(0, 300) : 'unknown';

    // 1. Save to in-memory active tokens registry
    registeredTokens.set(cleanToken, {
      userId: user?.id,
      userAgent: cleanUserAgent,
      updatedAt: Date.now(),
    });

    // 2. Persist to admin_audit_logs if Supabase admin client is available
    try {
      const admin = createAdminClient();
      if (admin && user?.id) {
        await admin.from('admin_audit_logs').insert({
          admin_id: user.id,
          action: 'fcm_token_register',
          target_type: 'fcm_device',
          target_id: null,
          details: {
            token_prefix: cleanToken.slice(0, 16) + '...',
            token: cleanToken,
            user_id: user.id,
            user_agent: cleanUserAgent,
          },
          ip_address: req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1',
        });
      }
    } catch (auditErr) {
      // Non-fatal logging
      console.warn('[FCM Token] Audit log persistence warning:', auditErr);
    }

    return NextResponse.json({
      success: true,
      message: 'FCM device token registered successfully.',
      registeredAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[FCM Token POST] Error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error.' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/notifications/fcm-token
 * Returns the count and status of registered FCM devices.
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    totalRegisteredDevices: registeredTokens.size,
    status: 'ONLINE',
  });
}
