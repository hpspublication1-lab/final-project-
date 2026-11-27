/**
 * Generates the CEE Visual player's DEVELOPMENT FIXTURE:
 *   public/cee-dev-fixture/fixture.glb    three named geometric shapes
 *   public/cee-dev-fixture/fallback.svg   the same shapes in 2D
 *
 * These exist only to exercise the player (layers, hotspots, sequences,
 * fallback). They are deliberately not anatomy and must never be published
 * as lesson content.
 *
 * Run: node scripts/cee/make-dev-fixture.mjs   (Node 22.18+: loads the TypeScript writer directly)
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { box, buildGlb, cone, packMeshes, sphere } from '../../src/lib/cee-visual/validators/glbWriter.ts';

const out = 'public/cee-dev-fixture';
mkdirSync(out, { recursive: true });

const { json, bin } = packMeshes(
  [
    box('fixture-cube', 1.2, [0.32, 0.26, 0.88], [-1.8, 0, 0]),
    sphere('fixture-sphere', 0.75, [0.0, 0.75, 0.65], [0, 0, 0], 32),
    cone('fixture-cone', 0.65, 1.5, [0.95, 0.55, 0.15], [1.8, 0, 0], 40),
    box('fixture-base', 1, [0.75, 0.78, 0.85], [0, -1.1, 0]),
  ],
  'Dev fixture: geometric test shapes (not anatomy)'
);
// Flatten the base into a plinth.
json.nodes[3].scale = [5.4, 0.12, 1.8];
json.asset = { ...json.asset, extras: { notice: 'Development fixture. Not lesson content.' } };

const glb = buildGlb(json, bin);
writeFileSync(`${out}/fixture.glb`, glb);

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360" role="img" aria-labelledby="t d">
  <title id="t">Development fixture: three geometric shapes</title>
  <desc id="d">A blue cube on the left, a teal sphere in the middle and an orange cone on the right, standing on a grey base. This is a test image, not lesson content.</desc>
  <rect width="640" height="360" fill="#F1F4F9"/>
  <rect x="40" y="292" width="560" height="14" rx="3" fill="#BFC6D6"/>
  <rect x="88" y="158" width="128" height="128" rx="4" fill="#5243E0"/>
  <circle cx="320" cy="214" r="78" fill="#00BFA5"/>
  <path d="M 492 128 L 562 286 L 422 286 Z" fill="#F28C26"/>
  <g font-family="sans-serif" font-size="18" fill="#090D1A" text-anchor="middle">
    <text x="152" y="140">Cube</text>
    <text x="320" y="126">Sphere</text>
    <text x="492" y="112">Cone</text>
  </g>
  <text x="320" y="38" font-family="sans-serif" font-size="15" fill="#5B6579" text-anchor="middle">Development fixture, not lesson content</text>
</svg>
`;
writeFileSync(`${out}/fallback.svg`, svg);

const sha = (b) => createHash('sha256').update(b).digest('hex');
console.log(`fixture.glb   ${glb.length} bytes  sha256 ${sha(glb)}`);
console.log(`fallback.svg  ${Buffer.byteLength(svg)} bytes  sha256 ${sha(svg)}`);
