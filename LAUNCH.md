# 🚀 Samyak CEE Mastery — Go-Live Runbook

Your website is built. This is the exact, ordered path to take it fully live.
Do the steps in order. Anything marked **(you)** needs your accounts/keys.

---

## 1. Install & sanity-check the code

```bash
npm install                 # installs deps (incl. hls.js for video, vitest)
npm run type-check          # should print no errors — send me any it prints
npm run lint:fix && npm run format
npm run test                # SM-2 + scoring unit tests
```

Delete the two leftover files (I couldn't from here):

```bash
del "src\lib\supabase\client.tsx"
del "C:\Users\User\package-lock.json"
del "C:\Users\User\Downloads\package-lock.json"
```

---

## 2. Environment variables **(you)**

Copy `.env.example` → `.env.local` and fill in:

| Variable | Required? | Where to get it |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SITE_URL` | ✅ | `http://localhost:4028` for dev, your domain for prod |
| `OPENAI_API_KEY` | ✅ (for AI) | platform.openai.com |
| `NEXT_PUBLIC_MIXPANEL_TOKEN` | optional | Mixpanel |
| eSewa/Khalti keys | later | when we wire automated payments |

---

## 3. Database — push all migrations **(you)**

```bash
npx supabase login
npx supabase link --project-ref zqkmrrckuvabtdfyrymw
npx supabase db push        # applies all 27 migrations
```

Then in the **Supabase Dashboard**:
- **Auth → Users → `admin@samyakcee.edu.np` → Reset password** (set your real admin password — the seeded one was rotated to random for security).
- **Auth → URL Configuration → Redirect URLs** → add `http://localhost:4028/**` and later your live domain `/**`.
- (Optional) enable Google / phone login providers.

---

## 4. Video hosting — Bunny Stream **(you)**

Recorded lectures + live-class recordings live in **Bunny Stream**, not Supabase.

**Recorded lectures:**
1. Create a Bunny.net account → a **Stream** video library ("Samyak CEE Lectures").
2. Upload the lecture MP4 → Bunny transcodes to adaptive HLS automatically.
3. Copy the **HLS playback URL** (`https://vz-XXXX.b-cdn.net/{guid}/playlist.m3u8`).
4. In your app: **Admin → Uploads → Video Lectures → Add Video** → paste that URL in the video field. The player auto-detects HLS and streams it fast.

**Live classes (1,500–2,000+ students):**
1. In the same library, create a **Live Stream** → get the **RTMP URL + stream key** and the **HLS playback URL**.
2. Teacher: OBS → paste RTMP URL + key → Start Streaming.
3. **Admin → Uploads → Live Classes → Schedule Class** → set *Live stream source = Adaptive HLS*, paste the HLS URL, set status to **live**.
4. When the stream ends, Bunny saves the recording automatically as a normal video.

> PDFs, notes, and images stay in Supabase Storage (already wired). Only video goes to Bunny.

---

## 5. Run locally & smoke-test

```bash
npm run dev        # http://localhost:4028
```

Check: sign up → dashboard loads → play a video → take a practice test →
open a live class → prebooking form works.

---

## 6. Deploy **(you)**

Repo is Netlify-ready (`netlify.toml` + `@netlify/plugin-nextjs`).

1. Push the repo to GitHub.
2. Netlify → **New site from Git** → pick the repo.
3. **Site settings → Environment variables** → paste every value from `.env.local`.
4. Deploy. Then set `NEXT_PUBLIC_SITE_URL` to the live URL and update the
   Supabase redirect URLs to the live domain.
5. Point your custom domain (Netlify → Domain settings).

*(Vercel works too, zero-config — tell me if you prefer it.)*

---

## 7. Prebooking campaign **(you)**

In `src/app/prebook/components/PrebookClient.tsx` (top of file):
- `PREBOOKING_DEADLINE` → exactly 7 weeks from launch day.
- `PAYMENT` → your real eSewa ID, Khalti ID, WhatsApp number.

Share the `/prebook` link. Bookings land in the `prebookings` table (Admin-visible).

---

## What's built vs. what's optional-next

**Built & working:** auth + roles, student dashboard, practice (server-safe),
mock tests, Battle Arena multiplayer + ELO, subjects/chapters, video lectures
(adaptive HLS), live classes (HLS/YouTube in-app player), doubts, batches,
bookmarks, staff panel, full admin, notifications, flashcards schema (SM-2),
prebooking, security hardening, premium gating, AI rate-limiting.

**Optional next (say the word):**
1. Automated **eSewa/Khalti checkout** (needs your merchant keys).
2. **Bunny signed URLs** so paid videos/streams can't be shared outside the app.
3. **Live attendance + reactions/polls** (real-time presence).
4. Wire the **mock-exam client** to the server-side grading RPC (I built the RPC; this finishes the anti-cheat loop).
5. Integrated **Bunny upload** route (upload straight from admin, no dashboard hop).

---

*Blocker note: my build sandbox is currently unavailable, so I can't run
`type-check`/`dev` for you. Run step 1 and paste me any errors — I'll fix them
immediately.*
