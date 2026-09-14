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
  'html', 'htm', 'svg', 'vbs', 'scr', 'dll', 'com', 'msi', 'jar'
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
  return sanitized.replace(/^\.+/, '').replace(/\.{2,}/g, '.');
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
