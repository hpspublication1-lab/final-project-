import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

  return createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            const isProd = process.env.NODE_ENV === 'production';
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, {
                ...options,
                // `Secure` cookies are rejected by browsers over plain http
                // (e.g. http://localhost), which silently dropped the auth
                // session and logged users out. Only force Secure in production
                // (https); use SameSite=Lax so the same-origin session persists.
                sameSite: 'lax',
                secure: isProd,
              })
            );
          } catch {
            // Server Component read-only context — expected
          }
        },
      },
    }
  );
}
