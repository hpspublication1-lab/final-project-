import type { CanonicalCourseId } from '@/contexts/ProgramContext';
import { FALLBACK_PRACTICE_QUESTIONS, type FallbackQuestion } from './practiceQuestionsFallback';

/**
 * Keeps the built-in question bank (practiceQuestionsFallback.ts) inside the course
 * and subject each question was written for.
 *
 * Before 23 Nov 2026 the practice page and both lesson players matched it loosely
 * ("science" matched CEE physics; a lesson's title could match any chapter) and,
 * when fewer than five matched, used the whole bank — so a SEE, IELTS or AI student
 * could be drilled on CEE biology. Now: exact subject, own course, or nothing.
 */
export const FALLBACK_SUBJECT_COURSE: Record<string, CanonicalCourseId> = {
  biology: 'cee_medical', chemistry: 'cee_medical', physics: 'cee_medical', mental_agility: 'cee_medical',
  compulsory_science: 'see_class_10', compulsory_math: 'see_class_10', optional_math: 'see_class_10',
  english: 'see_class_10', social_studies: 'see_class_10',
  loksewa_gk: 'lok_sewa', loksewa_iq: 'lok_sewa',
};

const SUBJECT_MAP: Record<string, string> = {
  // CEE
  biology: 'biology',
  chemistry: 'chemistry',
  physics: 'physics',
  'mental agility': 'mental_agility',
  mental_agility: 'mental_agility',
  mat: 'mental_agility',
  botany: 'biology',
  zoology: 'biology',

  // SEE
  'compulsory science': 'compulsory_science',
  'compulsory science & tech': 'compulsory_science',
  compulsory_science: 'compulsory_science',
  science: 'compulsory_science',
  'compulsory mathematics': 'compulsory_math',
  compulsory_math: 'compulsory_math',
  'compulsory math': 'compulsory_math',
  math: 'compulsory_math',
  mathematics: 'compulsory_math',
  'optional mathematics': 'optional_math',
  optional_math: 'optional_math',
  'opt math': 'optional_math',
  opt_math: 'optional_math',
  english: 'english',
  'social studies': 'social_studies',
  social: 'social_studies', // SEE route slug: /see/subject/social
  social_studies: 'social_studies',

  // Lok Sewa
  'general knowledge': 'loksewa_gk',
  'general knowledge (gk)': 'loksewa_gk',
  'general knowledge (gk / सामान्य ज्ञान)': 'loksewa_gk',
  loksewa_gk: 'loksewa_gk',
  gk: 'loksewa_gk',
  'general mental ability (iq / बौद्धिक परीक्षण)': 'loksewa_iq',
  'general mental ability': 'loksewa_iq',
  loksewa_iq: 'loksewa_iq',
  iq: 'loksewa_iq',
  'governance & constitution (शासन प्रणाली)': 'loksewa_governance',
  'governance & constitution': 'loksewa_governance',
  loksewa_governance: 'loksewa_governance',

  // IOE & NEB
  'engineering mathematics': 'engineering_math',
  'engineering mathematics (ioe 140m)': 'engineering_math',
  engineering_math: 'engineering_math',
  'computer science': 'neb_computer_science',
  'computer science & c programming': 'neb_computer_science',
  neb_computer_science: 'neb_computer_science',
};

export function normalizeSubjectSlug(subjectName: string): string {
  const clean = (subjectName || '').toLowerCase().trim();
  return SUBJECT_MAP[clean] || clean.replace(/\s+/g, '_');
}

/**
 * Built-in questions for one lesson: same course, same subject; narrowed to the
 * lesson's chapter when the bank has that exact chapter. Empty when nothing fits.
 */
export function bankQuestionsForLesson(
  course: CanonicalCourseId | null | undefined,
  subject: string | null | undefined,
  chapter?: string | null,
): FallbackQuestion[] {
  if (!course || !subject) return [];
  const slug = normalizeSubjectSlug(subject);
  if (FALLBACK_SUBJECT_COURSE[slug] !== course) return [];
  const pool = FALLBACK_PRACTICE_QUESTIONS.filter((q) => q.subjectSlug === slug);
  const want = (chapter || '').trim().toLowerCase();
  if (want) {
    const sameChapter = pool.filter((q) => q.chapterTitle.trim().toLowerCase() === want);
    if (sameChapter.length > 0) return sameChapter;
  }
  return pool;
}
