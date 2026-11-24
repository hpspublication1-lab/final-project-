/**
 * Cross-checks a manifest against the model file it describes, so a hotspot,
 * layer or highlight can never point at a part that isn't in the GLB.
 */
import { VisualAssetManifest } from '../schemas';
import type { GlbReport, Issue } from './glb';

export interface ManifestCheck {
  ok: boolean;
  errors: Issue[];
  manifest: VisualAssetManifest | null;
}

export function checkManifest(raw: unknown, model: GlbReport | null): ManifestCheck {
  const parsed = VisualAssetManifest.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      manifest: null,
      errors: parsed.error.issues.slice(0, 20).map((i) => ({ code: 'MANIFEST_SCHEMA', message: `${i.path.join('.') || 'manifest'}: ${i.message}` })),
    };
  }
  const m = parsed.data;
  const errors: Issue[] = [];

  if (m.kind === 'MODEL_3D') {
    if (!model) {
      errors.push({ code: 'MODEL_MISSING', message: 'A 3D manifest needs a validated GLB.' });
    } else {
      const names = new Set(model.nodeNames);
      const dupes = new Set(model.duplicateNodeNames);
      const check = (node: string, where: string) => {
        if (!names.has(node)) errors.push({ code: 'NODE_NOT_IN_MODEL', message: `${where} names "${node}", which is not a node in the model.` });
        else if (dupes.has(node)) errors.push({ code: 'NODE_AMBIGUOUS', message: `${where} names "${node}", which appears more than once in the model.` });
      };
      for (const h of m.hotspots) if (h.targetNode) check(h.targetNode, `Hotspot "${h.id}"`);
      for (const l of m.model?.layers ?? []) for (const node of l.nodeNames) check(node, `Layer "${l.key}"`);
      for (const s of m.sequences)
        s.steps.forEach((st, i) => (st.highlight ?? []).forEach((node) => check(node, `Sequence "${s.key}" step ${i + 1}`)));
    }
  } else if (m.model) {
    errors.push({ code: 'MODEL_UNEXPECTED', message: 'Only 3D manifests may have a model block.' });
  }

  return { ok: errors.length === 0, errors: errors.slice(0, 50), manifest: m };
}
