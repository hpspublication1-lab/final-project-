const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'supabase', 'migrations');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort();
const tables = new Map();

for (const f of files) {
  const content = fs.readFileSync(path.join(dir, f), 'utf-8');

  // Match CREATE TABLE
  const createRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?([a-zA-Z0-9_]+)/gi;
  let match;
  while ((match = createRegex.exec(content)) !== null) {
    const tableName = match[1].toLowerCase();
    if (!tables.has(tableName)) {
      tables.set(tableName, { createdIn: f, rlsEnabled: false, policies: [] });
    }
  }

  // Match ALTER TABLE ... ENABLE ROW LEVEL SECURITY
  const rlsRegex = /ALTER\s+TABLE\s+(?:ONLY\s+)?(?:public\.)?([a-zA-Z0-9_]+)\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/gi;
  while ((match = rlsRegex.exec(content)) !== null) {
    const tableName = match[1].toLowerCase();
    if (tables.has(tableName)) {
      tables.get(tableName).rlsEnabled = true;
    } else {
      tables.set(tableName, { createdIn: f, rlsEnabled: true, policies: [] });
    }
  }

  // Match CREATE POLICY
  const policyRegex = /CREATE\s+POLICY\s+["']?([^"'\n]+)["']?\s+ON\s+(?:public\.)?([a-zA-Z0-9_]+)\s*(?:FOR\s+([A-Z]+))?\s*(?:TO\s+([a-zA-Z0-9_,\s]+))?\s*(?:USING\s*\(([\s\S]*?)\))?\s*(?:WITH\s+CHECK\s*\(([\s\S]*?)\))?;/gi;
  while ((match = policyRegex.exec(content)) !== null) {
    const policyName = match[1].trim();
    const tableName = match[2].toLowerCase();
    const action = match[3] || 'ALL';
    const roles = match[4] || 'public';
    if (!tables.has(tableName)) {
      tables.set(tableName, { createdIn: f, rlsEnabled: false, policies: [] });
    }
    tables.get(tableName).policies.push({
      policy: policyName,
      action: action.trim(),
      roles: roles.trim(),
      file: f,
    });
  }
}

console.log(`Found ${tables.size} total tables across ${files.length} migrations:\n`);
const sorted = Array.from(tables.keys()).sort();
for (const t of sorted) {
  const data = tables.get(t);
  console.log(`- ${t}: RLS=${data.rlsEnabled ? 'ENABLED' : 'MISSING'}, Policies=${data.policies.length} (Created in ${data.createdIn})`);
}
