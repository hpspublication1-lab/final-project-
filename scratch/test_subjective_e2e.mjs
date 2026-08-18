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

const supabase = createClient(supabaseUrl, serviceKey);

async function testEndToEnd() {
  const testEmail = `test_subjective_${Date.now()}@example.com`;
  const testPassword = "Password123!";

  console.log("1. Creating test user for evaluation...");
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
  });

  if (authError) {
    console.error("SignUp error:", authError.message);
    return;
  }

  let token = authData.session?.access_token;
  if (!token) {
    const { data: sData } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });
    token = sData.session?.access_token;
  }

  console.log("User authenticated. Testing GET /api/subjective/questions...");
  const questionsRes = await fetch("http://localhost:4028/api/subjective/questions?program=see");
  console.log("GET questions status:", questionsRes.status);
  const questionsData = await questionsRes.json();
  console.log("Fetched questions count:", questionsData.count);
  const sampleQ = questionsData.questions[0];
  console.log("Sample question:", sampleQ?.question_text?.substring(0, 60) + "...");

  console.log("\n2. Testing POST /api/subjective/evaluate with authenticated token...");
  const evalRes = await fetch("http://localhost:4028/api/subjective/evaluate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({
      question_id: sampleQ.id,
      written_text: "Newton's Law of Gravitation states F = G(m1*m2)/d^2. Given m1 = 6*10^24, m2 = 7.4*10^22, d = 3.84*10^8. F = (6.67*10^-11 * 6*10^24 * 7.4*10^22) / (3.84*10^8)^2 = 2.01 * 10^20 N.",
      question_text: sampleQ.question_text,
      sample_solution: sampleQ.sample_solution,
      rubric: sampleQ.rubric,
      total_marks: sampleQ.marks,
    }),
  });

  console.log("POST evaluate status:", evalRes.status);
  const evalData = await evalRes.json();
  console.log("Evaluation Result:", JSON.stringify(evalData, null, 2));
}

testEndToEnd();
