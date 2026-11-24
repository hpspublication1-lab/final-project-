/**
 * CEE Visual Intelligence: request, manifest, event and bridge schemas.
 *
 * One source of truth for the shapes that cross a trust boundary (browser →
 * server, mobile app ↔ WebView, CMS → database). Everything here is strict:
 * unknown keys are rejected rather than silently dropped.
 *
 * See docs/cee-visual/API_SPECIFICATION.md §5.
 */
import { z } from 'zod';

// ── Primitives ────────────────────────────────────────────────────────────

export const Uuid = z.uuid();

/** Mirrors the cee_program_code domain in the proposed schema. */
export const PROGRAM_CODES = [
  'cee_medical',
  'see_class_10',
  'neb_class_11',
  'neb_class_12',
  'ioe_engineering',
  'lok_sewa',
  'ielts',
  'digital_marketing',
  'artificial_intelligence',
] as const;
export const ProgramCode = z.enum(PROGRAM_CODES);
export type ProgramCode = z.infer<typeof ProgramCode>;

/** Short machine keys used inside manifests and lesson content. */
export const Key = z.string().regex(/^[a-z0-9][a-z0-9-]{0,63}$/, 'lowercase letters, digits and hyphens');

const Vec3 = z.tuple([z.number(), z.number(), z.number()]);
const Camera = z.strictObject({ position: Vec3, target: Vec3 });

/** JSON payloads are capped at 8 KB, matching the database CHECK. */
const MAX_PAYLOAD_BYTES = 8192;
const utf8Length = (s: string) => new TextEncoder().encode(s).length;
const smallJson = <T extends z.ZodType>(schema: T) =>
  schema.refine((v) => utf8Length(JSON.stringify(v)) <= MAX_PAYLOAD_BYTES, 'payload larger than 8 KB');

const uniqueBy = <T>(items: T[], key: (t: T) => string) => new Set(items.map(key)).size === items.length;

// ── Visual asset manifest ─────────────────────────────────────────────────

export const ASSET_KINDS = ['MODEL_3D', 'DIAGRAM_2D', 'ANIMATION_2D', 'VIDEO', 'SIMULATION'] as const;
export const AssetKind = z.enum(ASSET_KINDS);

export const Layer = z.strictObject({
  key: Key,
  label: z.string().min(1).max(120),
  nodeNames: z.array(z.string().min(1).max(200)).min(1).max(500),
  visibleByDefault: z.boolean().default(true),
});

export const Hotspot = z
  .strictObject({
    id: Key,
    label: z.string().min(1).max(120),
    /** Name of a node in the GLB. Checked against the file at validation time. */
    targetNode: z.string().min(1).max(200).optional(),
    /** Fixed position in model space, for points with no node of their own. */
    position: Vec3.optional(),
    explanation: z.string().max(2000).optional(),
  })
  .refine((h) => h.targetNode !== undefined || h.position !== undefined, 'hotspot needs targetNode or position');

export const SequenceStep = z.strictObject({
  atMs: z.number().int().min(0).max(30 * 60 * 1000),
  caption: z.string().min(1).max(500),
  camera: Camera.optional(),
  visibleLayers: z.array(Key).max(64).optional(),
  highlight: z.array(z.string().min(1).max(200)).max(64).optional(),
});

export const Sequence = z
  .strictObject({
    key: Key,
    title: z.string().min(1).max(200),
    steps: z.array(SequenceStep).min(1).max(100),
  })
  .refine((s) => s.steps.every((st, i) => i === 0 || st.atMs >= s.steps[i - 1].atMs), 'steps must be in time order');

export const VisualAssetManifest = z
  .strictObject({
    schemaVersion: z.literal('1.0'),
    kind: AssetKind,
    title: z.string().min(1).max(200),
    model: z
      .strictObject({
        format: z.literal('glb'),
        initialCamera: Camera.optional(),
        layers: z.array(Layer).max(64).default([]),
      })
      .optional(),
    hotspots: z.array(Hotspot).max(200).default([]),
    sequences: z.array(Sequence).max(20).default([]),
    /** Required for 3D: the approved 2D image shown when 3D can't run. */
    fallback: z.strictObject({ assetVersionId: Uuid, kind: z.enum(['svg', 'png', 'webp']) }).optional(),
    accessibility: z.strictObject({
      /** What the visual shows, for screen readers and the fallback view. */
      description: z.string().min(20).max(4000),
      reducedMotionSupported: z.boolean(),
    }),
  })
  .refine((m) => m.kind !== 'MODEL_3D' || m.model !== undefined, { message: 'model block required for 3D', path: ['model'] })
  .refine((m) => m.kind !== 'MODEL_3D' || m.fallback !== undefined, {
    message: 'a 2D fallback is required for 3D',
    path: ['fallback'],
  })
  .refine((m) => uniqueBy(m.hotspots, (h) => h.id), { message: 'hotspot ids must be unique', path: ['hotspots'] })
  .refine((m) => uniqueBy(m.sequences, (s) => s.key), { message: 'sequence keys must be unique', path: ['sequences'] })
  .refine((m) => uniqueBy(m.model?.layers ?? [], (l) => l.key), { message: 'layer keys must be unique', path: ['model', 'layers'] })
  .refine(
    (m) => {
      const layerKeys = new Set((m.model?.layers ?? []).map((l) => l.key));
      return m.sequences.every((s) => s.steps.every((st) => (st.visibleLayers ?? []).every((k) => layerKeys.has(k))));
    },
    { message: 'a sequence step names a layer that does not exist', path: ['sequences'] }
  );
export type VisualAssetManifest = z.infer<typeof VisualAssetManifest>;

/**
 * What the player receives: the manifest plus short-lived URLs the server
 * injected at read time. Only short-lived signed URLs reach the browser.
 */
export interface ResolvedVisual {
  assetVersionId: string;
  manifest: VisualAssetManifest;
  /** MODEL_3D: the GLB. */
  modelUrl?: string;
  /** MODEL_3D: the approved 2D fallback image. */
  fallbackUrl?: string;
  /** DIAGRAM_2D: the diagram itself. */
  diagramUrl?: string;
  /** Labelled when the visual is a development fixture, never real content. */
  fixtureNotice?: string;
}

// ── Lesson content (cee_lesson_revisions.content) ─────────────────────────

export const LessonSection = z.strictObject({
  key: Key,
  heading: z.string().min(1).max(200),
  /** Markdown. Rendered without raw HTML. */
  body: z.string().min(1).max(20000),
  required: z.boolean().default(true),
});

export const LessonContent = z
  .strictObject({
    schemaVersion: z.literal('1.0'),
    summary: z.string().min(1).max(2000),
    sections: z.array(LessonSection).min(1).max(30),
    /** cee_learning_objectives ids this lesson teaches. */
    objectiveIds: z.array(Uuid).max(30).default([]),
    completion: z
      .strictObject({
        /** A sequence in the primary visual that must be stepped through. */
        requireSequenceKey: Key.optional(),
        /** Minimum best-attempt score, when the lesson has questions. */
        minScorePercent: z.number().min(0).max(100).optional(),
      })
      .default({}),
  })
  .refine((c) => uniqueBy(c.sections, (s) => s.key), { message: 'section keys must be unique', path: ['sections'] });
export type LessonContent = z.infer<typeof LessonContent>;

// ── Player events ─────────────────────────────────────────────────────────

const eventBase = { eventId: Uuid, occurredAt: z.iso.datetime({ offset: true }), assetVersionId: Uuid.optional() };

export const PlayerEvent = z.discriminatedUnion('type', [
  z.strictObject({ ...eventBase, type: z.literal('LESSON_OPENED'), payload: z.strictObject({}).default({}) }),
  z.strictObject({
    ...eventBase,
    type: z.literal('PLAYER_READY'),
    payload: z.strictObject({ mode: z.enum(['3d', 'fallback', 'diagram']) }),
  }),
  z.strictObject({
    ...eventBase,
    type: z.literal('PLAYER_ERROR'),
    payload: z.strictObject({ code: z.string().regex(/^[A-Z_]{1,64}$/), detail: z.string().max(500).optional() }),
  }),
  z.strictObject({
    ...eventBase,
    type: z.literal('FALLBACK_SHOWN'),
    payload: z.strictObject({ reason: z.enum(['NO_WEBGL', 'LOAD_FAILED', 'CONTEXT_LOST', 'USER_CHOICE']) }),
  }),
  z.strictObject({ ...eventBase, type: z.literal('STRUCTURE_SELECTED'), payload: z.strictObject({ hotspotId: Key }) }),
  z.strictObject({
    ...eventBase,
    type: z.literal('SEQUENCE_STEP'),
    payload: z.strictObject({ sequenceKey: Key, stepIndex: z.number().int().min(0).max(99) }),
  }),
  z.strictObject({ ...eventBase, type: z.literal('SEQUENCE_COMPLETED'), payload: z.strictObject({ sequenceKey: Key }) }),
  z.strictObject({ ...eventBase, type: z.literal('SECTION_READ'), payload: z.strictObject({ sectionKey: Key }) }),
]);
export type PlayerEvent = z.infer<typeof PlayerEvent>;
export type PlayerEventType = PlayerEvent['type'];

export const EventBatch = z
  .strictObject({ events: z.array(PlayerEvent).min(1).max(50) })
  .refine((b) => uniqueBy(b.events, (e) => e.eventId), { message: 'duplicate eventId in batch', path: ['events'] })
  .refine((b) => b.events.every((e) => utf8Length(JSON.stringify(e.payload)) <= MAX_PAYLOAD_BYTES), 'payload larger than 8 KB');

// ── MCQ attempts ──────────────────────────────────────────────────────────

export const Choice = z.enum(['A', 'B', 'C', 'D']);
export type Choice = z.infer<typeof Choice>;

export const AttemptRequest = z
  .strictObject({
    answers: z
      .array(z.strictObject({ questionRevisionId: Uuid, choice: Choice.nullable() }))
      .min(1)
      .max(100),
  })
  .refine((a) => uniqueBy(a.answers, (x) => x.questionRevisionId), {
    message: 'each question may be answered once',
    path: ['answers'],
  });
export type AttemptRequest = z.infer<typeof AttemptRequest>;

/** Idempotency keys: opaque, short, no whitespace. */
export const IdempotencyKey = z.string().regex(/^[A-Za-z0-9_-]{8,128}$/, '8–128 letters, digits, - or _');

// ── Mobile WebView bridge ─────────────────────────────────────────────────

export const BRIDGE_PROTOCOL_VERSION = 1 as const;

export const BridgeMessage = z.discriminatedUnion('type', [
  // WebView → app
  z.strictObject({
    protocolVersion: z.literal(1),
    messageId: Uuid,
    type: z.literal('PLAYER_READY'),
    payload: z.strictObject({ mode: z.enum(['3d', 'fallback', 'diagram']) }),
  }),
  z.strictObject({
    protocolVersion: z.literal(1),
    messageId: Uuid,
    type: z.literal('STRUCTURE_SELECTED'),
    payload: z.strictObject({ hotspotId: Key }),
  }),
  z.strictObject({
    protocolVersion: z.literal(1),
    messageId: Uuid,
    type: z.literal('SEQUENCE_COMPLETED'),
    payload: z.strictObject({ sequenceKey: Key }),
  }),
  z.strictObject({
    protocolVersion: z.literal(1),
    messageId: Uuid,
    type: z.literal('PLAYER_ERROR'),
    payload: z.strictObject({ code: z.string().regex(/^[A-Z_]{1,64}$/) }),
  }),
  // app → WebView
  z.strictObject({ protocolVersion: z.literal(1), messageId: Uuid, type: z.literal('APP_PAUSED'), payload: z.strictObject({}) }),
  z.strictObject({ protocolVersion: z.literal(1), messageId: Uuid, type: z.literal('APP_RESUMED'), payload: z.strictObject({}) }),
  z.strictObject({
    protocolVersion: z.literal(1),
    messageId: Uuid,
    type: z.literal('NETWORK_CHANGED'),
    payload: z.strictObject({ online: z.boolean() }),
  }),
]);
export type BridgeMessage = z.infer<typeof BridgeMessage>;

/** Message types each side may send. Anything else is dropped. */
export const WEBVIEW_TO_APP = ['PLAYER_READY', 'STRUCTURE_SELECTED', 'SEQUENCE_COMPLETED', 'PLAYER_ERROR'] as const;
export const APP_TO_WEBVIEW = ['APP_PAUSED', 'APP_RESUMED', 'NETWORK_CHANGED'] as const;
