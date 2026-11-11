import { describe, it, expect } from 'vitest';
import {
  generateCryptographicCode,
  verifyCodeChecksum,
  mintBulkActivationCodes,
} from '../bulkActivationCodesEngine';

describe('Bulk Cryptographic Activation Codes Engine', () => {
  describe('Cryptographic Code Generation & Checksum', () => {
    it('should generate codes conforming to the SAMYAK standard format', () => {
      const code = generateCryptographicCode('CEE');
      expect(code).toMatch(/^SAMYAK-CEE-[A-Z2-9]{4}-[A-Z2-9]{6}$/);
    });

    it('should never contain ambiguous characters (0, O, 1, I)', () => {
      for (let i = 0; i < 50; i++) {
        const code = generateCryptographicCode('SEC');
        expect(code).not.toMatch(/[01IO]/);
      }
    });

    it('should successfully verify mathematical checksum on genuine codes', () => {
      for (let i = 0; i < 20; i++) {
        const code = generateCryptographicCode('PRM');
        const isValid = verifyCodeChecksum(code);
        expect(isValid).toBe(true);
      }
    });

    it('should reject tampered or corrupted activation codes', () => {
      const genuine = generateCryptographicCode('CEE');
      // Tamper with the last character (checksum)
      const tamperedChecksum = genuine.slice(0, -1) + (genuine.endsWith('A') ? 'B' : 'A');
      expect(verifyCodeChecksum(tamperedChecksum)).toBe(false);

      // Tamper with segment
      const parts = genuine.split('-');
      const tamperedBody = `SAMYAK-CEE-ZZZZ-${parts[3]}`;
      expect(verifyCodeChecksum(tamperedBody)).toBe(false);

      // Malformed inputs
      expect(verifyCodeChecksum('INVALID-CODE')).toBe(false);
      expect(verifyCodeChecksum('')).toBe(false);
    });
  });

  describe('Bulk Minting Capabilities (up to 10,000 keys)', () => {
    it('should mint specified count of unique collision-free codes', () => {
      const result = mintBulkActivationCodes({
        batchName: 'MED-2082',
        count: 500,
        plan: 'pro',
        durationDays: 365,
        notes: 'Medical college wholesale distribution',
      });

      expect(result.totalMinted).toBe(500);
      expect(result.codes.length).toBe(500);
      expect(result.batchId).toBeDefined();

      // Ensure 100% collision-free
      const uniqueCodes = new Set(result.codes.map((c) => c.code));
      expect(uniqueCodes.size).toBe(500);

      // Verify every code has a valid checksum
      result.codes.forEach((c) => {
        expect(verifyCodeChecksum(c.code)).toBe(true);
        expect(c.plan).toBe('pro');
        expect(c.duration_days).toBe(365);
      });
    });

    it('should generate valid CSV content with headers', () => {
      const result = mintBulkActivationCodes({
        batchName: 'SEE-2081',
        count: 10,
        plan: 'student',
        durationDays: 90,
      });

      expect(result.csvContent).toContain('Serial #,Activation Code,Plan,Duration Days,Batch ID,Expires At');
      const lines = result.csvContent.trim().split('\n');
      expect(lines.length).toBe(11); // 1 header + 10 rows
    });

    it('should clamp requested count between 1 and 10,000', () => {
      const minResult = mintBulkActivationCodes({
        batchName: 'MIN',
        count: -5,
        plan: 'student',
        durationDays: 30,
      });
      expect(minResult.totalMinted).toBe(1);
    });
  });
});
