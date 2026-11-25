import { describe, expect, it } from 'vitest';
import { codeFromTitle, exportSyllabusCsv, IMPORT_LIMITS, parseCsv, planSyllabusImport, toImportPayload } from '../syllabusImport';

// Test data only: placeholder titles, not syllabus content.
const ok = [
  'level,title,code,source_ref',
  '1,Subject A,,p. 1',
  '2,Chapter A1,,p. 1',
  '3,Topic A1a,,"p. 2, 1.1"',
  '4,Sub-topic A1a-i,,p. 2',
  '3,Topic A1b,,p. 2',
  '2,Chapter A2,,p. 3',
  '1,Subject B,subj-b,p. 4',
  '2,Chapter B1,,p. 4',
].join('\n');

const msgs = (csv: string) => planSyllabusImport(csv).errors.map((e) => `${e.row ?? '-'}: ${e.message}`);

describe('parseCsv', () => {
  it('handles quotes, doubled quotes, commas and newlines inside quotes, CRLF', () => {
    const { rows, error } = parseCsv('a,"b, c","say ""hi"""\r\n1,"two\nlines",3\r\n');
    expect(error).toBeNull();
    expect(rows.map((r) => r.cells)).toEqual([
      ['a', 'b, c', 'say "hi"'],
      ['1', 'two\nlines', '3'],
    ]);
    expect(rows[1].line).toBe(2);
  });
  it('rejects an unclosed quote and stray text after a quote', () => {
    expect(parseCsv('a,"b\n1,2').error).toMatch(/never closed/);
    expect(parseCsv('a,"b"c').error).toMatch(/after a closing quote/);
    expect(parseCsv('a,b"c"').error).toMatch(/can only start a field/);
  });
});

describe('codeFromTitle', () => {
  it('makes ASCII codes, dropping accents, and nothing from non-Latin titles', () => {
    expect(codeFromTitle('Cell Biology & Genetics (Part 1)')).toBe('cell-biology-genetics-part-1');
    expect(codeFromTitle('Électrochimie')).toBe('electrochimie');
    expect(codeFromTitle('जीवविज्ञान')).toBe('');
    expect(codeFromTitle('x'.repeat(80)).length).toBeLessThanOrEqual(64);
  });
});

describe('planSyllabusImport', () => {
  it('builds the tree in document order with parents, types, sort keys and stats', () => {
    const plan = planSyllabusImport(ok);
    expect(plan.errors).toEqual([]);
    expect(plan.nodes.map((n) => [n.row, n.nodeType, n.path, n.parentIndex, n.sortKey])).toEqual([
      [2, 'SUBJECT', 'subject-a', null, 10],
      [3, 'CHAPTER', 'subject-a/chapter-a1', 0, 10],
      [4, 'TOPIC', 'subject-a/chapter-a1/topic-a1a', 1, 10],
      [5, 'TOPIC', 'subject-a/chapter-a1/topic-a1a/sub-topic-a1a-i', 2, 10],
      [6, 'TOPIC', 'subject-a/chapter-a1/topic-a1b', 1, 20],
      [7, 'CHAPTER', 'subject-a/chapter-a2', 0, 20],
      [8, 'SUBJECT', 'subj-b', null, 20],
      [9, 'CHAPTER', 'subj-b/chapter-b1', 6, 10],
    ]);
    expect(plan.nodes[2].sourceRef).toBe('p. 2, 1.1');
    expect(plan.stats).toEqual({ subjects: 2, chapters: 3, topics: 3, deepestLevel: 4, withoutSourceRef: 0 });
    expect(plan.warnings).toEqual([]);
  });

  it('accepts columns in any order, a BOM, blank lines and extra columns (with a warning)', () => {
    const plan = planSyllabusImport('﻿Title,Level,marks\n\nSubject A,1,40\nChapter A1,2,\n');
    expect(plan.errors).toEqual([]);
    expect(plan.nodes.map((n) => n.title)).toEqual(['Subject A', 'Chapter A1']);
    expect(plan.warnings.map((w) => w.message)).toEqual(
      expect.arrayContaining([expect.stringMatching(/aren’t imported: marks/), expect.stringMatching(/2 of 2 entries have no source reference/)])
    );
  });

  it('explains structural mistakes with line numbers', () => {
    expect(msgs('level,title\n2,Chapter first')).toEqual(['2: The first entry must be a subject (level 1).']);
    expect(msgs('level,title\n1,S\n3,Skipped a level')).toEqual(['3: Level 3 can’t follow level 1; levels go down one step at a time.']);
    expect(msgs('level,title\n1,S\nx,Bad level')[0]).toMatch(/^3: Level must be a whole number/);
    expect(msgs('level,title\n1,S\n2,')[0]).toBe('3: The title is empty.');
  });

  it('rejects duplicate codes under the same parent but allows them under different parents', () => {
    expect(msgs('level,title\n1,S\n2,Intro\n2,Intro')[0]).toMatch(/^4: Two entries under the same parent have the code “intro” \(the other is on line 3\)/);
    expect(planSyllabusImport('level,title\n1,S\n2,C1\n3,Intro\n2,C2\n3,Intro').errors).toEqual([]);
  });

  it('refuses template example rows, so placeholder content cannot be imported', () => {
    expect(msgs('level,title\n1,EXAMPLE subject (replace)')[0]).toMatch(/example row from the template/);
  });

  it('needs a code when the title has no Latin letters, and checks given codes', () => {
    expect(msgs('level,title\n1,जीवविज्ञान')[0]).toMatch(/Add a code/);
    expect(planSyllabusImport('level,title,code\n1,जीवविज्ञान,biology').errors).toEqual([]);
    expect(msgs('level,title,code\n1,S,Bad Code')[0]).toMatch(/lowercase letters, digits/);
  });

  it('catches spreadsheet export problems: semicolons, missing columns, stray fields, control characters', () => {
    expect(msgs('level;title\n1;S')[0]).toMatch(/separated by commas/);
    expect(msgs('lvl,title\n1,S')[0]).toMatch(/“level” is missing/);
    expect(msgs('level,title\n1,Cells, tissues')[0]).toMatch(/more fields than there are columns/);
    expect(msgs('level,title\n1,Bad\u0007bell')[0]).toMatch(/control characters/);
    expect(msgs('level,title,title\n1,S,S')[0]).toMatch(/appears twice/);
  });

  it('enforces size and row limits', () => {
    expect(msgs('x'.repeat(IMPORT_LIMITS.maxBytes + 1))[0]).toMatch(/larger than 1 MB/);
    const many = ['level,title', '1,S', '2,C', ...Array.from({ length: IMPORT_LIMITS.maxRows }, (_, i) => `3,T${i}`)].join('\n');
    expect(msgs(many)[0]).toMatch(/the limit is 5000/);
  });

  it('warns about subjects without chapters (verification will refuse them)', () => {
    const plan = planSyllabusImport('level,title,source_ref\n1,S1,p1\n1,S2,p2\n2,C,p2');
    expect(plan.errors).toEqual([]);
    expect(plan.warnings.map((w) => w.message)).toEqual([expect.stringMatching(/“S1” has no chapters/)]);
  });

  it('returns no nodes at all when anything is wrong', () => {
    const plan = planSyllabusImport('level,title\n1,S\n3,Bad');
    expect(plan.errors).toHaveLength(1);
    expect(plan.nodes).toEqual([]);
  });
});

describe('toImportPayload', () => {
  it('assigns ids and points children at their parents, parents first', () => {
    let i = 0;
    const payload = toImportPayload(planSyllabusImport(ok).nodes, () => `id-${i++}`);
    expect(payload[0]).toMatchObject({ id: 'id-0', parent_id: null, node_type: 'SUBJECT', code: 'subject-a', sort_key: 10, source_ref: 'p. 1' });
    expect(payload[3]).toMatchObject({ id: 'id-3', parent_id: 'id-2', node_type: 'TOPIC' });
    expect(payload[7]).toMatchObject({ parent_id: 'id-6' });
  });
});

describe('exportSyllabusCsv', () => {
  it('round-trips: an exported tree re-imports to the same entries', () => {
    let i = 0;
    const payload = toImportPayload(planSyllabusImport(ok).nodes, () => `n${i++}`);
    // shuffled, as a database would return them
    const rows = [...payload].reverse().map((p) => ({ id: p.id, parentId: p.parent_id, code: p.code, title: p.title, sortKey: p.sort_key, sourceRef: p.source_ref }));
    const again = planSyllabusImport(exportSyllabusCsv(rows));
    expect(again.errors).toEqual([]);
    expect(again.nodes.map((n) => [n.path, n.title, n.sourceRef])).toEqual(planSyllabusImport(ok).nodes.map((n) => [n.path, n.title, n.sourceRef]));
  });

  it('neutralises spreadsheet formulas on export and restores them on import', () => {
    const csv = exportSyllabusCsv([{ id: 'a', parentId: null, code: 'calc', title: '=HYPERLINK("http://x")', sortKey: 10, sourceRef: '+p. 1' }]);
    expect(csv).toContain(`"'=HYPERLINK(""http://x"")"`);
    expect(csv).toContain(`'+p. 1`);
    const back = planSyllabusImport(csv);
    expect(back.nodes[0].title).toBe('=HYPERLINK("http://x")');
    expect(back.nodes[0].sourceRef).toBe('+p. 1');
  });
});
