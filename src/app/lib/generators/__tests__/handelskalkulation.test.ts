import { afterEach, describe, expect, it, vi } from 'vitest';
import { validateQuestionAnswers } from '../../answerValidation';

import {
  generateDifferenzCalculation,
  generateDifferenzKalkulationQuestion,
  generateHandelskalkulationQuestion,
  generateRueckwaertsCalculation,
  generateVorwaertsCalculation,
  generateVorwaertsKalkulationQuestion,
  generateRueckwaertsKalkulationQuestion,
} from '../handelskalkulation';

function expectMoneyClose(actual: number, expected: number) {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(0.06);
}

// Independent oracle: integer cents/rational percentages, no production helpers.
function centOracle(g: Record<string, number>, backwards = false, gross = g.bruttovk) {
  const c: Record<string, number> = {};
  const money = (value: number) => Math.round(value * 100);
  const ratio = (value: number, numerator: number, denominator: number) =>
    Math.floor((value * numerator + denominator / 2) / denominator);
  c.bezugskosten = money(g.bezugskosten);
  if (!backwards) {
    c.lep = money(g.lepNetto);
    c.rabatt = ratio(c.lep, g.lieferRabatt, 100); c.zep = c.lep - c.rabatt;
    c.skonto = ratio(c.zep, g.lieferskonto, 100); c.bep = c.zep - c.skonto;
    c.bp = c.bep + c.bezugskosten;
    c.handlungskosten = ratio(c.bp, g.handlungsKosten, 100); c.selbstkosten = c.bp + c.handlungskosten;
    c.gewinn = ratio(c.selbstkosten, g.gewinnZuschlag, 100); c.bvp = c.selbstkosten + c.gewinn;
    c.zvp = ratio(c.bvp, 100, 100 - g.kundenSkonto); c.kundenskonto = c.zvp - c.bvp;
    c.nettovk = ratio(c.zvp, 100, 100 - g.kundenRabatt); c.kundenrabatt = c.nettovk - c.zvp;
    c.ust = ratio(c.nettovk, g.ustRate, 100); c.bruttovk = c.nettovk + c.ust;
  } else {
    const total = money(gross);
    c.nettovk = ratio(total, 100, 100 + g.ustRate); c.ust = total - c.nettovk;
    c.kundenrabatt = ratio(c.nettovk, g.kundenRabatt, 100); c.zvp = c.nettovk - c.kundenrabatt;
    c.kundenskonto = ratio(c.zvp, g.kundenSkonto, 100); c.bvp = c.zvp - c.kundenskonto;
    c.selbstkosten = ratio(c.bvp, 100, 100 + g.gewinnZuschlag); c.gewinn = c.bvp - c.selbstkosten;
    c.bp = ratio(c.selbstkosten, 100, 100 + g.handlungsKosten); c.handlungskosten = c.selbstkosten - c.bp;
    c.bep = c.bp - c.bezugskosten;
    c.zep = ratio(c.bep, 100, 100 - g.lieferskonto); c.skonto = c.zep - c.bep;
    c.lep = ratio(c.zep, 100, 100 - g.lieferRabatt); c.rabatt = c.lep - c.zep;
  }
  return Object.fromEntries(Object.entries(c).map(([key, value]) => [key, value / 100]));
}

describe('handelskalkulation generator', () => {
  it('keeps the no-customer-skonto forward variant on the original cent chain and answer set', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const result = generateVorwaertsCalculation('no-customer-skonto');
    expect(result.given.kundenSkonto).toBe(0);
    expect(result.calculated).toEqual(centOracle(result.given));
    expect(result.calculated.kundenskonto).toBe(0);
    expect(result.calculated.zvp).toBe(result.calculated.bvp);
    const question = generateVorwaertsKalkulationQuestion('no-customer-skonto');
    expect(question.module).toBe('handelskalkulationVorwaerts');
    expect(question.questionText).toContain('Variante: Ohne Kundenskonto');
    expect(question.answerInputs).toHaveLength(16);
    expect(Object.keys(question.expectedAnswers)).toHaveLength(16);
    expect(question.expectedAnswers).toMatchObject({ kundenskonto: 0 });
  });

  it('keeps the no-supplier-rebate backward variant on the original cent chain and answer set', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const result = generateRueckwaertsCalculation('no-supplier-rebate');
    expect(result.given.lieferRabatt).toBe(0);
    expect(result.calculated).toEqual(centOracle(result.given, true));
    expect(result.calculated.rabatt).toBe(0);
    expect(result.calculated.lep).toBe(result.calculated.zep);
    const question = generateRueckwaertsKalkulationQuestion('no-supplier-rebate');
    expect(question.module).toBe('handelskalkulationRueckwaerts');
    expect(question.questionText).toContain('Variante: Ohne Lieferantenrabatt');
    expect(question.answerInputs).toHaveLength(15);
    expect(Object.keys(question.expectedAnswers)).toHaveLength(15);
  });

  it('allows an intentional zero gross gap without forcing a different pure mode', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const result = generateDifferenzCalculation('matching-market');
    expect(result.given.bruttovkMarkt).toBe(result.forwardSteps.bruttovk);
    expect(result.calculated.differenz).toBe(0);
    expect(result.forwardSteps).toEqual(centOracle(result.given));
    expect(result.backwardSteps).toEqual(centOracle(result.given, true, result.given.bruttovkMarkt));
    const question = generateDifferenzKalkulationQuestion('matching-market');
    expect(question.module).toBe('handelskalkulationDifferenz');
    expect(question.questionText).toContain('Variante: Marktpreis auf Kalkulationsniveau');
    expect(question.answerInputs).toHaveLength(32);
    expect(Object.keys(question.expectedAnswers)).toHaveLength(32);
    expect(validateQuestionAnswers(question, Object.fromEntries(Object.entries(question.expectedAnswers).map(([k, v]) => [k, String(v)])))).toBe(true);
  });

  it.each([0, 0.12345, 0.25, 0.5, 0.98765, 0.999999])('keeps all special profiles on the independent cent oracle at seed %s', seed => {
    vi.spyOn(Math, 'random').mockReturnValue(seed);
    const forward = generateVorwaertsCalculation('no-customer-skonto');
    const backward = generateRueckwaertsCalculation('no-supplier-rebate');
    const diff = generateDifferenzCalculation('matching-market');
    expect(forward.calculated).toEqual(centOracle(forward.given));
    expect(backward.calculated).toEqual(centOracle(backward.given, true));
    expect(diff.forwardSteps).toEqual(centOracle(diff.given));
    expect(diff.backwardSteps).toEqual(centOracle(diff.given, true, diff.given.bruttovkMarkt));
    expect(diff.calculated.differenz).toBe(0);
    expect(backward.calculated.bep).toBeGreaterThan(0);
  });

  it('retains half-cent rounding when customer skonto is zero', () => {
    vi.spyOn(Math, 'random').mockReturnValueOnce(50.5 / 140001).mockReturnValue(0.5);
    const forward = generateVorwaertsCalculation('no-customer-skonto');
    expect(forward.calculated).toMatchObject({ lep: 100.50, rabatt: 13.07, zep: 87.43, kundenskonto: 0 });
    expect(forward.calculated).toEqual(centOracle(forward.given));
  });

  it.each([0, 0.9])('keeps standard positive and negative differential cases at market seed %s', marketSeed => {
    let calls = 0;
    vi.spyOn(Math, 'random').mockImplementation(() => calls++ < 8 ? 0.5 : marketSeed);
    const question = generateDifferenzKalkulationQuestion('standard');
    expect(Math.sign(Number(question.expectedAnswers.differenz))).toBe(marketSeed === 0 ? -1 : 1);
    const steps = question.solutionSteps.join('\n');
    expect(steps).toContain('Das ist kein tatsächlicher Gewinn.');
    expect(steps).toContain('durch Cent-Rundungen abweichen');
  });

  it.each([0.1, 0.5])('exposes special and standard profiles through each pure factory at selector seed %s', seed => {
    vi.spyOn(Math, 'random').mockReturnValue(seed);
    for (const make of [generateVorwaertsKalkulationQuestion, generateRueckwaertsKalkulationQuestion, generateDifferenzKalkulationQuestion]) {
      const question = make();
      expect(question.questionText.includes('Variante:')).toBe(seed < 0.25);
      expect(validateQuestionAnswers(question, Object.fromEntries(Object.entries(question.expectedAnswers).map(([k,v]) => [k,String(v)])))).toBe(true);
    }
  });

  it('explains the actual 100% bases and shows the unchanged concrete divisors/results together', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const forward = generateVorwaertsKalkulationQuestion('standard');
    expect(forward.solutionSteps.find(step => step.includes('Skonto = 696,00 €'))).toContain('Der ZEP nach Rabatt ist jetzt die 100%-Basis');
    const zvp = forward.solutionSteps.find(step => step.startsWith('Kundenskonto einkalkulieren'))!;
    expect(zvp).toContain('Der BVP entspricht 96% des ZVP');
    expect(zvp).toContain('ZVP = 1200,65 € / 0,96 = 1250,68 €');
    const backward = generateRueckwaertsKalkulationQuestion('standard');
    expect(backward.solutionSteps[0]).toContain('Brutto-VK enthält 119%');
    expect(backward.solutionSteps[0]).toContain('Netto-VK = 1710,70 € / 1,19 = 1437,56 €');
  });

  it.each([
    [() => generateVorwaertsKalkulationQuestion('no-customer-skonto'), 'ZVP ist die 100%-Basis'],
    [() => generateRueckwaertsKalkulationQuestion('no-supplier-rebate'), 'Netto-VK ist die 100%-Basis'],
    [() => generateDifferenzKalkulationQuestion('matching-market'), 'Preisabstand'],
  ] as const)('groups explanation and equation without empty solution steps', (generate, explanation) => {
    const question = generate();
    expect(question.solutionSteps.every(step => step.trim().length > 0)).toBe(true);
    expect(question.solutionSteps.join('\n')).toContain(explanation);
    expect(question.solutionSteps.join('\n')).toContain('100%');
    expect(question.solutionSteps.some(step => /100%/.test(step) && / = /.test(step))).toBe(true);
    expect(question.calculationLearning?.rows).toHaveLength(question.answerInputs!.length);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('recovers the midpoint purchase chain from the displayed gross sale, without a second VAT deduction', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const result = generateRueckwaertsCalculation();
    expect(result.given.bruttovk).toBe(1710.70);
    expect(result.calculated).toEqual({
      ust: 273.14, nettovk: 1437.56, kundenrabatt: 186.88, zvp: 1250.68,
      kundenskonto: 50.03, bvp: 1200.65, gewinn: 174.45, selbstkosten: 1026.20,
      handlungskosten: 308.58, bp: 717.62, bezugskosten: 42.50, bep: 675.12,
      skonto: 20.88, zep: 696, rabatt: 104, lep: 800,
    });
    const question = generateRueckwaertsKalkulationQuestion();
    const requestedKeys = question.answerInputs!.map(input => input.valueKey);
    expect(requestedKeys).not.toContain('bezugskosten');
    const correct = Object.fromEntries(requestedKeys.map(key => [key, String(result.calculated[key])]));
    expect(validateQuestionAnswers(question, correct)).toBe(true);
    expect(validateQuestionAnswers(question, { ...correct, bp: '609.82' })).toBe(false);
  });

  it.each([0, 0.12345, 0.25, 0.5, 0.98765, 0.999999])('uses displayed rounded inputs for every money row at seed %s', seed => {
    vi.spyOn(Math, 'random').mockReturnValue(seed);
    const forward = generateVorwaertsCalculation();
    expect(forward.calculated).toEqual(centOracle(forward.given));
    const backward = generateRueckwaertsCalculation();
    expect(backward.calculated).toEqual(centOracle(backward.given, true));
    const diff = generateDifferenzCalculation();
    expect(diff.forwardSteps).toEqual(centOracle(diff.given));
    expect(diff.backwardSteps).toEqual(centOracle(diff.given, true, diff.given.bruttovkMarkt));
    expect(diff.calculated.differenz).toBeCloseTo(diff.given.bruttovkMarkt - diff.forwardSteps.bruttovk, 2);
  });

  it('rounds a real half-cent supplier rebate up: net LEP 100.50 at 13% gives 13.07', () => {
    vi.spyOn(Math, 'random').mockReturnValueOnce(50.5 / 140001).mockReturnValue(0.5);
    const result = generateVorwaertsCalculation();
    expect(result.given).toMatchObject({ lepNetto: 100.50, lieferRabatt: 13 });
    expect(result.calculated).toMatchObject({ lep: 100.50, rabatt: 13.07, zep: 87.43 });
  });

  it('covers interior supplier skonto 2% and customer skonto 3%', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.25);
    const result = generateVorwaertsCalculation();
    expect(result.given).toMatchObject({ lieferskonto: 2, kundenSkonto: 3 });
    expect(result.calculated.skonto).toBe(8.19);
    expect(result.calculated.kundenskonto).toBe(19.73);
  });

  it.each([0, 0.5])('distinguishes given and market-derived net LEP at market variance seed %s', varianceSeed => {
    vi.spyOn(Math, 'random')
      .mockReturnValueOnce(0.9)
      .mockReturnValueOnce(0.5).mockReturnValueOnce(0.5)
      .mockReturnValueOnce(0.5).mockReturnValueOnce(0.5)
      .mockReturnValueOnce(0.5).mockReturnValueOnce(0.5)
      .mockReturnValueOnce(0.5).mockReturnValueOnce(0.5)
      .mockReturnValue(varianceSeed);
    const question = generateHandelskalkulationQuestion();
    expect(question.questionText).toContain('Listeneinkaufspreis (netto, gegeben): 800,00 €');
    expect(question.answerInputs!.find(input => input.valueKey === 'forward_lep')?.label)
      .toBe('Vorwärts: Listeneinkaufspreis (LEP, netto, gegeben)');
    expect(question.answerInputs!.find(input => input.valueKey === 'backward_lep')?.label)
      .toBe('Rückwärts: = Listeneinkaufspreis (LEP, netto, aus Marktpreis)');
    expect(question.solutionSteps.join('\n')).toContain('LEP netto (aus Marktpreis) =');
    expect(question.solutionSteps.join('\n')).toContain('Der aus dem Marktpreis abgeleitete LEP netto');
    expect(question.solutionSteps.join('\n')).toContain('kann vom gegebenen LEP netto abweichen');
    expect(question.answerInputs).toHaveLength(32);
    expect(Object.keys(question.expectedAnswers)).toHaveLength(32);
    expect(question.expectedAnswers.forward_lep).toBe(800);
    expect(question.expectedAnswers.backward_lep).toBe(varianceSeed === 0 ? 714.97 : 863.77);
  });

  it('grades the supplied net LEP consistently with rebate and ZEP in Differenz', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const result = generateDifferenzCalculation();
    expect(result.given.lepNetto).toBe(800);
    expect(result.forwardSteps).toMatchObject({ lep: 800, rabatt: 104, zep: 696 });
    expect(result.calculated.forward_lep).toBe(800);
  });

  it('states net purchase values and row-by-row cent rounding in all existing question modes', () => {
    for (const [seed, mode] of [[0.1, 'Vorwärtskalkulation'], [0.5, 'Rückwärtskalkulation'], [0.9, 'Differenzkalkulation']] as const) {
      vi.spyOn(Math, 'random').mockReturnValue(seed);
      const q = generateHandelskalkulationQuestion();
      expect(q.solutionSteps.join('\n')).toContain(mode);
      expect(q.questionText).toContain('ohne Umsatzsteuer');
      expect(q.questionText).toContain('jede Rechenzeile');
      expect(q.questionText).toContain('zwei Nachkommastellen');
      expect(q.questionText).not.toContain('Listeneinkaufspreis (brutto)');
      expect(q.solutionSteps.join('\n')).not.toContain('LEP brutto');
      vi.restoreAllMocks();
    }
  });

  it('produces consistent vorwärts calculations', () => {
    for (let i = 0; i < 25; i += 1) {
      const { given, calculated } = generateVorwaertsCalculation();

      expectMoneyClose(calculated.lep - calculated.rabatt, calculated.zep);
      expectMoneyClose(calculated.zep - calculated.skonto, calculated.bep);
      expectMoneyClose(calculated.bep + given.bezugskosten, calculated.bp);
      expectMoneyClose(calculated.bp + calculated.handlungskosten, calculated.selbstkosten);
      expectMoneyClose(calculated.selbstkosten + calculated.gewinn, calculated.bvp);
      expectMoneyClose(calculated.zvp + calculated.kundenrabatt, calculated.nettovk);
      expectMoneyClose(calculated.bvp + calculated.kundenskonto, calculated.zvp);
      expectMoneyClose(calculated.nettovk + calculated.ust, calculated.bruttovk);
    }
  });

  it('produces consistent rückwärts calculations without negative discount amounts', () => {
    for (let i = 0; i < 25; i += 1) {
      const { given, calculated } = generateRueckwaertsCalculation();

      expect(calculated.ust).toBeGreaterThanOrEqual(0);
      expect(calculated.kundenrabatt).toBeGreaterThanOrEqual(0);
      expect(calculated.kundenskonto).toBeGreaterThanOrEqual(0);
      expect(calculated.gewinn).toBeGreaterThanOrEqual(0);
      expect(calculated.handlungskosten).toBeGreaterThanOrEqual(0);
      expect(calculated.skonto).toBeGreaterThanOrEqual(0);
      expect(calculated.rabatt).toBeGreaterThanOrEqual(0);

      expectMoneyClose(calculated.nettovk + calculated.ust, given.bruttovk);
      expectMoneyClose(calculated.zvp + calculated.kundenrabatt, calculated.nettovk);
      expectMoneyClose(calculated.bvp + calculated.kundenskonto, calculated.zvp);
      expectMoneyClose(calculated.selbstkosten + calculated.gewinn, calculated.bvp);
      expectMoneyClose(calculated.bp + calculated.handlungskosten, calculated.selbstkosten);
      expectMoneyClose(calculated.bep + given.bezugskosten, calculated.bp);
      expectMoneyClose(calculated.bep + calculated.skonto, calculated.zep);
      expectMoneyClose(calculated.zep + calculated.rabatt, calculated.lep);
    }
  });

  it('keeps differenz forward and backward keys separate for grading', () => {
    const { calculated, given, forwardSteps, backwardSteps } = generateDifferenzCalculation();

    expect(calculated).toHaveProperty('forward_bvp');
    expect(calculated).toHaveProperty('backward_bvp');
    expect(calculated).not.toHaveProperty('bvp');
    expect(calculated).toHaveProperty('differenz');

    expectMoneyClose(forwardSteps.zvp + forwardSteps.kundenrabatt, forwardSteps.nettovk);
    expectMoneyClose(forwardSteps.bvp + forwardSteps.kundenskonto, forwardSteps.zvp);
    expectMoneyClose(backwardSteps.zvp + backwardSteps.kundenrabatt, backwardSteps.nettovk);
    expectMoneyClose(backwardSteps.bvp + backwardSteps.kundenskonto, backwardSteps.zvp);
    expectMoneyClose(backwardSteps.bep + backwardSteps.skonto, backwardSteps.zep);
    expectMoneyClose(backwardSteps.zep + backwardSteps.rabatt, backwardSteps.lep);
    expectMoneyClose(calculated.differenz as number, given.bruttovkMarkt - forwardSteps.bruttovk);
    expect(calculated.differenz).not.toBe(0);
  });

  it('builds differenz questions with structured prefixed answer inputs', () => {
    const randomSpy = vi.spyOn(Math, 'random');
    randomSpy.mockImplementationOnce(() => 0.9);
    randomSpy.mockImplementation(() => 0.5);

    const question = generateHandelskalkulationQuestion();

    expect(question.module).toBe('handelskalkulation');
    expect(question.answerInputs?.some((input) => input.valueKey === 'forward_bvp')).toBe(true);
    expect(question.answerInputs?.some((input) => input.valueKey === 'backward_bvp')).toBe(true);
    expect(question.answerInputs?.some((input) => input.valueKey === 'differenz')).toBe(true);
  });

  it('renders rueckwaerts solution steps with specific decimal markup and discount factors', () => {
    const randomSpy = vi.spyOn(Math, 'random');
    randomSpy.mockImplementationOnce(() => 0.5);
    randomSpy.mockImplementation(() => 0.5);

    const question = generateHandelskalkulationQuestion();
    const steps = question.solutionSteps.join('\n');

    expect(steps).not.toContain('/ (1 +');
    expect(steps).not.toContain('/ (1 -');
    expect(steps).toMatch(/Selbstkosten = .* \/ 1,\d{2} = .*/);
    expect(steps).toMatch(/ZEP = .* \/ 0,\d{2} = .*/);
    expect(steps).toMatch(/LEP netto = .* \/ 0,\d{2} = .*/);
  });

  it('generateVorwaertsKalkulationQuestion sets correct module and id prefix', () => {
    const question = generateVorwaertsKalkulationQuestion();

    expect(question.module).toBe('handelskalkulationVorwaerts');
    expect(question.id).toMatch(/^handelskalkulationVorwaerts-[a-f0-9-]+$/);
    expect(question.answerInputs).toBeDefined();
    expect(question.answerInputs!.length).toBeGreaterThan(0);
    expect(question.answerInputs!.some((input) => input.valueKey === 'bruttovk')).toBe(true);
    expect(question.solutionSteps.length).toBeGreaterThan(0);
  });

  it('generateRueckwaertsKalkulationQuestion sets correct module and id prefix', () => {
    const question = generateRueckwaertsKalkulationQuestion();

    expect(question.module).toBe('handelskalkulationRueckwaerts');
    expect(question.id).toMatch(/^handelskalkulationRueckwaerts-[a-f0-9-]+$/);
    expect(question.answerInputs).toBeDefined();
    expect(question.answerInputs!.length).toBeGreaterThan(0);
    expect(question.answerInputs!.some((input) => input.valueKey === 'lep')).toBe(true);
    expect(question.solutionSteps.length).toBeGreaterThan(0);
  });

  it('generateVorwaertsKalkulationQuestion never produces rueckwaerts or differenz questions', () => {
    const expectedVorwaertsKeys = [
      'lep',
      'rabatt',
      'zep',
      'skonto',
      'bep',
      'bp',
      'handlungskosten',
      'selbstkosten',
      'gewinn',
      'bvp',
      'kundenskonto',
      'zvp',
      'kundenrabatt',
      'nettovk',
      'ust',
      'bruttovk',
    ];

    for (let i = 0; i < 20; i += 1) {
      const question = generateVorwaertsKalkulationQuestion();
      const valueKeys = question.answerInputs?.map((input) => input.valueKey) ?? [];

      expect(question.module).toBe('handelskalkulationVorwaerts');
      expect(valueKeys).toEqual(expectedVorwaertsKeys);
      expect(valueKeys).not.toContain('differenz');
    }
  });

  it('generateRueckwaertsKalkulationQuestion never produces vorwaerts or differenz questions', () => {
    for (let i = 0; i < 20; i += 1) {
      const question = generateRueckwaertsKalkulationQuestion();
      expect(question.module).toBe('handelskalkulationRueckwaerts');
      expect(question.answerInputs!.some((input) => input.valueKey === 'differenz')).toBe(false);
      // bruttovk is given in rückwärts, lep is the final computed answer
      expect(question.answerInputs!.some((input) => input.valueKey === 'bruttovk')).toBe(false);
      expect(question.answerInputs!.some((input) => input.valueKey === 'lep')).toBe(true);
    }
  });

  it('renders differenz backward solution steps with specific decimal markup and discount factors', () => {
    const randomSpy = vi.spyOn(Math, 'random');
    randomSpy.mockImplementationOnce(() => 0.9);
    randomSpy.mockImplementation(() => 0.5);

    const question = generateHandelskalkulationQuestion();
    const steps = question.solutionSteps.join('\n');

    expect(steps).not.toContain('/ (1 +');
    expect(steps).not.toContain('/ (1 -');
    expect(steps).toMatch(/Selbstkosten = .* \/ 1,\d{2} = .*/);
    expect(steps).toMatch(/ZEP = .* \/ 0,\d{2} = .*/);
    expect(steps).toMatch(/LEP netto \(aus Marktpreis\) = .* \/ 0,\d{2} = .*/);
  });
});
