import { describe, expect, it } from 'vitest';

import { findBestCable } from '../cables';

describe('cable selection in EMI-heavy environments', () => {
  it('prefers an EMI-safe cable for the warehouse scenario', () => {
    const bestCable = findBestCable(95, 1000, 'Lagerhalle mit Störquellen');

    expect(bestCable.type).toContain('Cat 7');
    expect(bestCable.cons.some((con) => /EMI/i.test(con))).toBe(false);
  });

  it('does not fall back to the original EMI-susceptible candidate list when none are EMI-safe', () => {
    const bestCable = findBestCable(50, 1000, 'Industriehalle mit starker EMI', [
      {
        type: 'Cat 5e (Twisted Pair)',
        maxSpeed: 1000,
        maxDistance: 100,
        environments: ['Indoor'],
        pros: ['Günstig'],
        cons: ['Störanfällig bei EMI'],
      },
      {
        type: 'Singlemode Glasfaser (OS2)',
        maxSpeed: 100,
        maxDistance: 10,
        environments: ['WAN'],
        pros: ['Immun gegen EMI'],
        cons: ['Sehr teuer'],
      },
    ]);

    expect(bestCable.type).toContain('Singlemode');
    expect(bestCable.type).not.toContain('Cat 5e');
  });

  it('falls back to Multimode fiber for EMI environments when Cat 7 is not available', () => {
    const bestCable = findBestCable(50, 1000, 'Lagerhalle mit Störquellen', [
      {
        type: 'Multimode Glasfaser (OM3/OM4)',
        maxSpeed: 100000,
        maxDistance: 550,
        environments: ['Rechenzentrum', 'Indoor', 'Campus'],
        pros: ['Hohe Bandbreite', 'Immun gegen EMI', 'Bis 550m'],
        cons: ['Teuer', 'Spezielle Werkzeuge nötig'],
      },
    ]);

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

  it('falls back to Singlemode fiber when no cable meets distance and speed requirements', () => {
    const bestCable = findBestCable(5000, 100000, 'WAN');

    expect(bestCable.type).toContain('Singlemode');
  });

  it('returns the last entry in the list as final fallback when Singlemode is absent', () => {
    const limitedCables = [
      {
        type: 'Cat 5e (Twisted Pair)',
        maxSpeed: 1000,
        maxDistance: 100,
        environments: ['Indoor'],
        pros: ['Günstig'],
        cons: ['Max. 100m'],
      },
      {
        type: 'Koaxialkabel (RG-6)',
        maxSpeed: 1000,
        maxDistance: 500,
        environments: ['Outdoor'],
        pros: ['Gute Reichweite'],
        cons: ['Geringe Bandbreite'],
      },
    ];

    // Neither cable can reach 2000m at 10000 Mbit/s; no Singlemode present
    const bestCable = findBestCable(2000, 10000, 'WAN', limitedCables);

    expect(bestCable.type).toBe('Koaxialkabel (RG-6)');
  });
});