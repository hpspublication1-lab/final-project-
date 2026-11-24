# Curriculum Hierarchy and Cross-Program Isolation

## Canonical hierarchy
Platform → Program (CEE, IELTS, IOE...) → exam program/group → syllabus version → subject → chapter → topic → learning objective → lesson revision → linked asset version and assessment.

CEE example: CEE → applicable exam program → verified syllabus version → Biology → Zoology → Human Physiology → Circulatory System → Human Heart. Other paths: Biology/Botany, Chemistry, Physics, Mental Agility.

## Isolation requirements
- All read/write queries enforce **program scope**, syllabus version and permission scope on server; never rely solely on frontend filtering.
- Explicit mapping tables for intentionally shared lessons/assets. No implicit sharing based on generic `category`, title, or keywords.
- Search index carries program ID, syllabus ID, publication state and access scope.
- AI retrieval constrained to authorized, approved materials for current program.
- Admin selectors scoped by default; moving content between programs requires explicit authorization and review.
- Student sees only published and enrolled content. Drafts are invisible outside authorized previews.
- Preserve existing records: audit erroneous mappings, propose reversible repair, get approval before applying.

## Syllabus governance
Store official source URL/document, publication date, verification status, reviewer and mapping notes. Keep version immutable once approved. A new syllabus creates new mappings; it does not rewrite historical lesson/attempt records. Content must not publish against unverified mapping.

## Empty states
`No visual lessons have been published for this topic yet.` No fabricated thumbnails, instructor names, progress or questions. Development fixtures must use isolated environment and explicit labels.

## Example isolation tests
- IELTS resource cannot appear in CEE results without approved mapping.
- Lokseva resource cannot appear in IOE dashboard.
- Unauthorized editor cannot change Biology mappings outside assigned scope.
- New syllabus release does not mutate previous attempts or published lessons.
