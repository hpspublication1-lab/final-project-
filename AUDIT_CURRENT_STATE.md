# Comprehensive Codebase Audit: Current State

> **Document Purpose**: Technical reference for backend architecture planning.
> **Date**: August 11, 2026
> **Scope**: 100% of routes, pages, API handlers, database schemas, auth mechanisms, entitlement logic, and sector definitions across the repository.

---

## 1. Program & Sector Slugs

The application operates as a multi-sector eLearning platform. As defined in `src/contexts/ProgramContext.tsx` (lines 5–60):

```typescript
export type ProgramType = 'cee' | 'see' | 'english' | 'digital';
```

The 4 exact internal program/sector keys used throughout the codebase are:

1. **`'cee'`**: CEE Medical Entrance Exam (Physics, Chemistry, Biology, MAT).
2. **`'see'`**: SEE Class 10 Board Exam (Compulsory Science, Mathematics, Opt Math, English, Social).
3. **`'english'`**: English & IELTS Learning (Grammar, Vocabulary, Speaking, Writing).
4. **`'digital'`**: Digital Skills & AI Academy (Prompt Engineering, Web Development, Automation, Data).

---

## 2. Complete Page & Route Audit

### Sector 1: CEE Medical Entrance (`program = 'cee'`)
- **Route**: `/` (with `cee` active in `ProgramContext`), `/subjects`, `/practice`
- **File Paths**:
  - `src/app/page.tsx`
  - `src/app/components/HeroSection.tsx`
  - `src/app/components/SubjectsSection.tsx`
- **Wiring Status**: **HYBRID (Dynamic MCQ Pool + DB Subject Queries)**
- **Details & Evidence**:
  - `HeroSection.tsx` switches question pools (`SECTOR_MCQ_POOLS['cee']`) dynamically based on active sector.
  - `SubjectsSection.tsx` fetches active CEE subjects from Supabase `public.subjects` table (`name IN ('biology', 'chemistry', 'physics', 'mental_agility')`). Falls back to client array if empty DB.

---

### Sector 2: SEE Class 10 Board (`program = 'see'`)
- **Route**: `/` (with `see` active), `/practice/subjective`
- **File Paths**:
  - `src/app/practice/subjective/page.tsx`
  - `src/app/practice/subjective/components/SubjectivePageClient.tsx`
  - `src/components/subjective/SubjectivePracticeList.tsx`
  - `src/components/subjective/SubjectiveAnswerEvaluator.tsx`
  - `src/app/api/subjective/questions/route.ts`
  - `src/app/api/subjective/evaluate/route.ts`
- **Wiring Status**: **FULLY WIRED TO DB & AI VISION API**
- **Details & Evidence**:
  - `SubjectivePageClient.tsx` calls `GET /api/subjective/questions?program=see`.
  - `route.ts` queries `subjective_questions` table linked to `subjects` / `chapters`. Includes high-yield fallback question array if DB table is empty.
  - `SubjectiveAnswerEvaluator.tsx` calls `POST /api/subjective/evaluate`.
  - `evaluate/route.ts` authenticates session server-side via `supabase.auth.getUser()`, checks `check_and_increment_ai_usage` RPC, dispatches image/text payload to Gemini/OpenAI vision model, saves evaluation to `subjective_evaluations` table, and returns step marks.

---

### Sector 3: English Learning Mastery (`program = 'english'`)
- **Route**: `/english`
- **File Path**: `src/app/english/page.tsx`
- **Wiring Status**: **STATIC / HARDCODED UI**
- **Details & Evidence**:
  - Page uses local state (`speakingText`, `aiFeedback`, `isSimulating`).
  - `handleSimulatePractice` (lines 45–60) uses a `setTimeout` returning a hardcoded response string:
    ```typescript
    setAiFeedback("Pronunciation Accuracy: 94%\nGrammar: Excellent subject-verb agreement.\nFluency: Slight pause before clause.");
    ```
  - Course cards and IELTS band score widgets are static UI components with no API calls behind them.

---

### Sector 4: Digital & AI Academy (`program = 'digital'`)
- **Route**: `/digital`
- **File Path**: `src/app/digital/page.tsx`
- **Wiring Status**: **STATIC / HARDCODED UI**
- **Details & Evidence**:
  - Page uses local state (`promptInput`, `aiOutput`, `isGenerating`).
  - `handleRunAiDemo` (lines 40–55) uses a `setTimeout` returning a hardcoded completion string:
    ```typescript
    setAiOutput("☕ Fuel Your Day: Artisanal Brews & Daily Fresh Pastries at Coffee House!");
    ```
  - Prompt Engineering and Web Development project modules are hardcoded layout cards.

---

### Practice & Compete Sector

#### 1. MCQ Practice Bank
- **Route**: `/practice`
- **File Paths**:
  - `src/app/practice/page.tsx`
  - `src/app/practice/components/PracticePageClient.tsx`
  - `src/app/practice/actions.ts`
  - `src/app/api/practice/live/route.ts`
- **Wiring Status**: **FULLY WIRED TO SUPABASE DB & LIVE LLM GENERATOR**
- **Details & Evidence**:
  - `fetchPracticeQuestions` in `actions.ts` (lines 20–75) queries Supabase `questions` table joining `subjects` and `chapters`.
  - `savePracticeAttempt` in `actions.ts` (lines 80–140) inserts student results into `practice_attempts` table and updates `topic_mastery`.
  - Live AI Mode invokes `POST /api/practice/live` which calls OpenAI API (`gpt-4o`) to dynamically generate fresh question sets.

#### 2. SEE Subjective Written Practice
- **Route**: `/practice/subjective`
- **File Paths**:
  - `src/app/practice/subjective/page.tsx`
  - `src/app/practice/subjective/components/SubjectivePageClient.tsx`
- **Wiring Status**: **FULLY WIRED TO DB & AI EVALUATION API**

#### 3. Mock Tests
- **Route**: `/mock-tests`
- **File Paths**:
  - `src/app/mock-tests/page.tsx`
  - `src/app/mock-tests/components/MockTestsPageClient.tsx`
- **Wiring Status**: **FULLY WIRED TO SUPABASE DB**
- **Details & Evidence**:
  - Fetches exams from `exams` table (`is_active = true`).
  - Submits attempts to `exam_attempts` table.

#### 4. Battle Arena (Realtime Multiplayer 1v1)
- **Route**: `/battle-arena`
- **File Paths**:
  - `src/app/battle-arena/page.tsx`
  - `src/app/battle-arena/components/BattleArenaPageClient.tsx`
- **Wiring Status**: **FULLY WIRED TO SUPABASE REALTIME & DB**
- **Details & Evidence**:
  - Creates and joins rooms in `battle_rooms` table.
  - Submits round answers to `battle_answers` table.
  - Computes final ELO rating changes and saves to `battle_results` and `user_profiles.battle_rating`.

#### 5. Matchmaking Lobby
- **Route**: `/match-lobby`
- **File Paths**:
  - `src/app/match-lobby/page.tsx`
  - `src/app/match-lobby/components/MatchLobbyClient.tsx`
- **Wiring Status**: **FULLY WIRED TO SUPABASE REALTIME PRESENCE & DB**
- **Details & Evidence**:
  - Inserts player into `matchmaking_queue` table and listens to Realtime changes on `battle_rooms`.

#### 6. Post Match Summary
- **Route**: `/post-match-summary`
- **File Paths**:
  - `src/app/post-match-summary/page.tsx`
  - `src/app/post-match-summary/components/PostMatchSummaryClient.tsx`
- **Wiring Status**: **FULLY WIRED TO SUPABASE DB**
- **Details & Evidence**:
  - Queries `battle_results` and `battle_answers` by `roomId`.

#### 7. Leaderboard
- **Route**: `/leaderboard`
- **File Paths**:
  - `src/app/leaderboard/page.tsx`
  - `src/app/leaderboard/components/LeaderboardClient.tsx`
- **Wiring Status**: **FULLY WIRED TO SUPABASE DB**
- **Details & Evidence**:
  - Queries `user_profiles` ordered by `battle_rating` DESC / `total_points` DESC, and reads `leaderboard_snapshots`.

---

### Study Sector

#### 1. Batches & Cohorts
- **Route**: `/batches`, `/batches/[slug]`
- **File Paths**:
  - `src/app/batches/page.tsx` -> `BatchesPageClient.tsx`
  - `src/app/batches/[slug]/page.tsx` -> `BatchDetailClient.tsx`
- **Wiring Status**: **PARTIALLY WIRED TO DB (Queries `batches` table, falls back to static cohort list if empty)**
- **Details & Evidence**:
  - `BatchesPageClient.tsx` queries `supabase.from('batches').select('*')`. If table returns 0 rows, displays fallback array of 4 batches (Samyak CEE Target, SEE Toppers, IELTS 8.0, AI Developer).
  - `BatchDetailClient.tsx` queries `batches` by `slug` and handles student enrollment via `batch_enrollments` table.

#### 2. Course Store
- **Route**: `/courses`
- **File Path**: `src/app/courses/page.tsx`
- **Wiring Status**: **STATIC / HARDCODED DATA**
- **Details & Evidence**:
  - Uses `COURSES_DATA` array containing 11 catalog courses. Clicking "Enroll Now" redirects to `/checkout?sku=...`.

#### 3. Subjects & Curriculum Explorer
- **Route**: `/subjects`, `/subjects/[subjectId]/[chapterId]`
- **File Paths**:
  - `src/app/subjects/page.tsx` -> `SubjectsPageClient.tsx`
  - `src/app/subjects/[subjectId]/[chapterId]/page.tsx` -> `ChapterDetailClient.tsx`
- **Wiring Status**: **PARTIALLY WIRED TO DB**
- **Details & Evidence**:
  - `SubjectsPageClient.tsx` queries `subjects` joining `chapters`. Falls back to static subject tree if table empty.
  - `ChapterDetailClient.tsx` queries `chapters`, `notes`, `video_lectures`, and `questions` from Supabase.

#### 4. Flashcards & SRS Spaced Repetition
- **Route**: `/flashcards`
- **File Paths**:
  - `src/app/flashcards/page.tsx` -> `FlashcardsClient.tsx`
- **Wiring Status**: **FULLY WIRED TO SUPABASE DB**
- **Details & Evidence**:
  - Queries `flashcards` table and saves user review attempts (`quality`, `interval`, `ease_factor`) to `flashcard_reviews` table.

#### 5. Live Classes
- **Route**: `/live-classes`
- **File Paths**:
  - `src/app/live-classes/page.tsx` -> `LiveClassesClient.tsx`
  - `src/components/HMSLiveRoom.tsx`
- **Wiring Status**: **FULLY WIRED TO DB & 100ms API**
- **Details & Evidence**:
  - Queries `live_classes` table for scheduled streams and calls `/api/100ms/token` to fetch SDK room tokens.

#### 6. Lecture Videos
- **Route**: `/lecture-videos`
- **File Paths**:
  - `src/app/lecture-videos/page.tsx` -> `LectureVideosClient.tsx`
- **Wiring Status**: **FULLY WIRED TO SUPABASE DB & BUNNY STREAM API**
- **Details & Evidence**:
  - Queries `video_lectures` table and updates `video_watch_progress` table. Calls `/api/video/sign` for signed Bunny CDN playback URLs.

#### 7. App Info Page
- **Route**: `/app-feature`
- **File Path**: `src/app/app-feature/page.tsx`
- **Wiring Status**: **STATIC MARKETING PAGE**

---

### AI Tools

#### 1. AI Tutor
- **Route**: `/ai-tutor`
- **File Paths**:
  - `src/app/ai-tutor/page.tsx` -> `AiTutorClient.tsx`
  - `src/app/api/ai/chat-completion/route.ts`
- **Wiring Status**: **FULLY WIRED TO REAL LLM API & SUPABASE RATE LIMITER**
- **Details & Evidence**:
  - Dispatches message payload to `/api/ai/chat-completion`.
  - Route enforces rate limits via `check_and_increment_ai_usage` RPC and dispatches to `@rocketnew/llm-sdk` (using `OPENAI_API_KEY`, `GEMINI_API_KEY`, `ANTHROPIC_API_KEY`).

#### 2. AI MCQ Generator
- **Route**: `/mcq-generator`
- **File Paths**:
  - `src/app/mcq-generator/page.tsx` -> `McqGeneratorClient.tsx`
  - `src/app/api/admin/generate-questions/route.ts`
- **Wiring Status**: **FULLY WIRED TO REAL LLM API**

#### 3. Mistake Analyser
- **Route**: `/mistake-analyser`
- **File Paths**:
  - `src/app/mistake-analyser/page.tsx` -> `MistakeAnalyserClient.tsx`
- **Wiring Status**: **FULLY WIRED TO SUPABASE DB & LLM API**
- **Details & Evidence**:
  - Queries incorrect answers from `practice_attempts` (`is_correct = false`) and sends error context to `/api/ai/chat-completion` for diagnostic breakdown.

#### 4. Study Plan AI
- **Route**: `/study-plan`
- **File Paths**:
  - `src/app/study-plan/page.tsx` -> `StudyPlanAiClient.tsx`
- **Wiring Status**: **FULLY WIRED TO REAL LLM API**

---

### Core Student Dashboard & User Features

#### 1. Student Dashboard
- **Route**: `/student-dashboard`
- **File Paths**:
  - `src/app/student-dashboard/page.tsx` -> `DashboardPageClient.tsx`
  - `src/app/api/profile/me/route.ts`
- **Wiring Status**: **FULLY WIRED TO SUPABASE DB**
- **Details & Evidence**:
  - Calls `GET /api/profile/me` (reads `user_profiles` using service-role client).
  - Queries `exam_attempts`, `practice_attempts`, `topic_mastery` to calculate total study hours, streak, accuracy, and subject mastery rings.

#### 2. Bookmarks
- **Route**: `/bookmarks`
- **File Paths**:
  - `src/app/bookmarks/page.tsx` -> `BookmarksPageClient.tsx`
- **Wiring Status**: **FULLY WIRED TO SUPABASE DB**
- **Details & Evidence**:
  - Queries `bookmarks` joining `questions`.

#### 3. Doubts Forum
- **Route**: `/doubts`
- **File Paths**:
  - `src/app/doubts/page.tsx` -> `DoubtsPageClient.tsx`
- **Wiring Status**: **FULLY WIRED TO SUPABASE DB**
- **Details & Evidence**:
  - Queries `doubts` and `doubt_replies` tables.

#### 4. Account Settings
- **Route**: `/account`
- **File Paths**:
  - `src/app/account/page.tsx` -> `AccountManagementClient.tsx`
- **Wiring Status**: **FULLY WIRED TO SUPABASE DB**
- **Details & Evidence**:
  - Updates `user_profiles` table (`full_name`, `phone`, `college`, `cee_year`, `avatar_url`).

#### 5. Onboarding
- **Route**: `/onboarding`
- **File Paths**:
  - `src/app/onboarding/page.tsx` -> `OnboardingClient.tsx`
  - `src/app/api/profile/complete/route.ts`
- **Wiring Status**: **FULLY WIRED TO SUPABASE DB**
- **Details & Evidence**:
  - Calls `POST /api/profile/complete` to finalize target exam sector and profile details in `user_profiles`.

---

### Public Landing & Auth Flow

#### 1. Main Homepage
- **Route**: `/`
- **File Paths**: `src/app/page.tsx` -> `HomepageClient.tsx`
- **Wiring Status**: **HYBRID (Client State + Session Check)**
- **Details & Evidence**:
  - Calls `/api/profile/me` to determine user header auth state.

#### 2. Sign In / Sign Up Screen
- **Route**: `/sign-up-login-screen`
- **File Paths**:
  - `src/app/sign-up-login-screen/page.tsx` -> `AuthPageClient.tsx`
  - `src/contexts/AuthContext.tsx`
- **Wiring Status**: **FULLY WIRED TO SUPABASE AUTH & DB**

#### 3. Auth Callback
- **Route**: `/auth/callback`
- **File Path**: `src/app/auth/callback/route.ts`
- **Wiring Status**: **FULLY WIRED TO SUPABASE AUTH**
- **Details & Evidence**:
  - Calls `supabase.auth.exchangeCodeForSession(code)`.

#### 4. Password Reset
- **Route**: `/reset-password`
- **File Paths**: `src/app/reset-password/page.tsx` -> `ResetPasswordClient.tsx`
- **Wiring Status**: **FULLY WIRED TO SUPABASE AUTH**

---

### Monetization & Payments

#### 1. Fonepay Dynamic QR Checkout
- **Route**: `/checkout`
- **File Paths**:
  - `src/app/checkout/page.tsx` -> `FonepayCheckout.tsx`
  - `src/app/api/payments/fonepay/qr/route.ts`
  - `src/app/api/payments/fonepay/status/route.ts`
- **Wiring Status**: **FULLY WIRED TO FONEPAY GATEWAY & SUPABASE DB**
- **Details & Evidence**:
  - `FonepayCheckout.tsx` calls `POST /api/payments/fonepay/qr` with plan payload (`student` or `pro`).
  - `qr/route.ts` generates a dynamic Fonepay merchant QR payload and inserts transaction into `payment_transactions`.
  - Client polls `GET /api/payments/fonepay/status?prn=...`. Upon payment confirmation from Fonepay server, upgrades `user_profiles.subscription_plan`.

#### 2. Prebook Crash Course
- **Route**: `/prebook`
- **File Paths**:
  - `src/app/prebook/page.tsx` -> `PrebookClient.tsx`
  - `src/app/api/prebook/mine/route.ts`
- **Wiring Status**: **FULLY WIRED TO FONEPAY GATEWAY & SUPABASE DB**
- **Details & Evidence**:
  - `PrebookClient.tsx` calls `POST /api/payments/fonepay/qr` with `sku: 'crash-course'`.
  - Creates prebooking entry in `prebookings` table.

#### 3. Activate Voucher Plan
- **Route**: `/activate-plan`
- **File Paths**:
  - `src/app/activate-plan/page.tsx` -> `ActivatePlanClient.tsx`
- **Wiring Status**: **FULLY WIRED TO SUPABASE DB**
- **Details & Evidence**:
  - Validates voucher string against `activation_codes` table (`is_used = false`) and updates user subscription.

#### 4. Payment Success
- **Route**: `/payment-success`
- **File Paths**: `src/app/payment-success/page.tsx` -> `PaymentSuccessClient.tsx`
- **Wiring Status**: **WIRED TO ROUTER PARAMS & SESSION**

---

### Admin Portal (`/admin/...`)
- **File Paths**:
  - `src/app/admin/components/AdminDashboardClient.tsx`
  - `src/app/admin/users/components/AdminUsersClient.tsx`
  - `src/app/admin/questions/components/AdminQuestionsClient.tsx`
  - `src/app/admin/subjects/components/AdminSubjectsClient.tsx`
  - `src/app/admin/chapters/components/AdminChaptersClient.tsx`
  - `src/app/admin/batches/components/AdminBatchesClient.tsx`
  - `src/app/admin/prebookings/components/AdminPrebookingsClient.tsx`
  - `src/app/admin/doubts/components/AdminDoubtsClient.tsx`
  - `src/app/admin/live-classes/components/AdminLiveClassesClient.tsx`
  - `src/app/admin/flashcards/components/AdminFlashcardsClient.tsx`
  - `src/app/admin/analytics/components/AdminAnalyticsClient.tsx`
  - `src/app/admin/ai-review/components/AiContentReviewClient.tsx`
  - `src/app/admin/uploads/components/AdminUploadsClient.tsx`
- **Wiring Status**: **FULLY WIRED TO SUPABASE DB & ADMIN APIs**
- **Details & Evidence**:
  - Uses `createAdminClient()` (`SUPABASE_SERVICE_ROLE_KEY`) and checks `is_admin = true` / `isSuperAdmin()`.

---

## 3. Authentication & Conversion Flow Deep Dive

### 1. Session Persistence & Authentication Code
- **Mechanism**: Supabase SSR (`@supabase/ssr`) with cookie-based session persistence.
- **Client Auth Hook**: `src/contexts/AuthContext.tsx`
  - Listens to `supabase.auth.onAuthStateChange((event, session) => ...)`
  - Stores access token and refreshes session automatically via middleware (`src/middleware.ts`).
- **Sign In Action**: `AuthPageClient.tsx` calls:
  ```typescript
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  ```
- **Sign Up Action**: Calls `supabase.auth.signUp({ email, password })` and triggers Postgres trigger `on_auth_user_created` to create corresponding `user_profiles` row.
- **Verdict**: Real session creation and persistence is **100% active and working**.

### 2. "Start Free Today" Button Action
- **Code Reference**: `src/app/components/HeroSection.tsx` (line 204)
- **Execution**:
  ```tsx
  <Link href="/sign-up-login-screen" className="...">Start Free Today</Link>
  ```
- **Verdict**: Client-side router navigation to `/sign-up-login-screen`. It does not dispatch any background API request on click.

### 3. "Prebook" Button Action
- **Code Reference**: `src/app/prebook/components/PrebookClient.tsx` (lines 80–125)
- **Execution**:
  1. Clicking "Prebook Now" triggers `handleInitiatePrebook()`.
  2. Dispatches `POST /api/payments/fonepay/qr` with JSON payload:
     ```json
     { "plan": "crash-course", "amount": 300 }
     ```
  3. Server route inserts row in `payment_transactions` and returns Fonepay QR string + PRN identifier.
  4. Also queries `/api/prebook/mine` which returns records from `public.prebookings` table.
- **Verdict**: Fully functional real API call wired to database & payment gateway.

---

## 4. Entitlements, Access Control & Feature Flagging

### 1. Premium Gate Component (`src/components/PremiumGate.tsx`)
Inspects `profile.subscription_plan` ('free' vs 'student' vs 'pro'). If user is on 'free' plan and feature requires 'student'/'pro', renders paywall overlay modal with button to `/checkout`.

### 2. Navigation Lock Badges (`src/components/DashboardLayout.tsx`)
Defines `PRO_FEATURES` set:
```typescript
const PRO_FEATURES = new Set(['nav-ai', 'nav-mcq-gen', 'nav-mistake', 'nav-battle', 'nav-study-plan', 'nav-flashcards']);
```
Displays lock icon badge for free tier users.

### 3. AI Usage & Rate Limiting (`check_and_increment_ai_usage` RPC)
Defined in `supabase/migrations/20260721070000_ai_rate_limit.sql`.
- Free plan: 50 AI requests/day.
- Pro plan: 500 AI requests/day.
Exceeding quota returns HTTP 429 (`Daily AI limit reached`).

### 4. Admin Access Control
Defined in `src/lib/config/superAdmin.ts` and `supabase/migrations/20260721040000_unify_admin_checks.sql`.
Requires `user_profiles.is_admin = true` or email matching `isSuperAdmin()`.

---

## 5. Full Supabase Database Schema

All 39 tables created across `supabase/migrations/`:

### 1. `public.user_profiles`
- **Columns**: `id` (UUID, PK), `email` (TEXT), `full_name` (TEXT), `avatar_url` (TEXT), `phone` (TEXT), `college` (TEXT), `cee_year` (INT), `role` (ENUM), `subscription_plan` (ENUM), `subscription_expires_at` (TIMESTAMPTZ), `study_streak` (INT), `total_points` (INT), `battle_rating` (INT), `rank_position` (INT), `is_active` (BOOL), `is_admin` (BOOL), `created_at` (TIMESTAMPTZ), `updated_at` (TIMESTAMPTZ)
- **RLS**: Enabled. Users can select/update own row (`auth.uid() = id`). Admin full access.

### 2. `public.subjects`
- **Columns**: `id` (UUID, PK), `name` (TEXT), `display_name` (TEXT), `description` (TEXT), `color` (TEXT), `icon` (TEXT), `is_active` (BOOL), `created_at` (TIMESTAMPTZ)
- **RLS**: Enabled. Public SELECT. Admin ALL.

### 3. `public.chapters`
- **Columns**: `id` (UUID, PK), `subject_id` (UUID, FK `subjects.id`), `title` (TEXT), `description` (TEXT), `chapter_number` (INT), `is_premium` (BOOL), `is_active` (BOOL), `created_at` (TIMESTAMPTZ), `updated_at` (TIMESTAMPTZ)
- **RLS**: Enabled. Public SELECT. Admin ALL.

### 4. `public.questions`
- **Columns**: `id` (UUID, PK), `subject_id` (UUID, FK), `chapter_id` (UUID, FK), `question_text` (TEXT), `option_a` (TEXT), `option_b` (TEXT), `option_c` (TEXT), `option_d` (TEXT), `correct_option` (TEXT), `explanation` (TEXT), `difficulty` (ENUM), `is_premium` (BOOL), `is_active` (BOOL), `created_by` (UUID, FK), `created_at` (TIMESTAMPTZ), `updated_at` (TIMESTAMPTZ)
- **RLS**: Enabled. Public SELECT. Admin ALL.

### 5. `public.exams`
- **Columns**: `id` (UUID, PK), `title` (TEXT), `description` (TEXT), `subject_id` (UUID, FK), `duration_minutes` (INT), `total_marks` (INT), `negative_marking` (BOOL), `is_premium` (BOOL), `is_active` (BOOL), `created_by` (UUID, FK), `created_at` (TIMESTAMPTZ)
- **RLS**: Enabled. Public SELECT.

### 6. `public.exam_attempts`
- **Columns**: `id` (UUID, PK), `exam_id` (UUID, FK `exams.id`), `student_id` (UUID, FK `user_profiles.id`), `score` (NUMERIC), `total_marks` (INT), `correct_answers` (INT), `incorrect_answers` (INT), `unattempted` (INT), `percentage` (NUMERIC), `percentile` (NUMERIC), `time_taken_seconds` (INT), `completed_at` (TIMESTAMPTZ), `created_at` (TIMESTAMPTZ)
- **RLS**: Enabled. Owner SELECT/INSERT (`auth.uid() = student_id`).

### 7. `public.topic_mastery`
- **Columns**: `id` (UUID, PK), `student_id` (UUID, FK), `chapter_id` (UUID, FK), `mastery_level` (ENUM), `questions_attempted` (INT), `correct_answers` (INT), `accuracy` (NUMERIC), `last_practiced_at` (TIMESTAMPTZ), `updated_at` (TIMESTAMPTZ)
- **RLS**: Enabled. Owner SELECT/INSERT/UPDATE (`auth.uid() = student_id`).

### 8. `public.bookmarks`
- **Columns**: `id` (UUID, PK), `student_id` (UUID, FK), `question_id` (UUID, FK), `created_at` (TIMESTAMPTZ)
- **RLS**: Enabled. Owner ALL (`auth.uid() = student_id`).

### 9. `public.notifications`
- **Columns**: `id` (UUID, PK), `user_id` (UUID, FK), `title` (TEXT), `message` (TEXT), `notification_type` (TEXT), `is_read` (BOOL), `created_at` (TIMESTAMPTZ)
- **RLS**: Enabled. Owner SELECT/UPDATE.

### 10. `public.battle_rooms`
- **Columns**: `id` (UUID, PK), `room_code` (TEXT), `subject_id` (UUID, FK), `chapter_id` (UUID, FK), `creator_id` (UUID, FK), `opponent_id` (UUID, FK), `status` (TEXT), `question_count` (INT), `time_limit_seconds` (INT), `started_at` (TIMESTAMPTZ), `completed_at` (TIMESTAMPTZ), `created_at` (TIMESTAMPTZ)
- **RLS**: Enabled. Authenticated SELECT/INSERT/UPDATE.

### 11. `public.battle_results`
- **Columns**: `id` (UUID, PK), `room_id` (UUID, FK), `player_id` (UUID, FK), `score` (NUMERIC), `correct_answers` (INT), `incorrect_answers` (INT), `accuracy` (NUMERIC), `time_taken_seconds` (INT), `created_at` (TIMESTAMPTZ)
- **RLS**: Enabled. Authenticated SELECT/INSERT.

### 12. `public.battle_answers`
- **Columns**: `id` (UUID, PK), `room_id` (UUID, FK), `player_id` (UUID, FK), `question_id` (UUID, FK), `selected_option` (TEXT), `is_correct` (BOOL), `response_time_ms` (INT), `created_at` (TIMESTAMPTZ)
- **RLS**: Enabled. Authenticated SELECT/INSERT.

### 13. `public.practice_attempts`
- **Columns**: `id` (UUID, PK), `student_id` (UUID, FK), `subject_name` (TEXT), `difficulty` (TEXT), `total_questions` (INT), `correct_answers` (INT), `incorrect_answers` (INT), `unattempted` (INT), `score` (NUMERIC), `total_marks` (NUMERIC), `time_taken_seconds` (INT), `created_at` (TIMESTAMPTZ)
- **RLS**: Enabled. Owner SELECT/INSERT.

### 14. `public.leaderboard_snapshots`
- **Columns**: `id` (UUID, PK), `snapshot_date` (DATE), `period_type` (TEXT), `rankings` (JSONB), `created_at` (TIMESTAMPTZ)
- **RLS**: Enabled. Public SELECT.

### 15. `public.matchmaking_queue`
- **Columns**: `id` (UUID, PK), `player_id` (UUID, FK), `rating` (INT), `status` (TEXT), `joined_at` (TIMESTAMPTZ)
- **RLS**: Enabled. Owner ALL (`auth.uid() = player_id`).

### 16. `public.activation_codes`
- **Columns**: `id` (UUID, PK), `code` (TEXT), `plan` (TEXT), `duration_days` (INT), `is_used` (BOOL), `used_by` (UUID, FK), `used_at` (TIMESTAMPTZ), `created_at` (TIMESTAMPTZ)
- **RLS**: Enabled. Authenticated SELECT/UPDATE.

### 17. `public.notes`
- **Columns**: `id` (UUID, PK), `subject_id` (UUID, FK), `chapter_id` (UUID, FK), `title` (TEXT), `content` (TEXT), `file_url` (TEXT), `is_premium` (BOOL), `created_at` (TIMESTAMPTZ)
- **RLS**: Enabled. Public SELECT.

### 18. `public.video_lectures`
- **Columns**: `id` (UUID, PK), `subject_id` (UUID, FK), `chapter_id` (UUID, FK), `title` (TEXT), `video_url` (TEXT), `bunny_video_id` (TEXT), `duration_seconds` (INT), `is_premium` (BOOL), `created_at` (TIMESTAMPTZ)
- **RLS**: Enabled. Public SELECT.

### 19. `public.study_materials`
- **Columns**: `id` (UUID, PK), `title` (TEXT), `category` (TEXT), `file_url` (TEXT), `is_premium` (BOOL), `created_at` (TIMESTAMPTZ)
- **RLS**: Enabled. Public SELECT.

### 20. `public.live_classes`
- **Columns**: `id` (UUID, PK), `title` (TEXT), `instructor` (TEXT), `scheduled_at` (TIMESTAMPTZ), `hms_room_id` (TEXT), `status` (TEXT), `is_premium` (BOOL), `created_at` (TIMESTAMPTZ)
- **RLS**: Enabled. Public SELECT.

### 21. `public.exam_questions`
- **Columns**: `id` (UUID, PK), `exam_id` (UUID, FK), `question_id` (UUID, FK), `order_index` (INT)
- **RLS**: Enabled. Public SELECT.

### 22. `public.exam_question_answers`
- **Columns**: `id` (UUID, PK), `attempt_id` (UUID, FK), `question_id` (UUID, FK), `selected_option` (TEXT), `is_correct` (BOOL)
- **RLS**: Enabled. Owner SELECT/INSERT.

### 23. `public.room_members`
- **Columns**: `id` (UUID, PK), `room_id` (UUID, FK), `user_id` (UUID, FK), `joined_at` (TIMESTAMPTZ)
- **RLS**: Enabled. Authenticated SELECT/INSERT.

### 24. `public.billing_history`
- **Columns**: `id` (UUID, PK), `user_id` (UUID, FK), `amount` (NUMERIC), `plan` (TEXT), `payment_method` (TEXT), `status` (TEXT), `created_at` (TIMESTAMPTZ)
- **RLS**: Enabled. Owner SELECT.

### 25. `public.messages`
- **Columns**: `id` (UUID, PK), `room_id` (UUID, FK), `sender_id` (UUID, FK), `content` (TEXT), `created_at` (TIMESTAMPTZ)
- **RLS**: Enabled. Authenticated SELECT/INSERT.

### 26. `public.batches`
- **Columns**: `id` (UUID, PK), `slug` (TEXT), `title` (TEXT), `program` (TEXT), `description` (TEXT), `price_npr` (NUMERIC), `features` (JSONB), `instructor_name` (TEXT), `is_active` (BOOL), `created_at` (TIMESTAMPTZ)
- **RLS**: Enabled. Public SELECT.

### 27. `public.batch_enrollments`
- **Columns**: `id` (UUID, PK), `batch_id` (UUID, FK `batches.id`), `user_id` (UUID, FK `user_profiles.id`), `enrolled_at` (TIMESTAMPTZ)
- **RLS**: Enabled. Owner SELECT/INSERT.

### 28. `public.doubts`
- **Columns**: `id` (UUID, PK), `user_id` (UUID, FK), `subject_id` (UUID, FK), `title` (TEXT), `content` (TEXT), `image_url` (TEXT), `status` (TEXT), `created_at` (TIMESTAMPTZ)
- **RLS**: Enabled. Authenticated SELECT/INSERT.

### 29. `public.doubt_replies`
- **Columns**: `id` (UUID, PK), `doubt_id` (UUID, FK `doubts.id`), `user_id` (UUID, FK), `reply_text` (TEXT), `is_teacher_answer` (BOOL), `created_at` (TIMESTAMPTZ)
- **RLS**: Enabled. Authenticated SELECT/INSERT.

### 30. `public.video_watch_progress`
- **Columns**: `id` (UUID, PK), `user_id` (UUID, FK), `video_id` (UUID, FK), `watched_seconds` (INT), `completed` (BOOL), `updated_at` (TIMESTAMPTZ)
- **RLS**: Enabled. Owner SELECT/INSERT/UPDATE.

### 31. `public.video_notes`
- **Columns**: `id` (UUID, PK), `user_id` (UUID, FK), `video_id` (UUID, FK), `timestamp_seconds` (INT), `note_text` (TEXT), `created_at` (TIMESTAMPTZ)
- **RLS**: Enabled. Owner ALL.

### 32. `public.ai_usage`
- **Columns**: `id` (UUID, PK), `user_id` (UUID, FK), `request_count` (INT), `last_request_date` (DATE)
- **RLS**: Enabled. Owner SELECT.

### 33. `public.payment_transactions`
- **Columns**: `id` (UUID, PK), `prn` (TEXT, UNIQUE), `user_id` (UUID, FK), `amount` (NUMERIC), `sku` (TEXT), `payment_method` (TEXT), `status` (TEXT), `fonepay_response` (JSONB), `created_at` (TIMESTAMPTZ), `updated_at` (TIMESTAMPTZ)
- **RLS**: Enabled. Owner SELECT, Service Role write.

### 34. `public.flashcards`
- **Columns**: `id` (UUID, PK), `subject_id` (UUID, FK), `chapter_id` (UUID, FK), `front` (TEXT), `back` (TEXT), `explanation` (TEXT), `created_at` (TIMESTAMPTZ)
- **RLS**: Enabled. Public SELECT.

### 35. `public.flashcard_reviews`
- **Columns**: `id` (UUID, PK), `user_id` (UUID, FK), `flashcard_id` (UUID, FK), `quality` (INT), `interval` (INT), `ease_factor` (NUMERIC), `reviewed_at` (TIMESTAMPTZ)
- **RLS**: Enabled. Owner SELECT/INSERT/UPDATE.

### 36. `public.activation_attempts`
- **Columns**: `id` (UUID, PK), `user_id` (UUID, FK), `code` (TEXT), `ip_address` (TEXT), `is_success` (BOOL), `attempted_at` (TIMESTAMPTZ)
- **RLS**: Enabled. Owner SELECT.

### 37. `public.prebookings`
- **Columns**: `id` (UUID, PK), `user_id` (UUID, FK), `phone` (TEXT), `amount_paid` (NUMERIC), `transaction_prn` (TEXT), `status` (TEXT), `created_at` (TIMESTAMPTZ)
- **RLS**: Enabled. Owner SELECT.

### 38. `public.subjective_questions`
- **Columns**: `id` (UUID, PK), `program` (TEXT), `subject_id` (UUID, FK `subjects.id`), `chapter_id` (UUID, FK `chapters.id`), `subject` (TEXT), `chapter` (TEXT), `question_text` (TEXT), `marks` (INT), `suggested_time_minutes` (INT), `sample_solution` (TEXT), `rubric` (JSONB), `created_at` (TIMESTAMPTZ)
- **RLS**: Enabled. Public SELECT. Admin ALL.

### 39. `public.subjective_evaluations`
- **Columns**: `id` (UUID, PK), `question_id` (UUID, FK `subjective_questions.id`), `user_id` (UUID, FK `user_profiles.id`), `image_url` (TEXT), `extracted_text` (TEXT), `obtained_marks` (NUMERIC), `total_marks` (NUMERIC), `percentage` (NUMERIC), `feedback` (TEXT), `rubric_breakdown` (JSONB), `suggestions` (JSONB), `created_at` (TIMESTAMPTZ)
- **RLS**: Enabled. Owner SELECT/INSERT (`auth.uid() = user_id`).

---

## 6. Audit Conclusion & Summary Matrix

| Category / Domain | Total Routes / Tables | Wired to DB / API | Partially Wired (with Fallback) | Static / Mock UI |
|---|---|---|---|---|
| **Sectors (CEE, SEE, English, Digital)** | 4 | 2 (CEE, SEE) | 0 | 2 (English, Digital) |
| **Practice & Compete** | 7 | 7 | 0 | 0 |
| **Study & Courses** | 7 | 4 | 2 (Batches, Subjects) | 1 (Courses Catalog) |
| **AI Tools** | 4 | 4 | 0 | 0 |
| **Monetization & Auth** | 7 | 7 | 0 | 0 |
| **Database Schema** | 39 Tables | 39 Real Tables | 0 | 0 |
