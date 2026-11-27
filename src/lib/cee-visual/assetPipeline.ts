/**
 * Visual asset pipeline rules, with no I/O: which files each kind accepts, how
 * a file's real type is recognised from its bytes, what validation runs, and
 * where versions are stored. The server module (assets.server.ts) does the
 * storage and database work around these.
 */
import { createHash } from 'node:crypto';
import { DEFAULT_GLB_LIMITS, imageSize, validateGlb, type GlbReport } from './validators/glb';
import { MAX_SVG_BYTES, validateSvg, type SvgReport } from './validators/svg';

export type AssetKind = 'MODEL_3D' | 'DIAGRAM_2D' | 'ANIMATION_2D' | 'VIDEO' | 'SIMULATION';

export interface AcceptedType {
  mime: string;
  ext: string;
  maxBytes: number;
}

/** What can be uploaded today. Other kinds exist in the schema but have no validator yet. */
export const ACCEPTED_TYPES: Record<AssetKind, AcceptedType[]> = {
  MODEL_3D: [{ mime: 'model/gltf-binary', ext: 'glb', maxBytes: DEFAULT_GLB_LIMITS.maxBytes }],
  DIAGRAM_2D: [
    { mime: 'image/svg+xml', ext: 'svg', maxBytes: MAX_SVG_BYTES },
    { mime: 'image/png', ext: 'png', maxBytes: 10 * 1024 * 1024 },
    { mime: 'image/webp', ext: 'webp', maxBytes: 10 * 1024 * 1024 },
  ],
  ANIMATION_2D: [],
  VIDEO: [],
  SIMULATION: [],
};

export const UPLOADABLE_KINDS = (Object.keys(ACCEPTED_TYPES) as AssetKind[]).filter((k) => ACCEPTED_TYPES[k].length > 0);
export const MAX_IMAGE_SIDE = 8192;

export function acceptedType(kind: AssetKind, mime: string): AcceptedType | null {
  return ACCEPTED_TYPES[kind]?.find((t) => t.mime === mime) ?? null;
}

/** Storage keys. Quarantine is per version; published keys start with the content hash. */
export const quarantineKey = (assetId: string, versionId: string, ext: string) => `${assetId}/${versionId}.${ext}`;
export const publishedKey = (sha256: string, versionId: string, ext: string) => `${sha256}/${versionId}.${ext}`;

export const sha256Hex = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');

/** The type a file really is, from its first bytes. Never trusts the name or the declared type. */
export function sniffMime(b: Uint8Array): string | null {
  const ascii = (from: number, to: number) => String.fromCharCode(...b.subarray(from, to));
  if (b.length >= 12 && ascii(0, 4) === 'glTF') return 'model/gltf-binary';
  if (b.length >= 8 && b[0] === 0x89 && ascii(1, 4) === 'PNG' && b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a) return 'image/png';
  if (b.length >= 12 && ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'image/webp';
  // SVG is text: allow a BOM, whitespace, an XML declaration, comments and a doctype before <svg.
  const head = new TextDecoder('utf-8', { fatal: false }).decode(b.subarray(0, 4096)).replace(/^﻿/, '');
  const stripped = head
    .replace(/^\s*<\?xml[^>]*\?>/i, '')
    .replace(/^(\s*<!--[\s\S]*?-->)+/, '')
    .replace(/^\s*<!DOCTYPE[^>]*>/i, '')
    .replace(/^(\s*<!--[\s\S]*?-->)+/, '');
  if (/^\s*<svg[\s>]/i.test(stripped)) return 'image/svg+xml';
  return null;
}

export interface Problem {
  code: string;
  message: string;
}

export interface AssetValidation {
  ok: boolean;
  sha256: string;
  sizeBytes: number;
  sniffedMime: string | null;
  errors: Problem[];
  warnings: Problem[];
  model?: GlbReport;
  svg?: SvgReport;
  image?: { width: number; height: number };
}

/**
 * Checks the bytes that actually arrived against what the uploader declared,
 * then runs the validator for the type. `declared` comes from the upload
 * request; nothing here trusts it beyond comparing.
 */
export async function validateAssetBytes(
  kind: AssetKind,
  declared: { mime: string; sizeBytes: number; sha256: string },
  bytes: Uint8Array
): Promise<AssetValidation> {
  const errors: Problem[] = [];
  const warnings: Problem[] = [];
  const sha256 = sha256Hex(bytes);
  const out: AssetValidation = { ok: false, sha256, sizeBytes: bytes.length, sniffedMime: sniffMime(bytes), errors, warnings };

  const type = acceptedType(kind, declared.mime);
  if (!type) errors.push({ code: 'TYPE_NOT_ALLOWED', message: `A ${kind} can’t be a ${declared.mime} file.` });
  if (bytes.length !== declared.sizeBytes) {
    errors.push({ code: 'SIZE_MISMATCH', message: `The upload was ${bytes.length} bytes, but ${declared.sizeBytes} were declared.` });
  }
  if (sha256 !== declared.sha256) {
    errors.push({ code: 'HASH_MISMATCH', message: 'The file that arrived is not the one that was declared (its SHA-256 differs).' });
  }
  if (type && bytes.length > type.maxBytes) errors.push({ code: 'TOO_LARGE', message: `Files of this type can be at most ${type.maxBytes} bytes.` });
  if (out.sniffedMime !== declared.mime) {
    errors.push({ code: 'CONTENT_MISMATCH', message: `The file’s contents are ${out.sniffedMime ?? 'not a recognised type'}, not ${declared.mime}.` });
  }
  if (errors.length) return out;

  if (declared.mime === 'model/gltf-binary') {
    out.model = await validateGlb(bytes);
    for (const e of out.model.errors) errors.push({ code: e.code, message: e.message });
    for (const w of out.model.warnings) warnings.push({ code: w.code, message: w.message });
  } else if (declared.mime === 'image/svg+xml') {
    out.svg = validateSvg(bytes);
    for (const e of out.svg.errors) errors.push({ code: e.code, message: e.message });
  } else {
    const dims = imageSize(bytes);
    if (!dims || dims.mime !== declared.mime) {
      errors.push({ code: 'IMAGE_UNREADABLE', message: 'The image header could not be read.' });
    } else {
      out.image = { width: dims.width, height: dims.height };
      if (dims.width < 1 || dims.height < 1 || dims.width > MAX_IMAGE_SIDE || dims.height > MAX_IMAGE_SIDE) {
        errors.push({ code: 'IMAGE_DIMENSIONS', message: `Images can be at most ${MAX_IMAGE_SIDE} × ${MAX_IMAGE_SIDE} pixels (this one is ${dims.width} × ${dims.height}).` });
      }
    }
  }
  out.ok = errors.length === 0;
  return out;
}

/** What is kept in cee_asset_versions.validation_report: findings and stats, never file contents. */
export function reportForStorage(v: AssetValidation) {
  return {
    ok: v.ok,
    sha256: v.sha256,
    sizeBytes: v.sizeBytes,
    sniffedMime: v.sniffedMime,
    errors: v.errors.slice(0, 50),
    warnings: v.warnings.slice(0, 50),
    ...(v.model ? { model: v.model.stats, modelNodes: { nodeNames: v.model.nodeNames, duplicateNodeNames: v.model.duplicateNodeNames } } : {}),
    ...(v.svg ? { svg: { ...v.svg.stats, viewBox: v.svg.viewBox } } : {}),
    ...(v.image ? { image: v.image } : {}),
    checkedAt: new Date().toISOString(),
  };
}
