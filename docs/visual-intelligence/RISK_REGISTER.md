# Samyak Guru — CEE Visual Intelligence: Risk Register (AUD-006)

**Assessment Date**: November 23, 2026  
**Review Cycle**: Sprint Inception & Discovery Phase

---

## 1. Risk Matrix

| Risk ID | Risk Description | Category | Likelihood | Impact | Severity | Mitigation Strategy | Owner |
|---|---|---|---|---|---|---|---|
| **RSK-001** | Destructive migration drops or alters existing live course/student data | Data Integrity | Low | Critical | **HIGH** | Strict policy: additive migrations only (`cee_*` namespace); foreign keys use `ON DELETE RESTRICT`; dry-run required. | Lead Architect |
| **RSK-002** | Cross-program content leakage (e.g. CEE biology appears in IELTS dashboard) | Program Isolation | Medium | High | **HIGH** | Server-side program scoping on all queries; explicit mapping tables; reject generic fallback queries. | Backend Lead |
| **RSK-003** | WebGL crash / context loss on low-end mobile devices | Performance / UX | High | Medium | **MEDIUM** | Built-in WebGL context recovery + automatic failover to 100% accessible static diagram mode. | Graphics Lead |
| **RSK-004** | Draft/unapproved medical content inadvertently exposed to students | Academic Quality | Low | Critical | **HIGH** | Student routes query only active immutable publication snapshots (`cee_publications`); drafts return 404. | Full-Stack Lead |
| **RSK-005** | Malicious file upload / decompression bomb in 3D assets | Security | Medium | High | **HIGH** | Strict 50MB file size ceiling, MIME validation, magic-byte inspection, quarantine isolation before publication. | Security Lead |
| **RSK-006** | Student client manipulates progress completion payload (`completed: true`) | Academic Fraud | Medium | High | **HIGH** | Server evaluates completion based on received objective events and server-graded quiz scores; ignore client boolean. | Backend Lead |
| **RSK-007** | Font build failure or network timeout during CI deployment | DevOps | Low | High | **LOW** (Mitigated) | Decoupled font loading from build-time network in `layout.tsx` via CSS `@import` and static font variables. | DevOps Lead |
| **RSK-008** | Incomplete 3D model assets for all syllabus topics at launch | Content Velocity | High | Medium | **MEDIUM** | Progressive enhancement: 2D biological simulation engine and high-res diagram fallbacks deployed immediately. | Academic Lead |

---

## 2. Rollback & Disaster Recovery Protocol

1. **Database Rollback**:
   - Every additive migration has a corresponding rollback script that safely drops only `cee_*` tables if aborted before publication.
   - Live user accounts, payments, and CBT test attempts are strictly insulated.
2. **Feature Flag Rollback**:
   - `NEXT_PUBLIC_ENABLE_CEE_VISUAL_INTELLIGENCE`: Environment flag to instantly disable student-facing visual routes in under 5 seconds without requiring code redeployment.
