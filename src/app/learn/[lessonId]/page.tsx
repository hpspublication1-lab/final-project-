import React from 'react';
import type { Metadata } from 'next';
import LessonPlayerClient from './components/LessonPlayerClient';

export const metadata: Metadata = {
  title: 'Lesson Player & Study Workspace — Samyak Tutor',
  description: 'Distraction-free educational lecture player with Bunny CDN streaming, timestamped note taking, and chapter quizzes on Samyak Tutor.',
};

export default async function LessonPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = await params;
  return <LessonPlayerClient lessonId={lessonId} />;
}
