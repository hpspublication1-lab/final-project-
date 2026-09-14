import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

// Single shared browser client. Cached on globalThis so that the app
// uses ONE Supabase client instance across all components (shared auth session, no cross-tab desync).
const SINGLETON_KEY = '__samyak_supabase_browser_client__';
type GlobalWithClient = typeof globalThis & { [SINGLETON_KEY]?: SupabaseClient };

export function createClient(): SupabaseClient {
  const g = globalThis as GlobalWithClient;
  if (!g[SINGLETON_KEY]) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';
    g[SINGLETON_KEY] = createBrowserClient(url, anonKey);
  }
  return g[SINGLETON_KEY]!;
}
