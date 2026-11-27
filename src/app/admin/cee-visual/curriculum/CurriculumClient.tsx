'use client';

/**
 * Syllabus for CEE visual lessons: versions, the subject → chapter → topic tree,
 * entry from a CSV outline (checked before anything is saved), the fingerprint
 * of the official document, links to existing course chapters, and
 * verification by a second academic director. Documents are hashed in the
 * browser and never uploaded. A verified syllabus can't change.
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
  type ImportPreview,
} from '../shared';

type Syllabus = CurriculumView['syllabi'][number];
type Node = Syllabus['nodes'][number];
type Run = (fn: () => Promise<string>) => Promise<void>;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const codeOf = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 64) || 'node';
const childType = (t: string) => (t === 'SUBJECT' ? 'CHAPTER' : 'TOPIC');
const typeWord = (t: string) => (t === 'SUBJECT' ? 'subject' : t === 'CHAPTER' ? 'chapter' : 'topic');
const shortHash = (h: string) => `${h.slice(0, 12)}…${h.slice(-6)}`;

// Example rows are refused by the importer, so the template can't be imported as is.
const TEMPLATE = [
  'level,title,code,source_ref',
  '1,EXAMPLE subject — replace with the subject as written in the official syllabus,,p. 1',
  '2,EXAMPLE chapter — one row per chapter,,p. 1',
  '3,EXAMPLE topic — level 3 and deeper are topics,,"p. 2, 1.1"',
].join('\r\n');

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

function downloadTemplate() {
  const url = URL.createObjectURL(new Blob(['﻿' + TEMPLATE + '\r\n'], { type: 'text/csv;charset=utf-8' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: 'syllabus-import-template.csv' });
  a.click();
  URL.revokeObjectURL(url);
}

// ── Import from a CSV outline ──────────────────────────────────────────────

function ImportPanel({ syllabus, busy, run, onClose }: { syllabus: Syllabus; busy: boolean; run: Run; onClose: () => void }) {
  const [csv, setCsv] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [replace, setReplace] = useState(false);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);

  const check = async (text: string, withReplace: boolean) => {
    setChecking(true);
    setCheckError(null);
    try {
      setPreview(await ceeAdmin<ImportPreview>(`/syllabi/${syllabus.id}/import`, { method: 'POST', json: { csv: text, dryRun: true, replace: withReplace } }));
    } catch (e) {
      setPreview(null);
      setCheckError(e instanceof CeeAdminError ? e.message : String(e));
    } finally {
      setChecking(false);
    }
  };

  const total = preview ? preview.stats.subjects + preview.stats.chapters + preview.stats.topics : 0;
  const canImport = !!csv && !!preview?.valid && (preview.existingEntries === 0 || replace);

  return (
    <div className="rounded-lg border border-dashed border-border p-4 space-y-4">
      <div className="space-y-1">
        <p className="text-sm font-medium">Enter the syllabus from a file</p>
        <p className="text-sm text-muted-foreground">
          One row per entry, in the order of the official document: level 1 for a subject, 2 for a chapter, 3 or more for topics. Add where each entry appears in the
          document (source_ref) so the verifier can check it. Nothing is saved until you choose Import.
        </p>
        <button type="button" className="text-sm text-primary hover:underline" onClick={downloadTemplate}>
          Download the template
        </button>
      </div>

      <label className="block space-y-1">
        <span className="text-sm font-medium">CSV file</span>
        <input
          type="file"
          accept=".csv,text/csv"
          className="block text-sm"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            setPreview(null);
            setCsv(null);
            if (!f) return;
            if (f.size > 1024 * 1024) {
              setCheckError('The file is larger than 1 MB.');
              return;
            }
            const text = await f.text();
            setFileName(f.name);
            setCsv(text);
            await check(text, replace);
          }}
        />
      </label>

      {checking && <p className="text-sm text-muted-foreground" role="status">Checking {fileName}…</p>}
      {checkError && (
        <p role="alert" className="rounded-lg border border-error bg-error-light px-3 py-2 text-sm">
          {checkError}
        </p>
      )}

      {preview && !preview.valid && (
        <div role="alert" className="rounded-lg border border-error bg-error-light px-3 py-2 text-sm space-y-2">
          <p className="font-medium">
            {fileName} has {preview.errors.length === 100 ? 'at least 100' : preview.errors.length} problem{preview.errors.length === 1 ? '' : 's'}. Fix them in your spreadsheet and choose the file again.
          </p>
          <ul className="list-disc pl-5 space-y-0.5 max-h-60 overflow-auto">
            {preview.errors.map((e, i) => (
              <li key={i}>
                {e.row !== null && <span className="font-medium">Line {e.row}: </span>}
                {e.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {preview?.valid && (
        <div className="space-y-3">
          <p className="text-sm" role="status">
            {fileName} is ready: {preview.stats.subjects} subject{preview.stats.subjects === 1 ? '' : 's'}, {preview.stats.chapters} chapter
            {preview.stats.chapters === 1 ? '' : 's'}, {preview.stats.topics} topic{preview.stats.topics === 1 ? '' : 's'}.
          </p>
          {preview.warnings.length > 0 && (
            <ul className="rounded-lg border border-warning bg-warning-light px-3 py-2 text-sm list-disc pl-8 space-y-0.5">
              {preview.warnings.map((w, i) => (
                <li key={i}>
                  {w.row !== null && <span className="font-medium">Line {w.row}: </span>}
                  {w.message}
                </li>
              ))}
            </ul>
          )}
          <div className="max-h-72 overflow-auto rounded-lg border border-border p-3" aria-label="What will be imported">
            <ul className="space-y-0.5 text-sm">
              {preview.preview.map((n) => (
                <li key={n.row} style={{ paddingLeft: `${(n.level - 1) * 1.25}rem` }} className="flex flex-wrap gap-x-2">
                  <span className={n.type === 'SUBJECT' ? 'font-semibold' : ''}>{n.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {typeWord(n.type)}
                    {n.sourceRef ? `, ${n.sourceRef}` : ''}
                  </span>
                </li>
              ))}
            </ul>
            {preview.previewTruncated && <p className="mt-2 text-xs text-muted-foreground">Showing the first 1,000 entries.</p>}
          </div>
          {preview.existingEntries > 0 && (
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" className="mt-1" checked={replace} onChange={(e) => setReplace(e.target.checked)} />
              <span>Replace the {preview.existingEntries} entries already in this draft. If a lesson or objective already uses one of them, nothing is replaced.</span>
            </label>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          className={buttonPrimary}
          disabled={busy || checking || !canImport}
          onClick={() =>
            void run(async () => {
              const r = await ceeAdmin<{ imported: number; replaced: number }>(`/syllabi/${syllabus.id}/import`, {
                method: 'POST',
                json: { csv, dryRun: false, replace },
              });
              onClose();
              return `Imported ${r.imported} entries into “${syllabus.label}”${r.replaced ? `, replacing ${r.replaced}` : ''}. It’s still a draft until another academic director verifies it.`;
            })
          }
        >
          {preview?.valid ? `Import ${total} entries` : 'Import'}
        </button>
        <button type="button" className={buttonSecondary} onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── The official document's fingerprint, recorded while drafting ───────────

function SourcePanel({ syllabus, busy, run, onClose }: { syllabus: Syllabus; busy: boolean; run: Run; onClose: () => void }) {
  const [url, setUrl] = useState(syllabus.sourceUrl ?? '');
  const [hash, setHash] = useState<string | null>(null);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!hash) return;
        void run(async () => {
          await ceeAdmin(`/syllabi/${syllabus.id}`, { method: 'PATCH', json: { sourceUrl: url || null, sourceSha256: hash } });
          onClose();
          return 'Recorded the official document. The verifier will have to check this exact file.';
        });
      }}
      className="rounded-lg border border-dashed border-border p-4 space-y-3"
    >
      <p className="text-sm">
        Choose the official document you are entering this syllabus from. Its fingerprint is saved, so verification can only be done against the same file.
      </p>
      <label className="block space-y-1">
        <span className="text-sm font-medium">Where it is published</span>
        <input className={inputClass} type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" />
      </label>
      <label className="block space-y-1">
        <span className="text-sm font-medium">The document (stays on your computer; only its fingerprint is saved)</span>
        <input type="file" required className="block text-sm" onChange={async (e) => setHash(e.target.files?.[0] ? await sha256Hex(e.target.files[0]) : null)} />
      </label>
      {hash && <p className="text-xs text-muted-foreground break-all">SHA-256: {hash}</p>}
      <div className="flex gap-2">
        <button type="submit" className={buttonPrimary} disabled={busy || !hash}>
          Record document
        </button>
        <button type="button" className={buttonSecondary} onClick={onClose}>
          Cancel
        </button>
      </div>
    </form>
  );
}

// ── Verification by a second academic director ─────────────────────────────

function VerifyPanel({ syllabus, busy, run, onClose }: { syllabus: Syllabus; busy: boolean; run: Run; onClose: () => void }) {
  const [url, setUrl] = useState(syllabus.sourceUrl ?? '');
  const [hash, setHash] = useState<string | null>(null);
  const mismatch = !!hash && !!syllabus.sourceSha256 && hash !== syllabus.sourceSha256;
  if (syllabus.enteredByMe) {
    return (
      <div className="rounded-lg border border-dashed border-border p-4 space-y-3">
        <p className="text-sm">You created or entered part of this syllabus, so another academic director has to verify it.</p>
        <button type="button" className={buttonSecondary} onClick={onClose}>
          Close
        </button>
      </div>
    );
  }
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!hash || mismatch) return;
        void run(async () => {
          await ceeAdmin(`/syllabi/${syllabus.id}/verify`, { method: 'POST', json: { sourceUrl: url, sourceSha256: hash } });
          onClose();
          return `“${syllabus.label}” is verified and can no longer change. Lessons mapped to it can now be published.`;
        });
      }}
      className="rounded-lg border border-dashed border-border p-4 space-y-3"
    >
      <p className="text-sm">
        Check every subject, chapter and topic above against the official document, using the page references. Only a program-wide academic director who didn’t create or
        enter this syllabus can verify it. Verification can’t be undone; corrections need a new version.
      </p>
      {syllabus.sourceSha256 && (
        <p className="text-sm text-muted-foreground">
          It was entered from the document with fingerprint <span className="font-mono">{shortHash(syllabus.sourceSha256)}</span>. Choose that same file.
        </p>
      )}
      <label className="block space-y-1">
        <span className="text-sm font-medium">Where the official document is published</span>
        <input className={inputClass} type="url" required value={url} onChange={(e) => setUrl(e.target.value)} />
      </label>
      <label className="block space-y-1">
        <span className="text-sm font-medium">The official document (stays on your computer; only its fingerprint is checked)</span>
        <input type="file" required className="block text-sm" onChange={async (e) => setHash(e.target.files?.[0] ? await sha256Hex(e.target.files[0]) : null)} />
      </label>
      {hash && !mismatch && <p className="text-xs text-muted-foreground break-all">SHA-256: {hash}</p>}
      {mismatch && (
        <p role="alert" className="rounded-lg border border-error bg-error-light px-3 py-2 text-sm">
          This isn’t the document the syllabus was entered from (its fingerprint differs). Check you have the right version of the official document.
        </p>
      )}
      <div className="flex gap-2">
        <button type="submit" className={buttonPrimary} disabled={busy || !hash || !url || mismatch}>
          Verify syllabus
        </button>
        <button type="button" className={buttonSecondary} onClick={onClose}>
          Cancel
        </button>
      </div>
    </form>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function CurriculumClient() {
  const cur = useCeeData<CurriculumView>('/curriculum?program=cee_medical');
  const chapters = useExistingChapters();
  const chapterLabel = useMemo(() => new Map(chapters.map((c) => [c.id, c.label])), [chapters]);
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const run: Run = async (fn) => {
    setBusy(true);
    setMessage(null);
    try {
      const text = await fn();
      await cur.reload(); // so the confirmation never sits above a stale screen
      setMessage({ tone: 'ok', text });
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

  // One open panel at a time
  const [panel, setPanel] = useState<{ syllabusId: string; kind: 'import' | 'source' | 'verify' } | null>(null);
  const [adding, setAdding] = useState<{ syllabusId: string; parent: Node | null } | null>(null);
  const [linking, setLinking] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [sourceRef, setSourceRef] = useState('');
  const [legacyChapterId, setLegacyChapterId] = useState('');

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
          sourceRef: sourceRef.trim() || null,
          legacyChapterId: nodeType === 'CHAPTER' && legacyChapterId ? legacyChapterId : null,
        },
      });
      setAdding(null);
      setTitle('');
      setSourceRef('');
      setLegacyChapterId('');
      return `Added “${title.trim()}”.`;
    });
  };

  const link = (n: Node, chapterId: string) =>
    void run(async () => {
      await ceeAdmin(`/curriculum/nodes/${n.id}`, { method: 'PATCH', json: { legacyChapterId: chapterId || null } });
      setLinking(null);
      return chapterId ? `Linked “${n.title}” to ${chapterLabel.get(chapterId) ?? 'the course chapter'}.` : `Removed the link from “${n.title}”.`;
    });

  const renderTree = (s: Syllabus, parentId: string | null, depth: number): React.ReactNode => {
    const kids = s.nodes.filter((n) => n.parentId === parentId).sort((a, b) => a.sortKey - b.sortKey || a.title.localeCompare(b.title));
    if (kids.length === 0) return null;
    const draft = s.status === 'DRAFT';
    return (
      <ul className={depth === 0 ? 'space-y-1' : 'mt-1 space-y-1 border-l border-border pl-4'}>
        {kids.map((n) => (
          <li key={n.id}>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
              <span className={n.type === 'SUBJECT' ? 'font-semibold' : ''}>{n.title}</span>
              <span className="text-xs text-muted-foreground">
                {typeWord(n.type)}
                {n.sourceRef ? `, ${n.sourceRef}` : ''}
              </span>
              {n.legacyChapterId && <span className="text-xs text-muted-foreground">linked to {chapterLabel.get(n.legacyChapterId) ?? 'a course chapter'}</span>}
              {draft && (
                <button
                  type="button"
                  className="text-xs text-primary hover:underline"
                  onClick={() => {
                    setAdding({ syllabusId: s.id, parent: n });
                    setTitle('');
                    setSourceRef('');
                  }}
                >
                  Add {typeWord(childType(n.type))}
                </button>
              )}
              {n.type === 'CHAPTER' && (
                <button type="button" className="text-xs text-primary hover:underline" onClick={() => setLinking(linking === n.id ? null : n.id)}>
                  {n.legacyChapterId ? 'Change course link' : 'Link to a course chapter'}
                </button>
              )}
            </div>
            {linking === n.id && (
              <label className="mt-1 block max-w-xl space-y-1">
                <span className="text-xs">Course chapter page that shows this chapter’s visual lessons</span>
                <select className={inputClass} value={n.legacyChapterId ?? ''} disabled={busy} onChange={(e) => link(n, e.target.value)}>
                  <option value="">None</option>
                  {chapters.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {renderTree(s, n.id, depth + 1)}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <PageShell title="Syllabus" description="Lessons can only be published against a verified syllabus: a second academic director checks it against the official MEC document.">
      {cur.error ? (
        <AccessNotice error={cur.error} />
      ) : (
        <>
          {message && (
            <p role={message.tone === 'error' ? 'alert' : 'status'} className={`rounded-lg border px-4 py-3 text-sm ${message.tone === 'error' ? 'border-error bg-error-light' : 'border-success bg-success-light'}`}>
              {message.text}
            </p>
          )}

          {(cur.data?.syllabi ?? []).map((s) => {
            const draft = s.status === 'DRAFT';
            const open = (kind: 'import' | 'source' | 'verify') => {
              setAdding(null);
              setPanel(panel?.syllabusId === s.id && panel.kind === kind ? null : { syllabusId: s.id, kind });
            };
            return (
              <section key={s.id} className="rounded-xl border border-border bg-card p-5 space-y-4" aria-labelledby={`syl-${s.id}`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 id={`syl-${s.id}`} className="text-lg font-semibold">
                      {s.label}
                    </h2>
                    <StatusBadge status={s.status} />
                    {s.effectiveDate && <span className="text-sm text-muted-foreground">from {s.effectiveDate}</span>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {draft && (
                      <>
                        <button type="button" className={buttonSecondary} onClick={() => open('import')}>
                          Import from file
                        </button>
                        <button
                          type="button"
                          className={buttonSecondary}
                          onClick={() => {
                            setPanel(null);
                            setAdding({ syllabusId: s.id, parent: null });
                          }}
                        >
                          Add subject
                        </button>
                        <button type="button" className={buttonSecondary} onClick={() => open('source')}>
                          {s.sourceSha256 ? 'Change document' : 'Record document'}
                        </button>
                        <button type="button" className={buttonSecondary} onClick={() => open('verify')}>
                          Verify
                        </button>
                      </>
                    )}
                    {s.nodes.length > 0 && (
                      <a className={buttonSecondary} href={`/api/v1/cee/admin/syllabi/${s.id}/export`} download>
                        Download as CSV
                      </a>
                    )}
                  </div>
                </div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  {s.sourceUrl && (
                    <p>
                      Source:{' '}
                      <a href={s.sourceUrl} className="underline" target="_blank" rel="noreferrer">
                        {s.sourceUrl}
                      </a>
                    </p>
                  )}
                  {s.sourceSha256 && (
                    <p>
                      Document fingerprint <span className="font-mono">{shortHash(s.sourceSha256)}</span>
                      {s.verifiedAt ? `, verified ${new Date(s.verifiedAt).toLocaleDateString()}` : ''}
                    </p>
                  )}
                  {!draft && <p>This version can’t change. To correct it, create a new version, import its CSV, fix it and verify that.</p>}
                </div>

                {s.nodes.length === 0 ? <p className="text-sm text-muted-foreground">No subjects yet. Import them from a file or add them one by one.</p> : renderTree(s, null, 0)}

                {panel?.syllabusId === s.id && panel.kind === 'import' && <ImportPanel syllabus={s} busy={busy} run={run} onClose={() => setPanel(null)} />}
                {panel?.syllabusId === s.id && panel.kind === 'source' && <SourcePanel syllabus={s} busy={busy} run={run} onClose={() => setPanel(null)} />}
                {panel?.syllabusId === s.id && panel.kind === 'verify' && <VerifyPanel syllabus={s} busy={busy} run={run} onClose={() => setPanel(null)} />}

                {adding?.syllabusId === s.id && (
                  <form onSubmit={addNode} className="rounded-lg border border-dashed border-border p-4 space-y-3">
                    <p className="text-sm font-medium">{adding.parent ? `New ${typeWord(childType(adding.parent.type))} under “${adding.parent.title}”` : 'New subject'}</p>
                    <input className={inputClass} required maxLength={200} placeholder="Title, as written in the syllabus" aria-label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
                    <input
                      className={inputClass}
                      maxLength={200}
                      placeholder="Where it is in the document, e.g. p. 4, 2.3"
                      aria-label="Where it is in the document"
                      value={sourceRef}
                      onChange={(e) => setSourceRef(e.target.value)}
                    />
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
              </section>
            );
          })}

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
                return 'Syllabus created as a draft. Import its entries from a file or add them one by one.';
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
