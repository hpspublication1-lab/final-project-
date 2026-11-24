# Samyak Guru — CEE Visual Intelligence: Engineering Handoff

**Status:** Product and engineering design specification only. No repository has been inspected; implementation, tests, deployment, and academic approvals are **UNVERIFIED**.

## Instructions to Claude / Antigravity
1. Read all files in numerical order. Treat them as **target requirements**, not evidence of implemented functionality.
2. Inspect the actual repository before changing code. Create an evidence-backed inventory of what exists, is partial, broken, missing, blocked or unverified.
3. Preserve existing data, accounts, courses, subscriptions, and behavior. Do not delete or rewrite unrelated modules. Seek approval for destructive migrations and production actions.
4. Strictly isolate SEE, NEB, CEE, IOE, IELTS, Lokseva and other programs. Never display fake courses, lessons, teachers, results or content. Empty state is acceptable.
5. Adapt proposed technologies to the actual stack. Reuse existing auth, CMS, course, storage and assessment services if sound.
6. Start with the Foundation vertical slice; implement and verify one complete Human Heart lesson workflow using **approved real content** or clearly labeled development-only fixtures.
7. Report exact file changes, migrations, endpoints, tests run and their actual results, blockers and next steps. Never fabricate evidence.

## File index
- `01_PRODUCT_VISION_AND_SCOPE.md` — Goals, academic coverage, non-goals, priorities
- `02_SYSTEM_ARCHITECTURE.md` — Components, integration, boundaries, diagrams
- `03_CURRICULUM_AND_DATA_ISOLATION.md` — Academic taxonomy and isolation guarantees
- `04_DATABASE_SCHEMA.md` — Detailed entities, constraints, migrations
- `05_API_CONTRACTS.md` — Routes, authorization, requests and errors
- `06_VISUAL_PLAYER_AND_MOBILE.md` — 3D/2D/simulation runtime and bridge
- `07_ANIMATION_CONTENT_PIPELINE.md` — Science production and asset processing
- `08_ADMIN_CMS_AND_REVIEW.md` — Editor, approvals, publishing, RBAC
- `09_ASSESSMENTS_PROGRESS_AI.md` — MCQ, mastery, AI tutor future interfaces
- `10_SECURITY_TESTING_DEVOPS.md` — Threats, test matrix, deployment, observability
- `11_SPRINTS_AND_BACKLOG.md` — Four-week foundation plus expansion roadmap
- `12_CLAUDE_EXECUTION_PROMPT.md` — Copy-ready execution instructions
- `13_MERMAID_FLOWCHARTS.md` — Editable end-to-end system diagrams
- `14_ACCEPTANCE_CRITERIA_AND_STATUS.md` — Evidence and release gates

## Target success criterion
Authorized editor maps an approved topic, uploads a safe visual asset, attaches it to a versioned lesson, gets academic approval, publishes immutable snapshot; authorized student explores it on mobile/web, completes approved practice, and sees valid progress. Other programs remain unaffected.
