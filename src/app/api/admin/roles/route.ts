import { NextRequest, NextResponse } from 'next/server';
import { verifyServerPermission, checkDuplicateSubmission } from '@/lib/auth/serverGuard';
import { createAdminClient } from '@/lib/supabase/admin';
import { AuditService, AUDIT_ACTIONS } from '@/lib/services/auditService';
import { ROLE_HIERARCHY, ROLE_PERMISSIONS } from '@/lib/auth/rbac';
import { UserRoleType } from '@/types/lms';

const VALID_ROLES: UserRoleType[] = [
  'visitor',
  'student_free',
  'student_paid_see',
  'student_paid_cee',
  'student_all_access',
  'support_staff',
  'payment_staff',
  'content_manager',
  'teacher',
  'admin',
  'super_admin',
];

export async function GET(req: NextRequest) {
  const guard = await verifyServerPermission(req, 'admin:access');
  if (!guard.authorized) {
    return guard.response;
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  try {
    // List users with staff roles or query profiles
    const { data: staffProfiles, error } = await admin
      .from('user_profiles')
      .select('id, full_name, phone, role, is_admin, created_at')
      .in('role', ['teacher', 'admin', 'super_admin', 'payment_staff', 'content_manager', 'support_staff'])
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Get auth email for staff
    const { data: authData } = await admin.auth.admin.listUsers({ perPage: 1000 });
    const authMap = new Map((authData?.users || []).map((u) => [u.id, u.email]));

    const staffWithEmails = (staffProfiles || []).map((p: any) => ({
      ...p,
      email: authMap.get(p.id) || '',
      role: p.role || (p.is_admin ? 'admin' : 'student_free'),
    }));

    // Construct role matrix for UI
    const rolesMetadata = Object.entries(ROLE_HIERARCHY).map(([name, level]) => ({
      name,
      level,
      permissions: Array.from(ROLE_PERMISSIONS[name as UserRoleType] || []),
      isStaffRole: ['teacher', 'admin', 'super_admin', 'payment_staff', 'content_manager', 'support_staff'].includes(name),
    }));

    return NextResponse.json({
      success: true,
      roles: rolesMetadata,
      staffUsers: staffWithEmails,
    });
  } catch (err: any) {
    console.error('admin/roles GET error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // STRICT: Role assignment requires users:assign_role (Super Admin ONLY)
  const guard = await verifyServerPermission(req, 'users:assign_role');
  if (!guard.authorized) {
    return guard.response;
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  try {
    const body = await req.json();
    const { targetUserId, targetEmail, newRole } = body;

    if (!newRole || !VALID_ROLES.includes(newRole)) {
      return NextResponse.json(
        { success: false, error: `Invalid role specified. Must be one of: ${VALID_ROLES.join(', ')}` },
        { status: 400 }
      );
    }

    let userId = targetUserId;
    if (!userId && targetEmail) {
      const { data: userList } = await admin.auth.admin.listUsers();
      const match = (userList?.users || []).find((u) => u.email?.toLowerCase() === targetEmail.toLowerCase().trim());
      if (match) userId = match.id;
    }

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Target user not found.' }, { status: 404 });
    }

    // Prevent duplicate rapid submission
    const duplicateKey = `role_assign_${userId}_${newRole}`;
    if (checkDuplicateSubmission(duplicateKey)) {
      return NextResponse.json({ success: true, message: 'Role assignment already being processed.' });
    }

    // Fetch existing profile
    const { data: existingProfile } = await admin
      .from('user_profiles')
      .select('id, role, is_admin, full_name')
      .eq('id', userId)
      .single();

    const previousRole = existingProfile?.role || (existingProfile?.is_admin ? 'admin' : 'student_free');

    if (previousRole === newRole) {
      return NextResponse.json({
        success: true,
        message: `User is already assigned role '${newRole}'. No changes applied.`,
      });
    }

    // Apply update
    const isAdminRole = newRole === 'admin' || newRole === 'super_admin';
    const { error: updateErr } = await admin
      .from('user_profiles')
      .update({
        role: newRole,
        is_admin: isAdminRole,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateErr) throw updateErr;

    // Record audit event
    await AuditService.recordAuditEvent({
      actorId: guard.user.id,
      actorEmail: guard.email,
      action: AUDIT_ACTIONS.ROLE_ASSIGN,
      resourceType: 'user_role',
      resourceId: userId,
      changesDiff: {
        previousRole,
        newRole,
        targetUserName: existingProfile?.full_name || 'User',
      },
      ipAddress: guard.ipAddress,
      userAgent: guard.userAgent,
    });

    return NextResponse.json({
      success: true,
      message: `Successfully assigned role '${newRole}' to user.`,
      previousRole,
      newRole,
    });
  } catch (err: any) {
    console.error('admin/roles POST error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
