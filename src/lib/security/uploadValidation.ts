/**
 * File Upload Security & Integrity Validation
 * Protects against MIME-spoofing, path traversal, malicious extensions, and oversized payloads.
 */

export const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

export const ALLOWED_DOCUMENT_MIME_TYPES = new Set([
  'application/pdf',
]);

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;    // 5 MB
export const MAX_DOCUMENT_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB

const DANGEROUS_EXTENSIONS = new Set([
  'exe', 'bat', 'cmd', 'sh', 'php', 'phtml', 'js', 'jsx', 'ts', 'tsx',
  'html', 'htm', 'svg', 'vbs', 'scr', 'dll', 'com', 'msi', 'jar',
  'py', 'ps1', 'psm1', 'cgi', 'pl', 'jsp', 'asp', 'aspx', 'war',
  'apk', 'app', 'bin', 'deb', 'rpm', 'elf', 'dmg', 'iso', 'img',
  'reg', 'wsf', 'hta', 'cpl', 'gadget', 'inf', 'ins', 'isu',
  'job', 'jse', 'lnk', 'msc', 'msp', 'mst', 'pif', 'sct', 'shb',
  'shs', 'u3p', 'vb', 'vbe'
]);

export interface UploadValidationResult {
  valid: boolean;
  error?: string;
  sanitizedFilename?: string;
}

/**
 * Sanitizes a filename to prevent directory traversal and special character injection.
 */
export function sanitizeFilename(filename: string): string {
  // Strip path traversal attempts and backslashes
  const basename = filename.replace(/^.*[\\/]/, '');
  // Remove null bytes and control chars
  const clean = basename.replace(/[\x00-\x1F\x7F]/g, '');
  // Replace spaces and special characters with underscore, keeping only safe alphanumeric, dots, hyphens
  const sanitized = clean.replace(/[^a-zA-Z0-9._-]/g, '_');
  // Avoid leading dots (hidden files) or double dots
  const stripped = sanitized.replace(/^\.+/, '').replace(/\.{2,}/g, '.');
  // Limit length while preserving file extension
  if (stripped.length > 200) {
    const parts = stripped.split('.');
    if (parts.length > 1) {
      const ext = parts.pop()!;
      return `${parts.join('.').slice(0, 195 - ext.length)}.${ext}`;
    }
    return stripped.slice(0, 200);
  }
  return stripped;
}

/**
 * Validates file upload metadata for size, MIME type, and safe extension.
 */
export function validateUploadFile(
  file: { name: string; size: number; type: string },
  context: 'image' | 'document' | 'any' = 'any'
): UploadValidationResult {
  if (!file || !file.name) {
    return { valid: false, error: 'No file provided or missing filename.' };
  }

  const sanitized = sanitizeFilename(file.name);
  const ext = sanitized.split('.').pop()?.toLowerCase() || '';

  if (!ext || DANGEROUS_EXTENSIONS.has(ext)) {
    return { valid: false, error: `File type .${ext} is prohibited for security reasons.` };
  }

  const mime = file.type.toLowerCase().trim();
  const isImage = ALLOWED_IMAGE_MIME_TYPES.has(mime);
  const isDoc = ALLOWED_DOCUMENT_MIME_TYPES.has(mime);

  if (context === 'image' && !isImage) {
    return { valid: false, error: 'Only JPEG, PNG, and WebP images are permitted.' };
  }

  if (context === 'document' && !isDoc) {
    return { valid: false, error: 'Only PDF documents are permitted.' };
  }

  if (context === 'any' && !isImage && !isDoc) {
    return { valid: false, error: 'File type not allowed. Permitted: JPEG, PNG, WebP, PDF.' };
  }

  // Size limit validation
  const maxSize = isDoc ? MAX_DOCUMENT_SIZE_BYTES : MAX_IMAGE_SIZE_BYTES;
  if (file.size > maxSize) {
    const maxMb = maxSize / (1024 * 1024);
    return {
      valid: false,
      error: `File size exceeds the maximum limit of ${maxMb} MB.`,
    };
  }

  if (file.size <= 0) {
    return { valid: false, error: 'Empty files are not allowed.' };
  }

  return {
    valid: true,
    sanitizedFilename: sanitized,
  };
}

/**
 * Validates a base64 Data URL (often used for canvas answer submissions, doubts, or receipts).
 */
export function validateBase64Upload(
  dataUrl: string,
  maxBytes: number = MAX_IMAGE_SIZE_BYTES
): { valid: boolean; mimeType?: string; byteLength?: number; error?: string } {
  if (!dataUrl || typeof dataUrl !== 'string') {
    return { valid: false, error: 'Invalid data URL payload.' };
  }

  const match = dataUrl.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
  if (!match) {
    return { valid: false, error: 'Malformed base64 data URL format.' };
  }

  const mimeType = match[1].toLowerCase();
  const base64Data = match[2];

  if (!ALLOWED_IMAGE_MIME_TYPES.has(mimeType) && !ALLOWED_DOCUMENT_MIME_TYPES.has(mimeType)) {
    return { valid: false, error: `MIME type ${mimeType} is not permitted.` };
  }

  // Base64 byte length estimation
  const byteLength = Math.round((base64Data.length * 3) / 4);
  if (byteLength > maxBytes) {
    return {
      valid: false,
      error: `Payload size (${Math.round(byteLength / 1024)} KB) exceeds maximum limit (${Math.round(maxBytes / 1024)} KB).`,
    };
  }

  return { valid: true, mimeType, byteLength };
}

/**
 * Validates binary buffer magic bytes against expected MIME types
 * to prevent MIME-type spoofing when binary buffers are inspected.
 */
export function validateMagicBytes(buffer: Uint8Array, mimeType: string): boolean {
  if (!buffer || buffer.length < 4) return false;

  const normalizedMime = mimeType.toLowerCase().trim();

  // JPEG: FF D8 FF
  if (normalizedMime === 'image/jpeg') {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (normalizedMime === 'image/png') {
    return (
      buffer.length >= 8 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    );
  }

  // WebP: RIFF....WEBP (52 49 46 46 .... 57 45 42 50)
  if (normalizedMime === 'image/webp') {
    return (
      buffer.length >= 12 &&
      buffer[0] === 0x52 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x46 &&
      buffer[8] === 0x57 &&
      buffer[9] === 0x45 &&
      buffer[10] === 0x42 &&
      buffer[11] === 0x50
    );
  }

  // PDF: %PDF (25 50 44 46)
  if (normalizedMime === 'application/pdf') {
    return (
      buffer[0] === 0x25 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x44 &&
      buffer[3] === 0x46
    );
  }

  return false;
}

/**
 * Generates RFC 6266 Content-Disposition header for safe downloads.
 */
export function getSecureContentDisposition(filename: string, inline: boolean = false): string {
  const sanitized = sanitizeFilename(filename);
  const type = inline ? 'inline' : 'attachment';
  return `${type}; filename="${sanitized}"; filename*=UTF-8''${encodeURIComponent(sanitized)}`;
}
