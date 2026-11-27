'use client';

/** Shared pieces for the CEE visual admin screens. */
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useState, type ReactNode } from 'react';

export class CeeAdminError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status: number,
    readonly details: Record<string, unknown> = {}
  ) {
    super(message);
  }
}

/** Calls /api/v1/cee/admin…, unwraps { data } and turns { error } into CeeAdminError. */
export async function ceeAdmin<T>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, headers, ...rest } = init;
  const res = await fetch(`/api/v1/cee/admin${path}`, {
    ...rest,
    headers: { ...(json !== undefined ? { 'content-type': 'application/json' } : {}), ...(headers ?? {}) },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const e = body?.error ?? {};
    throw new CeeAdminError(e.message ?? `Request failed (${res.status}).`, e.code ?? 'UNKNOWN', res.status, e.details ?? {});
  }
  return body.data as T;
}

export interface MeView {
  userId: string;
  email: string | null;
  isSuperAdmin: boolean;
  assignments: { id: string; role: string; program: string; subjectNodeId: string | null }[];
}

export function useCeeMe() {
  const [me, setMe] = useState<MeView | null>(null);
  const [error, setError] = useState<CeeAdminError | null>(null);
  useEffect(() => {
    ceeAdmin<MeView>('/me')
      .then(setMe)
      .catch((e) => setError(e instanceof CeeAdminError ? e : new CeeAdminError(String(e), 'UNKNOWN', 0)));
  }, []);
  return { me, error };
}

/** Loads data and exposes reload; errors are kept for display. */
export function useCeeData<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<CeeAdminError | null>(null);
  const [loading, setLoading] = useState(false);
  const reload = useCallback(async () => {
    if (!path) return;
    setLoading(true);
    try {
      setData(await ceeAdmin<T>(path));
      setError(null);
    } catch (e) {
      setError(e instanceof CeeAdminError ? e : new CeeAdminError(String(e), 'UNKNOWN', 0));
    } finally {
      setLoading(false);
    }
  }, [path]);
  useEffect(() => {
    void reload();
  }, [reload]);
  return { data, error, loading, reload, setData };
}

const NAV = [
  { href: '/admin/cee-visual/lessons', label: 'Lessons' },
  { href: '/admin/cee-visual/assets', label: 'Visuals' },
  { href: '/admin/cee-visual/reviews', label: 'Reviews' },
  { href: '/admin/cee-visual/curriculum', label: 'Syllabus' },
  { href: '/admin/cee-visual/roles', label: 'Roles' },
];

export function PageShell({ title, description, actions, children }: { title: string; description: string; actions?: ReactNode; children: ReactNode }) {
  const path = usePathname();
  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-5">
          <div>
            <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground mb-1">
              <Link href="/admin" className="hover:underline">
                Admin
              </Link>{' '}
              / CEE visual lessons
            </nav>
            <h1 className="text-2xl font-bold">{title}</h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{description}</p>
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
        <nav aria-label="CEE visual admin" className="flex flex-wrap gap-1">
          {NAV.map((n) => {
            const active = path?.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-current={active ? 'page' : undefined}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium ${active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>
        {children}
      </div>
    </div>
  );
}

/** Plain-language explanation of why a screen can't load. */
export function AccessNotice({ error }: { error: CeeAdminError }) {
  const text =
    error.code === 'UNAUTHENTICATED'
      ? 'Sign in to use the CEE visual lessons studio.'
      : error.code === 'FORBIDDEN'
        ? `${error.message} A super admin can grant you a role on the Roles screen.`
        : error.code === 'NOT_FOUND'
          ? 'The CEE visual lesson tables aren’t on this database yet. Nothing can be created until the schema is applied.'
          : error.message;
  return (
    <div role="alert" className="rounded-xl border border-border bg-card p-5 text-sm">
      {text}
    </div>
  );
}

const STATUS_STYLE: Record<string, string> = {
  DRAFT: 'bg-muted text-foreground border-border',
  IN_REVIEW: 'bg-warning-light text-foreground border-warning',
  CHANGES_REQUESTED: 'bg-error-light text-foreground border-error',
  APPROVED: 'bg-primary/10 text-primary border-primary/40',
  PUBLISHED: 'bg-success-light text-foreground border-success',
  SUPERSEDED: 'bg-muted text-muted-foreground border-border',
  ARCHIVED: 'bg-muted text-muted-foreground border-border',
  OPEN: 'bg-warning-light text-foreground border-warning',
  DECIDED: 'bg-muted text-foreground border-border',
  CANCELLED: 'bg-muted text-muted-foreground border-border',
  VERIFIED: 'bg-success-light text-foreground border-success',
  UPLOADING: 'bg-muted text-foreground border-border',
  VALIDATING: 'bg-warning-light text-foreground border-warning',
  VALIDATED: 'bg-primary/10 text-primary border-primary/40',
  REJECTED: 'bg-error-light text-foreground border-error',
  NOT_SUBMITTED: 'bg-muted text-muted-foreground border-border',
  RETIRED: 'bg-muted text-muted-foreground border-border',
};

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Draft',
  IN_REVIEW: 'In review',
  CHANGES_REQUESTED: 'Changes requested',
  APPROVED: 'Approved',
  PUBLISHED: 'Published',
  SUPERSEDED: 'Superseded',
  ARCHIVED: 'Archived',
  OPEN: 'Waiting',
  DECIDED: 'Decided',
  CANCELLED: 'Cancelled',
  VERIFIED: 'Verified',
  UPLOADING: 'Waiting for file',
  VALIDATING: 'Checking',
  VALIDATED: 'Passed checks',
  REJECTED: 'Failed checks',
  NOT_SUBMITTED: 'Not sent for review',
  RETIRED: 'Retired',
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLE[status] ?? 'bg-muted border-border'}`}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

export const GATE_LABEL: Record<string, string> = {
  SYLLABUS_MAPPING: 'Syllabus mapping',
  SCIENTIFIC: 'Scientific accuracy',
  VISUAL: 'Visual accuracy',
  ASSESSMENT: 'Questions',
  ACCESSIBILITY: 'Accessibility',
  RIGHTS: 'Rights and licences',
};

export const ROLE_LABEL: Record<string, string> = {
  ACADEMIC_DIRECTOR: 'Academic director',
  SUBJECT_EXPERT: 'Subject expert',
  ANIMATOR: 'Animator',
  EDITOR: 'Editor',
  QUESTION_REVIEWER: 'Question reviewer',
  ACCESSIBILITY_REVIEWER: 'Accessibility reviewer',
  RIGHTS_REVIEWER: 'Rights reviewer',
  PUBLISHER: 'Publisher',
};

export const inputClass =
  'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary';
export const buttonPrimary =
  'inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-dark disabled:opacity-50';
export const buttonSecondary =
  'inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50';

export interface CurriculumView {
  syllabi: {
    id: string;
    label: string;
    status: string;
    effectiveDate: string | null;
    sourceUrl: string | null;
    sourceSha256: string | null;
    verifiedAt: string | null;
    enteredByMe: boolean;
    nodes: { id: string; parentId: string | null; type: string; code: string; title: string; sortKey: number; sourceRef: string | null; legacyChapterId: string | null }[];
  }[];
}

export interface ImportPreview {
  dryRun: true;
  valid: boolean;
  errors: { row: number | null; column?: string; message: string }[];
  warnings: { row: number | null; message: string }[];
  stats: { subjects: number; chapters: number; topics: number; deepestLevel: number; withoutSourceRef: number };
  existingEntries: number;
  needsReplace: boolean;
  preview: { row: number; level: number; type: string; code: string; title: string; sourceRef: string | null }[];
  previewTruncated: boolean;
}

/** "Biology › Human Physiology › Human Heart" for each node. */
export function nodePaths(c: CurriculumView | null): Map<string, { path: string; type: string; syllabus: string; verified: boolean }> {
  const out = new Map<string, { path: string; type: string; syllabus: string; verified: boolean }>();
  for (const s of c?.syllabi ?? []) {
    const byId = new Map(s.nodes.map((n) => [n.id, n]));
    for (const n of s.nodes) {
      const parts: string[] = [];
      for (let x: typeof n | undefined = n, i = 0; x && i < 10; x = x.parentId ? byId.get(x.parentId) : undefined, i++) parts.unshift(x.title);
      out.set(n.id, { path: parts.join(' › '), type: n.type, syllabus: s.label, verified: s.status === 'VERIFIED' });
    }
  }
  return out;
}
