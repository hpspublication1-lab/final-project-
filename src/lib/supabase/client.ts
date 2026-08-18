import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

// Single shared browser client. Cached on globalThis so that even if this
// module and its legacy `client.tsx` twin were both to load, the app uses ONE
// Supabase client instance (shared auth session, no cross-tab desync).
// TODO: delete the redundant `client.tsx` — this `.ts` file is the canonical one.
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
