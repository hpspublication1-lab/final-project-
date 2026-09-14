import { NextRequest, NextResponse } from 'next/server';
import { verifyServerPermission } from '@/lib/auth/serverGuard';
import { AuditService, AUDIT_ACTIONS } from '@/lib/services/auditService';

// Operational platform configuration state (in-memory persistent state with fallback)
let platformSettings = {
  maintenanceMode: false,
  registrationOpen: true,
  fonepayActive: true,
  esewaActive: true,
  manualBankTransferActive: true,
  allowFreeDiagnosticTests: true,
  allowAiVisionEvaluations: true,
  maxConcurrentLiveClasses: 10,
  platformVersion: 'v2.4.0-production',
  updatedAt: new Date().toISOString(),
  updatedBy: 'system',
};

export async function GET(req: NextRequest) {
  const guard = await verifyServerPermission(req, 'admin:access');
  if (!guard.authorized) {
    return guard.response;
  }

  return NextResponse.json({ success: true, settings: platformSettings });
}

export async function POST(req: NextRequest) {
  // STRICT: Modifying platform settings requires settings:manage (Admin/Super Admin only)
  const guard = await verifyServerPermission(req, 'settings:manage');
  if (!guard.authorized) {
    return guard.response;
  }

  try {
    const body = await req.json();
    const previousSettings = { ...platformSettings };

    platformSettings = {
      ...platformSettings,
      ...body,
      updatedAt: new Date().toISOString(),
      updatedBy: guard.email,
    };

    // Log audit event
    await AuditService.recordAuditEvent({
      actorId: guard.user.id,
      actorEmail: guard.email,
      action: AUDIT_ACTIONS.SETTINGS_UPDATE,
      resourceType: 'platform_settings',
      resourceId: 'global',
      changesDiff: {
        previous: previousSettings,
        updated: platformSettings,
      },
      ipAddress: guard.ipAddress,
      userAgent: guard.userAgent,
    });

    return NextResponse.json({
      success: true,
      message: 'Platform settings updated successfully.',
      settings: platformSettings,
    });
  } catch (err: any) {
    console.error('admin/settings POST error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
