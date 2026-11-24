import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { CeeApiError } from '@/lib/cee-visual/http';
import {
  db,
  hasProgramAccess,
  isFeatureEnabled,
  loadPublishedLesson,
  recomputeProgress,
  requireUuid,
  resolveVisual,
  toStudentView,
} from '@/lib/cee-visual/service.server';
import { getSessionUser } from '@/lib/supabase/route-auth';
import VisualLessonClient from './VisualLessonClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Visual lesson',
  robots: { index: false, follow: false },
};

export default async function VisualLessonPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId: raw } = await params;

  const client = db();
  // Until launch, the page simply doesn't exist.
  if (!(await isFeatureEnabled(client))) notFound();

  const user = await getSessionUser();
  if (!user?.id) redirect(`/login?redirect=${encodeURIComponent(`/cee/visual/${raw}`)}`);

  let lesson;
  try {
    lesson = await loadPublishedLesson(client, requireUuid(raw));
  } catch (e) {
    if (e instanceof CeeApiError && e.code === 'NOT_FOUND') notFound();
    throw e;
  }

  if (!(await hasProgramAccess({ id: user.id, email: user.email ?? null }, lesson.program))) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16">
        <h1 className="text-2xl font-bold text-foreground">{lesson.title}</h1>
        <p className="mt-3 text-muted-foreground">This visual lesson is part of the CEE course. Enrol to open it.</p>
        <Link
          href="/cee-medical-entrance"
          className="mt-6 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-dark"
        >
          See the CEE course
        </Link>
      </main>
    );
  }

  const [visual, progress] = await Promise.all([resolveVisual(client, lesson), recomputeProgress(client, user.id, lesson, false)]);
  return <VisualLessonClient lesson={toStudentView(lesson)} initialVisual={visual} initialProgress={progress} />;
}
