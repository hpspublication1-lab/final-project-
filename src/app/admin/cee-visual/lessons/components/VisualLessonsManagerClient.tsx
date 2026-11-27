'use client';

/**
 * CEE visual lessons: list, search, and create. Ported from the parallel
 * build's studio onto /api/v1/cee/admin; lessons now map to a real syllabus
 * topic instead of free-text subject/chapter fields.
 */
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import {
  AccessNotice,
  buttonPrimary,
  buttonSecondary,
  ceeAdmin,
  CeeAdminError,
  inputClass,
  nodePaths,
  PageShell,
  StatusBadge,
  useCeeData,
  type CurriculumView,
} from '../../shared';

interface LessonItem {
  id: string;
  slug: string;
  title: string;
  topic: { id: string; title: string; mappingStatus: string } | null;
  latestRevision: { id: string; number: number; status: string; updatedAt: string } | null;
  publication: { id: string; publishedAt: string; revisionNumber: number | null } | null;
  createdAt: string;
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96);

export default function VisualLessonsManagerClient() {
  const router = useRouter();
  const lessons = useCeeData<{ lessons: LessonItem[] }>('/lessons?program=cee_medical');
  const curriculum = useCeeData<CurriculumView>('/curriculum?program=cee_medical');
  const paths = useMemo(() => nodePaths(curriculum.data), [curriculum.data]);

  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('ALL');
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [nodeId, setNodeId] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const list = lessons.data?.lessons ?? [];
  const shown = list.filter((l) => {
    const q = query.trim().toLowerCase();
    const text = `${l.title} ${l.slug} ${l.topic ? (paths.get(l.topic.id)?.path ?? l.topic.title) : ''}`.toLowerCase();
    const st = l.publication ? 'PUBLISHED' : (l.latestRevision?.status ?? 'DRAFT');
    return (!q || text.includes(q)) && (status === 'ALL' || st === status || l.latestRevision?.status === status);
  });

  const topics = useMemo(
    () =>
      [...paths.entries()]
        .filter(([, v]) => v.type !== 'SUBJECT')
        .sort((a, b) => a[1].path.localeCompare(b[1].path)),
    [paths]
  );

  const count = (pred: (l: LessonItem) => boolean) => list.filter(pred).length;

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      const r = await ceeAdmin<{ id: string }>('/lessons', { method: 'POST', json: { program: 'cee_medical', title: title.trim(), slug, nodeId } });
      router.push(`/admin/cee-visual/lessons/${r.id}`);
    } catch (err) {
      setFormError(err instanceof CeeAdminError ? (err.code === 'STATE_CONFLICT' ? 'That web address is already used by another lesson.' : err.message) : String(err));
      setSaving(false);
    }
  };

  const blocking = lessons.error ?? curriculum.error;

  return (
    <PageShell
      title="Visual lessons"
      description="Write 3D and diagram lessons for CEE. Each one is reviewed on six gates before a publisher can release it to students."
      actions={
        !blocking && (
          <button type="button" className={buttonPrimary} onClick={() => setCreating(true)}>
            New lesson
          </button>
        )
      }
    >
      {blocking ? (
        <AccessNotice error={blocking} />
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              ['Lessons', list.length],
              ['Published', count((l) => Boolean(l.publication))],
              ['In review', count((l) => l.latestRevision?.status === 'IN_REVIEW')],
              ['Drafts', count((l) => l.latestRevision?.status === 'DRAFT')],
            ].map(([label, n]) => (
              <div key={label} className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-2xl font-bold mt-1">{n}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <label className="sm:w-80">
              <span className="sr-only">Search lessons</span>
              <input className={inputClass} placeholder="Search by title or topic" value={query} onChange={(e) => setQuery(e.target.value)} />
            </label>
            <label>
              <span className="sr-only">Status</span>
              <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="ALL">All statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="IN_REVIEW">In review</option>
                <option value="CHANGES_REQUESTED">Changes requested</option>
                <option value="APPROVED">Approved</option>
                <option value="PUBLISHED">Published</option>
              </select>
            </label>
            <button type="button" className={buttonSecondary} onClick={() => void lessons.reload()} disabled={lessons.loading}>
              {lessons.loading ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>

          <div className="rounded-xl border border-border bg-card overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs text-muted-foreground">
                <tr>
                  <th className="py-3 px-4 font-medium">Lesson</th>
                  <th className="py-3 px-4 font-medium">Topic</th>
                  <th className="py-3 px-4 font-medium">Latest revision</th>
                  <th className="py-3 px-4 font-medium">Live</th>
                  <th className="py-3 px-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {shown.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 px-4 text-center text-muted-foreground">
                      {list.length === 0 ? 'No visual lessons yet. Start one with “New lesson”.' : 'No lessons match these filters.'}
                    </td>
                  </tr>
                ) : (
                  shown.map((l) => (
                    <tr key={l.id} className="hover:bg-muted/40">
                      <td className="py-3 px-4">
                        <Link href={`/admin/cee-visual/lessons/${l.id}`} className="font-semibold hover:underline">
                          {l.title}
                        </Link>
                        <div className="text-xs text-muted-foreground mt-0.5">/{l.slug}</div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {l.topic ? (paths.get(l.topic.id)?.path ?? l.topic.title) : 'Not mapped'}
                        {l.topic?.mappingStatus === 'PROPOSED' && <span className="block text-xs">Mapping not approved yet</span>}
                      </td>
                      <td className="py-3 px-4">
                        {l.latestRevision ? (
                          <span className="inline-flex items-center gap-2">
                            <span className="text-muted-foreground">#{l.latestRevision.number}</span>
                            <StatusBadge status={l.latestRevision.status} />
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {l.publication ? `Revision ${l.publication.revisionNumber ?? '?'} since ${new Date(l.publication.publishedAt).toLocaleDateString()}` : 'Not published'}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {l.publication && (
                          <Link href={`/cee/visual/${l.id}`} className={`${buttonSecondary} mr-2`} target="_blank">
                            View as student
                          </Link>
                        )}
                        <Link href={`/admin/cee-visual/lessons/${l.id}`} className={buttonSecondary}>
                          Open
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {creating && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="new-lesson-title">
          <form onSubmit={create} className="w-full max-w-lg rounded-xl border border-border bg-card p-6 space-y-4 shadow-xl">
            <h2 id="new-lesson-title" className="text-lg font-bold">
              New visual lesson
            </h2>
            {topics.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                There are no syllabus topics yet. Add the syllabus on the{' '}
                <Link href="/admin/cee-visual/curriculum" className="underline">
                  Syllabus
                </Link>{' '}
                screen first, so the lesson can be mapped to a topic.
              </p>
            ) : (
              <>
                <label className="block space-y-1">
                  <span className="text-sm font-medium">Title</span>
                  <input
                    className={inputClass}
                    required
                    minLength={3}
                    maxLength={200}
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      if (!slugTouched) setSlug(slugify(e.target.value));
                    }}
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-sm font-medium">Web address</span>
                  <input
                    className={inputClass}
                    required
                    pattern="[a-z0-9][a-z0-9-]{1,95}"
                    value={slug}
                    onChange={(e) => {
                      setSlugTouched(true);
                      setSlug(e.target.value);
                    }}
                  />
                  <span className="text-xs text-muted-foreground">Lowercase letters, digits and hyphens.</span>
                </label>
                <label className="block space-y-1">
                  <span className="text-sm font-medium">Syllabus topic</span>
                  <select className={inputClass} required value={nodeId} onChange={(e) => setNodeId(e.target.value)}>
                    <option value="">Choose a topic</option>
                    {topics.map(([id, v]) => (
                      <option key={id} value={id}>
                        {v.path}
                        {v.verified ? '' : ' (syllabus not verified)'}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            )}
            {formError && (
              <p role="alert" className="text-sm text-error">
                {formError}
              </p>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className={buttonSecondary} onClick={() => setCreating(false)}>
                Cancel
              </button>
              {topics.length > 0 && (
                <button type="submit" className={buttonPrimary} disabled={saving}>
                  {saving ? 'Creating…' : 'Create lesson'}
                </button>
              )}
            </div>
          </form>
        </div>
      )}
    </PageShell>
  );
}
