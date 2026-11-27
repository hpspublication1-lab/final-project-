/**
 * Malware scanning slot. Decision D7 (which scanner) is still open, so no
 * scanner is integrated: getScanner() returns null, every upload stays
 * NOT_SCANNED, nothing is promoted to the published bucket, and the database
 * refuses to publish a lesson that uses it (ASSET_NOT_READY).
 *
 * When D7 is decided, add one implementation of MalwareScanner here and return
 * it from getScanner() based on server configuration. Requirements:
 *   - scan the exact bytes that were validated (they are passed in, already read);
 *   - return INFECTED only on a positive detection, ERROR on any failure or
 *     timeout (ERROR can be retried; CLEAN and INFECTED are final in the database);
 *   - never send the file anywhere the owner hasn't approved.
 */

export interface ScanVerdict {
  status: 'CLEAN' | 'INFECTED' | 'ERROR';
  engine: string;
  detail?: string;
}

export interface MalwareScanner {
  readonly name: string;
  scan(bytes: Uint8Array, meta: { sha256: string; mime: string }): Promise<ScanVerdict>;
}

export const NO_SCANNER_MESSAGE = 'No malware scanner is configured yet (decision D7), so this file stays unscanned and can’t be published.';

export function getScanner(): MalwareScanner | null {
  return null;
}
