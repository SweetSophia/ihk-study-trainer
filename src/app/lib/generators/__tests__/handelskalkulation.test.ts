import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  generateDifferenzCalculation,
  generateHandelskalkulationQuestion,
  generateRueckwaertsCalculation,
  generateVorwaertsKalkulationQuestion,
  generateRueckwaertsKalkulationQuestion,
} from '../handelskalkulation';

function expectMoneyClose(actual: number, expected: number) {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(0.06);
}

describe('handelskalkulation generator', () => {
  afterEach(() => {
    vi.restoreAllMocks();
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
      expectMoneyClose(calculated.bep + calculated.bezugskosten, calculated.bp);
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
    expect(question.id).toMatch(/^handelskalkulationVorwaerts-[a-f0-9]+$/);
    expect(question.answerInputs).toBeDefined();
    expect(question.answerInputs!.length).toBeGreaterThan(0);
    expect(question.answerInputs!.some((input) => input.valueKey === 'bruttovk')).toBe(true);
    expect(question.solutionSteps.length).toBeGreaterThan(0);
  });

  it('generateRueckwaertsKalkulationQuestion sets correct module and id prefix', () => {
    const question = generateRueckwaertsKalkulationQuestion();

    expect(question.module).toBe('handelskalkulationRueckwaerts');
    expect(question.id).toMatch(/^handelskalkulationRueckwaerts-[a-f0-9]+$/);
    expect(question.answerInputs).toBeDefined();
    expect(question.answerInputs!.length).toBeGreaterThan(0);
    expect(question.answerInputs!.some((input) => input.valueKey === 'lep')).toBe(true);
    expect(question.solutionSteps.length).toBeGreaterThan(0);
  });

  it('generateVorwaertsKalkulationQuestion never produces rueckwaerts or differenz questions', () => {
    for (let i = 0; i < 20; i += 1) {
      const question = generateVorwaertsKalkulationQuestion();
      expect(question.module).toBe('handelskalkulationVorwaerts');
      expect(question.answerInputs!.some((input) => input.valueKey === 'differenz')).toBe(false);
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
    expect(steps).toMatch(/LEP netto = .* \/ 0,\d{2} = .*/);
  });
});
