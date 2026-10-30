import { afterEach, describe, expect, it, vi } from 'vitest';
import { validateQuestionAnswers } from '../../answerValidation';

import {
  generateDifferenzCalculation,
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
      expect(q.solutionSteps[0]).toBe(mode);
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
