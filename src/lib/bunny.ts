// src/lib/bunny.ts
/**
 * Centralized Bunny.net storage/CDN utility.
 * Provides helpers for signing URLs, uploading files, and deleting objects.
 * Uses environment variables:
 *   BUNNY_STORAGE_ZONE          - Bunny storage zone name (e.g., "gamyakguru2")
 *   BUNNY_STORAGE_API_KEY       - API key with write permissions
 *   BUNNY_STORAGE_CDN_HOSTNAME  - CDN hostname (e.g., "gamyakguru2.b-cdn.net")
 */
import crypto from 'crypto';

// Env vars resolved lazily inside each function so that the module can be
// imported during build without crashing when variables are absent.
function env(key: string): string {
  const v = process.env[key];
  if (v) return v;
  // Fallbacks to Bunny Stream configuration if Storage-specific keys are not set
  if (key === 'BUNNY_STORAGE_API_KEY') return process.env.BUNNY_STREAM_API_KEY || '';
  if (key === 'BUNNY_STORAGE_CDN_HOSTNAME') return process.env.BUNNY_CDN_HOSTNAME || 'vz-11253e6e-275.b-cdn.net';
  if (key === 'BUNNY_STORAGE_ZONE') return process.env.BUNNY_LIBRARY_ID || '379737';
  throw new Error(`Missing required environment variable: ${key}`);
}

/**
 * Generate a signed CDN URL for a given path.
 * @param path Relative path inside the storage zone (no leading slash)
 * @param expiresInSec Expiration time in seconds (default 3600)
 */
export function signUrl(path: string, expiresInSec: number = 3600): string {
  const expires = Math.floor(Date.now() / 1000) + expiresInSec;
  const token = crypto
    .createHmac('sha256', env('BUNNY_STORAGE_API_KEY'))
    .update(`${path}${expires}`)
    .digest('hex');
  return `https://${env('BUNNY_STORAGE_CDN_HOSTNAME')}/${path}?token=${token}&expires=${expires}`;
}

/**
 * Upload a file buffer to Bunny storage.
 * @param path Destination path inside the zone (e.g., "videos/lecture1.mp4")
 * @param buffer File content as Buffer
 * @param mime MIME type of the file
 */
export async function uploadFile(path: string, buffer: Buffer | Uint8Array, mime: string): Promise<string> {
  const url = `https://storage.bunnycdn.com/${env('BUNNY_STORAGE_ZONE')}/${path}`;
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      AccessKey: env('BUNNY_STORAGE_API_KEY'),
      'Content-Type': mime,
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    body: buffer as any,
  });
  if (!response.ok) {
    const txt = await response.text();
    throw new Error(`Bunny upload failed: ${response.status} ${txt}`);
  }
  return signUrl(path, 60 * 60 * 24 * 365);
}

/**
 * Delete a file from Bunny storage.
 * @param path Path of the file to delete
 */
export async function deleteFile(path: string): Promise<void> {
  const url = `https://storage.bunnycdn.com/${env('BUNNY_STORAGE_ZONE')}/${path}`;
  const response = await fetch(url, {
    method: 'DELETE',
    headers: { AccessKey: env('BUNNY_STORAGE_API_KEY') },
  });
  if (!response.ok) {
    const txt = await response.text();
    throw new Error(`Bunny delete failed: ${response.status} ${txt}`);
  }
}
