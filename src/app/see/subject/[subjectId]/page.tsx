import React from 'react';
import { notFound } from 'next/navigation';
import CanonicalSubjectWorkspace from '@/components/see/CanonicalSubjectWorkspace';
import { SEE_SUBJECT_HIERARCHY } from '@/lib/data/seeQuestionBankData';

interface PageProps {
  params: Promise<{ subjectId: string }>;
}

/**
 * Validates whether the given SEE subject exists in the canonical curriculum.
 */
export function isValidSeeSubject(subjectId: string): boolean {
  if (!subjectId || typeof subjectId !== 'string') return false;
  return SEE_SUBJECT_HIERARCHY.some((s) => s.id.toLowerCase() === subjectId.trim().toLowerCase());
}

export default async function DedicatedSeeSubjectPage({ params }: PageProps) {
  const { subjectId } = await params;

  if (!isValidSeeSubject(subjectId)) {
    notFound();
  }

  return <CanonicalSubjectWorkspace subjectId={subjectId} />;
}
