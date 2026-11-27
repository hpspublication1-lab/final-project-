# Human Heart pilot: plan (M9)

**Status: PROPOSAL.** Nothing here is lesson content. No lesson text, labels or questions are
written by the engineering track: staff write them in the CMS and reviewers approve them. This
plan covers which assets can legally and technically be used, and what must happen, in order,
before the pilot reaches a student.

## Order of work

| # | Step | Who | Depends on | State |
|---|---|---|---|---|
| 1 | Enter and verify the official MECEE-BL syllabus; find the heart topic in it | Two academic directors | Official PDF from mec.gov.np | Workflow ready (M6); not done |
| 2 | Choose the model and 2D fallback (below); record licence, source and credit | Rights reviewer and academic director | — | Candidates checked (below) |
| 3 | Prepare the model: convert to GLB, reduce to the mobile budget, name parts by anatomical term | 3D artist / engineering | Step 2 | Not started |
| 4 | Upload, check, describe (Visuals screen) | Animator | Step 3 | Pipeline ready (M7) |
| 5 | Decide the SA-node question (`SA_NODE_REVIEW_PACKET.md`) | Qualified academic reviewer | — | Waiting for reviewer |
| 6 | Hotspots, layers, guided tour on the model; learning objectives; questions | Editor, with the anatomist placing hotspots | Steps 1, 4, 5 and the M11 editor | Editor not built yet (M11) |
| 7 | Scientific, visual and rights review of the visual; six-gate review of the lesson | Reviewers (not the authors) | Step 6 | Review flow ready |
| 8 | Malware scan of every file | Scanner | Decision D7 | Blocked on D7 |
| 9 | Publish; switch the feature on | Publisher; owner approval | Steps 7, 8, migration applied | Owner decision |

## Assets: licences checked at the source (27 Nov 2026)

The platform charges fees, so non-commercial licences (CC BY-NC) are excluded outright.

| Candidate | Licence (as stated by the source) | Fit for the pilot | Verdict |
|---|---|---|---|
| **BodyParts3D** heart parts (DBCLS), release 4.0 | **CC BY 4.0** per the database's licence page, updated 27 Feb 2025. Older release READMEs and the OBJ files say CC BY-SA 2.1 Japan; the current page supersedes them | Parts are separate meshes named by anatomical concept (FMA), so chambers, valves and great vessels can become layers and hotspot targets by name | **Recommended 3D source.** Keep a dated copy of the licence page with the rights record. Credit line, as DBCLS asks: "BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International" |
| NIH 3D `3DPX-002636`, "17 yo Female, Normal Heart" | Public domain (per its entry) | Imaging-derived whole heart in diastole; internal parts are not separate, so layers and hotspots need positions instead of part names | **Alternative** if BodyParts3D's geometry isn't good enough |
| NIH 3D `3DPX-000906`, heart, aorta and kidneys | CC BY (per its entry) | Includes unrelated organs; would need editing | Possible, lower fit |
| NIH 3D `3DPX-000900`, "Heart (CT)" | **CC BY-NC** | — | **Excluded** (non-commercial) |
| Z-Anatomy | CC BY-SA 4.0 (derived from BodyParts3D) | Good structure | **Not recommended**: share-alike applies to adaptations, and the same geometry is available from BodyParts3D under CC BY 4.0. Use only on a legal decision |
| NIH 3D `3DPX-000424`, `3DPX-013289` (suggested in the independent track's analysis) | — | — | **Not found** on NIH 3D; don't use without a working entry page |
| **Servier Medical Art** heart sections / heart conduction illustrations | **CC BY 4.0** (stated on every category page) | Clean labelled-style anatomy plates; suitable as the 2D fallback base | **Recommended 2D source.** Labels added by staff must match the 3D hotspots |
| The 26 images from the parallel build (now in `content/cee-visual-drafts/images/`) | None recorded | — | **Excluded** until each has a recorded source and licence |

Credit for every asset is recorded on the visual (licence and source fields, required) and
checked by the rights reviewer before approval.

## The SA node and AV node on the model

Whether BodyParts3D has separate meshes for the conduction system hasn't been checked yet; look
for the sinoatrial and atrioventricular node in its parts list when preparing the model. If they
aren't there, they are marked by **position hotspots**. The anatomist places them in the CMS, as
decided in the SA-node review; no node geometry is made up.

## Technical targets

The validator enforces hard limits: 25 MB, 1.5 million triangles, textures up to 4096 px, no
Draco or Meshopt compression, since three.js needs extra WebAssembly decoders for those and the
site's security policy doesn't allow them. Those limits only reject broken files. For a
mid-range Android phone on 4G in Nepal, aim much lower:

- under about 100,000 triangles for the whole heart, about 12 draw calls, textures 2048 px or less;
- under about 8 MB GLB, so it loads in a reasonable time on a typical mobile connection;
- part names kept through conversion (hotspots and layers refer to them).

These targets should be confirmed on a real low-end phone once the model exists. Until then
they are estimates.

## What the engineering track will not do

- Write or paraphrase any lesson text, labels, explanations or questions.
- Decide the SA-node wording or place hotspots by eye.
- Upload any asset without its licence and source recorded.
- Publish, apply the migration or switch the feature on without the owner's approval.
