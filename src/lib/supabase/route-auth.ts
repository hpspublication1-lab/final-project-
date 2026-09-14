import { createServerClient } from '@supabase/ssr';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { cookies, headers } from 'next/headers';

export async function getSessionUser(req?: Request) {
  let cookieStore = null;
  try {
    cookieStore = await cookies();
  } catch {
    // cookies() might throw outside Next.js request lifecycle (e.g. background tasks or tests)
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key',
    {
      cookies: {
        getAll: () => (cookieStore ? cookieStore.getAll() : []),
        setAll: () => {},
      },
    }
  );

  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data?.user ?? null;
  } catch {
    user = null;
  }

  if (!user) {
    let authHeader = req ? (req.headers.get('authorization') || req.headers.get('Authorization')) : null;
    if (!authHeader) {
      try {
        const headerStore = await headers();
        authHeader = headerStore.get('authorization') || headerStore.get('Authorization');
      } catch {
        // headers() might not be available outside request context
      }
    }
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '').trim();
      try {
        const { data: userData } = await supabase.auth.getUser(token);
        if (userData?.user) {
          user = userData.user;
        }
      } catch {
        user = null;
      }
    }
  }

  return user;
}

export class UnauthorizedError extends Error {
  constructor() {
    super('Not authenticated');
    this.name = 'UnauthorizedError';
  }
}

export async function requireUser(req?: Request) {
  const user = await getSessionUser(req);
  if (!user) throw new UnauthorizedError();
  return user;
}

export function createAdminClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key',
    { auth: { persistSession: false } }
  );
}
