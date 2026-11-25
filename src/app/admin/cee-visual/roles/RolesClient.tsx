'use client';

/** Super admins grant and revoke CEE content roles, for a whole course or one subject. */
import { useMemo, useState } from 'react';
import {
  AccessNotice,
  buttonPrimary,
  buttonSecondary,
  ceeAdmin,
  CeeAdminError,
  inputClass,
  PageShell,
  ROLE_LABEL,
  useCeeData,
  useCeeMe,
  type CurriculumView,
} from '../shared';

interface RoleRow {
  id: string;
  userId: string;
  email: string | null;
  name: string | null;
  role: string;
  subjectNodeId: string | null;
  grantedAt: string;
}

const ROLE_HELP: Record<string, string> = {
  ACADEMIC_DIRECTOR: 'Builds and verifies the syllabus; decides the syllabus-mapping gate; can review visuals.',
  SUBJECT_EXPERT: 'Decides the scientific and visual gates.',
  EDITOR: 'Writes lessons and questions.',
  ANIMATOR: 'Uploads 3D models and diagrams.',
  QUESTION_REVIEWER: 'Decides the questions gate.',
  ACCESSIBILITY_REVIEWER: 'Decides the accessibility gate.',
  RIGHTS_REVIEWER: 'Decides the rights and licences gate.',
  PUBLISHER: 'Publishes approved revisions they didn’t write.',
};

export default function RolesClient() {
  const { me, error: meError } = useCeeMe();
  const roles = useCeeData<{ roles: RoleRow[] }>(me?.isSuperAdmin ? '/roles?program=cee_medical' : null);
  const cur = useCeeData<CurriculumView>(me?.isSuperAdmin ? '/curriculum?program=cee_medical' : null);
  const subjects = useMemo(() => (cur.data?.syllabi ?? []).flatMap((s) => s.nodes.filter((n) => n.type === 'SUBJECT').map((n) => ({ id: n.id, label: `${n.title} (${s.label})` }))), [cur.data]);
  const subjectName = useMemo(() => new Map(subjects.map((s) => [s.id, s.label])), [subjects]);

  const [email, setEmail] = useState('');
  const [role, setRole] = useState('EDITOR');
  const [subject, setSubject] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

  const act = async (fn: () => Promise<string>) => {
    setBusy(true);
    setMessage(null);
    try {
      const text = await fn();
      await roles.reload(); // confirm only once the list shows the change
      setMessage({ tone: 'ok', text });
    } catch (e) {
      setMessage({ tone: 'error', text: e instanceof CeeAdminError ? e.message : String(e) });
    } finally {
      setBusy(false);
    }
  };

  const shell = (body: React.ReactNode) => (
    <PageShell title="Roles" description="Who can write, review and publish CEE visual lessons. Each role covers the whole course or one subject.">
      {body}
    </PageShell>
  );

  if (meError) return shell(<AccessNotice error={meError} />);
  if (!me) return shell(<p className="text-sm text-muted-foreground">Loading…</p>);
  if (!me.isSuperAdmin) {
    return shell(
      <div className="rounded-xl border border-border bg-card p-5 text-sm space-y-2">
        <p>Only a super admin can change roles. Your roles:</p>
        <ul className="list-disc pl-5">
          {me.assignments.map((a) => (
            <li key={a.id}>
              {ROLE_LABEL[a.role] ?? a.role}
              {a.subjectNodeId ? ' (one subject)' : ' (whole course)'}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return shell(
    <>
      {message && (
        <p role={message.tone === 'error' ? 'alert' : 'status'} className={`rounded-lg border px-4 py-3 text-sm ${message.tone === 'error' ? 'border-error bg-error-light' : 'border-success bg-success-light'}`}>
          {message.text}
        </p>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void act(async () => {
            await ceeAdmin('/roles', { method: 'POST', json: { email: email.trim(), role, program: 'cee_medical', subjectNodeId: subject || null } });
            setEmail('');
            return `${ROLE_LABEL[role]} granted to ${email.trim()}.`;
          });
        }}
        className="rounded-xl border border-border bg-card p-5 space-y-3"
        aria-labelledby="grant-h"
      >
        <h2 id="grant-h" className="font-semibold">
          Grant a role
        </h2>
        <div className="grid gap-3 md:grid-cols-3">
          <input className={inputClass} type="email" required placeholder="Their account email" aria-label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <select className={inputClass} aria-label="Role" value={role} onChange={(e) => setRole(e.target.value)}>
            {Object.entries(ROLE_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <select className={inputClass} aria-label="Scope" value={subject} onChange={(e) => setSubject(e.target.value)}>
            <option value="">Whole CEE course</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                Only {s.label}
              </option>
            ))}
          </select>
        </div>
        <p className="text-sm text-muted-foreground">{ROLE_HELP[role]}</p>
        <button type="submit" className={buttonPrimary} disabled={busy}>
          Grant role
        </button>
      </form>

      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-xs text-muted-foreground">
            <tr>
              <th className="py-3 px-4 font-medium">Person</th>
              <th className="py-3 px-4 font-medium">Role</th>
              <th className="py-3 px-4 font-medium">Scope</th>
              <th className="py-3 px-4 font-medium">Since</th>
              <th className="py-3 px-4" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(roles.data?.roles ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 px-4 text-center text-muted-foreground">
                  Nobody has a CEE content role yet.
                </td>
              </tr>
            )}
            {(roles.data?.roles ?? []).map((r) => (
              <tr key={r.id}>
                <td className="py-3 px-4">
                  {r.name ?? r.email ?? r.userId}
                  {r.name && r.email && <span className="block text-xs text-muted-foreground">{r.email}</span>}
                </td>
                <td className="py-3 px-4">{ROLE_LABEL[r.role] ?? r.role}</td>
                <td className="py-3 px-4 text-muted-foreground">{r.subjectNodeId ? (subjectName.get(r.subjectNodeId) ?? 'One subject') : 'Whole course'}</td>
                <td className="py-3 px-4 text-muted-foreground">{new Date(r.grantedAt).toLocaleDateString()}</td>
                <td className="py-3 px-4 text-right">
                  <button
                    type="button"
                    className={buttonSecondary}
                    disabled={busy}
                    onClick={() => void act(async () => (await ceeAdmin(`/roles/${r.id}/revoke`, { method: 'POST' }), `Removed ${ROLE_LABEL[r.role]} from ${r.email ?? 'that account'}.`))}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
