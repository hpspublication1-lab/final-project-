import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { acceptedType, publishedKey, quarantineKey, reportForStorage, sha256Hex, sniffMime, UPLOADABLE_KINDS, validateAssetBytes } from '../assetPipeline';

const glb = new Uint8Array(readFileSync('public/cee-dev-fixture/fixture.glb'));
const svg = new Uint8Array(readFileSync('public/cee-dev-fixture/fallback.svg'));
const text = (s: string) => new TextEncoder().encode(s);

/** PNG signature plus an IHDR chunk: enough for type and size checks (images are not decoded server-side). */
function pngHeader(width: number, height: number) {
  const b = new Uint8Array(33);
  b.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52]);
  const dv = new DataView(b.buffer);
  dv.setUint32(16, width);
  dv.setUint32(20, height);
  b[24] = 8;
  b[25] = 6;
  return b;
}
function webpHeader(width: number, height: number) {
  const b = new Uint8Array(30);
  b.set(text('RIFF'), 0);
  b.set(text('WEBPVP8X'), 8);
  const w = width - 1;
  const h = height - 1;
  b.set([w & 0xff, (w >> 8) & 0xff, (w >> 16) & 0xff, h & 0xff, (h >> 8) & 0xff, (h >> 16) & 0xff], 24);
  return b;
}
const declare = (bytes: Uint8Array, mime: string) => ({ mime, sizeBytes: bytes.length, sha256: sha256Hex(bytes) });

describe('accepted types', () => {
  it('accepts GLB for 3D and SVG/PNG/WebP for diagrams; other kinds have no uploads yet', () => {
    expect(UPLOADABLE_KINDS).toEqual(['MODEL_3D', 'DIAGRAM_2D']);
    expect(acceptedType('MODEL_3D', 'model/gltf-binary')?.ext).toBe('glb');
    expect(acceptedType('MODEL_3D', 'image/png')).toBeNull();
    expect(acceptedType('DIAGRAM_2D', 'image/webp')?.ext).toBe('webp');
    expect(acceptedType('VIDEO', 'video/mp4')).toBeNull();
  });
  it('keys: quarantine per version; published keys start with the content hash', () => {
    expect(quarantineKey('a', 'v', 'glb')).toBe('a/v.glb');
    expect(publishedKey('ab'.repeat(32), 'v', 'svg')).toBe(`${'ab'.repeat(32)}/v.svg`);
  });
});

describe('sniffMime (never trusts names or declared types)', () => {
  it('recognises each accepted type from its bytes', () => {
    expect(sniffMime(glb)).toBe('model/gltf-binary');
    expect(sniffMime(svg)).toBe('image/svg+xml');
    expect(sniffMime(pngHeader(10, 10))).toBe('image/png');
    expect(sniffMime(webpHeader(10, 10))).toBe('image/webp');
  });
  it('finds <svg after a BOM, XML declaration, comments and a doctype', () => {
    expect(sniffMime(text('﻿<?xml version="1.0"?>\n<!-- c --><!DOCTYPE svg><!-- d -->\n<svg xmlns="http://www.w3.org/2000/svg"/>'))).toBe('image/svg+xml');
  });
  it('recognises nothing else', () => {
    expect(sniffMime(text('<html><svg></svg></html>'))).toBeNull();
    expect(sniffMime(text('%PDF-1.7'))).toBeNull();
    expect(sniffMime(new Uint8Array([0x4d, 0x5a, 0x90, 0]))).toBeNull(); // a Windows executable
  });
});

describe('validateAssetBytes', () => {
  it('passes the committed fixture model and diagram, with stats and node names kept for later checks', async () => {
    const m = await validateAssetBytes('MODEL_3D', declare(glb, 'model/gltf-binary'), glb);
    expect(m.errors).toEqual([]);
    expect(m.ok).toBe(true);
    const stored = reportForStorage(m);
    expect(stored.model).toMatchObject({ meshes: expect.any(Number) });
    expect(stored.modelNodes?.nodeNames.length).toBeGreaterThan(0);
    expect(JSON.stringify(stored).length).toBeLessThan(20000); // findings only, never file contents
    const d = await validateAssetBytes('DIAGRAM_2D', declare(svg, 'image/svg+xml'), svg);
    expect(d.ok).toBe(true);
  });

  it('rejects a file that differs from what was declared: hash, size', async () => {
    const other = new Uint8Array(glb);
    other[other.length - 1] ^= 1;
    const r = await validateAssetBytes('MODEL_3D', declare(glb, 'model/gltf-binary'), other);
    expect(r.errors.map((e) => e.code)).toEqual(['HASH_MISMATCH']);
    const shorter = glb.subarray(0, glb.length - 4);
    expect((await validateAssetBytes('MODEL_3D', declare(glb, 'model/gltf-binary'), shorter)).errors.map((e) => e.code)).toEqual(['SIZE_MISMATCH', 'HASH_MISMATCH']);
  });

  it('rejects contents that are not the declared type, and types the kind does not accept', async () => {
    const r = await validateAssetBytes('DIAGRAM_2D', declare(svg, 'image/png'), svg);
    expect(r.errors.map((e) => e.code)).toEqual(['CONTENT_MISMATCH']);
    const exe = new Uint8Array([0x4d, 0x5a, 0x90, 0, 3, 0, 0, 0, 4, 0, 0, 0]);
    expect((await validateAssetBytes('MODEL_3D', declare(exe, 'model/gltf-binary'), exe)).errors.map((e) => e.code)).toEqual(['CONTENT_MISMATCH']);
    expect((await validateAssetBytes('MODEL_3D', declare(svg, 'image/svg+xml'), svg)).errors[0].code).toBe('TYPE_NOT_ALLOWED');
  });

  it('runs the SVG validator: a script inside an SVG is refused', async () => {
    const bad = text('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
    const r = await validateAssetBytes('DIAGRAM_2D', declare(bad, 'image/svg+xml'), bad);
    expect(r.ok).toBe(false);
    expect(r.errors.length).toBeGreaterThan(0);
  });

  it('checks image dimensions from the header', async () => {
    const ok = pngHeader(1024, 768);
    expect(await validateAssetBytes('DIAGRAM_2D', declare(ok, 'image/png'), ok)).toMatchObject({ ok: true, image: { width: 1024, height: 768 } });
    const huge = webpHeader(20000, 10);
    expect((await validateAssetBytes('DIAGRAM_2D', declare(huge, 'image/webp'), huge)).errors.map((e) => e.code)).toEqual(['IMAGE_DIMENSIONS']);
  });

  it('enforces the per-type size cap', async () => {
    const big = new Uint8Array(2 * 1024 * 1024 + 10);
    big.set(text('<svg xmlns="http://www.w3.org/2000/svg">'));
    const r = await validateAssetBytes('DIAGRAM_2D', declare(big, 'image/svg+xml'), big);
    expect(r.errors.map((e) => e.code)).toContain('TOO_LARGE');
  });
});
