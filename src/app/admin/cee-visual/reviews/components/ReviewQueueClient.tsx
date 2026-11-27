'use client';

/**
 * Review queue: the gates the signed-in reviewer can decide, with the revision
 * to read beside the decision form. Ported from the parallel build onto
 * /api/v1/cee/admin; separation of duties and scopes are enforced by the server.
 */
import Link from 'next/link';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import VisualPlayerShell from '@/components/visual-player/VisualPlayerShell';
import type { ResolvedVisual, VisualAssetManifest } from '@/lib/cee-visual/schemas';
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

interface AssetReviewItem {
  subject: 'ASSET';
  id: string;
  gate: string;
  status: string;
  requestedAt: string;
  assetId: string;
  assetTitle: string;
  assetKind: 'MODEL_3D' | 'DIAGRAM_2D';
  license: string | null;
  sourceCredit: string | null;
  versionId: string;
  versionNumber: number;
  canDecide: boolean;
  cannotDecideReason: string | null;
  decision: { decision: string; comments: string | null; decidedAt: string } | null;
}

interface AssetPreview {
  url: string;
  fallbackUrl: string | null;
  mimeType: string;
  kind: 'MODEL_3D' | 'DIAGRAM_2D';
  license: string | null;
  sourceCredit: string | null;
  manifest: VisualAssetManifest | null;
  scanned: boolean;
}

type ReviewItem = LessonReviewItem | AssetReviewItem;

interface LessonReviewItem {
  subject: 'LESSON';
  id: string;
  gate: string;
  status: string;
  requestedAt: string;
  lessonId: string;
  lessonTitle: string;
  revisionId: string;
  revisionNumber: number;
  revisionStatus: string;
  topic: string | null;
  canDecide: boolean;
  cannotDecideReason: string | null;
  decision: { decision: string; comments: string | null; decidedAt: string } | null;
}

interface LessonForReview {
  latest: { id: string; content: { summary?: string; sections?: { key: string; heading: string; body: string }[] } } | null;
  questions: { id: string; stem: string; options: string[]; answerKey: string; rationale: string }[];
}

const GATE_HELP: Record<string, string> = {
  SYLLABUS_MAPPING: 'Is the lesson mapped to the right syllabus topic, and does it stay within it?',
  SCIENTIFIC: 'Is every statement correct for the CEE syllabus?',
  VISUAL: 'Do the visuals, labels and steps show the science correctly?',
  ASSESSMENT: 'Is each question clear, with exactly one correct answer and a correct explanation?',
  ACCESSIBILITY: 'Can the lesson be completed without 3D, by keyboard and with a screen reader?',
  RIGHTS: 'Do we have the rights to every image, model and text in it?',
};

const ASSET_GATE_HELP: Record<string, string> = {
  SCIENTIFIC: 'Is the anatomy or science shown correctly, and do the description and labels say only what the visual shows?',
  VISUAL: 'Is it clear on a phone, are labels and parts legible, and does the 2D fallback carry the same information?',
  RIGHTS: 'Does the licence below allow this use, and is the credit complete and accurate? Check them at the source.',
};

/** A visual under review, shown through the same player students get. */
function AssetReview({ item }: { item: AssetReviewItem }) {
  const p = useCeeData<AssetPreview>(`/asset-versions/${item.versionId}/preview`);
  const visual: ResolvedVisual | null =
    p.data?.manifest
      ? {
          assetVersionId: item.versionId,
          manifest: p.data.manifest,
          ...(p.data.kind === 'MODEL_3D' ? { modelUrl: p.data.url, fallbackUrl: p.data.fallbackUrl ?? undefined } : { diagramUrl: p.data.url }),
        }
      : null;
  return (
    <div className="space-y-4">
      <dl className="grid gap-x-4 gap-y-1 text-sm sm:grid-cols-[9rem_minmax(0,1fr)]">
        <dt className="text-muted-foreground">Type</dt>
        <dd>{item.assetKind === 'MODEL_3D' ? '3D model' : '2D diagram'}</dd>
        <dt className="text-muted-foreground">Licence</dt>
        <dd>{item.license}</dd>
        <dt className="text-muted-foreground">Source and credit</dt>
        <dd>{item.sourceCredit}</dd>
        {p.data?.manifest && (
          <>
            <dt className="text-muted-foreground">Description</dt>
            <dd>{p.data.manifest.accessibility.description}</dd>
          </>
        )}
        {p.data && (
          <>
            <dt className="text-muted-foreground">Malware scan</dt>
            <dd>{p.data.scanned ? 'Clean' : 'Not scanned yet (decision D7)'}</dd>
          </>
        )}
      </dl>
      {p.loading && <p className="text-sm text-muted-foreground">Loading the visual…</p>}
      {p.error && <p className="text-sm text-error">{p.error.message}</p>}
      {visual && <VisualPlayerShell key={item.versionId} visual={visual} />}
      {p.data && !p.data.manifest && <p className="text-sm">This version has no description yet.</p>}
    </div>
  );
}

export default function ReviewQueueClient() {
  const [tab, setTab] = useState<'open' | 'done'>('open');
  const queue = useCeeData<{ reviews: ReviewItem[] }>(`/reviews?program=cee_medical${tab === 'done' ? '&status=done' : ''}`);
  const [active, setActive] = useState<ReviewItem | null>(null);
  const lesson = useCeeData<LessonForReview>(active?.subject === 'LESSON' ? `/lessons/${active.lessonId}` : null);
  const [decision, setDecision] = useState<'APPROVE' | 'REQUEST_CHANGES' | 'REJECT'>('APPROVE');
  const [comments, setComments] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

  const items = queue.data?.reviews ?? [];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!active) return;
    setBusy(true);
    setMessage(null);
    try {
      const r = await ceeAdmin<{ revisionStatus?: string; assetReviewState?: string }>(`/reviews/${active.id}/decision`, {
        method: 'POST',
        json: { decision, comments: comments.trim() || undefined },
      });
      const text =
        active.subject === 'ASSET'
          ? r.assetReviewState === 'APPROVED'
            ? `Recorded. All three reviews approved “${active.assetTitle}”, version ${active.versionNumber}.`
            : r.assetReviewState === 'CHANGES_REQUESTED'
              ? 'Recorded. The uploader was asked for a new version, with your comments.'
              : 'Recorded.'
          : r.revisionStatus === 'APPROVED'
            ? `Recorded. All six gates are now approved; “${active.lessonTitle}” can be published.`
            : r.revisionStatus === 'CHANGES_REQUESTED'
              ? 'Recorded. The revision went back to its author with your comments.'
              : 'Recorded.';
      setActive(null);
      setComments('');
      setDecision('APPROVE');
      // Confirm only once the list no longer shows the request just decided.
      await queue.reload();
      setMessage({ tone: 'ok', text });
    } catch (err) {
      setMessage({ tone: 'error', text: err instanceof CeeAdminError ? err.message : String(err) });
    } finally {
      setBusy(false);
    }
  };

  const decisionArea = active ? (
    <>
                  {tab === 'open' &&
                    (active.canDecide ? (
                      <form onSubmit={submit} className="rounded-xl border border-border bg-card p-5 space-y-3" aria-labelledby="decide-h">
                        <h2 id="decide-h" className="font-semibold">
                          Your decision
                        </h2>
                        <div className="flex flex-wrap gap-4 text-sm" role="radiogroup" aria-label="Decision">
                          {(
                            [
                              ['APPROVE', 'Approve'],
                              ['REQUEST_CHANGES', 'Request changes'],
                              ['REJECT', 'Reject'],
                            ] as const
                          ).map(([v, label]) => (
                            <label key={v} className="inline-flex items-center gap-2">
                              <input type="radio" name="decision" checked={decision === v} onChange={() => setDecision(v)} />
                              {label}
                            </label>
                          ))}
                        </div>
                        <label className="block space-y-1">
                          <span className="text-sm font-medium">Comments {decision === 'APPROVE' ? '(optional)' : '(say what needs to change)'}</span>
                          <textarea className={inputClass} rows={4} required={decision !== 'APPROVE'} maxLength={4000} value={comments} onChange={(e) => setComments(e.target.value)} />
                        </label>
                        <button type="submit" className={buttonPrimary} disabled={busy}>
                          {busy ? 'Recording…' : 'Record decision'}
                        </button>
                      </form>
                    ) : (
                      <p className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">You can read this review but not decide it: {active.cannotDecideReason}</p>
                    ))}
                  {active.decision && (
                    <p className="rounded-xl border border-border bg-card p-5 text-sm">
                      <span className="font-medium">{active.decision.decision === 'APPROVE' ? 'Approved' : active.decision.decision === 'REJECT' ? 'Rejected' : 'Changes requested'}</span>{' '}
                      on {new Date(active.decision.decidedAt).toLocaleString()}
                      {active.decision.comments ? `: ${active.decision.comments}` : '.'}
                    </p>
                  )}
    </>
  ) : null;

  return (
    <PageShell title="Review queue" description="Lesson revisions need approval on six gates and visuals on three. You see the gates you can decide, never your own work.">
      {queue.error ? (
        <AccessNotice error={queue.error} />
      ) : (
        <>
          <div className="flex gap-2" role="tablist" aria-label="Reviews">
            {(['open', 'done'] as const).map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={tab === t}
                onClick={() => {
                  setTab(t);
                  setActive(null);
                }}
                className={tab === t ? buttonPrimary : buttonSecondary}
              >
                {t === 'open' ? 'Waiting for me' : 'Decided'}
              </button>
            ))}
          </div>

          {message && (
            <p role={message.tone === 'error' ? 'alert' : 'status'} className={`rounded-lg border px-4 py-3 text-sm ${message.tone === 'error' ? 'border-error bg-error-light' : 'border-success bg-success-light'}`}>
              {message.text}
            </p>
          )}

          <div className="grid gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
            <ul className="space-y-2" aria-label="Reviews">
              {items.length === 0 && (
                <li className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
                  {tab === 'open' ? 'Nothing is waiting for you.' : 'No decided reviews yet.'}
                </li>
              )}
              {items.map((it) => (
                <li key={it.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setActive(it);
                      setMessage(null);
                    }}
                    aria-pressed={active?.id === it.id}
                    className={`w-full text-left rounded-xl border p-4 bg-card hover:bg-muted/40 ${active?.id === it.id ? 'border-primary' : 'border-border'}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold">{GATE_LABEL[it.gate] ?? it.gate}</span>
                      <StatusBadge status={it.decision ? (it.decision.decision === 'APPROVE' ? 'APPROVED' : 'CHANGES_REQUESTED') : it.status} />
                    </div>
                    {it.subject === 'ASSET' ? (
                      <p className="mt-1 text-sm">
                        Visual: {it.assetTitle} <span className="text-muted-foreground">version {it.versionNumber}</span>
                      </p>
                    ) : (
                      <>
                        <p className="mt-1 text-sm">
                          {it.lessonTitle} <span className="text-muted-foreground">#{it.revisionNumber}</span>
                        </p>
                        {it.topic && <p className="text-xs text-muted-foreground mt-0.5">{it.topic}</p>}
                      </>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">Requested {new Date(it.requestedAt).toLocaleString()}</p>
                  </button>
                </li>
              ))}
            </ul>

            <div>
              {!active ? (
                <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">Choose a review to read the revision.</div>
              ) : active.subject === 'ASSET' ? (
                <div className="space-y-4">
                  <section className="rounded-xl border border-border bg-card p-5 space-y-3" aria-labelledby="read-h">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h2 id="read-h" className="text-lg font-semibold">
                        {active.assetTitle}, version {active.versionNumber}
                      </h2>
                      <Link href="/admin/cee-visual/assets" className={buttonSecondary}>
                        Open visuals
                      </Link>
                    </div>
                    <p className="text-sm">
                      <span className="font-medium">{GATE_LABEL[active.gate]}:</span> <span className="text-muted-foreground">{ASSET_GATE_HELP[active.gate]}</span>
                    </p>
                    <AssetReview item={active} />
                  </section>
                  {decisionArea}
                </div>
              ) : (
                <div className="space-y-4">
                  <section className="rounded-xl border border-border bg-card p-5 space-y-3" aria-labelledby="read-h">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h2 id="read-h" className="text-lg font-semibold">
                        {active.lessonTitle}, revision {active.revisionNumber}
                      </h2>
                      <Link href={`/admin/cee-visual/lessons/${active.lessonId}`} className={buttonSecondary}>
                        Open lesson
                      </Link>
                    </div>
                    <p className="text-sm">
                      <span className="font-medium">{GATE_LABEL[active.gate]}:</span> <span className="text-muted-foreground">{GATE_HELP[active.gate]}</span>
                    </p>
                    {lesson.loading && <p className="text-sm text-muted-foreground">Loading the revision…</p>}
                    {lesson.data?.latest?.id === active.revisionId ? (
                      <div className="space-y-4">
                        {lesson.data.latest.content.summary && <p className="text-sm">{lesson.data.latest.content.summary}</p>}
                        {(lesson.data.latest.content.sections ?? []).map((s) => (
                          <article key={s.key} className="rounded-lg border border-border p-4">
                            <h3 className="font-semibold">{s.heading}</h3>
                            <div className="prose prose-sm dark:prose-invert max-w-none mt-2">
                              <ReactMarkdown skipHtml>{s.body}</ReactMarkdown>
                            </div>
                          </article>
                        ))}
                        {lesson.data.questions.length > 0 && (
                          <ol className="space-y-3 text-sm">
                            {lesson.data.questions.map((q, i) => (
                              <li key={q.id} className="rounded-lg border border-border p-4">
                                <p className="font-medium">
                                  {i + 1}. {q.stem}
                                </p>
                                <ul className="mt-1">
                                  {q.options.map((o, k) => (
                                    <li key={k} className={'ABCD'[k] === q.answerKey ? 'font-semibold' : 'text-muted-foreground'}>
                                      {'ABCD'[k]}. {o}
                                      {'ABCD'[k] === q.answerKey && ' (marked correct)'}
                                    </li>
                                  ))}
                                </ul>
                                <p className="mt-1 text-muted-foreground">Why: {q.rationale}</p>
                              </li>
                            ))}
                          </ol>
                        )}
                      </div>
                    ) : (
                      !lesson.loading && <p className="text-sm text-muted-foreground">A newer revision exists; open the lesson to compare.</p>
                    )}
                  </section>

                  {decisionArea}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </PageShell>
  );
}
