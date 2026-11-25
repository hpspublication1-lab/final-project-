/**
 * Syllabus import: a CSV outline of the official document, validated before
 * anything is written. Pure functions, shared by the dry run, the real import
 * and the export (so an exported tree re-imports unchanged).
 *
 * Format, one row per entry, in the document's order:
 *
 *   level,title,code,source_ref
 *   1,<subject>,,p. 2
 *   2,<chapter>,,p. 2
 *   3,<topic>,,"p. 3, 1.2"
 *   4,<sub-topic>,,p. 3
 *
 * level 1 = subject, 2 = chapter, 3 and deeper = topics. Each row belongs to the
 * closest row above it with a level one lower. `code` is optional (made from the
 * title); `source_ref` is where the verifier finds the entry in the document.
 */

export const IMPORT_LIMITS = { maxBytes: 1024 * 1024, maxRows: 5000, maxLevel: 33, maxTitle: 200, maxRef: 200 } as const;

export type ImportNodeType = 'SUBJECT' | 'CHAPTER' | 'TOPIC';

export interface PlannedNode {
  row: number; // 1-based line in the file, for messages
  level: number;
  nodeType: ImportNodeType;
  code: string;
  title: string;
  sourceRef: string | null;
  parentIndex: number | null; // index into nodes
  sortKey: number;
  path: string; // codes joined with '/'
}

export interface ImportIssue {
  row: number | null;
  column?: string;
  message: string;
}

export interface ImportPlan {
  nodes: PlannedNode[];
  errors: ImportIssue[];
  warnings: ImportIssue[];
  stats: { subjects: number; chapters: number; topics: number; deepestLevel: number; withoutSourceRef: number };
}

const CODE = /^[a-z0-9][a-z0-9_-]{0,63}$/;
const CONTROL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;
const FORMULA_START = /^[=+\-@\t\r]/;
const KNOWN = ['level', 'title', 'code', 'source_ref'] as const;
const MAX_ERRORS = 100;

/** RFC 4180 CSV: quoted fields, doubled quotes, CRLF or LF. Returns rows with their starting line. */
export function parseCsv(text: string): { rows: { line: number; cells: string[] }[]; error: string | null } {
  const rows: { line: number; cells: string[] }[] = [];
  let cells: string[] = [];
  let cell = '';
  let quoted = false;
  let line = 1;
  let rowLine = 1;
  let afterQuote = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          quoted = false;
          afterQuote = true;
        }
      } else {
        if (ch === '\n') line++;
        cell += ch;
      }
      continue;
    }
    if (ch === '"') {
      if (cell.length > 0 || afterQuote) return { rows, error: `Line ${line}: a quote can only start a field. Put the whole field in quotes.` };
      quoted = true;
    } else if (ch === ',') {
      cells.push(cell);
      cell = '';
      afterQuote = false;
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      cells.push(cell);
      rows.push({ line: rowLine, cells });
      cells = [];
      cell = '';
      afterQuote = false;
      line++;
      rowLine = line;
    } else {
      if (afterQuote) return { rows, error: `Line ${line}: text after a closing quote. Put the whole field in quotes.` };
      cell += ch;
    }
  }
  if (quoted) return { rows, error: `Line ${rowLine}: a quoted field is never closed.` };
  if (cell.length > 0 || cells.length > 0) {
    cells.push(cell);
    rows.push({ line: rowLine, cells });
  }
  return { rows, error: null };
}

/** A code from a title: ASCII letters and digits joined by hyphens. Empty when the title has none. */
export function codeFromTitle(title: string): string {
  return title
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64)
    .replace(/-+$/g, '');
}

/** Undo the export's protection against spreadsheet formulas ('=…' was written as "'=…"). */
function unprotect(v: string): string {
  return v.startsWith("'") && FORMULA_START.test(v.slice(1)) ? v.slice(1) : v;
}

const typeFor = (level: number): ImportNodeType => (level === 1 ? 'SUBJECT' : level === 2 ? 'CHAPTER' : 'TOPIC');

export function planSyllabusImport(csv: string): ImportPlan {
  const errors: ImportIssue[] = [];
  const warnings: ImportIssue[] = [];
  const nodes: PlannedNode[] = [];
  const stats = { subjects: 0, chapters: 0, topics: 0, deepestLevel: 0, withoutSourceRef: 0 };
  const done = () => ({ nodes: errors.length ? [] : nodes, errors: errors.slice(0, MAX_ERRORS), warnings, stats });
  const err = (row: number | null, message: string, column?: string) => {
    errors.push({ row, message, ...(column ? { column } : {}) });
  };

  if (new TextEncoder().encode(csv).length > IMPORT_LIMITS.maxBytes) {
    err(null, `The file is larger than ${IMPORT_LIMITS.maxBytes / 1024 / 1024} MB.`);
    return done();
  }
  const text = csv.replace(/^﻿/, '');
  const parsed = parseCsv(text);
  if (parsed.error) {
    err(null, parsed.error);
    return done();
  }
  const rows = parsed.rows.filter((r) => r.cells.some((c) => c.trim() !== ''));
  if (rows.length === 0) {
    err(null, 'The file is empty.');
    return done();
  }

  const header = rows[0].cells.map((h) => h.trim().toLowerCase());
  if (header.length === 1 && /[;\t]/.test(rows[0].cells[0])) {
    err(rows[0].line, 'Columns must be separated by commas. In your spreadsheet, save as “CSV (comma-separated)”.');
    return done();
  }
  const col = (name: (typeof KNOWN)[number]) => header.indexOf(name);
  for (const required of ['level', 'title'] as const) {
    if (col(required) === -1) err(rows[0].line, `The first row must name the columns; “${required}” is missing.`, required);
  }
  const dup = header.find((h, i) => h && header.indexOf(h) !== i);
  if (dup) err(rows[0].line, `The column “${dup}” appears twice.`, dup);
  if (errors.length) return done();
  const ignored = header.filter((h) => h && !(KNOWN as readonly string[]).includes(h));
  if (ignored.length) warnings.push({ row: rows[0].line, message: `These columns aren’t imported: ${ignored.join(', ')}.` });

  const data = rows.slice(1);
  if (data.length === 0) {
    err(null, 'The file has column names but no entries.');
    return done();
  }
  if (data.length > IMPORT_LIMITS.maxRows) {
    err(null, `The file has ${data.length} entries; the limit is ${IMPORT_LIMITS.maxRows}.`);
    return done();
  }

  const get = (cells: string[], name: (typeof KNOWN)[number]) => {
    const i = col(name);
    return i === -1 ? '' : unprotect((cells[i] ?? '').trim());
  };
  const stack: number[] = []; // stack[level-1] = index of the latest node at that level
  const childCount = new Map<number | null, number>();
  const seenPath = new Map<string, number>();

  for (const r of data) {
    if (errors.length >= MAX_ERRORS) break;
    if (r.cells.length > header.length && r.cells.slice(header.length).some((c) => c.trim() !== '')) {
      err(r.line, 'This row has more fields than there are columns. Is there an unquoted comma in a title?');
      continue;
    }
    const levelRaw = get(r.cells, 'level');
    const title = get(r.cells, 'title').replace(/\s+/g, ' ');
    const codeRaw = get(r.cells, 'code');
    const ref = get(r.cells, 'source_ref');

    if (!/^\d{1,2}$/.test(levelRaw) || Number(levelRaw) < 1 || Number(levelRaw) > IMPORT_LIMITS.maxLevel) {
      err(r.line, `Level must be a whole number from 1 to ${IMPORT_LIMITS.maxLevel} (1 = subject, 2 = chapter, 3 or more = topic).`, 'level');
      continue;
    }
    const level = Number(levelRaw);
    if (level > stack.length + 1) {
      err(
        r.line,
        stack.length === 0 ? 'The first entry must be a subject (level 1).' : `Level ${level} can’t follow level ${stack.length}; levels go down one step at a time.`,
        'level'
      );
      continue;
    }
    if (!title) {
      err(r.line, 'The title is empty.', 'title');
      continue;
    }
    if (title.length > IMPORT_LIMITS.maxTitle) err(r.line, `The title is longer than ${IMPORT_LIMITS.maxTitle} characters.`, 'title');
    if (CONTROL.test(title) || CONTROL.test(ref)) err(r.line, 'The row contains invisible control characters.');
    if (/^example\b/i.test(title)) err(r.line, 'This is an example row from the template. Delete it and enter the official syllabus.', 'title');
    if (ref.length > IMPORT_LIMITS.maxRef) err(r.line, `The source reference is longer than ${IMPORT_LIMITS.maxRef} characters.`, 'source_ref');

    let code = codeRaw;
    if (code) {
      if (!CODE.test(code)) {
        err(r.line, 'The code may use lowercase letters, digits, - and _ (up to 64), starting with a letter or digit.', 'code');
        continue;
      }
    } else {
      code = codeFromTitle(title);
      if (!code) {
        err(r.line, 'Add a code: the title has no English letters or digits to make one from.', 'code');
        continue;
      }
    }

    stack.length = level - 1;
    const parentIndex = level === 1 ? null : stack[level - 2];
    const parentPath = parentIndex === null ? '' : nodes[parentIndex].path + '/';
    const path = parentPath + code;
    const clash = seenPath.get(path);
    if (clash !== undefined) {
      err(r.line, `Two entries under the same parent have the code “${code}” (the other is on line ${clash}). Give one of them its own code.`, 'code');
      continue;
    }
    seenPath.set(path, r.line);

    const order = (childCount.get(parentIndex) ?? 0) + 1;
    childCount.set(parentIndex, order);
    const nodeType = typeFor(level);
    nodes.push({ row: r.line, level, nodeType, code, title, sourceRef: ref || null, parentIndex, sortKey: order * 10, path });
    stack[level - 1] = nodes.length - 1;

    if (nodeType === 'SUBJECT') stats.subjects++;
    else if (nodeType === 'CHAPTER') stats.chapters++;
    else stats.topics++;
    stats.deepestLevel = Math.max(stats.deepestLevel, level);
    if (!ref) stats.withoutSourceRef++;
  }

  if (errors.length === 0) {
    const withChapter = new Set(nodes.filter((n) => n.nodeType === 'CHAPTER').map((n) => n.parentIndex));
    for (const [i, n] of nodes.entries()) {
      if (n.nodeType === 'SUBJECT' && !withChapter.has(i)) {
        warnings.push({ row: n.row, message: `“${n.title}” has no chapters. It can be imported, but the syllabus can’t be verified until it has one.` });
      }
    }
    if (stats.withoutSourceRef > 0) {
      warnings.push({
        row: null,
        message: `${stats.withoutSourceRef} of ${nodes.length} entries have no source reference. The verifier will have to find them in the document without one.`,
      });
    }
  }
  return done();
}

/** Database payload, parents first, with ids assigned here so children can point at them. */
export function toImportPayload(nodes: PlannedNode[], newId: () => string) {
  const ids = nodes.map(() => newId());
  return nodes.map((n, i) => ({
    id: ids[i],
    parent_id: n.parentIndex === null ? null : ids[n.parentIndex],
    node_type: n.nodeType,
    code: n.code,
    title: n.title,
    sort_key: n.sortKey,
    source_ref: n.sourceRef,
  }));
}

function csvCell(v: string): string {
  const safe = FORMULA_START.test(v) ? `'${v}` : v; // a spreadsheet must not run it as a formula
  return /[",\r\n]/.test(safe) || safe !== safe.trim() ? `"${safe.replace(/"/g, '""')}"` : safe;
}

/** The tree as an import file: same columns, document order (sort key, then title). */
export function exportSyllabusCsv(
  nodes: { id: string; parentId: string | null; code: string; title: string; sortKey: number; sourceRef: string | null }[]
): string {
  const kids = new Map<string | null, typeof nodes>();
  for (const n of nodes) kids.set(n.parentId, [...(kids.get(n.parentId) ?? []), n]);
  for (const list of kids.values()) list.sort((a, b) => a.sortKey - b.sortKey || a.title.localeCompare(b.title));
  const lines = ['level,title,code,source_ref'];
  const walk = (parent: string | null, level: number) => {
    if (level > IMPORT_LIMITS.maxLevel) return;
    for (const n of kids.get(parent) ?? []) {
      lines.push([String(level), csvCell(n.title), csvCell(n.code), csvCell(n.sourceRef ?? '')].join(','));
      walk(n.id, level + 1);
    }
  };
  walk(null, 1);
  return lines.join('\r\n') + '\r\n';
}
