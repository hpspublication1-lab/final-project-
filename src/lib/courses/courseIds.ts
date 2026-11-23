import type { CanonicalCourseId } from '@/contexts/ProgramContext';

/**
 * One place that says which stored values mean which course.
 *
 * The same course is spelled differently across the database: `programs` has
 * canonical rows (`cee_medical`) and legacy alias rows (`cee`), and content rows
 * carry `program_type` values from both sets. Readers that compare one exact
 * string miss the other half; readers that fall back to CEE file everything
 * unknown under CEE. These helpers do neither.
 *
 * Unlike normalizeCourseId() in ProgramContext — which turns anything it doesn't
 * recognise into CEE, and is still used for UI defaults — parseCourseId()
 * returns null for an unknown value. Data filtering must use these.
 */

export const PROGRAM_VALUES: Record<CanonicalCourseId, readonly string[]> = {
  cee_medical: ['cee_medical', 'cee'],
  see_class_10: ['see_class_10', 'see'],
  ielts: ['ielts', 'english'],
  digital_marketing: ['digital_marketing'],
  artificial_intelligence: ['artificial_intelligence', 'ai'],
  ioe_engineering: ['ioe_engineering', 'ioe', 'engineering'],
  lok_sewa: ['lok_sewa', 'loksewa'],
  neb_class_11: ['neb_class_11', 'class11'],
  neb_class_12: ['neb_class_12', 'class12'],
};

/**
 * Stored values that cannot be assigned to one course without a person
 * deciding. `digital` is the legacy alias for "Digital Skills & AI Academy",
 * which became two courses. Content carrying it is shown in neither and listed
 * for review.
 */
export const AMBIGUOUS_PROGRAM_VALUES: readonly string[] = ['digital'];

/** Courses that have a row in the `programs` table. The rest exist only in code. */
export const COURSES_WITH_DB_PROGRAM: readonly CanonicalCourseId[] = [
  'cee_medical',
  'see_class_10',
  'ielts',
  'digital_marketing',
  'artificial_intelligence',
];

const VALUE_TO_COURSE: ReadonlyMap<string, CanonicalCourseId> = new Map(
  (Object.entries(PROGRAM_VALUES) as [CanonicalCourseId, readonly string[]][]).flatMap(([course, values]) =>
    values.map((v) => [v, course] as const)
  )
);

/** Exact match on a canonical id or a known alias. Unknown, empty or ambiguous → null. */
export function parseCourseId(raw: string | null | undefined): CanonicalCourseId | null {
  const v = String(raw ?? '').trim().toLowerCase();
  if (!v || AMBIGUOUS_PROGRAM_VALUES.includes(v)) return null;
  return VALUE_TO_COURSE.get(v) ?? null;
}

/** Every stored `program_type` value that belongs to this course. */
export function programValuesFor(course: CanonicalCourseId): readonly string[] {
  return PROGRAM_VALUES[course];
}

/** True when a row's stored program value belongs to this course. Empty and ambiguous values never do. */
export function belongsToCourse(storedValue: string | null | undefined, course: CanonicalCourseId): boolean {
  return parseCourseId(storedValue) === course;
}

/**
 * Strict mode reads course ownership only from `program_type`. It is off until
 * the read-only audit (supabase/audit/course_isolation_audit.sql) shows the
 * stored values can be trusted — today most uploads were saved with the
 * database default 'cee'. Off, the transitional rules each page used before
 * stay, minus everything that was wrong regardless of the data.
 */
export function strictCourseIsolation(): boolean {
  return process.env.NEXT_PUBLIC_STRICT_COURSE_ISOLATION === 'on';
}

// ── Which course does a stored row belong to? ──────────────────────────────

/** Whole-word match without lookbehind (older iOS Safari can't parse it); "_" and "-" count as separators. */
const word = (w: string) => new RegExp(`(^|[^a-z0-9])(${w})([^a-z0-9]|$)`);

/**
 * Course words that can appear in a title, slug or name. Used only by the
 * transitional rules below, and only to tell courses apart — never to pull a
 * row into a course it has no tie to. "Band", "seed" and "main" match nothing.
 */
const TITLE_SIGNALS: ReadonlyArray<readonly [CanonicalCourseId, RegExp]> = [
  ['see_class_10', word('see|class[ _-]?10')],
  ['neb_class_11', word('class[ _-]?11|grade[ _-]?11')],
  ['neb_class_12', word('class[ _-]?12|grade[ _-]?12')],
  ['ielts', word('ielts')],
  ['digital_marketing', word('marketing')],
  ['artificial_intelligence', word('ai|artificial[ _-]intelligence|python|prompt[ _-]engineering')],
  ['ioe_engineering', word('ioe|engineering')],
  ['lok_sewa', word('lok[ _-]?sewa|loksewa')],
];

/** The one course a piece of text names, 'ambiguous' if it names several, null if none. */
export function courseFromTitle(text: string | null | undefined): CanonicalCourseId | 'ambiguous' | null {
  const t = String(text ?? '').toLowerCase();
  const hits = new Set(TITLE_SIGNALS.filter(([, re]) => re.test(t)).map(([c]) => c));
  // "Prompt engineering" is AI, not IOE.
  if (hits.has('artificial_intelligence') && hits.has('ioe_engineering') && word('prompt[ _-]engineering').test(t)) {
    hits.delete('ioe_engineering');
  }
  if (hits.size > 1) return 'ambiguous';
  return hits.size === 1 ? [...hits][0] : null;
}

export interface CourseOwnedRow {
  program_type?: string | null;
  title?: string | null;
  slug?: string | null;
  name?: string | null;
  display_name?: string | null;
}

/**
 * The course a subject, batch, exam or note belongs to, or null if it can't
 * be placed — and null means it is shown in no course.
 *
 * Strict mode: `program_type` only.
 * Transitional mode: `program_type` when it names a course other than CEE;
 * 'cee' proves nothing on its own, because it is also the column default every
 * untagged upload received. Then the course words in the row's own title, slug
 * or name. Then 'cee' as stored. Rows naming several courses are left out.
 */
export function resolveRowCourse(row: CourseOwnedRow | null | undefined): CanonicalCourseId | null {
  if (!row) return null;
  const stored = String(row.program_type ?? '').trim().toLowerCase();
  const explicit = parseCourseId(stored);
  if (strictCourseIsolation()) return explicit;
  if (AMBIGUOUS_PROGRAM_VALUES.includes(stored)) return null;
  if (explicit && explicit !== 'cee_medical') return explicit;
  const fromTitle = courseFromTitle([row.slug, row.name, row.display_name, row.title].filter(Boolean).join(' '));
  if (fromTitle === 'ambiguous') return null;
  return fromTitle ?? explicit;
}

/** `program_type` is VARCHAR(20) in every content table. */
const PROGRAM_TYPE_MAX = 20;

/**
 * The value to write into `program_type` for a course: its canonical id, or its
 * shortest alias when the id doesn't fit ("artificial_intelligence" is 23
 * characters, so AI is stored as "ai").
 */
export function storedProgramValue(course: CanonicalCourseId): string {
  const values = PROGRAM_VALUES[course];
  return values.find((v) => v.length <= PROGRAM_TYPE_MAX) ?? values.reduce((a, b) => (b.length < a.length ? b : a));
}

/**
 * Every course, for server code. ProgramContext is a client module ('use client'):
 * a value imported from it into a route handler is not the real object, so
 * routes take the list and names from here. A test keeps them equal to COURSES_MAP.
 */
export const ALL_COURSE_IDS = Object.keys(PROGRAM_VALUES) as CanonicalCourseId[];

export const COURSE_TITLES: Record<CanonicalCourseId, string> = {
  cee_medical: 'Samyak CEE — Medical Entrance Prep',
  see_class_10: 'Samyak SEE — Class 10 Board Exam',
  neb_class_11: 'Samyak Class 11 — NEB Science & Math Foundation',
  neb_class_12: 'Samyak Class 12 — NEB Board Topper & Entrance Bridge',
  ioe_engineering: 'Samyak IOE — BE Engineering Entrance Prep',
  lok_sewa: 'Samyak Lok Sewa — Public Service Commission Prep',
  ielts: 'Samyak IELTS — English Language Mastery',
  digital_marketing: 'Samyak Digital — Career & Marketing Skills',
  artificial_intelligence: 'Samyak AI — AI & Python Academy',
};
