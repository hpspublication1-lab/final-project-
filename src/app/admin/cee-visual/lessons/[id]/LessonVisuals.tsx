'use client';

/**
 * The visuals a lesson revision uses: one main visual (3D model or diagram), a
 * 2D fallback for 3D, and any supporting diagrams. Exact versions are
 * attached, so a later upload never changes an approved lesson. Publishing
 * needs every attached version reviewed, scanned and promoted; the database
 * checks that again at publication.
 */
import Link from 'next/link';
import { useState } from 'react';
import { buttonPrimary, ceeAdmin, CeeAdminError, inputClass, useCeeData } from '../../shared';

export interface AttachedVisual {
  role: 'PRIMARY' | 'FALLBACK' | 'SUPPORTING';
  versionId: string;
  versionNumber: number;
  assetId: string;
  title: string;
  kind: 'MODEL_3D' | 'DIAGRAM_2D';
  scanStatus: string;
  ready: boolean;
  described: boolean;
}

interface LibraryVersion {
  id: string;
  number: number;
  status: string;
  review: { state: string };
}
interface Library {
  assets: { id: string; title: string; kind: 'MODEL_3D' | 'DIAGRAM_2D'; versions: LibraryVersion[] }[];
}

const ROLE_LABEL: Record<AttachedVisual['role'], string> = { PRIMARY: 'Main visual', FALLBACK: '2D fallback', SUPPORTING: 'Supporting' };

function readiness(v: AttachedVisual) {
  if (v.ready) return 'Ready: reviewed, scanned and promoted';
  if (!v.described) return 'Not described yet';
  if (v.scanStatus !== 'CLEAN') return 'Not scanned yet (decision D7), so the lesson can’t be published';
  return 'Waiting for review or promotion';
}

export default function LessonVisuals({ revisionId, program, editable, attached, onChanged }: {
  revisionId: string;
  program: string;
  editable: boolean;
  attached: AttachedVisual[];
  onChanged: () => Promise<void>;
}) {
  const lib = useCeeData<Library>(editable ? `/assets?program=${program}` : null);
  const [choice, setChoice] = useState('');
  const [role, setRole] = useState<AttachedVisual['role']>('PRIMARY');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

  const act = async (fn: () => Promise<string>) => {
    setBusy(true);
    setMessage(null);
    try {
      const text = await fn();
      await onChanged();
      setMessage({ tone: 'ok', text });
    } catch (e) {
      setMessage({ tone: 'error', text: e instanceof CeeAdminError ? e.message : String(e) });
    } finally {
      setBusy(false);
    }
  };

  const options = (lib.data?.assets ?? []).flatMap((a) =>
    a.versions
      .filter((v) => v.status === 'VALIDATED' && !attached.some((x) => x.assetId === a.id))
      .map((v) => ({ id: v.id, kind: a.kind, label: `${a.title}, version ${v.number}${v.review.state === 'APPROVED' ? ' (approved)' : ''}` }))
  );
  const chosen = options.find((o) => o.id === choice);
  const hasPrimary = attached.some((a) => a.role === 'PRIMARY');
  const hasFallback = attached.some((a) => a.role === 'FALLBACK');
  const roleProblem =
    !chosen ? null : role === 'FALLBACK' && chosen.kind !== 'DIAGRAM_2D' ? 'A fallback must be a 2D diagram.' : role === 'PRIMARY' && hasPrimary ? 'This draft already has a main visual.' : role === 'FALLBACK' && hasFallback ? 'This draft already has a fallback.' : null;
  const needsFallback = attached.some((a) => a.role === 'PRIMARY' && a.kind === 'MODEL_3D') && !hasFallback;

  return (
    <section className="rounded-xl border border-border bg-card p-5 space-y-4" aria-labelledby="vis-h">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="vis-h" className="text-lg font-semibold">
          Visuals
        </h2>
        <Link href="/admin/cee-visual/assets" className="text-sm text-primary hover:underline">
          Open the visual library
        </Link>
      </div>
      {message && (
        <p role={message.tone === 'error' ? 'alert' : 'status'} className={`rounded-lg border px-3 py-2 text-sm ${message.tone === 'error' ? 'border-error bg-error-light' : 'border-success bg-success-light'}`}>
          {message.text}
        </p>
      )}
      {attached.length === 0 ? (
        <p className="text-sm text-muted-foreground">No visuals attached. A lesson can be published without one; it then shows its text sections and questions only.</p>
      ) : (
        <ul className="space-y-2">
          {attached.map((v) => (
            <li key={v.versionId} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm">
              <div>
                <p>
                  <span className="font-medium">{ROLE_LABEL[v.role]}:</span> {v.title}, version {v.versionNumber}
                </p>
                <p className="text-xs text-muted-foreground">{readiness(v)}</p>
              </div>
              {editable && (
                <button
                  type="button"
                  className="text-sm text-primary hover:underline"
                  disabled={busy}
                  onClick={() =>
                    void act(async () => {
                      await ceeAdmin(`/lesson-revisions/${revisionId}/assets/${v.versionId}`, { method: 'DELETE' });
                      return `Removed ${v.title}, version ${v.versionNumber}.`;
                    })
                  }
                >
                  Remove
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {needsFallback && <p className="text-sm text-warning">A 3D main visual needs a 2D fallback attached before the lesson can be published.</p>}
      {editable && (
        <form
          className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_11rem_auto] sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            if (!chosen || roleProblem) return;
            void act(async () => {
              await ceeAdmin(`/lesson-revisions/${revisionId}/assets`, { method: 'POST', json: { assetVersionId: chosen.id, role } });
              setChoice('');
              return `Attached ${chosen.label} as the ${ROLE_LABEL[role].toLowerCase()}.`;
            });
          }}
        >
          <label className="block space-y-1">
            <span className="text-sm font-medium">Visual version (only versions that passed their checks)</span>
            <select className={inputClass} value={choice} onChange={(e) => setChoice(e.target.value)}>
              <option value="">{lib.loading ? 'Loading…' : options.length ? 'Choose a version' : 'No versions available to attach'}</option>
              {options.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">Use as</span>
            <select className={inputClass} value={role} onChange={(e) => setRole(e.target.value as AttachedVisual['role'])}>
              <option value="PRIMARY">Main visual</option>
              <option value="FALLBACK">2D fallback</option>
              <option value="SUPPORTING">Supporting</option>
            </select>
          </label>
          <button type="submit" className={buttonPrimary} disabled={busy || !chosen || !!roleProblem}>
            Attach
          </button>
          {roleProblem && <p className="text-sm text-error sm:col-span-3">{roleProblem}</p>}
        </form>
      )}
      {!editable && attached.length > 0 && <p className="text-xs text-muted-foreground">Visuals can be changed only in a draft.</p>}
    </section>
  );
}
