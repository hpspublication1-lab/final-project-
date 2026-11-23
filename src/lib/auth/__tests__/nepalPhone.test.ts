import { describe, it, expect } from 'vitest';
import { toNepalLocal, toE164Nepal, maskNepalPhone } from '../nepalPhone';

describe('Nepali mobile numbers', () => {
  it.each([
    ['9812345678', '9812345678'],
    ['981-234-5678', '9812345678'],
    ['+9779812345678', '9812345678'],
    ['9779812345678', '9812345678'],
    ['009779812345678', '9812345678'],
    ['09812345678', '9812345678'],
    ['9741234567', '9741234567'], // NTC
    ['9612345678', '9612345678'], // Smart
  ])('normalises %s', (input, local) => {
    expect(toNepalLocal(input)).toBe(local);
    expect(toE164Nepal(input)).toBe(`+977${local}`);
  });

  it.each(['', '981234567', '98123456789', '9512345678', '0145678901', '+919812345678', 'abcdefghij'])(
    'rejects %s',
    (input) => {
      expect(toNepalLocal(input)).toBeNull();
      expect(toE164Nepal(input)).toBeNull();
    }
  );

  it('masks for display and logs', () => {
    expect(maskNepalPhone('+9779812345678')).toBe('98•••••678');
    expect(maskNepalPhone('nonsense')).toBe('•••');
  });
});
