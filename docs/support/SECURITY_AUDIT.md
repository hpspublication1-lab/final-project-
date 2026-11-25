# CEE VISUAL INTELLIGENCE FOUNDATION — COMPREHENSIVE SECURITY AUDIT
**Target Pull Request**: PR #6 (`origin/feat/cee-visual-foundation`)
**Baseline Commit SHA**: `1a01ca713b7751ac6ae8827984944049e9cf45a6`
**Verification Worktree**: `D:\FR\worktrees\cee-foundation-verification`
**Lead Auditor**: Independent Cybersecurity Auditor
**Audit Date**: November 25, 2026
**Overall Classification**: `EVIDENCE-BASED SECURITY EVALUATION`

---

## 1. Executive Summary

This independent security audit evaluates Claude Opus's CEE Visual Intelligence Foundation implementation (PR #6). The architecture introduces scoped role assignments (`cee_role_assignments`), pure separation-of-duties access control (`authz.ts`), server-authoritative scoring (`grading.ts`), and immutable publication transactions.

Ten critical threat vectors were independently audited and verified against the codebase.

---

## 2. Ten Mandated Threat Vector Verification Matrix

| # | Threat Vector / Security Claim | Verification Target | Implementation Mechanism | Audit Result | Status |
| :---: | :--- | :--- | :--- | :--- | :---: |
| **1** | **Students cannot retrieve correct answers before submission** | `toStudentQuestion()` in `grading.ts:32` | Drops `answerKey` and `rationale`. Only sanitized `{ key, text }` choices are serialized to the client. | **VERIFIED** | `PASS` |
| **2** | **Students cannot directly modify their marks** | `submitAttempt()` in `service.server.ts:365` | Marks computed purely server-side via `gradeAttempt()`. `AttemptRequest` Zod schema rejects any client-supplied scores. | **VERIFIED** | `PASS` |
| **3** | **Students cannot falsely mark lessons complete** | `computeCompletion()` in `completion.ts:48` | Completion is evaluated from server-persisted events (`LESSON_OPENED`, `SECTION_READ`, `SEQUENCE_STEP`) + quiz passing threshold. | **VERIFIED** | `PASS` |
| **4** | **Writers cannot approve their own content** | `SOD_ACTIONS` in `authz.ts:52` & `admin.server.ts:55` | Separation of duties (SoD): `decideScope()` rejects actions where `req.authorIds.includes(req.actorId)` with `SOD_VIOLATION`. | **VERIFIED** | `PASS` |
| **5** | **Reviewers cannot access unauthorized review categories** | `ACTION_ROLES` in `authz.ts:30` | Each review gate (`SCIENTIFIC`, `VISUAL`, `ASSESSMENT`, etc.) requires matching role key (`SUBJECT_EXPERT`, `QUESTION_REVIEWER`). | **VERIFIED** | `PASS` |
| **6** | **Subject-specific staff cannot modify other subjects** | `decideScope()` in `authz.ts:93` | Scoped assignments enforce `a.subject_node_id === null || a.subject_node_id === subject`. Cross-subject writes rejected with `FORBIDDEN`. | **VERIFIED** | `PASS` |
| **7** | **Unpublished lessons cannot be accessed by students** | `loadPublishedLesson()` in `service.server.ts:226` | Query joins `cee_publications` with `superseded_at IS NULL`. Lessons without active publications throw `NOT_FOUND` (404). | **VERIFIED** | `PASS` |
| **8** | **Archived revisions cannot accidentally become public** | `cee_publish_revision()` DB transaction | Publishing sets `superseded_at = now()` on prior publications. Only the exact approved revision becomes active. | **VERIFIED** | `PASS` |
| **9** | **Disabled APIs cannot be accessed via alternative routes** | `requireFeature()` in `service.server.ts:76` | Server-side feature flag throws `NOT_FOUND` (404) across all `/api/v1/cee/*` student routes when disabled. | **VERIFIED** | `PASS` |
| **10**| **Unrelated departments cannot leak content into CEE** | `ProgramCode` scoping in `authz.ts:101` | Role assignments, syllabi, curriculum nodes, and lesson mappings are partitioned by `program_code`. | **VERIFIED** | `PASS` |

---

## 3. Detailed Security Findings

### Finding SEC-001: Separation of Duties (SoD) Self-Approval Prevention
- **Baseline Commit**: `1a01ca713b7751ac6ae8827984944049e9cf45a6`
- **Severity**: Critical (Educational Integrity)
- **Status**: `VERIFIED`
- **Affected File**: `src/lib/cee-visual/authz.ts`, lines 52–62 & 113–115
```typescript
const SOD_ACTIONS: ReadonlySet<CeeAction> = new Set<CeeAction>([
  'syllabus:verify',
  'mapping:approve',
  'review:SYLLABUS_MAPPING',
  'review:SCIENTIFIC',
  'review:VISUAL',
  'review:ASSESSMENT',
  'review:ACCESSIBILITY',
  'review:RIGHTS',
  'publish',
]);
...
if (SOD_ACTIONS.has(req.action) && (req.authorIds ?? []).includes(req.actorId)) {
  return { allowed: false, code: 'SOD_VIOLATION', reason: 'the author cannot approve or publish their own work' };
}
```
- **Reproduction**: Tested via unit test `src/lib/cee-visual/__tests__/authz.test.ts`. An editor who authors revision 1 cannot cast a decision on revision 1, preventing rogue staff from self-approving educational material.
- **Integration Risk**: None.

---

### Finding SEC-002: Program Boundary Isolation & Department Sandboxing
- **Baseline Commit**: `1a01ca713b7751ac6ae8827984944049e9cf45a6`
- **Severity**: High (Cross-Tenant Data Leakage)
- **Status**: `VERIFIED`
- **Affected File**: `src/lib/cee-visual/authz.ts`, line 101 & `service.server.ts`, line 96
- **Analysis**: Staff assignments require an explicit `program_code` (`cee_medical`, `see_class_10`, `ioe_engineering`). An Academic Director in SEE cannot verify syllabi or assign reviewers in CEE. Students enrolled only in SEE receive `HTTP 403 Forbidden` (`FORBIDDEN: Enrol in this course to open its visual lessons`) when attempting to access CEE visual lessons.
- **Integration Risk**: None.

---

### Finding SEC-003: Content Security Policy (CSP) & WebAssembly Draco Restriction
- **Baseline Commit**: `1a01ca713b7751ac6ae8827984944049e9cf45a6`
- **Severity**: Medium (Performance / Architecture)
- **Status**: `VERIFIED`
- **Affected File**: `src/lib/cee-visual/validators/glb.ts`, lines 12–16 & `next.config.mjs`
- **Analysis**: Production CSP restricts `script-src` and omits `'wasm-unsafe-eval'`. Draco and Meshopt compressed 3D models require WebAssembly decoders to unpack geometry on the client. To prevent silent WebAssembly CSP blocks or crashes on student devices, Claude Opus's GLB validator explicitly rejects Draco-compressed meshes with a descriptive error message and permits uncompressed or quantised meshes (`KHR_mesh_quantization`).
- **Remediation**: If Draco compression is desired in future phases to reduce bandwidth, `next.config.mjs` CSP must be updated to permit WebAssembly execution (`'wasm-unsafe-eval'`), and DRACO decompression workers must be locally hosted.

---

### Finding SEC-004: Strict Idempotency & Replay Protection on Telemetry & Attempts
- **Baseline Commit**: `1a01ca713b7751ac6ae8827984944049e9cf45a6`
- **Severity**: Informational
- **Status**: `VERIFIED`
- **Affected File**: `src/app/api/v1/cee/me/lessons/[id]/attempts/route.ts`, lines 15–16
- **Analysis**: Endpoints enforce an `Idempotency-Key` header (`/^[A-Za-z0-9_-]{8,128}$/`). Duplicate or retried requests from flaky mobile networks return the stored grade receipt without duplicating attempt entries in the database.
