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

const supabase = createClient(supabaseUrl, serviceKey);

async function testProd() {
  const testEmail = `test_qr_user_${Date.now()}@example.com`;
  const testPassword = "Password123!";

  console.log("1. Creating test user:", testEmail);
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
  });

  if (signUpError) {
    console.error("Sign up failed:", signUpError.message);
    return;
  }

  const userId = signUpData.user.id;
  console.log("Created user ID:", userId);

  console.log("2. Confirming user via admin client...");
  const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
    userId,
    { email_confirm: true }
  );

  if (updateError) {
    console.error("Could not confirm user:", updateError.message);
    return;
  }
  console.log("User confirmed successfully!");

  console.log("3. Logging in as confirmed user to get session...");
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });

  if (signInError) {
    console.error("Sign in failed:", signInError.message);
    return;
  }

  const token = signInData.session.access_token;
  console.log("Obtained token. Creating cookie header...");

  // Generate the cookie name and session cookie
  // Supabase auth stores cookies as sb-<projectRef>-auth-token
  const projectRef = "zqkmrrckuvabtdfyrymw";
  const cookieName = `sb-${projectRef}-auth-token`;
  
  // Serialize the session object into the cookie value
  const sessionVal = JSON.stringify(signInData.session);
  const base64Session = Buffer.from(sessionVal).toString('base64');
  const cookieHeader = `${cookieName}=${encodeURIComponent(base64Session)}`;

  console.log("4. Sending request to production endpoint with Session Cookie...");
  try {
    const res = await fetch("https://samyakceemastery.vercel.app/api/payments/fonepay/qr", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cookie": cookieHeader
      },
      body: JSON.stringify({
        plan: "crash-course"
      })
    });

    console.log("Response status:", res.status);
    const data = await res.json();
    console.log("Response:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Request failed:", err);
  }
}

testProd();
