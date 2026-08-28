import React from 'react';
import SeeVideoPlayerClient from './components/SeeVideoPlayerClient';

export const metadata = {
  title: 'SEE Class 10 Video Lecture — Samyak Guru',
  description: 'Watch comprehensive Class 10 board exam video lectures with formula sheets and AI subjective evaluation.',
};

export default async function SeeLessonPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = await params;
  return <SeeVideoPlayerClient lessonId={lessonId} />;
}
