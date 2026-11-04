import { afterEach, describe, expect, it, vi } from 'vitest';
import { GENERATORS } from '../registry';
import { CABLE_TYPES, findBestCable, generateCableQuestion } from '../cables';
import { generateRaidQuestion } from '../raid';
import { generatePortQuestion } from '../ports';
import { validateQuestionAnswers } from '../../answerValidation';

afterEach(() => vi.restoreAllMocks());
const scenario = (index: number) => vi.spyOn(Math, 'random').mockReturnValue((index + .1) / 8);

describe('fair cable alternatives', () => {
  it('accepts tested Cat6 for 40m/10G with its own advantage, not Cat6a advantages', () => {
    scenario(3);
    const q = GENERATORS.cables();
    const cat6 = CABLE_TYPES.find(c => c.type === 'Cat 6 (Twisted Pair)')!;
    expect(validateQuestionAnswers(q, { cableType: cat6.type, reason1: cat6.pros[0] })).toBe(true);
    expect(validateQuestionAnswers(q, { cableType: cat6.type, reason1: '10 Gbit/s bis 100m' })).toBe(false);
  });
  it('does not recommend an incapable last entry or unknown-speed fibre fallback', () => {
    expect(() => findBestCable(2000, 10000, 'WAN', [CABLE_TYPES[0]])).toThrow();
    expect(() => findBestCable(5000, 1234567, 'WAN')).toThrow();
  });
  it('states assumptions, multiple valid answers and distinct reasons before checking', () => {
    const q = generateCableQuestion();
    expect(q.questionText).toMatch(/mehrere.*gültig/i);
    expect(q.questionText).toMatch(/unterschiedliche/);
    expect(q.questionText).toContain('55 m');
    expect(q.solutionSteps.join('\n')).toContain('Eine mögliche Empfehlung');
  });
});

it('defines guaranteed arbitrary RAID failures before rebuild and explains mirror-pair distribution', () => {
  vi.spyOn(Math, 'random').mockReturnValue(.9);
  const q = generateRaidQuestion();
  expect(q.raid.level).toBe('RAID 10');
  expect(q.questionText).toMatch(/beliebig.*gleichzeitig/);
  expect(q.questionText).toContain('vor einem Rebuild');
  expect(q.answerInputs[1].label).toContain('Garantiert');
  expect(q.solutionSteps.join('\n')).toContain('beide Platten desselben Spiegelpaares');
  expect(q.expectedAnswers.faultTolerance).toBe('1');
});

it.each([.25, .75])('qualifies HTTPS TCP in both directions (%s)', direction => {
  vi.spyOn(Math, 'random').mockReturnValueOnce(15.5 / 30).mockReturnValueOnce(direction);
  const q = generatePortQuestion();
  expect(q.port).toBe(443);
  expect(q.questionText).toContain('HTTP/1.1 oder HTTP/2');
  expect(q.solutionSteps.join('\n')).toContain('HTTP/3');
  expect(q.expectedAnswers.protocol).toBe('TCP');
});

it.each([
  [100, 1000, 'Büro', ['Cat 5e', 'Cat 6', 'Cat 6a', 'Cat 7', 'Multimode', 'Singlemode']],
  [55, 10000, 'Büro', ['Cat 6', 'Cat 6a', 'Cat 7', 'Multimode', 'Singlemode']],
  [56, 10000, 'Büro', ['Cat 6a', 'Cat 7', 'Multimode', 'Singlemode']],
  [101, 10000, 'Büro', ['Multimode', 'Singlemode']],
  [300, 10000, 'Campus', ['Multimode', 'Singlemode']],
  [301, 10000, 'Campus', ['Singlemode']],
  [550, 1000, 'EMI', ['Multimode', 'Singlemode']],
  [551, 1000, 'EMI', ['Singlemode']],
  [10000, 10000, 'WAN', ['Singlemode']],
  [10001, 10000, 'WAN', []],
  [95, 1000, 'Störquellen', ['Cat 6', 'Cat 6a', 'Cat 7', 'Multimode', 'Singlemode']],
] as const)('uses rate-specific catalogue constraints at %sm/%sMb', async (distance, speed, environment, prefixes) => {
  const { findSuitableCables } = await import('../cables');
  const names = findSuitableCables(distance, speed, environment).map(c => c.type.split(' (')[0].replace(' Glasfaser', ''));
  expect(names).toEqual(prefixes);
});

it('accepts each alternative in all eight scenarios only with its own distinct advantages', () => {
  for (let index = 0; index < 8; index++) {
    const random = scenario(index);
    const q = GENERATORS.cables();
    random.mockRestore();
    expect(q.cableChoices!.length).toBeGreaterThan(0);
    for (const cable of q.cableChoices!.filter(c => q.answerInputs![0].acceptedValues!.includes(c.type))) {
      const answers: Record<string, string> = { cableType: cable.type };
      const reasons = q.answerInputs!.filter(c => c.valueKey.startsWith('reason'));
      reasons.forEach((cfg, n) => { answers[cfg.valueKey] = cable.pros[n]; });
      expect(validateQuestionAnswers(q, answers), `${index}/${cable.type}`).toBe(true);
      if (reasons.length > 1) {
        expect(validateQuestionAnswers(q, { ...answers, reason2: answers.reason1 })).toBe(false);
      }
      expect(validateQuestionAnswers(q, { ...answers, reason1: 'unbelegt' })).toBe(false);
    }
    expect(validateQuestionAnswers(q, { ...q.expectedAnswers, cableType: 'Koaxialkabel (RG-6)' } as Record<string,string>)).toBe(false);
  }
});

it.each([4, 6, 8])('distinguishes guaranteed one failure from up to one per mirror pair for %s disks', async disks => {
  const { calculateRaid } = await import('../raid');
  const survivors: number[] = [];
  for (let mask = 0; mask < 2 ** disks; mask++) {
    const failed = Array.from({ length: disks }, (_, disk) => Boolean(mask & (1 << disk)));
    const count = failed.filter(Boolean).length;
    const survives = Array.from({ length: disks / 2 }, (_, pair) => !(failed[pair * 2] && failed[pair * 2 + 1])).every(Boolean);
    if (count <= 1) expect(survives).toBe(true);
    if (mask === 3) expect(survives).toBe(false);
    if (survives) survivors.push(count);
  }
  expect(Math.max(...survivors)).toBe(disks / 2);
  expect(calculateRaid('RAID 10', disks, 1000).faultTolerance).toBe(1);
});

it.each([0, -1, NaN, Infinity])('rejects invalid cable distance %s', async distance => {
  const { findSuitableCables } = await import('../cables');
  expect(findSuitableCables(distance, 1000, 'Büro')).toEqual([]);
});
