'use client';

/**
 * Published visual lessons for a course, for linking from existing course
 * pages. Returns an empty list whenever the feature is off, the visitor isn't
 * signed in, or nothing is published, so pages simply show nothing.
 */
import { useEffect, useState } from 'react';

export interface VisualLessonLink {
  id: string;
  title: string;
  topic: string;
  legacyChapterIds: string[];
}

const cache = new Map<string, Promise<VisualLessonLink[]>>();

function load(program: string): Promise<VisualLessonLink[]> {
  let p = cache.get(program);
  if (!p) {
    p = fetch(`/api/v1/cee/programs/${encodeURIComponent(program)}/published`)
      .then((r) => (r.ok ? r.json() : null))
      .then((b) => (Array.isArray(b?.data?.lessons) ? (b.data.lessons as VisualLessonLink[]) : []))
      .catch(() => []);
    cache.set(program, p);
  }
  return p;
}

export function usePublishedVisualLessons(program: string | null | undefined): VisualLessonLink[] {
  const [lessons, setLessons] = useState<VisualLessonLink[]>([]);
  useEffect(() => {
    if (!program) return;
    let live = true;
    void load(program).then((l) => live && setLessons(l));
    return () => {
      live = false;
    };
  }, [program]);
  return lessons;
}
