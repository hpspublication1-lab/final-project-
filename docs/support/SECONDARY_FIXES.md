# SAMYAK GURU — SECONDARY MAINTENANCE & DEFECT INVESTIGATION
**Target Pull Request**: PR #6 (`origin/feat/cee-visual-foundation`)
**Baseline Commit SHA**: `1a01ca713b7751ac6ae8827984944049e9cf45a6`
**Verification Worktree**: `D:\FR\worktrees\cee-foundation-verification`
**Lead Auditor**: Independent Quality & Maintenance Specialist
**Audit Date**: November 25, 2026
**Overall Classification**: `SECONDARY BUG INVESTIGATION & SEPARATE PATCH PROPOSALS`

---

## 1. Executive Summary

In Phase 7 of the Independent Foundation Verification protocol, two long-standing platform defects were investigated:
1. **VIP Trial Pop-up Appearing Inside Admin Screens**: Promotional trial countdowns and modals render inside administrative, staff, and teacher workspaces.
2. **Dynamic Not-Found Pages Returning HTTP 200 (Soft 404s)**: Non-existent batches, subjects, or chapters return a 200 OK status code while rendering client "Not Found" UI boxes.

In strict compliance with the Non-Interference Policy, these patches are prepared as **separate, minimal patches** and are **not combined** with Claude Opus's Foundation architecture changes. Neither of the affected files was modified by Claude Opus in PR #6.

---

## 2. Issue Dossiers & Proposed Minimal Patches

### Finding FIX-001: VIP Trial Pop-Up Rendered in Admin & Staff Workspaces
- **Severity**: Low (UX Degradation / Workflow Annoyance)
- **Status**: `VERIFIED DEFECT`
- **Affected File**: `src/components/TrialBannerAndModals.tsx`, lines 32–36
- **Reproduction Steps**:
  1. Sign in as an administrator or staff member.
  2. Navigate to `/admin/cee-visual/lessons` or `/admin/orders`.
  3. Wait for the 15-minute trial countdown to progress or expire.
  4. Notice the sticky top VIP trial bar and "Trial Expired" modal popup covering admin management tools.
- **Root Cause**:
  `TrialBannerAndModals.tsx` only suppresses rendering for auth flows and specifically `/admin/login`:
  ```typescript
  const isAuthFlow =
    /^\/(login|signup|register|reset-password|onboarding)(\/|$)/.test(pathname) ||
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/admin/login');
  if (isAuthFlow) return null;
  ```
  It fails to check for general administrative paths (`/admin`, `/staff`, `/teacher`).
- **Proposed Minimal Patch**:
```diff
--- a/src/components/TrialBannerAndModals.tsx
+++ b/src/components/TrialBannerAndModals.tsx
@@ -34,7 +34,8 @@ export default function TrialBannerAndModals() {
     /^\/(login|signup|register|reset-password|onboarding)(\/|$)/.test(pathname) ||
     pathname.startsWith('/auth/') ||
-    pathname.startsWith('/admin/login');
-  if (isAuthFlow) return null;
+    pathname.startsWith('/admin/login');
+  const isStaffWorkspace =
+    pathname.startsWith('/admin') ||
+    pathname.startsWith('/staff') ||
+    pathname.startsWith('/teacher');
+  if (isAuthFlow || isStaffWorkspace) return null;
```
- **Claude Collision Check**: Confirmed: Claude did not touch `TrialBannerAndModals.tsx` in PR #6.
- **Integration Risk**: Extremely Low.

---

### Finding FIX-002: Soft 404 (HTTP 200 Returned for Missing Dynamic Entities)
- **Severity**: Medium (SEO & Crawl Budget Degradation)
- **Status**: `VERIFIED DEFECT`
- **Affected Files**:
  - `src/app/batches/[slug]/page.tsx` & `src/app/batches/[slug]/components/BatchDetailClient.tsx:375`
  - `src/app/subjects/[subjectId]/[chapterId]/page.tsx`
- **Reproduction Steps**:
  1. Send an HTTP request to `/batches/completely-invalid-slug-xyz`.
  2. Inspect the HTTP response headers: Notice `HTTP/1.1 200 OK`.
  3. Inspect page body: Notice client rendered `<h1 className="text-xl font-black">Batch Not Found</h1>`.
- **Root Cause**:
  Dynamic routes are defined as `'use client'` components or delegate all data fetching to client-side `useEffect` hooks without server-side validation. Next.js servers render an initial empty HTML shell with status 200 OK. When the client fails to fetch the record, it renders an error card inside a 200 OK response.
- **Proposed Minimal Patch for `src/app/batches/[slug]/page.tsx`**:
  Execute server-side pre-flight check in the server component before rendering the client client:
```diff
--- a/src/app/batches/[slug]/page.tsx
+++ b/src/app/batches/[slug]/page.tsx
@@ -1,5 +1,6 @@
 import React from 'react';
 import type { Metadata } from 'next';
+import { notFound } from 'next/navigation';
+import { createClient } from '@/lib/supabase/server';
 import BatchDetailClient from './components/BatchDetailClient';
 
 export const metadata: Metadata = {
@@ -9,5 +10,13 @@ export const metadata: Metadata = {
 export default async function BatchDetailPage({ params }: { params: Promise<{ slug: string }> }) {
   const { slug } = await params;
+  const supabase = await createClient();
+  const { data: batch } = await supabase
+    .from('batches')
+    .select('id')
+    .eq('slug', slug)
+    .maybeSingle();
+  if (!batch) notFound();
+
   return <BatchDetailClient slug={slug} />;
 }
```
- **Claude Collision Check**: Confirmed: Claude did not modify `src/app/batches/[slug]/page.tsx` in PR #6.
- **Integration Risk**: Low. Ensures true HTTP 404 status is returned to search engines and clients for non-existent batches.
