import { describe, it, expect } from 'vitest';
import { calculateRaid, generateRaidQuestion } from '../raid';

describe('calculateRaid', () => {
  it('computes RAID 0 capacity = disks × size, fault tolerance 0', () => {
    expect(calculateRaid('RAID 0', 4, 1000)).toEqual({
      usableCapacityGb: 4000,
      faultTolerance: 0,
    });
  });

  it('computes RAID 1 capacity = one disk, fault tolerance = disks − 1', () => {
    expect(calculateRaid('RAID 1', 2, 1000)).toEqual({
      usableCapacityGb: 1000,
      faultTolerance: 1,
    });
    expect(calculateRaid('RAID 1', 4, 500)).toEqual({
      usableCapacityGb: 500,
      faultTolerance: 3,
    });
  });

  it('computes RAID 5 capacity = (disks − 1) × size, fault tolerance 1', () => {
    expect(calculateRaid('RAID 5', 3, 1000)).toEqual({
      usableCapacityGb: 2000,
      faultTolerance: 1,
    });
    expect(calculateRaid('RAID 5', 5, 2000)).toEqual({
      usableCapacityGb: 8000,
      faultTolerance: 1,
    });
  });

  it('computes RAID 6 capacity = (disks − 2) × size, fault tolerance 2', () => {
    expect(calculateRaid('RAID 6', 4, 1000)).toEqual({
      usableCapacityGb: 2000,
      faultTolerance: 2,
    });
    expect(calculateRaid('RAID 6', 8, 2000)).toEqual({
      usableCapacityGb: 12000,
      faultTolerance: 2,
    });
  });

  it('computes RAID 10 capacity = (disks / 2) × size, fault tolerance 1', () => {
    expect(calculateRaid('RAID 10', 4, 1000)).toEqual({
      usableCapacityGb: 2000,
      faultTolerance: 1,
    });
    expect(calculateRaid('RAID 10', 6, 4000)).toEqual({
      usableCapacityGb: 12000,
      faultTolerance: 1,
    });
  });

  it('rejects configurations below the minimum disk count', () => {
    expect(() => calculateRaid('RAID 0', 1, 1000)).toThrow();
    expect(() => calculateRaid('RAID 1', 1, 1000)).toThrow();
    expect(() => calculateRaid('RAID 5', 2, 1000)).toThrow();
    expect(() => calculateRaid('RAID 6', 3, 1000)).toThrow();
    expect(() => calculateRaid('RAID 10', 3, 1000)).toThrow();
  });

  it('rejects non-even RAID 10 disk counts', () => {
    expect(() => calculateRaid('RAID 10', 5, 1000)).toThrow();
    expect(() => calculateRaid('RAID 10', 7, 1000)).toThrow();
  });

  it('accepts the canonical even RAID 10 disk counts (4, 6, 8, 10, 12)', () => {
    for (const d of [4, 6, 8, 10, 12]) {
      expect(() => calculateRaid('RAID 10', d, 1000)).not.toThrow();
    }
  });
});

describe('generateRaidQuestion', () => {
  it('produces a question with the RAID module marker and required fields', () => {
    const q = generateRaidQuestion();
    expect(q.theme).toBe('RAID-Konfigurationen');
    expect(q.questionText.toLowerCase()).toContain('raid');
    expect(q.expectedAnswers.usableCapacity).toBeTruthy();
    expect(['GB', 'TB']).toContain(q.expectedAnswers.unit);
    expect(q.expectedAnswers.faultTolerance).toMatch(/^[0-4]$/);
    expect(q.answerInputs).toHaveLength(2);
  });

  it('emits a raid config that matches the expected answers (sanity guard)', () => {
    const q = generateRaidQuestion();
    expect(q.raid.disks).toBeGreaterThanOrEqual(2);
    expect(q.raid.diskSizeGb).toBeGreaterThan(0);
    expect(q.raid.faultTolerance).toBe(Number(q.expectedAnswers.faultTolerance));

    // Recompute from the raid config and verify expected matches.
    const expectedCapGb = calculateRaid(q.raid.level, q.raid.disks, q.raid.diskSizeGb)
      .usableCapacityGb;
    expect(q.raid.usableCapacityGb).toBe(expectedCapGb);
  });

  it('picks a valid disk count for the level (no constraint violations)', () => {
    // Generate a few to catch any path that bypasses the constraint loop.
    for (let i = 0; i < 20; i++) {
      const q = generateRaidQuestion();
      expect(() =>
        calculateRaid(q.raid.level, q.raid.disks, q.raid.diskSizeGb),
      ).not.toThrow();
    }
  });

  it('formats capacity with GB unit for small values and TB for >= 1000 GB', () => {
    // Drive the random pick into a known-bad shape by inspecting multiple
    // samples and asserting the unit rule always holds.
    for (let i = 0; i < 30; i++) {
      const q = generateRaidQuestion();
      const capGb = q.raid.usableCapacityGb;
      const expectedUnit = capGb >= 1000 ? 'TB' : 'GB';
      expect(q.expectedAnswers.unit).toBe(expectedUnit);
    }
  });

  it('provides answerInputs that cover usableCapacity, unit, and faultTolerance', () => {
    const q = generateRaidQuestion();
    const keys = q.answerInputs!.map((cfg) => cfg.valueKey);
    expect(keys).toContain('usableCapacity');
    expect(keys).toContain('faultTolerance');
    const capCfg = q.answerInputs!.find((c) => c.valueKey === 'usableCapacity')!;
    expect(capCfg.unitKey).toBe('unit');
    expect(capCfg.unitOptions).toEqual(['GB', 'TB']);
  });

  it('solution steps reference the chosen RAID level', () => {
    for (let i = 0; i < 20; i++) {
      const q = generateRaidQuestion();
      expect(q.solutionSteps[0]).toContain(q.raid.level);
    }
  });
});
