import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSessionUser } from '@/lib/supabase/route-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { evaluateAccessContext, RawUserProfile, RawEnrollment } from '@/lib/auth/accessControl';

export const dynamic = 'force-dynamic';

function maskPhone(phone?: string | null): string {
  if (!phone) return 'Candidate';
  const clean = phone.trim();
  if (clean.length <= 4) return '****';
  return clean.slice(0, 3) + '****' + clean.slice(-3);
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, code: 'AUTH_REQUIRED', error: 'Authentication required for offline downloads.' },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { videoId, deviceId, deviceName } = body;

    if (!videoId) {
      return NextResponse.json(
        { success: false, code: 'INVALID_REQUEST', error: 'Video ID is required.' },
        { status: 400 }
      );
    }

    if (!deviceId) {
      return NextResponse.json(
        { success: false, code: 'DEVICE_ID_REQUIRED', error: 'Unique device ID is required to bind offline content.' },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Database unavailable' }, { status: 500 });
    }

    // 1. Fetch video lecture details
    const { data: video } = await admin
      .from('video_lectures')
      .select('id, title, video_url, is_premium, is_active, batch_id, subject_id')
      .eq('id', videoId)
      .maybeSingle();

    if (!video || !video.is_active || !video.video_url) {
      return NextResponse.json(
        { success: false, code: 'NOT_FOUND', error: 'Lecture not found or unavailable for download.' },
        { status: 404 }
      );
    }

    // 2. Fetch user profile and enrollments to verify active paid subscription
    const [profileRes, enrollmentsRes] = await Promise.all([
      admin.from('profiles').select('*').eq('id', user.id).maybeSingle(),
      admin.from('enrollments').select('*').eq('student_id', user.id),
    ]);

    const profile: RawUserProfile = profileRes.data || { id: user.id };
    const rawEnrollments: RawEnrollment[] = (enrollmentsRes.data || []).map((e: any) => ({
      id: e.id,
      course_id: e.course_id,
      batch_id: e.batch_id,
      status: e.status || e.enrollment_status,
      created_at: e.created_at,
    }));

    const accessContext = evaluateAccessContext(user, profile, rawEnrollments);
    const isPrivileged =
      accessContext.role === 'super_administrator' ||
      accessContext.role === 'administrator' ||
      accessContext.role === 'teacher';

    const hasPaidAccess =
      isPrivileged ||
      Object.values(accessContext.courses).some((c) => c.canAccessFullCourse);

    if (!hasPaidAccess) {
      return NextResponse.json(
        {
          success: false,
          code: 'DOWNLOAD_REQUIRES_ACTIVE_SUBSCRIPTION',
          error: 'Offline download is an exclusive feature for enrolled paid students.',
        },
        { status: 403 }
      );
    }

    // 3. Device binding validation (Max 2 devices)
    // We record or check device registration in user metadata or active_devices
    const registeredDevices: string[] = (user.user_metadata?.offline_devices || []) as string[];
    let updatedDevices = [...registeredDevices];

    if (!registeredDevices.includes(deviceId)) {
      if (registeredDevices.length >= 2) {
        return NextResponse.json(
          {
            success: false,
            code: 'DEVICE_LIMIT_EXCEEDED',
            error: 'You have reached the maximum allowed 2 offline devices. Please deregister an existing device from your profile.',
            deviceCount: registeredDevices.length,
          },
          { status: 403 }
        );
      }
      updatedDevices.push(deviceId);
      try {
        await admin.auth.admin.updateUserById(user.id, {
          user_metadata: {
            ...user.user_metadata,
            offline_devices: updatedDevices,
          },
        });
      } catch (devErr) {
        console.warn('Failed to persist registered device in user_metadata:', devErr);
      }
    }

    // 4. Generate 24-hour time-limited signed download token
    const tokenKey = process.env.BUNNY_TOKEN_KEY || 'samyak-lms-offline-signing-secret';
    const expires = Math.floor(Date.now() / 1000) + 86400; // 24 hours
    const url = new URL(video.video_url);
    const dirPath = url.pathname.substring(0, url.pathname.lastIndexOf('/') + 1);

    const hashBase = tokenKey + dirPath + expires;
    const token = crypto
      .createHash('sha256')
      .update(hashBase)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const signedDownloadUrl = `${url.origin}${url.pathname}?token=${token}&expires=${expires}&offline=1`;

    // 5. Watermark and DRM policies for mobile player
    const candidateName = (profile as any).full_name || user.email?.split('@')[0] || 'Candidate';
    const candidatePhone = (profile as any).phone || user.phone || null;

    return NextResponse.json({
      success: true,
      data: {
        videoId: video.id,
        title: video.title,
        downloadUrl: signedDownloadUrl,
        expiresAt: new Date(expires * 1000).toISOString(),
        expiresInSeconds: 86400,
        boundDeviceId: deviceId,
        deviceName: deviceName || 'Mobile Device',
        drmPolicy: {
          allowScreenRecording: false,
          allowExternalDisplay: false,
          maxOfflinePlayDays: 7,
          watermark: {
            text: `${candidateName} (${maskPhone(candidatePhone)})`,
            subText: `ID: ${user.id.slice(0, 8)} • Samyak Tutor`,
            opacity: 0.25,
            intervalSeconds: 20,
          },
        },
      },
    });
  } catch (err: any) {
    console.error('video/offline-download error:', err);
    return NextResponse.json(
      { success: false, code: 'SERVER_ERROR', error: 'Failed to authorize offline download.' },
      { status: 500 }
    );
  }
}
