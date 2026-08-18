# 🚀 Samyak CEE Mastery — Production Deployment Guide

Complete, from-scratch guide to take this app live on your own domain.

## Architecture (what runs where)

| Layer | Service | Purpose |
|---|---|---|
| **Web app** (Next.js 15) | **Netlify** | Serves the site, API routes, SSR, middleware |
| **Database + Auth + Realtime + Storage** | **Supabase** | Postgres DB, email-OTP login, live updates |
| **Domain / DNS** | **Cloudflare** | Your domain, pointed at Netlify |
| **AI** | **OpenAI** | AI Tutor, MCQ + flashcard generation |
| **Payments** | **Fonepay** | Dynamic-QR payments (only method) |
| **Video / Live** | **Bunny.net** (optional) | Live class streaming + recordings |

> ⚠️ Supabase is the **backend/database**, not the web host. The Next.js app itself is hosted on **Netlify** (this repo already has `netlify.toml`). Your **Cloudflare** domain is pointed at Netlify via DNS.

---

## Prerequisites

- The code pushed to a **GitHub** repo (Netlify deploys from GitHub).
- Accounts: **Supabase**, **Netlify**, **Cloudflare** (with your domain), **OpenAI**, **Fonepay merchant** (and optionally **Bunny.net**).
- Node.js **20+** locally (matches `engines` + Netlify build).

---

## STEP 1 — Supabase (database & auth)

You already have a Supabase project (`zqkmrrckuvabtdfyrymw`). You can **reuse it for production** (it holds your 268 questions, flashcards, users, etc.). Use a brand-new project only if you want a clean separate prod DB — if so, run every file in `supabase/migrations/` first.

### 1a. Apply the database fixes
This project's live DB diverged from the repo migrations, so a set of idempotent fix scripts bring it fully in sync. In **Supabase Dashboard → SQL Editor**, run each of these once (safe to re-run):

1. `FIX-AUTH-RLS.sql` — fixes the RLS infinite-recursion (auth/profile reads & writes).
2. `FIX-PAYMENTS.sql` — `payment_transactions` table (Fonepay).
3. `FIX-PROGRESS-TABLES.sql` — `exam_attempts`, `practice_attempts`, `topic_mastery` (+ auto-mastery trigger).
4. `FIX-FLASHCARDS-DOUBTS.sql` — `flashcards`, `flashcard_reviews`, `doubts`, `doubt_replies`.
5. `FIX-BATCHES.sql` — `batches`, `batch_enrollments`, links + the shared `update_updated_at_column()` helper.

Each should end with **“Success.”** (Most are already applied to the existing project — re-running is harmless.)

### 1b. Configure Auth (email OTP)
Login is **passwordless email OTP** — this only works if the email template sends a **code**, not a magic link:

- **Authentication → Email Templates → Magic Link**: ensure the body contains `{{ .Token }}` (the 6-digit code). If it only has `{{ .ConfirmationURL }}`, students get a link instead of a code and login breaks.
- **Authentication → URL Configuration**:
  - **Site URL** → `https://YOUR-DOMAIN` (your real domain).
  - **Redirect URLs** → add `https://YOUR-DOMAIN/**` (and keep `http://localhost:4028/**` for local dev).

### 1c. Grab your keys (Settings → API)
- `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (**secret — server only, never `NEXT_PUBLIC_`**)

---

## STEP 2 — Environment variables

Set these in **Netlify → Site settings → Environment variables** (see full list in `.env.example`). Minimum required to run:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...            # public
SUPABASE_SERVICE_ROLE_KEY=eyJ...                # SECRET

# Site (MUST be your real domain in prod)
NEXT_PUBLIC_SITE_URL=https://YOUR-DOMAIN

# AI (server only)
OPENAI_API_KEY=sk-proj-...

# Fonepay (server only) — use PRODUCTION merchant credentials
FONEPAY_MERCHANT_CODE=...
FONEPAY_USERNAME=...
FONEPAY_PASSWORD=...
FONEPAY_SECRET_KEY=...
FONEPAY_ENV=production

# Admin panel secret entrance (server only) — set a NEW long random value for prod
ADMIN_ACCESS_KEY=<generate: openssl rand -hex 16>

# Optional: Bunny.net video/live, analytics
# BUNNY_TOKEN_KEY=...
# NEXT_PUBLIC_GA_MEASUREMENT_ID=...
# NEXT_PUBLIC_MIXPANEL_TOKEN=...
```

**Rules:**
- `NEXT_PUBLIC_*` = safe to expose to the browser. Everything else is **server-only** — never prefix a secret with `NEXT_PUBLIC_`.
- Generate a **fresh** `ADMIN_ACCESS_KEY` for production (don't reuse the dev one). The admin panel is reached only at `https://YOUR-DOMAIN/admin-<ADMIN_ACCESS_KEY>`.

---

## STEP 3 — Deploy the app to Netlify

1. **Netlify → Add new site → Import from Git** → pick your GitHub repo.
2. Build settings (auto-detected from `netlify.toml`):
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Plugin: `@netlify/plugin-nextjs` (already declared)
   - Node version: `20` (already declared)
3. Add all **Step 2 environment variables**.
4. **Deploy site.** First build takes a few minutes.
5. You'll get a temporary URL like `your-site.netlify.app` — verify it loads before wiring the domain.

> Alternative host: **Vercel** works too (it's Next.js-native). Import the repo, add the same env vars, deploy. If you use Vercel, you can delete `netlify.toml`.

---

## STEP 4 — Point your Cloudflare domain at Netlify

1. In **Netlify → Domain management → Add a domain** → enter `YOUR-DOMAIN`.
2. Netlify shows the target records. In **Cloudflare → DNS**, add:
   - **Apex** (`yourdomain.com`): `CNAME` (Cloudflare flattens it) or `A` → to Netlify's load balancer `75.2.60.5`.
   - **www**: `CNAME` → `your-site.netlify.app`.
   - Set Cloudflare proxy to **DNS only (grey cloud)** initially so Netlify can issue the SSL cert; you can enable the orange proxy afterwards.
3. Wait for DNS to propagate; Netlify auto-provisions HTTPS (Let's Encrypt).
4. In Cloudflare **SSL/TLS → set mode to "Full (strict)"** to avoid redirect loops.

---

## STEP 5 — Post-deploy configuration (critical)

Once the domain is live, go back and set the real domain everywhere:

1. **Netlify env** `NEXT_PUBLIC_SITE_URL=https://YOUR-DOMAIN` → then **redeploy** (env changes need a rebuild).
2. **Supabase → Auth → URL Configuration**: Site URL + Redirect URLs use `https://YOUR-DOMAIN` (Step 1b).
3. **Fonepay**: confirm you're using **production** merchant credentials and `FONEPAY_ENV=production`, and register your live domain/callback with Fonepay if they require it.
4. **Bunny.net** (if used): create your live stream, paste its HLS URL into `/admin/live-classes`.

---

## STEP 6 — Go-live verification checklist

Visit `https://YOUR-DOMAIN` and confirm:

- [ ] Homepage loads; **Pricing** shows Fonepay.
- [ ] **Sign up / login** works — you receive a **6-digit code** by email (not a link).
- [ ] New user → onboarding → dashboard.
- [ ] **Practice** loads real questions; a correct answer scores **correct**.
- [ ] **AI Tutor** streams a live response.
- [ ] **Checkout** shows a real Fonepay QR; a test payment activates the plan and lands on `/payment-success`.
- [ ] **Prebook** flow works and confirms.
- [ ] **Admin**: `https://YOUR-DOMAIN/admin-<ADMIN_ACCESS_KEY>` opens ONLY when logged in as the super admin (`surajgaming02@gmail.com`); everyone else is bounced.
- [ ] Free users see the **Pro** locks; paid/prebook users get full access.

---

## Security notes (already configured)

- Strict **CSP** + HSTS + security headers (`next.config.mjs`).
- Admin panel is **hidden** (secret URL) and gated to the super-admin allowlist (`src/lib/config/superAdmin.ts`).
- All privileged writes go through server routes with the **service-role** key (never exposed to the browser).
- RLS enforces per-user data isolation.
- **Never commit** `.env.local` (it's git-ignored). Rotate any key that leaks.

## Maintenance

- **Add questions**: Admin → Questions → *Generate with AI*, or the bulk generator.
- **Add flashcards / live classes / batches**: their respective admin tabs.
- **Change the admin secret**: update `ADMIN_ACCESS_KEY` in Netlify env → redeploy.
- **Add a super admin**: edit `SUPER_ADMINS` in `src/lib/config/superAdmin.ts` → redeploy.
- **Local dev**: `npm install` → copy `.env.example` to `.env.local` and fill values → `npm run dev` (port 4028).
