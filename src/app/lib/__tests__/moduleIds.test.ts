import { describe, expect, it } from 'vitest';

import {
  normalizeProgressModules,
  toCanonicalModuleId,
  toStoredProgressModuleId,
} from '../moduleIds';

describe('module ID compatibility helpers', () => {
  it('maps legacy module IDs to canonical UI IDs', () => {
    expect(toCanonicalModuleId('image-calc')).toBe('imageCalc');
    expect(toCanonicalModuleId('unit-conversion')).toBe('unitConversion');
    expect(toCanonicalModuleId('image-transfer-combo')).toBe('imageTransferCombo');
    expect(toCanonicalModuleId('handelskalkulation-vorwaerts')).toBe('handelskalkulationVorwaerts');
    expect(toCanonicalModuleId('handelskalkulation-rueckwaerts')).toBe('handelskalkulationRueckwaerts');
  });

  it('maps canonical IDs back to stored progress IDs for backward compatibility', () => {
    expect(toStoredProgressModuleId('imageCalc')).toBe('image-calc');
    expect(toStoredProgressModuleId('unitConversion')).toBe('unit-conversion');
    expect(toStoredProgressModuleId('imageTransferCombo')).toBe('image-transfer-combo');
  });

  it('merges legacy and canonical progress rows into one canonical module entry', () => {
    const normalized = normalizeProgressModules([
      {
        module: 'image-calc',
        questions_attempted: 3,
        questions_correct: 2,
        streak_days: 1,
        last_session: '2026-04-01T08:00:00.000Z',
      },
      {
        module: 'imageCalc',
        questions_attempted: 4,
        questions_correct: 3,
        streak_days: 2,
        last_session: '2026-04-02T08:00:00.000Z',
      },
    ]);

    expect(normalized).toHaveLength(1);
    expect(normalized[0]).toMatchObject({
      module: 'imageCalc',
      questions_attempted: 7,
      questions_correct: 5,
      streak_days: 2,
      last_session: '2026-04-02T08:00:00.000Z',
    });
  });
});
