/**
 * Samyak Tutor LMS — Authoritative Server Guard
 * Enforces server-side permission validation, identity resolution,
 * payment staff boundary checks, and duplicate submission prevention.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '../supabase/route-auth';
import { createAdminClient } from '../supabase/admin';
import { isSuperAdmin } from '../config/superAdmin';
import { hasPermission, normalizeRoleType } from './rbac';
import { UserRoleType, PermissionCode } from '@/types/lms';

export interface GuardSuccess {
  authorized: true;
  user: {
    id: string;
    email?: string | null;
  };
  role: UserRoleType;
  email: string;
  ipAddress: string;
  userAgent: string;
}

export interface GuardFailure {
  authorized: false;
  response: NextResponse;
}

export type GuardResult = GuardSuccess | GuardFailure;

// In-memory idempotency cache for duplicate submission prevention
const activeActionTokens = new Map<string, number>();

/**
 * Checks and prevents rapid duplicate requests with the same action key.
 */
export function checkDuplicateSubmission(actionKey: string, windowMs = 3000): boolean {
  const now = Date.now();
  const lastTime = activeActionTokens.get(actionKey);

  if (lastTime && now - lastTime < windowMs) {
    return true; // Is duplicate
  }

  activeActionTokens.set(actionKey, now);

  // Clean up old keys periodically
  if (activeActionTokens.size > 1000) {
    for (const [k, v] of activeActionTokens.entries()) {
      if (now - v > windowMs * 2) {
        activeActionTokens.delete(k);
      }
    }
  }

  return false;
}

/**
 * Authoritative Server Permission Verification Guard.
 * Validates authentication and evaluates required permissions against the resolved user role.
 */
export async function verifyServerPermission(
  req: Request | NextRequest,
  requiredPermission: PermissionCode
): Promise<GuardResult> {
  // 1. Authenticate user from session / bearer token
  const user = await getSessionUser(req);
  if (!user || !user.id) {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, error: 'Unauthorized: Authentication required.' },
        { status: 401 }
      ),
    };
  }

  const email = (user.email || '').toLowerCase().trim();
  const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
  const userAgent = req.headers.get('user-agent') || 'api-client';

  // 2. Resolve Role
  let role: UserRoleType = 'student_free';

  // Super Admin Check via email allowlist
  if (isSuperAdmin(email)) {
    role = 'super_admin';
  } else {
    // Query database profile for authoritative role
    try {
      const admin = createAdminClient();
      if (admin) {
        const { data: profile } = await admin
          .from('user_profiles')
          .select('role, role_name, is_admin, is_banned')
          .eq('id', user.id)
          .single();

        if (profile?.is_banned) {
          return {
            authorized: false,
            response: NextResponse.json(
              { success: false, error: 'Forbidden: Your account has been suspended.' },
              { status: 403 }
            ),
          };
        }

        if (profile) {
          const normalized = normalizeRoleType(profile.role || (profile as any).role_name, profile.is_admin);
          role = normalized === 'visitor' ? 'student_free' : normalized;
        }
      }
    } catch (err) {
      console.warn('[ServerGuard] Failed to fetch user profile role, defaulting to student_free:', err);
    }
  }

  // 3. Verify Permission
  const isAllowed = hasPermission(role, requiredPermission);

  if (!isAllowed) {
    return {
      authorized: false,
      response: NextResponse.json(
        {
          success: false,
          error: `Forbidden: Role '${role}' lacks permission '${requiredPermission}'.`,
        },
        { status: 403 }
      ),
    };
  }

  return {
    authorized: true,
    user: {
      id: user.id,
      email,
    },
    role,
    email,
    ipAddress,
    userAgent,
  };
}
