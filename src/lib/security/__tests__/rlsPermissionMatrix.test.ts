import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

/**
 * Samyak CEE Mastery — Database Row Level Security (RLS) & Multi-Tenant Isolation Audit
 * 
 * Verifies:
 * 1. 100% RLS enablement across all 84 database tables.
 * 2. Strict student-to-student data isolation.
 * 3. School and batch tenant isolation.
 * 4. Zero exposure of SUPABASE_SERVICE_ROLE_KEY in client/browser bundles.
 * 5. Direct Supabase query lockdown and privilege escalation prevention.
 */

interface TableMetadata {
  name: string;
  rlsEnabled: boolean;
  migrationFile: string;
  policies: Array<{
    name: string;
    action: string;
    roles: string;
    using: string;
    withCheck: string;
  }>;
}

function parseMigrations(): Map<string, TableMetadata> {
  const migrationsDir = path.resolve(process.cwd(), 'supabase', 'migrations');
  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();
  const tables = new Map<string, TableMetadata>();

  for (const file of files) {
    const content = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');

    // Match CREATE TABLE
    const createRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?([a-zA-Z0-9_]+)/gi;
    let match: RegExpExecArray | null;
    while ((match = createRegex.exec(content)) !== null) {
      const name = match[1].toLowerCase();
      if (!tables.has(name)) {
        tables.set(name, { name, rlsEnabled: false, migrationFile: file, policies: [] });
      }
    }

    // Match ALTER TABLE ... ENABLE ROW LEVEL SECURITY
    const rlsRegex = /ALTER\s+TABLE\s+(?:ONLY\s+)?(?:public\.)?([a-zA-Z0-9_]+)\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/gi;
    while ((match = rlsRegex.exec(content)) !== null) {
      const name = match[1].toLowerCase();
      if (tables.has(name)) {
        tables.get(name)!.rlsEnabled = true;
      } else {
        tables.set(name, { name, rlsEnabled: true, migrationFile: file, policies: [] });
      }
    }

    // Match CREATE POLICY
    const policyRegex = /CREATE\s+POLICY\s+["']?([^"'\n]+)["']?\s+ON\s+(?:public\.)?([a-zA-Z0-9_]+)\s*(?:FOR\s+([A-Z]+))?\s*(?:TO\s+([a-zA-Z0-9_,\s]+))?(?:\s+USING\s*\(([\s\S]*?)\))?(?:\s+WITH\s+CHECK\s*\(([\s\S]*?)\))?;/gi;
    while ((match = policyRegex.exec(content)) !== null) {
      const polName = match[1].trim();
      const tblName = match[2].toLowerCase();
      const action = match[3] || 'ALL';
      const roles = (match[4] || 'public').trim();
      const usingExpr = (match[5] || '').trim().replace(/\s+/g, ' ');
      const checkExpr = (match[6] || '').trim().replace(/\s+/g, ' ');

      if (!tables.has(tblName)) {
        tables.set(tblName, { name: tblName, rlsEnabled: false, migrationFile: file, policies: [] });
      }

      tables.get(tblName)!.policies.push({
        name: polName,
        action,
        roles,
        using: usingExpr,
        withCheck: checkExpr,
      });
    }
  }

  return tables;
}

const tableRegistry = parseMigrations();

describe('Row Level Security (RLS) & Multi-Tenant Data Isolation Audit', () => {
  describe('1. Universal RLS Enforcement', () => {
    it('verifies that all 84 tables in the schema have Row Level Security enabled', () => {
      expect(tableRegistry.size).toBeGreaterThanOrEqual(80);

      const unprotectedTables: string[] = [];
      for (const [name, meta] of tableRegistry.entries()) {
        if (!meta.rlsEnabled) {
          unprotectedTables.push(name);
        }
      }

      expect(unprotectedTables).toEqual([]);
    });

    it('confirms critical student private tables are covered by explicit RLS', () => {
      const criticalTables = [
        'user_profiles',
        'exam_attempts',
        'exam_question_answers',
        'payment_transactions',
        'billing_invoices',
        'billing_history',
        'video_notes',
        'bookmarks',
        'flashcards',
        'notifications',
        'batch_enrollments',
        'enrollments',
      ];

      for (const t of criticalTables) {
        const meta = tableRegistry.get(t);
        expect(meta, `Table ${t} must exist in registry`).toBeDefined();
        expect(meta!.rlsEnabled, `Table ${t} must have RLS ENABLED`).toBe(true);
      }
    });
  });

  describe('2. Student-to-Student Data Isolation', () => {
    it('isolates user_profiles so students can only select their own profile', () => {
      const meta = tableRegistry.get('user_profiles');
      expect(meta).toBeDefined();

      const selectPolicies = meta!.policies.filter(
        (p) => p.action === 'SELECT' || p.action === 'ALL'
      );
      expect(selectPolicies.length).toBeGreaterThan(0);

      // Verify that student read policy checks auth.uid()
      const studentReadPolicy = selectPolicies.find((p) => p.using.includes('auth.uid()'));
      expect(studentReadPolicy).toBeDefined();
      expect(studentReadPolicy!.using).toContain('id = auth.uid()');
    });

    it('isolates exam_attempts so students cannot view other students attempts', () => {
      const meta = tableRegistry.get('exam_attempts');
      expect(meta).toBeDefined();

      const selectPolicies = meta!.policies.filter(
        (p) => p.action === 'SELECT' || p.action === 'ALL'
      );
      const studentOwnPolicy = selectPolicies.find((p) => p.using.includes('auth.uid()'));
      expect(studentOwnPolicy).toBeDefined();
      expect(studentOwnPolicy!.using).toMatch(/(?:student_id|user_id)\s*=\s*auth\.uid\(\)/);
    });

    it('isolates payment_transactions and billing_invoices to the paying user', () => {
      const txMeta = tableRegistry.get('payment_transactions');
      const invMeta = tableRegistry.get('billing_invoices');

      expect(txMeta).toBeDefined();
      expect(invMeta).toBeDefined();

      const txPolicies = txMeta!.policies.filter((p) => p.using.includes('auth.uid()'));
      expect(txPolicies.length).toBeGreaterThan(0);
      expect(txPolicies[0].using).toMatch(/user_id\s*=\s*auth\.uid\(\)/);

      const invPolicies = invMeta!.policies.filter((p) => p.using.includes('auth.uid()'));
      expect(invPolicies.length).toBeGreaterThan(0);
      expect(invPolicies[0].using).toMatch(/user_id\s*=\s*auth\.uid\(\)/);
    });

    it('isolates personal study artifacts (bookmarks, video_notes, video_watch_progress)', () => {
      const tables = ['bookmarks', 'video_notes', 'video_watch_progress'];
      for (const t of tables) {
        const meta = tableRegistry.get(t);
        expect(meta).toBeDefined();
        const ownPolicy = meta!.policies.find((p) => p.using.includes('auth.uid()'));
        expect(ownPolicy, `Table ${t} must have an auth.uid() ownership check`).toBeDefined();
      }
    });

    it('isolates friend requests, user blocks, and privacy settings', () => {
      const privacyMeta = tableRegistry.get('user_privacy_settings');
      const blocksMeta = tableRegistry.get('user_blocks');
      const friendReqMeta = tableRegistry.get('friend_requests');

      expect(privacyMeta).toBeDefined();
      expect(blocksMeta).toBeDefined();
      expect(friendReqMeta).toBeDefined();

      expect(privacyMeta!.policies.some((p) => p.using.includes('auth.uid()'))).toBe(true);
      expect(blocksMeta!.policies.some((p) => p.using.includes('auth.uid()'))).toBe(true);
      expect(friendReqMeta!.policies.some((p) => p.using.includes('auth.uid()'))).toBe(true);
    });
  });

  describe('3. Institutional & Cohort Tenant Isolation', () => {
    it('isolates batch_enrollments to enrolled students or admins', () => {
      const meta = tableRegistry.get('batch_enrollments');
      expect(meta).toBeDefined();

      // Read policy restricts to user_id = auth.uid() OR admin
      const studentReadPolicy = meta!.policies.find(
        (p) => p.action === 'SELECT' && p.using.includes('auth.uid()')
      );
      expect(studentReadPolicy).toBeDefined();
      expect(studentReadPolicy!.using).toMatch(/user_id\s*=\s*auth\.uid\(\)/);

      // Student cannot directly insert self into paid batches (writes restricted to admin / service_role)
      const studentInsert = meta!.policies.find(
        (p) => (p.action === 'INSERT' || p.action === 'ALL') && p.roles === 'authenticated' && !p.using.includes('is_admin')
      );
      expect(studentInsert?.withCheck).not.toContain('true');
    });

    it('isolates core program enrollments against client self-granting', () => {
      const meta = tableRegistry.get('enrollments');
      expect(meta).toBeDefined();

      const studentReadPolicy = meta!.policies.find(
        (p) => p.action === 'SELECT' && p.using.includes('auth.uid()')
      );
      expect(studentReadPolicy).toBeDefined();
      expect(studentReadPolicy!.using).toMatch(/(?:student_id|user_id)\s*=\s*auth\.uid\(\)|auth\.uid\(\)\s*=\s*(?:student_id|user_id)/);

      // Mutative operations must be restricted to admins or service_role
      const managePolicy = meta!.policies.find((p) => p.name === 'admins_manage_enrollments');
      expect(managePolicy).toBeDefined();
      expect(managePolicy!.using).toContain('profile_owner_is_admin()');
    });
  });

  describe('4. Credential Leak Prevention & Bundle Safety', () => {
    it('verifies src/lib/supabase/admin.ts is strictly guarded by server-only', () => {
      const adminFilePath = path.resolve(process.cwd(), 'src', 'lib', 'supabase', 'admin.ts');
      const content = fs.readFileSync(adminFilePath, 'utf-8');

      expect(content).toContain("import 'server-only';");
      expect(content).toContain('process.env.SUPABASE_SERVICE_ROLE_KEY');
      expect(content).not.toContain('NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY');
    });

    it('verifies src/lib/supabase/client.ts uses ONLY anonymous public credentials', () => {
      const clientFilePath = path.resolve(process.cwd(), 'src', 'lib', 'supabase', 'client.ts');
      const content = fs.readFileSync(clientFilePath, 'utf-8');

      expect(content).toContain('process.env.NEXT_PUBLIC_SUPABASE_URL');
      expect(content).toContain('process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY');
      expect(content).not.toContain('SERVICE_ROLE');
      expect(content).not.toContain('SUPABASE_SERVICE_ROLE_KEY');
    });

    it('ensures zero client components or browser bundles import admin.ts', () => {
      const srcDir = path.resolve(process.cwd(), 'src');

      function scanDir(dir: string, fileList: string[] = []): string[] {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            if (entry.name !== 'node_modules' && entry.name !== '.next' && entry.name !== '__tests__') {
              scanDir(fullPath, fileList);
            }
          } else if (
            entry.isFile() &&
            (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) &&
            !entry.name.includes('.test.')
          ) {
            fileList.push(fullPath);
          }
        }
        return fileList;
      }

      const allTsFiles = scanDir(srcDir);
      const clientFiles = allTsFiles.filter((filePath) => {
        const content = fs.readFileSync(filePath, 'utf-8');
        return content.includes("'use client'") || content.includes('"use client"');
      });

      expect(clientFiles.length).toBeGreaterThan(40);

      const forbiddenAdminImport = ['@', 'lib', 'supabase', 'admin'].join('/');
      const forbiddenServiceRole = ['SUPABASE', 'SERVICE', 'ROLE', 'KEY'].join('_');

      for (const clientFile of clientFiles) {
        const content = fs.readFileSync(clientFile, 'utf-8');
        expect(content, `Client component ${clientFile} must never import createAdminClient`).not.toContain(
          forbiddenAdminImport
        );
        expect(content, `Client component ${clientFile} must never reference service-role key`).not.toContain(
          forbiddenServiceRole
        );
      }
    });

    it('verifies public/ static folder does not contain any environment secrets', () => {
      const publicDir = path.resolve(process.cwd(), 'public');
      if (fs.existsSync(publicDir)) {
        const files = fs.readdirSync(publicDir);
        for (const f of files) {
          const fullPath = path.join(publicDir, f);
          if (fs.statSync(fullPath).isFile() && (f.endsWith('.json') || f.endsWith('.js') || f.endsWith('.html'))) {
            const content = fs.readFileSync(fullPath, 'utf-8');
            expect(content).not.toContain('service_role');
            expect(content).not.toContain('SUPABASE_SERVICE_ROLE_KEY');
          }
        }
      }
    });
  });

  describe('5. Direct Supabase Query Lockdown & Privilege Escalation Protection', () => {
    it('verifies service-role exclusive tables deny direct client writes', () => {
      const exclusiveTables = ['audit_logs', 'role_permissions', 'user_roles'];
      for (const t of exclusiveTables) {
        const meta = tableRegistry.get(t);
        expect(meta).toBeDefined();
        expect(meta!.rlsEnabled).toBe(true);
        // Under Postgres RLS, tables with no policies or no client policies reject direct REST queries
        const clientInsert = meta!.policies.find(
          (p) => (p.action === 'INSERT' || p.action === 'ALL') && p.roles === 'authenticated'
        );
        expect(clientInsert).toBeUndefined();
      }
    });

    it('verifies privilege escalation trigger prevents users from elevating is_admin or plan', () => {
      const migrationFile = path.resolve(
        process.cwd(),
        'supabase',
        'migrations',
        '20261013000001_harden_auth_and_rls_security.sql'
      );
      const content = fs.readFileSync(migrationFile, 'utf-8');

      expect(content).toContain('CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()');
      expect(content).toContain('NEW.is_admin := OLD.is_admin;');
      expect(content).toContain('NEW.subscription_plan := OLD.subscription_plan;');
      expect(content).toContain('CREATE TRIGGER trg_prevent_profile_privilege_escalation');
    });

    it('confirms payment_transactions cannot be forged via direct client INSERT', () => {
      const meta = tableRegistry.get('payment_transactions');
      expect(meta).toBeDefined();

      // Only SELECT is permitted for users; INSERT/UPDATE must go through service_role payment gateways
      const insertPolicies = meta!.policies.filter((p) => p.action === 'INSERT' || p.action === 'ALL');
      const publicInsert = insertPolicies.find((p) => p.roles === 'public' || p.roles === 'authenticated');
      expect(publicInsert).toBeUndefined();
    });
  });
});
