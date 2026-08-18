import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envFile = fs.readFileSync('d:/FR/.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^\s*([^#\s=]+)\s*=\s*(.*)\s*$/);
  if (match) {
    let val = match[2].trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.substring(1, val.length - 1);
    else if (val.startsWith("'") && val.endsWith("'")) val = val.substring(1, val.length - 1);
    const commentIdx = val.indexOf('#');
    if (commentIdx !== -1) val = val.substring(0, commentIdx).trim();
    env[match[1]] = val;
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, serviceKey);

async function testEntitlementsAndPrompt() {
  const testEmail = `test_entitlements_${Date.now()}@example.com`;
  const testPassword = "Password123!";

  console.log("1. Signing up user for testing...");
  const { data: authData } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
  });

  let token = authData.session?.access_token;
  if (!token) {
    const { data: sData } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });
    token = sData.session?.access_token;
  }

  console.log("2. Testing GET /api/entitlements...");
  const entRes = await fetch("http://localhost:4028/api/entitlements");
  console.log("GET /api/entitlements status:", entRes.status);
  const entData = await entRes.json();
  console.log("Entitlements programs count:", entData.entitlements?.length);

  console.log("\n3. Testing POST /api/digital/prompt with prompt grading...");
  const promptRes = await fetch("http://localhost:4028/api/digital/prompt", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({
      prompt: "Act as a senior Python developer. Explain async/await in Python with code examples for a beginner student.",
      gradePrompt: true,
    }),
  });

  console.log("POST /api/digital/prompt status:", promptRes.status);
  const promptData = await promptRes.json();
  console.log("Prompt Response JSON:", JSON.stringify(promptData, null, 2));
}

testEntitlementsAndPrompt();
