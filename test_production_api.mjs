import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

// Parse .env.local
const envFile = fs.readFileSync('d:/FR/.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^\s*([^#\s=]+)\s*=\s*(.*)\s*$/);
  if (match) {
    let val = match[2].trim();
    if (val.startsWith('"') && val.endsWith('"')) {
      val = val.substring(1, val.length - 1);
    } else if (val.startsWith("'") && val.endsWith("'")) {
      val = val.substring(1, val.length - 1);
    }
    const commentIdx = val.indexOf('#');
    if (commentIdx !== -1) {
      val = val.substring(0, commentIdx).trim();
    }
    env[match[1]] = val;
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

// Initialize Supabase admin client using local node_modules via path resolution
const supabase = createClient(supabaseUrl, serviceKey);

async function testProductionApi() {
  const testEmail = `test_payment_api_${Date.now()}@example.com`;
  const testPassword = "Password123!";

  console.log("Creating test user:", testEmail);
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
  });

  if (authError) {
    console.error("Could not sign up test user:", authError.message);
    return;
  }

  const session = authData.session;
  if (!session) {
    console.log("Sign up succeeded but no session returned. Attempting sign in...");
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });
    if (signInError) {
      console.error("Sign in failed:", signInError.message);
      return;
    }
    runApiCall(signInData.session.access_token);
  } else {
    runApiCall(session.access_token);
  }
}

async function runApiCall(accessToken) {
  console.log("Successfully authenticated. Access token obtained.");
  
  const targetUrl = "https://samyakceemastery.vercel.app/api/payments/fonepay/qr";
  console.log("Making POST request to:", targetUrl);

  try {
    const res = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        plan: "crash-course"
      })
    });

    console.log("Response status:", res.status);
    const data = await res.json();
    console.log("Response JSON:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Fetch API error:", err);
  }
}

testProductionApi();
