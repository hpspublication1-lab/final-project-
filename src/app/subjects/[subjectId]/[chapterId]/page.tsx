import React from 'react';
import type { Metadata } from 'next';
import ChapterDetailClient from './components/ChapterDetailClient';

export const metadata: Metadata = {
  title: 'Chapter Detail — Samyak CEE Mastery',
  description: 'Study chapter topics, watch videos, and practice MCQs for CEE 2026.',
};

interface PageProps {
  params: Promise<{ subjectId: string; chapterId: string }>;
}

export default async function ChapterDetailPage({ params }: PageProps) {
  const { subjectId, chapterId } = await params;
  return <ChapterDetailClient subjectId={subjectId} chapterId={chapterId} />;
}
