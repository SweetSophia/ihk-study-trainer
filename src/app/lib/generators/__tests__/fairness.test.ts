import { afterEach, describe, expect, it, vi } from 'vitest';
import { GENERATORS } from '../registry';
import { CABLE_SCENARIOS, CABLE_TYPES, findBestCable, generateCableQuestion } from '../cables';
import { generateRaidQuestion } from '../raid';
import { generatePortQuestion } from '../ports';
import { validateQuestionAnswers } from '../../answerValidation';

afterEach(() => vi.restoreAllMocks());
const scenario = (index: number) => vi.spyOn(Math, 'random').mockReturnValue((index + .1) / CABLE_SCENARIOS.length);

describe('fair cable alternatives', () => {
  it('accepts tested Cat6 for 40m/10G with its own advantage, not Cat6a advantages', () => {
    scenario(3);
    const q = GENERATORS.cables();
    const cat6 = CABLE_TYPES.find(c => c.type === 'Cat 6 (Twisted Pair)')!;
    expect(validateQuestionAnswers(q, { cableType: cat6.type, reason1: cat6.pros[0], reason2: '10 Gbit/s bis 55 m im angegebenen Profil' })).toBe(true);
    expect(validateQuestionAnswers(q, { cableType: cat6.type, reason1: '10 Gbit/s bis 100 m im angegebenen Profil', reason2: cat6.pros[0] })).toBe(false);
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
  for (let index = 0; index < CABLE_SCENARIOS.length; index++) {
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

it('uses two scenario-relevant advantages for every medium without requiring a shorter-link claim', () => {
  scenario(1);
  const q = GENERATORS.cables();
  expect(q.answerInputs!.filter(cfg => cfg.valueKey.startsWith('reason'))).toHaveLength(2);
  expect(validateQuestionAnswers(q, { cableType: 'Cat 6 (Twisted Pair)', reason1: 'Geschirmte Variante im Katalog', reason2: '1 Gbit/s bis 100 m im angegebenen Profil' })).toBe(true);
  expect(validateQuestionAnswers(q, { cableType: 'Cat 6 (Twisted Pair)', reason1: 'Geschirmte Variante im Katalog', reason2: '10 Gbit/s bis 55 m im angegebenen Profil' })).toBe(false);
});

it('does not call shielded copper immune to EMI', () => {
  scenario(2);
  const q = GENERATORS.cables();
  expect(validateQuestionAnswers(q, { cableType: 'Cat 6a (Twisted Pair)', reason1: 'Immun gegen EMI', reason2: '1 Gbit/s bis 100 m im angegebenen Profil' })).toBe(false);
});

it('rejects inconsistent cable metadata without structured inputs instead of grading a canonical fallback', () => {
  const q = GENERATORS.cables();
  expect(validateQuestionAnswers({ ...q, answerInputs: undefined }, q.expectedAnswers as Record<string,string>)).toBe(false);
});

it.each([4, 6, 8])('binds the generated RAID10 explanation to its actual %s-disk possible bound', disks => {
  vi.spyOn(Math, 'random').mockReturnValueOnce(.9).mockReturnValueOnce((disks - 4 + .1) / 5).mockReturnValueOnce(0);
  const q = generateRaidQuestion();
  expect(q.raid.disks).toBe(disks);
  expect(q.expectedAnswers.faultTolerance).toBe('1');
  expect(q.solutionSteps.join('\n')).toContain(`Bis zu ${disks / 2} Ausfälle sind möglich`);
  expect(q.solutionSteps).toContain('  Garantiert tolerierte beliebige Ausfälle: 1');
});

it('states the scenario rate/reach contract and asks for properties before checking', () => {
  scenario(1);
  const q = GENERATORS.cables();
  expect(q.questionText).toContain('Eigenschaften dieses Mediums für die geforderte Datenrate und Entfernung');
  expect(q.questionText).toContain('Reichweitenangaben müssen zur geforderten Datenrate gehören und die Entfernung abdecken.');
  expect(q.answerInputs!.filter(cfg => cfg.valueKey.startsWith('reason')).map(cfg => cfg.label)).toEqual(['Eigenschaft 1', 'Eigenschaft 2']);
  expect(validateQuestionAnswers(q, { cableType: 'Cat 6 (Twisted Pair)', reason1: '1 Gbit/s bis 100 m im angegebenen Profil', reason2: 'Geschirmte Variante im Katalog' })).toBe(true);
  expect(validateQuestionAnswers(q, { cableType: 'Cat 6 (Twisted Pair)', reason1: '10 Gbit/s bis 55 m im angegebenen Profil', reason2: 'Geschirmte Variante im Katalog' })).toBe(false);
});

it('uses a covering profile for both eligibility and properties when rates repeat', () => {
  const cable = CABLE_TYPES.find(c => c.type === 'Cat 6 (Twisted Pair)')!;
  const previousLinks = cable.links;
  const previousScenario = CABLE_SCENARIOS[3];
  try {
    cable.links = [{ speed: 10000, distance: 40 }, { speed: 10000, distance: 55 }];
    CABLE_SCENARIOS[3] = { ...previousScenario, distance: 45 };
    scenario(3);
    const q = GENERATORS.cables();
    expect(q.answerInputs![0].acceptedValues).toContain(cable.type);
    const properties = q.cableChoices!.find(c => c.type === cable.type)!.pros;
    expect(properties).toContain('10 Gbit/s bis 55 m im angegebenen Profil');
    expect(properties).not.toContain('10 Gbit/s bis 40 m im angegebenen Profil');
    expect(validateQuestionAnswers(q, { cableType: cable.type, reason1: '10 Gbit/s bis 55 m im angegebenen Profil', reason2: 'Geschirmte Variante im Katalog' })).toBe(true);
    expect(validateQuestionAnswers(q, { cableType: cable.type, reason1: '10 Gbit/s bis 40 m im angegebenen Profil', reason2: 'Geschirmte Variante im Katalog' })).toBe(false);
  } finally {
    cable.links = previousLinks;
    CABLE_SCENARIOS[3] = previousScenario;
  }
});

it('uses the same kilometre spelling for the Singlemode catalogue and graded property', () => {
  scenario(7);
  const q = GENERATORS.cables();
  const property = '10 Gbit/s bis 10 km im angegebenen Profil';
  expect(q.answerInputs!.find(cfg => cfg.valueKey === 'reason1')!.valueOptions).toContain(property);
  expect(q.cableChoices!.find(c => c.type.includes('Singlemode'))!.pros).toContain(property);
  expect(q.questionText).toContain('10 Gbit/s bis 10 km (LR)');
  expect(validateQuestionAnswers(q, { cableType: 'Singlemode Glasfaser (OS2)', reason1: property, reason2: 'Immun gegen EMI' })).toBe(true);
});
