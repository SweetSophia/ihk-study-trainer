import { describe, expect, it } from 'vitest';

import { CABLE_TYPES, findBestCable, generateCableQuestion } from '../cables';

it('qualifies fiber comparison rates and reaches with specific optics and fiber grades', () => {
  const solution = generateCableQuestion().solutionSteps;
  const multimode = solution.find((step) => step.startsWith('  • Multimode'));
  const singlemode = solution.find((step) => step.startsWith('  • Singlemode'));
  expect(multimode).toContain('100GBASE-SR4-S');
  expect(multimode).toContain('100 Gbit/s');
  expect(multimode).toContain('70m (OM3)');
  expect(multimode).toContain('100m (OM4)');
  expect(singlemode).toContain('100GBASE-LR4-S');
  expect(singlemode).toContain('100 Gbit/s');
  expect(singlemode).toContain('10km');
  for (const comparison of [multimode, singlemode]) {
    expect(comparison).toContain('abhängig');
    expect(comparison).not.toMatch(/bis .*Gbit\/s, max/);
  }
});

describe('cable selection in EMI-heavy environments', () => {
  it('prefers an EMI-safe cable for the warehouse scenario', () => {
    const bestCable = findBestCable(95, 1000, 'Lagerhalle mit Störquellen');

    expect(bestCable.type).toContain('Cat 7');
    expect(bestCable.cons.some((con) => /EMI/i.test(con))).toBe(false);
  });

  it('rejects a catalogue with no capable EMI-safe profile', () => {
    expect(() => findBestCable(50, 1000, 'Industriehalle EMI', [CABLE_TYPES[0]])).toThrow();
  });

  it('falls back to Multimode fiber for EMI environments when Cat 7 is not available', () => {
    const bestCable = findBestCable(50, 1000, 'Lagerhalle mit Störquellen', CABLE_TYPES.filter(c => c.type.includes('Multimode')));

    expect(bestCable.type).toContain('Multimode');
  });
});

describe('cable selection in non-EMI environments', () => {
  it('prefers Cat 5e for short 1 Gbit/s distances in a standard office', () => {
    const bestCable = findBestCable(30, 1000, 'Bürogebäude (Indoor)');

    expect(bestCable.type).toContain('Cat 5e');
  });

  it('prefers Cat 6a for 10 Gbit/s connections within 100m', () => {
    const bestCable = findBestCable(40, 10000, 'Rechenzentrum');

    expect(bestCable.type).toContain('Cat 6a');
  });

  it('selects Multimode fiber for campus distances up to 550m', () => {
    const bestCable = findBestCable(200, 10000, 'Campus (Gebäude zu Gebäude)');

    expect(bestCable.type).toContain('Multimode');
  });

  it('selects Singlemode fiber for very long outdoor distances', () => {
    const bestCable = findBestCable(2000, 10000, 'Campus (Outdoor-Verbindung)');

    expect(bestCable.type).toContain('Singlemode');
  });

  it('does not invent a profile for an unsupported rate', () => {
    expect(() => findBestCable(5000, 100000, 'WAN')).toThrow();
  });

  it('rejects an insufficient catalogue rather than returning its last entry', () => {
    expect(() => findBestCable(2000, 10000, 'WAN', [CABLE_TYPES[0], CABLE_TYPES[6]])).toThrow();
  });
});
