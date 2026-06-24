import { describe, it, expect } from 'vitest';
import { isValidAccessHash, generateAccessHash } from '../auth';

describe('isValidAccessHash', () => {
  it('accepts a 12-char alphanumeric hash', () => {
    expect(isValidAccessHash('abcdef123456')).toBe(true);
    expect(isValidAccessHash('ABCDEFGHIJKL')).toBe(true);
    expect(isValidAccessHash('a1B2c3D4e5F6')).toBe(true);
  });

  it('rejects strings that are too short', () => {
    expect(isValidAccessHash('')).toBe(false);
    expect(isValidAccessHash('a')).toBe(false);
    expect(isValidAccessHash('abcdef12345')).toBe(false); // 11 chars
  });

  it('rejects strings that are too long', () => {
    expect(isValidAccessHash('abcdef1234567')).toBe(false); // 13 chars
    expect(isValidAccessHash('a'.repeat(100))).toBe(false);
  });

  it('rejects strings with non-alphanumeric characters', () => {
    // Dashes, spaces, and punctuation are NOT in [A-Za-z0-9]
    expect(isValidAccessHash('abcdef12345-')).toBe(false);
    expect(isValidAccessHash('abcdef 12345')).toBe(false);
    expect(isValidAccessHash('abcdef12345!')).toBe(false);
    expect(isValidAccessHash('abcdef12345\n')).toBe(false);
    expect(isValidAccessHash('abcdef_12345x')).toBe(false);
    // Umlauts are also rejected (only ASCII alphanumeric)
    expect(isValidAccessHash('äbcdef123456')).toBe(false);
  });

  it('rejects non-string inputs (defense against typeof bypass)', () => {
    expect(isValidAccessHash(null)).toBe(false);
    expect(isValidAccessHash(undefined)).toBe(false);
    expect(isValidAccessHash(123)).toBe(false);
    expect(isValidAccessHash({})).toBe(false);
    expect(isValidAccessHash([])).toBe(false);
    expect(isValidAccessHash(true)).toBe(false);
  });

  it('is consistent with the format produced by generateAccessHash', () => {
    // A round-trip: anything generateAccessHash produces should validate.
    for (let i = 0; i < 50; i++) {
      expect(isValidAccessHash(generateAccessHash())).toBe(true);
    }
  });
});
