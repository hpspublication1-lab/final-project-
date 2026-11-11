const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'supabase', 'migrations');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort();
const registry = new Map();

for (const file of files) {
  const sql = fs.readFileSync(path.join(dir, file), 'utf-8');

  const createTableRe = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?([a-zA-Z0-9_]+)/gi;
  let m;
  while ((m = createTableRe.exec(sql)) !== null) {
    const tbl = m[1].toLowerCase();
    if (!registry.has(tbl)) {
      registry.set(tbl, { rls: false, createdIn: file, policies: [] });
    }
  }

  const rlsRe = /ALTER\s+TABLE\s+(?:ONLY\s+)?(?:public\.)?([a-zA-Z0-9_]+)\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/gi;
  while ((m = rlsRe.exec(sql)) !== null) {
    const tbl = m[1].toLowerCase();
    if (registry.has(tbl)) registry.get(tbl).rls = true;
    else registry.set(tbl, { rls: true, createdIn: file, policies: [] });
  }

  const policyRe = /CREATE\s+POLICY\s+["']?([^"'\n]+)["']?\s+ON\s+(?:public\.)?([a-zA-Z0-9_]+)\s*(?:FOR\s+([A-Z]+))?\s*(?:TO\s+([a-zA-Z0-9_,\s]+))?(?:\s+USING\s*\(([\s\S]*?)\))?(?:\s+WITH\s+CHECK\s*\(([\s\S]*?)\))?;/gi;
  while ((m = policyRe.exec(sql)) !== null) {
    const polName = m[1].trim();
    const tbl = m[2].toLowerCase();
    const action = m[3] || 'ALL';
    const roles = (m[4] || 'public').trim();
    const usingExpr = (m[5] || '').trim().replace(/\s+/g, ' ');
    const checkExpr = (m[6] || '').trim().replace(/\s+/g, ' ');

    if (!registry.has(tbl)) {
      registry.set(tbl, { rls: false, createdIn: file, policies: [] });
    }

    registry.get(tbl).policies.push({
      name: polName,
      action,
      roles,
      using: usingExpr,
      withCheck: checkExpr,
      file,
    });
  }
}

const tiers = {
  '1. Student Private Data & Progress': [
    'user_profiles', 'user_privacy_settings', 'user_presence', 'user_friends', 'friend_requests',
    'user_blocks', 'user_reward_wallet', 'reward_transactions', 'user_achievements', 'user_daily_missions',
    'arena_recent_opponents', 'arena_notifications', 'notifications', 'bookmarks', 'notes',
    'video_notes', 'video_watch_progress', 'user_video_progress', 'topic_mastery', 'flashcards',
    'flashcard_reviews', 'digital_track_progress', 'digital_module_completions', 'digital_certificates',
    'agent_conversations', 'agent_memory', 'agent_tasks', 'ai_usage'
  ],
  '2. Assessments, Examinations & Submissions': [
    'exams', 'exam_questions', 'exam_attempts', 'exam_question_answers', 'practice_attempts',
    'subjective_questions', 'subjective_evaluations', 'english_practice_attempts', 'digital_prompt_attempts'
  ],
  '3. Financial & Billing Ledgers': [
    'payment_transactions', 'billing_invoices', 'billing_history', 'billing_audit_logs',
    'orders', 'course_orders', 'activation_codes', 'activation_attempts', 'coupons', 'prebookings'
  ],
  '4. Institutional & Tenant Cohorts': [
    'programs', 'program_features', 'enrollments', 'batches', 'batch_enrollments', 'live_classes', 'live_class_attendance'
  ],
  '5. Public Curriculum & Question Banks': [
    'subjects', 'chapters', 'questions', 'see_lessons', 'video_lectures', 'study_materials',
    'course_pricing', 'english_modules', 'english_task_types', 'digital_track_modules', 'arena_seasons', 'leaderboard_snapshots'
  ],
  '6. Realtime Arena & Community Doubts': [
    'battle_rooms', 'room_members', 'battle_answers', 'battle_results', 'battle_invitations',
    'matchmaking_queue', 'messages', 'doubts', 'doubt_replies'
  ],
  '7. Security, Auditing & Administration': [
    'audit_logs', 'roles', 'permissions', 'role_permissions', 'user_roles', 'leads', 'lead_events', 'email_queue', 'email_logs'
  ]
};

let coveredCount = 0;
for (const [tierName, tableList] of Object.entries(tiers)) {
  console.log(`\n======================================================`);
  console.log(`${tierName.toUpperCase()} (${tableList.length} tables)`);
  console.log(`======================================================`);
  for (const t of tableList) {
    coveredCount++;
    const data = registry.get(t);
    if (!data) {
      console.log(`⚠️  ${t}: NOT FOUND IN REGISTRY`);
    } else {
      console.log(`- ${t.padEnd(28)} | RLS: ${data.rls ? 'ENABLED' : 'MISSING'} | Policies: ${data.policies.length}`);
    }
  }
}

console.log(`\nTotal tables categorized: ${coveredCount} / ${registry.size}`);
