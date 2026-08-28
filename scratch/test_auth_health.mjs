import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^\s*([^#\s=]+)\s*=\s*(.*)\s*$/);
  if (match) {
    let val = match[2].trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.substring(1, val.length - 1);
    const commentIdx = val.indexOf('#');
    if (commentIdx !== -1) val = val.substring(0, commentIdx).trim();
    env[match[1]] = val;
  }
});

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log("Testing Supabase URL:", url);
const supabase = createClient(url, key);

async function checkAuth() {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error("Auth Session Error:", error.message);
    } else {
      console.log("Auth Session Check: OK");
    }

    // Test Google OAuth URL generation
    const { data: oauthData, error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'http://localhost:4028/auth/callback',
        skipBrowserRedirect: true
      }
    });

    if (oauthError) {
      console.error("Google OAuth Error:", oauthError.message);
    } else if (oauthData?.url) {
      console.log("SUCCESS: Google OAuth URL generated!");
      console.log("OAuth Redirect Target:", oauthData.url);
    } else {
      console.log("OAuth response:", oauthData);
    }
  } catch (e) {
    console.error("Exception during auth test:", e);
  }
}

checkAuth();
