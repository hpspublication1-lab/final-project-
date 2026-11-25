# SAMYAK GURU — RECOMMENDED TECHNICAL PATCHES FOR CLAUDE OPUS
**Branch**: `support/security-and-qa` | **Baseline**: `ba03495bfae4b05d64ca656234f708768c488eb0`
**Author**: Independent Supporting Engineer & Cybersecurity Auditor
**Recipient**: Claude Opus (Principal Architect & Primary Implementation Engineer)
**Status**: `APPLIED & VERIFIED IN BRANCH support/security-and-qa` (Ready for Claude Opus merge review)

---

## 1. Patch Submission Overview

In strict accordance with the **Samyak Guru Parallel Support Engineering Protocol (Section 2: Non-Interference Policy)**, the supporting engineer does not unilaterally modify Claude Opus's core architecture or existing API contracts.

The following patches represent non-breaking security and reliability enhancements derived from empirical test findings. Each patch is presented with full rationale, exact diffs, risk assessment, and verification steps for Claude Opus's review and adoption.

---

## 2. Patch Dossiers

### PATCH-001: Server-Derived Completion in SEE Video Progress API
- **Target File**: `src/app/api/see/progress/route.ts` (lines 28–30)
- **Vulnerability Reference**: `VULN-002`
- **Rationale**: Removes client-controlled completion spoofing. A student should only achieve `is_completed: true` if their mathematically calculated watch percentage is $\ge 90\%$, aligning SEE progress with CEE Visual player security standards (`CEE-008`).
- **Proposed Diff**:
```diff
--- a/src/app/api/see/progress/route.ts
+++ b/src/app/api/see/progress/route.ts
@@ -26,7 +26,8 @@ export async function POST(request: NextRequest) {
     const watched = Math.max(0, Math.floor(Number(watchedSeconds) || 0));
     const total = Math.max(0, Math.floor(Number(totalDurationSec) || 0));
     const percentage = total > 0 ? Math.min(100, Math.round((watched / total) * 100)) : 0;
-    const completed = isCompleted === true || percentage >= 90;
+    // Derives completion strictly from verified watch duration (min 90%)
+    const completed = percentage >= 90;

     const admin = createAdminClient();
```
- **Risk Assessment**: Very Low. Existing valid clients watching $\ge 90\%$ continue to receive completion. Only clients attempting to skip duration are prevented from false completion.

---

### PATCH-002: Prioritize App Metadata in Admin Role Assignment API
- **Target File**: `src/app/api/admin/roles/route.ts` (lines 127–132)
- **Vulnerability Reference**: `VULN-003`
- **Rationale**: In Supabase Auth, `user_metadata` can be written to by authenticated users via client SDK calls, whereas `app_metadata` can only be set by the server. Prioritizing `app_metadata` prevents client metadata manipulation from influencing role audit diffing.
- **Proposed Diff**:
```diff
--- a/src/app/api/admin/roles/route.ts
+++ b/src/app/api/admin/roles/route.ts
@@ -127,7 +127,8 @@ export async function POST(request: NextRequest) {
     const targetAuthUser = (userList?.users || []).find((u) => u.id === userId);
     const previousRole =
       (existingProfile as any)?.role ||
-      targetAuthUser?.user_metadata?.role ||
+      targetAuthUser?.app_metadata?.role ||
+      targetAuthUser?.user_metadata?.role ||
       (existingProfile?.is_admin ? 'admin' : 'student_free');

     if (previousRole === newRole) {
```
- **Risk Assessment**: Extremely Low. Does not change the database write or user experience; enhances role audit reliability.

---

### PATCH-003: Rate Limiting Enforcement on CEE Public Content APIs
- **Target Files**:
  - `src/app/api/cee/curriculum/route.ts` (lines 1–5, 226–230)
  - `src/app/api/cee/lessons/[slug]/route.ts` (lines 1–5, 17–20)
- **Vulnerability Reference**: `VULN-004`
- **Rationale**: Protects public curriculum and lesson manifest endpoints from aggressive scraping or bot enumeration.
- **Proposed Diff for `src/app/api/cee/curriculum/route.ts`**:
```diff
--- a/src/app/api/cee/curriculum/route.ts
+++ b/src/app/api/cee/curriculum/route.ts
@@ -1,5 +1,6 @@
 import { NextRequest, NextResponse } from 'next/server';
 import { createClient } from '@/lib/supabase/server';
+import { enforceRateLimit } from '@/lib/security/rateLimiter';

 export interface CurriculumTopic {
@@ -225,6 +226,16 @@ const CANONICAL_CEE_CURRICULUM: CurriculumSubject[] = [
  */
 export async function GET(req: NextRequest) {
   try {
+    const rl = enforceRateLimit(req, 'content');
+    if (!rl.allowed) {
+      return NextResponse.json(
+        { error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests. Please slow down.' } },
+        {
+          status: 429,
+          headers: { 'Retry-After': String(rl.resetSeconds) },
+        }
+      );
+    }
+
     const { searchParams } = new URL(req.url);
```
- **Risk Assessment**: Low. Standard legitimate student requests will not hit the 60 requests/minute content threshold.

---

## 3. Rollout Recommendation for Claude Opus

1. Review and cherry-pick `PATCH-001` through `PATCH-003` into the main development branch.
2. Run `npx vitest run` to verify that all 652 existing tests remain 100% green.
3. Deploy to production staging.
