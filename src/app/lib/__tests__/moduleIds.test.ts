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

  it('passes through unknown module IDs unchanged (toCanonicalModuleId)', () => {
    expect(toCanonicalModuleId('bandwidth')).toBe('bandwidth');
    expect(toCanonicalModuleId('cables')).toBe('cables');
    expect(toCanonicalModuleId('sql')).toBe('sql');
  });

  it('passes through unmapped module IDs unchanged (toStoredProgressModuleId)', () => {
    expect(toStoredProgressModuleId('bandwidth')).toBe('bandwidth');
    expect(toStoredProgressModuleId('cables')).toBe('cables');
    expect(toStoredProgressModuleId('sql')).toBe('sql');
  });

  it('returns an empty array when given an empty input', () => {
    expect(normalizeProgressModules([])).toEqual([]);
  });

  it('normalizes a single legacy entry to its canonical module ID', () => {
    const normalized = normalizeProgressModules([
      {
        module: 'unit-conversion',
        questions_attempted: 5,
        questions_correct: 4,
        streak_days: 3,
        last_session: '2026-03-30T10:00:00.000Z',
      },
    ]);

    expect(normalized).toHaveLength(1);
    expect(normalized[0].module).toBe('unitConversion');
    expect(normalized[0].questions_attempted).toBe(5);
    expect(normalized[0].questions_correct).toBe(4);
  });

  it('merges image-transfer-combo legacy rows with imageTransferCombo canonical rows', () => {
    const normalized = normalizeProgressModules([
      {
        module: 'image-transfer-combo',
        questions_attempted: 2,
        questions_correct: 1,
        streak_days: 0,
        last_session: '2026-03-28T09:00:00.000Z',
      },
      {
        module: 'imageTransferCombo',
        questions_attempted: 6,
        questions_correct: 5,
        streak_days: 1,
        last_session: '2026-04-01T12:00:00.000Z',
      },
    ]);

    expect(normalized).toHaveLength(1);
    expect(normalized[0]).toMatchObject({
      module: 'imageTransferCombo',
      questions_attempted: 8,
      questions_correct: 6,
      streak_days: 1,
      last_session: '2026-04-01T12:00:00.000Z',
    });
  });

  it('keeps the latest last_session when merging rows', () => {
    const normalized = normalizeProgressModules([
      {
        module: 'imageCalc',
        questions_attempted: 1,
        questions_correct: 1,
        streak_days: 1,
        last_session: '2026-04-02T08:00:00.000Z',
      },
      {
        module: 'image-calc',
        questions_attempted: 1,
        questions_correct: 0,
        streak_days: 1,
        last_session: '2026-03-15T08:00:00.000Z',
      },
    ]);

    expect(normalized[0].last_session).toBe('2026-04-02T08:00:00.000Z');
  });

  it('handles null streak_days on a merged row without crashing', () => {
    const normalized = normalizeProgressModules([
      {
        module: 'image-calc',
        questions_attempted: 2,
        questions_correct: 1,
        streak_days: null,
        last_session: null,
      },
      {
        module: 'imageCalc',
        questions_attempted: 3,
        questions_correct: 2,
        streak_days: 5,
        last_session: '2026-04-01T08:00:00.000Z',
      },
    ]);

    expect(normalized).toHaveLength(1);
    expect(normalized[0].streak_days).toBe(5);
    expect(normalized[0].questions_attempted).toBe(5);
  });

  it('keeps non-mapped modules intact alongside normalized modules', () => {
    const normalized = normalizeProgressModules([
      {
        module: 'bandwidth',
        questions_attempted: 10,
        questions_correct: 8,
        streak_days: 2,
        last_session: '2026-04-01T08:00:00.000Z',
      },
      {
        module: 'image-calc',
        questions_attempted: 3,
        questions_correct: 2,
        streak_days: 1,
        last_session: '2026-03-31T08:00:00.000Z',
      },
    ]);

    expect(normalized).toHaveLength(2);
    const modules = normalized.map((r) => r.module);
    expect(modules).toContain('bandwidth');
    expect(modules).toContain('imageCalc');
  });
});