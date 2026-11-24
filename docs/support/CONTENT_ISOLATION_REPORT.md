# SAMYAK GURU — ACADEMIC CONTENT ISOLATION & DATA BOUNDARY REPORT
**Branch**: `support/security-and-qa` | **Baseline**: `ba03495bfae4b05d64ca656234f708768c488eb0`
**Auditor**: Independent QA Specialist & Curriculum Data Auditor
**Classification**: `EVIDENCE-BASED VERIFICATION`

---

## 1. Executive Mandate & Isolation Scope

Educational integrity requires absolute boundary separation between distinct academic streams. A student preparing for the Nepal Medical Education Commission (MEC) Common Entrance Examination (CEE) must never be served Secondary Education Examination (SEE Class 10) questions, IELTS listening prompts, or IOE Engineering mechanics problems.

This audit evaluates the program isolation mechanisms implemented in `src/lib/courses/courseIds.ts`, API endpoint guards, and client rendering hubs.

---

## 2. Program Identification & Aliasing Architecture

### 2.1 The Stored Values Dilemma
Historically, academic course codes were stored inconsistently across legacy database records (e.g., `'cee'`, `'cee_medical'`, `'see'`, `'see_class_10'`, `'digital'`). Naive string equality caused severe data leaks or false empty states.

### 2.2 Canonical Resolution Engine (`src/lib/courses/courseIds.ts`)
```
                          Stored Database Value / Tag
                                       │
                                       ▼
                             parseCourseId(raw)
                                       │
            ┌──────────────────────────┴──────────────────────────┐
            ▼                                                     ▼
      Ambiguous Value?                                Known Canonical Alias?
  ('digital' in AMBIGUOUS)                                        │
            │                                                     │
            ▼                                                     ▼
      Returns NULL                                          Returns Canonical
  (Quarantined for Review)                              ('cee_medical', 'see_class_10')
            │                                                     │
            ▼                                                     ▼
   Zero Cross-Bleeding                                   Exact Course Scope
```

### 2.3 Strict Value Mapping Table

| Academic Stream | Canonical ID | Recognized Aliases | Stored Disambiguation Rule |
| :--- | :--- | :--- | :--- |
| **CEE Medical Entrance** | `cee_medical` | `cee_medical`, `cee` | Matches CEE syllabus exclusively |
| **SEE Class 10** | `see_class_10` | `see_class_10`, `see` | Excludes all high-school/college items |
| **IELTS Preparation** | `ielts` | `ielts`, `english` | Separated from medical vocabulary |
| **IOE Engineering** | `ioe_engineering`| `ioe_engineering`, `ioe`, `engineering` | Excludes biology; includes calculus |
| **NEB Class 11 / 12** | `neb_class_11` / `12`| `class11`, `class12` | Board exam scope |
| **Digital Skills (Legacy)**| Quarantined | `digital` | **QUARANTINED** (`AMBIGUOUS_PROGRAM_VALUES`) |

---

## 3. Curriculum Endpoint Isolation (`/api/cee/curriculum`)

Testing verified in `src/lib/security/__tests__/contentIsolationAndSecurityAudit.test.ts`:
1. **Valid CEE Query (`?program=cee`)**:
   - Returns HTTP 200 OK with verified syllabus hierarchy (Zoology, Botany, Chemistry, Physics, MAT).
2. **Cross-Program Rejection (`?program=see` or `?program=ielts`)**:
   - Returns HTTP 403 Forbidden with error code `CROSS_PROGRAM_ISOLATION_VIOLATION`.
   - Payload:
     ```json
     {
       "error": {
         "code": "CROSS_PROGRAM_ISOLATION_VIOLATION",
         "message": "CEE Visual Intelligence curriculum is strictly isolated. Program 'see' is not authorized."
       }
     }
     ```
3. **Canonical Lesson Slug Guard (`/learn/visual/[slug]`)**:
   - Canonical slugs (`human-heart`, `nephron`, `gas-exchange`) render the respective 3D/2D players.
   - Any unapproved or unauthorized lesson slug (e.g., `/learn/visual/fake-lesson-test`) triggers a strict Next.js `notFound()` (HTTP 404), ensuring zero unverified draft leaks (`CEE-004`).

---

## 4. Empty State Verification & Zero Fabricated Content Audit

A critical mandate of the Samyak Guru architecture is **Zero Synthetic Dummy Data**:
- **Topic Inventory**: Topics without approved animations (e.g., `Protozoa`, `Atomic Orbitals`) truthfully display `publishedLessonsCount: 0`.
- **Question Banks**: Untested mock question generators are prohibited. Fallback banks only serve curriculum-verified questions with citations to Nepal MEC past exam patterns.
- **Teacher Profiles**: No fake or AI-generated instructor cards exist in the user-facing curriculum view.

---

## 5. Course Entitlements & Subscription Isolation Matrix

| Subscription Tier | CEE 3D Visual Player | SEE Video Lessons | IOE Mock Tests | Live Doubt Solver |
| :--- | :--- | :--- | :--- | :--- |
| `student_free` | Canonical Pilots Only | Free Previews Only | Free Previews Only | Standard Queue |
| `student_paid_see` | Preview Only | Full Access | No Access | High Priority |
| `student_paid_cee` | **Full Unrestricted** | No Access | No Access | High Priority |
| `student_all_access`| **Full Unrestricted** | **Full Access** | **Full Access** | VIP Instant Queue |

Empirical tests in `src/lib/auth/__tests__/subscriptionEntitlementsMatrix.test.ts` pass with 100% compliance.
