/**
 * Samyak Guru — CEE Visual Intelligence
 * Canonical Visual Asset Manifest Schema (FND-005)
 * Strict validation for 3D GLB, 2D simulation, and fallback manifests.
 */

import { z } from 'zod';

export const AssetKindSchema = z.enum([
  'MODEL_3D',
  'DIAGRAM_2D',
  'ANIMATION_2D',
  'VIDEO',
  'SIMULATION',
]);

export type AssetKind = z.infer<typeof AssetKindSchema>;

export const Coordinate3DSchema = z.tuple([z.number(), z.number(), z.number()]);

export const HotspotSchema = z.object({
  id: z.string().min(1, 'Hotspot ID is required'),
  label: z.string().min(1, 'Hotspot label is required'),
  targetNode: z.string().optional(),
  position: Coordinate3DSchema.optional(),
  explanation: z.string().optional(),
  color: z.string().optional(),
  cameraPreset: z
    .object({
      position: Coordinate3DSchema,
      target: Coordinate3DSchema,
    })
    .optional(),
});

export type Hotspot = z.infer<typeof HotspotSchema>;

export const ModelMetadataSchema = z.object({
  format: z.enum(['glb', 'gltf']),
  initialCamera: z
    .object({
      position: Coordinate3DSchema,
      target: Coordinate3DSchema,
    })
    .optional(),
  layers: z.array(z.string()).optional().default([]),
  animations: z.array(z.string()).optional().default([]),
  explodedViewAvailable: z.boolean().default(false),
  clippingAvailable: z.boolean().default(false),
});

export const SimulationStepSchema = z.object({
  id: z.string().optional(),
  label: z.string(),
  note: z.string(),
  drift: z.enum(['to-blood', 'to-air', 'down', 'along', 'pulse', 'circulation', 'filtration']),
  highlightNodes: z.array(z.string()).optional(),
});

export const SimulationMetadataSchema = z.object({
  engine: z.enum(['stage_drift', 'cardiac_cycle', 'action_potential', 'nephron_flow', 'chemical_reaction']),
  playbackModes: z.array(z.string()).default(['forward']),
  defaultSpeed: z.number().default(1),
  steps: z.array(SimulationStepSchema).default([]),
});

export const AccessibilityMetadataSchema = z.object({
  description: z.string().min(5, 'Accessible description must be informative'),
  reducedMotionSupported: z.boolean().default(true),
  captionsUrl: z.string().url().optional(),
  transcriptMarkdown: z.string().optional(),
  screenReaderKeyPoints: z.array(z.string()).optional().default([]),
});

export const VisualAssetManifestSchema = z.object({
  schemaVersion: z.literal('1.0'),
  assetId: z.string().min(1, 'Asset ID required'),
  assetVersionId: z.string().min(1, 'Asset version ID required'),
  kind: AssetKindSchema,
  title: z.string().min(1, 'Title required'),
  sourceUrl: z.string().min(1, 'Source URL required'),
  fallbackUrl: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  checksumSha256: z.string().length(64, 'Checksum must be 64-char SHA256 hex string'),
  model: ModelMetadataSchema.optional(),
  simulation: SimulationMetadataSchema.optional(),
  hotspots: z.array(HotspotSchema).optional().default([]),
  accessibility: AccessibilityMetadataSchema,
  tags: z.array(z.string()).optional().default([]),
});

export type VisualAssetManifest = z.infer<typeof VisualAssetManifestSchema>;

/**
 * Validate an untrusted manifest JSON payload against canonical schema.
 */
export function validateVisualManifest(input: unknown): {
  success: boolean;
  data?: VisualAssetManifest;
  errors?: string[];
} {
  const result = VisualAssetManifestSchema.safeParse(input);
  if (!result.success) {
    const issues = result.error.issues ?? (result.error as any).errors ?? [];
    const errors = issues.map((e: any) => `${e.path.join('.')}: ${e.message}`);
    return { success: false, errors };
  }
  return { success: true, data: result.data };
}

/**
 * Check whether a model source URL is within an approved CDN / host origin.
 */
export function isAllowedAssetOrigin(url: string, allowedOrigins: string[] = []): boolean {
  try {
    // Relative paths are always internal and allowed
    if (url.startsWith('/')) return true;

    const parsed = new URL(url);
    const defaultAllowed = [
      'localhost',
      '127.0.0.1',
      'samyakcee.com',
      'assets.samyakcee.com',
      'zqkmrrckuvabtdfyrywm.supabase.co',
    ];
    const combined = [...defaultAllowed, ...allowedOrigins];
    return combined.some((allowed) => parsed.hostname === allowed || parsed.hostname.endsWith(`.${allowed}`));
  } catch {
    return false;
  }
}
