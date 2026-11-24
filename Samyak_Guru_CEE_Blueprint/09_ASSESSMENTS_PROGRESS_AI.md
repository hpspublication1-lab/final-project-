# Assessments, Progress, Analytics and AI Tutor

## Assessments
Practice modes: single-best-answer MCQs, image MCQs, drag/label structure, order stages, hotspot identification. Official-style mocks must follow the verified current MEC exam format for selected program; visual tasks are **practice**, not misrepresented as official exam item types.

Question version: stem, options, single correct answer for MCQ, rationale, learning objective, program/syllabus scope, difficulty, reviewer status, linked asset version and optional visual state. Freeze question revisions used by attempts.

## Assessment workflow
Published lesson → approved question set → student attempt → server validation → server scoring → explanation release according to practice/mock policy → mastery update → revision recommendation. In timed mocks, hide answers until submission. Do not trust client-side scores.

## Progress
Event schema: stable UUID/idempotency key, student ID from session, publication ID, asset version ID, event type, occurred timestamp, server received timestamp, validated metadata. Whitelist event types. Calculate completion from configured learning objectives and trusted assessment results, not arbitrary client `completed:true`.

## Analytics
Track authorized lessons started/completed, loading failures, engagement, quiz error distribution, weak objectives, device compatibility. Minimize personal data; program/role-scoped access. Do not equate clicking a hotspot with proven mastery.

## AI tutor — future optional subsystem
Student selects approved structure → session API → verify access → retrieve approved lesson content and specific asset/structure context → generate grounded explanation → validate against available context → respond with citations/limitations → optional highlight/practice → telemetry. Never invent anatomy, content or answers; AI scores are estimates, not official grades. AI cannot override approved answer keys. Feature-flag and evaluate against educator-reviewed benchmarks.
