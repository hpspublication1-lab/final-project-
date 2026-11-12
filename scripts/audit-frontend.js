#!/usr/bin/env node

/**
 * Samyak CEE — Automated Frontend Architecture & Health Auditor
 * Enforces design system standards, component size budgets, brand integrity,
 * and zero-cartoon-emoji governance across the Next.js App Router codebase.
 *
 * Usage:
 *   node scripts/audit-frontend.js          (Detailed report)
 *   node scripts/audit-frontend.js --summary(Executive dashboard summary)
 *   npm run ui:audit
 */

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '..', 'src');
const IS_SUMMARY_ONLY = process.argv.includes('--summary');

// Thresholds
const MAX_COMPONENT_LINES = 500;
const IGNORE_PATTERNS = [
  '__tests__',
  '.test.',
  '.spec.',
  'node_modules',
  '.next',
  'public',
];

// Raw Emoji Regex (Surrogates & Common Emoji blocks)
const EMOJI_REGEX = /[\uD83C-\uDBFF\uDC00-\uDFFF\u2600-\u26FF\u2700-\u27BF]/;

let totalFilesScanned = 0;
let emojiCount = 0;
let monolithCount = 0;
let legacyBrandCount = 0;

const directoryBreakdown = {};
const reports = [];

function scanDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (IGNORE_PATTERNS.some((p) => fullPath.includes(p))) {
      continue;
    }

    if (entry.isDirectory()) {
      scanDirectory(fullPath);
    } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) {
      auditFile(fullPath);
    }
  }
}

function auditFile(filePath) {
  totalFilesScanned++;
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const relativePath = path.relative(path.join(__dirname, '..'), filePath);
  const dirKey = relativePath.split(path.sep).slice(0, 3).join('/');

  if (!directoryBreakdown[dirKey]) {
    directoryBreakdown[dirKey] = { files: 0, emojis: 0, monoliths: 0, legacyBrands: 0 };
  }
  directoryBreakdown[dirKey].files++;

  const fileIssues = [];

  // 1. File Size Budget Check
  if (lines.length > MAX_COMPONENT_LINES && filePath.endsWith('.tsx')) {
    fileIssues.push({
      type: 'MONOLITH',
      message: `Component exceeds line budget (${lines.length} lines > ${MAX_COMPONENT_LINES} lines max).`,
      line: lines.length,
    });
    monolithCount++;
    directoryBreakdown[dirKey].monoliths++;
  }

  // Line-by-line checks
  lines.forEach((lineText, index) => {
    const lineNum = index + 1;

    // 2. Raw Cartoon Emoji Check
    if (
      EMOJI_REGEX.test(lineText) &&
      !lineText.trim().startsWith('//') &&
      !lineText.trim().startsWith('*') &&
      !lineText.includes('SUPPORT_CONFIG')
    ) {
      fileIssues.push({
        type: 'EMOJI',
        message: `Raw emoji detected. Use Lucide vector icons instead.`,
        line: lineNum,
        sample: lineText.trim().slice(0, 75),
      });
      emojiCount++;
      directoryBreakdown[dirKey].emojis++;
    }

    // 3. Legacy Brand Name Check ("Samyak Tutor" or "Samyak Guru")
    if (
      (lineText.includes('Samyak Tutor') || lineText.includes('Samyak Guru')) &&
      !relativePath.includes('authSecurity') &&
      !relativePath.includes('support')
    ) {
      fileIssues.push({
        type: 'BRAND',
        message: `Legacy brand name detected. Replace with "Samyak CEE".`,
        line: lineNum,
        sample: lineText.trim().slice(0, 75),
      });
      legacyBrandCount++;
      directoryBreakdown[dirKey].legacyBrands++;
    }
  });

  if (fileIssues.length > 0) {
    reports.push({ file: relativePath, issues: fileIssues });
  }
}

console.log('\n================================================================');
console.log('       SAMYAK CEE — FRONTEND ARCHITECTURE & HEALTH AUDIT');
console.log('================================================================\n');

scanDirectory(SRC_DIR);

console.log(`📁 Files Scanned:      \x1b[1m${totalFilesScanned}\x1b[0m`);
console.log(`⚠️  Raw Emojis:         \x1b[33m${emojiCount}\x1b[0m (Replace with Lucide icons)`);
console.log(`🏛️  Monoliths (>500L):  \x1b[35m${monolithCount}\x1b[0m (Candidate files for decomposition)`);
console.log(`🏷️  Legacy Brand Tags:  \x1b[36m${legacyBrandCount}\x1b[0m (Unify to "Samyak CEE")\n`);

console.log('----------------------------------------------------------------');
console.log(' DIRECTORY HEALTH BREAKDOWN');
console.log('----------------------------------------------------------------');

const sortedDirs = Object.entries(directoryBreakdown)
  .sort((a, b) => b[1].emojis + b[1].monoliths * 10 - (a[1].emojis + a[1].monoliths * 10))
  .slice(0, 10);

console.log(
  'Directory'.padEnd(38) +
  'Files'.padStart(7) +
  'Emojis'.padStart(9) +
  'Monoliths'.padStart(11) +
  'Legacy'.padStart(8)
);
console.log('-'.repeat(73));

sortedDirs.forEach(([dir, stats]) => {
  console.log(
    dir.slice(0, 36).padEnd(38) +
    String(stats.files).padStart(7) +
    String(stats.emojis).padStart(9) +
    String(stats.monoliths).padStart(11) +
    String(stats.legacyBrands).padStart(8)
  );
});

console.log('-'.repeat(73));

if (!IS_SUMMARY_ONLY) {
  console.log('\nTop 8 Priority Files for Refactor:');
  reports
    .sort((a, b) => b.issues.length - a.issues.length)
    .slice(0, 8)
    .forEach((report, idx) => {
      console.log(`\n${idx + 1}. \x1b[1m${report.file}\x1b[0m (${report.issues.length} findings)`);
      report.issues.slice(0, 3).forEach((iss) => {
        console.log(`   • [${iss.type}] L${iss.line}: ${iss.message}`);
      });
    });
}

console.log('\n================================================================');
console.log(' Recommended Action: Follow FRONTEND_SYSTEM.md guidelines.');
console.log('================================================================\n');

process.exit(0);
