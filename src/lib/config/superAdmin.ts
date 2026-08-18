/**
 * Super-admin allowlist.
 *
 * `/admin` (the full site control panel) belongs to SUPER ADMINS only. This is
 * a hardcoded, server-checked email allowlist — no DB column, so it works
 * regardless of the diverged schema and can't be granted by flipping a row.
 *
 * `is_admin` on user_profiles is a separate, lesser flag (used for premium
 * entitlement / staff reads); being is_admin does NOT grant /admin access.
 *
 * To add or remove a super admin, edit this list (lowercase emails).
 */
export const SUPER_ADMINS: readonly string[] = [
  'surajgaming02@gmail.com',
];

export function isSuperAdmin(email?: string | null): boolean {
  if (!email) return false;
  return SUPER_ADMINS.includes(email.trim().toLowerCase());
}
