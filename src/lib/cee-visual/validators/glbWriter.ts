/**
 * Minimal GLB writer, used by tests and by the dev-fixture generator script.
 * It is not used to process uploads.
 */

const MAGIC = 0x46546c67; // 'glTF'
const CHUNK_JSON = 0x4e4f534a;
const CHUNK_BIN = 0x004e4942;

const pad4 = (n: number) => (n + 3) & ~3;

export interface RawChunk {
  type: number;
  data: Uint8Array;
}

/** Assemble a GLB from a glTF JSON object and an optional binary buffer. */
export function buildGlb(json: unknown, bin?: Uint8Array, extraChunks: RawChunk[] = []): Uint8Array {
  const jsonBytes = new TextEncoder().encode(JSON.stringify(json));
  const chunks: RawChunk[] = [{ type: CHUNK_JSON, data: jsonBytes }];
  if (bin) chunks.push({ type: CHUNK_BIN, data: bin });
  chunks.push(...extraChunks);

  const total = 12 + chunks.reduce((n, c) => n + 8 + pad4(c.data.length), 0);
  const out = new Uint8Array(total);
  const view = new DataView(out.buffer);
  view.setUint32(0, MAGIC, true);
  view.setUint32(4, 2, true);
  view.setUint32(8, total, true);

  let offset = 12;
  for (const c of chunks) {
    const len = pad4(c.data.length);
    view.setUint32(offset, len, true);
    view.setUint32(offset + 4, c.type, true);
    out.set(c.data, offset + 8);
    // JSON is padded with spaces, binary with zeros (glTF 2.0 §4.4.3).
    if (c.type === CHUNK_JSON) out.fill(0x20, offset + 8 + c.data.length, offset + 8 + len);
    offset += 8 + len;
  }
  return out;
}

export interface MeshData {
  name: string;
  positions: Float32Array;
  normals: Float32Array;
  indices: Uint16Array;
  color: [number, number, number];
  translation?: [number, number, number];
}

/** Packs meshes into one buffer and returns glTF JSON + BIN, one node per mesh. */
export function packMeshes(meshes: MeshData[], sceneName = 'Scene'): { json: Record<string, unknown>; bin: Uint8Array } {
  const parts: Uint8Array[] = [];
  let byteLength = 0;
  const bufferViews: Record<string, unknown>[] = [];
  const accessors: Record<string, unknown>[] = [];
  const add = (data: ArrayBufferView, target: number) => {
    const bytes = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
    const offset = byteLength;
    parts.push(bytes);
    byteLength += bytes.length;
    const padded = pad4(byteLength);
    if (padded > byteLength) {
      parts.push(new Uint8Array(padded - byteLength));
      byteLength = padded;
    }
    bufferViews.push({ buffer: 0, byteOffset: offset, byteLength: bytes.length, target });
    return bufferViews.length - 1;
  };

  const gltfMeshes = meshes.map((m, i) => {
    const min = [Infinity, Infinity, Infinity];
    const max = [-Infinity, -Infinity, -Infinity];
    for (let v = 0; v < m.positions.length; v += 3) {
      for (let k = 0; k < 3; k++) {
        min[k] = Math.min(min[k], m.positions[v + k]);
        max[k] = Math.max(max[k], m.positions[v + k]);
      }
    }
    const pos = accessors.push({ bufferView: add(m.positions, 34962), componentType: 5126, count: m.positions.length / 3, type: 'VEC3', min, max }) - 1;
    const nor = accessors.push({ bufferView: add(m.normals, 34962), componentType: 5126, count: m.normals.length / 3, type: 'VEC3' }) - 1;
    const idx = accessors.push({ bufferView: add(m.indices, 34963), componentType: 5123, count: m.indices.length, type: 'SCALAR' }) - 1;
    return { name: m.name, primitives: [{ attributes: { POSITION: pos, NORMAL: nor }, indices: idx, material: i }] };
  });

  const bin = new Uint8Array(byteLength);
  let o = 0;
  for (const p of parts) {
    bin.set(p, o);
    o += p.length;
  }

  return {
    json: {
      asset: { version: '2.0', generator: 'samyak-cee-visual dev fixture' },
      scene: 0,
      scenes: [{ name: sceneName, nodes: meshes.map((_, i) => i) }],
      nodes: meshes.map((m, i) => ({ name: m.name, mesh: i, ...(m.translation ? { translation: m.translation } : {}) })),
      meshes: gltfMeshes,
      materials: meshes.map((m) => ({
        name: `${m.name}-material`,
        pbrMetallicRoughness: { baseColorFactor: [...m.color, 1], metallicFactor: 0, roughnessFactor: 0.7 },
      })),
      accessors,
      bufferViews,
      buffers: [{ byteLength }],
    },
    bin,
  };
}

// ── Simple shapes ─────────────────────────────────────────────────────────

export function box(name: string, size: number, color: [number, number, number], translation?: [number, number, number]): MeshData {
  const h = size / 2;
  const faces: [number[], number[]][] = [
    [[1, 0, 0], [h, -h, -h, h, h, -h, h, h, h, h, -h, h]],
    [[-1, 0, 0], [-h, -h, h, -h, h, h, -h, h, -h, -h, -h, -h]],
    [[0, 1, 0], [-h, h, -h, -h, h, h, h, h, h, h, h, -h]],
    [[0, -1, 0], [-h, -h, h, -h, -h, -h, h, -h, -h, h, -h, h]],
    [[0, 0, 1], [-h, -h, h, h, -h, h, h, h, h, -h, h, h]],
    [[0, 0, -1], [h, -h, -h, -h, -h, -h, -h, h, -h, h, h, -h]],
  ];
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  faces.forEach(([n, p], f) => {
    positions.push(...p);
    for (let k = 0; k < 4; k++) normals.push(...n);
    const b = f * 4;
    indices.push(b, b + 1, b + 2, b, b + 2, b + 3);
  });
  return { name, positions: new Float32Array(positions), normals: new Float32Array(normals), indices: new Uint16Array(indices), color, translation };
}

export function sphere(name: string, r: number, color: [number, number, number], translation?: [number, number, number], seg = 24): MeshData {
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  for (let y = 0; y <= seg; y++) {
    const v = y / seg;
    const theta = v * Math.PI;
    for (let x = 0; x <= seg; x++) {
      const u = x / seg;
      const phi = u * Math.PI * 2;
      const nx = -Math.cos(phi) * Math.sin(theta);
      const ny = Math.cos(theta);
      const nz = Math.sin(phi) * Math.sin(theta);
      positions.push(nx * r, ny * r, nz * r);
      normals.push(nx, ny, nz);
    }
  }
  for (let y = 0; y < seg; y++) {
    for (let x = 0; x < seg; x++) {
      const a = y * (seg + 1) + x;
      const b = a + seg + 1;
      if (y !== 0) indices.push(a, b, a + 1);
      if (y !== seg - 1) indices.push(a + 1, b, b + 1);
    }
  }
  return { name, positions: new Float32Array(positions), normals: new Float32Array(normals), indices: new Uint16Array(indices), color, translation };
}

export function cone(name: string, r: number, height: number, color: [number, number, number], translation?: [number, number, number], seg = 32): MeshData {
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  const slope = r / height;
  // Side: apex duplicated per segment so normals stay smooth.
  for (let i = 0; i <= seg; i++) {
    const a = (i / seg) * Math.PI * 2;
    const nx = Math.cos(a);
    const nz = Math.sin(a);
    const len = Math.hypot(1, slope);
    positions.push(nx * r, -height / 2, nz * r, 0, height / 2, 0);
    normals.push(nx / len, slope / len, nz / len, nx / len, slope / len, nz / len);
  }
  for (let i = 0; i < seg; i++) {
    const b = i * 2;
    indices.push(b, b + 1, b + 2);
  }
  // Base.
  const center = positions.length / 3;
  positions.push(0, -height / 2, 0);
  normals.push(0, -1, 0);
  for (let i = 0; i <= seg; i++) {
    const a = (i / seg) * Math.PI * 2;
    positions.push(Math.cos(a) * r, -height / 2, Math.sin(a) * r);
    normals.push(0, -1, 0);
  }
  for (let i = 0; i < seg; i++) indices.push(center, center + 2 + i, center + 1 + i);
  return { name, positions: new Float32Array(positions), normals: new Float32Array(normals), indices: new Uint16Array(indices), color, translation };
}
