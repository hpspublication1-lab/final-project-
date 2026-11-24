import React from 'react';
import { notFound } from 'next/navigation';
import VisualLessonClient from './client';
import {
  CANONICAL_LESSONS_MAP,
} from '@/lib/cee/visual/canonicalLessons';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const lesson = CANONICAL_LESSONS_MAP[slug];

  if (lesson) {
    return {
      title: `${lesson.title} — Samyak CEE Mastery`,
      description: lesson.manifest.accessibility.description,
    };
  }

  return {
    title: 'Visual Lesson — Samyak CEE Mastery',
  };
}

export default async function VisualLessonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Retrieve approved published pilot lesson from canonical registry
  const lesson = CANONICAL_LESSONS_MAP[slug];

  if (!lesson) {
    notFound();
  }

  return <VisualLessonClient lesson={lesson} />;
}
