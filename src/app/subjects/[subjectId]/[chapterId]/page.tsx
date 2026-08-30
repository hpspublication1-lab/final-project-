'use client';

import React, { use } from 'react';
import CanonicalChapterHub from '@/components/see/CanonicalChapterHub';

interface PageProps {
  params: Promise<{ subjectId: string; chapterId: string }>;
}

export default function ChapterDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  return (
    <CanonicalChapterHub
      subjectId={resolvedParams.subjectId}
      chapterId={resolvedParams.chapterId}
    />
  );
}
