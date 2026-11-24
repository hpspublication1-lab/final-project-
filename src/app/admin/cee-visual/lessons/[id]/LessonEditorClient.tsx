'use client';

/**
 * One lesson in the CMS: edit the draft (text, sections, questions), submit
 * it for review, follow the six review gates, start a new revision, publish.
 * The server decides what's allowed; this screen only offers what it says.
 */
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessNotice,
  buttonPrimary,
  buttonSecondary,
  ceeAdmin,
  CeeAdminError,
  GATE_LABEL,
  inputClass,
  PageShell,
  StatusBadge,
  useCeeData,
} from '../../shared';

interface Section {
  key: string;
  heading: string;
  body: string;
  required: boolean;
}
interface DraftContent {
  schemaVersion: '1.0';
  summary: string;
  sections: Section[];
  objectiveIds: string[];
  completion: { requireSequenceKey?: string; minScorePercent?: number };
}
interface Detail {
  lesson: { id: string; slug: string; title: string; program: string; topic: { id: string; path: string[] } | null };
  revisions: { id: string; number: number; status: string; createdAt: string; submittedAt: string | null }[];
  latest: { id: string; number: number; status: string; content: Partial<DraftContent>; updatedAt: string; createdBy: string } | null;
  questions: { id: string; stem: string; options: string[]; answerKey: string; rationale: string; status: string }[];
  reviews: { requestId: string; gate: string; status: string; decision: { decision: string; comments: string | null; decidedAt: string } | null }[];
  publications: { id: string; revisionId: string; publishedAt: string; active: boolean }[];
  permissions: { edit: boolean; publish: boolean };
}

const normalise = (c: Partial<DraftContent> | undefined): DraftContent => ({
  schemaVersion: '1.0',
  summary: c?.summary ?? '',
  sections: (c?.sections ?? []).map((s) => ({ ...s, required: s.required ?? true })),
  objectiveIds: c?.objectiveIds ?? [],
  completion: c?.completion ?? {},
});

const sectionKey = (heading: string, taken: Set<string>) => {
  const base = heading.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 56) || 'section';
  let k = base;
  for (let i = 2; taken.has(k); i++) k = `${base}-${i}`;
  return k;
};

const errorText = (e: unknown) => {
  if (!(e instanceof CeeAdminError)) return String(e);
  const issues = (e.details.issues as { path: string; message: string }[] | undefined) ?? [];
  return issues.length ? `${e.message} ${issues.map((i) => `${i.path || 'lesson'}: ${i.message}`).join('; ')}` : e.message;
};

export default function LessonEditorClient({ lessonId }: { lessonId: string }) {
  const detail = useCeeData<Detail>(`/lessons/${lessonId}`);
  const d = detail.data;
  const latest = d?.latest ?? null;
  const editable = Boolean(latest && latest.status === 'DRAFT' && d?.permissions.edit);

  const [content, setContent] = useState<DraftContent>(normalise(undefined));
  const [baseUpdatedAt, setBaseUpdatedAt] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const publishKey = useRef<string | null>(null);

  useEffect(() => {
    if (!latest) return;
    setContent(normalise(latest.content));
    setBaseUpdatedAt(latest.updatedAt);
    setDirty(false);
  }, [latest]);

  const edit = (next: Partial<DraftContent>) => {
    setContent((c) => ({ ...c, ...next }));
    setDirty(true);
  };
  const editSection = (i: number, next: Partial<Section>) =>
    edit({ sections: content.sections.map((s, j) => (j === i ? { ...s, ...next } : s)) });
  const moveSection = (i: number, by: number) => {
    const s = [...content.sections];
    const j = i + by;
    if (j < 0 || j >= s.length) return;
    [s[i], s[j]] = [s[j], s[i]];
    edit({ sections: s });
  };

  const run = async (label: string, fn: () => Promise<string | void>) => {
    setBusy(label);
    setMessage(null);
    try {
      const text = await fn();
      if (text) setMessage({ tone: 'ok', text });
    } catch (e) {
      setMessage({ tone: 'error', text: errorText(e) });
    } finally {
      setBusy(null);
    }
  };

  const save = () =>
    run('save', async () => {
      if (!latest || !baseUpdatedAt) return;
      try {
        const r = await ceeAdmin<{ updatedAt: string }>(`/lesson-revisions/${latest.id}`, { method: 'PATCH', json: { content, baseUpdatedAt } });
        setBaseUpdatedAt(r.updatedAt);
        setDirty(false);
        return `Saved at ${new Date(r.updatedAt).toLocaleTimeString()}.`;
      } catch (e) {
        if (e instanceof CeeAdminError && e.code === 'REVISION_CONFLICT') {
          throw new CeeAdminError('Someone else saved this draft after you opened it. Copy your changes, then reload to see theirs.', e.code, e.status);
        }
        throw e;
      }
    });

  const [q, setQ] = useState({ stem: '', options: ['', '', '', ''], answerKey: 'A', rationale: '' });
  const addQuestion = () =>
    run('question', async () => {
      if (!latest) return;
      await ceeAdmin(`/lesson-revisions/${latest.id}/questions`, { method: 'POST', json: { ...q, options: q.options.map((o) => o.trim()) } });
      setQ({ stem: '', options: ['', '', '', ''], answerKey: 'A', rationale: '' });
      await detail.reload();
      return 'Question added.';
    });
  const removeQuestion = (id: string) =>
    run('remove', async () => {
      if (!latest) return;
      await ceeAdmin(`/lesson-revisions/${latest.id}/questions/${id}`, { method: 'DELETE' });
      await detail.reload();
      return 'Question removed from this draft.';
    });

  const submit = () =>
    run('submit', async () => {
      if (!latest) return;
      if (dirty) throw new CeeAdminError('Save your changes before submitting.', 'UNSAVED', 0);
      await ceeAdmin(`/lesson-revisions/${latest.id}/submit`, { method: 'POST' });
      await detail.reload();
      return 'Submitted. Reviewers can now see this revision.';
    });

  const newRevision = () =>
    run('revision', async () => {
      const r = await ceeAdmin<{ number: number }>(`/lessons/${lessonId}/revisions`, { method: 'POST' });
      await detail.reload();
      return `Revision ${r.number} started as a draft.`;
    });

  const publish = () =>
    run('publish', async () => {
      if (!latest) return;
      publishKey.current ??= `pub_${crypto.randomUUID().replace(/-/g, '')}`;
      await ceeAdmin('/publications', { method: 'POST', json: { revisionId: latest.id }, headers: { 'Idempotency-Key': publishKey.current } });
      publishKey.current = null;
      await detail.reload();
      return 'Published. Students can open this revision now.';
    });

  const approvedGates = useMemo(() => (d?.reviews ?? []).filter((r) => r.decision?.decision === 'APPROVE').length, [d?.reviews]);
  const active = d?.publications.find((p) => p.active);

  if (detail.error) {
    return (
      <PageShell title="Lesson" description="">
        <AccessNotice error={detail.error} />
      </PageShell>
    );
  }
  if (!d) {
    return (
      <PageShell title="Lesson" description="Loading…">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </PageShell>
    );
  }

  return (
    <PageShell
      title={d.lesson.title}
      description={d.lesson.topic ? d.lesson.topic.path.join(' › ') : 'Not mapped to a syllabus topic'}
      actions={
        <>
          {active && (
            <Link href={`/cee/visual/${d.lesson.id}`} target="_blank" className={buttonSecondary}>
              View as student
            </Link>
          )}
          <Link href="/admin/cee-visual/lessons" className={buttonSecondary}>
            All lessons
          </Link>
        </>
      }
    >
      <div className="flex flex-wrap items-center gap-3 text-sm">
        {latest && (
          <>
            <span className="font-medium">Revision {latest.number}</span>
            <StatusBadge status={latest.status} />
          </>
        )}
        {active && <span className="text-muted-foreground">Live since {new Date(active.publishedAt).toLocaleDateString()}</span>}
      </div>

      {message && (
        <p role={message.tone === 'error' ? 'alert' : 'status'} className={`rounded-lg border px-4 py-3 text-sm ${message.tone === 'error' ? 'border-error bg-error-light' : 'border-success bg-success-light'}`}>
          {message.text}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6">
          <section className="rounded-xl border border-border bg-card p-5 space-y-4" aria-labelledby="content-h">
            <div className="flex items-center justify-between gap-3">
              <h2 id="content-h" className="text-lg font-semibold">
                Lesson text
              </h2>
              {editable && (
                <button type="button" className={buttonPrimary} onClick={save} disabled={busy !== null || !dirty}>
                  {busy === 'save' ? 'Saving…' : dirty ? 'Save draft' : 'Saved'}
                </button>
              )}
            </div>
            {!editable && latest && (
              <p className="text-sm text-muted-foreground">
                {latest.status === 'DRAFT' ? 'You can read this draft but not edit it.' : 'This revision is locked. Start a new revision to change anything.'}
              </p>
            )}
            <label className="block space-y-1">
              <span className="text-sm font-medium">Summary</span>
              <textarea className={inputClass} rows={3} maxLength={2000} readOnly={!editable} value={content.summary} onChange={(e) => edit({ summary: e.target.value })} />
            </label>

            {content.sections.map((s, i) => (
              <fieldset key={s.key} className="rounded-lg border border-border p-4 space-y-3">
                <legend className="px-1 text-sm font-medium">Section {i + 1}</legend>
                <input className={inputClass} aria-label={`Section ${i + 1} heading`} readOnly={!editable} maxLength={200} value={s.heading} onChange={(e) => editSection(i, { heading: e.target.value })} />
                <textarea
                  className={inputClass}
                  aria-label={`Section ${i + 1} text (Markdown)`}
                  rows={6}
                  readOnly={!editable}
                  maxLength={20000}
                  value={s.body}
                  onChange={(e) => editSection(i, { body: e.target.value })}
                />
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" disabled={!editable} checked={s.required} onChange={(e) => editSection(i, { required: e.target.checked })} />
                    Students must read this to complete the lesson
                  </label>
                  {editable && (
                    <span className="ml-auto flex gap-2">
                      <button type="button" className={buttonSecondary} onClick={() => moveSection(i, -1)} disabled={i === 0}>
                        Move up
                      </button>
                      <button type="button" className={buttonSecondary} onClick={() => moveSection(i, 1)} disabled={i === content.sections.length - 1}>
                        Move down
                      </button>
                      <button type="button" className={buttonSecondary} onClick={() => edit({ sections: content.sections.filter((_, j) => j !== i) })}>
                        Remove
                      </button>
                    </span>
                  )}
                </div>
              </fieldset>
            ))}
            {editable && (
              <button
                type="button"
                className={buttonSecondary}
                onClick={() =>
                  edit({ sections: [...content.sections, { key: sectionKey(`section-${content.sections.length + 1}`, new Set(content.sections.map((s) => s.key))), heading: '', body: '', required: true }] })
                }
              >
                Add section
              </button>
            )}

            <label className="block space-y-1 max-w-xs">
              <span className="text-sm font-medium">Pass mark for the questions (optional, %)</span>
              <input
                className={inputClass}
                type="number"
                min={0}
                max={100}
                readOnly={!editable}
                value={content.completion.minScorePercent ?? ''}
                onChange={(e) => edit({ completion: { ...content.completion, minScorePercent: e.target.value === '' ? undefined : Number(e.target.value) } })}
              />
            </label>
          </section>

          <section className="rounded-xl border border-border bg-card p-5 space-y-4" aria-labelledby="q-h">
            <h2 id="q-h" className="text-lg font-semibold">
              Questions
            </h2>
            {d.questions.length === 0 && <p className="text-sm text-muted-foreground">No questions in this revision.</p>}
            <ol className="space-y-4">
              {d.questions.map((qq, i) => (
                <li key={qq.id} className="rounded-lg border border-border p-4 text-sm space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium">
                      {i + 1}. {qq.stem}
                    </p>
                    <StatusBadge status={qq.status === 'APPROVED' ? 'APPROVED' : qq.status} />
                  </div>
                  <ul className="space-y-1">
                    {qq.options.map((o, k) => {
                      const key = 'ABCD'[k];
                      return (
                        <li key={key} className={key === qq.answerKey ? 'font-semibold' : 'text-muted-foreground'}>
                          {key}. {o}
                          {key === qq.answerKey && ' (correct)'}
                        </li>
                      );
                    })}
                  </ul>
                  <p className="text-muted-foreground">Why: {qq.rationale}</p>
                  {editable && (
                    <button type="button" className={buttonSecondary} onClick={() => removeQuestion(qq.id)} disabled={busy !== null}>
                      Remove from this draft
                    </button>
                  )}
                </li>
              ))}
            </ol>
            {editable && (
              <fieldset className="rounded-lg border border-dashed border-border p-4 space-y-3">
                <legend className="px-1 text-sm font-medium">Add a question</legend>
                <textarea className={inputClass} aria-label="Question" rows={2} placeholder="Question" value={q.stem} onChange={(e) => setQ({ ...q, stem: e.target.value })} />
                {q.options.map((o, k) => (
                  <label key={k} className="flex items-center gap-2 text-sm">
                    <input type="radio" name="correct" checked={q.answerKey === 'ABCD'[k]} onChange={() => setQ({ ...q, answerKey: 'ABCD'[k] })} aria-label={`Option ${'ABCD'[k]} is correct`} />
                    <span className="w-5 font-medium">{'ABCD'[k]}.</span>
                    <input className={inputClass} aria-label={`Option ${'ABCD'[k]}`} value={o} onChange={(e) => setQ({ ...q, options: q.options.map((x, j) => (j === k ? e.target.value : x)) })} />
                  </label>
                ))}
                <textarea className={inputClass} aria-label="Why the correct answer is correct" rows={2} placeholder="Why the correct answer is correct" value={q.rationale} onChange={(e) => setQ({ ...q, rationale: e.target.value })} />
                <button type="button" className={buttonSecondary} onClick={addQuestion} disabled={busy !== null || !q.stem.trim() || q.options.some((o) => !o.trim()) || !q.rationale.trim()}>
                  {busy === 'question' ? 'Adding…' : 'Add question'}
                </button>
              </fieldset>
            )}
          </section>
        </div>

        <aside className="space-y-4">
          <section className="rounded-xl border border-border bg-card p-5 space-y-3" aria-labelledby="next-h">
            <h2 id="next-h" className="font-semibold">
              Next step
            </h2>
            {latest?.status === 'DRAFT' && editable && (
              <>
                <p className="text-sm text-muted-foreground">When the text and questions are ready, send this revision for review. It can’t be edited after that.</p>
                <button type="button" className={buttonPrimary} onClick={submit} disabled={busy !== null}>
                  {busy === 'submit' ? 'Submitting…' : 'Submit for review'}
                </button>
              </>
            )}
            {latest?.status === 'IN_REVIEW' && <p className="text-sm text-muted-foreground">Waiting for reviewers: {approvedGates} of 6 gates approved.</p>}
            {latest?.status === 'APPROVED' &&
              (d.permissions.publish ? (
                <>
                  <p className="text-sm text-muted-foreground">All six gates are approved. Publishing makes this revision the one students see.</p>
                  <button type="button" className={buttonPrimary} onClick={publish} disabled={busy !== null}>
                    {busy === 'publish' ? 'Publishing…' : 'Publish'}
                  </button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Approved. A publisher who didn’t write it can now publish it.</p>
              ))}
            {latest && ['CHANGES_REQUESTED', 'PUBLISHED', 'SUPERSEDED', 'ARCHIVED'].includes(latest.status) && d.permissions.edit && (
              <>
                <p className="text-sm text-muted-foreground">
                  {latest.status === 'CHANGES_REQUESTED' ? 'Reviewers asked for changes. Start a new revision to make them.' : 'Start a new revision to change this lesson.'}
                </p>
                <button type="button" className={buttonPrimary} onClick={newRevision} disabled={busy !== null}>
                  {busy === 'revision' ? 'Starting…' : 'Start new revision'}
                </button>
              </>
            )}
          </section>

          {d.reviews.length > 0 && (
            <section className="rounded-xl border border-border bg-card p-5" aria-labelledby="rev-h">
              <h2 id="rev-h" className="font-semibold">
                Reviews of revision {latest?.number}
              </h2>
              <ul className="mt-3 space-y-3 text-sm">
                {d.reviews.map((r) => (
                  <li key={r.requestId}>
                    <div className="flex items-center justify-between gap-2">
                      <span>{GATE_LABEL[r.gate] ?? r.gate}</span>
                      <StatusBadge status={r.decision ? (r.decision.decision === 'APPROVE' ? 'APPROVED' : 'CHANGES_REQUESTED') : r.status} />
                    </div>
                    {r.decision?.comments && <p className="mt-1 text-muted-foreground">{r.decision.comments}</p>}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="rounded-xl border border-border bg-card p-5" aria-labelledby="hist-h">
            <h2 id="hist-h" className="font-semibold">
              Revisions
            </h2>
            <ul className="mt-3 space-y-2 text-sm">
              {d.revisions.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-2">
                  <span>
                    #{r.number} <span className="text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()}</span>
                  </span>
                  <StatusBadge status={r.status} />
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </PageShell>
  );
}
