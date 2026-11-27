/**
 * GLB (binary glTF 2.0) validation for uploaded 3D models.
 *
 * Two layers, both must pass:
 *  1. `inspectGlb`: our own structural checks, which are strict where the
 *     glTF spec is permissive. Everything must be inside the file: no external
 *     or data: URIs at all. Only extensions the player can render without
 *     extra decoders are allowed. Size, node, triangle and texture limits are
 *     enforced so a model can't exhaust a student's phone.
 *  2. `validateGlb`: also runs the Khronos glTF-Validator for spec conformance.
 *
 * Compression note: Draco and meshopt need WebAssembly decoders, and the site's
 * CSP doesn't allow WebAssembly compilation ('wasm-unsafe-eval'). Until that is
 * decided, compressed models are rejected with a clear message; quantised
 * meshes (KHR_mesh_quantization) are fine.
 */

export interface GlbLimits {
  maxBytes: number;
  maxNodes: number;
  maxMeshes: number;
  maxMaterials: number;
  maxTextures: number;
  maxTriangles: number;
  maxTextureSize: number;
  maxAnimations: number;
}

export const DEFAULT_GLB_LIMITS: GlbLimits = {
  maxBytes: 25 * 1024 * 1024,
  maxNodes: 2000,
  maxMeshes: 500,
  maxMaterials: 200,
  maxTextures: 64,
  maxTriangles: 1_500_000,
  maxTextureSize: 4096,
  maxAnimations: 50,
};

/** Extensions three.js renders with no extra decoder or WebAssembly. */
export const ALLOWED_EXTENSIONS = new Set([
  'KHR_materials_clearcoat',
  'KHR_materials_emissive_strength',
  'KHR_materials_ior',
  'KHR_materials_sheen',
  'KHR_materials_specular',
  'KHR_materials_transmission',
  'KHR_materials_unlit',
  'KHR_materials_volume',
  'KHR_mesh_quantization',
  'KHR_texture_transform',
  'EXT_texture_webp',
]);

const NEEDS_DECODER = new Set(['KHR_draco_mesh_compression', 'EXT_meshopt_compression', 'KHR_texture_basisu']);

export interface Issue {
  code: string;
  message: string;
}

export interface GlbReport {
  ok: boolean;
  errors: Issue[];
  warnings: Issue[];
  stats: {
    bytes: number;
    nodes: number;
    meshes: number;
    materials: number;
    textures: number;
    images: number;
    animations: number;
    triangles: number;
    maxTextureSize: number;
  };
  nodeNames: string[];
  duplicateNodeNames: string[];
  animationNames: string[];
  extensionsUsed: string[];
  khronos?: { errors: number; warnings: number; infos: number; messages: Issue[] };
}

const MAGIC = 0x46546c67;
const CHUNK_JSON = 0x4e4f534a;
const CHUNK_BIN = 0x004e4942;

type Json = Record<string, unknown>;
const arr = (v: unknown): Json[] => (Array.isArray(v) ? (v as Json[]) : []);
const num = (v: unknown): number | undefined => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);

function emptyReport(bytes: number): GlbReport {
  return {
    ok: false,
    errors: [],
    warnings: [],
    stats: { bytes, nodes: 0, meshes: 0, materials: 0, textures: 0, images: 0, animations: 0, triangles: 0, maxTextureSize: 0 },
    nodeNames: [],
    duplicateNodeNames: [],
    animationNames: [],
    extensionsUsed: [],
  };
}

/** Width/height from PNG, JPEG or WebP bytes; null if unrecognised. */
export function imageSize(b: Uint8Array): { width: number; height: number; mime: string } | null {
  const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
  if (b.length >= 24 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) {
    return { width: dv.getUint32(16), height: dv.getUint32(20), mime: 'image/png' };
  }
  if (b.length >= 4 && b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) return null;
      const marker = b[i + 1];
      const len = dv.getUint16(i + 2);
      // SOF0–SOF15 except DHT (C4), JPG (C8), DAC (CC)
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return { height: dv.getUint16(i + 5), width: dv.getUint16(i + 7), mime: 'image/jpeg' };
      }
      i += 2 + len;
    }
    return null;
  }
  if (b.length >= 30 && String.fromCharCode(...b.subarray(0, 4)) === 'RIFF' && String.fromCharCode(...b.subarray(8, 12)) === 'WEBP') {
    const kind = String.fromCharCode(...b.subarray(12, 16));
    if (kind === 'VP8X') return { width: 1 + (b[24] | (b[25] << 8) | (b[26] << 16)), height: 1 + (b[27] | (b[28] << 8) | (b[29] << 16)), mime: 'image/webp' };
    if (kind === 'VP8 ') return { width: dv.getUint16(26, true) & 0x3fff, height: dv.getUint16(28, true) & 0x3fff, mime: 'image/webp' };
    if (kind === 'VP8L') {
      const bits = dv.getUint32(21, true);
      return { width: 1 + (bits & 0x3fff), height: 1 + ((bits >> 14) & 0x3fff), mime: 'image/webp' };
    }
  }
  return null;
}

function primitiveTriangles(prim: Json, accessors: Json[]): number {
  const mode = num(prim.mode) ?? 4;
  const idx = num(prim.indices);
  const pos = num((prim.attributes as Json | undefined)?.POSITION);
  const count = num(accessors[idx ?? pos ?? -1]?.count) ?? 0;
  if (mode === 4) return Math.floor(count / 3);
  if (mode === 5 || mode === 6) return Math.max(0, count - 2);
  return 0; // points and lines draw no triangles
}

export function inspectGlb(bytes: Uint8Array, limits: GlbLimits = DEFAULT_GLB_LIMITS): GlbReport {
  const r = emptyReport(bytes.length);
  const err = (code: string, message: string) => r.errors.push({ code, message });
  const warn = (code: string, message: string) => r.warnings.push({ code, message });

  if (bytes.length > limits.maxBytes) {
    err('TOO_LARGE', `File is ${(bytes.length / 1048576).toFixed(1)} MB; the limit is ${limits.maxBytes / 1048576} MB.`);
    return r;
  }
  if (bytes.length < 20) {
    err('NOT_GLB', 'File is too small to be a GLB.');
    return r;
  }

  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (dv.getUint32(0, true) !== MAGIC) {
    err('NOT_GLB', 'File does not start with the glTF binary signature. Export as .glb (binary), not .gltf.');
    return r;
  }
  if (dv.getUint32(4, true) !== 2) {
    err('GLTF_VERSION', 'Only glTF 2.0 is supported.');
    return r;
  }
  if (dv.getUint32(8, true) !== bytes.length) {
    err('LENGTH_MISMATCH', 'The length in the header does not match the file; it may be truncated.');
    return r;
  }

  // Chunks: JSON first, then at most one BIN. Nothing else.
  let offset = 12;
  let json: Json | null = null;
  let binLength = -1;
  let index = 0;
  const binStart = { at: -1 };
  while (offset < bytes.length) {
    if (offset + 8 > bytes.length) {
      err('CHUNK_TRUNCATED', 'A chunk header is cut off.');
      return r;
    }
    const len = dv.getUint32(offset, true);
    const type = dv.getUint32(offset + 4, true);
    const start = offset + 8;
    if (len % 4 !== 0 || start + len > bytes.length) {
      err('CHUNK_INVALID', 'A chunk has an invalid length.');
      return r;
    }
    if (index === 0) {
      if (type !== CHUNK_JSON) {
        err('CHUNK_ORDER', 'The first chunk must be JSON.');
        return r;
      }
      try {
        const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes.subarray(start, start + len));
        const parsed: unknown = JSON.parse(text);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('not an object');
        json = parsed as Json;
      } catch {
        err('JSON_INVALID', 'The JSON chunk is not valid UTF-8 JSON.');
        return r;
      }
    } else if (index === 1 && type === CHUNK_BIN) {
      binLength = len;
      binStart.at = start;
    } else {
      err('CHUNK_UNEXPECTED', 'The file has extra chunks. Re-export a plain GLB.');
      return r;
    }
    offset = start + len;
    index++;
  }
  if (!json) {
    err('JSON_MISSING', 'No JSON chunk.');
    return r;
  }

  const asset = json.asset as Json | undefined;
  if (asset?.version !== '2.0') err('GLTF_VERSION', 'asset.version must be "2.0".');

  // Extensions.
  const used = (Array.isArray(json.extensionsUsed) ? json.extensionsUsed : []).filter((e): e is string => typeof e === 'string');
  const required = (Array.isArray(json.extensionsRequired) ? json.extensionsRequired : []).filter((e): e is string => typeof e === 'string');
  r.extensionsUsed = used;
  for (const ext of new Set([...used, ...required])) {
    if (NEEDS_DECODER.has(ext)) err('EXTENSION_NEEDS_DECODER', `${ext} needs a WebAssembly decoder the site doesn't allow yet. Export without mesh or texture compression.`);
    else if (!ALLOWED_EXTENSIONS.has(ext)) err('EXTENSION_NOT_ALLOWED', `Extension ${ext} is not supported by the player.`);
  }

  // Buffers: exactly one, inside the file.
  const buffers = arr(json.buffers);
  if (buffers.length > 1) err('BUFFERS', 'Only one buffer is allowed, stored inside the GLB.');
  buffers.forEach((b, i) => {
    if (b.uri !== undefined) err('EXTERNAL_URI', `Buffer ${i} points outside the file (uri). Everything must be embedded.`);
    const bl = num(b.byteLength);
    if (bl === undefined || bl < 0) err('BUFFER_INVALID', `Buffer ${i} has no valid byteLength.`);
    else if (bl > binLength) err('BUFFER_OVERRUN', `Buffer ${i} is larger than the binary chunk.`);
  });
  const bufferLength = num(buffers[0]?.byteLength) ?? 0;

  const bufferViews = arr(json.bufferViews);
  bufferViews.forEach((v, i) => {
    const o = num(v.byteOffset) ?? 0;
    const l = num(v.byteLength) ?? -1;
    if (num(v.buffer) !== 0 || l < 0 || o < 0 || o + l > bufferLength) err('BUFFER_VIEW_INVALID', `bufferView ${i} is out of range.`);
  });

  // Images: inside the file, PNG/JPEG/WebP, size-capped.
  const images = arr(json.images);
  r.stats.images = images.length;
  images.forEach((img, i) => {
    if (img.uri !== undefined) {
      err('EXTERNAL_URI', `Image ${i} uses a uri. Images must be embedded in the GLB.`);
      return;
    }
    const bvIndex = num(img.bufferView);
    const bv = bvIndex !== undefined ? bufferViews[bvIndex] : undefined;
    if (!bv) {
      err('IMAGE_INVALID', `Image ${i} has no bufferView.`);
      return;
    }
    const o = num(bv.byteOffset) ?? 0;
    const l = num(bv.byteLength) ?? 0;
    if (binStart.at < 0 || o + l > bufferLength) return; // already reported
    const size = imageSize(bytes.subarray(binStart.at + o, binStart.at + o + l));
    if (!size) {
      err('IMAGE_TYPE', `Image ${i} is not a PNG, JPEG or WebP.`);
      return;
    }
    if (img.mimeType !== size.mime) warn('IMAGE_MIME', `Image ${i} says ${String(img.mimeType)} but contains ${size.mime}.`);
    r.stats.maxTextureSize = Math.max(r.stats.maxTextureSize, size.width, size.height);
  });

  // Counts and limits.
  const nodes = arr(json.nodes);
  const meshes = arr(json.meshes);
  const accessors = arr(json.accessors);
  const animations = arr(json.animations);
  r.stats.nodes = nodes.length;
  r.stats.meshes = meshes.length;
  r.stats.materials = arr(json.materials).length;
  r.stats.textures = arr(json.textures).length;
  r.stats.animations = animations.length;
  r.stats.triangles = meshes.reduce((n, m) => n + arr(m.primitives).reduce((t, p) => t + primitiveTriangles(p, accessors), 0), 0);

  const limit = (code: string, value: number, max: number, what: string) => {
    if (value > max) err(code, `${value.toLocaleString('en')} ${what}; the limit is ${max.toLocaleString('en')}.`);
  };
  limit('TOO_MANY_NODES', r.stats.nodes, limits.maxNodes, 'nodes');
  limit('TOO_MANY_MESHES', r.stats.meshes, limits.maxMeshes, 'meshes');
  limit('TOO_MANY_MATERIALS', r.stats.materials, limits.maxMaterials, 'materials');
  limit('TOO_MANY_TEXTURES', r.stats.textures, limits.maxTextures, 'textures');
  limit('TOO_MANY_TRIANGLES', r.stats.triangles, limits.maxTriangles, 'triangles');
  limit('TEXTURE_TOO_LARGE', r.stats.maxTextureSize, limits.maxTextureSize, 'pixels on the longest texture side');
  limit('TOO_MANY_ANIMATIONS', r.stats.animations, limits.maxAnimations, 'animations');

  // Names, used to check hotspots and layers.
  const names = nodes.map((n) => (typeof n.name === 'string' ? n.name : '')).filter((n) => n.length > 0);
  const counts = new Map<string, number>();
  for (const n of names) counts.set(n, (counts.get(n) ?? 0) + 1);
  r.nodeNames = [...counts.keys()];
  r.duplicateNodeNames = [...counts.entries()].filter(([, c]) => c > 1).map(([n]) => n);
  if (r.duplicateNodeNames.length > 0) warn('DUPLICATE_NODE_NAMES', `Some node names repeat: ${r.duplicateNodeNames.slice(0, 10).join(', ')}. Hotspots can't target those.`);
  if (names.length < nodes.length) warn('UNNAMED_NODES', `${nodes.length - names.length} nodes have no name and can't be targeted by hotspots or layers.`);
  r.animationNames = animations.map((a) => (typeof a.name === 'string' ? a.name : '')).filter(Boolean);

  r.ok = r.errors.length === 0;
  return r;
}

interface KhronosMessage {
  code: string;
  message: string;
  severity: number;
  pointer?: string;
}
interface KhronosReport {
  issues: { numErrors: number; numWarnings: number; numInfos: number; messages: KhronosMessage[] };
}

/** Structural checks plus the Khronos glTF-Validator. Server-side only. */
export async function validateGlb(bytes: Uint8Array, limits: GlbLimits = DEFAULT_GLB_LIMITS): Promise<GlbReport> {
  const report = inspectGlb(bytes, limits);
  if (!report.ok) return report; // don't feed a file we already rejected to a second parser

  const validator = (await import('gltf-validator')) as unknown as {
    validateBytes(data: Uint8Array, opts: Record<string, unknown>): Promise<KhronosReport>;
  };
  try {
    const k = await validator.validateBytes(bytes, {
      maxIssues: 50,
      format: 'glb',
      // Our own check already refuses external resources; the validator must never fetch anything.
      externalResourceFunction: () => Promise.reject(new Error('external resources are not allowed')),
    });
    report.khronos = {
      errors: k.issues.numErrors,
      warnings: k.issues.numWarnings,
      infos: k.issues.numInfos,
      messages: k.issues.messages
        .filter((m) => m.severity <= 1)
        .slice(0, 20)
        .map((m) => ({ code: m.code, message: m.pointer ? `${m.message} (${m.pointer})` : m.message })),
    };
    if (k.issues.numErrors > 0) {
      report.errors.push({ code: 'GLTF_SPEC', message: `The Khronos glTF validator found ${k.issues.numErrors} error(s).` });
    }
  } catch (e) {
    report.errors.push({ code: 'GLTF_SPEC', message: `The Khronos glTF validator could not read the file: ${String(e).slice(0, 200)}` });
  }
  report.ok = report.errors.length === 0;
  return report;
}
