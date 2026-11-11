const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'supabase', 'migrations');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort();

// Table registry: tableName -> { rls: boolean, createdIn: string, policies: [] }
const registry = new Map();

for (const file of files) {
  const sql = fs.readFileSync(path.join(dir, file), 'utf-8');

  // CREATE TABLE
  const createTableRe = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?([a-zA-Z0-9_]+)/gi;
  let m;
  while ((m = createTableRe.exec(sql)) !== null) {
    const tbl = m[1].toLowerCase();
    if (!registry.has(tbl)) {
      registry.set(tbl, { rls: false, createdIn: file, policies: [] });
    }
  }

  // ENABLE RLS
  const rlsRe = /ALTER\s+TABLE\s+(?:ONLY\s+)?(?:public\.)?([a-zA-Z0-9_]+)\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/gi;
  while ((m = rlsRe.exec(sql)) !== null) {
    const tbl = m[1].toLowerCase();
    if (!registry.has(tbl)) {
      registry.set(tbl, { rls: true, createdIn: file, policies: [] });
    } else {
      registry.get(tbl).rls = true;
    }
  }

  // CREATE POLICY
  // CREATE POLICY "name" ON table FOR action TO role USING (...) WITH CHECK (...)
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

const categorized = {
  userPrivate: [], // user_profiles, exam_attempts, payment_transactions, notes, bookmarks, etc.
  institutionBatch: [], // batches, batch_enrollments, enrollments, programs
  curriculumPublic: [], // subjects, chapters, questions, see_lessons, video_lectures
  realtimeArena: [], // battle_rooms, room_members, battle_answers, messages
  serviceExclusive: [], // audit_logs, billing_audit_logs, activation_codes, roles, permissions, user_roles
};

for (const [tbl, data] of registry.entries()) {
  console.log(`### Table: \`${tbl}\``);
  console.log(`- **RLS Enabled**: ${data.rls ? 'YES' : 'NO'}`);
  console.log(`- **Migration**: ${data.createdIn}`);
  console.log(`- **Policies Count**: ${data.policies.length}`);
  for (const p of data.policies) {
    console.log(`  * **${p.name}** [${p.action}] to [${p.roles}]`);
    if (p.using) console.log(`    - USING: ${p.using.substring(0, 100)}${p.using.length > 100 ? '...' : ''}`);
    if (p.withCheck) console.log(`    - WITH CHECK: ${p.withCheck.substring(0, 100)}${p.withCheck.length > 100 ? '...' : ''}`);
  }
  console.log('');
}
