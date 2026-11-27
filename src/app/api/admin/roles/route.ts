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
    const [{ data: allProfiles, error }, { data: authData }] = await Promise.all([
      admin.from('user_profiles').select('*').order('created_at', { ascending: false }),
      admin.auth.admin.listUsers({ perPage: 1000 }),
    ]);

    if (error) throw error;

    const authMap = new Map((authData?.users || []).map((u) => [u.id, u]));
    const staffRoleSet = new Set(['teacher', 'admin', 'super_admin', 'payment_staff', 'content_manager', 'support_staff']);

    const staffWithEmails = (allProfiles || [])
      .map((p: any) => {
        const au = authMap.get(p.id);
        const metaRole = au?.app_metadata?.role || au?.user_metadata?.role;
        const resolvedRole = p.role || p.role_name || metaRole || (p.is_admin ? 'admin' : 'student_free');
        return {
          id: p.id,
          full_name: p.full_name || au?.user_metadata?.full_name || 'Staff Member',
          phone: p.phone || au?.user_metadata?.phone || '',
          email: au?.email || '',
          role: resolvedRole,
          is_admin: !!p.is_admin,
          created_at: p.created_at,
        };
      })
      .filter((u: any) => u.is_admin || staffRoleSet.has(String(u.role).toLowerCase()));

    // Construct role matrix for UI
    const rolesMetadata = Object.entries(ROLE_HIERARCHY).map(([name, level]) => ({
      name,
      level,
      permissions: Array.from(ROLE_PERMISSIONS[name as UserRoleType] || []),
      isStaffRole: staffRoleSet.has(name),
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
    const { data: userList } = await admin.auth.admin.listUsers({ perPage: 1000 });
    if (!userId && targetEmail) {
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
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    const targetAuthUser = (userList?.users || []).find((u) => u.id === userId);
    const previousRole =
      (existingProfile as any)?.role ||
      // app_metadata is server-written; user_metadata can be edited by the user themselves.
      targetAuthUser?.app_metadata?.role ||
      targetAuthUser?.user_metadata?.role ||
      (existingProfile?.is_admin ? 'admin' : 'student_free');

    if (previousRole === newRole) {
      return NextResponse.json({
        success: true,
        message: `User is already assigned role '${newRole}'. No changes applied.`,
      });
    }

    // Apply update to Auth metadata + user_profiles.is_admin
    const isAdminRole = newRole === 'admin' || newRole === 'super_admin';
    await admin.auth.admin.updateUserById(userId, {
      app_metadata: { ...(targetAuthUser?.app_metadata || {}), role: newRole },
      user_metadata: { ...(targetAuthUser?.user_metadata || {}), role: newRole, is_admin: isAdminRole },
    });

    const { error: updateErr } = await admin
      .from('user_profiles')
      .update({
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
