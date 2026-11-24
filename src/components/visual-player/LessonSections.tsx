'use client';

/**
 * Lesson text. A section counts as read once at least 60% of it (or the whole
 * viewport's worth) has been on screen for 4 seconds. Markdown is rendered
 * without raw HTML, so lesson text can't inject markup.
 */
import { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import type { LessonContent } from '@/lib/cee-visual/schemas';

const DWELL_MS = 4000;

function Section({ section, read, onRead }: { section: LessonContent['sections'][number]; read: boolean; onRead(key: string): void }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (read || !ref.current) return;
    let timer: number | undefined;
    const obs = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.intersectionRatio >= 0.6 || entry.intersectionRect.height >= window.innerHeight * 0.6;
        window.clearTimeout(timer);
        if (visible) timer = window.setTimeout(() => onRead(section.key), DWELL_MS);
      },
      { threshold: [0, 0.3, 0.6, 1] }
    );
    obs.observe(ref.current);
    return () => {
      window.clearTimeout(timer);
      obs.disconnect();
    };
  }, [read, onRead, section.key]);

  return (
    <section ref={ref} aria-labelledby={`sec-${section.key}`} className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id={`sec-${section.key}`} className="text-lg font-semibold text-foreground">
          {section.heading}
        </h2>
        {read && <span className="text-xs font-medium text-success">Read</span>}
      </div>
      <div className="prose prose-sm mt-2 max-w-none text-foreground dark:prose-invert">
        <ReactMarkdown skipHtml>{section.body}</ReactMarkdown>
      </div>
    </section>
  );
}

export default function LessonSections({
  content,
  readKeys,
  onRead,
}: {
  content: LessonContent;
  readKeys: ReadonlySet<string>;
  onRead(key: string): void;
}) {
  return (
    <div className="flex flex-col gap-4">
      {content.sections.map((s) => (
        <Section key={s.key} section={s} read={readKeys.has(s.key)} onRead={onRead} />
      ))}
    </div>
  );
}
