# SAMYAK GURU — PRODUCTION DEPLOYMENT READINESS & RELEASE CHECKLIST
**Branch**: `support/security-and-qa` | **Baseline**: `ba03495bfae4b05d64ca656234f708768c488eb0`
**Auditor**: Independent DevOps & Reliability Specialist
**Classification**: `EVIDENCE-BASED VERIFICATION`

---

## 1. Production Release Readiness Overview

This report provides the formal pre-deployment checklist, infrastructure prerequisites, environment variable dictionary, and rollback strategies required for a zero-downtime production deployment of the Samyak Guru CEE platform.

---

## 2. Production Environment Variable Verification Matrix

| Environment Variable | Required Tier | Purpose / Scope | Safety Validation | Status |
| :--- | :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Public / Client | Supabase Project Host URL | Must be HTTPS; whitelisted in CSP | `VERIFIED` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public / Client | PostgREST public client key | Read-only / RLS restricted | `VERIFIED` |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secret / Server** | Privileged administrative DB client | **Zero client exposure** | `VERIFIED` |
| `ADMIN_ACCESS_KEY` | **Secret / Server** | Secret admin entrance token (`/admin-<KEY>`) | High-entropy string required | `VERIFIED` |
| `NEXT_PUBLIC_SITE_URL` | Public / Client | Canonical domain for auth redirects | Set to `https://samyakcee.com` | `VERIFIED` |
| `FONEPAY_MERCHANT_CODE` | Server Only | Nepal Fonepay merchant identifier | Required for live transactions | `VERIFIED` |
| `FONEPAY_SECRET_KEY` | **Secret / Server** | HMAC-SHA512 transaction secret | Required for signature audit | `VERIFIED` |
| `UPSTASH_REDIS_REST_URL` | Server Only | Distributed rate limit store | In-memory fallback available | `VERIFIED` |
| `UPSTASH_REDIS_REST_TOKEN` | **Secret / Server** | Upstash Redis authentication token | In-memory fallback available | `VERIFIED` |
| `AAKASH_SMS_AUTH_TOKEN` | **Secret / Server** | Nepal OTP & SMS dispatch token | Required for phone verification | `VERIFIED` |
| `NEXT_PUBLIC_STRICT_COURSE_ISOLATION` | Optional Flag | Forces strict `program_type` matching | Default `off` for transition | `VERIFIED` |

---

## 3. Database Migration Deployment Order

Before routing live traffic to the newly deployed application version, the following database migrations must be applied in strict chronological sequence:

1. **Baseline Migrations**: All initial user profile, course structure, and order schema tables.
2. **CEE Visual Subsystem Migration (`supabase/migrations/20261124000001_cee_audit_and_reviews.sql`)**:
   - Creates `cee_audit_logs` table with composite indexes on `(lesson_id, created_at)` and `(action, created_at)`.
   - Enables Row Level Security (`ALTER TABLE cee_audit_logs ENABLE ROW LEVEL SECURITY`).
   - Applies admin read policy and service-role write policy.

---

## 4. Netlify / Edge Hosting Configuration Checklist

- [x] **Node.js Runtime**: Set to Node.js 20.x LTS or higher.
- [x] **Next.js Output Tracing**: `outputFileTracingRoot` pinned to monorepo root in `next.config.mjs`.
- [x] **Security Headers**: Production CSP, HSTS, X-Frame-Options, and Referrer-Policy verified active on production builds.
- [x] **Build Source Maps**: `productionBrowserSourceMaps: false` active to prevent proprietary code leakage.
- [x] **Health Check Route**: `GET /api/health` returns HTTP 200 with database connectivity status.

---

## 5. Rollback & Disaster Recovery Runbook

In the unlikely event of an edge crash or unexpected production regression:

```
                  Incident Detected (5xx Spikes / Client Errors)
                                         │
                         ┌───────────────┴───────────────┐
                         ▼                               ▼
               Application Code Issue           Database Schema Issue
                         │                               │
                         ▼                               ▼
                 Instant Rollback:               Point-In-Time Restore:
             Revert Git commit to baseline    Execute Supabase backup recovery
            `ba03495bfae4b05d64ca6562...`     to pre-deployment timestamp.
                         │                               │
                         └───────────────┬───────────────┘
                                         ▼
                             Verify Health Endpoint:
                              `GET /api/health` 200
```

- **Rollback Commit**: `ba03495bfae4b05d64ca656234f708768c488eb0` (tagged as stable baseline on branch `recovery/production-nov12`).
- **Data Safety**: All CEE Visual Studio schemas are additive. No columns or tables were dropped or modified destructively.
