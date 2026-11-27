'use client';

/**
 * Visual library: 3D models and 2D diagrams for lessons. Files go straight to a
 * private quarantine bucket (fingerprinted in the browser first), then the
 * server checks them. A version that passes is described, reviewed for
 * science, clarity and rights, and only then can be published — and only once
 * it has been scanned for malware (not set up until decision D7).
 */
import { useMemo, useState } from 'react';
import { AccessNotice, buttonPrimary, buttonSecondary, ceeAdmin, CeeAdminError, inputClass, PageShell, StatusBadge, useCeeData } from '../shared';

type Kind = 'MODEL_3D' | 'DIAGRAM_2D';
interface Version {
  id: string;
  number: number;
  status: 'UPLOADING' | 'VALIDATING' | 'VALIDATED' | 'REJECTED';
  scanStatus: 'NOT_SCANNED' | 'CLEAN' | 'INFECTED' | 'ERROR';
  mimeType: string;
  sizeBytes: number;
  published: boolean;
  locked: boolean;
  manifest: { title?: string; accessibility?: { description?: string } } | null;
  report: { ok: boolean; errors?: { code: string; message: string }[]; warnings?: { code: string; message: string }[]; image?: { width: number; height: number } } | null;
  review: { state: 'NOT_SUBMITTED' | 'IN_REVIEW' | 'APPROVED' | 'CHANGES_REQUESTED'; gates: { gate: string; decision: string | null; comments: string | null }[] };
  uploadedByMe: boolean;
  createdAt: string;
}
interface Asset {
  id: string;
  title: string;
  kind: Kind;
  license: string | null;
  sourceCredit: string | null;
  createdAt: string;
  versions: Version[];
}
interface Library {
  acceptedTypes: Record<string, { mime: string; ext: string; maxBytes: number }[]>;
  scannerConfigured: boolean;
  assets: Asset[];
}
type Run = (fn: () => Promise<string>) => Promise<void>;

const KIND_LABEL: Record<Kind, string> = { MODEL_3D: '3D model', DIAGRAM_2D: '2D diagram' };
const SCAN_LABEL: Record<Version['scanStatus'], string> = {
  NOT_SCANNED: 'Not scanned',
  CLEAN: 'Scanned: clean',
  INFECTED: 'Scanner flagged it',
  ERROR: 'Scan failed',
};
const size = (n: number) => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

async function sha256Hex(buf: ArrayBuffer) {
  const d = await crypto.subtle.digest('SHA-256', buf);
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** PUT with progress (fetch can't report upload progress). */
function putWithProgress(url: string, headers: Record<string, string>, body: Blob, onProgress: (f: number) => void) {
  return new Promise<number>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    for (const [k, v] of Object.entries(headers)) xhr.setRequestHeader(k, v);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onload = () => resolve(xhr.status);
    xhr.onerror = () => reject(new Error('The upload was interrupted. Check your connection and try again.'));
    xhr.send(body);
  });
}

// ── Upload a version ───────────────────────────────────────────────────────

function UploadPanel({ asset, accepted, run, onClose }: { asset: Asset; accepted: Library['acceptedTypes'][string]; run: Run; onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [stage, setStage] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const exts = accepted.map((t) => `.${t.ext}`).join(',');
  const type = file ? accepted.find((t) => file.name.toLowerCase().endsWith(`.${t.ext}`)) : undefined;
  const tooBig = !!file && !!type && file.size > type.maxBytes;

  return (
    <form
      className="rounded-lg border border-dashed border-border p-4 space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!file || !type || tooBig) return;
        void run(async () => {
          try {
            setStage('Fingerprinting the file…');
            const buf = await file.arrayBuffer();
            const sha256 = await sha256Hex(buf);
            setStage('Starting the upload…');
            const init = await ceeAdmin<{ versionId: string; versionNumber: number; upload: { url: string; headers: Record<string, string> } }>(`/assets/${asset.id}/versions`, {
              method: 'POST',
              json: { mimeType: type.mime, sizeBytes: file.size, sha256 },
            });
            setStage('Uploading…');
            const status = await putWithProgress(init.upload.url, init.upload.headers, new Blob([buf], { type: type.mime }), setProgress);
            if (status < 200 || status >= 300) throw new Error(`The storage service refused the file (HTTP ${status}).`);
            setStage('Checking the file on the server…');
            const r = await ceeAdmin<{ status: string; errors: { message: string }[]; nextStep: string }>(`/asset-versions/${init.versionId}/process`, { method: 'POST' });
            onClose();
            return r.status === 'REJECTED'
              ? `Version ${init.versionNumber} failed its checks: ${r.errors.map((x) => x.message).join(' ')}`
              : `Version ${init.versionNumber} passed its checks. Describe it, then send it for review. ${r.nextStep}`;
          } finally {
            setStage(null);
            setProgress(0);
          }
        });
      }}
    >
      <label className="block space-y-1">
        <span className="text-sm font-medium">File ({accepted.map((t) => `${t.ext.toUpperCase()} up to ${size(t.maxBytes)}`).join(', ')})</span>
        <input type="file" accept={exts} required className="block text-sm" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      </label>
      {file && !type && <p role="alert" className="text-sm text-error">This visual accepts {accepted.map((t) => t.ext.toUpperCase()).join(', ')} files only.</p>}
      {tooBig && <p role="alert" className="text-sm text-error">The file is larger than {size(type!.maxBytes)}.</p>}
      {stage && (
        <div role="status" className="space-y-1">
          <p className="text-sm">{stage}</p>
          {stage === 'Uploading…' && (
            <div className="h-2 rounded bg-muted" aria-hidden>
              <div className="h-2 rounded bg-primary" style={{ width: `${Math.round(progress * 100)}%` }} />
            </div>
          )}
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        The file goes to private storage and is checked on the server: its fingerprint and size must match, its contents must really be the stated type, and models and
        diagrams are validated. Nothing is visible to students.
      </p>
      <div className="flex gap-2">
        <button type="submit" className={buttonPrimary} disabled={!!stage || !file || !type || tooBig}>
          Upload and check
        </button>
        <button type="button" className={buttonSecondary} onClick={onClose} disabled={!!stage}>
          Cancel
        </button>
      </div>
    </form>
  );
}

// ── Describe a version (the parts of the manifest every visual needs) ─────

function DescribePanel({ asset, version, fallbacks, run, onClose }: { asset: Asset; version: Version; fallbacks: { id: string; label: string; ext: string }[]; run: Run; onClose: () => void }) {
  const [title, setTitle] = useState(version.manifest?.title ?? asset.title);
  const [description, setDescription] = useState(version.manifest?.accessibility?.description ?? '');
  const [reduced, setReduced] = useState(version.manifest ? (version.manifest as { accessibility?: { reducedMotionSupported?: boolean } }).accessibility?.reducedMotionSupported !== false : true);
  const existing = (version.manifest ?? {}) as Record<string, unknown> & { fallback?: { assetVersionId?: string }; accessibility?: { reducedMotionSupported?: boolean } };
  const [fallback, setFallback] = useState(existing.fallback?.assetVersionId ?? '');
  const is3d = asset.kind === 'MODEL_3D';
  return (
    <form
      className="rounded-lg border border-dashed border-border p-4 space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        void run(async () => {
          const fb = fallbacks.find((f) => f.id === fallback);
          await ceeAdmin(`/asset-versions/${version.id}/manifest`, {
            method: 'PUT',
            // Keep whatever else the manifest already has (hotspots, layers, tours).
            json: {
              hotspots: [],
              sequences: [],
              ...existing,
              schemaVersion: '1.0',
              kind: asset.kind,
              title: title.trim(),
              ...(is3d ? { model: (existing.model as object | undefined) ?? { format: 'glb', layers: [] }, fallback: { assetVersionId: fallback, kind: fb?.ext ?? 'svg' } } : {}),
              accessibility: { description: description.trim(), reducedMotionSupported: reduced },
            },
          });
          onClose();
          return `Described version ${version.number}. Hotspots, layers and guided tours can be added before review.`;
        });
      }}
    >
      <p className="text-sm">Describe version {version.number} for students who can’t see it and for the reviewers. This is fixed once it is sent for review.</p>
      <label className="block space-y-1">
        <span className="text-sm font-medium">Title students see</span>
        <input className={inputClass} required maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} />
      </label>
      <label className="block space-y-1">
        <span className="text-sm font-medium">Text description (what the visual shows, for screen readers; at least 20 characters)</span>
        <textarea className={inputClass} rows={3} required minLength={20} maxLength={4000} value={description} onChange={(e) => setDescription(e.target.value)} />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={reduced} onChange={(e) => setReduced(e.target.checked)} />
        Understandable without animation (for students who turn motion off)
      </label>
      {is3d && (
        <label className="block space-y-1">
          <span className="text-sm font-medium">2D fallback for devices that can’t show 3D</span>
          <select className={inputClass} required value={fallback} onChange={(e) => setFallback(e.target.value)}>
            <option value="">Choose a diagram version that passed its checks</option>
            {fallbacks.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
          {fallbacks.length === 0 && <span className="text-xs text-muted-foreground">Upload a 2D diagram first; every 3D model needs one.</span>}
        </label>
      )}
      <div className="flex gap-2">
        <button type="submit" className={buttonPrimary} disabled={description.trim().length < 20 || (is3d && !fallback)}>
          Save description
        </button>
        <button type="button" className={buttonSecondary} onClick={onClose}>
          Cancel
        </button>
      </div>
    </form>
  );
}

// ── One version row ────────────────────────────────────────────────────────

function VersionRow({ asset, v, fallbacks, run, openPanel, panel }: {
  asset: Asset;
  v: Version;
  fallbacks: { id: string; label: string; ext: string }[];
  run: Run;
  panel: string | null;
  openPanel: (key: string | null) => void;
}) {
  const [preview, setPreview] = useState<{ url: string; mimeType: string } | null>(null);
  const described = !!v.manifest;
  const canDescribe = v.status === 'VALIDATED' && !v.locked;
  const canSubmit = v.status === 'VALIDATED' && described && v.review.state === 'NOT_SUBMITTED';
  return (
    <li className="rounded-lg border border-border p-3 space-y-2">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <span className="font-medium">Version {v.number}</span>
        <StatusBadge status={v.status} />
        {v.status === 'VALIDATED' && <StatusBadge status={v.review.state} />}
        <span className="text-muted-foreground">
          {v.mimeType.split('/')[1].replace('gltf-binary', 'glb').replace('svg+xml', 'svg').toUpperCase()}, {size(v.sizeBytes)}
          {v.report?.image ? `, ${v.report.image.width} × ${v.report.image.height}` : ''}
        </span>
        {v.status === 'VALIDATED' && <span className="text-muted-foreground">{SCAN_LABEL[v.scanStatus]}</span>}
        {v.published && <span className="text-muted-foreground">ready for publishing</span>}
      </div>
      {v.status === 'REJECTED' && v.report?.errors && (
        <ul className="list-disc pl-5 text-sm text-error">
          {v.report.errors.map((e, i) => (
            <li key={i}>{e.message}</li>
          ))}
        </ul>
      )}
      {v.status === 'VALIDATED' && (v.report?.warnings?.length ?? 0) > 0 && (
        <details className="text-sm">
          <summary className="cursor-pointer text-muted-foreground">{v.report!.warnings!.length} warning(s) from the checks</summary>
          <ul className="list-disc pl-5 mt-1">
            {v.report!.warnings!.slice(0, 20).map((w, i) => (
              <li key={i}>{w.message}</li>
            ))}
          </ul>
        </details>
      )}
      {v.review.gates.some((g) => g.comments) && (
        <ul className="text-sm space-y-1">
          {v.review.gates
            .filter((g) => g.comments)
            .map((g, i) => (
              <li key={i} className="rounded border border-border px-3 py-2">
                <span className="font-medium">{g.gate.toLowerCase()} review:</span> {g.comments}
              </li>
            ))}
        </ul>
      )}
      {described && <p className="text-sm text-muted-foreground">Description: {v.manifest?.accessibility?.description}</p>}
      <div className="flex flex-wrap gap-2">
        {canDescribe && (
          <button type="button" className={buttonSecondary} onClick={() => openPanel(panel === `describe:${v.id}` ? null : `describe:${v.id}`)}>
            {described ? 'Edit description' : 'Describe'}
          </button>
        )}
        {v.status === 'VALIDATED' && (
          <button
            type="button"
            className={buttonSecondary}
            onClick={() =>
              void ceeAdmin<{ url: string; mimeType: string }>(`/asset-versions/${v.id}/preview`)
                .then(setPreview)
                .catch(() => setPreview(null))
            }
          >
            Preview
          </button>
        )}
        {canSubmit && (
          <button
            type="button"
            className={buttonPrimary}
            onClick={() =>
              void run(async () => {
                await ceeAdmin(`/asset-versions/${v.id}/submit`, { method: 'POST' });
                return `Version ${v.number} was sent to scientific, visual and rights review. Its description can no longer change.`;
              })
            }
          >
            Send for review
          </button>
        )}
        {(v.status === 'VALIDATING' || v.status === 'UPLOADING') && (
          <button
            type="button"
            className={buttonSecondary}
            onClick={() =>
              void run(async () => {
                const r = await ceeAdmin<{ status: string; nextStep: string }>(`/asset-versions/${v.id}/process`, { method: 'POST' });
                return `Version ${v.number}: ${r.status === 'REJECTED' ? 'failed its checks.' : r.nextStep}`;
              })
            }
          >
            Check again
          </button>
        )}
      </div>
      {preview && (
        <div className="rounded-lg border border-border p-3 space-y-2">
          {preview.mimeType.startsWith('image/') ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview.url} alt={v.manifest?.accessibility?.description ?? `${asset.title}, version ${v.number}`} className="max-h-80 w-auto" />
          ) : (
            <p className="text-sm">
              The 3D model opens in the review queue’s viewer once it is sent for review.{' '}
              <a className="text-primary hover:underline" href={preview.url} download>
                Download the file
              </a>{' '}
              (link valid for 10 minutes).
            </p>
          )}
          <button type="button" className="text-xs text-primary hover:underline" onClick={() => setPreview(null)}>
            Close preview
          </button>
        </div>
      )}
      {panel === `describe:${v.id}` && <DescribePanel asset={asset} version={v} fallbacks={fallbacks} run={run} onClose={() => openPanel(null)} />}
    </li>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function AssetsClient() {
  const lib = useCeeData<Library>('/assets?program=cee_medical');
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [panel, setPanel] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', kind: 'MODEL_3D' as Kind, license: '', sourceCredit: '' });

  const run: Run = async (fn) => {
    setBusy(true);
    setMessage(null);
    try {
      const text = await fn();
      await lib.reload(); // confirm only once the list shows the change
      setMessage({ tone: 'ok', text });
    } catch (e) {
      setMessage({ tone: 'error', text: e instanceof CeeAdminError || e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(false);
    }
  };

  const fallbacks = useMemo(
    () =>
      (lib.data?.assets ?? [])
        .filter((a) => a.kind === 'DIAGRAM_2D')
        .flatMap((a) =>
          a.versions
            .filter((v) => v.status === 'VALIDATED')
            .map((v) => {
              const ext = v.mimeType.split('/')[1].replace('svg+xml', 'svg');
              return { id: v.id, label: `${a.title}, version ${v.number} (${ext.toUpperCase()})`, ext };
            })
        ),
    [lib.data]
  );

  return (
    <PageShell
      title="Visuals"
      description="3D models and diagrams for lessons. Each upload is checked on the server, then reviewed for science, clarity and rights before any lesson can publish it."
    >
      {lib.error ? (
        <AccessNotice error={lib.error} />
      ) : (
        <>
          {lib.data && !lib.data.scannerConfigured && (
            <p className="rounded-lg border border-warning bg-warning-light px-4 py-3 text-sm">
              Malware scanning isn’t set up yet (decision D7). Uploads are checked and can be described, reviewed and attached to drafts, but no lesson that uses them can be
              published until they are scanned.
            </p>
          )}
          {message && (
            <p role={message.tone === 'error' ? 'alert' : 'status'} className={`rounded-lg border px-4 py-3 text-sm ${message.tone === 'error' ? 'border-error bg-error-light' : 'border-success bg-success-light'}`}>
              {message.text}
            </p>
          )}

          {(lib.data?.assets ?? []).map((a) => (
            <section key={a.id} className="rounded-xl border border-border bg-card p-5 space-y-3" aria-labelledby={`asset-${a.id}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 id={`asset-${a.id}`} className="text-lg font-semibold">
                    {a.title}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {KIND_LABEL[a.kind]}. Licence: {a.license}. Credit: {a.sourceCredit}
                  </p>
                </div>
                <button type="button" className={buttonSecondary} disabled={busy} onClick={() => setPanel(panel === `upload:${a.id}` ? null : `upload:${a.id}`)}>
                  Upload a version
                </button>
              </div>
              {panel === `upload:${a.id}` && lib.data && <UploadPanel asset={a} accepted={lib.data.acceptedTypes[a.kind]} run={run} onClose={() => setPanel(null)} />}
              {a.versions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No versions yet.</p>
              ) : (
                <ul className="space-y-2">
                  {a.versions.map((v) => (
                    <VersionRow key={v.id} asset={a} v={v} fallbacks={fallbacks} run={run} panel={panel} openPanel={setPanel} />
                  ))}
                </ul>
              )}
            </section>
          ))}

          <form
            className="rounded-xl border border-border bg-card p-5 space-y-3"
            aria-labelledby="new-asset"
            onSubmit={(e) => {
              e.preventDefault();
              void run(async () => {
                await ceeAdmin('/assets', { method: 'POST', json: { program: 'cee_medical', ...form } });
                setForm({ title: '', kind: form.kind, license: '', sourceCredit: '' });
                return `Created “${form.title.trim()}”. Upload its first version.`;
              });
            }}
          >
            <h2 id="new-asset" className="font-semibold">
              New visual
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block space-y-1">
                <span className="text-sm font-medium">Name</span>
                <input className={inputClass} required minLength={3} maxLength={200} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </label>
              <label className="block space-y-1">
                <span className="text-sm font-medium">Type</span>
                <select className={inputClass} value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as Kind })}>
                  <option value="MODEL_3D">3D model (GLB)</option>
                  <option value="DIAGRAM_2D">2D diagram (SVG, PNG or WebP)</option>
                </select>
              </label>
              <label className="block space-y-1">
                <span className="text-sm font-medium">Licence (exactly as the source states it, e.g. CC BY-SA 4.0)</span>
                <input className={inputClass} required minLength={2} maxLength={200} value={form.license} onChange={(e) => setForm({ ...form, license: e.target.value })} />
              </label>
              <label className="block space-y-1">
                <span className="text-sm font-medium">Source and credit (who made it, where it came from)</span>
                <input className={inputClass} required minLength={2} maxLength={500} value={form.sourceCredit} onChange={(e) => setForm({ ...form, sourceCredit: e.target.value })} />
              </label>
            </div>
            <button type="submit" className={buttonPrimary} disabled={busy || form.title.trim().length < 3 || form.license.trim().length < 2 || form.sourceCredit.trim().length < 2}>
              Create visual
            </button>
          </form>
        </>
      )}
    </PageShell>
  );
}
