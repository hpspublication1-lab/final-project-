'use client';

/**
 * Syllabus for CEE visual lessons: versions, the subject → chapter → topic tree,
 * links to existing course chapters, and verification against the official
 * document. Verification hashes the document in the browser; the file is never
 * uploaded.
 */
import { useEffect, useMemo, useState } from 'react';
import {
  AccessNotice,
  buttonPrimary,
  buttonSecondary,
  ceeAdmin,
  CeeAdminError,
  inputClass,
  PageShell,
  StatusBadge,
  useCeeData,
  type CurriculumView,
} from '../shared';

type Node = CurriculumView['syllabi'][number]['nodes'][number];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const codeOf = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 64) || 'node';
const childType = (t: string) => (t === 'SUBJECT' ? 'CHAPTER' : 'TOPIC');

/** Existing course chapters, for linking syllabus chapters to course pages. */
function useExistingChapters() {
  const [chapters, setChapters] = useState<{ id: string; label: string }[]>([]);
  useEffect(() => {
    fetch('/api/curriculum?course=cee_medical')
      .then((r) => (r.ok ? r.json() : null))
      .then((b) => {
        const out: { id: string; label: string }[] = [];
        for (const s of b?.subjects ?? []) {
          for (const u of s.units ?? []) {
            for (const c of u.chapters ?? []) {
              if (typeof c.id === 'string' && UUID.test(c.id)) out.push({ id: c.id, label: `${s.display_name || s.name} › ${c.title}` });
            }
          }
        }
        setChapters(out.sort((a, b) => a.label.localeCompare(b.label)));
      })
      .catch(() => undefined);
  }, []);
  return chapters;
}

async function sha256Hex(file: File): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export default function CurriculumClient() {
  const cur = useCeeData<CurriculumView>('/curriculum?program=cee_medical');
  const chapters = useExistingChapters();
  const chapterLabel = useMemo(() => new Map(chapters.map((c) => [c.id, c.label])), [chapters]);
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<string>) => {
    setBusy(true);
    setMessage(null);
    try {
      setMessage({ tone: 'ok', text: await fn() });
      await cur.reload();
    } catch (e) {
      setMessage({ tone: 'error', text: e instanceof CeeAdminError ? e.message : String(e) });
    } finally {
      setBusy(false);
    }
  };

  // New syllabus form
  const [label, setLabel] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [effectiveDate, setEffectiveDate] = useState('');

  // Add-node form (one open at a time)
  const [adding, setAdding] = useState<{ syllabusId: string; parent: Node | null } | null>(null);
  const [title, setTitle] = useState('');
  const [legacyChapterId, setLegacyChapterId] = useState('');

  // Verify form
  const [verifying, setVerifying] = useState<string | null>(null);
  const [verifyUrl, setVerifyUrl] = useState('');
  const [hash, setHash] = useState<string | null>(null);

  const addNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adding) return;
    const nodeType = adding.parent ? childType(adding.parent.type) : 'SUBJECT';
    void run(async () => {
      await ceeAdmin('/curriculum/nodes', {
        method: 'POST',
        json: {
          syllabusId: adding.syllabusId,
          parentId: adding.parent?.id ?? null,
          nodeType,
          code: codeOf(title),
          title: title.trim(),
          legacyChapterId: nodeType === 'CHAPTER' && legacyChapterId ? legacyChapterId : null,
        },
      });
      setAdding(null);
      setTitle('');
      setLegacyChapterId('');
      return `Added “${title.trim()}”.`;
    });
  };

  const renderTree = (syllabusId: string, nodes: Node[], parentId: string | null, depth: number): React.ReactNode => {
    const kids = nodes.filter((n) => n.parentId === parentId);
    if (kids.length === 0) return null;
    return (
      <ul className={depth === 0 ? 'space-y-1' : 'mt-1 space-y-1 border-l border-border pl-4'}>
        {kids.map((n) => (
          <li key={n.id}>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className={n.type === 'SUBJECT' ? 'font-semibold' : ''}>{n.title}</span>
              <span className="text-xs text-muted-foreground">{n.type === 'SUBJECT' ? 'subject' : n.type === 'CHAPTER' ? 'chapter' : 'topic'}</span>
              {n.legacyChapterId && <span className="text-xs text-muted-foreground">linked to {chapterLabel.get(n.legacyChapterId) ?? 'a course chapter'}</span>}
              <button
                type="button"
                className="text-xs text-primary hover:underline"
                onClick={() => {
                  setAdding({ syllabusId, parent: n });
                  setTitle('');
                }}
              >
                Add {childType(n.type) === 'CHAPTER' ? 'chapter' : 'topic'}
              </button>
            </div>
            {renderTree(syllabusId, nodes, n.id, depth + 1)}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <PageShell title="Syllabus" description="Lessons can only be published against a verified syllabus: an academic director checks it against the official MEC document.">
      {cur.error ? (
        <AccessNotice error={cur.error} />
      ) : (
        <>
          {message && (
            <p role={message.tone === 'error' ? 'alert' : 'status'} className={`rounded-lg border px-4 py-3 text-sm ${message.tone === 'error' ? 'border-error bg-error-light' : 'border-success bg-success-light'}`}>
              {message.text}
            </p>
          )}

          {(cur.data?.syllabi ?? []).map((s) => (
            <section key={s.id} className="rounded-xl border border-border bg-card p-5 space-y-4" aria-labelledby={`syl-${s.id}`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 id={`syl-${s.id}`} className="text-lg font-semibold">
                    {s.label}
                  </h2>
                  <StatusBadge status={s.status} />
                  {s.effectiveDate && <span className="text-sm text-muted-foreground">from {s.effectiveDate}</span>}
                </div>
                <div className="flex gap-2">
                  <button type="button" className={buttonSecondary} onClick={() => setAdding({ syllabusId: s.id, parent: null })}>
                    Add subject
                  </button>
                  {s.status === 'DRAFT' && (
                    <button
                      type="button"
                      className={buttonSecondary}
                      onClick={() => {
                        setVerifying(s.id);
                        setVerifyUrl(s.sourceUrl ?? '');
                        setHash(null);
                      }}
                    >
                      Verify
                    </button>
                  )}
                </div>
              </div>
              {s.sourceUrl && (
                <p className="text-sm text-muted-foreground">
                  Source:{' '}
                  <a href={s.sourceUrl} className="underline" target="_blank" rel="noreferrer">
                    {s.sourceUrl}
                  </a>
                </p>
              )}
              {s.nodes.length === 0 ? <p className="text-sm text-muted-foreground">No subjects yet.</p> : renderTree(s.id, s.nodes, null, 0)}

              {adding?.syllabusId === s.id && (
                <form onSubmit={addNode} className="rounded-lg border border-dashed border-border p-4 space-y-3">
                  <p className="text-sm font-medium">
                    {adding.parent ? `New ${childType(adding.parent.type) === 'CHAPTER' ? 'chapter' : 'topic'} under “${adding.parent.title}”` : 'New subject'}
                  </p>
                  <input className={inputClass} required maxLength={200} placeholder="Title, as written in the syllabus" value={title} onChange={(e) => setTitle(e.target.value)} />
                  {adding.parent?.type === 'SUBJECT' && (
                    <label className="block space-y-1">
                      <span className="text-sm">Course chapter it belongs to (optional, adds a link on that chapter’s page)</span>
                      <select className={inputClass} value={legacyChapterId} onChange={(e) => setLegacyChapterId(e.target.value)}>
                        <option value="">None</option>
                        {chapters.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  <div className="flex gap-2">
                    <button type="submit" className={buttonPrimary} disabled={busy || !title.trim()}>
                      Add
                    </button>
                    <button type="button" className={buttonSecondary} onClick={() => setAdding(null)}>
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {verifying === s.id && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!hash) return;
                    void run(async () => {
                      await ceeAdmin(`/syllabi/${s.id}/verify`, { method: 'POST', json: { sourceUrl: verifyUrl, sourceSha256: hash } });
                      setVerifying(null);
                      return `“${s.label}” is verified. Lessons mapped to it can now be published.`;
                    });
                  }}
                  className="rounded-lg border border-dashed border-border p-4 space-y-3"
                >
                  <p className="text-sm">
                    Check every subject, chapter and topic above against the official document. Verification must be done by an academic director who didn’t create this
                    syllabus, and it can’t be undone.
                  </p>
                  <label className="block space-y-1">
                    <span className="text-sm font-medium">Where the official document is published</span>
                    <input className={inputClass} type="url" required value={verifyUrl} onChange={(e) => setVerifyUrl(e.target.value)} />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-sm font-medium">The official document (stays on your computer; only its fingerprint is saved)</span>
                    <input
                      type="file"
                      required
                      className="block text-sm"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        setHash(f ? await sha256Hex(f) : null);
                      }}
                    />
                  </label>
                  {hash && <p className="text-xs text-muted-foreground break-all">SHA-256: {hash}</p>}
                  <div className="flex gap-2">
                    <button type="submit" className={buttonPrimary} disabled={busy || !hash || !verifyUrl}>
                      Verify syllabus
                    </button>
                    <button type="button" className={buttonSecondary} onClick={() => setVerifying(null)}>
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </section>
          ))}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void run(async () => {
                await ceeAdmin('/syllabi', {
                  method: 'POST',
                  json: { program: 'cee_medical', label: label.trim(), sourceUrl: sourceUrl || undefined, effectiveDate: effectiveDate || undefined },
                });
                setLabel('');
                setSourceUrl('');
                setEffectiveDate('');
                return 'Syllabus created as a draft. Add its subjects, chapters and topics next.';
              });
            }}
            className="rounded-xl border border-border bg-card p-5 space-y-3"
            aria-labelledby="new-syl"
          >
            <h2 id="new-syl" className="font-semibold">
              New syllabus version
            </h2>
            <div className="grid gap-3 sm:grid-cols-3">
              <input className={inputClass} required minLength={3} maxLength={120} placeholder="Name, e.g. MEC CEE 2083" aria-label="Name" value={label} onChange={(e) => setLabel(e.target.value)} />
              <input className={inputClass} type="url" placeholder="Official document URL (optional)" aria-label="Official document URL" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} />
              <input className={inputClass} type="date" aria-label="Effective from" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} />
            </div>
            <button type="submit" className={buttonPrimary} disabled={busy || label.trim().length < 3}>
              Create syllabus
            </button>
          </form>
        </>
      )}
    </PageShell>
  );
}
