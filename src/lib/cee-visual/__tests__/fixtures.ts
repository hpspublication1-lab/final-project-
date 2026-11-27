/** Test fixtures. Geometric placeholders only — not anatomical content. */
import type { LessonContent, VisualAssetManifest } from '../schemas';

export const U = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

export const manifest3d = (): VisualAssetManifest => ({
  schemaVersion: '1.0',
  kind: 'MODEL_3D',
  title: 'Dev fixture: three shapes',
  model: {
    format: 'glb',
    initialCamera: { position: [0, 1, 6], target: [0, 0, 0] },
    layers: [
      { key: 'outer', label: 'Outer shapes', nodeNames: ['fixture-cube', 'fixture-cone'], visibleByDefault: true },
      { key: 'inner', label: 'Inner shape', nodeNames: ['fixture-sphere'], visibleByDefault: true },
    ],
  },
  hotspots: [
    { id: 'cube', label: 'Cube', targetNode: 'fixture-cube' },
    { id: 'origin', label: 'Origin', position: [0, 0, 0] },
  ],
  sequences: [
    {
      key: 'tour',
      title: 'Tour',
      steps: [
        { atMs: 0, caption: 'Start' },
        { atMs: 1000, caption: 'Hide outer', visibleLayers: ['inner'] },
        { atMs: 2000, caption: 'Highlight cube', highlight: ['fixture-cube'] },
      ],
    },
  ],
  fallback: { assetVersionId: U(9), kind: 'svg' },
  accessibility: { description: 'Three geometric test shapes used to exercise the player.', reducedMotionSupported: true },
});

export const lessonContent = (over: Partial<LessonContent> = {}): LessonContent => ({
  schemaVersion: '1.0',
  summary: 'Fixture lesson.',
  sections: [
    { key: 'intro', heading: 'Intro', body: 'Text.', required: true },
    { key: 'extra', heading: 'Extra', body: 'Optional text.', required: false },
  ],
  objectiveIds: [U(100), U(101)],
  completion: { requireSequenceKey: 'tour', minScorePercent: 50 },
  ...over,
});
