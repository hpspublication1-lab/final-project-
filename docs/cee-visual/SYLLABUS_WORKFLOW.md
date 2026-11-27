# Official MEC syllabus: entry and verification (M6)

Every visual lesson must be mapped to a topic in a **verified** syllabus before it can be
published. This is how the official Medical Education Commission (MEC) syllabus gets
into the platform without anyone inventing or paraphrasing it.

Nothing in this repository contains syllabus content. The template's example rows are
refused by the importer, so it can't be imported as it is.

## The source document

- The exam is now officially named **MECEE-BL** (Medical Education Common Entrance
  Examination, Bachelor Level), formerly CEE. Its syllabus is MEC's *Syllabus for
  Bachelor level Common Entrance Examination (2020)*.
- A mirrored copy of MEC's document, checked on 25 Nov 2026, lists three revisions:
  10 March 2021, 18 August 2025 and 28 April 2026 (15 Baisakh 2083). Its pages are
  headed "2020 revised in 2026".
- **Download the document from mec.gov.np itself**, not from a mirror. The fingerprint recorded
  below is of the exact file, so everyone must use the same download.
- The existing course chapters on the site may predate the 2025 and 2026 revisions. The
  academic director should compare them when linking chapters (step 5).

## Roles

| Step | Who | Enforced by |
|---|---|---|
| Create the draft version | Academic director (program-wide) | API role check |
| Enter the tree, record the document | Academic director or editor (program-wide) | API and `cee_import_curriculum()` |
| Verify | A **different** program-wide academic director, who neither created the draft nor entered any of it | API and `cee_verify_syllabus()` |
| Link chapters to course pages | Academic director or editor for that subject | API |

Super admins grant these roles on **Admin → CEE visual lessons → Roles**.

## Steps

1. **Create a draft.** Syllabus → *New syllabus version*. Give it a name that says which
   revision it is, e.g. "MECEE-BL 2020, revised 2026".
2. **Record the document.** *Record document*: choose the PDF downloaded from mec.gov.np
   and paste its address. The file stays on your computer; only its SHA-256 fingerprint is
   saved. The verifier will have to use the same file.
3. **Enter the tree.** Either add entries one by one, or *Import from file*:
   - *Download the template*, fill it in a spreadsheet, and save it as **CSV (comma-separated)**.
   - One row per entry, **in the document's order**: `level` 1 = subject, 2 = chapter,
     3 or more = topics (deeper levels are sub-topics). Each row belongs to the closest row above
     it with a level one lower.
   - `title`: exactly as written in the document.
   - `source_ref`: where it is in the document, e.g. `p. 4, 2.3`. The importer warns when
     these are missing, and the verifier needs them.
   - `code`: optional. It's made from the title; it's needed only when the title has no
     English letters, or when two entries under the same parent would get the same code.
   - Choosing the file runs a **check only**. Problems are listed by line number, and
     the preview shows exactly what would be saved. *Import* writes everything in one
     transaction, or nothing.
   - To correct a draft, fix the spreadsheet and import again with *Replace*. Replacing is
     refused if a lesson, objective or role scope already uses one of the entries.
4. **Verify.** A second academic director opens the draft, checks every entry against the
   document using the page references, chooses the same PDF, and selects *Verify*. The
   database refuses if:
   - the verifier created the draft or entered any of it (`SOD_VIOLATION`);
   - the PDF's fingerprint differs from the recorded one (`SOURCE_MISMATCH`);
   - a subject has no chapter (`SYLLABUS_INCOMPLETE`).

   Once verified, the version **can't change**: no new entries, edits, deletions or
   imports, and its source can't be altered. It can only be retired.
5. **Link chapters to course pages** (optional, allowed after verification). Each syllabus
   chapter can point at an existing course chapter, which then lists its published visual
   lessons.
6. **Corrections later.** *Download as CSV* gives the tree in the import format. Create a
   new version, import that file, fix it, record the document, and verify the new version.

## Checking a file without the website

The same validator runs in the unit tests. To check a file locally:

```bash
npx tsx -e "import {planSyllabusImport} from './src/lib/cee-visual/syllabusImport'; \
  const p = planSyllabusImport(require('fs').readFileSync(process.argv[1], 'utf8')); \
  console.log(JSON.stringify({errors: p.errors, warnings: p.warnings, stats: p.stats}, null, 2))" syllabus.csv
```

## What is tested

- `src/lib/cee-visual/__tests__/syllabusImport.test.ts`: the CSV parser, every validation rule, the payload,
  and that an exported tree re-imports unchanged (formula cells included). 16 tests.
- `supabase/proposed/tests/cee_visual_foundation_test.sql`: roles; all-or-nothing import;
  replace, and replace refused when an entry is in use; every verification refusal; and
  the frozen state (insert, rename, delete, import, source change, delete, un-retire).
  23 checks in this section.
- `admin.integration.test.ts`: the same workflow through the real routes and PostgREST,
  including the export round trip and audit entries carrying the request id.
- Browser (Chrome): bad file → line-numbered errors; good file → preview → import → record
  document; the entering editor is told someone else must verify; a second director is
  stopped by the wrong PDF before submitting, then verifies with the right one; the version
  then shows no editing controls; the download re-imports; 390 px layout.
