import 'server-only';
import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Server-only Supabase client using the SERVICE ROLE key. Bypasses RLS —
 * required for trusted writes like payment_transactions (which deliberately
 * has NO client write policies) and post-payment plan activation.
 *
 * NEVER import this from client components ('server-only' enforces that at
 * build time). The key lives in SUPABASE_SERVICE_ROLE_KEY (no NEXT_PUBLIC_).
 */
export function createAdminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createSupabaseClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
