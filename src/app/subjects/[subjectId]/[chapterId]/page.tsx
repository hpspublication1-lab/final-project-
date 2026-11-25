import React from 'react';
import { notFound } from 'next/navigation';
import CanonicalChapterHub from '@/components/see/CanonicalChapterHub';
import { SEE_SUBJECT_HIERARCHY } from '@/lib/data/seeQuestionBankData';

interface PageProps {
  params: Promise<{ subjectId: string; chapterId: string }>;
}

/**
 * Validates whether the given subject and chapter combination exists in the canonical curriculum hierarchy.
 */
export function isValidSubjectChapter(subjectId: string, chapterId: string): boolean {
  if (!subjectId || !chapterId) return false;

  const cleanSubj = subjectId.trim().toLowerCase();
  const cleanChap = chapterId.trim().toLowerCase();

  const subject = SEE_SUBJECT_HIERARCHY.find((s) => s.id.toLowerCase() === cleanSubj);
  if (!subject) return false;

  const chapterIndex = subject.chapters.findIndex(
    (c, idx) =>
      ('unit-' + (idx + 1)).toLowerCase() === cleanChap ||
      c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').includes(cleanChap) ||
      c.name.toLowerCase().includes(cleanChap)
  );

  return chapterIndex !== -1;
}

export default async function ChapterDetailPage({ params }: PageProps) {
  const { subjectId, chapterId } = await params;

  if (!isValidSubjectChapter(subjectId, chapterId)) {
    notFound();
  }

  return (
    <CanonicalChapterHub
      subjectId={subjectId}
      chapterId={chapterId}
    />
  );
}
