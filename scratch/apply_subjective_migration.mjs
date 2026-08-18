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

async function run() {
  console.log("Checking storage bucket subjective-answers...");
  const { data: buckets, error: bErr } = await supabase.storage.listBuckets();
  if (bErr) {
    console.warn("Storage list error:", bErr.message);
  } else {
    const exists = buckets.some(b => b.name === 'subjective-answers');
    if (!exists) {
      console.log("Creating storage bucket: subjective-answers");
      const { error: createErr } = await supabase.storage.createBucket('subjective-answers', {
        public: false,
      });
      if (createErr) {
        console.warn("Create bucket error (may already exist):", createErr.message);
      } else {
        console.log("Successfully created bucket: subjective-answers");
      }
    } else {
      console.log("Storage bucket subjective-answers already exists.");
    }
  }

  console.log("Testing query on subjective_questions table...");
  const { data: qData, error: qErr } = await supabase.from('subjective_questions').select('*').limit(5);
  if (qErr) {
    console.log("Table subjective_questions query info:", qErr.message);
  } else {
    console.log(`Found ${qData.length} existing subjective questions in DB.`);
  }

  console.log("Done checking Supabase setup.");
}

run();
