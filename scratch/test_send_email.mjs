import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

function loadEnv() {
  const envPath = path.resolve('.env.local');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        process.env[key] = val;
      }
    }
  }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zqkmrrckuvabtdfyrymw.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  const email = 'surajgaming02@gmail.com';
  console.log(`Sending magic link / enrollment notice via Supabase Auth to ${email}...`);

  const { data, error } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: email,
    options: {
      redirectTo: 'https://samyakcee.com/dashboard'
    }
  });

  if (error) {
    console.error('Error generating link:', error);
  } else {
    console.log('Successfully generated link:', data);
  }

  // Also update user profile to mark them enrolled if needed
  const { data: userProfile, error: profileErr } = await supabase
    .from('user_profiles')
    .update({ subscription_plan: 'student', subscription_expires_at: new Date(Date.now() + 365*86400000).toISOString() })
    .eq('id', 'be47d1e9-6d69-479f-b91d-160bb114f2e3')
    .select();
  
  console.log('Updated user profile:', userProfile, profileErr);
}

main().catch(console.error);
