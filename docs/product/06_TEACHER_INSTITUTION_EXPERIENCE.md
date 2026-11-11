# SAMYAK TUTOR — PHASE 5: TEACHER & INSTITUTION EXPERIENCE SPECIFICATION
**Document ID:** `docs/product/06_TEACHER_INSTITUTION_EXPERIENCE.md`  
**Version:** 1.0.0 (Master Faculty & Institutional Portal)  
**Date:** November 10, 2026  
**Status:** Approved & Verified (`npx tsc --noEmit` 0 errors)  
**Workspace:** `d:\FR` | **Branch:** `feature/product-transformation`  
**Author:** Multidisciplinary Product Development Team (Principal UX Architect, Senior Next.js Engineer, Application Security Engineer)

---

## 1. Faculty Experience Philosophy: Academic Command & Cohort Triage

The faculty experience at Samyak Tutor is designed to reduce administrative friction and empower educators to focus on student mastery. Teachers must not spend hours wrestling with clumsy CMS forms or searching for unaddressed student questions.

### 1.1 Core Principles
1. **Zero Fake Data:** All interfaces strictly connect to real Supabase PostgreSQL data. Mock records (such as hardcoded sample doubts) have been completely eliminated in favor of live query feeds and informative empty states.
2. **Pedagogical Autonomy:** Faculty can author MCQs with KaTeX LaTeX formatting, schedule live classes, assemble custom chapter quizzes, and grade subjective student submissions.
3. **Cohort Triage:** Instant visibility into which students are lagging behind in attendance or test accuracy.
4. **Strict Tenant & Role Isolation:** Teachers can only access cohorts, questions, and submissions within their assigned academic programs. Cross-school or unauthorized administrative access is blocked at the database RLS level.

---

## 2. Teacher Dashboard Architecture (`/teacher`)

Implemented in [`src/app/teacher/components/TeacherDashboardClient.tsx`](file:///d:/FR/src/app/teacher/components/TeacherDashboardClient.tsx):

### 2.1 The 10-Pillar Faculty Navigation Matrix
| Tab # | Key | Label | Icon | Core Functionality |
| :---: | :--- | :--- | :--- | :--- |
| **1** | `batches` | My Batches | `Layers` | Assigned student cohorts, enrollment counts, active syllabus pace |
| **2** | `schedule` | Weekly Timetable | `Calendar` | Live lecture slots, conflict avoidance, Google Calendar sync |
| **3** | `classes` | Live Classrooms | `Radio` | Launch 100ms WebRTC or YouTube Live sessions, view live attendees |
| **4** | `lessons` | Video Lectures | `BookOpen` | Curriculum video lessons, lecture descriptions, attachments |
| **5** | `resources` | Study Material | `FileText` | Upload chapter lecture slides, formula sheets, and PDF notes |
| **6** | `questions` | MCQ Authoring | `Zap` | Create new MCQs with LaTeX math preview and step-by-step solutions |
| **7** | `tests` | Exam Builder | `Award` | Assemble chapter mock tests, set time limits, assign to batches |
| **8** | `evaluations` | Paper Grading | `CheckCircle2` | Grade subjective handwritten answers using CDC/MEC rubrics |
| **9** | `doubts` | Doubt Queue | `MessageCircleQuestion`| Live student question feed with step-by-step teacher reply editor |
| **10**| `progress` | Cohort Analytics | `Users` | Track average batch accuracy, weak chapters, and student attendance |

---

## 3. Remediated Systems: Authentic Data & Zero Simulation

### 3.1 Elimination of Mock Doubts
- **Previous State:** Lines 55–76 in `TeacherDashboardClient.tsx` contained hardcoded mock questions attributed to fake students (`Aarav Sharma`, `Pooja Thapa`).
- **Remediated State:**
  - `doubts` state is initialized to an empty array.
  - `fetchTeacherOverview` actively queries `/api/doubts?status=open`.
  - When no doubts are pending, the UI displays an honest, polished empty state:
    > *"No Pending Student Doubts — All incoming questions from your assigned cohort have been resolved. New inquiries will appear here in real-time."*
  - Faculty answers are submitted directly to `/api/doubts/[id]/reply` with atomic database updates.

### 3.2 Subjective Paper Evaluations (`/teacher/evaluations`)
- Faculty can review student-submitted handwritten answer sheets uploaded via the PWA camera or image picker.
- Integrated rubric scoring allows grading by individual criteria (e.g. `Steps & Derivation: 3/4`, `Final Answer: 1/1`).
- Teachers can annotate mistakes and trigger immediate notifications to the student.

---

## 4. Institutional School Portal Architecture (`/staff`, `/parent-dashboard`)

For partner secondary schools and coaching institutions running on the Samyak platform:

### 4.1 Multi-Tenant Isolation
- Every institutional student, teacher, and batch carries an immutable `school_id` / `tenant_id` foreign key.
- Supabase Row-Level Security (RLS) policies prevent School A faculty from accessing School B student records, exam results, or financial invoices:
  ```sql
  CREATE POLICY "tenant_isolation_policy" ON public.student_profiles
    FOR ALL USING (school_id = (SELECT school_id FROM public.staff_profiles WHERE user_id = auth.uid()));
  ```

### 4.2 School Administrative Capabilities
1. **Cohort Performance Radar:** Compare Class 10 Section A vs. Section B on national SEE CDC model tests.
2. **Attendance Auditing:** Track automated live-class presence logs and daily study hour quotas.
3. **Parent Reporting Portal (`/parent-dashboard`):** Weekly progress digest sent via SMS/WhatsApp with test percentile, study hours, and teacher remarks.

---

## 5. Verification & Sign-Off

- **Code Cleaned:** Removed mock doubts from [`src/app/teacher/components/TeacherDashboardClient.tsx`](file:///d:/FR/src/app/teacher/components/TeacherDashboardClient.tsx).
- **API Integrated:** Connected live fetch to `/api/doubts?status=open` with genuine empty states.
- **TypeScript Check:** `npx tsc --noEmit` exits with **0 errors**.
- **Deliverable Status:** Complete and written to `docs/product/06_TEACHER_INSTITUTION_EXPERIENCE.md`.
- **Ready for Next Phase:** **Phase 6 — Administration Experience (`07_ADMIN_EXPERIENCE.md`)**.
