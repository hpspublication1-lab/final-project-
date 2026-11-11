import { NextRequest, NextResponse } from 'next/server';
import { verifyServerPermission } from '@/lib/auth/serverGuard';
import { AuditService } from '@/lib/services/auditService';
import {
  ROLE_HIERARCHY,
  ROLE_PERMISSIONS,
  PERMISSION_CATEGORIES,
  getRolePermissionOverrides,
  setRolePermissionOverride,
  getEffectivePermissions,
} from '@/lib/auth/rbac';
import { UserRoleType, PermissionCode } from '@/types/lms';

export const dynamic = 'force-dynamic';

const EDITABLE_STAFF_ROLES: { role: UserRoleType; label: string; badge: string; level: number }[] = [
  { role: 'super_admin', label: 'Super Admin', badge: 'bg-primary/20 text-primary border-primary/30', level: 100 },
  { role: 'admin', label: 'Administrator', badge: 'bg-chem-light text-chem border-chem/30', level: 90 },
  { role: 'teacher', label: 'Faculty / Teacher', badge: 'bg-bio-light text-bio border-bio/30', level: 70 },
  { role: 'content_manager', label: 'Content Manager', badge: 'bg-physics-light text-physics border-physics/30', level: 60 },
  { role: 'payment_staff', label: 'Payment Staff / Accountant', badge: 'bg-ma-light text-ma border-ma/30', level: 55 },
  { role: 'support_staff', label: 'Support / Telecaller', badge: 'bg-muted text-foreground border-border', level: 50 },
];

/**
  * GET /api/admin/roles/matrix
  * Returns complete RBAC matrix definition, active overrides, and categories.
  */
export async function GET(req: NextRequest) {
  const guard = await verifyServerPermission(req, 'admin:access');
  if (!guard.authorized) {
    return guard.response;
  }

  const overrides = getRolePermissionOverrides();

  // Build matrix for each staff role
  const matrix: Record<string, string[]> = {};
  for (const item of EDITABLE_STAFF_ROLES) {
    const effective = getEffectivePermissions(item.role);
    matrix[item.role] = Array.from(effective);
  }

  return NextResponse.json({
    success: true,
    roles: EDITABLE_STAFF_ROLES,
    categories: PERMISSION_CATEGORIES,
    matrix,
    overrides,
  });
}

/**
  * POST /api/admin/roles/matrix
  * Super Admin only: Toggles a specific permission for a role.
  */
export async function POST(req: NextRequest) {
  const guard = await verifyServerPermission(req, 'users:assign_role');
  if (!guard.authorized) {
    return guard.response;
  }

  try {
    const body = await req.json();
    const { role, permission, granted } = body as {
      role: UserRoleType;
      permission: PermissionCode;
      granted: boolean;
    };

    if (!role || !permission || typeof granted !== 'boolean') {
      return NextResponse.json(
        { error: 'Missing role, permission, or granted boolean' },
        { status: 400 }
      );
    }

    // Safety constraint: Super Admin cannot strip root permissions from itself
    if (role === 'super_admin' && !granted) {
      if (permission === 'users:assign_role' || permission === 'admin:access' || permission === 'audit:view') {
        return NextResponse.json(
          { error: `Cannot revoke root privilege "${permission}" from Super Admin.` },
          { status: 403 }
        );
      }
    }

    // Apply the runtime override
    setRolePermissionOverride(role, permission, granted);

    // Audit log this security change
    await AuditService.recordAuditEvent({
      actorId: guard.user.id,
      actorEmail: guard.email,
      action: 'rbac_permission_override',
      resourceType: 'role_permission',
      resourceId: `${role}:${permission}`,
      changesDiff: {
        role,
        permission,
        granted,
        modifiedBy: guard.email,
        timestamp: new Date().toISOString(),
      },
      ipAddress: guard.ipAddress,
      userAgent: guard.userAgent,
    });

    const effective = getEffectivePermissions(role);

    return NextResponse.json({
      success: true,
      message: `Updated permission "${permission}" for role "${role}" to ${granted ? 'GRANTED' : 'REVOKED'}.`,
      role,
      permission,
      granted,
      effectivePermissions: Array.from(effective),
    });
  } catch (err: any) {
    console.error('matrix POST error:', err);
    return NextResponse.json({ error: err.message || 'Failed to update permission' }, { status: 500 });
  }
}
