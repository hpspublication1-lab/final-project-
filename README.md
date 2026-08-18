# v2 — Hardened Digital & AI Academy + English/IELTS Backend

Supersedes the v1 route files from the previous message. Keep the two v1
**migrations** (they create the base tables); **replace** the v1 route
files with these.

## What "more advanced" actually meant here

Two things in v1 were not just unfinished, they were wrong:

1. **Auth was spoofable.** Every route read `x-user-id` from a request
   header. Anyone could set that header and act as any user. Now
   `lib/supabase/route-auth.ts` reads the real cookie session via
   `@supabase/ssr` and `supabase.auth.getUser()` — matching how
   `/api/subjective/evaluate` already does it per the audit.

2. **Progress was client-declared.** The client sent
   `percent_complete`, so a student could POST 100% and claim a
   certificate without doing anything. Now the client marks one module
   done and a Postgres trigger recomputes the percentage. The number
   can't be written from outside the database at all — the INSERT/UPDATE
   RLS policy on `digital_track_progress` was dropped.

Then the depth upgrades:

- **Prompt playground now grades the prompt, not just runs it.** v1
  returned the model's answer, which teaches nothing in a
  prompt-engineering course. It now scores the student's prompt on
  clarity, specificity, context, and constraints, returns a rewritten
  version, and stores the history so they can watch their scores climb.
  Grading runs in parallel with the answer and fails soft — a grading
  error never blocks the output.
- **English scoring uses real IELTS criteria per task type**, pulled
  from `english_task_types` rather than a generic "score this" prompt.
  Writing Task 1 and Task 2 have genuinely different rubrics. Each
  result reports the weakest criterion, the delta against their recent
  average, and — across attempts — the criterion that drags them down
  most often.
- **Certificates are real.** `issue_digital_certificate()` is
  `SECURITY DEFINER` and raises below 100% completion, so the rule holds
  regardless of which surface calls it. Plus a public
  `/api/verify/[code]` endpoint that needs no login (an employer
  scanning a QR won't have an account) and returns only name, track, and
  date — no email, phone, or user id.
- **Shared AI layer** (`lib/ai/completion.ts`): retry with backoff on
  5xx, no retry on 429, and response-shape normalization that handles
  `message` / `content` / Anthropic blocks / OpenAI choices. JSON parsing
  falls back to extracting the outermost balanced object when a model
  wraps its output in prose.
- **Zod validation and one error taxonomy** across every route, so the
  frontend branches on status codes instead of matching error strings.
  v1 had no validation — an oversized prompt went straight to a paid
  model call.

## Files

```
supabase/migrations/20260812_digital_english_v2_hardening.sql
lib/supabase/route-auth.ts          real session auth + admin client
lib/ai/completion.ts                 quota, retry, shape normalization, JSON repair
lib/validation/schemas.ts            zod schemas + error mapper
app/api/digital/prompt-playground/route.ts   REPLACES v1
app/api/digital/progress/route.ts             REPLACES v1
app/api/digital/certificate/route.ts          new
app/api/verify/[code]/route.ts                new, public
app/api/english/practice/route.ts             REPLACES v1
```

`app/api/digital/tracks/route.ts` and
`app/api/digital/submissions/route.ts` from v1 still stand — though
`submissions` should be updated to use `requireUser()` instead of its
header stub.

## Before running

- `npm i zod` if it isn't already a dependency.
- Run the v2 migration **after** the two v1 migrations.
- Confirm `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set (the SSR client needs
  the anon key, not the service-role key).

## Still unverified — one thing, now isolated

The `check_and_increment_ai_usage` signature (`p_user_id`, boolean
return) and the `/api/ai/chat-completion` contract are still inferred
from the audit's description rather than read from the real files. The
difference from v1: both assumptions now live in **one file**
(`lib/ai/completion.ts`), so if either is wrong it's a single fix, not a
change in five routes. The shape normalizer also means a wrong guess
about the response format degrades gracefully instead of rendering
`[object Object]`.

## What's still open

- `/courses` is still a hardcoded `COURSES_DATA` array.
- Speaking practice grades text only — no audio pipeline yet.
- No certificate PDF/image generation; the verify endpoint exists but
  nothing renders a shareable certificate.
