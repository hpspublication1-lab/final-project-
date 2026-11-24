/**
 * Development fixture for the visual player: geometric shapes only.
 * Used by the preview-only player lab and by tests. Never lesson content.
 */
import type { LessonContent, ResolvedVisual, VisualAssetManifest } from './schemas';

export const FIXTURE_NOTICE = 'Development fixture: geometric test shapes, not lesson content.';

export const FIXTURE_ASSET_VERSION_ID = '2f1c6a52-7d0e-4c1b-9a8e-0c3d5b6f7a01';
export const FIXTURE_FALLBACK_VERSION_ID = '2f1c6a52-7d0e-4c1b-9a8e-0c3d5b6f7a02';

export const fixtureManifest: VisualAssetManifest = {
  schemaVersion: '1.0',
  kind: 'MODEL_3D',
  title: 'Player test: three shapes on a base',
  model: {
    format: 'glb',
    initialCamera: { position: [0, 1.6, 7.2], target: [0, -0.1, 0] },
    layers: [
      { key: 'outer', label: 'Cube and cone', nodeNames: ['fixture-cube', 'fixture-cone'], visibleByDefault: true },
      { key: 'centre', label: 'Sphere', nodeNames: ['fixture-sphere'], visibleByDefault: true },
      { key: 'base', label: 'Base', nodeNames: ['fixture-base'], visibleByDefault: true },
    ],
  },
  hotspots: [
    { id: 'cube', label: 'Cube', targetNode: 'fixture-cube', explanation: 'A 1.2-unit cube. Selecting it here or in the list highlights it.' },
    { id: 'sphere', label: 'Sphere', targetNode: 'fixture-sphere', explanation: 'A sphere at the centre of the scene. Hide the other layers to see it alone.' },
    { id: 'cone', label: 'Cone', targetNode: 'fixture-cone', explanation: 'A cone on the right. The guided tour ends here.' },
    { id: 'base', label: 'Base', targetNode: 'fixture-base', explanation: 'A flat plinth under the shapes.' },
  ],
  sequences: [
    {
      key: 'tour',
      title: 'Guided tour',
      steps: [
        { atMs: 0, caption: 'All three shapes stand on a flat base.', camera: { position: [0, 1.6, 7.2], target: [0, -0.1, 0] } },
        { atMs: 3000, caption: 'The cube sits on the left.', camera: { position: [-2.6, 1.2, 3.6], target: [-1.8, 0, 0] }, highlight: ['fixture-cube'] },
        {
          atMs: 6000,
          caption: 'Hiding the cube and cone leaves the sphere on its own.',
          camera: { position: [0, 0.8, 3.8], target: [0, 0, 0] },
          visibleLayers: ['centre', 'base'],
          highlight: ['fixture-sphere'],
        },
        { atMs: 9000, caption: 'The cone sits on the right.', camera: { position: [2.8, 1.2, 3.6], target: [1.8, 0, 0] }, highlight: ['fixture-cone'] },
        { atMs: 12000, caption: 'Back to the full scene.', camera: { position: [0, 1.6, 7.2], target: [0, -0.1, 0] } },
      ],
    },
  ],
  fallback: { assetVersionId: FIXTURE_FALLBACK_VERSION_ID, kind: 'svg' },
  accessibility: {
    description:
      'A test scene with a blue cube on the left, a teal sphere in the centre and an orange cone on the right, all standing on a flat grey base.',
    reducedMotionSupported: true,
  },
};

export const fixtureVisual: ResolvedVisual = {
  assetVersionId: FIXTURE_ASSET_VERSION_ID,
  manifest: fixtureManifest,
  modelUrl: '/cee-dev-fixture/fixture.glb',
  fallbackUrl: '/cee-dev-fixture/fallback.svg',
  fixtureNotice: FIXTURE_NOTICE,
};

export const fixtureLesson: LessonContent = {
  schemaVersion: '1.0',
  summary: 'A test lesson that exercises every part of the player. It contains no real subject content.',
  sections: [
    {
      key: 'how-to-use',
      heading: 'Using the player',
      body: 'Drag to rotate, pinch or scroll to zoom, and right-drag or two-finger drag to pan. Every shape can also be chosen from the list, so a keyboard or screen reader works too.',
      required: true,
    },
    {
      key: 'layers',
      heading: 'Layers',
      body: 'Switch layers off to look inside or behind other parts. In a real lesson, a layer could be a group of structures such as vessels or chambers.',
      required: true,
    },
  ],
  objectiveIds: [],
  completion: { requireSequenceKey: 'tour' },
};
