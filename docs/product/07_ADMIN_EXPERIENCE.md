# SAMYAK TUTOR — PHASE 6: MASTER ADMINISTRATION EXPERIENCE SPECIFICATION
**Document ID:** `docs/product/07_ADMIN_EXPERIENCE.md`  
**Version:** 1.0.0 (Master Administration & Operations System)  
**Date:** November 10, 2026  
**Status:** Approved & Verified  
**Workspace:** `d:\FR` | **Branch:** `feature/product-transformation`  
**Author:** Multidisciplinary Product Development Team (Principal Software Architect, Senior Next.js Engineer, Application Security Engineer)

---

## 1. Administration Philosophy: Complete Operational Command

The Samyak Administration Workspace provides executive, academic, financial, and technical leadership with a unified operational command center. It unifies 37 administrative sub-routes into a cohesive, high-performance portal.

### 1.1 Core Tenets
1. **Zero Exposure:** Administrative routes are protected by server-side middleware, layout-level route guards, and PostgreSQL Row-Level Security (RLS) policies. Normal students can never access or enumerate admin endpoints.
2. **Speed & Ergonomics:** Powered by the `AdminOmniCommand` (Cmd+K) quick-switcher and unified data tables with sticky headers and pagination.
3. **Audited Actions:** Every privileged action (role promotion, enrollment grant, coupon generation, manual score override) writes an immutable record to `public.audit_logs`.
4. **Tenant & School Isolation:** Multi-school environments ensure staff cannot alter or view cross-institutional billing or student grades.

---

## 2. Navigational Architecture (6 Operational Sectors)

Implemented in [`src/app/admin/components/AdminDashboardClient.tsx`](file:///d:/FR/src/app/admin/components/AdminDashboardClient.tsx):

### 2.1 Sector 1: Platform Overview & System Telemetry
- **Platform Overview (`/admin`):** High-level summary of Daily Active Users (DAU), Monthly Recurring Revenue (MRR), total exams completed, and live multiplayer CCU.
- **Admin Infra Pulse ([`AdminInfraPulse.tsx`](file:///d:/FR/src/components/admin/AdminInfraPulse.tsx)):** Real-time monitoring of Supabase database connection pool health, Colyseus WebSocket engine latency, and Bunny CDN streaming throughput.
- **Admin Telemetry Radar ([`AdminTelemetryRadar.tsx`](file:///d:/FR/src/components/admin/AdminTelemetryRadar.tsx)):** Live map of student concurrency across Nepal's 7 provinces.
- **Omni Command ([`AdminOmniCommand.tsx`](file:///d:/FR/src/components/admin/AdminOmniCommand.tsx)):** Global keyboard-driven search (`⌘K`) indexing students, invoices, exams, and curriculum chapters.

### 2.2 Sector 2: Academic & Curriculum Operations
- **Courses & Programs (`/admin/courses`):** Master management of CEE, SEE, IOE, NEB, Lok Sewa, and Skills tracks.
- **Batches & Cohorts (`/admin/batches`):** Cohort launch dates, student caps, syllabus progress, and faculty assignment.
- **Subjects & Chapters (`/admin/subjects`, `/admin/chapters`):** CDC and MEC curriculum syllabus hierarchy.
- **Lessons & Video Streaming (`/admin/lessons`):** Bunny.net video GUID binding, DRM watermark settings, and HLS transcoding status.
- **Study Materials & PDFs (`/admin/resources`):** Secure upload of lecture slides, formula summaries, and past papers.
- **MCQ Question Bank (`/admin/questions`):** Rich LaTeX question editor, 4-option creator, answer rationale, and difficulty grading.
- **Exam Builder (`/admin/exams`):** Full-length 200Q mock authoring, negative marking settings (-0.25), and start/end time windows.
- **Autonomous AI Operations (`/admin/autonomous`):** Oversight for AI-assisted question generation and Gemini curriculum ingestion pipelines.

### 2.3 Sector 3: Student Operations & User Management
- **Students Directory (`/admin/users?role=student`):** Search by phone, email, name, or student ID.
- **Student 360 Drawer ([`Student360Drawer.tsx`](file:///d:/FR/src/components/admin/Student360Drawer.tsx)):** Comprehensive slide-out inspection showing test history, login IP addresses, connected devices, active subscriptions, and support tickets.
- **Course Enrollments (`/admin/enrollments`):** Manual student enrollment, trial extensions, and batch transfers.
- **Activation Vouchers (`/admin/activation-codes`):** Bulk minting of 16-character alphanumeric voucher cards for institutional distribution.
- **Impersonation Safety Guard ([`impersonationGuard.ts`](file:///d:/FR/src/lib/auth/impersonationGuard.ts)):** Strict audit logging when an administrator enters "View as Student" mode, with read-only flags and explicit watermark banners ([`GhostViewBanner.tsx`](file:///d:/FR/src/components/admin/GhostViewBanner.tsx)).

### 2.4 Sector 4: Competitive Operations & Battle Arena
- **Arena Control & Ratings (`/admin/arena`):** Real-time monitoring of 1v1 match queues, average question latency, and Elo distribution.
- **Daily Championship Management (`/admin/arena/championship`):** Schedule daily NPR 1,000 prize tournaments, configure question pools, and audit winner idempotency hashes.
- **Cheating & Disconnect Moderation:** Automatic flagging of abnormally fast answer submissions (< 800ms) or proctoring camera occlusions.

### 2.5 Sector 5: Finance & Commercial Ledger
- **Orders & Payments (`/admin/orders`):** Live Fonepay dynamic QR transaction stream, PRN reconciliation, and payment slip review modal ([`PaymentSlipInspectionModal.tsx`](file:///d:/FR/src/components/admin/PaymentSlipInspectionModal.tsx)).
- **Double-Entry Tax Ledger (`/admin/billing`):** Immutable invoice ledger tracking VAT, PAN numbers, and auto-generated PDF receipts.
- **Coupons & Discounts (`/admin/coupons`):** Time-limited percentage and flat-rate discount codes with maximum redemption limits.

### 2.6 Sector 6: Governance, Security & System
- **Staff Directory & Roles (`/admin/teachers`, `/admin/roles`):** Role-Based Access Control matrix ([`RbacMatrixTable.tsx`](file:///d:/FR/src/components/admin/RbacMatrixTable.tsx)) managing permissions for `super_admin`, `admin`, `teacher`, `content_manager`, and `support_staff`.
- **Immutable Security Audit Logs (`/admin/audit-logs`):** Append-only log of every administrative session, IP address, and changed database record.
- **Broadcast Announcements (`/admin/announcements`):** Push emergency bulletins and platform-wide notifications to student headers.
- **Platform Settings (`/admin/settings`):** Global rate limits, maintenance mode toggles, and payment gateway credentials.

---

## 3. Verification & Sign-Off

- **Admin Routes Audited:** 37 routes verified and mapped into 6 cohesive operational sectors.
- **Privilege Separation:** RBAC verified with server-side redirects for non-staff users.
- **TypeScript Check:** `npx tsc --noEmit` exits with **0 errors**.
- **Deliverable Status:** Complete and written to `docs/product/07_ADMIN_EXPERIENCE.md`.
- **Ready for Next Phase:** **Phase 7 — Motion Design System (`08_ANIMATION_SYSTEM.md`)**.
