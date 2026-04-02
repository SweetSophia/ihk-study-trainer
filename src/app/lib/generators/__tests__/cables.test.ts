import { describe, expect, it } from 'vitest';

import { findBestCable } from '../cables';

describe('cable selection in EMI-heavy environments', () => {
  it('prefers an EMI-safe cable for the warehouse scenario', () => {
    const bestCable = findBestCable(95, 1000, 'Lagerhalle mit Störquellen');

    expect(bestCable.type).toContain('Cat 7');
    expect(bestCable.cons.some((con) => /EMI/i.test(con))).toBe(false);
  });

  it('selects the remaining EMI-safe candidate after filtering out EMI-susceptible cables', () => {
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
        maxSpeed: 1000,
        maxDistance: 50,
        environments: ['WAN'],
        pros: ['Immun gegen EMI'],
        cons: ['Sehr teuer'],
      },
    ]);

    expect(bestCable.type).toContain('Singlemode');
    expect(bestCable.type).not.toContain('Cat 5e');
  });
});
