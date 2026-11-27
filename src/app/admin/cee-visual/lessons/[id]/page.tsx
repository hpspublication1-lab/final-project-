import type { Metadata } from 'next';
import LessonEditorClient from './LessonEditorClient';

export const metadata: Metadata = {
  title: 'Visual lesson | Samyak Guru Admin',
  robots: { index: false, follow: false },
};

export default async function AdminVisualLessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <LessonEditorClient lessonId={id} />;
}
