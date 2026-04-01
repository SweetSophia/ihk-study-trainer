import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  generateDifferenzCalculation,
  generateHandelskalkulationQuestion,
  generateRueckwaertsCalculation,
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
});
