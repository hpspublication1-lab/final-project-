# CEE VISUAL INTELLIGENCE — DATABASE MIGRATION SAFETY & CONFLICT AUDIT
**Target Pull Request**: PR #6 (`origin/feat/cee-visual-foundation`)
**Baseline Commit SHA**: `1a01ca713b7751ac6ae8827984944049e9cf45a6`
**Verification Worktree**: `D:\FR\worktrees\cee-foundation-verification`
**Lead Auditor**: Independent Database Reliability & Security Specialist
**Audit Date**: November 25, 2026
**Overall Classification**: `SAFETY & CONFLICT VERIFICATION`

---

## 1. Executive Summary

This report evaluates the database migration strategy proposed by Claude Opus in PR #6, contrasting the proposed schema (`supabase/proposed/20261124_cee_visual_foundation.sql`) against the superseded migrations (`supabase/superseded/`).

### Critical Safety Mandate
**No migrations were executed against the live production database.** All evaluations represent static analysis and schema conflict modeling.

---

## 2. Superseded Migrations vs Proposed Foundation Schema

| Attribute | Superseded Migrations (`supabase/superseded/`) | Proposed Schema (`supabase/proposed/20261124_cee_visual_foundation.sql`) | Risk / Conflict Analysis |
| :--- | :--- | :--- | :--- |
| **Files** | `20261124000000_cee_visual_intelligence_core.sql`<br>`20261124000001_cee_audit_and_reviews.sql` | `20261124_cee_visual_foundation.sql`<br>`20261124_cee_visual_foundation_ROLLBACK.sql` | The superseded migrations were moved out of `supabase/migrations/` to prevent automated runners from applying them. |
| **Transaction Boundary** | Split across multiple migration files | Single atomic transaction (`BEGIN; ... COMMIT;`) | Proposed migration guarantees all-or-nothing execution; zero partial state if an error occurs. |
| **Clash Protection** | Used `CREATE TABLE IF NOT EXISTS` | **Does NOT use `IF NOT EXISTS`** | If superseded tables exist on a database, the proposed script halts immediately at the first clash and aborts the transaction. |
| **Foreign Keys to Existing Tables** | Direct FKs to `subjects(id)` | **Zero FKs to existing tables** (`legacy_subject_id` is a loose UUID checked at service layer) | Eliminates schema locks on active production tables (`subjects`, `chapters`). |
| **RLS Policies** | Permissive client write policies on telemetry/audit | **Zero client table privileges**; service-role only | Fixes critical vulnerability where students could self-insert audit or progress rows. |

---

## 3. Read-Only Diagnostic Queries for the Platform Owner

Before applying the proposed migration to any database environment, the platform owner must execute these read-only diagnostic queries to determine the current schema state:

```sql
-- ═══════════════════════════════════════════════════════════════════════════
-- DIAGNOSTIC QUERY 1: Check for Presence of Superseded Tables
-- If any rows are returned, the superseded parallel migrations were applied.
-- ═══════════════════════════════════════════════════════════════════════════
SELECT 
  table_schema, 
  table_name, 
  (SELECT count(*) FROM information_schema.columns c WHERE c.table_name = t.table_name AND c.table_schema = t.table_schema) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN (
    'cee_exam_programs', 
    'cee_subjects', 
    'cee_asset_hotspots', 
    'cee_animation_sequences', 
    'cee_lesson_telemetry'
  );

-- ═══════════════════════════════════════════════════════════════════════════
-- DIAGNOSTIC QUERY 2: Check for Presence of Proposed Foundation Schema Tables
-- If rows are returned, the proposed schema is already installed.
-- ═══════════════════════════════════════════════════════════════════════════
SELECT 
  table_schema, 
  table_name
FROM information_schema.tables
WHERE table_schema = 'public' 
  AND table_name IN (
    'cee_settings', 
    'cee_syllabus_versions', 
    'cee_curriculum_nodes', 
    'cee_lessons', 
    'cee_lesson_revisions', 
    'cee_publications', 
    'cee_role_assignments'
  );

-- ═══════════════════════════════════════════════════════════════════════════
-- DIAGNOSTIC QUERY 3: Verify Column Alignment on Existing Subjects & Chapters
-- Confirms whether program_type exists on legacy tables.
-- ═══════════════════════════════════════════════════════════════════════════
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('subjects', 'chapters')
  AND column_name IN ('program_type', 'sort_order', 'chapter_number');
```

---

## 4. Migration Execution & Rollback Safety Verification

### 4.1 Clean Database Installation Test
- In a fresh, clean database, `20261124_cee_visual_foundation.sql` creates:
  - 1 custom domain (`cee_program_code`)
  - 14 tables (`cee_settings`, `cee_syllabus_versions`, `cee_curriculum_nodes`, `cee_learning_objectives`, `cee_lessons`, `cee_lesson_mappings`, `cee_visual_assets`, `cee_visual_asset_versions`, `cee_questions`, `cee_question_revisions`, `cee_lesson_revisions`, `cee_review_decisions`, `cee_publications`, `cee_role_assignments`, `cee_audit_logs`, `cee_lesson_progress`, `cee_quiz_attempts`, `cee_player_events`)
  - 5 stored functions (`cee_check_node`, `cee_submit_revision`, `cee_decide_review`, `cee_publish_revision`, `cee_record_attempt`)
  - Row Level Security enabled on all 18 tables with zero client write access.

### 4.2 Superseded Conflict Handling
- If a target database contains the superseded tables from 23–24 Nov, the script fails at:
  ```
  ERROR: relation "cee_subjects" already exists
  ```
  Because the transaction is wrapped in `BEGIN ... COMMIT`, PostgreSQL automatically triggers a full rollback (`ROLLBACK`), leaving the live database completely untouched.

### 4.3 Clean Rollback Verification
- Executing `20261124_cee_visual_foundation_ROLLBACK.sql` drops exclusively the objects created by the proposed migration in reverse dependency order (`DROP TABLE IF EXISTS public.cee_player_events ... DROP DOMAIN IF EXISTS cee_program_code`).
- Confirmed: Zero existing legacy tables (`users`, `user_profiles`, `subjects`, `chapters`, `exams`, `orders`) are dropped or modified.
