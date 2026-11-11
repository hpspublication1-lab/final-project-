# SAMYAK TUTOR — PHASE 3: MASTER STUDENT EXPERIENCE SPECIFICATION
**Document ID:** `docs/product/04_STUDENT_EXPERIENCE.md`  
**Version:** 1.0.0 (Master Student Journey)  
**Date:** November 10, 2026  
**Status:** Approved & Validated  
**Workspace:** `d:\FR` | **Branch:** `feature/product-transformation`  
**Author:** Multidisciplinary Product Development Team (Principal UX Architect, Senior React Engineer, Chief Product Designer, Senior UI Designer)

---

## 1. Student Experience Philosophy: The 6-Stage Mastery Loop

Every student screen in Samyak Tutor is designed around the **Cognitive Mastery Loop**:
```
┌────────────────────────────────────────────────────────┐
│ 1. ORIENT: Student Dashboard (Next Academic Priority)  │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│ 2. ABSORB: Lecture Player (Bunny HLS + Class Notes)    │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│ 3. PRACTICE: Chapter MCQs (15,000+ High-Yield Drills)  │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│ 4. ASSESS: Grand Mock Exams (200Q Timed CBT, -0.25)    │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│ 5. REMEDIATE: Galti Sudhar Notebook & SM-2 Flashcards   │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│ 6. COMPETE: 1v1 Battle Arena (Real-Time Colyseus PvP)  │
└────────────────────────────────────────────────────────┘
```

---

## 2. Page-by-Page Transformation Blueprint

### 2.1 Home Dashboard (`/student-dashboard`)
- **Primary Goal:** Within 3 seconds of opening the application, the student must know exactly what to study today without cognitive overload.
- **Visual Hierarchy:**
  1. **Personal Header:** Greeting, active academic program badge (e.g. `CEE Medical Entrance`), and current streak flame counter.
  2. **Dominant Next-Action Hero Card:** Displays the current active batch, days remaining, and a prominent `Resume Next Lecture` button that opens the exact lesson where the student stopped.
  3. **Today's Study Plan (3 Pillars):** Compact checklist with 1 Video Lesson, 20 Practice MCQs, and 1 Revision Task with time estimates (e.g., `45 mins`).
  4. **Upcoming Event Pill:** Countdown to tonight's live masterclass or the weekend national mock exam.
  5. **Quick Action Shortcuts:** High-contrast tiles for AI Saarthi, Battle Arena, Flashcards, and Mistake Analyser.
  6. **Weak Topic Radar:** 3 chapters with the lowest accuracy percentage, equipped with a direct `Drill Now` button.

### 2.2 Course Catalogue & Cohort Selection (`/courses`, `/batches`)
- **Primary Goal:** Clean discovery of academic programs and transparent pricing without misleading sales tactics.
- **Key Features:**
  - **Interactive Gate:** Automatic track selector modal (`CourseSelectionGate.tsx`) that remembers the student's primary academic goal.
  - **Track Tabs:** 6 primary tracks: `CEE Medical`, `IOE Engineering`, `Lok Sewa`, `Class 11 & 12`, `SEE Class 10`, `Skills & IELTS`.
  - **Delivery Format Pills:** Filter by `Live Batches`, `Crash Courses`, `Subject Courses`, or `Self-Paced Passes`.
  - **Card Content:** Clear subject chips, chapter counts, faculty credentials, validity days, seat reservation deposits (e.g., `NPR 300 deposit`), and refund terms.
  - **Comparison Matrix:** 12-program comparison table displaying coverage, validity, and fees side-by-side.

### 2.3 Learning Workspace (`/learn/[lessonId]`)
- **Primary Goal:** Distraction-free, cinema-grade lecture viewing paired with active note-taking.
- **Key Features:**
  - **Bunny Stream HLS Player:** Adaptive bitrate streaming (1080p, 720p, 480p, 360p, Auto) with instant seek.
  - **Dynamic DRM Watermarking:** Real-time canvas overlay rendering the authenticated student's user ID and timestamp to protect faculty intellectual property.
  - **Audio-Only Mode:** High-efficiency data-saver mode for students with low-bandwidth mobile connections.
  - **5-Pillar Pedagogic Drawer:**
    - `Playlist`: Chapter video sequence with checkmarks on finished lectures.
    - `DPP`: Daily Practice Problems embedded directly under the video with instant grading.
    - `PDF Notes`: Downloadable teacher lecture slides and chapter summaries.
    - `Personal Notes`: Timestamped notes saved to localStorage that allow one-click jumping back to exact lecture moments.
    - `Ask Doubt`: Direct ticket submission to faculty with question timestamps.

### 2.4 Study Notes & Academic Vault (`/free-resources`, `InteractiveNoteReader.tsx`)
- **Primary Goal:** Rapid formula reference and high-yield chapter revisions.
- **Key Features:**
  - **Interactive Note Reader:** Markdown notes rendered with KaTeX for crisp LaTeX mathematical formulas.
  - **Formula Sheet Drawer:** Copy LaTeX formulas with one click.
  - **PDF Resource Viewer:** Fullscreen modal with page navigation, zoom, and fit-to-width controls.

### 2.5 Practice Center & Question Bank (`/practice`, `/question-bank`)
- **Primary Goal:** High-volume chapter mastery with instant feedback and pedagogical explanations.
- **Key Features:**
  - **15,000+ MCQs:** Categorized by Subject, Chapter, Topic, and Difficulty (`Easy`, `Medium`, `Hard`).
  - **Speed Drills:** `< 150ms` instant answer feedback with green/red indicator highlights.
  - **Explanation Drawer:** Step-by-step conceptual logic with relevant formula derivations.
  - **One-Click Bookmark & Flag:** Save high-yield questions to personal bookmarks or flag errata directly to faculty.

### 2.6 Computer-Based Testing (CBT) Interface (`/mock-tests`)
- **Primary Goal:** Flawless national exam simulation adhering to official Medical Education Commission (MEC) format.
- **Key Features:**
  - **200 Questions, 180 Minutes:** Exactly mirrors CEE timing and negative marking (-0.25 marks per wrong answer).
  - **5-State Question Palette:** `Not Visited`, `Not Answered`, `Answered`, `Marked for Review`, `Answered & Marked`.
  - **Durable Local Storage Sync:** Every answer is immediately committed to IndexedDB/localStorage before syncing to Supabase. If the browser tab crashes or network drops, 0 answers are lost.
  - **Anti-Cheat Monitoring:** Fullscreen enforcement, tab-switch counter, and copy/paste blocking with visual warning alerts.

### 2.7 Examination Diagnostics & Results (`/results`)
- **Primary Goal:** Transform raw scores into an actionable improvement roadmap.
- **Key Features:**
  - **Score Summary:** Total marks, correct/incorrect/unanswered counts, accuracy percentage, and national percentile.
  - **Subject Breakdown:** Individual performance bars across Biology, Chemistry, Physics, and MAT.
  - **Instant Remediation Button:** Direct CTA to *"Practice 10 Questions in Weakest Chapter"* to immediately fix identified knowledge gaps.
  - **MEC Rank Predictor Integration:** Instant conversion of mock score into estimated government scholarship odds.

### 2.8 AI Saarthi (`/ai-tutor`)
- **Primary Goal:** 24/7 personalized academic tutor.
- **Key Features:**
  - **Syllabus-Aligned Prompts:** Quick prompt pills for CEE (e.g. `⚗️ Hybridization Rules`, `🧬 DNA Replication`) and SEE.
  - **Mathematical Reasoning:** KaTeX LaTeX formatting for chemical equations, fractions, and square roots.
  - **Image Scanner:** Upload textbook photos or handwritten math problems for AI step-by-step breakdown.
  - **Usage Transparency:** Clear daily query quota indicator with honest rate-limiting feedback.

### 2.9 Battle Arena (`/battle-arena`, `/match-lobby`)
- **Primary Goal:** High-engagement 1v1 PvP quiz battles.
- **Key Features:**
  - **Colyseus Real-Time Engine:** Server-authoritative WebSocket room with 15-second question timers.
  - **WebRTC Proctoring Camera:** P2P video stream between competitors to prevent cheating and verify player presence.
  - **Live Scoreboard:** Animated score bars updating in real-time as answers are submitted.
  - **Post-Match Summary:** Elo rating update, XP points earned, and direct rematch button.

### 2.10 Student Progress & Analytics Center (`/progress`)
- **Primary Goal:** Centralized intelligence center tracking longitudinal learning metrics.
- **Key Features:**
  - **10 Core Telemetry Gauges:** Total Study Hours, Videos Watched, Questions Solved, Average Accuracy, Test Score Average, Current Streak, and Predicted Readiness.
  - **Weak Chapter Priority Queue:** Top 3 chapters with sub-60% accuracy with direct `Drill` buttons.
  - **Next Step Recommendations:** AI-selected daily pathways across Flashcards, Arena, and Lecture Notes.

### 2.11 Live Masterclasses (`/live-classes`)
- **Primary Goal:** Interactive live instruction with premier faculty.
- **Key Features:**
  - **Multi-Format Player:** Supports 100ms WebRTC low-latency streaming, YouTube Live embeds, and Bunny HLS live streams.
  - **Real-Time Q&A Feed:** Upvote student questions and receive live answers from teaching assistants.
  - **Attendance Logging:** Automatically logs live watch time toward student course progress.

### 2.12 Student Profile & Gamification (`/profile`)
- **Primary Goal:** Personal identity, achievements, and rewards.
- **Key Features:**
  - **Avatar & Gamer Tag:** Custom student avatars and academic titles (e.g. `CEE Challenger`, `Top 100 Nepal`).
  - **Rewards Wallet:** Track coins and tournament prize earnings with cashout requests.
  - **Streak Recovery:** Freeze or repair streaks by solving 5 review questions.

---

## 3. Verification & Sign-Off

- **Pages Audited & Redesigned:** 12 major student experiences.
- **Functional Verification:** All interactions connect to real Supabase RPCs, Colyseus WebSockets, and Bunny CDN APIs.
- **TypeScript Check:** `npx tsc --noEmit` exits with **0 errors**.
- **Deliverable Status:** Complete and written to `docs/product/04_STUDENT_EXPERIENCE.md`.
- **Ready for Next Phase:** **Phase 4 — Mobile & PWA Experience (`05_MOBILE_EXPERIENCE.md`)**.
