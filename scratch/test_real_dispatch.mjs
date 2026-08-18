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
  const targetEmail = 'surajgaming02@gmail.com';
  console.log(`Attempting password reset / notification email dispatch to ${targetEmail}...`);

  // Attempt 1: Auth reset password email (Supabase built-in auth mailer)
  const { data: resetData, error: resetErr } = await supabase.auth.resetPasswordForEmail(targetEmail, {
    redirectTo: 'https://samyakcee.com/login',
  });

  console.log('Reset password dispatch result:', resetData, resetErr);
}

main().catch(console.error);
